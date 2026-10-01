# Blog oficial — SDKs beta (29/06/2026)

Resumo próprio do post que anunciou as versões beta dos SDKs para a revisão 2026-07-28, publicado em 29/06/2026. Acessado em 01/10/2026. É a fonte do slide sobre o SDK v2 do TypeScript, que o projeto usa.

- Seções: Recado principal, TypeScript, Para o manual, Fonte.

## Recado principal

O que já funciona não quebra: a data de 28/07 é a publicação do texto da especificação, não um desligamento de versões antigas. Mudar de versão de SDK é escolha de quem desenvolve. Clientes novos voltam ao handshake `initialize` quando falam com servidores antigos, então os dois mundos convivem.

## TypeScript

A versão 2 aposenta o pacote único `@modelcontextprotocol/sdk` e passa a ter pacotes focados: `@modelcontextprotocol/server` para servidores e `@modelcontextprotocol/client` para clientes, mais adaptadores finos para Node.js, Express, Hono e Fastify. É somente ESM e roda em Node.js 20 ou mais novo, Bun e Deno. Os esquemas de tools usam Standard Schema, então Zod v4 serve.

Para HTTP, a porta de entrada é `createMcpHandler`, do pacote do servidor: atende a revisão nova por pedido e atende a de 25/11/2025 no mesmo endpoint. No TypeScript, servir a revisão nova é escolha explícita ao montar o transporte. Há um programa de migração automática (`codemod`) da v1 para a v2, que inclui a troca de `.tool()` por `registerTool`.

A linha v1 continua recebendo correções e atualizações de segurança por pelo menos seis meses depois da v2 estável.

## Para o manual

- O projeto usa `createMcpHandler` (ver `src/servir.ts`) e `registerTool`, `registerResource`, `registerPrompt` (ver `src/criarServidor.ts`).
- Versões fixadas no projeto: `@modelcontextprotocol/server` 2.2.0, `@modelcontextprotocol/node` 2.1.0, `zod` 4.6.5. O post recomenda fixar versão exata em testes.
- O repositório oficial do SDK (https://github.com/modelcontextprotocol/typescript-sdk) hoje descreve a v2 como a linha estável e a v1 como em manutenção.

## Fonte

https://blog.modelcontextprotocol.io/posts/sdk-betas-2026-07-28/
