# Estado — 01/10/2026

Repo privado `coderunlabz/tp3-mcp`, branch `main`. Seminário 06/10/2026. Numeração igual a `docs/pipeline/`.

## Pipeline

- P0 especificação (spec 2026-07-28, SDK v2)
- P1 contrato
- P2 servidor local
- P3 conteúdo
- P4 sala e checagem
- P5 cliente real
- P6 provas (`docs/pipeline/p6.md`)

## Ajustes depois do P5

- Checagem: várias `resposta:`; recusa negação; um termo útil exige o gabarito inteiro
- Agrupamento pelo corpo + `palavras:`
- Dúvida igual à última em 5 s não duplica
- Túnel rápido: aviso, pausa, reinício, `url-atual.txt`; checagem 3 falhas mata o `cloudflared`
- Log MCP sem IP; `LOG_ARQUIVO` opcional
- Decisão 01/10: VPS fora; túnel **rápido** (sem conta, sem domínio)

## Não feito de propósito

- Conta Cloudflare / túnel nomeado / serviço Windows
- Abrir o repo
- Checagens nos slides 02, 03 e 05
- Persistência de dúvidas em disco
- Tool de painel de clientes
