import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { autorizarHost, servir } from '../src/servir.ts';

const porta = Number(process.env.PORT ?? 3000);
const maxTentativas = Number(process.env.TUNEL_TENTATIVAS ?? 8);
const pausaMs = Number(process.env.TUNEL_PAUSA_MS ?? 8000);
const arquivoUrl = path.join(process.cwd(), 'url-atual.txt');
const executavel = [
    'C:\\Program Files (x86)\\cloudflared\\cloudflared.exe',
    'C:\\Program Files\\cloudflared\\cloudflared.exe'
].find(caminho => existsSync(caminho)) ?? 'cloudflared';

console.error('Dúvidas ficam em registro/ (gitignore). Reiniciar o Node não apaga o arquivo.');
console.error('Quick Tunnel: URL muda se o cloudflared for recriado; sem SLA; SSE pelo túnel rápido não é suportado pela Cloudflare.');

servir({ porta });

let atual: ChildProcess | undefined;
let hostnameAtual: string | undefined;
let tentativas = 0;
let jaTentou = false;
let encerrando = false;
let cicloAndando = false;
let geracao = 0;
let urlPublicada = false;

function destaque(linha: string): void {
    console.log('');
    console.log('========');
    console.log(linha);
    console.log('========');
    console.log('');
}

function gravarUrl(hostname: string): void {
    const url = `https://${hostname}/mcp`;
    writeFileSync(arquivoUrl, `${url}\n`, 'utf8');
    console.log(`url-atual.txt <- ${url}`);
}

async function mcpLeve(hostname: string): Promise<void> {
    const ctrl = AbortSignal.timeout(8000);
    const corpo = JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
        params: {
            _meta: {
                'io.modelcontextprotocol/protocolVersion': '2026-07-28',
                'io.modelcontextprotocol/clientCapabilities': { tools: {} },
                'io.modelcontextprotocol/clientInfo': { name: 'tunel-checagem', version: '0.1.0' }
            }
        }
    });
    const resposta = await fetch(`https://${hostname}/mcp`, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            accept: 'application/json, text/event-stream',
            'mcp-protocol-version': '2026-07-28',
            'mcp-method': 'tools/list'
        },
        body: corpo,
        signal: ctrl
    });
    if (resposta.status >= 400) throw new Error(`MCP HTTP ${resposta.status}`);
    const tipo = resposta.headers.get('content-type') ?? '';
    const texto = await resposta.text();
    const publica = texto.includes('consultar_acervo') && texto.includes('registrar_duvida') && texto.includes('ajudar_ideia_mcp');
    const privada = texto.includes('ver_duvidas_da_sala');
    if (!publica || privada || texto.includes('"error"')) {
        throw new Error(`MCP list inesperado (tipo=${tipo || '-'})`);
    }
}

async function mcpLeveComEspera(hostname: string): Promise<void> {
    let ultimo: unknown;
    for (let i = 0; i < 8; i += 1) {
        try {
            await mcpLeve(hostname);
            return;
        } catch (erro) {
            ultimo = erro;
            await new Promise(ok => setTimeout(ok, 2000));
        }
    }
    throw ultimo instanceof Error ? ultimo : new Error(String(ultimo));
}

async function umaSubida(): Promise<string> {
    const id = ++geracao;
    const proc = spawn(executavel, ['tunnel', '--protocol', 'http2', '--url', `http://127.0.0.1:${porta}`], {
        stdio: ['ignore', 'pipe', 'pipe']
    });
    atual = proc;
    const hostname = await new Promise<string>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('timeout aguardando hostname do cloudflared')), 25_000);
        const ouvir = (bloco: Buffer) => {
            const texto = bloco.toString();
            process.stderr.write(texto);
            const achado = texto.match(/https:\/\/([a-z0-9-]+\.trycloudflare\.com)/);
            if (achado?.[1]) {
                clearTimeout(timeout);
                resolve(achado[1]);
            }
        };
        proc.stdout?.on('data', ouvir);
        proc.stderr?.on('data', ouvir);
        proc.on('error', erro => {
            clearTimeout(timeout);
            reject(erro);
        });
        proc.on('exit', codigo => {
            clearTimeout(timeout);
            if (id !== geracao) return;
            reject(new Error(`cloudflared encerrou com codigo ${codigo}`));
        });
    });
    proc.removeAllListeners('exit');
    proc.on('exit', codigo => {
        if (encerrando || id !== geracao) return;
        urlPublicada = false;
        destaque(`${new Date().toISOString()} TUNEL: processo cloudflared caiu (codigo ${codigo}). Vai subir outro processo — a URL rápida provavelmente muda.`);
        void ciclo();
    });
    return hostname;
}

async function ciclo(): Promise<void> {
    if (encerrando || cicloAndando) return;
    cicloAndando = true;
    try {
        if (jaTentou) await new Promise(ok => setTimeout(ok, pausaMs));
        jaTentou = true;
        tentativas += 1;
        if (tentativas > maxTentativas) {
            destaque(`${new Date().toISOString()} TUNEL: esgotou ${maxTentativas} tentativas de criar processo. Ficou so o localhost.`);
            return;
        }
        try {
            const hostname = await umaSubida();
            tentativas = 0;
            autorizarHost(hostname);
            process.env.HOSTS = hostname;
            await mcpLeveComEspera(hostname);
            gravarUrl(hostname);
            urlPublicada = true;
            if (hostnameAtual && hostnameAtual !== hostname) {
                destaque(`URL MUDOU (novo processo cloudflared). Antes: https://${hostnameAtual}/mcp  Agora: https://${hostname}/mcp`);
            } else {
                destaque(`publico em https://${hostname}/mcp (MCP initialize ok; JSON, sem garantia de SSE no Quick Tunnel)`);
            }
            hostnameAtual = hostname;
        } catch (erro) {
            urlPublicada = false;
            destaque(`${new Date().toISOString()} TUNEL: subida incompleta: ${erro instanceof Error ? erro.message : erro}`);
            atual?.kill();
            cicloAndando = false;
            await ciclo();
            return;
        }
    } finally {
        cicloAndando = false;
    }
}

setInterval(() => {
    if (!hostnameAtual || encerrando || !urlPublicada) return;
    void (async () => {
        try {
            await mcpLeve(hostnameAtual);
        } catch (erro) {
            const msg = erro instanceof Error ? erro.message : String(erro);
            const ipv6 = /ENETUNREACH|EHOSTUNREACH|ipv6/i.test(msg);
            destaque(`${new Date().toISOString()} checagem MCP publica falhou (${msg}). Processo cloudflared intacto; URL não marcada como mudada${ipv6 ? ' (falha de rede/IPv6, não prova URL nova)' : ''}.`);
        }
    })();
}, 60_000);

const encerrar = () => {
    encerrando = true;
    geracao += 1;
    atual?.kill();
    process.exit(0);
};
process.on('SIGINT', encerrar);
process.on('SIGTERM', encerrar);

await ciclo();
