import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { request as httpRequest } from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';

import { servir } from '../src/servir.ts';
import { carregar, hostnameDoHost, pedidoLocal } from '../src/criarServidor.ts';
import { registrarDuvida, lerDuvidas } from '../src/registro.ts';

const porta = Number(process.env.PORT ?? 3006);
const url = `http://127.0.0.1:${porta}/mcp`;
const raiz = await mkdtemp(path.join(os.tmpdir(), 'acervo-p6-'));
const registro = path.join(raiz, 'registro');
const conteudo = path.join(raiz, 'conteudo');
process.env.REGISTRO = registro;
process.env.LOG_ARQUIVO = path.join(registro, 'chamadas.jsonl');
process.env.HOSTS = 'demo-tunel.trycloudflare.com';

function textoTool(res: { content?: unknown; isError?: boolean }): string {
    const partes = Array.isArray(res.content) ? res.content : [];
    return partes.map(item => (item && typeof item === 'object' && 'text' in item ? String((item as { text: unknown }).text) : '')).join('\n');
}

async function cliente(nome: string) {
    const c = new Client(
        { name: nome, version: '0.2.1' },
        { versionNegotiation: { mode: { pin: '2026-07-28' } } }
    );
    await c.connect(new StreamableHTTPClientTransport(new URL(url)));
    return c;
}

async function rpc(headers: Record<string, string>, method: string, params: Record<string, unknown>, mcpName = '-'): Promise<{ status: number; body: string }> {
    const body = JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method,
        params: {
            ...params,
            _meta: {
                'io.modelcontextprotocol/protocolVersion': '2026-07-28',
                'io.modelcontextprotocol/clientCapabilities': { tools: {} },
                'io.modelcontextprotocol/clientInfo': { name: 'p6-ensaio', version: '0.2.1' }
            }
        }
    });
    return new Promise((resolve, reject) => {
        const req = httpRequest({
            hostname: '127.0.0.1',
            port: porta,
            path: '/mcp',
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'content-length': Buffer.byteLength(body),
                'mcp-protocol-version': '2026-07-28',
                'mcp-method': method,
                'mcp-name': mcpName,
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

await mkdir(path.join(conteudo, 'slides'), { recursive: true });
await mkdir(path.join(conteudo, 'manual'), { recursive: true });
await mkdir(path.join(conteudo, 'referencias'), { recursive: true });
await writeFile(path.join(conteudo, 'slides', '04-primitivos.md'), `---
tema: primitivos
fonte: spec
autor: Nicolas
---
Tools, resources e prompts.
`, 'utf8');
await writeFile(path.join(conteudo, 'slides', 'invalido.md'), 'sem frontmatter\n', 'utf8');

const vazio = await carregar(path.join(raiz, 'ausente'));
if (vazio.arquivos.length !== 0 || vazio.problemas.length === 0) throw new Error('pasta ausente deve ser problema, nao silencio');
const carga = await carregar(conteudo);
if (!carga.problemas.some(item => item.includes('invalido.md'))) throw new Error('arquivo invalido deve aparecer como problema');
if (!carga.arquivos.some(item => item.autor === 'Nicolas')) throw new Error('autor nao listado na carga');
console.log('carga: vazio-com-erro vs arquivo-invalido ok');

if (hostnameDoHost('[::1]:3000') !== '::1') throw new Error('ipv6 host');
if (!pedidoLocal(new Request('http://x/mcp', { headers: { host: '[::1]:3000' } }))) throw new Error('ipv6 local');
console.log('pedidoLocal ipv6 ok');

const iguais = await Promise.all([
    registrarDuvida('mesma duvida ## concorrente'),
    registrarDuvida('mesma duvida ## concorrente')
]);
if (iguais.filter(item => item === 'nova').length !== 1 || iguais.filter(item => item === 'duplicada').length !== 1) {
    throw new Error(`dedup concorrente falhou: ${iguais.join(',')}`);
}
const diferentes = await Promise.all([
    registrarDuvida('primeira\n## titulo\nnome: interno\nação'),
    registrarDuvida('segunda distinta')
]);
if (diferentes.some(item => item !== 'nova')) throw new Error('duvidas diferentes nao podem colidir');
const lidas = await lerDuvidas();
if (!lidas.some(item => item.duvida.includes('nome: interno') && item.duvida.includes('## titulo'))) {
    throw new Error('corpo com markdown nao pode virar estrutura');
}
console.log('registro concorrente e parser ok', lidas.length);

const antigo = process.env.REGISTRO;
process.env.REGISTRO = path.join(raiz, 'nao-e-pasta.txt');
await writeFile(process.env.REGISTRO, 'arquivo', 'utf8');
try {
    await registrarDuvida('nao deve confirmar');
    throw new Error('gravação em arquivo deveria falhar');
} catch (erro) {
    if (erro instanceof Error && erro.message === 'gravação em arquivo deveria falhar') throw erro;
    console.log('falha de escrita sem confirmação falsa ok');
}
process.env.REGISTRO = antigo;

await writeFile(path.join(registro, 'duvidas.md'), `## 2026-10-01T12:00:00.000Z
nome: Bruna
duvida antiga do markdown
`, 'utf8');
const aposMd = await lerDuvidas();
if (!aposMd.some(item => item.duvida === 'duvida antiga do markdown' && item.nome === 'Bruna')) {
    throw new Error('migracao deve incluir duvidas.md');
}
console.log('migracao md no ensaio ok');

const http = servir({ porta, pasta: conteudo, hostsExtras: ['demo-tunel.trycloudflare.com'] });
await sleep(400);

const a = await cliente('p6-local');
const nomes = (await a.listTools()).tools.map(t => t.name).sort();
if (nomes.join(',') !== 'ajudar_ideia_mcp,consultar_acervo,registrar_duvida,ver_duvidas_da_sala') {
    throw new Error(`tools locais: ${nomes.join(',')}`);
}
console.log('local 4 tools', nomes.join(', '));

const consulta = await a.callTool({ name: 'consultar_acervo', arguments: { pergunta: 'o que o slide 04 diz sobre tools' } });
const corpoConsulta = textoTool(consulta);
if (!corpoConsulta.includes('autor: Nicolas') || !corpoConsulta.includes('tema: primitivos')) {
    throw new Error('consultar deve devolver autor/tema/fonte');
}
if (consulta.isError) throw new Error('consulta valida nao e erro');
console.log('consultar_acervo autor+tema ok');

const vago = await a.callTool({ name: 'consultar_acervo', arguments: { pergunta: 'MCP' } });
if (JSON.stringify(vago).includes('inputRequired') && JSON.stringify(vago).includes('inputRequired')) {
    console.log('elicitation apareceu neste cliente (inesperado sem cap)');
}
if (!textoTool(vago).includes('Se quiser um recorte')) throw new Error('sem elicitation deve dicar em texto, uma vez');
const vago2 = await a.callTool({
    name: 'consultar_acervo',
    arguments: { pergunta: 'MCP' }
});
if (JSON.stringify(vago2).includes('"inputRequired"')) throw new Error('nao deve loop de pergunta');
console.log('pergunta complementar: sem cap = dica, sem loop');

const vazia = await a.callTool({ name: 'consultar_acervo', arguments: { pergunta: '   ' } });
if (!vazia.isError) throw new Error('pergunta vazia deve isError');
console.log('erro da tool isError', textoTool(vazia));

const comNome = await a.callTool({
    name: 'registrar_duvida',
    arguments: { duvida: 'nao entendi o _meta', nome: 'Ana' }
});
if (textoTool(comNome) !== 'Dúvida registrada para a sala.') throw new Error('registro com nome');
const anon = await a.callTool({ name: 'registrar_duvida', arguments: { duvida: 'o que e host?' } });
if (textoTool(anon) !== 'Dúvida registrada para a sala.') throw new Error('registro anonimo');
const sala = textoTool(await a.callTool({ name: 'ver_duvidas_da_sala', arguments: {} }));
if (!sala.includes('nao entendi o _meta') || !sala.includes('Ana') || !sala.includes('o que e host?')) {
    throw new Error('ver_duvidas nao leu disco');
}
console.log('registro nome+anonimo ok');

const prompt = await a.getPrompt({ name: 'mostra-o-slide', arguments: { slide: 'quatro' } });
const msg = prompt.messages.map(m => m.content.type === 'text' ? m.content.text : '').join(' ');
if (!msg.includes('04-primitivos.md') || !msg.includes('quatro') || !msg.includes('carregados agora')) {
    throw new Error('prompt deve listar arquivos reais e o pedido do aluno');
}
console.log('mostra-o-slide lista arquivos carregados');

const tools = await a.listTools();
const registrar = tools.tools.find(t => t.name === 'registrar_duvida');
if (!registrar?.description?.includes('manda para o Nicolas')) throw new Error('descricao registrar sem regra de envio');
if (JSON.stringify(tools).includes('ui://') || JSON.stringify(tools).includes('resourceUri')) {
    throw new Error('tools nao devem associar HTML');
}
const recursos = await a.listResources();
const uris = recursos.resources.map(r => r.uri);
if (uris.some(u => u.startsWith('ui://'))) throw new Error(`resource de janela ainda listado: ${uris.join(',')}`);
if (!uris.some(u => u.startsWith('acervo://slides/'))) throw new Error('resources do acervo ausentes');
console.log('sem HTML; acervo listado', uris.slice(0, 4).join(', '));

const pastaIdeias = path.join(registro, 'ideias.jsonl');
await a.callTool({ name: 'ajudar_ideia_mcp', arguments: { ideia: 'um servidor que lista slides da aula' } });
const { access } = await import('node:fs/promises');
let gravouSemPedido = false;
try {
    await access(pastaIdeias);
    gravouSemPedido = true;
} catch { /* ausente = ok */ }
if (gravouSemPedido) throw new Error('ideia sem gravar=true nao deve criar arquivo');
await a.callTool({ name: 'ajudar_ideia_mcp', arguments: { ideia: 'um servidor que lista slides da aula', gravar: true } });
const ideias = await (await import('node:fs/promises')).readFile(pastaIdeias, 'utf8');
if (!ideias.includes('um servidor que lista slides')) throw new Error('pedido de guardar deve escrever ideias.jsonl');
console.log('ideia: sem gravar nao escreve; com gravar escreve');

await a.close();

const listPublico = await rpc({
    host: 'demo-tunel.trycloudflare.com',
    origin: 'https://demo-tunel.trycloudflare.com'
}, 'tools/list', {});
if (listPublico.body.includes('ver_duvidas_da_sala')) throw new Error('tool privada no list publico');
if (!listPublico.body.includes('consultar_acervo') || !listPublico.body.includes('registrar_duvida') || !listPublico.body.includes('ajudar_ideia_mcp')) {
    throw new Error('tools publicas ausentes');
}
if (listPublico.body.includes('ui://') || listPublico.body.includes('resourceUri')) {
    throw new Error('lista publica nao deve associar HTML');
}
console.log('publico 3 tools (Host spoof local)');

const callPrivada = await rpc({
    host: 'demo-tunel.trycloudflare.com',
    origin: 'https://demo-tunel.trycloudflare.com'
}, 'tools/call', { name: 'ver_duvidas_da_sala', arguments: {} }, 'ver_duvidas_da_sala');
if (!callPrivada.body.toLowerCase().includes('not found') && !callPrivada.body.includes('error')) {
    throw new Error(`privada deveria recusar: ${callPrivada.body.slice(0, 300)}`);
}
console.log('publico recusa ver_duvidas', callPrivada.status, callPrivada.body.slice(0, 180));

const spoofLocal = await rpc({
    host: 'localhost',
    origin: 'https://demo-tunel.trycloudflare.com',
    'x-forwarded-for': '203.0.113.9',
    'cf-connecting-ip': '203.0.113.9'
}, 'tools/list', {});
if (spoofLocal.body.includes('ver_duvidas_da_sala')) {
    throw new Error('Host localhost com headers de proxy nao pode listar tool privada');
}
console.log('spoof Host+proxy recusou privada');

const n = 30;
const t0 = Date.now();
const carga30 = await Promise.all(Array.from({ length: n }, async (_, i) => {
    const c = await cliente(`carga-${i}`);
    const r = await c.callTool({ name: 'consultar_acervo', arguments: { pergunta: 'o que o slide 04 diz sobre tools' } });
    await c.close();
    return { i, isError: Boolean(r.isError), temAutor: textoTool(r).includes('autor: Nicolas') };
}));
const ms = Date.now() - t0;
const falhas = carga30.filter(item => item.isError || !item.temAutor);
console.log(`carga local 30 consultar_acervo em ${ms}ms falhas=${falhas.length}`);
if (falhas.length) throw new Error('carga 30 falhou');

http.close();
await sleep(200);

const filho = spawn(process.execPath, ['--experimental-strip-types', 'src/index.ts'], {
    cwd: process.cwd(),
    env: {
        ...process.env,
        PORT: '3007',
        REGISTRO: registro,
        CONTEUDO: conteudo,
        LOG_ARQUIVO: 'off',
        HOSTS: ''
    },
    stdio: ['ignore', 'pipe', 'pipe']
});
await sleep(1000);
const b = new Client({ name: 'reinicio', version: '0.2.1' }, { versionNegotiation: { mode: { pin: '2026-07-28' } } });
await b.connect(new StreamableHTTPClientTransport(new URL('http://127.0.0.1:3007/mcp')));
const depois = textoTool(await b.callTool({ name: 'ver_duvidas_da_sala', arguments: {} }));
await b.close();
filho.kill();
if (!depois.includes('nao entendi o _meta')) throw new Error('reinicio perdeu registro');
console.log('reinicio Node preservou registro');

await rm(raiz, { recursive: true, force: true }).catch(() => undefined);
console.log('p6-ensaio automatico ok');
