import { request as httpsRequest } from 'node:https';
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { readFile } from 'node:fs/promises';

const bruto = (await readFile(new URL('../url-atual.txt', import.meta.url), 'utf8')).trim();
const url = bruto.endsWith('/mcp') ? bruto : `${bruto}/mcp`;
const host = new URL(url).hostname;
console.log('tunel', url);

function rpc(headers: Record<string, string>, method: string, params: Record<string, unknown>, mcpName = '-'): Promise<{ status: number; body: string }> {
    const body = JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method,
        params: {
            ...params,
            _meta: {
                'io.modelcontextprotocol/protocolVersion': '2026-07-28',
                'io.modelcontextprotocol/clientCapabilities': { tools: {} },
                'io.modelcontextprotocol/clientInfo': { name: 'p6-tunel-vivo', version: '0.2.1' }
            }
        }
    });
    return new Promise((resolve, reject) => {
        const req = httpsRequest({
            hostname: host,
            path: '/mcp',
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'content-length': Buffer.byteLength(body),
                'mcp-protocol-version': '2026-07-28',
                'mcp-method': method,
                'mcp-name': mcpName,
                host,
                origin: `https://${host}`,
                ...headers
            }
        }, res => {
            const partes: Buffer[] = [];
            res.on('data', c => partes.push(c));
            res.on('end', () => resolve({ status: res.statusCode ?? 0, body: Buffer.concat(partes).toString() }));
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

const list = await rpc({}, 'tools/list', {});
console.log('list status', list.status);
console.log('list body', list.body.slice(0, 1200));
const privada = list.body.includes('ver_duvidas_da_sala');
console.log('privada no list publico', privada);

const call = await rpc({}, 'tools/call', { name: 'ver_duvidas_da_sala', arguments: {} }, 'ver_duvidas_da_sala');
console.log('call privada', call.status, call.body.slice(0, 400));

const spoof = await rpc({
    'x-forwarded-host': 'localhost',
    origin: 'http://localhost',
    'x-forwarded-for': '203.0.113.9'
}, 'tools/list', {});
console.log('spoof x-forwarded-host localhost', spoof.status);
console.log('privada com forwarded-host', spoof.body.includes('ver_duvidas_da_sala'));
console.log('nota: Host: localhost no TLS do Quick Tunnel quebra o certificado (ERR_TLS_CERT_ALTNAME_INVALID); o Host efetivo continua o hostname trycloudflare.');

const n = 30;
const t0 = Date.now();
const saidas = await Promise.all(Array.from({ length: n }, async (_, i) => {
    const c = new Client({ name: `tunel-${i}`, version: '0.2.1' }, { versionNegotiation: { mode: { pin: '2026-07-28' } } });
    await c.connect(new StreamableHTTPClientTransport(new URL(url)));
    const r = await c.callTool({ name: 'consultar_acervo', arguments: { pergunta: 'o que o slide 04 diz sobre tools' } });
    await c.close();
    const texto = Array.isArray(r.content) ? r.content.map(p => 'text' in p ? p.text : '').join('') : '';
    return { i, isError: Boolean(r.isError), temTema: texto.includes('tema:') || texto.includes('primitivos') };
}));
console.log(`30 consultar_acervo tunel em ${Date.now() - t0}ms falhas=${saidas.filter(s => s.isError || !s.temTema).length}`);
console.log('amostra', saidas[0]);
