# Pipeline de implementação — TP3

Simplicidade só no código. Comandos, conteúdo e tools ficam os do `plano.md`. Cada etapa concluída ganha um `pN.md` nesta pasta.

## O que o servidor faz

Prompts: `/comece-aqui`, `/explica-como-se-eu-tivesse-5-anos`, `/mostra-o-slide`, `/me-guia-na-instalacao`, `/prepara-minha-prova`, `/onde-posso-ler-mais`.

Tools: `consultar_acervo`, `registrar_duvida`, `ver_duvidas_da_sala`, `checar_entendimento`, `sobre_este_acervo`.

Resources: slides, manual e referências. A pasta `conteudo/` é o que outro aluno troca.

## O que o código evita

Um diretório `src/`, não três pacotes. Uma função `criarServidor(pastaConteudo)`. Sem camada extra entre o arquivo markdown e a tool. Túnel e VPS são o mesmo processo com outra URL, e só entram depois do local responder no Inspector.

## Etapas

### P0 — Conferir a versão

Feito. Ver `p0.md`.

### P1 — Contrato

Nome, descrição, schema e erro de cada prompt, tool e resource. Formato de um arquivo em `conteudo/`. Sem código.

Saída: `p1.md`.

### P2 — Servidor local mínimo que já lista tudo

TypeScript, ESM, pacotes do P0. As cinco tools e os seis prompts registrados, mesmo que alguns ainda leiam conteúdo de exemplo. Sala em memória.

Saída: sobe em `localhost` e o Inspector lista prompts, tools e resources.

### P3 — Conteúdo real

Material do Nicolas em `conteudo/`. `consultar_acervo` cita trecho e diz "não consta" quando não achar. Resources abrem o arquivo certo.

Saída: uma pergunta dentro e uma fora do acervo dão a resposta certa.

### P4 — Sala e entendimento

`registrar_duvida`, `ver_duvidas_da_sala` e `checar_entendimento` com a regra já escrita no plano: sem nome, sem gabarito vazado, agrupamento simples.

Saída: dúvidas de exemplo aparecem agrupadas e uma checagem certa e uma errada respondem diferente.

### P5 — Cliente real

Inspector em cada tool, mais Cursor ou Claude Desktop. Três perguntas que misturam consulta e dúvida. Ajustar descrição e erro se o modelo escolher a tool errada.

### P6 — Alguém de fora

Guia curto de túnel e um teste em outro aparelho. VPS só com ok do Nicolas, se o túnel não bastar para 06/10.

## Fontes

- `plano.md` e `p0.md`.
- Correção de Nicolas em 29/09/2026: simplicidade é do código; comandos, trabalhos e tools permanecem.
