# Acervo MCP

Um servidor [MCP](https://modelcontextprotocol.io) pequeno, em TypeScript, que serve de demonstração para o seminário sobre MCP da disciplina CC05Z (Tópicos em Programação 3, UTFPR, Prof. Diego Antunes). O conteúdo que ele entrega é o próprio material do seminário: você conecta um chat de IA ao servidor e pergunta sobre a aula.

**Autor:** Nicolas Martins de Oliveira

## Em 1 minuto

```bash
git clone https://github.com/coderunlabz/tp3-mcp.git
cd tp3-mcp
npm install
npm start
```

O servidor sobe em `http://127.0.0.1:3000/mcp`. Em outro terminal, confira:

```bash
npm run listar
```

Se aparecerem as listas de `tools`, `prompts` e `resources`, está funcionando. Depois é só conectar um chat (seção [Conectar um chat](#conectar-um-chat)).

## O que o servidor oferece

| Tipo | Nome | Para que serve |
|---|---|---|
| Tool | `consultar_acervo` | Responde uma dúvida geral devolvendo os arquivos do acervo (pasta, tema, fonte, autor). O chat explica. Sem material, diz "não consta no acervo". |
| Tool | `registrar_duvida` | Envia uma dúvida ao apresentador. Só deve ser usada quando a pessoa pedir o envio. Nome é opcional. |
| Tool | `ajudar_ideia_mcp` | Ajuda a montar uma ideia de servidor MCP. Só grava se a pessoa concordar (`gravar`). |
| Tool (só local) | `ver_duvidas_da_sala` | Lista as dúvidas recebidas. **Só aparece em acesso local**; some quando o acesso é público. |
| Resources | `acervo://slides/…`, `acervo://manual/…`, `acervo://referencias/…` | Cada arquivo do acervo, para o chat abrir. |
| Prompts | `comece-aqui`, `explica-como-se-eu-tivesse-5-anos`, `mostra-o-slide`, `me-guia-na-instalacao`, `onde-posso-ler-mais` | Atalhos que a pessoa escolhe. |

Quando a pergunta chega vaga (uma palavra só) e o chat declara que sabe mostrar perguntas do servidor, o servidor faz uma pergunta de volta, uma vez. Se o chat não suporta, ele devolve o acervo com uma dica.

## Requisitos

- **Node.js 22.9 ou superior.** Os scripts usam `--experimental-strip-types` e `--env-file-if-exists`, que não existem no Node 20. Confira com `node -v`.
- **npm** (vem com o Node) e **git**.
- **Só para compartilhar com a turma:** [`cloudflared`](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/) instalado. Não precisa de conta nem de token.

## Instalação

```bash
git clone https://github.com/coderunlabz/tp3-mcp.git
cd tp3-mcp
npm install
```

## Configuração

Funciona sem configurar nada. Para mudar algo, copie o modelo e edite:

```bash
cp .env.example .env      # no PowerShell: Copy-Item .env.example .env
```

| Variável | Padrão | O que faz |
|---|---|---|
| `PORT` | `3000` | Porta do servidor. |
| `LOG_ARQUIVO` | vazio | Vazio grava o log das chamadas em `registro/chamadas.jsonl`. `off` deixa o log só no terminal. O log não guarda argumentos nem IP. |
| `HOSTS` | vazio | Endereços públicos aceitos, separados por vírgula. O `npm run tunel` preenche sozinho. |
| `TUNEL_TENTATIVAS`, `TUNEL_PAUSA_MS` | `8`, `8000` | Tentativas e pausa (ms) na checagem do túnel. |
| `REGISTRO` | `registro/` | Pasta onde ficam as dúvidas, as ideias e o log. |
| `CONTEUDO` | `conteudo/` | Pasta do acervo (ver [Trocar o conteúdo](#trocar-o-conteúdo)). |

## Rodar

```bash
npm start
```

Saída esperada (a primeira linha traz a porta):

```
local em http://127.0.0.1:3000/mcp
```

Pare com `Ctrl+C`.

## Testar

**1. O servidor responde e lista tudo** (com o servidor rodando em outro terminal):

```bash
npm run listar
```

Mostra uma linha de `tools`, uma de `prompts` e uma de `resources`.

**2. As tools esperadas estão lá:**

```bash
npm run verificar
```

Em acesso local confere as 4 tools; imprime `acesso local (4 tools)`. Com `HOSTS` definido, confere as 3 públicas e que a privada não aparece. Se algo estiver errado, imprime `FALHOU` e o que esperava.

**3. No chat** (depois de [conectar](#conectar-um-chat)), tente:

- `o que é um resource?` → o chat chama `consultar_acervo` e explica com base no acervo.
- Escolha o atalho `comece-aqui`.
- Atalho `mostra-o-slide` com "o das peças" → abre o slide de primitivos.
- `manda esta dúvida para o apresentador: …` → chama `registrar_duvida`.

Depois, no terminal local, confira que a dúvida chegou em `registro/duvidas.jsonl`.

**4. Provas de desenvolvimento e carga** (detalhes no código de cada arquivo em `scripts/`):

```bash
npm run prova      # conferências do comportamento (túnel simulado, erros, migração, concorrência)
npm run p6         # ensaio completo
npm run carga      # várias consultas em paralelo; precisa do servidor rodando (CARGA=30 para 30)
```

## Conectar um chat

O servidor fala **Streamable HTTP** no caminho `/mcp`, sem autenticação (None). Cada aplicativo se conecta de um jeito, e nem todos suportam tudo (resources, prompts e perguntas do servidor variam). No ensaio, o ChatGPT (plano gratuito) e o Perplexity chamaram `consultar_acervo`; os demais não foram todos testados.

| Aplicativo | Como |
|---|---|
| Cursor | Já existe `.cursor/mcp.json` apontando para `http://127.0.0.1:3000/mcp`. Ligue o conector e **abra um chat novo**. |
| Claude, Perplexity | Adicione um conector remoto/personalizado com a URL (`…/mcp`) e autenticação **None**. |
| ChatGPT | Adicione um conector MCP com a URL e autenticação **None**. Só o texto das tools é usado. |
| Cliente em código | Use `@modelcontextprotocol/client` (veja `scripts/listar.ts` como exemplo). |

Aplicativos de nuvem (Claude, ChatGPT, Perplexity) **não alcançam `127.0.0.1`**: para eles use o túnel da próxima seção.

## Compartilhar com a turma (túnel temporário)

Para o chat de outra pessoa alcançar o seu computador, abra um túnel gratuito da Cloudflare. **Não rode `npm start` ao mesmo tempo:** o comando abaixo já sobe o servidor e o túnel.

```bash
npm run tunel
```

A URL pública (`https://<nome>.trycloudflare.com/mcp`) aparece no terminal e é gravada em `url-atual.txt`. No Windows, `powershell -File scripts/manter-aberto.ps1` abre o túnel numa janela própria, que continua aberta se você fechar o editor.

Pelo túnel saem só as **3 tools públicas**: `ver_duvidas_da_sala` não é listada e a chamada é recusada.

Limites do túnel gratuito (Quick Tunnel): **não tem garantia de disponibilidade**, a URL muda se o `cloudflared` for reiniciado e a Cloudflare não suporta conexão contínua (SSE) nele. Em ensaio de 02–03/10/2026, 30 consultas seguidas pelo túnel passaram sem falha; isso não é garantia. Para a demo, deixe o computador na tomada e sem suspender:

```powershell
powercfg /change standby-timeout-ac 0
powercfg /change hibernate-timeout-ac 0
```

## Onde ficam os dados

Tudo na pasta `registro/` (fora do Git):

| Arquivo | Conteúdo |
|---|---|
| `duvidas.jsonl` | Dúvidas enviadas por `registrar_duvida` (texto, nome opcional, horário). Sem IP. |
| `ideias.jsonl` | Ideias gravadas por `ajudar_ideia_mcp` com consentimento. |
| `chamadas.jsonl` | Log das chamadas (sem argumentos, sem IP). |

Reiniciar o servidor **não apaga** esses arquivos. Para zerar a lista de dúvidas guardando as antigas, **pare o servidor** e rode:

```bash
npm run arquivar:duvidas
```

Os arquivos vão para `registro/historico/<data-hora>/`. Ideias e logs ficam onde estão.

## Trocar o conteúdo

O acervo é a pasta `conteudo/`, em arquivos `.md` com um cabeçalho (frontmatter):

```markdown
---
tema: primitivos
fonte: spec MCP 2026-07-28
autor: Nicolas
---

Texto que o chat vai explicar.
```

Pastas: `slides/`, `manual/`, `referencias/`, mais `sobre.md`. Reinicie o servidor depois de editar. Arquivo sem `autor` não é carregado e o servidor avisa. Atenção a dois nomes que o código usa: o atalho `mostra-o-slide` associa "quatro/4/o das peças" a `slides/04-primitivos.md`, e o roteiro de `ajudar_ideia_mcp` lê os limites do primeiro arquivo de `slides/` que começa com `06-`. Para usar outra pasta, defina `CONTEUDO`.

## Segurança e limites

- O servidor valida `Host` e `Origin`, não grava IP e não guarda o conteúdo das chamadas no log.
- Não há autenticação: qualquer pessoa com a URL do túnel usa as 3 tools públicas. Use só para demonstração e encerre o túnel depois.
- `registrar_duvida` grava texto que a própria pessoa escreve; não peça nem digite dados pessoais.
- Quick Tunnel não tem garantia de disponibilidade; plano B é rodar tudo local.
- A pergunta do servidor (elicitation) só funciona em chats que declaram esse recurso, e não foi testada em todos.

## Estrutura

```
src/          servidor (criarServidor.ts: tools, resources e prompts)
conteudo/     acervo servido pelo MCP (slides, manual, referências)
scripts/      túnel, verificações, provas e ensaio
registro/     dúvidas, ideias e log (criada na primeira gravação; não vai ao Git)
.env.example  modelo de configuração
```

## Referências

- Site e especificação oficiais: <https://modelcontextprotocol.io>
- Anúncio original (Anthropic, 25/11/2024): <https://www.anthropic.com/news/model-context-protocol>
