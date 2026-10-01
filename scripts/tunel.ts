import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';

import { servir } from '../src/servir.ts';

const porta = Number(process.env.PORT ?? 3000);
const executavel = [
    'C:\\Program Files (x86)\\cloudflared\\cloudflared.exe',
    'C:\\Program Files\\cloudflared\\cloudflared.exe'
].find(caminho => existsSync(caminho)) ?? 'cloudflared';
const cloudflared = spawn(executavel, ['tunnel', '--protocol', 'http2', '--url', `http://127.0.0.1:${porta}`], {
    stdio: ['ignore', 'pipe', 'pipe']
});

const hostname = await new Promise<string>((resolve, reject) => {
    const ouvir = (bloco: Buffer) => {
        const texto = bloco.toString();
        process.stderr.write(texto);
        const achado = texto.match(/https:\/\/([a-z0-9-]+\.trycloudflare\.com)/);
        if (achado?.[1]) resolve(achado[1]);
    };
    cloudflared.stdout.on('data', ouvir);
    cloudflared.stderr.on('data', ouvir);
    cloudflared.on('exit', codigo => reject(new Error(`cloudflared encerrou com codigo ${codigo}`)));
});

console.log(`publico em https://${hostname}/mcp`);
servir({ porta, hostsExtras: [hostname] });

const encerrar = () => {
    cloudflared.kill();
    process.exit(0);
};
process.on('SIGINT', encerrar);
process.on('SIGTERM', encerrar);
