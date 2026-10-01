# Estado — 01/10/2026

Repo privado `coderunlabz/tp3-mcp`, branch `main`. Seminário 06/10/2026. Slides e manual de apresentação ainda não começaram.

## Fechado

- P0 pacotes e esqueleto
- P1 servidor local Streamable HTTP
- P2 conteúdo e tools
- P3 prompts/atalhos
- P4 túnel rápido Cloudflare (http2; QUIC bloqueado na rede testada)
- P5 demo com Claude/Perplexity (auth None)

## Ajustes desta leva (código)

- Checagem: várias linhas `resposta:`; recusa negação (`nao`/`nunca`) se o gabarito não tiver negação; gabarito do slide 01 em palavras-chave
- Agrupamento: corpo do markdown + `palavras:` no frontmatter; empate/zero → `geral`
- Túnel rápido: aviso de queda, reinício com limite, URL nova em destaque, checagem pública a cada 60 s
- `npm run tunel:fixo` preparado; hostname ainda sem conta
- Docs alinhados ao código único; VPS retirada do plano
- `docs/fontes/` para o slide 05

## Não feito de propósito

- Conta Cloudflare/ngrok
- Abrir o repo
- Checagens nos slides 02, 03 e 05 (aguardam ok do texto)
- Persistência de dúvidas em disco
