import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

import {
    acceptedContent,
    CLIENT_CAPABILITIES_META_KEY,
    inputRequired,
    McpServer,
    ResourceTemplate
} from '@modelcontextprotocol/server';
import * as z from 'zod/v4';

import { formatarDuvidas, gravarIdeia, lerDuvidas, registrarDuvida } from './registro.ts';

type Arquivo = {
    pasta: 'slides' | 'manual' | 'referencias';
    nome: string;
    tema: string;
    fonte: string;
    autor: string;
    corpo: string;
};

export type OpcoesServidor = {
    apresentar?: boolean;
    era?: 'legacy' | 'modern';
};

export type CargaAcervo = {
    arquivos: Arquivo[];
    problemas: string[];
};

const PROMPTS = [
    'comece-aqui',
    'explica-como-se-eu-tivesse-5-anos',
    'mostra-o-slide',
    'me-guia-na-instalacao',
    'onde-posso-ler-mais'
];

const texto = (valor: string) => ({ content: [{ type: 'text' as const, text: valor }] });
const erro = (valor: string) => ({ isError: true as const, ...texto(valor) });

function lerCampo(bloco: string, campo: string): string | undefined {
    const linha = bloco.split('\n').find(item => item.startsWith(`${campo}:`));
    return linha?.slice(campo.length + 1).trim();
}

function separar(markdown: string): { meta: string; corpo: string } {
    const textoNormalizado = markdown.replace(/\r\n/g, '\n');
    const fim = textoNormalizado.startsWith('---\n') ? textoNormalizado.indexOf('\n---\n', 4) : -1;
    const meta = fim === -1 ? '' : textoNormalizado.slice(4, fim);
    const corpo = (fim === -1 ? textoNormalizado : textoNormalizado.slice(fim + 5)).trim();
    return { meta, corpo };
}

async function lerPasta(raiz: string, pasta: Arquivo['pasta'], problemas: string[]): Promise<Arquivo[]> {
    const diretorio = path.join(raiz, pasta);
    let nomes: string[] = [];
    try {
        nomes = (await readdir(diretorio)).filter(nome => nome.endsWith('.md')).sort();
    } catch {
        problemas.push(`pasta ${pasta}/ ausente ou ilegível`);
        return [];
    }
    const arquivos: Arquivo[] = [];
    for (const nome of nomes) {
        try {
            const bruto = await readFile(path.join(diretorio, nome), 'utf8');
            const { meta, corpo } = separar(bruto);
            const tema = lerCampo(meta, 'tema');
            const fonte = lerCampo(meta, 'fonte');
            const autor = lerCampo(meta, 'autor');
            if (!tema || !fonte || !autor) {
                problemas.push(`${pasta}/${nome} sem tema, fonte ou autor`);
                continue;
            }
            arquivos.push({ pasta, nome, tema, fonte, autor, corpo });
        } catch (falha) {
            problemas.push(`${pasta}/${nome} ilegível (${falha instanceof Error ? falha.message : falha})`);
        }
    }
    return arquivos;
}

export async function carregar(raiz: string): Promise<CargaAcervo> {
    const problemas: string[] = [];
    const arquivos = [
        ...(await lerPasta(raiz, 'slides', problemas)),
        ...(await lerPasta(raiz, 'manual', problemas)),
        ...(await lerPasta(raiz, 'referencias', problemas))
    ];
    return { arquivos, problemas };
}

export function entradaVaga(valor: string): boolean {
    const partes = valor.trim().split(/\s+/).filter(Boolean);
    return partes.length === 1;
}

export function hostnameDoHost(header: string): string {
    const bruto = header.trim();
    if (!bruto) return '';
    if (bruto.startsWith('[')) {
        const fim = bruto.indexOf(']');
        return fim === -1 ? bruto : bruto.slice(1, fim);
    }
    const ultimo = bruto.lastIndexOf(':');
    if (ultimo > 0 && /^\d+$/.test(bruto.slice(ultimo + 1))) return bruto.slice(0, ultimo);
    return bruto;
}

function origemLocal(origin: string | null): boolean {
    if (!origin) return true;
    try {
        const host = new URL(origin).hostname;
        return host === 'localhost' || host === '127.0.0.1' || host === '::1';
    } catch {
        return false;
    }
}

function marcaProxyPublico(req: Request): boolean {
    return Boolean(
        req.headers.get('cf-connecting-ip')
        || req.headers.get('cf-ray')
        || req.headers.get('cdn-loop')
        || req.headers.get('x-forwarded-for')
        || req.headers.get('x-real-ip')
        || req.headers.get('forwarded')
    );
}

function hostPublico(host: string): boolean {
    return host.endsWith('.trycloudflare.com')
        || host.endsWith('.ngrok-free.app')
        || host.endsWith('.ngrok.io')
        || host.endsWith('.cfargotunnel.com');
}

export function pedidoLocal(req?: Request): boolean {
    if (!req) return true;
    if (marcaProxyPublico(req)) return false;
    const host = hostnameDoHost(req.headers.get('host') ?? '');
    if (!host) return false;
    if (hostPublico(host)) return false;
    const loopback = host === 'localhost' || host === '127.0.0.1' || host === '::1';
    if (!loopback) return false;
    if (!origemLocal(req.headers.get('origin'))) return false;
    return true;
}

function clienteAceitaPergunta(ctx: { mcpReq: { envelope?: Record<string, unknown> } }): boolean {
    const caps = ctx.mcpReq.envelope?.[CLIENT_CAPABILITIES_META_KEY];
    return typeof caps === 'object' && caps !== null && 'elicitation' in caps;
}

function listarArquivos(arquivos: Arquivo[]): string {
    return arquivos
        .map(item => `${item.pasta}/${item.nome}\ntema: ${item.tema}\nfonte: ${item.fonte}\nautor: ${item.autor}\n${item.corpo}`)
        .join('\n\n');
}

function textoCarga(carga: CargaAcervo): { corpo: string; falha: boolean } {
    if (carga.arquivos.length === 0 && carga.problemas.length > 0) {
        return {
            falha: true,
            corpo: `Falha ao carregar o acervo:\n${carga.problemas.join('\n')}`
        };
    }
    if (carga.arquivos.length === 0) {
        return { falha: false, corpo: 'não consta no acervo' };
    }
    const avisos = carga.problemas.length > 0 ? `\n\nAvisos de carga:\n${carga.problemas.join('\n')}` : '';
    return { falha: false, corpo: `${listarArquivos(carga.arquivos)}${avisos}` };
}

function roteiroIdeia(ideia: string, carga: CargaAcervo): string {
    const limites = carga.arquivos.find(item => item.pasta === 'slides' && item.nome.startsWith('06-'))?.corpo
        ?? 'Uma tool pode agir fora do chat. Quem conecta confia no servidor.';
    const slides = carga.arquivos.filter(item => item.pasta === 'slides').map(item => item.nome).join(', ') || '(nenhum slide carregado)';
    return [
        `Ideia (o modelo desenha a partir daqui): ${ideia}`,
        '',
        'Que tools este acervo já tem: consultar_acervo, registrar_duvida, ver_duvidas_da_sala (só no endereço local), ajudar_ideia_mcp.',
        `Slides carregados agora: ${slides}.`,
        `Atalhos: ${PROMPTS.join(', ')}.`,
        'Local: npm start em http://127.0.0.1:3000/mcp. Remoto: npm run tunel (a URL muda; ver url-atual.txt).',
        `Limites do protocolo, do acervo:\n${limites}`,
        'Um risco: quem conecta confia no servidor que publicou as tools.'
    ].join('\n');
}

function perguntar(mensagem: string) {
    return inputRequired({
        inputRequests: {
            detalhe: inputRequired.elicit({
                message: mensagem,
                requestedSchema: {
                    type: 'object',
                    properties: { detalhe: { type: 'string', description: 'Mais contexto, em uma frase.' } },
                    required: ['detalhe']
                }
            })
        }
    });
}

const DESC_REGISTRAR = 'Use só quando o aluno quiser enviar a dúvida ao apresentador (por exemplo "manda para o Nicolas" ou "registre: …"). Dúvida de estudo ("não entendi resources") se explica com consultar_acervo; não registrar. Sem pedido claro de envio, não chamar. Não perguntar sozinho se deve registrar. Se pediu envio mas não está claro qual texto, pergunte só isso. Nome opcional: só se o aluno der ou autorizar; não inventar pela conta. Confirme o envio só depois desta tool gravar.';

const DESC_IDEIA = 'Use quando o aluno tiver uma ideia de servidor MCP. Devolve um roteiro do acervo. Não grave no arquivo a menos que o aluno peça ou concorde em guardar (aí gravar=true). Consulta de leitura não pede confirmação extra.';

export function criarServidor(pastaConteudo: string, opcoes: OpcoesServidor = {}): McpServer {
    const server = new McpServer({ name: 'acervo', version: '0.2.2' });
    const raiz = path.resolve(pastaConteudo);
    const apresentar = opcoes.apresentar ?? true;
    const era = opcoes.era ?? 'modern';

    server.registerTool(
        'consultar_acervo',
        {
            description: 'Use quando o aluno tiver uma dúvida geral sobre a aula. Devolve os arquivos do acervo (pasta, tema, fonte, autor). O modelo explica. Se não houver material: não consta no acervo.',
            inputSchema: z.object({ pergunta: z.string().describe('A dúvida, em texto.') })
        },
        async ({ pergunta }, ctx) => {
            if (!pergunta.trim()) return erro('Escreva a dúvida.');
            const extra = acceptedContent<{ detalhe?: string }>(ctx.mcpReq.inputResponses, 'detalhe');
            const detalhe = extra?.detalhe?.trim() ?? '';
            const jaPerguntou = Boolean(ctx.mcpReq.inputResponses);
            if (!jaPerguntou && entradaVaga(pergunta) && era === 'modern' && clienteAceitaPergunta(ctx)) {
                return perguntar('Essa pergunta está curta. Em uma frase, o que você quer saber desse tema?');
            }
            const junta = [pergunta.trim(), detalhe].filter(Boolean).join(' — ');
            const carga = await carregar(raiz);
            const { corpo, falha } = textoCarga(carga);
            const dica = !jaPerguntou && entradaVaga(pergunta) && !(era === 'modern' && clienteAceitaPergunta(ctx))
                ? '\n\nSe quiser um recorte, diga o slide ou o tema (por exemplo primitivos ou _meta).'
                : '';
            const extraPergunta = junta !== pergunta.trim() ? `\n\n(pergunta detalhada: ${junta})` : '';
            return falha ? erro(`${corpo}${dica}${extraPergunta}`) : texto(`${corpo}${dica}${extraPergunta}`);
        }
    );

    server.registerTool(
        'registrar_duvida',
        {
            description: DESC_REGISTRAR,
            inputSchema: z.object({
                duvida: z.string().describe('A dúvida a enviar à sala, no texto do aluno.'),
                nome: z.string().optional().describe('Nome só se o aluno fornecer ou autorizar.')
            })
        },
        async ({ duvida, nome }) => {
            if (!duvida.trim()) return erro('Escreva a dúvida.');
            try {
                const resultado = await registrarDuvida(duvida, nome);
                if (resultado === 'duplicada') return texto('Dúvida já registrada.');
                const horario = new Date().toISOString();
                const quem = nome?.trim();
                console.log('');
                console.log('========');
                console.log(`DUVIDA ${horario}${quem ? `  nome=${quem}` : ''}`);
                console.log(duvida.trim());
                console.log('========');
                console.log('');
                return texto('Dúvida registrada para a sala.');
            } catch (falha) {
                return erro(`Não foi possível gravar a dúvida: ${falha instanceof Error ? falha.message : falha}`);
            }
        }
    );

    if (apresentar) {
        server.registerTool(
            'ver_duvidas_da_sala',
            {
                description: 'Use só no endereço local, para quem apresenta. Lê as dúvidas gravadas. Não grava.',
                inputSchema: z.object({})
            },
            async () => {
                try {
                    const bruto = formatarDuvidas(await lerDuvidas()).trim();
                    if (!bruto) return texto('A sala ainda não registrou dúvida.');
                    return texto(bruto);
                } catch (falha) {
                    return erro(`Não foi possível ler as dúvidas: ${falha instanceof Error ? falha.message : falha}`);
                }
            }
        );
    }

    server.registerTool(
        'ajudar_ideia_mcp',
        {
            description: DESC_IDEIA,
            inputSchema: z.object({
                ideia: z.string().describe('A ideia, em texto.'),
                gravar: z.boolean().optional().describe('true só se o aluno pedir ou concordar em guardar.')
            })
        },
        async ({ ideia, gravar }, ctx) => {
            if (!ideia.trim()) return erro('Escreva a ideia.');
            const extra = acceptedContent<{ detalhe?: string }>(ctx.mcpReq.inputResponses, 'detalhe');
            const detalhe = extra?.detalhe?.trim() ?? '';
            const jaPerguntou = Boolean(ctx.mcpReq.inputResponses);
            if (!jaPerguntou && entradaVaga(ideia) && era === 'modern' && clienteAceitaPergunta(ctx)) {
                return perguntar('Essa ideia está curta. Em uma frase, o que o servidor faria?');
            }
            const junta = [ideia.trim(), detalhe].filter(Boolean).join(' — ');
            const carga = await carregar(raiz);
            let corpo = roteiroIdeia(junta, carga);
            if (carga.arquivos.length === 0 && carga.problemas.length > 0) {
                corpo += `\n\nFalha ao carregar parte do acervo:\n${carga.problemas.join('\n')}`;
            }
            if (!jaPerguntou && entradaVaga(ideia) && !(era === 'modern' && clienteAceitaPergunta(ctx))) {
                corpo += '\n\nSe quiser um recorte, diga se é local ou remoto e que dado o servidor guarda.';
            }
            if (gravar) {
                try {
                    await gravarIdeia(junta);
                    corpo += '\n\nIdeia guardada em registro/ideias.jsonl.';
                } catch (falha) {
                    return erro(`Não foi possível guardar a ideia: ${falha instanceof Error ? falha.message : falha}`);
                }
            }
            return texto(corpo);
        }
    );

    const registrarFamilia = (pasta: Arquivo['pasta'], descricao: string) => {
        server.registerResource(
            pasta,
            new ResourceTemplate(`acervo://${pasta}/{arquivo}`, {
                list: async () => {
                    const { arquivos } = await carregar(raiz);
                    return {
                        resources: arquivos
                            .filter(arquivo => arquivo.pasta === pasta)
                            .map(arquivo => ({ uri: `acervo://${pasta}/${arquivo.nome}`, name: arquivo.nome }))
                    };
                }
            }),
            { description: descricao, mimeType: 'text/markdown' },
            async (uri, variaveis) => {
                const nome = String(variaveis.arquivo);
                const pedido = path.resolve(raiz, pasta, nome);
                const base = path.resolve(raiz, pasta);
                if (pedido !== base && !pedido.startsWith(base + path.sep)) {
                    throw new Error('Esse arquivo não está no acervo.');
                }
                const { arquivos, problemas } = await carregar(raiz);
                const arquivo = arquivos.find(item => item.pasta === pasta && item.nome === nome);
                if (!arquivo) {
                    const aviso = problemas.find(item => item.includes(`${pasta}/${nome}`));
                    throw new Error(aviso ? `Falha ao carregar: ${aviso}` : 'Esse arquivo não está no acervo.');
                }
                return { contents: [{ uri: uri.href, mimeType: 'text/markdown', text: arquivo.corpo }] };
            }
        );
    };

    registrarFamilia('slides', 'Um slide do acervo.');
    registrarFamilia('manual', 'Um passo do manual.');
    registrarFamilia('referencias', 'Uma referência do acervo.');

    server.registerPrompt(
        'comece-aqui',
        { description: 'O que é a aula e quando usar cada tool e atalho.' },
        async () => {
            const { arquivos, problemas } = await carregar(raiz);
            const slides = arquivos.filter(item => item.pasta === 'slides').map(item => item.nome).join(', ') || '(nenhum)';
            const aviso = problemas.length ? ` Problemas de carga: ${problemas.join('; ')}.` : '';
            return {
                messages: [{
                    role: 'user',
                    content: {
                        type: 'text',
                        text: `Esta aula usa um acervo MCP. O servidor entrega material e guarda o que a sala produz; você explica e discute, em texto. Chame consultar_acervo para ver o que está carregado e explicar. Só chame registrar_duvida quando o aluno quiser enviar a dúvida ao apresentador (manda para o Nicolas, registre isto); uma dúvida de estudo não se registra. Não pergunte sozinho se deve registrar. Nome só se o aluno der. ajudar_ideia_mcp: explique sempre; grave só se o aluno pedir. ver_duvidas_da_sala só no endereço local. Atalhos: ${PROMPTS.join(', ')}. Slides carregados agora: ${slides}.${aviso} Não invente tool nem arquivo que não listou.`
                    }
                }]
            };
        }
    );

    server.registerPrompt(
        'explica-como-se-eu-tivesse-5-anos',
        {
            description: 'O assunto sem jargão, com uma analogia tirada do acervo.',
            argsSchema: z.object({ assunto: z.string().optional() })
        },
        ({ assunto }) => ({
            messages: [{
                role: 'user',
                content: {
                    type: 'text',
                    text: `Explique ${assunto || 'o tema da aula'} como para uma criança de 5 anos, com uma analogia. Chame consultar_acervo. Use o material devolvido. Se não constar, diga que não consta e não complete com conhecimento seu. Se assunto vier vazio, pergunte qual tema.`
                }
            }]
        })
    );

    server.registerPrompt(
        'mostra-o-slide',
        {
            description: 'Apresenta o slide que o aluno pediu, em texto livre.',
            argsSchema: z.object({ slide: z.string().describe('Número, nome ou o que o aluno digitou.') })
        },
        async ({ slide }) => {
            const { arquivos, problemas } = await carregar(raiz);
            const slides = arquivos
                .filter(item => item.pasta === 'slides')
                .map(item => `${item.nome} (tema ${item.tema})`);
            const lista = slides.length ? slides.join(', ') : '(nenhum slide carregado)';
            const aviso = problemas.length ? ` Problemas de carga: ${problemas.join('; ')}.` : '';
            return {
                messages: [{
                    role: 'user',
                    content: {
                        type: 'text',
                        text: `O aluno pediu o slide assim: "${slide}". Os slides realmente carregados agora são: ${lista}.${aviso} Abra o resource acervo://slides/<arquivo> que corresponder a esse pedido. Sinais comuns, só se o arquivo existir na lista: "4", "04", "quatro" e "o das peças" apontam para 04-primitivos.md. Apresente o conteúdo em voz de aula, sem ler o frontmatter. Não invente slide que não está na lista. Se não achar, diga e peça outro jeito de identificar.`
                    }
                }]
            };
        }
    );

    server.registerPrompt(
        'me-guia-na-instalacao',
        {
            description: 'Como pegar este projeto, trocar conteudo/ e rodar.',
            argsSchema: z.object({ passo: z.string().optional().describe('O que o aluno já fez, em texto.') })
        },
        ({ passo }) => ({
            messages: [{
                role: 'user',
                content: {
                    type: 'text',
                    text: `Guie o aluno a usar este mesmo servidor com o material dele. Passos: clonar ou copiar o projeto; trocar a pasta conteudo/ pelos markdown dele (tema, fonte, autor); npm install; npm start em http://127.0.0.1:3000/mcp; no Cursor apontar .cursor/mcp.json. O aluno descreveu o passo atual assim: "${passo || 'ainda não começou'}". Leia os resources em manual/ se precisar. Mostre só o próximo passo e pergunte se deu certo.`
                }
            }]
        })
    );

    server.registerPrompt(
        'onde-posso-ler-mais',
        {
            description: 'Referências do acervo.',
            argsSchema: z.object({ assunto: z.string().optional() })
        },
        async ({ assunto }) => {
            const { arquivos } = await carregar(raiz);
            const refs = arquivos.filter(item => item.pasta === 'referencias').map(item => item.nome).join(', ') || '(nenhuma)';
            return {
                messages: [{
                    role: 'user',
                    content: {
                        type: 'text',
                        text: `Liste só resources em referencias/ sobre ${assunto || 'o acervo'}. Arquivos carregados agora: ${refs}. Para cada uma, uma frase do próprio texto, com arquivo e fonte. Se não houver, não consta. Se assunto vier vazio, liste todas. Não invente referência fora dessa lista.`
                    }
                }]
            };
        }
    );

    return server;
}
