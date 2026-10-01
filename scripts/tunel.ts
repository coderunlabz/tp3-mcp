import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { servir } from '../src/servir.ts';

const porta = Number(process.env.PORT ?? 3000);
const maxTentativas = Number(process.env.TUNEL_TENTATIVAS ?? 8);
const pausaMs = Number(process.env.TUNEL_PAUSA_MS ?? 8000);
const arquivoUrl = path.join(process.cwd(), 'url-atual.txt');
const executavel = [
    'C:\\Program Files (x86)\\cloudflared\\cloudflared.exe',
    'C:\\Program Files\\cloudflared\\cloudflared.exe'
].find(caminho => existsSync(caminho)) ?? 'cloudflared';

console.error('ATENCAO: reiniciar este processo Node zera as duvidas da sala (memoria). Elas nao vao para disco.');

servir({ porta });

let atual: ChildProcess | undefined;
let hostnameAtual: string | undefined;
let tentativas = 0;
let jaTentou = false;
let encerrando = false;
let falhasSeguidas = 0;
let cicloAndando = false;

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

function subirCloudflared(): ChildProcess {
    return spawn(executavel, ['tunnel', '--protocol', 'http2', '--url', `http://127.0.0.1:${porta}`], {
        stdio: ['ignore', 'pipe', 'pipe']
    });
}

async function umaSubida(): Promise<string> {
    const proc = subirCloudflared();
    atual = proc;
    const hostname = await new Promise<string>((resolve, reject) => {
        const ouvir = (bloco: Buffer) => {
            const texto = bloco.toString();
            process.stderr.write(texto);
            const achado = texto.match(/https:\/\/([a-z0-9-]+\.trycloudflare\.com)/);
            if (achado?.[1]) resolve(achado[1]);
        };
        proc.stdout?.on('data', ouvir);
        proc.stderr?.on('data', ouvir);
        proc.on('error', reject);
        proc.on('exit', codigo => reject(new Error(`cloudflared encerrou com codigo ${codigo}`)));
    });
    proc.removeAllListeners('exit');
    proc.on('exit', codigo => {
        if (encerrando) return;
        destaque(`${new Date().toISOString()} TUNEL CAIU (codigo ${codigo}). Reiniciando em ${pausaMs / 1000}s. URL rapida pode mudar.`);
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
            destaque(`${new Date().toISOString()} TUNEL: esgotou ${maxTentativas} tentativas. Ficou so o localhost.`);
            return;
        }
        try {
            const hostname = await umaSubida();
            tentativas = 0;
            falhasSeguidas = 0;
            process.env.HOSTS = hostname;
            gravarUrl(hostname);
            if (hostnameAtual && hostnameAtual !== hostname) {
                destaque(`URL MUDOU. Antes: https://${hostnameAtual}/mcp  Agora: https://${hostname}/mcp`);
            } else {
                destaque(`publico em https://${hostname}/mcp`);
            }
            hostnameAtual = hostname;
        } catch (erro) {
            destaque(`${new Date().toISOString()} TUNEL falhou: ${erro instanceof Error ? erro.message : erro}`);
            cicloAndando = false;
            await ciclo();
            return;
        }
    } finally {
        cicloAndando = false;
    }
}

setInterval(async () => {
    if (!hostnameAtual || encerrando) return;
    try {
        const resposta = await fetch(`https://${hostnameAtual}/mcp`, { method: 'GET' });
        if (resposta.status >= 500) throw new Error(`HTTP ${resposta.status}`);
        falhasSeguidas = 0;
    } catch (erro) {
        falhasSeguidas += 1;
        destaque(`${new Date().toISOString()} checagem publica falhou ${falhasSeguidas} vezes (${erro instanceof Error ? erro.message : erro}).`);
        if (falhasSeguidas >= 3) {
            falhasSeguidas = 0;
            destaque(`${new Date().toISOString()} checagem falhou 3 vezes. Matando cloudflared para subir de novo.`);
            atual?.kill();
        }
    }
}, 60_000);

const encerrar = () => {
    encerrando = true;
    atual?.kill();
    process.exit(0);
};
process.on('SIGINT', encerrar);
process.on('SIGTERM', encerrar);

await ciclo();
