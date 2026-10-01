import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';

import { servir } from '../src/servir.ts';

const porta = Number(process.env.PORT ?? 3000);
const hostname = process.env.TUNEL_HOSTNAME?.trim();
const provedor = (process.env.TUNEL_PROVEDOR ?? 'ngrok').toLowerCase();

if (!hostname) {
    console.error('Defina TUNEL_HOSTNAME com o endereco fixo (sem https://).');
    console.error('Exemplo ngrok:  $env:TUNEL_HOSTNAME="algo.ngrok-free.app"; $env:TUNEL_PROVEDOR="ngrok"; npm run tunel:fixo');
    console.error('Exemplo Cloudflare nomeado: TUNEL_HOSTNAME + TUNEL_TOKEN (token do tunel) e TUNEL_PROVEDOR=cloudflare');
    process.exit(1);
}

console.error('ATENCAO: reiniciar este processo Node zera as duvidas da sala (memoria). Elas nao vao para disco.');

servir({ porta, hostsExtras: [hostname] });
console.log(`local em http://127.0.0.1:${porta}/mcp`);
console.log(`publico esperado em https://${hostname}/mcp`);

const cloudflared = [
    'C:\\Program Files (x86)\\cloudflared\\cloudflared.exe',
    'C:\\Program Files\\cloudflared\\cloudflared.exe'
].find(caminho => existsSync(caminho)) ?? 'cloudflared';

function iniciar() {
    if (provedor === 'ngrok') {
        return spawn('ngrok', ['http', String(porta), '--url', `https://${hostname}`], { stdio: 'inherit' });
    }
    const token = process.env.TUNEL_TOKEN?.trim();
    const args = token
        ? ['tunnel', '--protocol', 'http2', 'run', '--token', token]
        : ['tunnel', '--protocol', 'http2', 'run', hostname];
    return spawn(cloudflared, args, { stdio: 'inherit' });
}

let proc = iniciar();
let tentativas = 0;
const maxTentativas = Number(process.env.TUNEL_TENTATIVAS ?? 8);

proc.on('exit', codigo => {
    tentativas += 1;
    console.error('');
    console.error('========');
    console.error(`${new Date().toISOString()} TUNEL FIXO CAIU (codigo ${codigo}). A URL nao deveria mudar: https://${hostname}/mcp`);
    console.error('========');
    if (tentativas > maxTentativas) {
        console.error('Esgotou tentativas. Ficou so o localhost.');
        return;
    }
    proc = iniciar();
});

const encerrar = () => {
    proc.kill();
    process.exit(0);
};
process.on('SIGINT', encerrar);
process.on('SIGTERM', encerrar);
