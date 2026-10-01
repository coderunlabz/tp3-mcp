---
tema: instalacao
fonte: esqueleto do manual do TP3
autor: Nicolas
---

Para alguém de fora, pare o `npm start` e rode `npm run tunel` numa janela própria (`powershell -File scripts/manter-aberto.ps1`). O comando imprime uma URL `https://` que termina em `/mcp`. No modo rápido essa URL muda se o túnel reiniciar. O modo fixo (`npm run tunel:fixo`) só depois do hostname em `TUNEL_HOSTNAME`. Chat na nuvem, como Claude e Perplexity, usa essa URL. Sem login neste servidor. Reiniciar o Node zera as dúvidas da sala.
