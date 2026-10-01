# Acervo MCP (TP3)

Servidor MCP Streamable HTTP. Repo privado até Nicolas abrir.

Os scripts leem `.env` se existir (`--env-file-if-exists=.env`). Copie de `.env.example`. O token da Cloudflare não entra neste arquivo.

## Local

```
npm install
npm start
```

Endpoint: `http://127.0.0.1:3000/mcp`

```
npm run listar
```

## Demo pública: túnel rápido

Nicolas escolheu o túnel rápido (sem domínio, sem conta). A URL muda se o `cloudflared` reiniciar; a atual fica em `url-atual.txt` (ignorado pelo git).

Abrir **fora do Cursor**, numa janela própria:

```
powershell -File scripts/manter-aberto.ps1
```

Na tomada, para o notebook não suspender:

```
powercfg /change standby-timeout-ac 0
powercfg /change hibernate-timeout-ac 0
```

(`powercfg /query` confere. Voltar o tempo antigo depois da demo.)

Se o `cloudflared` cair, o script avisa, espera alguns segundos e sobe de novo (até `TUNEL_TENTATIVAS`, padrão 8). URL nova sai em destaque e em `url-atual.txt`. Se a checagem pública falhar 3 vezes seguidas, o script mata o `cloudflared` e reinicia.

**Reiniciar o processo Node zera as dúvidas da sala** (memória). Elas não vão para disco.

## Log

Cada chamada MCP imprime uma linha (`cliente@version  metodo  alvo  ok|erro  Nms`), sem IP e sem o texto da pergunta.

```
$env:LOG_ARQUIVO="chamadas.jsonl"
npm start
```

Auth nos clientes de nuvem desta demo: **None**.
