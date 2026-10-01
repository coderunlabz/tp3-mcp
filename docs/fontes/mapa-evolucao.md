# Mapa de afirmações — evolução do MCP

Cada afirmação do slide de evolução (`conteudo/slides/05-evolucao.md`) e dos slides de arquitetura e primitivos, ligada à fonte que a sustenta. Conferido em 01/10/2026. Onde a fonte não sustenta por inteiro, o texto diz o que ajustar.

- Resultado: tudo do slide 05 está sustentado; três pontos pedem ajuste de redação (marcados com AJUSTE).
- A fonte 4sysops (17/07/2026) não foi achada; o assunto SDK v2 foi coberto pelo blog oficial e pelo repositório do SDK.
- Seções: Evolução, Arquitetura e primitivos, Fora dos slides mas úteis, Fontes lidas.

## Evolução (slide 05)

| Afirmação | Situação | Onde |
|---|---|---|
| Lançado em novembro de 2024 | Confirmado: 25/11/2024, como padrão aberto, com especificação e SDKs | `anthropic-2024-11-25-lancamento.md` |
| Adotado pelas grandes empresas | Confirmado em parte. O blog oficial traz depoimentos de AWS, Cloudflare, Google Cloud e Microsoft e fala em quase meio bilhão de downloads por mês nos SDKs principais. É fala do próprio projeto, então dizer "segundo o blog oficial" | `blog-2026-07-28-release.md` |
| A revisão de 28/07/2026 tirou o estado do núcleo | Confirmado. É a mudança de destaque da revisão | `blog-2026-07-28-release.md`, `spec-2026-07-28.md` |
| Não há sessão | Confirmado: protocolo sem sessão e sem o cabeçalho `Mcp-Session-Id` | `spec-2026-07-28.md` (changelog, item 1) |
| Não há handshake de initialize | Confirmado | `spec-2026-07-28.md` (changelog, item 2) |
| Não há retomada de stream | Confirmado no changelog oficial (item 9). Efeito: stream quebrado perde o pedido, e o cliente refaz com novo id | `spec-2026-07-28.md`, `workos-2026-09-16.md` |
| Cada pedido carrega versão e capacidades no `_meta` | Confirmado. AJUSTE: a versão também vai no cabeçalho `MCP-Protocol-Version`; o `_meta` carrega versão, capacidades e, por recomendação, a identificação do cliente | `spec-2026-07-28.md` |
| Efeito: escala como API HTTP comum | Confirmado: qualquer pedido cai em qualquer instância atrás de um balanceador simples, sem armazenamento de sessão | `blog-2026-07-28-release.md`, `workos-2026-09-16.md` |
| MCP Apps e Tasks ficam fora do núcleo | Confirmado. AJUSTE: Tasks saiu do núcleo nesta revisão (era experimental na anterior); MCP Apps já era extensão. O que esta revisão fez foi formalizar o mecanismo de extensões | `blog-2026-05-21-release-candidate.md` |
| Autorização mais perto de OAuth | Confirmado: validação do parâmetro `iss` (RFC 9207), credencial presa ao emissor, e registro dinâmico de cliente depreciado em favor de documentos de metadados do cliente | `spec-2026-07-28.md` (changelog) |
| SDK TypeScript v2 em pacotes, só ESM | Confirmado: `@modelcontextprotocol/server` e `@modelcontextprotocol/client`, mais adaptadores; ESM apenas; Node 20+. A v1 segue com correções por pelo menos 6 meses | `blog-2026-06-29-sdk-betas.md` |

## Arquitetura e primitivos (slides 03 e 04)

| Afirmação | Situação | Onde |
|---|---|---|
| Host, cliente e servidor | Confirmado. Detalhe útil: cada cliente fala com exatamente um servidor, e o host pode ter vários clientes | `spec-2026-07-28.md` (arquitetura) |
| Transporte local é stdio; remoto é Streamable HTTP | Confirmado: stdio é subprocesso iniciado pelo cliente; Streamable HTTP é POST para um endpoint único, com resposta em JSON ou em stream SSE do próprio pedido | `spec-2026-07-28.md` (transportes) |
| Tools: o modelo decide | Confirmado: funções para o modelo executar | `spec-2026-07-28.md` (visão geral) |
| Prompts: a pessoa escolhe | Confirmado: mensagens-modelo para o usuário | idem |
| Resources: o chat abre | AJUSTE: a especificação diz só que são contexto e dados "para o usuário ou para o modelo". Não afirma que o chat decide. Trocar por "o aplicativo ou a pessoa abre; o modelo pode ler" ou dizer "em geral" | idem |

## Fora dos slides mas úteis

- Servidores precisam implementar `server/discover`; clientes só chamam se quiserem. Conferir que o nosso servidor responde (o SDK deveria cuidar disso).
- Cabeçalhos `Mcp-Method` e `Mcp-Name` são obrigatórios em cada POST: servem para o log de clientes sem abrir o corpo.
- Clientes devem se identificar em cada pedido (`clientInfo` no `_meta`), mas é recomendação. Quem não mandar cai no user-agent.
- Listas e leituras de recurso trazem `ttlMs` e `cacheScope`.
- Política de depreciação: janela mínima de 12 meses; Roots, Sampling, Logging e o transporte HTTP+SSE antigo estão depreciados.
- A arquitetura diz que o servidor não deve ler a conversa inteira. Bom argumento para o slide de limites e para a regra de não gravar conteúdo no log.
- Se o slide disser "initialize foi removido", cuidado com o cliente antigo: clientes novos voltam para o handshake ao falar com servidor antigo.

## Fontes lidas

Todas acessadas em 01/10/2026.

- `spec-2026-07-28.md`
- `blog-2026-07-28-release.md`
- `blog-2026-05-21-release-candidate.md`
- `blog-2026-06-29-sdk-betas.md`
- `workos-2026-09-16.md`
- `anthropic-2024-11-25-lancamento.md`
- Não achada: 4sysops, 17/07/2026. O arquivo `conteudo/referencias/4sysops-sdk.md` continua no acervo; sem URL exata do artigo, sugiro trocá-lo por `blog-2026-06-29-sdk-betas.md` (decisão do Nicolas).
