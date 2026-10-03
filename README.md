# Acervo MCP (TP3)

Servidor MCP Streamable HTTP. Repo privado até Nicolas abrir.

Os scripts leem `.env` se existir. Copie de `.env.example`. Sem token da Cloudflare.

## Local

```
npm install
npm start
```

`http://127.0.0.1:3000/mcp` — 4 tools, inclusive `ver_duvidas_da_sala`.

```
npm run listar
npm run verificar
npm run prova
npm run p6
```

## Túnel rápido (turma)

```
powershell -File scripts/manter-aberto.ps1
```

Pelo túnel saem 3 tools (`ver_duvidas_da_sala` não lista e a chamada é recusada). A URL atual está em `url-atual.txt`. Quick Tunnel **não tem SLA** e **não garante SSE**; este servidor responde JSON no `/mcp`.

Na tomada:

```
powercfg /change standby-timeout-ac 0
powercfg /change hibernate-timeout-ac 0
```

**Reiniciar o Node não apaga** `registro/duvidas.jsonl` nem `registro/ideias.jsonl` (pasta ignorada pelo git). `duvidas.md` antigo é migrado para jsonl e **não é apagado**. Sem IP. Logs em `registro/chamadas.jsonl` (sem argumentos). `LOG_ARQUIVO=off` deixa só o terminal. Tools respondem JSON; SSE de escuta não é consumido antes de chegar ao cliente.

Para limpar a lista da sala **sem apagar** os ensaios, **pare o servidor** (`Ctrl+C` no `npm start` ou no túnel) e rode:

```
npm run arquivar:duvidas
```

O comando move `duvidas.jsonl` e `duvidas.md` para `registro/historico/<data-hora>/`. Não mexe em ideias nem nos logs. Não para processos sozinho. Com o servidor ainda aberto, uma dúvida nova pode cair de novo na pasta ativa no meio da movimentação. Depois do arquivo, `npm start` (ou `npm run tunel`) recria a lista vazia na primeira gravação.

Auth nos clientes de nuvem: **None**.

## Conectar (por cliente)

Não espere que `@` ou `/` chamem o acervo em todo app.

| Cliente | O que fazer |
|---|---|
| Cursor local | `.cursor/mcp.json` com `http://127.0.0.1:3000/mcp`, tipo HTTP. Ligar o conector e **abrir chat novo**. |
| Cursor remoto | A mesma entrada, URL `https://<host>.trycloudflare.com/mcp` de `url-atual.txt`. A URL muda se o cloudflared for outro processo. |
| Claude / Perplexity | Conector HTTP, URL `/mcp`, autenticação None. Sem OAuth neste projeto. |
| ChatGPT | Conector MCP, URL `/mcp`, auth None. Só texto das tools. |
| Cliente SDK | Pin da era `2026-07-28`. |

`registrar_duvida` só quando o aluno pedir envio ao apresentador. Dúvida de estudo usa `consultar_acervo`.

`scripts/tunel-fixo.ts` não é suportado (não há `npm run tunel:fixo`).
