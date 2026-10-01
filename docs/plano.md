# Plano do servidor (TP3)

Um processo TypeScript. Não há três pacotes. Pacotes npm fixados no P0: `@modelcontextprotocol/server` 2.2.0, `@modelcontextprotocol/node` 2.1.0, `zod` 4.6.5.

## Arquitetura

- `src/criarServidor.ts` — tools, resources, prompts, sala em memória
- `src/servir.ts` — HTTP local `127.0.0.1`, Streamable HTTP em `/mcp`, validação de `Host`/`Origin`
- `src/index.ts` — `npm start`
- `scripts/tunel.ts` — ensaio com quick tunnel Cloudflare (`trycloudflare.com`, URL muda)
- `scripts/tunel-fixo.ts` — hostname em `TUNEL_HOSTNAME` (ngrok ou Cloudflare nomeado). **Não criar conta sem ok**
- `conteudo/` — slides, manual, referências

Exposição pública só por túnel a partir da máquina local. Sem VPS: em 01/10/2026 Nicolas descartou VPS; o endereço deve ser estável no túnel, não num servidor alugado.

Dúvidas da sala ficam na memória do processo Node. Reiniciar o processo zera a sala. Não grava nome nem IP. Não persiste em disco.

## Comandos

- Local: `npm start` → `http://127.0.0.1:3000/mcp`
- Ensaio: `npm run tunel`
- Fixo (depois da conta): `npm run tunel:fixo` com `TUNEL_HOSTNAME`
- Fora do Cursor: `powershell -File scripts/manter-aberto.ps1`
