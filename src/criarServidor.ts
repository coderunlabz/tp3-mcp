import { mkdir, readFile, appendFile, readdir } from 'node:fs/promises';
import path from 'node:path';

import {
    acceptedContent,
    CLIENT_CAPABILITIES_META_KEY,
    inputRequired,
    McpServer,
    ResourceTemplate
} from '@modelcontextprotocol/server';
import * as z from 'zod/v4';

import { htmlConsultar, htmlDuvida, MIME_APP } from './janelas.ts';

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

async function lerPasta(raiz: string, pasta: Arquivo['pasta']): Promise<Arquivo[]> {
    const diretorio = path.join(raiz, pasta);
    let nomes: string[] = [];
    try {
        nomes = (await readdir(diretorio)).filter(nome => nome.endsWith('.md')).sort();
    } catch {
        return [];
    }
    const arquivos: Arquivo[] = [];
    for (const nome of nomes) {
        const bruto = await readFile(path.join(diretorio, nome), 'utf8');
        const { meta, corpo } = separar(bruto);
        const tema = lerCampo(meta, 'tema');
        const fonte = lerCampo(meta, 'fonte');
        const autor = lerCampo(meta, 'autor');
        if (!tema || !fonte || !autor) continue;
        arquivos.push({ pasta, nome, tema, fonte, autor, corpo });
    }
    return arquivos;
}

async function carregar(raiz: string): Promise<Arquivo[]> {
    return [
        ...(await lerPasta(raiz, 'slides')),
        ...(await lerPasta(raiz, 'manual')),
        ...(await lerPasta(raiz, 'referencias'))
    ];
}

export function entradaVaga(valor: string): boolean {
    const partes = valor.trim().split(/\s+/).filter(Boolean);
    return partes.length === 1;
}

export function pedidoLocal(req?: Request): boolean {
    if (!req) return true;
    const host = (req.headers.get('host') ?? '').split(':')[0];
    return host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
}

function clienteAceitaPergunta(ctx: { mcpReq: { envelope?: Record<string, unknown> } }): boolean {
    const caps = ctx.mcpReq.envelope?.[CLIENT_CAPABILITIES_META_KEY];
    return typeof caps === 'object' && caps !== null && 'elicitation' in caps;
}

function pastaRegistro(): string {
    return path.resolve(process.cwd(), 'registro');
}

async function gravarMarkdown(arquivo: string, bloco: string): Promise<void> {
    const pasta = pastaRegistro();
    await mkdir(pasta, { recursive: true });
    await appendFile(path.join(pasta, arquivo), bloco, 'utf8');
}

async function lerRegistro(arquivo: string): Promise<string> {
    try {
        return await readFile(path.join(pastaRegistro(), arquivo), 'utf8');
    } catch {
        return '';
    }
}

function ultimaDuvida(bruto: string): { texto: string; horario: number } | undefined {
    const partes = bruto.split(/^## /m).filter(Boolean);
    const ultimo = partes.at(-1);
    if (!ultimo) return undefined;
    const [cabeca, ...resto] = ultimo.split('\n');
    const horario = Date.parse(cabeca.trim());
    const linhas = resto.map(l => l.trim()).filter(Boolean);
    const corpo = linhas.filter(l => !l.startsWith('nome:')).join('\n').trim();
    if (!corpo || Number.isNaN(horario)) return undefined;
    return { texto: corpo, horario };
}

function listarArquivos(arquivos: Arquivo[]): string {
    if (arquivos.length === 0) return 'não consta no acervo';
    return arquivos
        .map(item => `${item.pasta}/${item.nome}\ntema: ${item.tema}\nfonte: ${item.fonte}\n${item.corpo}`)
        .join('\n\n');
}

function roteiroIdeia(ideia: string, arquivos: Arquivo[]): string {
    const limites = arquivos.find(item => item.pasta === 'slides' && item.nome.startsWith('06-'))?.corpo
        ?? 'Uma tool pode agir fora do chat. Quem conecta confia no servidor.';
    return [
        `Ideia (o modelo desenha a partir daqui): ${ideia}`,
        '',
        'Que tools este acervo já tem: consultar_acervo, registrar_duvida, ver_duvidas_da_sala (só no endereço local), ajudar_ideia_mcp.',
        'Resources: slides/, manual/, referencias/.',
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

export function criarServidor(pastaConteudo: string, opcoes: OpcoesServidor = {}): McpServer {
    const server = new McpServer({ name: 'acervo', version: '0.2.0' });
    const raiz = path.resolve(pastaConteudo);
    const apresentar = opcoes.apresentar ?? true;
    const era = opcoes.era ?? 'modern';

    const metaUi = (uri: string) => ({ ui: { resourceUri: uri }, 'ui/resourceUri': uri });

    server.registerTool(
        'consultar_acervo',
        {
            description: 'Use quando o aluno tiver uma dúvida geral sobre a aula. Devolve os arquivos do acervo (pasta, tema, fonte). O modelo explica. Se não houver material: não consta no acervo.',
            inputSchema: z.object({ pergunta: z.string().describe('A dúvida, em texto.') }),
            _meta: metaUi('ui://acervo/consultar.html')
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
            const arquivos = await carregar(raiz);
            const corpo = arquivos.length === 0
                ? 'não consta no acervo'
                : listarArquivos(arquivos);
            const dica = !jaPerguntou && entradaVaga(pergunta) && !(era === 'modern' && clienteAceitaPergunta(ctx))
                ? '\n\nSe quiser um recorte, diga o slide ou o tema (por exemplo primitivos ou _meta).'
                : '';
            return texto(`${corpo}${dica}${junta !== pergunta.trim() ? `\n\n(pergunta detalhada: ${junta})` : ''}`);
        }
    );

    server.registerTool(
        'registrar_duvida',
        {
            description: 'Usa quando o aluno quiser mandar uma dúvida para a sala. Campo duvida obrigatório; nome opcional. Sem IP.',
            inputSchema: z.object({
                duvida: z.string().describe('A dúvida.'),
                nome: z.string().optional().describe('Nome, se a pessoa quiser.')
            }),
            _meta: metaUi('ui://acervo/duvida.html')
        },
        async ({ duvida, nome }) => {
            if (!duvida.trim()) return erro('Escreva a dúvida.');
            const agora = Date.now();
            const horario = new Date(agora).toISOString();
            const textoDuvida = duvida.trim();
            const bruto = await lerRegistro('duvidas.md');
            const ultima = ultimaDuvida(bruto);
            if (ultima && ultima.texto === textoDuvida && agora - ultima.horario < 5000) {
                return texto('Dúvida já registrada.');
            }
            const quem = nome?.trim();
            const bloco = `\n## ${horario}\n${quem ? `nome: ${quem}\n` : ''}${textoDuvida}\n`;
            await gravarMarkdown('duvidas.md', bloco);
            console.log('');
            console.log('========');
            console.log(`DUVIDA ${horario}${quem ? `  nome=${quem}` : ''}`);
            console.log(textoDuvida);
            console.log('========');
            console.log('');
            return texto('Dúvida registrada para a sala.');
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
                const bruto = (await lerRegistro('duvidas.md')).trim();
                if (!bruto) return texto('A sala ainda não registrou dúvida.');
                return texto(bruto);
            }
        );
    }

    server.registerTool(
        'ajudar_ideia_mcp',
        {
            description: 'Use quando o aluno tiver uma ideia de servidor MCP. Devolve um roteiro do acervo. Grava a ideia só se gravar=true.',
            inputSchema: z.object({
                ideia: z.string().describe('A ideia, em texto.'),
                gravar: z.boolean().optional().describe('true só se o aluno concordar em guardar.')
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
            const arquivos = await carregar(raiz);
            let corpo = roteiroIdeia(junta, arquivos);
            if (!jaPerguntou && entradaVaga(ideia) && !(era === 'modern' && clienteAceitaPergunta(ctx))) {
                corpo += '\n\nSe quiser um recorte, diga se é local ou remoto e que dado o servidor guarda.';
            }
            if (gravar) {
                await gravarMarkdown('ideias.md', `\n## ${new Date().toISOString()}\n${junta}\n`);
                corpo += '\n\nIdeia guardada em registro/ideias.md.';
            }
            return texto(corpo);
        }
    );

    const registrarFamilia = (pasta: Arquivo['pasta'], descricao: string) => {
        server.registerResource(
            pasta,
            new ResourceTemplate(`acervo://${pasta}/{arquivo}`, {
                list: async () => {
                    const arquivos = await carregar(raiz);
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
                const arquivos = await carregar(raiz);
                const arquivo = arquivos.find(item => item.pasta === pasta && item.nome === nome);
                if (!arquivo) throw new Error('Esse arquivo não está no acervo.');
                return { contents: [{ uri: uri.href, mimeType: 'text/markdown', text: arquivo.corpo }] };
            }
        );
    };

    registrarFamilia('slides', 'Um slide do acervo.');
    registrarFamilia('manual', 'Um passo do manual.');
    registrarFamilia('referencias', 'Uma referência do acervo.');

    server.registerResource(
        'janela-consultar',
        'ui://acervo/consultar.html',
        { description: 'Janela simples de consulta (experimento).', mimeType: MIME_APP },
        async uri => ({ contents: [{ uri: uri.href, mimeType: MIME_APP, text: htmlConsultar }] })
    );
    server.registerResource(
        'janela-duvida',
        'ui://acervo/duvida.html',
        { description: 'Janela simples de dúvida (experimento).', mimeType: MIME_APP },
        async uri => ({ contents: [{ uri: uri.href, mimeType: MIME_APP, text: htmlDuvida }] })
    );

    server.registerPrompt(
        'comece-aqui',
        { description: 'O que é a aula e quando usar cada tool e atalho.' },
        () => ({
            messages: [{
                role: 'user',
                content: {
                    type: 'text',
                    text: `Esta aula usa um acervo MCP. O servidor entrega material e guarda o que a sala produz; você explica e discute. Chame consultar_acervo para ver o que está carregado. Tools: consultar_acervo (dúvida geral; o modelo explica o material), registrar_duvida (duvida obrigatória, nome opcional; vai para a sala), ver_duvidas_da_sala (só no endereço local, para quem apresenta), ajudar_ideia_mcp (ideia de servidor; grave só se o aluno concordar). Atalhos: comece-aqui, explica-como-se-eu-tivesse-5-anos (versão engraçada), mostra-o-slide (o aluno diz o slide em texto), me-guia-na-instalacao (pegar este projeto, trocar conteudo/, rodar), onde-posso-ler-mais (só referencias/). Não invente tool que não listou.`
                }
            }]
        })
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
        ({ slide }) => ({
            messages: [{
                role: 'user',
                content: {
                    type: 'text',
                    text: `O aluno pediu o slide assim: "${slide}". Abra o resource em slides/ que corresponda (01-problema, 02-ideia, 03-arquitetura, 04-primitivos, 05-evolucao, 06-limites). "4", "04", "quatro" e "o das peças" apontam para 04-primitivos. Apresente o conteúdo em voz de aula, sem ler o frontmatter. Se não achar, diga e peça outro jeito de identificar o slide.`
                }
            }]
        })
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
        ({ assunto }) => ({
            messages: [{
                role: 'user',
                content: {
                    type: 'text',
                    text: `Liste só resources em referencias/ sobre ${assunto || 'o acervo'}. Para cada uma, uma frase do próprio texto, com arquivo e fonte. Se não houver, não consta. Se assunto vier vazio, liste todas.`
                }
            }]
        })
    );

    return server;
}
