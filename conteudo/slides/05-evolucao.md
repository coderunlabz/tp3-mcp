---
tema: evolucao
fonte: blog oficial do MCP, 21/05/2026 e 28/07/2026; especificação MCP 2026-07-28
autor: Nicolas
palavras: _meta, julho, sessao, initialize, oauth
---

O MCP foi lançado como padrão aberto em 25/11/2024, com especificação e SDKs. A revisão de 28/07/2026 tirou o estado do núcleo do protocolo: não há sessão, nem o handshake initialize, nem retomada de stream. Cada pedido carrega a versão e as capacidades do cliente no campo _meta. O efeito prático é que um servidor MCP escala como uma API HTTP comum, porque qualquer instância atrás de um balanceador simples atende qualquer pedido.

Extensões como MCP Apps e Tasks ficam fora do núcleo. A autorização se aproximou de OAuth. O SDK TypeScript v2 é dividido em pacotes, só ESM: @modelcontextprotocol/server e @modelcontextprotocol/client. Esta demonstração usa esse SDK.
