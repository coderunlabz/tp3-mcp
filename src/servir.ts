import { createServer } from 'node:http';
import path from 'node:path';

import { hostHeaderValidation, originValidation, toNodeHandler } from '@modelcontextprotocol/node';
import { createMcpHandler } from '@modelcontextprotocol/server';

import { criarServidor } from './criarServidor.ts';

type Opcoes = {
    pasta?: string;
    porta?: number;
    hostsExtras?: string[];
};

export function servir(opcoes: Opcoes = {}): void {
    const pasta = opcoes.pasta ?? process.env.CONTEUDO ?? path.join(process.cwd(), 'conteudo');
    const porta = opcoes.porta ?? Number(process.env.PORT ?? 3000);
    const handler = createMcpHandler(() => criarServidor(pasta));
    const nodeHandler = toNodeHandler(handler);

    createServer((req, res) => {
        const extras = [
            ...(opcoes.hostsExtras ?? []),
            ...(process.env.HOSTS ?? '').split(',').map(item => item.trim()).filter(Boolean)
        ];
        const hosts = ['localhost', '127.0.0.1', '[::1]', ...extras];
        const validateHost = hostHeaderValidation(hosts);
        const validateOrigin = originValidation(hosts);
        const inicio = Date.now();
        res.on('finish', () => {
            const ip = req.headers['cf-connecting-ip'] ?? req.socket.remoteAddress ?? '-';
            const agente = req.headers['user-agent'] ?? '-';
            console.log(`${new Date().toISOString()} ${req.method} ${req.url} ${res.statusCode} ${Date.now() - inicio}ms ip=${ip} ua=${agente}`);
        });
        if (!validateHost(req, res) || !validateOrigin(req, res)) return;
        void nodeHandler(req, res);
    }).listen(porta, '127.0.0.1', () => {
        console.log(`local em http://127.0.0.1:${porta}/mcp`);
    });
}
