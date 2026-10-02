import { createServer } from 'node:http';
import path from 'node:path';

import { hostHeaderValidation, originValidation, toNodeHandler } from '@modelcontextprotocol/node';
import { createMcpHandler } from '@modelcontextprotocol/server';

import { criarServidor, pedidoLocal } from './criarServidor.ts';
import { alvoDoPedido, clienteDoPedido, mensagensDoCorpo, registrarChamadas, respostaTemErro } from './logChamada.ts';

type Opcoes = {
    pasta?: string;
    porta?: number;
    hostsExtras?: string[];
};

export function servir(opcoes: Opcoes = {}): void {
    const pasta = opcoes.pasta ?? process.env.CONTEUDO ?? path.join(process.cwd(), 'conteudo');
    const porta = opcoes.porta ?? Number(process.env.PORT ?? 3000);
    const arquivoLog = process.env.LOG_ARQUIVO?.trim();
    const mcp = createMcpHandler(ctx => criarServidor(pasta, {
        apresentar: pedidoLocal(ctx.requestInfo),
        era: ctx.era
    }));
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
            const tipo = resposta.headers.get('content-type') ?? '';
            let corpoResposta = '';
            if (tipo.includes('json') && !tipo.includes('event-stream')) {
                try {
                    corpoResposta = await resposta.clone().text();
                } catch {
                    corpoResposta = '';
                }
            }
            const resultado = respostaTemErro(corpoResposta, resposta.ok) ? 'erro' : 'ok';
            const ms = Date.now() - inicio;
            const chamadas = mensagens.length > 0
                ? mensagens
                    .filter(mensagem => typeof mensagem.method === 'string')
                    .map(mensagem => {
                        const quem = clienteDoPedido(mensagem, agente);
                        return {
                            horario,
                            cliente: quem.cliente,
                            versao: quem.versao,
                            metodo: String(mensagem.method),
                            alvo: alvoDoPedido(mensagem),
                            resultado,
                            ms
                        };
                    })
                : [];
            if (chamadas.length > 0) void registrarChamadas(chamadas, arquivoLog);
            return resposta;
        }
    });

    createServer((req, res) => {
        const extras = [
            ...(opcoes.hostsExtras ?? []),
            ...(process.env.HOSTS ?? '').split(',').map(item => item.trim()).filter(Boolean)
        ];
        const hosts = ['localhost', '127.0.0.1', '[::1]', ...extras];
        const validateHost = hostHeaderValidation(hosts);
        const validateOrigin = originValidation(hosts);
        if (!validateHost(req, res) || !validateOrigin(req, res)) return;
        void nodeHandler(req, res);
    }).listen(porta, '127.0.0.1', () => {
        console.log(`local em http://127.0.0.1:${porta}/mcp`);
        if (arquivoLog) console.log(`log JSON em ${arquivoLog}`);
    });
}
