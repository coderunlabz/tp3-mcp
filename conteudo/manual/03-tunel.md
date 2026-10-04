---
tema: instalacao
fonte: README do projeto
autor: Nicolas
---

Para alguém de fora usar o servidor, rode npm run tunel. Esse comando já sobe o servidor e o túnel, então não rode npm start junto. A URL pública termina em /mcp, aparece no terminal e fica em url-atual.txt; ela muda se o cloudflared reiniciar. Pelo túnel saem só as 3 tools públicas. O túnel gratuito não tem garantia de disponibilidade. Chats na nuvem usam essa URL, sem autenticação.
