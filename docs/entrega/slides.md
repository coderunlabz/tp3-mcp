# Seminário MCP — roteiro e slides (E1)

Rascunho em Markdown para revisão do Nicolas, antes de virar artefato de slides. Disciplina CC05Z, seminário de 06/10/2026, com 20 a 30 minutos contando a demo ao vivo. Escrito em 01/10/2026 sobre o servidor do commit `a57434b`.

- Arco: problema, ideia, arquitetura, três peças, evolução, demo, limites.
- Cada slide traz a conclusão no título, o que aparece na tela, a fala e o tempo.
- Seções: Roteiro e tempos, Slides, Roteiro da demo, Plano B, Perguntas previsíveis, Pendências, Fontes.

## Roteiro e tempos

| # | Parte | Tempo |
|---|---|---|
| 1 | O problema | 1,5 min |
| 2 | A ideia | 2 min |
| 3 | De onde veio | 1 min |
| 4 | Os três papéis | 2 min |
| 5 | Local e remoto | 1,5 min |
| 6 | As três peças | 3 min |
| 7 | Julho de 2026: sem sessão | 2 min |
| 8 | O efeito e o custo | 1,5 min |
| 9 | A demo é o próprio servidor | 1 min |
| 10 | Demo ao vivo | 8 min |
| 11 | Limites | 2 min |
| 12 | Fechamento | 1,5 min |

Total: 27 minutos, com 3 de folga para perguntas dentro dos 30. Se o tempo apertar, cortar os slides 3 e 8. Nunca cortar a demo (10) nem os limites (11).

Enquadramento: se o professor cobrar uma categoria do PDF da disciplina, MCP é um protocolo de **interoperabilidade**, como HTTP. A categoria mais próxima na lista antiga é Agentes.

---

## Slides

### Slide 1 — Cada chat conectava cada ferramenta de um jeito (1,5 min)

**Na tela**
- Figura: 3 chats e 3 ferramentas, com 9 setas cruzadas.
- Legenda: "3 chats × 3 ferramentas = 9 integrações. Com 10 e 10, seriam 100."

**Fala**
Comece perguntando quem já usou mais de um chat com IA. Cada um deles precisava de uma ligação própria com o Drive, o GitHub, a agenda. O número de ligações crescia multiplicando. Os números são um exemplo de conta, não um dado medido. O anúncio de lançamento descreve o mesmo problema: um conector separado para cada fonte de dados.

### Slide 2 — Um padrão único troca multiplicar por somar (2 min)

**Na tela**
- Figura: os mesmos 3 chats e 3 ferramentas, agora ligados a uma barra no meio, com 6 setas.
- Legenda: "10 chats + 10 ferramentas = 20 ligações, não 100."
- Imagem de uma tomada: o servidor é a tomada, o chat é o aparelho.

**Fala**
A ideia é a da tomada. Se todo aparelho usa o mesmo plugue, não precisa de adaptador para cada par. Cada chat aprende a falar o protocolo uma vez; cada ferramenta aprende uma vez. Esta é a imagem que a turma vai levar.

### Slide 3 — Nasceu em novembro de 2024 como padrão aberto (1 min)

**Na tela**
- Linha do tempo: 25/11/2024, lançamento; 28/07/2026, revisão mais recente.
- Texto: "Criado na Anthropic, aberto desde o início."
- Linha: "Quase meio bilhão de downloads por mês nos SDKs principais (blog oficial, jul/2026)."

**Fala**
Foi publicado em 25 de novembro de 2024 pela Anthropic, como padrão aberto. O número de downloads vem do blog do próprio projeto; digo isso para não parecer dado independente. A história dele não é só a mudança de julho, que vem depois, como um capítulo.

### Slide 4 — Três papéis: host, cliente e servidor (2 min)

**Na tela**
- Figura: um host com três clientes, cada cliente ligado a um servidor.
- Três rótulos: "Host = o aplicativo onde você conversa", "Cliente = o conector dentro do host", "Servidor = quem oferece os dados e as ações".

**Fala**
O host é o chat. Dentro dele vivem vários clientes, e cada cliente fala com exatamente um servidor. A especificação também diz que um servidor não deve ler a conversa inteira nem enxergar outros servidores. Guarde essa frase para o slide de limites.

### Slide 5 — Local usa stdio; remoto usa HTTP, e a demo é remota (1,5 min)

**Na tela**
- Duas colunas: "Local (stdio): o chat abre o programa no seu computador" e "Remoto (HTTP): o chat chama um endereço na internet".
- Destaque na segunda: "Nesta demo, o endereço público é `https://…trycloudflare.com/mcp`."

**Fala**
No modo local, o chat inicia o servidor como um programa filho. No remoto, cada mensagem é um pedido HTTP para um endereço único. A demo usa o remoto, e por isso precisamos de um túnel: o servidor roda no meu notebook, e o túnel dá um endereço público a ele.

### Slide 6 — O servidor oferece três peças, e cada uma tem um dono (3 min)

**Na tela**
- Tabela de três linhas:
  - Tools: ações. Quem decide: **o modelo**.
  - Resources: arquivos e dados. Quem decide: **o aplicativo ou a pessoa abre; o modelo pode ler**.
  - Prompts: atalhos prontos. Quem decide: **a pessoa**.
- Rodapé: "Nossa demo: 5 tools, 12 resources, 6 prompts."

**Fala**
Pense em um restaurante. As tools são o que a cozinha faz quando o garçom pede. Os resources são o cardápio que você pode abrir. Os prompts são os combos que o cliente escolhe. A analogia tem limite: nos resources, a especificação não diz que é sempre o chat quem decide; diz que servem à pessoa ou ao modelo.

### Slide 7 — Em julho de 2026, o protocolo largou a sessão (2 min)

**Na tela**
- Antes (nov/2025): abrir sessão (`initialize`), receber um número de sessão, repetir em toda mensagem.
- Depois (28/07/2026): cada pedido leva tudo que o servidor precisa, no campo `_meta`.
- Legenda: "Fonte: blog oficial do MCP, 21/05 e 28/07/2026."

**Fala**
Antes, a conversa começava com um aperto de mão e um número de sessão que ia em todo pedido. Isso prendia o cliente a uma instância do servidor. Na revisão de 28 de julho de 2026, o aperto de mão e a sessão saíram. Cada pedido traz a versão do protocolo, o que o cliente sabe fazer e, por recomendação, quem ele é.

### Slide 8 — Sem sessão, qualquer pedido cai em qualquer servidor, mas queda perde pedido (1,5 min)

**Na tela**
- Esquerda: "Ganho: escala atrás de um balanceador comum; cabeçalhos `Mcp-Method` e `Mcp-Name` para rotear."
- Direita: "Custo: stream quebrado perde o pedido; o cliente refaz com novo número."
- Rodapé: "Tasks e MCP Apps ficam como extensões. Autorização se aproxima de OAuth."

**Fala**
O ganho é operar como uma API HTTP comum. O custo é que uma queda de rede perde o pedido em andamento, e quem criou ferramentas que fazem coisas, como cobrar ou gravar, precisa proteger contra repetição. Na nossa demo isso aparece na própria tool que grava dúvidas. Falo da extensão em uma frase: Tasks saiu do núcleo nesta revisão e MCP Apps já era uma extensão.

### Slide 9 — A demo é o próprio servidor, e vocês vão usar (1 min)

**Na tela**
- Endereço do servidor em letras grandes (com QR code).
- Três passos: "Adicione como conector remoto. Autenticação: nenhuma. Abra um chat novo."
- Aviso: "Sem nome, sem IP. Dúvidas somem quando o servidor reinicia."

**Fala**
O servidor guarda os slides, o manual e as referências deste seminário. Vocês vão perguntar, mandar dúvida anônima e eu vejo, no meu chat, o que a sala não entendeu. O programa não guarda nome nem IP.

### Slide 10 — Demo ao vivo (8 min)

Ver o roteiro da demo abaixo. Na tela fica o terminal com o log do servidor, uma linha por chamada, sem IP.

### Slide 11 — O MCP não resolve confiança, custo nem o que não testamos (2 min)

**Na tela**
- "Uma tool pode agir fora do chat. Conectar é confiar no servidor."
- "Chamada demais custa tempo e dinheiro."
- "O protocolo não impõe as regras de segurança; quem implementa precisa construir."
- "Nesta demo, não testamos: rede da UTFPR, todos os chats da turma, 30 conexões ao mesmo tempo."

**Fala**
A especificação trata tools como execução de código arbitrário e pede consentimento da pessoa. Isso não é detalhe: se você conecta um servidor, está confiando nele. O nosso só lê arquivos de uma pasta e grava uma dúvida em memória. Diga claramente o que não foi testado, em vez de esperar a pergunta.

### Slide 12 — O que levar daqui (1,5 min)

**Na tela**
- Uma frase: "O MCP é a tomada entre chats e ferramentas."
- Três itens: "Papel: host, cliente, servidor", "Peças: tools, resources, prompts", "História: sem sessão desde 28/07/2026".
- Link do GitHub do projeto (pendente: o repositório está privado).

**Fala**
Resuma em uma frase e abra para perguntas. Se sobrar tempo, deixe a tela com o log do servidor mostrando os clientes que conectaram.

---

## Roteiro da demo (8 min)

Pré-requisito: túnel aberto numa janela própria, endereço conferido em `url-atual.txt`, conector ligado no chat que você vai usar, terminal do servidor visível.

| Min | Passo | O que dizer ou pedir no chat | O que deve aparecer |
|---|---|---|---|
| 0:00 | Mostrar o log | "Cada linha aqui é uma chamada. Sem IP." | Linhas com nome do cliente, método, alvo, ok e tempo |
| 1:00 | Pergunta com fonte | "O que o acervo diz sobre a revisão de julho?" | Resposta que cita `slides/05-evolucao.md` |
| 2:30 | Pergunta fora do acervo | "O que o acervo diz sobre churrasco?" | "não consta no acervo" e a lista de temas |
| 3:30 | A turma manda dúvidas | Cada um: "Registra uma dúvida anônima: …" (idealmente com uma palavra como arquitetura ou árvore) | "Dúvida registrada sem identificação." |
| 5:00 | Sala como apresentador | "Estou apresentando; mostra as dúvidas da sala" | Dúvidas agrupadas por assunto, com horário e sem nome |
| 6:30 | Checagem | "Me faz uma checagem de entendimento" | Pergunta do slide 4 (quem decide qual tool chamar); depois "certo" ou "errado", sem mostrar o gabarito |
| 7:30 | Fechar no log | "Vêem os nomes? Chats diferentes, as mesmas tools." | Linhas de mais de um cliente |

Dicas de ensaio:
- Antes de usar atalhos (prompts) na frente da turma, confirme que o chat deles aparece. Se não aparecer, peça em palavras: o resultado é o mesmo.
- O agrupamento por assunto depende da dúvida conter uma palavra do tema. Combine dois ou três exemplos antes.
- O servidor não guarda dados ao reiniciar: não reinicie nada durante a demo.

## Plano B

1. **Endereço público caiu ou mudou.** O script reinicia o túnel e grava o endereço novo em `url-atual.txt`. Trocar o endereço no conector leva alguns minutos; avisar a turma e seguir pelo item 2 enquanto isso.
2. **Sem chat de nuvem.** Usar o Cursor local, que conecta em `http://127.0.0.1:3000/mcp`, sem túnel. Os mesmos passos da demo valem.
3. **Sem rede ou sem cliente.** Mostrar um vídeo gravado da demo local. **Pendente: gravar o vídeo (3 a 4 min).**

Antes da aula: notebook na tomada, suspensão desligada, terminal do túnel aberto fora do Cursor e dados móveis no celular como reserva.

## Perguntas previsíveis

| Pergunta | Resposta curta |
|---|---|
| "MCP é diferente de uma API normal?" | Usa HTTP e JSON, mas padroniza como o chat descobre e chama ferramentas. A WorkOS (fonte comercial) lista o que sobra de diferente: descoberta em tempo de execução, semântica uniforme de tools e autenticação definida. |
| "Qual categoria do PDF?" | Interoperabilidade; se for obrigatório, Agentes. |
| "É seguro?" | O protocolo não garante sozinho. Tools são execução de código; é preciso consentimento e confiança no servidor. |
| "Por que o servidor não guarda as dúvidas em disco?" | Escolha de privacidade da demo: sem nome, sem IP, sem persistência. Reiniciar zera. |
| "E se a URL mudar?" | O túnel rápido muda o endereço ao reiniciar. Por isso o plano B local. |
| "Por que stateless?" | Para escalar atrás de balanceador comum. O custo é perder o pedido numa queda de stream. |
| "Por que não usar MCP Apps na demo?" | O chat da turma pode não ter suporte. A demo não depende de interface. |
| "Quem criou o MCP?" | A Anthropic, em 25/11/2024; o projeto é aberto. |
| "O que você não testou?" | Rede da UTFPR, os atalhos nos chats de nuvem, e o acervo de outra pessoa trocando a pasta `conteudo/`. |

## Pendências antes de terça

- Corrigir os atalhos com número (`mostra-o-slide`, `me-guia-na-instalacao`) e testá-los em chat real.
- Gravar o vídeo do plano B.
- Ensaio cronometrado de 20 a 30 minutos.
- Decidir se o repositório fica privado com o professor convidado ou público (o E1 pede o link).
- Ajustar o acervo (`conteudo/slides/04-primitivos.md`): resources não são "arquivos que o chat abre" por definição da especificação.
- Conferir se o log mostra o nome de cada chat nas chamadas depois da primeira (hoje pode aparecer o aplicativo, como `node`).

## Fontes

Todas conferidas em 01/10/2026, resumidas em `docs/fontes/` (comece por `mapa-evolucao.md`).

- Especificação 2026-07-28: https://modelcontextprotocol.io/specification/2026-07-28
- Blog oficial, versão final: https://blog.modelcontextprotocol.io/posts/2026-07-28/
- Blog oficial, candidata: https://blog.modelcontextprotocol.io/posts/2026-07-28-release-candidate/
- Anúncio de lançamento: https://www.anthropic.com/news/model-context-protocol
- WorkOS: https://workos.com/blog/mcp-stateless-spec-2026-07-28
- Estado do código e testes: `docs/pipeline/p6.md`
