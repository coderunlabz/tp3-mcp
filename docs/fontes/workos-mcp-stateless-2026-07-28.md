# WorkOS — MCP went stateless (spec 2026-07-28)

- Consultado em: 01/10/2026
- URL: https://workos.com/blog/mcp-stateless-spec-2026-07-28
- Publicado: 16/09/2026 (Maria Paktiti)

## Resumo fiel

A revisão `2026-07-28` tira mais do que adiciona: sessão no protocolo, handshake `initialize`, retomada de stream (`Last-Event-ID` e IDs SSE), `ping` e `logging/setLevel`.

Cada pedido carrega versão e capacidades em `_meta` (`io.modelcontextprotocol/protocolVersion`, `clientCapabilities`, `clientInfo`). Sem sessão, o tráfego cabe atrás de um load balancer comum.

`server/discover`: o servidor implementa; o cliente pode pular e ir direto a `tools/call`.

Estado de aplicação: handle devolvido pela tool e reenviado como argumento.

MRTR substitui elicitation/sampling/roots iniciados pelo servidor: `resultType: "input_required"` e retry com `inputResponses`. `resultType` passa a ser obrigatório nos resultados (`complete` no caso normal).

Streamable HTTP POST exige `Mcp-Method` e `Mcp-Name`. Listagens devolvem `ttlMs` e `cacheScope`.

DCR depreciado em favor de CIMD. Roots, Sampling, Logging e HTTP+SSE depreciados com janela de doze meses.

Aviso operacional: sem retomada de SSE, stream quebrado perde o pedido; tools com efeito colateral precisam de idempotência na aplicação.
