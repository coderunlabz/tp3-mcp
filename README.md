# Acervo MCP (TP3)

Servidor MCP Streamable HTTP. Repo privado até Nicolas abrir.

## Local

```
npm install
npm start
```

Endpoint: `http://127.0.0.1:3000/mcp`

```
npm run listar
```

## Túnel rápido (URL muda)

```
npm run tunel
```

Se o `cloudflared` cair, o script avisa e tenta de novo (até `TUNEL_TENTATIVAS`, padrão 8). A URL nova sai em destaque.

## Túnel fixo (depois de Nicolas escolher e criar a conta)

```
$env:TUNEL_HOSTNAME="SEU-HOST"
$env:TUNEL_PROVEDOR="ngrok"   # ou cloudflare
npm run tunel:fixo
```

Cloudflare nomeado ainda usa `--protocol http2`. Não suba isso sem `TUNEL_HOSTNAME`.

## Fora do Cursor

O processo no terminal do agente morre quando a sessão acaba. Suba numa janela própria:

```
powershell -File scripts/manter-aberto.ps1
powershell -File scripts/manter-aberto.ps1 -Fixo
```

**Reiniciar o processo Node zera as dúvidas da sala** (memória). Elas não vão para disco.

Auth nos clientes de nuvem desta demo: **None**.
