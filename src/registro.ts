import { mkdir, readFile, appendFile, access, rename } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';

export type EntradaDuvida = {
    horario: string;
    nome?: string;
    duvida: string;
};

const filas = new Map<string, Promise<unknown>>();

export function pastaRegistro(): string {
    return path.resolve(process.env.REGISTRO ?? path.join(process.cwd(), 'registro'));
}

function arquivoDuvidas(): string {
    return path.join(pastaRegistro(), 'duvidas.jsonl');
}

function arquivoDuvidasMd(): string {
    return path.join(pastaRegistro(), 'duvidas.md');
}

function serial<T>(chave: string, fn: () => Promise<T>): Promise<T> {
    const previa = filas.get(chave) ?? Promise.resolve();
    const atual = previa.then(fn, fn);
    filas.set(chave, atual.then(() => undefined, () => undefined));
    return atual;
}

function chaveEntrada(item: EntradaDuvida): string {
    return `${item.horario}\n${item.duvida}`;
}

export async function lerSeExistir(caminho: string): Promise<string | undefined> {
    try {
        return await readFile(caminho, 'utf8');
    } catch (erro) {
        if (erro && typeof erro === 'object' && 'code' in erro && (erro as { code: string }).code === 'ENOENT') {
            return undefined;
        }
        throw erro;
    }
}

export function parseLinhasDuvida(bruto: string): EntradaDuvida[] {
    const saida: EntradaDuvida[] = [];
    for (const linha of bruto.split(/\n/)) {
        const texto = linha.trim();
        if (!texto) continue;
        try {
            const item = JSON.parse(texto) as unknown;
            if (typeof item !== 'object' || item === null || Array.isArray(item)) continue;
            const rec = item as Record<string, unknown>;
            if (typeof rec.duvida !== 'string' || typeof rec.horario !== 'string') continue;
            saida.push({
                horario: rec.horario,
                duvida: rec.duvida,
                nome: typeof rec.nome === 'string' && rec.nome ? rec.nome : undefined
            });
        } catch {
            continue;
        }
    }
    return saida;
}

export function parseMarkdownAntigo(bruto: string): EntradaDuvida[] {
    const texto = bruto.replace(/\r\n/g, '\n');
    const partes = texto.split(/^## /m).filter(Boolean);
    const saida: EntradaDuvida[] = [];
    for (const parte of partes) {
        const linhas = parte.split('\n');
        const horario = linhas[0]?.trim() ?? '';
        if (!horario || Number.isNaN(Date.parse(horario))) continue;
        let i = 1;
        while (i < linhas.length && linhas[i].trim() === '') i += 1;
        let nome: string | undefined;
        if (linhas[i]?.startsWith('nome:')) {
            nome = linhas[i].slice(5).trim() || undefined;
            i += 1;
        }
        const duvida = linhas.slice(i).join('\n').trim();
        if (!duvida) continue;
        saida.push({ horario, duvida, ...(nome ? { nome } : {}) });
    }
    return saida;
}

async function garantirMigracao(): Promise<void> {
    const md = await lerSeExistir(arquivoDuvidasMd());
    if (md === undefined) return;
    const jsonl = await lerSeExistir(arquivoDuvidas()) ?? '';
    const existentes = new Set(parseLinhasDuvida(jsonl).map(chaveEntrada));
    const novos = parseMarkdownAntigo(md).filter(item => !existentes.has(chaveEntrada(item)));
    if (novos.length === 0) return;
    await mkdir(pastaRegistro(), { recursive: true });
    await appendFile(arquivoDuvidas(), `${novos.map(item => JSON.stringify(item)).join('\n')}\n`, 'utf8');
}

async function lerDuvidasAgora(): Promise<EntradaDuvida[]> {
    await garantirMigracao();
    const bruto = await lerSeExistir(arquivoDuvidas());
    if (bruto === undefined) return [];
    return parseLinhasDuvida(bruto);
}

export async function lerDuvidas(): Promise<EntradaDuvida[]> {
    return serial(arquivoDuvidas(), lerDuvidasAgora);
}

export function formatarDuvidas(entradas: EntradaDuvida[]): string {
    if (entradas.length === 0) return '';
    return entradas.map(item => {
        const quem = item.nome ? `nome: ${item.nome}\n` : '';
        return `${item.horario}\n${quem}${item.duvida}`;
    }).join('\n\n');
}

export async function registrarDuvida(duvida: string, nome?: string): Promise<'nova' | 'duplicada'> {
    const textoDuvida = duvida.trim();
    const quem = nome?.trim() || undefined;
    return serial(arquivoDuvidas(), async () => {
        const agora = Date.now();
        const existentes = await lerDuvidasAgora();
        const ultima = existentes.at(-1);
        if (ultima) {
            const quando = Date.parse(ultima.horario);
            if (!Number.isNaN(quando) && ultima.duvida === textoDuvida && agora - quando < 5000) {
                return 'duplicada';
            }
        }
        await mkdir(pastaRegistro(), { recursive: true });
        const entrada: EntradaDuvida = {
            horario: new Date(agora).toISOString(),
            duvida: textoDuvida,
            ...(quem ? { nome: quem } : {})
        };
        await appendFile(arquivoDuvidas(), `${JSON.stringify(entrada)}\n`, 'utf8');
        return 'nova';
    });
}

export async function gravarIdeia(texto: string): Promise<void> {
    const arquivo = path.join(pastaRegistro(), 'ideias.jsonl');
    await serial(arquivo, async () => {
        await mkdir(pastaRegistro(), { recursive: true });
        await appendFile(arquivo, `${JSON.stringify({ horario: new Date().toISOString(), ideia: texto })}\n`, 'utf8');
    });
}

export async function mdAindaExiste(): Promise<boolean> {
    try {
        await access(arquivoDuvidasMd(), constants.F_OK);
        return true;
    } catch {
        return false;
    }
}

async function existeArquivo(caminho: string): Promise<boolean> {
    try {
        await access(caminho, constants.F_OK);
        return true;
    } catch {
        return false;
    }
}

export type ResultadoArquivoDuvidas =
    | { vazio: true }
    | { vazio: false; destino: string; arquivos: string[] };

async function criarPastaHistoricoUnica(): Promise<string> {
    const raiz = path.join(pastaRegistro(), 'historico');
    await mkdir(raiz, { recursive: true });
    const base = new Date().toISOString().replace(/[:.]/g, '-');
    for (let i = 0; i < 100; i++) {
        const destino = path.join(raiz, i === 0 ? base : `${base}-${i}`);
        try {
            await mkdir(destino);
            return destino;
        } catch (erro) {
            const codigo = erro && typeof erro === 'object' && 'code' in erro ? String((erro as { code: unknown }).code) : '';
            if (codigo !== 'EEXIST') throw erro;
        }
    }
    throw new Error('Não foi possível criar uma pasta única em registro/historico/.');
}

export async function arquivarDuvidasAtivas(): Promise<ResultadoArquivoDuvidas> {
    const jsonl = arquivoDuvidas();
    const md = arquivoDuvidasMd();
    const temJsonl = await existeArquivo(jsonl);
    const temMd = await existeArquivo(md);
    if (!temJsonl && !temMd) return { vazio: true };

    const destino = await criarPastaHistoricoUnica();
    const arquivos: string[] = [];
    try {
        if (temJsonl) {
            await rename(jsonl, path.join(destino, 'duvidas.jsonl'));
            arquivos.push('duvidas.jsonl');
        }
        if (temMd) {
            await rename(md, path.join(destino, 'duvidas.md'));
            arquivos.push('duvidas.md');
        }
    } catch (erro) {
        const detalhe = erro instanceof Error ? erro.message : String(erro);
        throw new Error(
            `Arquivamento incompleto em ${destino} (já saíram: ${arquivos.join(', ') || 'nenhum'}). ` +
            `Os originais que falharam continuam em ${pastaRegistro()}. ${detalhe}`
        );
    }
    return { vazio: false, destino, arquivos };
}
