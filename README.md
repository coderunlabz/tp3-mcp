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
```

## Túnel rápido (turma)

```
powershell -File scripts/manter-aberto.ps1
```

Pelo túnel saem 3 tools (`ver_duvidas_da_sala` não lista e a chamada é recusada). A URL atual está em `url-atual.txt`.

Na tomada:

```
powercfg /change standby-timeout-ac 0
powercfg /change hibernate-timeout-ac 0
```

**Reiniciar o Node não apaga** `registro/duvidas.md` nem `registro/ideias.md` (pasta ignorada pelo git). Sem IP.

Auth nos clientes de nuvem: **None**.
