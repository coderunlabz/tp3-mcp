# Plano do servidor (TP3)

Um processo TypeScript. Não há três pacotes. Pacotes npm fixados no P0: `@modelcontextprotocol/server` 2.2.0, `@modelcontextprotocol/node` 2.1.0, `zod` 4.6.5.

## Arquitetura

- `src/criarServidor.ts` — tools, resources, prompts, sala em memória
- `src/servir.ts` — HTTP local `127.0.0.1`, Streamable HTTP em `/mcp`, validação de `Host`/`Origin`, log por chamada MCP (sem IP, sem texto da pergunta)
- `src/logChamada.ts` — formatação do log (tela + JSON opcional em `LOG_ARQUIVO`)
- `src/index.ts` — `npm start`
- `scripts/tunel.ts` — túnel rápido Cloudflare (`trycloudflare.com`); URL em `url-atual.txt`
- `conteudo/` — slides, manual, referências

Exposição pública só por túnel rápido a partir da máquina local. Sem VPS (decisão de 01/10). Sem túnel nomeado: Nicolas ficou no modo rápido, sem conta e sem domínio.

Dúvidas da sala ficam na memória do processo Node. Reiniciar o processo zera a sala. Não grava nome nem IP. Não persiste em disco.

## Comandos

- Local: `npm start` → `http://127.0.0.1:3000/mcp`
- Ensaio: `npm run tunel` (janela: `powershell -File scripts/manter-aberto.ps1`)
