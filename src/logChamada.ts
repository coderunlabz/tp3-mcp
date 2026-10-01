import { appendFile } from 'node:fs/promises';

export type Chamada = {
    horario: string;
    cliente: string;
    versao: string;
    metodo: string;
    alvo: string;
    resultado: 'ok' | 'erro';
    ms: number;
};

type Json = Record<string, unknown>;

function ehObjeto(valor: unknown): valor is Json {
    return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function texto(valor: unknown): string {
    return typeof valor === 'string' && valor.trim() ? valor.trim() : '';
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

export function mensagensDoCorpo(corpo: string): Json[] {
    if (!corpo.trim()) return [];
    const bruto = JSON.parse(corpo) as unknown;
    if (Array.isArray(bruto)) return bruto.filter(ehObjeto);
    if (ehObjeto(bruto)) return [bruto];
    return [];
}

export function respostaTemErro(corpo: string, httpOk: boolean): boolean {
    if (!httpOk) return true;
    if (!corpo.trim()) return false;
    try {
        const bruto = JSON.parse(corpo) as unknown;
        const itens = Array.isArray(bruto) ? bruto : [bruto];
        return itens.some(item => ehObjeto(item) && item.error !== undefined);
    } catch {
        return false;
    }
}

export function linhaTela(chamada: Chamada): string {
    return `${chamada.horario}  ${chamada.cliente}@${chamada.versao}  ${chamada.metodo} ${chamada.alvo}  ${chamada.resultado}  ${chamada.ms}ms`;
}

export async function registrarChamadas(chamadas: Chamada[], arquivo?: string): Promise<void> {
    for (const chamada of chamadas) {
        console.log(linhaTela(chamada));
        if (arquivo) await appendFile(arquivo, `${JSON.stringify(chamada)}\n`, 'utf8');
    }
}
