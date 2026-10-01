import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

import { McpServer, ResourceTemplate } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';

type Arquivo = {
    pasta: 'slides' | 'manual' | 'referencias';
    nome: string;
    tema: string;
    fonte: string;
    autor: string;
    corpo: string;
    palavras: string[];
    checagem?: { pergunta: string; respostas: string[] };
};

type Duvida = { texto: string; horario: string };

type ChecagemGuardada = { pergunta: string; respostas: string[]; arquivo: string };

const duvidas: Duvida[] = [];
const checagens = new Map<string, ChecagemGuardada>();

const PROMPTS = [
    'comece-aqui',
    'explica-como-se-eu-tivesse-5-anos',
    'mostra-o-slide',
    'me-guia-na-instalacao',
    'prepara-minha-prova',
    'onde-posso-ler-mais'
];

const texto = (valor: string) => ({ content: [{ type: 'text' as const, text: valor }] });

const erro = (valor: string) => ({ isError: true as const, ...texto(valor) });

function normalizar(valor: string): string {
    return valor
        .normalize('NFD')
        .replace(/\p{M}+/gu, '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ');
}

function lerCampo(bloco: string, campo: string): string | undefined {
    const linha = bloco.split('\n').find(item => item.startsWith(`${campo}:`));
    return linha?.slice(campo.length + 1).trim();
}

function lerCampos(bloco: string, campo: string): string[] {
    return bloco
        .split('\n')
        .filter(item => item.startsWith(`${campo}:`))
        .map(item => item.slice(campo.length + 1).trim())
        .filter(Boolean);
}

export function respostaCerta(resposta: string, gabaritos: string[]): boolean {
    const dada = normalizar(resposta);
    const dados = termosDaPergunta(resposta);
    const temNegacao = /\bnao\b|\bnunca\b/.test(dada);
    return gabaritos.some(gabarito => {
        const esperada = normalizar(gabarito);
        if (!esperada) return false;
        const gabaritoTemNegacao = /\bnao\b|\bnunca\b/.test(esperada);
        if (temNegacao && !gabaritoTemNegacao) return false;
        const termos = esperada.split(' ').filter(termo => termo.length >= 1 && !palavrasVazias.has(termo));
        if (termos.length <= 1) {
            return dados.length === termos.length && termos.every(termo => dados.includes(termo));
        }
        if (dada === esperada || dada.includes(esperada)) return true;
        return termos.every(termo => dada.includes(termo));
    });
}

export function temaDaDuvida(arquivos: Pick<Arquivo, 'tema' | 'corpo' | 'palavras'>[], texto: string): string {
    const termos = termosDaPergunta(texto);
    let melhor = { tema: 'geral', acertos: 0 };
    for (const arquivo of arquivos) {
        const visivel = normalizar(`${arquivo.tema}\n${arquivo.palavras.join(' ')}\n${arquivo.corpo}`);
        const acertos = termos.filter(termo => visivel.includes(termo)).length;
        if (acertos > melhor.acertos) melhor = { tema: arquivo.tema, acertos };
    }
    return melhor.acertos > 0 ? melhor.tema : 'geral';
}

function separar(markdown: string): { meta: string; corpo: string; checagem?: { pergunta: string; respostas: string[] } } {
    const textoNormalizado = markdown.replace(/\r\n/g, '\n');
    const fim = textoNormalizado.startsWith('---\n') ? textoNormalizado.indexOf('\n---\n', 4) : -1;
    const meta = fim === -1 ? '' : textoNormalizado.slice(4, fim);
    let corpo = fim === -1 ? textoNormalizado : textoNormalizado.slice(fim + 5);
    const inicio = corpo.indexOf(':::checagem');
    const fechamento = corpo.indexOf(':::', inicio + 3);
    if (inicio === -1 || fechamento === -1) return { meta, corpo: corpo.trim() };
    const bloco = corpo.slice(inicio + ':::checagem'.length, fechamento);
    corpo = `${corpo.slice(0, inicio)}${corpo.slice(fechamento + 3)}`.trim();
    const pergunta = lerCampo(bloco, 'pergunta');
    const respostas = lerCampos(bloco, 'resposta');
    return { meta, corpo, checagem: pergunta && respostas.length > 0 ? { pergunta, respostas } : undefined };
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
        const { meta, corpo, checagem } = separar(bruto);
        const tema = lerCampo(meta, 'tema');
        const fonte = lerCampo(meta, 'fonte');
        const autor = lerCampo(meta, 'autor');
        if (!tema || !fonte || !autor) continue;
        const palavras = (lerCampo(meta, 'palavras') ?? '').split(',').map(item => item.trim()).filter(Boolean);
        arquivos.push({ pasta, nome, tema, fonte, autor, corpo, palavras, checagem });
    }
    return arquivos;
}

async function carregar(raiz: string): Promise<{ arquivos: Arquivo[]; sobre?: { titulo: string; versao: string; autor: string; fonte: string } }> {
    const arquivos = [
        ...(await lerPasta(raiz, 'slides')),
        ...(await lerPasta(raiz, 'manual')),
        ...(await lerPasta(raiz, 'referencias'))
    ];
    let sobre: { titulo: string; versao: string; autor: string; fonte: string } | undefined;
    try {
        const { meta } = separar(await readFile(path.join(raiz, 'sobre.md'), 'utf8'));
        const titulo = lerCampo(meta, 'titulo');
        const versao = lerCampo(meta, 'versao');
        const autor = lerCampo(meta, 'autor');
        const fonte = lerCampo(meta, 'fonte');
        if (titulo && versao && autor && fonte) sobre = { titulo, versao, autor, fonte };
    } catch {
        sobre = undefined;
    }
    return { arquivos, sobre };
}

const palavrasVazias = new Set(['o', 'a', 'os', 'as', 'de', 'do', 'da', 'dos', 'das', 'que', 'em', 'no', 'na', 'nos', 'nas', 'um', 'uma', 'sobre', 'diz', 'acervo', 'para', 'por', 'com', 'como', 'qual', 'quais']);

function termosDaPergunta(pergunta: string): string[] {
    const termos = normalizar(pergunta).split(' ').map(termo => termo.replace(/[^\p{L}\p{N}]+/gu, '')).filter(termo => termo.length >= 2 && !palavrasVazias.has(termo));
    return termos.length > 0 ? termos : [normalizar(pergunta)];
}

function acharTrechos(arquivos: Arquivo[], pergunta: string) {
    const termos = termosDaPergunta(pergunta);
    return arquivos
        .map(arquivo => {
            const visivel = normalizar(`${arquivo.tema}\n${arquivo.corpo}`);
            const acertos = termos.filter(termo => visivel.includes(termo)).length;
            return { arquivo, acertos };
        })
        .filter(item => item.acertos > 0)
        .sort((a, b) => b.acertos - a.acertos)
        .map(item => ({
            arquivo: `${item.arquivo.pasta}/${item.arquivo.nome}`,
            tema: item.arquivo.tema,
            fonte: item.arquivo.fonte,
            autor: item.arquivo.autor,
            trecho: item.arquivo.corpo
        }));
}

export function criarServidor(pastaConteudo: string): McpServer {
    const server = new McpServer({ name: 'acervo', version: '0.1.0' });
    const raiz = path.resolve(pastaConteudo);

    server.registerTool(
        'consultar_acervo',
        {
            description: 'Use para responder o que o material diz. Devolve trecho, arquivo e fonte, ou diz que não consta. Não completa com conhecimento de fora.',
            inputSchema: z.object({ pergunta: z.string().describe('Uma frase.') })
        },
        async ({ pergunta }) => {
            if (!pergunta.trim()) return erro('Informe a pergunta em uma frase.');
            const { arquivos } = await carregar(raiz);
            if (arquivos.length === 0) return erro('Aponte o servidor para uma pasta conteudo/ com markdown (tema, fonte, autor).');
            const trechos = acharTrechos(arquivos, pergunta);
            if (trechos.length === 0) {
                const temas = [...new Set(arquivos.map(arquivo => arquivo.tema))].join(', ');
                return texto(`não consta no acervo\nTemas: ${temas}`);
            }
            return texto(trechos.map(item => `${item.arquivo} | ${item.tema} | ${item.fonte} | ${item.autor}\n${item.trecho}`).join('\n\n'));
        }
    );

    server.registerTool(
        'registrar_duvida',
        {
            description: 'Use quando a pessoa quiser mandar uma dúvida anônima para a sala. Única tool que grava.',
            inputSchema: z.object({ texto: z.string().describe('A dúvida, sem nome.') })
        },
        async ({ texto: duvida }) => {
            if (!duvida.trim()) return erro('Escreva a dúvida em uma frase, sem nome.');
            const agora = Date.now();
            const ultima = duvidas.at(-1);
            if (ultima && ultima.texto === duvida.trim() && agora - Date.parse(ultima.horario) < 5000) {
                return texto('Dúvida já registrada.');
            }
            duvidas.push({ texto: duvida.trim(), horario: new Date(agora).toISOString() });
            return texto('Dúvida registrada sem identificação.');
        }
    );

    server.registerTool(
        'ver_duvidas_da_sala',
        {
            description: 'Use só quando quem fala disser que está apresentando. Devolve as dúvidas da sala agrupadas por assunto. Não grava.',
            inputSchema: z.object({})
        },
        async () => {
            if (duvidas.length === 0) return texto('A sala ainda não registrou dúvida.');
            const { arquivos } = await carregar(raiz);
            const grupos = new Map<string, Duvida[]>();
            for (const duvida of duvidas) {
                const tema = temaDaDuvida(arquivos, duvida.texto);
                grupos.set(tema, [...(grupos.get(tema) ?? []), duvida]);
            }
            const saida = [...grupos.entries()].map(([tema, itens]) => `${tema}\n${itens.map(item => `- ${item.horario} ${item.texto}`).join('\n')}`).join('\n\n');
            return texto(saida);
        }
    );

    server.registerTool(
        'checar_entendimento',
        {
            description: 'Use para perguntar e conferir estudo. Na primeira chamada devolve só a pergunta. Na segunda, diga se a resposta fecha com o acervo. O gabarito não volta para o modelo.',
            inputSchema: z.object({
                id: z.string().optional().describe('Identificador devolvido na primeira chamada.'),
                resposta: z.string().optional().describe('O que a pessoa respondeu.')
            })
        },
        async ({ id, resposta }) => {
            if (resposta !== undefined && !id) return erro('Chame de novo sem resposta para receber uma pergunta.');
            if (id && resposta !== undefined) {
                const guardada = checagens.get(id);
                if (!guardada) return erro('Essa checagem expirou. Peça outra pergunta.');
                const certo = respostaCerta(resposta, guardada.respostas);
                return texto(certo ? 'certo' : `errado\nReleia ${guardada.arquivo}`);
            }
            const { arquivos } = await carregar(raiz);
            const usadas = new Set([...checagens.values()].map(item => item.pergunta));
            const comPergunta = arquivos.filter(arquivo => arquivo.checagem);
            const candidata = comPergunta.find(arquivo => !usadas.has(arquivo.checagem?.pergunta)) ?? comPergunta[0];
            if (!candidata?.checagem) return erro('O acervo não tem pergunta de checagem.');
            const novoId = randomUUID();
            checagens.set(novoId, { pergunta: candidata.checagem.pergunta, respostas: candidata.checagem.respostas, arquivo: `${candidata.pasta}/${candidata.nome}` });
            return texto(`${novoId}\n${candidata.checagem.pergunta}`);
        }
    );

    server.registerTool(
        'sobre_este_acervo',
        {
            description: 'Use para dizer título, autor, versão e a lista do que está carregado, inclusive os atalhos. Não grava.',
            inputSchema: z.object({})
        },
        async () => {
            const { arquivos, sobre } = await carregar(raiz);
            if (!sobre) return erro('Falta conteudo/sobre.md com titulo e versao.');
            const lista = arquivos.map(arquivo => `${arquivo.pasta}/${arquivo.nome} | ${arquivo.tema}`).join('\n');
            return texto(`${sobre.titulo}\n${sobre.versao}\n${sobre.autor}\n${sobre.fonte}\n${lista}\n${PROMPTS.join(', ')}`);
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
                const { arquivos } = await carregar(raiz);
                const arquivo = arquivos.find(item => item.pasta === pasta && item.nome === nome);
                if (!arquivo) throw new Error('Esse arquivo não está no acervo.');
                return { contents: [{ uri: uri.href, mimeType: 'text/markdown', text: arquivo.corpo }] };
            }
        );
    };

    registrarFamilia('slides', 'Um slide do acervo.');
    registrarFamilia('manual', 'Um passo do manual.');
    registrarFamilia('referencias', 'Uma referência do acervo.');

    server.registerPrompt(
        'comece-aqui',
        { description: 'Ponto de entrada; explica o que há no acervo e lista os outros atalhos.' },
        () => ({
            messages: [{
                role: 'user',
                content: {
                    type: 'text',
                    text: 'Use as tools deste servidor e nada de fora dele. Chame sobre_este_acervo e conte, em linguagem leiga, o que este acervo é, de quem é e o que está carregado. Depois liste os atalhos: explica-como-se-eu-tivesse-5-anos, mostra-o-slide, me-guia-na-instalacao, prepara-minha-prova, onde-posso-ler-mais. Diga que dúvida da plateia entra por registrar_duvida e que ver_duvidas_da_sala é só de quem está apresentando.'
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
                    text: `Explique ${assunto || ''} como para uma criança de 5 anos, com uma analogia. Chame consultar_acervo com esse assunto. Use só o trecho devolvido. Se a tool disser que não consta, repita isso e não complete com conhecimento seu. Se assunto vier vazio, pergunte qual tema do acervo a pessoa quer.`
                }
            }]
        })
    );

    server.registerPrompt(
        'mostra-o-slide',
        {
            description: 'Conta o slide N em voz de apresentação.',
            argsSchema: z.object({ numero: z.number() })
        },
        ({ numero }) => ({
            messages: [{
                role: 'user',
                content: {
                    type: 'text',
                    text: `Abra o resource do slide ${numero} e apresente o conteúdo em voz alta, como quem fala para a turma, sem ler o frontmatter. Se o resource não existir, diga o erro da tool e pergunte outro número.`
                }
            }]
        })
    );

    server.registerPrompt(
        'me-guia-na-instalacao',
        {
            description: 'Um passo do manual por vez.',
            argsSchema: z.object({ passo: z.number().optional() })
        },
        ({ passo }) => ({
            messages: [{
                role: 'user',
                content: {
                    type: 'text',
                    text: `Leia o resource do manual no passo ${passo ?? 1}. Mostre só esse passo, com arquivo e fonte. Termine perguntando se deu certo. Não antecipe o passo seguinte.`
                }
            }]
        })
    );

    server.registerPrompt(
        'prepara-minha-prova',
        {
            description: 'Estudo a partir do acervo, com checagem sem gabarito.',
            argsSchema: z.object({ foco: z.string().optional() })
        },
        ({ foco }) => ({
            messages: [{
                role: 'user',
                content: {
                    type: 'text',
                    text: `Monte um estudo curto sobre ${foco || 'o acervo inteiro'}. Use consultar_acervo para os pontos. Depois chame checar_entendimento sem resposta, faça a pergunta à pessoa e só então chame de novo com a resposta dela. Nunca mostre o gabarito. Se não constar, diga que não consta.`
                }
            }]
        })
    );

    server.registerPrompt(
        'onde-posso-ler-mais',
        {
            description: 'Referências do acervo e o motivo de cada uma.',
            argsSchema: z.object({ assunto: z.string().optional() })
        },
        ({ assunto }) => ({
            messages: [{
                role: 'user',
                content: {
                    type: 'text',
                    text: `Liste referências do acervo sobre ${assunto || ''}. Leia só resources em referencias/. Para cada uma, diga o motivo em uma frase usando o próprio texto, com arquivo e fonte. Se não houver, diga que não consta. Se assunto vier vazio, liste todas.`
                }
            }]
        })
    );

    return server;
}
