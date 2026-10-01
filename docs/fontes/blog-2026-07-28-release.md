# Blog oficial — "The 2026-07-28 Specification" (28/07/2026)

Resumo próprio do anúncio da versão final da especificação, publicado em 28/07/2026 por David Soria Parra e Den Delimarsky (mantenedores principais). Acessado em 01/10/2026.

- Seções: O que o post diz, Dados de adoção, Observações para os slides, Fonte.

## O que o post diz

- Destaque da versão: núcleo sem estado. O MCP deixa de ser um protocolo bidirecional com estado e passa a ser de pedido e resposta, atendendo a um dos pedidos mais frequentes de quem opera servidores.
- O handshake `initialize`/`initialized` e o cabeçalho `Mcp-Session-Id` foram aposentados. Cada pedido leva versão, identidade e capacidades do cliente no `_meta`. Existe `server/discover` para quem quiser saber as capacidades antes, mas não é obrigatório para o cliente.
- Estado de aplicação continua possível: o servidor cria uma referência (identificador) numa tool e o modelo a devolve como argumento depois. Segundo os autores, isso funciona melhor que estado escondido no transporte, porque o modelo enxerga a referência.
- Multi Round-Trip Requests trocam os pedidos que o servidor fazia ao cliente (`elicitation/create`, `sampling/createMessage`, `roots/list`).
- `Mcp-Method` e `Mcp-Name` viram cabeçalhos obrigatórios, para roteamento, limite de uso e autorização no gateway.
- Listas trazem `ttlMs` e `cacheScope`.
- Autorização: validação de `iss`, `application_type`, credenciais presas ao emissor e registro dinâmico depreciado.
- Tasks sai do núcleo e vira extensão; notificações de mudança migram para `subscriptions/listen`.
- Roots, Sampling e Logging depreciados por pelo menos 12 meses; transporte HTTP+SSE antigo também.
- Os quatro SDKs principais (TypeScript, Python, Go, C#) já falam a nova versão; o de Rust está em beta.

## Dados de adoção

O post afirma quase meio bilhão de downloads por mês somando os SDKs principais, e mais de 1 bilhão de downloads no total para cada um dos SDKs de TypeScript e Python. Traz depoimentos de AWS, Cloudflare, Google Cloud, Microsoft, Figma, Supabase e outros. São declarações do próprio projeto e de parceiros; citar como tal.

## Observações para os slides

- Bom para o slide de evolução: o efeito prático é rodar atrás de um balanceador comum.
- O post não menciona retomada de stream; isso está no changelog da especificação (ver `spec-2026-07-28.md`).

## Fonte

https://blog.modelcontextprotocol.io/posts/2026-07-28/
