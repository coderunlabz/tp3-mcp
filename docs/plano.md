# Plano — servidor MCP do TP3 (acervo da turma com atalhos prontos)

Servidor MCP em TypeScript que guarda o trabalho de Nicolas (slides, manual, referências) e o entrega por atalhos prontos que se explicam sozinhos. Qualquer aluno pode trocar a pasta de conteúdo pelo material dele. Duas formas de expor: túnel (ngrok/Cloudflare) e VPS.

- Ideia, arquitetura em 3 pacotes, prompts, tools, resources, fases, riscos e pendências.
- Revisado em 29/09/2026: a versão anterior copiava nomes de comando do Linux; o Linux é só inspiração.

## Ideia

O servidor usa as três peças do MCP, cada uma no seu papel. O aluno conecta qualquer chat e já encontra atalhos que ensinam o assunto sozinhos. A inteligência do produto mora no servidor: conteúdo com fonte, gabarito escondido, sala de dúvidas e recusa do que não está no acervo. O chat cliente é qualquer um.

Propósito: outro aluno baixa, troca a pasta de conteúdo pelo material dele e ganha o mesmo servidor para estudar ou apresentar. Repositório público, sem fim comercial.

## Arquitetura (3 pacotes)

- `packages/core`: o servidor. Função `criarServidor(pastaConteudo)`. Não conhece transporte nem rede. Prompts, resources e tools moram aqui.
- `packages/entrada-tunel`: sobe o core em `localhost` (Streamable HTTP) e documenta o ngrok/Cloudflare Tunnel. Reserva e ensaio.
- `packages/entrada-vps`: o mesmo core em Docker, atrás de proxy HTTPS (Caddy), domínio próprio. Principal.
- `conteudo/`: pasta separada do código. Markdown com frontmatter (tema, fonte, autor). É o que o outro aluno troca.

Regra: os módulos de entrada só cuidam de transporte, porta, HTTPS e token. Nenhuma regra de negócio neles.

## Prompts (o usuário escolhe; são os atalhos prontos)

- `/comece-aqui`: explica o servidor, o que existe nele e como usar, em linguagem leiga. Faz o papel de "mostrar os outros atalhos".
- `/explica-como-se-eu-tivesse-5-anos`: o assunto sem jargão, com uma analogia.
- `/mostra-o-slide`: conta o slide N em voz de apresentação.
- `/me-guia-na-instalacao`: conduz o manual, um passo por vez, perguntando se deu certo.
- `/prepara-minha-prova`: monta um estudo a partir do acervo.
- `/onde-posso-ler-mais`: referências, com o motivo de cada uma.

Nomes e tom são rascunho; a escolha final é criativa e de Nicolas.

## Tools (o modelo decide chamar; nome de intenção)

- `consultar_acervo`: responde o que o material diz sobre uma pergunta, com trecho e fonte. Se não achar, diz que não consta.
- `registrar_duvida`: envia a dúvida anônima da pessoa à sala.
- `ver_duvidas_da_sala`: só o apresentador; devolve as dúvidas agrupadas por assunto.
- `checar_entendimento`: faz uma pergunta e confere a resposta no servidor. O modelo não vê o gabarito.
- `sobre_este_acervo`: título, autor, versão e o que está carregado.

## Resources (o chat abre o conteúdo)

Slides, manual e referências expostos como recursos lidos pelo cliente.

## Regras do servidor

- Nada sai sem fonte; tema fora do acervo recebe "não consta no acervo" com sugestão, sem completar com conhecimento externo.
- Sala de dúvidas: só texto e horário, sem nome nem IP em registro. Dados em memória, apagados ao encerrar.
- Sem dado real de pessoa. Sem uso comercial.

## Fases

1. **Base (core local).** Esqueleto TS com SDK oficial, `/comece-aqui`, `consultar_acervo`, `sobre_este_acervo`, conteúdo de exemplo. Teste com MCP Inspector e Cursor em `localhost`.
2. **Conteúdo do Nicolas.** Slides, referências e esqueleto do manual em `conteudo/`; demais prompts e resources.
3. **Sala.** `registrar_duvida`, `ver_duvidas_da_sala`, `checar_entendimento`; agrupamento simples de dúvidas parecidas.
4. **Módulo túnel.** Entrada local + guia ngrok/Cloudflare Tunnel; testar com um colega em outro dispositivo.
5. **Módulo VPS.** Docker + Caddy + domínio na Hostinger; token de acesso; teste com 20+ conexões. Publicar só com ok do Nicolas.
6. **Ensaio e reserva.** Teste na rede da UTFPR; vídeo de reserva; slides e roteiro (E1); manual em PDF (E2).

Prazo: E1 em 06/10/2026. VPS no ar alguns dias antes.

## Riscos e decisões pendentes

- Chats web (claude.ai, ChatGPT) conectam pela nuvem deles: exigem URL pública com HTTPS. A rede local da UTFPR só serve para clientes de desktop, e o Wi-Fi pode isolar aparelhos. Testar antes.
- Conector personalizado pode exigir plano específico em alguns chats: conferir na documentação atual.
- Autenticação: token simples por sala, sem login. Confirmar se basta.
- Suporte a prompts varia entre clientes; cada atalho deve ter equivalente por tool.
- Agrupamento de dúvidas e `checar_entendimento`: começar com regra simples, sem modelo no servidor.

## Fontes

- Decisões de Nicolas em 29/09/2026: base de servidor, dois módulos de exposição, atalhos prontos com Linux só como inspiração, acervo do próprio trabalho substituível.
- `estado.md` e `personagens/utfpr/tp3/PAPEL.md`.
