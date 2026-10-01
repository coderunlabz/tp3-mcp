# Seminário — conteúdo-base

O seminário contextualiza o MCP como um todo. A mudança de julho/2026 é um
capítulo da evolução, não o foco.

## Enquadramento

MCP não cabe nas categorias do PDF. Se for obrigatório escolher, "Agentes".
Argumento: é um protocolo transversal, como HTTP ou LSP, e merece uma
categoria própria, "Interoperabilidade".

## Arco sugerido

1. **Problema:** cada IA integrava cada ferramenta de um jeito (N×M).
2. **Ideia:** um padrão único, como uma tomada: o servidor é a tomada, cada
   chat é um aparelho.
3. **Arquitetura:** host, cliente, servidor; transporte local (stdio) e
   remoto (Streamable HTTP).
4. **Primitivos:** tools, resources, prompts.
5. **Evolução:** lançamento (nov/2024), adoção pelas grandes empresas, e a
   revisão **2026-07-28**: núcleo sem estado. Sessões, handshake de
   initialize e retomada de stream foram removidos; cada requisição carrega
   versão e capacidades no `_meta`. Efeito: escala como API HTTP comum.
   Também chegaram extensões (MCP Apps, Tasks), autorização mais alinhada a
   OAuth e política formal de depreciação. SDK TypeScript v2 dividido em
   pacotes (`@modelcontextprotocol/server`, `@modelcontextprotocol/client`),
   só ESM.
6. **Demo ao vivo.**
7. **Limites e riscos:** segurança de tools, confiança no servidor, custo.

## Fontes

- blog.modelcontextprotocol.io, posts de 21/05 e 28/07/2026.
- workos.com/blog/mcp-stateless-spec-2026-07-28.
- 4sysops, 17/07/2026 (SDK v2).
- Chat "TP3" de 05/09/2026 (enquadramento).
