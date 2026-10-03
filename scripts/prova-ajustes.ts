import { mkdir, writeFile, readFile, access } from 'node:fs/promises';
import { request as httpRequest } from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { mkdtemp } from 'node:fs/promises';

import { entradaVaga, hostnameDoHost, pedidoLocal } from '../src/criarServidor.ts';
import {
    alvoDoPedido,
    classificarResposta,
    clienteDoPedido,
    origemDoPedido,
    respostaTemErro
} from '../src/logChamada.ts';
import { encaminharEObservar } from '../src/observarResposta.ts';
import { arquivarDuvidasAtivas, lerDuvidas, mdAindaExiste, parseLinhasDuvida, parseMarkdownAntigo, registrarDuvida } from '../src/registro.ts';
import { autorizarHost, servir } from '../src/servir.ts';

function ok(condicao: boolean, nome: string): void {
    if (!condicao) throw new Error(nome);
    console.log('ok', nome);
}

ok(entradaVaga('MCP'), 'uma palavra e vaga');
ok(!entradaVaga('o que o slide 04 diz sobre tools'), 'com contexto nao e vaga');

ok(hostnameDoHost('[::1]:3000') === '::1', 'host ipv6 com porta');
ok(hostnameDoHost('127.0.0.1:3000') === '127.0.0.1', 'host ipv4 com porta');
ok(hostnameDoHost('localhost') === 'localhost', 'host sem porta');

const ipv6 = new Request('http://127.0.0.1/mcp', { headers: { host: '[::1]:3000' } });
ok(pedidoLocal(ipv6), '[::1]:3000 e local');

const proxy = new Request('http://127.0.0.1/mcp', { headers: { host: 'localhost', 'cf-connecting-ip': '203.0.113.9' } });
ok(!pedidoLocal(proxy), 'cf-connecting-ip nao e local');

const tunel = new Request('http://127.0.0.1/mcp', { headers: { host: 'demo.trycloudflare.com' } });
ok(!pedidoLocal(tunel), 'trycloudflare nao e local');

const spoof = new Request('http://127.0.0.1/mcp', {
    headers: { host: 'localhost', origin: 'https://demo.trycloudflare.com', 'x-forwarded-for': '203.0.113.9' }
});
ok(!pedidoLocal(spoof), 'host localhost com proxy nao e local');

ok(respostaTemErro(JSON.stringify({ error: { code: -32600 } }), true), 'erro jsonrpc');
ok(respostaTemErro(JSON.stringify({ result: { isError: true, content: [] } }), true), 'erro da tool isError');
ok(!respostaTemErro(JSON.stringify({ result: { content: [] } }), true), 'sucesso tool');
ok(classificarResposta('', true, 'application/json') === 'incompleto', 'json vazio incompleto');
ok(classificarResposta('', false, 'application/json') === 'erro-http', 'http erro');
ok(classificarResposta('data: {"jsonrpc":"2.0","id":1,"result":{"isError":true}}\n\n', true, 'text/event-stream') === 'erro-tool', 'sse isError');
ok(classificarResposta('', true, 'text/event-stream') === 'incompleto', 'sse vazio incompleto');

const msg = {
    jsonrpc: '2.0',
    id: 7,
    method: 'tools/call',
    params: {
        name: 'consultar_acervo',
        arguments: { pergunta: 'nao deve aparecer no log' },
        _meta: {
            'io.modelcontextprotocol/clientInfo': { name: 'demo-claude', version: '0.1.0' },
            'acervo/origem': 'janela'
        }
    }
};
ok(clienteDoPedido(msg, 'UA').cliente === 'demo-claude', 'cliente do _meta');
ok(alvoDoPedido(msg) === 'consultar_acervo', 'alvo');
ok(origemDoPedido(msg) === 'janela', 'origem janela opcional pelo _meta');
ok(origemDoPedido({ method: 'tools/call', params: { name: 'registrar_duvida' } }) === '-', 'openai/callTool sem _meta nao e origem=janela');

const entradas = parseLinhasDuvida([
    '{"horario":"2026-10-02T00:00:00.000Z","duvida":"linha1\\n## titulo\\nnome: falso\\nação"}',
    'nao-json',
    '{"horario":"x"}'
].join('\n'));
ok(entradas.length === 1 && entradas[0].duvida.includes('## titulo') && entradas[0].duvida.includes('nome: falso'), 'parser jsonl ignora markdown interno');

const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
const writer = writable.getWriter();
const encoder = new TextEncoder();
let observado = '';
const origemSse = new Response(readable, { headers: { 'content-type': 'text/event-stream' } });
const t0 = Date.now();
const saidaSse = encaminharEObservar(origemSse, async corpo => {
    observado = corpo;
});
ok(Date.now() - t0 < 80, 'tee SSE devolve a Response sem esperar o fim do stream');
await writer.write(encoder.encode('data: {"jsonrpc":"2.0","id":1,"result":{}}\n\n'));
const leitor = saidaSse.body!.getReader();
const primeiro = await leitor.read();
ok(!primeiro.done && primeiro.value && primeiro.value.length > 0, 'cliente recebe chunk SSE antes do close');
await writer.close();
await sleep(30);
ok(observado.includes('"result"'), 'observacao SSE no fundo apos o encaminhamento');
console.log('ok SSE nao bloqueia entrega');

const pastaReg = await mkdtemp(path.join(os.tmpdir(), 'acervo-md-'));
process.env.REGISTRO = pastaReg;
const md = `## 2026-10-02T21:33:31.358Z
nome: Ana
nao entendi o _meta

## 2026-10-02T21:33:31.376Z
o que e host?
`;
await writeFile(path.join(pastaReg, 'duvidas.md'), md, 'utf8');
const migradas = await lerDuvidas();
ok(migradas.length === 2 && migradas[0].nome === 'Ana' && migradas[1].duvida === 'o que e host?', 'migracao md -> jsonl');
ok(await mdAindaExiste(), 'arquivo md original permanece');
const jsonl = await readFile(path.join(pastaReg, 'duvidas.jsonl'), 'utf8');
const deNovo = await lerDuvidas();
ok(deNovo.length === 2, 'migracao idempotente nao duplica');
ok(parseMarkdownAntigo(md).length === 2, 'parser md antigo');
ok(jsonl.split('\n').filter(Boolean).length === 2, 'jsonl tem duas linhas apos migrar duas vezes');

await mkdir(path.join(pastaReg, 'duvidas.jsonl-dir'));
process.env.REGISTRO = path.join(pastaReg, 'duvidas.jsonl-dir');
try {
    await mkdir(path.join(process.env.REGISTRO, 'duvidas.jsonl'));
    await lerDuvidas();
    throw new Error('leitura de diretorio deveria falhar');
} catch (erro) {
    ok(erro instanceof Error && erro.message !== 'leitura de diretorio deveria falhar', 'erro de leitura nao vira lista vazia');
}
process.env.REGISTRO = pastaReg;

const portaHost = 3008;
delete process.env.HOSTS;
const http = servir({ porta: portaHost, pasta: path.join(process.cwd(), 'conteudo') });
await sleep(300);

function rpcHost(host: string): Promise<number> {
    const body = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'ping', params: {} });
    return new Promise((resolve, reject) => {
        const req = httpRequest({
            hostname: '127.0.0.1',
            port: portaHost,
            path: '/mcp',
            method: 'POST',
            headers: {
                host,
                origin: `https://${host}`,
                'content-type': 'application/json',
                'content-length': Buffer.byteLength(body)
            }
        }, res => {
            res.resume();
            res.on('end', () => resolve(res.statusCode ?? 0));
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

const publico = 'partida-limpa.trycloudflare.com';
const antes = await rpcHost(publico);
ok(antes === 403, `partida limpa sem HOSTS recusa hostname publico (HTTP ${antes})`);
autorizarHost(publico);
const depois = await rpcHost(publico);
ok(depois !== 403, `depois de autorizarHost, hostname passa da guarda (HTTP ${depois})`);
http.close();
console.log('ok autorizar host antes da checagem MCP');

const tunelTs = await readFile(new URL('./tunel.ts', import.meta.url), 'utf8');
const iAuth = tunelTs.indexOf('autorizarHost(hostname)');
const iMcp = tunelTs.indexOf('await mcpLeveComEspera(hostname)');
const iUrl = tunelTs.indexOf('gravarUrl(hostname)');
ok(iAuth !== -1 && iAuth < iMcp && iMcp < iUrl, 'tunel: autoriza, verifica MCP, publica URL');

{
    const registroAnterior = process.env.REGISTRO;
    const raizArq = await mkdtemp(path.join(os.tmpdir(), 'acervo-arq-'));

    process.env.REGISTRO = path.join(raizArq, 'ambos');
    await mkdir(process.env.REGISTRO, { recursive: true });
    await writeFile(path.join(process.env.REGISTRO, 'duvidas.jsonl'), '{"horario":"2026-10-01T00:00:00.000Z","duvida":"jsonl"}\n', 'utf8');
    await writeFile(path.join(process.env.REGISTRO, 'duvidas.md'), '## 2026-10-01T00:00:00.000Z\n\nmarkdown\n', 'utf8');
    await writeFile(path.join(process.env.REGISTRO, 'ideias.jsonl'), '{"ideia":"fica"}\n', 'utf8');
    await writeFile(path.join(process.env.REGISTRO, 'chamadas.jsonl'), '{"ok":true}\n', 'utf8');
    const ambos = await arquivarDuvidasAtivas();
    if (ambos.vazio) throw new Error('ambos: deveria arquivar');
    const jsonlArq = await readFile(path.join(ambos.destino, 'duvidas.jsonl'), 'utf8');
    const mdArq = await readFile(path.join(ambos.destino, 'duvidas.md'), 'utf8');
    ok(jsonlArq.includes('jsonl') && mdArq.includes('markdown'), 'arquiva jsonl e markdown com conteudo');
    let ativoJsonl = false;
    let ativoMd = false;
    try { await access(path.join(process.env.REGISTRO, 'duvidas.jsonl')); ativoJsonl = true; } catch { /* ok */ }
    try { await access(path.join(process.env.REGISTRO, 'duvidas.md')); ativoMd = true; } catch { /* ok */ }
    ok(!ativoJsonl && !ativoMd, 'ativos saem da pasta de registro');
    ok((await readFile(path.join(process.env.REGISTRO, 'ideias.jsonl'), 'utf8')).includes('fica'), 'nao mexe ideias');
    ok((await readFile(path.join(process.env.REGISTRO, 'chamadas.jsonl'), 'utf8')).includes('ok'), 'nao mexe logs');

    process.env.REGISTRO = path.join(raizArq, 'so-md');
    await mkdir(process.env.REGISTRO, { recursive: true });
    await writeFile(path.join(process.env.REGISTRO, 'duvidas.md'), '## 2026-10-01T00:00:00.000Z\n\nso md\n', 'utf8');
    const soMd = await arquivarDuvidasAtivas();
    if (soMd.vazio) throw new Error('so-md');
    ok(soMd.arquivos.join(',') === 'duvidas.md', 'arquiva so markdown');

    process.env.REGISTRO = path.join(raizArq, 'vazio');
    await mkdir(process.env.REGISTRO, { recursive: true });
    const vazio = await arquivarDuvidasAtivas();
    ok(vazio.vazio === true, 'sem arquivos informa vazio');

    process.env.REGISTRO = path.join(raizArq, 'duas');
    await mkdir(process.env.REGISTRO, { recursive: true });
    await writeFile(path.join(process.env.REGISTRO, 'duvidas.jsonl'), '{"horario":"2026-10-01T00:00:00.000Z","duvida":"a"}\n', 'utf8');
    const primeira = await arquivarDuvidasAtivas();
    const segunda = await arquivarDuvidasAtivas();
    if (primeira.vazio) throw new Error('primeira execucao');
    ok(segunda.vazio === true, 'segunda execucao seguida nao acha ativo');
    ok(Boolean(primeira.destino), 'primeira aponta pasta de historico');

    process.env.REGISTRO = path.join(raizArq, 'ciclo');
    await mkdir(process.env.REGISTRO, { recursive: true });
    await writeFile(path.join(process.env.REGISTRO, 'duvidas.jsonl'), '{"horario":"2026-10-01T00:00:00.000Z","duvida":"antiga"}\n', 'utf8');
    await writeFile(path.join(process.env.REGISTRO, 'duvidas.md'), '## 2026-10-01T00:00:00.000Z\n\nantiga md\n', 'utf8');
    const ciclo = await arquivarDuvidasAtivas();
    if (ciclo.vazio) throw new Error('ciclo');
    const leituraVazia = await lerDuvidas();
    ok(leituraVazia.length === 0, 'leitura vazia apos arquivar');
    const gravou = await registrarDuvida('nova apos arquivo');
    ok(gravou === 'nova', 'grava de novo na lista ativa');
    const depois = await lerDuvidas();
    ok(depois.length === 1 && depois[0]?.duvida === 'nova apos arquivo', 'nao recupera historico na migracao');

    process.env.REGISTRO = path.join(raizArq, 'falha');
    await mkdir(process.env.REGISTRO, { recursive: true });
    const original = '{"horario":"2026-10-01T00:00:00.000Z","duvida":"nao perder"}\n';
    await writeFile(path.join(process.env.REGISTRO, 'duvidas.jsonl'), original, 'utf8');
    await writeFile(path.join(process.env.REGISTRO, 'historico'), 'isso nao e pasta', 'utf8');
    let falhou = false;
    try {
        await arquivarDuvidasAtivas();
    } catch {
        falhou = true;
    }
    ok(falhou, 'falha de movimentacao nao confirma sucesso');
    ok((await readFile(path.join(process.env.REGISTRO, 'duvidas.jsonl'), 'utf8')) === original, 'falha nao perde o ativo');

    process.env.REGISTRO = registroAnterior;
}

console.log('prova-ajustes ok');
