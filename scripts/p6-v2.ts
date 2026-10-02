import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { request as httpRequest } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const porta = process.env.PORT ?? '3005';
const local = `http://127.0.0.1:${porta}/mcp`;
const tunelHost = 'demo-tunel.trycloudflare.com';

function nomes(tools: { tools: Array<{ name: string }> }): string[] {
    return tools.tools.map(item => item.name).sort();
}

async function cliente(url: string) {
    const c = new Client(
        { name: 'p6-v2', version: '0.2.0' },
        { versionNegotiation: { mode: { pin: '2026-07-28' } } }
    );
    await c.connect(new StreamableHTTPClientTransport(new URL(url)));
    return c;
}

async function rpcTunel(method: string, params: Record<string, unknown>, mcpName = '-'): Promise<string> {
    const body = JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method,
        params: {
            ...params,
            _meta: {
                'io.modelcontextprotocol/protocolVersion': '2026-07-28',
                'io.modelcontextprotocol/clientCapabilities': { tools: {} },
                'io.modelcontextprotocol/clientInfo': { name: 'p6-tunel', version: '0.2.0' }
            }
        }
    });
    return new Promise((resolve, reject) => {
        const req = httpRequest({
            hostname: '127.0.0.1',
            port: Number(porta),
            path: '/mcp',
            method: 'POST',
            headers: {
                host: tunelHost,
                origin: `https://${tunelHost}`,
                'content-type': 'application/json',
                'content-length': Buffer.byteLength(body),
                'mcp-protocol-version': '2026-07-28',
                'mcp-method': method,
                'mcp-name': mcpName
            }
        }, res => {
            const partes: Buffer[] = [];
            res.on('data', c => partes.push(c));
            res.on('end', () => resolve(`${res.statusCode} ${Buffer.concat(partes).toString()}`));
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

const a = await cliente(local);
const localTools = nomes(await a.listTools());
console.log('local tools', localTools.join(', '));

const duvidaNome = await a.callTool({ name: 'registrar_duvida', arguments: { duvida: 'nao entendi o _meta', nome: 'Ana' } });
console.log('registro com nome', JSON.stringify(duvidaNome));
const duvidaSem = await a.callTool({ name: 'registrar_duvida', arguments: { duvida: 'o que e host?' } });
console.log('registro sem nome', JSON.stringify(duvidaSem));
const sala = await a.callTool({ name: 'ver_duvidas_da_sala', arguments: {} });
console.log('sala local', JSON.stringify(sala).slice(0, 400));

for (const slide of ['4', '04', 'quatro', 'o das peças']) {
    const p = await a.getPrompt({ name: 'mostra-o-slide', arguments: { slide } });
    const t = p.messages.map(m => m.content.type === 'text' ? m.content.text : '').join(' ');
    console.log('prompt slide', slide, t.includes(slide) ? 'inclui o texto do aluno' : 'FALHOU');
}
await a.close();

const bList = await rpcTunel('tools/list', {});
console.log('tunel tools/list', bList.slice(0, 800));
const bCall = await rpcTunel('tools/call', { name: 'ver_duvidas_da_sala', arguments: {} }, 'ver_duvidas_da_sala');
console.log('tunel ver_duvidas', bCall.slice(0, 800));

const arquivo = await readFile(path.join(process.cwd(), 'registro', 'duvidas.md'), 'utf8');
console.log('arquivo duvidas.md\n', arquivo);

const vago = await (await cliente(local)).callTool({ name: 'consultar_acervo', arguments: { pergunta: 'MCP' } });
console.log('consultar vago', JSON.stringify(vago).slice(0, 300));
const direto = await (await cliente(local)).callTool({ name: 'consultar_acervo', arguments: { pergunta: 'o que o slide 04 diz sobre tools e prompts' } });
console.log('consultar contexto', JSON.stringify(direto).slice(0, 200));
