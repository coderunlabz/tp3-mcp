# Plano do servidor (TP3)

Um processo TypeScript. Pacotes do P0: `@modelcontextprotocol/server` 2.2.0, `@modelcontextprotocol/node` 2.1.0, `zod` 4.6.5.

## Papel

O acervo é material de aula no chat. O servidor entrega arquivos e guarda o que a sala produz. O modelo explica. O servidor não escolhe trecho por palavra.

## Arquitetura

- `src/criarServidor.ts` — 4 tools, resources, atalhos
- `src/servir.ts` — HTTP local; `ver_duvidas_da_sala` só se o `Host` for localhost
- `src/janelas.ts` — HTML experimental (MCP Apps) em duas tools
- `scripts/tunel.ts` — túnel rápido; `url-atual.txt`
- `conteudo/` — slides, manual, referências
- `registro/` — dúvidas e ideias (gitignore; fora quando o repo abrir)

Tools: `consultar_acervo`, `registrar_duvida`, `ver_duvidas_da_sala` (local), `ajudar_ideia_mcp`.

Atalhos: `comece-aqui`, `explica-como-se-eu-tivesse-5-anos`, `mostra-o-slide` (texto livre), `me-guia-na-instalacao` (texto livre), `onde-posso-ler-mais`.
