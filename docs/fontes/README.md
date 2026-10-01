# Fontes da evolução do MCP (fora do acervo)

Índice único da pasta. Os resumos são datados de 01/10/2026 e não são transcrição integral. A conferência de cada afirmação dos slides está em `mapa-evolucao.md`; comece por ele.

- Seções: Arquivos que valem, Duplicados, Cuidados.

## Arquivos que valem

| Arquivo | O que é |
|---|---|
| `mapa-evolucao.md` | Cada afirmação dos slides 03, 04 e 05 ligada à fonte, com os três ajustes de redação |
| `spec-2026-07-28.md` | Especificação: visão geral, arquitetura, transportes e lista oficial de mudanças |
| `blog-2026-07-28-release.md` | Blog oficial, versão final |
| `blog-2026-05-21-release-candidate.md` | Blog oficial, candidata |
| `blog-2026-06-29-sdk-betas.md` | Blog oficial, SDKs beta (base do slide do SDK v2) |
| `workos-2026-09-16.md` | Artigo da WorkOS, fonte secundária e comercial |
| `anthropic-2024-11-25-lancamento.md` | Anúncio de lançamento: fonte do "novembro de 2024" |
| `4sysops-sdk-v2.md` | 4sysops, com a URL exata. Só o trecho indexado na busca foi lido, porque a página bloqueou o acesso |

## Duplicados

Estes três foram escritos em paralelo (commit `c528140`) e dizem o mesmo que os arquivos acima. Pode apagar com `git rm`; o histórico guarda o conteúdo.

- `blog-mcp-2026-05-21-e-2026-07-28.md` (coberto pelos dois arquivos de blog)
- `spec-2026-07-28-overview.md` (coberto por `spec-2026-07-28.md`; o cuidado dele está abaixo)
- `workos-mcp-stateless-2026-07-28.md` (coberto por `workos-2026-09-16.md`)

## Cuidados

- A página de visão geral da especificação ainda diz que extensões são "negociadas na inicialização", frase que sobrou da versão anterior, já que o handshake saiu. Não citar essa linha no seminário.
- "Lançado em novembro de 2024" agora tem fonte (`anthropic-2024-11-25-lancamento.md`). O blog da revisão não data o lançamento.
- "Sem retomada de stream" está confirmado na lista oficial de mudanças, não só na WorkOS.
- O arquivo do acervo `conteudo/referencias/4sysops-sdk.md` cita uma data (17/07/2026) que não foi confirmada. A URL achada é de um artigo sobre a especificação e os SDKs beta. Conferir a data antes de citar.
