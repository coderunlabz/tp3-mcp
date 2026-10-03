import { appendFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

export type ResultadoChamada = 'ok' | 'erro-http' | 'erro-jsonrpc' | 'erro-tool' | 'incompleto';

export type Chamada = {
    horario: string;
    cliente: string;
    versao: string;
    metodo: string;
    alvo: string;
    origem: 'janela' | '-';
    id: string;
    resultado: ResultadoChamada;
    tipoResposta: string;
    ms: number;
};

type Json = Record<string, unknown>;

function ehObjeto(valor: unknown): valor is Json {
    return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function texto(valor: unknown): string {
    return typeof valor === 'string' && valor.trim() ? valor.trim() : '';
}

export function arquivoLogPadrao(): string {
    const definido = process.env.LOG_ARQUIVO?.trim();
    if (definido === 'off') return '';
    if (definido) return definido;
    return path.join(process.env.REGISTRO ?? path.join(process.cwd(), 'registro'), 'chamadas.jsonl');
}

export function clienteDoPedido(mensagem: Json, userAgent: string): { cliente: string; versao: string } {
    const params = ehObjeto(mensagem.params) ? mensagem.params : {};
    const metas = [mensagem._meta, params._meta].filter(ehObjeto);
    let info: Json = ehObjeto(params.clientInfo) ? params.clientInfo : {};
    for (const meta of metas) {
        const noMeta = meta['io.modelcontextprotocol/clientInfo'];
        if (ehObjeto(noMeta)) info = { ...info, ...noMeta };
        else if (ehObjeto(meta.clientInfo)) info = { ...info, ...meta.clientInfo };
    }
    const cliente = texto(info.name) || texto(userAgent) || 'desconhecido';
    const versao = texto(info.version) || '-';
    return { cliente, versao };
}

export function alvoDoPedido(mensagem: Json): string {
    const metodo = texto(mensagem.method);
    const params = ehObjeto(mensagem.params) ? mensagem.params : {};
    if (metodo === 'tools/call' || metodo === 'prompts/get') return texto(params.name) || '-';
    if (metodo === 'resources/read') return texto(params.uri) || '-';
    return '-';
}

export function origemDoPedido(mensagem: Json): 'janela' | '-' {
    const params = ehObjeto(mensagem.params) ? mensagem.params : {};
    const meta = ehObjeto(params._meta) ? params._meta : {};
    return texto(meta['acervo/origem']) === 'janela' ? 'janela' : '-';
}

export function idDoPedido(mensagem: Json): string {
    if (mensagem.id === undefined || mensagem.id === null) return '-';
    return String(mensagem.id);
}

export function mensagensDoCorpo(corpo: string): Json[] {
    if (!corpo.trim()) return [];
    const bruto = JSON.parse(corpo) as unknown;
    if (Array.isArray(bruto)) return bruto.filter(ehObjeto);
    if (ehObjeto(bruto)) return [bruto];
    return [];
}

export function mensagensSse(corpo: string): Json[] {
    const saida: Json[] = [];
    for (const bloco of corpo.split(/\r?\n\r?\n/)) {
        const data = bloco
            .split(/\r?\n/)
            .filter(linha => linha.startsWith('data:'))
            .map(linha => linha.slice(5).trim())
            .join('\n');
        if (!data) continue;
        try {
            const json = JSON.parse(data) as unknown;
            if (ehObjeto(json)) saida.push(json);
        } catch {
            continue;
        }
    }
    return saida;
}

function classificarMensagens(itens: Json[]): ResultadoChamada {
    if (itens.some(item => item.error !== undefined)) return 'erro-jsonrpc';
    if (itens.some(item => ehObjeto(item.result) && item.result.isError === true)) return 'erro-tool';
    if (itens.length === 0) return 'incompleto';
    return 'ok';
}

export function classificarResposta(corpo: string, httpOk: boolean, tipo: string): ResultadoChamada {
    if (!httpOk) return 'erro-http';
    const sse = tipo.includes('event-stream');
    if (sse) return classificarMensagens(mensagensSse(corpo));
    if (!corpo.trim()) return 'incompleto';
    try {
        return classificarMensagens(mensagensDoCorpo(corpo));
    } catch {
        return 'incompleto';
    }
}

export function respostaTemErro(corpo: string, httpOk: boolean, tipo = 'application/json'): boolean {
    const classe = classificarResposta(corpo, httpOk, tipo);
    return classe === 'erro-http' || classe === 'erro-jsonrpc' || classe === 'erro-tool';
}

export function linhaTela(chamada: Chamada): string {
    return `${chamada.horario}  ${chamada.cliente}@${chamada.versao}  ${chamada.metodo} ${chamada.alvo}  origem=${chamada.origem} id=${chamada.id}  ${chamada.resultado}  ${chamada.tipoResposta}  ${chamada.ms}ms`;
}

export async function registrarChamadas(chamadas: Chamada[], arquivo?: string): Promise<void> {
    const destino = arquivo ?? arquivoLogPadrao();
    for (const chamada of chamadas) {
        console.log(linhaTela(chamada));
        if (!destino) continue;
        try {
            await mkdir(path.dirname(destino), { recursive: true });
            await appendFile(destino, `${JSON.stringify(chamada)}\n`, 'utf8');
        } catch (erro) {
            console.error(`falha ao gravar log em ${destino}: ${erro instanceof Error ? erro.message : erro}`);
        }
    }
}
