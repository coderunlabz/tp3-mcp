import { createServer } from 'node:http';
import path from 'node:path';

import { hostHeaderValidation, originValidation, toNodeHandler } from '@modelcontextprotocol/node';
import { createMcpHandler } from '@modelcontextprotocol/server';

import { criarServidor, pedidoLocal } from './criarServidor.ts';
import {
    alvoDoPedido,
    arquivoLogPadrao,
    clienteDoPedido,
    idDoPedido,
    mensagensDoCorpo,
    origemDoPedido,
    registrarChamadas
} from './logChamada.ts';
import { chamadaDeObservacao, encaminharEObservar } from './observarResposta.ts';

type Opcoes = {
    pasta?: string;
    porta?: number;
    hostsExtras?: string[];
};

const hostsDinamicos = new Set<string>();

export function autorizarHost(hostname: string): void {
    const limpo = hostname.trim().replace(/^https?:\/\//, '').replace(/\/mcp\/?$/, '');
    if (limpo) hostsDinamicos.add(limpo);
}

export function hostsAutorizados(extrasFixos: string[] = []): string[] {
    const env = (process.env.HOSTS ?? '').split(',').map(item => item.trim()).filter(Boolean);
    return [...new Set(['localhost', '127.0.0.1', '[::1]', ...extrasFixos, ...env, ...hostsDinamicos])];
}

export function servir(opcoes: Opcoes = {}) {
    const pasta = opcoes.pasta ?? process.env.CONTEUDO ?? path.join(process.cwd(), 'conteudo');
    const porta = opcoes.porta ?? Number(process.env.PORT ?? 3000);
    const arquivoLog = arquivoLogPadrao();
    const mcp = createMcpHandler(ctx => criarServidor(pasta, {
        apresentar: pedidoLocal(ctx.requestInfo),
        era: ctx.era
    }), { responseMode: 'json' });
    const nodeHandler = toNodeHandler({
        fetch: async (pedido, extras) => {
            const inicio = Date.now();
            const horario = new Date().toISOString();
            const agente = pedido.headers.get('user-agent') ?? '';
            let mensagens: ReturnType<typeof mensagensDoCorpo> = [];
            if (pedido.method === 'POST') {
                try {
                    mensagens = mensagensDoCorpo(await pedido.clone().text());
                } catch {
                    mensagens = [];
                }
            }
            const resposta = await mcp.fetch(pedido, extras);
            const bases = mensagens
                .filter(mensagem => typeof mensagem.method === 'string')
                .map(mensagem => {
                    const quem = clienteDoPedido(mensagem, agente);
                    return {
                        horario,
                        cliente: quem.cliente,
                        versao: quem.versao,
                        metodo: String(mensagem.method),
                        alvo: alvoDoPedido(mensagem),
                        origem: origemDoPedido(mensagem),
                        id: idDoPedido(mensagem),
                        ms: Date.now() - inicio
                    };
                });
            return encaminharEObservar(resposta, async (corpo, tipo, ok) => {
                if (bases.length === 0) return;
                const chamadas = bases.map(base => chamadaDeObservacao(base, corpo, tipo, ok));
                try {
                    await registrarChamadas(chamadas, arquivoLog);
                } catch (erro) {
                    console.error(`falha no log: ${erro instanceof Error ? erro.message : erro}`);
                }
            });
        }
    });

    return createServer((req, res) => {
        const hosts = hostsAutorizados(opcoes.hostsExtras ?? []);
        const validateHost = hostHeaderValidation(hosts);
        const validateOrigin = originValidation(hosts);
        if (!validateHost(req, res) || !validateOrigin(req, res)) return;
        void nodeHandler(req, res);
    }).listen(porta, '127.0.0.1', () => {
        console.log(`local em http://127.0.0.1:${porta}/mcp`);
        if (arquivoLog) console.log(`log JSON em ${arquivoLog}`);
        else console.log('log só no terminal (LOG_ARQUIVO=off)');
        console.log('Respostas MCP: JSON (responseMode json). SSE só em fluxos de escuta; observação não bloqueia o encaminhamento.');
    });
}
