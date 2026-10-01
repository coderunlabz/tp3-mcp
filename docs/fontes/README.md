# Fontes da evolução (fora do acervo)

Resumos datados em 01/10/2026, a partir das páginas oficiais e dos artigos citados no slide `conteudo/slides/05-evolucao.md`. Não são transcrição integral.

| Afirmação no slide 05 | Fonte |
| --- | --- |
| Lançado em novembro de 2024 | **sem fonte nestes resumos** (nenhuma das páginas abaixo data o lançamento inicial) |
| Adoção pelas grandes empresas | blog 28/07/2026 (cita AWS, Google Cloud, Microsoft, Cloudflare, etc.) |
| Revisão 28/07/2026 tirou o estado do núcleo | spec Overview; blog 21/05 e 28/07; WorkOS |
| Sem sessão, sem handshake `initialize` | blog 21/05 e 28/07; WorkOS |
| Sem retomada de stream | WorkOS (remoção de `Last-Event-ID` / IDs SSE). **O slide diz “nem retomada de stream”; a spec Overview não detalha isso** |
| Cada pedido carrega versão e capacidades em `_meta` | spec Overview; blog 21/05 e 28/07; WorkOS |
| Efeito: escalar como API HTTP comum | blog 21/05 e 28/07; WorkOS |
| MCP Apps e Tasks fora do núcleo | spec Overview (Extensions); blog 21/05 e 28/07 |
| Autorização se aproximou de OAuth | blog 21/05 e 28/07; WorkOS |
| SDK TypeScript v2 em pacotes, só ESM: `@modelcontextprotocol/server` e `@modelcontextprotocol/client` | 4sysops (trecho sobre betas); docs oficiais do SDK v2 |
