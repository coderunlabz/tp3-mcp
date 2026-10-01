---
tema: evolucao
fonte: https://blog.modelcontextprotocol.io
autor: Nicolas
---

O protocolo foi lançado em novembro de 2024 e passou a ser adotado pelas grandes empresas. A revisão de 28/07/2026 tirou o estado do núcleo. Não há sessão, nem handshake de initialize, nem retomada de stream. Cada pedido carrega versão e capacidades no campo _meta. O efeito é escalar como uma API HTTP comum.

Extensões como MCP Apps e Tasks ficam de fora do núcleo. A autorização se aproximou de OAuth. O SDK TypeScript v2 está em pacotes, só ESM: @modelcontextprotocol/server e @modelcontextprotocol/client.
