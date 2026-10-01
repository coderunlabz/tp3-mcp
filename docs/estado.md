# Estado — TP3 (CC05Z)

> Ter, 13h50–17h30, C203. Prof. Diego Antunes.

## Avaliação

- **E1 — Seminário (60%):** slides + demo (exemplo sugerido: app ToDo) +
  link do GitHub. **Data: 06/10/2026. Nicolas apresenta primeiro.**
- **E2 — Manual técnico (40%):** PDF com instalação, configuração e exemplo.

## Decisões

- Tema: MCP (Model Context Protocol).
- Stack da demo: TypeScript, SDK oficial.
- Cliente: qualquer chat compatível (Claude, ChatGPT, Cursor, Perplexity).
  Sem cliente próprio.
- Transporte: Streamable HTTP desde o início; local vira `localhost`.
- Fase 1: local, Nicolas como servidor e cliente (Cursor, Claude Desktop ou
  MCP Inspector, que aceitam servidor local).
- Fase 2: VPS Hostinger com Docker, domínio e HTTPS (claude.ai e ChatGPT
  exigem URL pública com HTTPS). O template MCP da Hostinger é Python:
  aproveitar só a infra.
- Repositório da demo é público; nada comercial nele.
- **Ideia da demo (29/09/2026):** servidor MCP que acumula o trabalho do
  Nicolas (slides, manual, referências) e o entrega por atalhos prontos
  (prompts como `/comece-aqui` e `/me-guia-na-instalacao`), tools de intenção
  (`consultar_acervo`, `registrar_duvida`, `ver_duvidas_da_sala`,
  `checar_entendimento`) e resources. Outro aluno troca a pasta de conteúdo
  pelo dele. Na apresentação, a turma manda dúvidas anônimas pelo próprio chat
  e o servidor mostra o que a sala não entendeu. Detalhes em `plano.md`.
- **Exposição em dois módulos (29/09/2026):** túnel (ngrok/Cloudflare) como
  reserva e VPS como principal, sobre o mesmo processo. No código isso não vira
  três pacotes: é o mesmo `src/` com outra URL.
- **Simplicidade (29/09/2026):** vale para a implementação. Comandos, conteúdo
  e tools do plano permanecem. Pipeline em `persistencias/pipeline/`. P0
  fechado: spec 2026-07-28, SDK v2 (`@modelcontextprotocol/server` 2.2.0,
  `@modelcontextprotocol/node` 2.1.0, `zod` 4.6.5).
- **Contrato (29/09/2026):** P1 fechado em `pipeline/p1.md`. O tom dos prompts
  continua rascunho.
- **Servidor, conteúdo e sala (30/09/2026):** P2, P3 e P4 fechados em
  `pipeline/p2.md`, `p3.md` e `p4.md`. Código na pasta do trabalho.
- **Cliente real (01/10/2026):** P5 fechado em `pipeline/p5.md`. Em perguntas
  misturadas, o modelo usou as tools certas sem ajuste de descrição.

## Pendências

- Slides e roteiro (E1); manual técnico em PDF (E2).
- Testar acesso pela rede da UTFPR e com 20+ conexões.
- Deploy na VPS só com ok do Nicolas.
