# Blog oficial — candidata a versão (21/05/2026)

Resumo próprio do post que apresentou a candidata da revisão 2026-07-28, publicado em 21/05/2026. Acessado em 01/10/2026. Serve de base para o capítulo "evolução": mostra que a mudança de julho foi anunciada com dez semanas de antecedência.

- Seções: Linha do tempo, Antes e depois, Extensões, Depreciações, Fonte.

## Linha do tempo

A candidata foi travada em 21/05/2026 e a versão final saiu em 28/07/2026. As dez semanas serviam para os mantenedores dos SDKs validarem em cargas reais. O post avisa que a revisão tem mudanças que quebram compatibilidade e a descreve como a maior desde o lançamento.

## Antes e depois

Na revisão de 25/11/2025, chamar uma tool exigia abrir uma sessão: um pedido `initialize`, uma resposta com `Mcp-Session-Id` e todos os pedidos seguintes presos àquela instância do servidor. Na nova, a mesma chamada é um único pedido autocontido. O efeito descrito: servidor remoto que precisava de sessões fixas, armazenamento compartilhado de sessão e inspeção profunda no gateway passa a rodar atrás de balanceador simples, com roteamento por cabeçalho e cache de listas.

O post separa protocolo sem estado de aplicação com estado, e mostra o padrão da referência criada por uma tool e devolvida pelo modelo (exemplo: identificador de cesta de compras). Pedidos do servidor ao cliente só podem ocorrer enquanto o servidor processa um pedido do cliente, o que impede a pessoa de ser interrompida do nada.

## Extensões

Extensões já existiam, mas sem processo formal; agora têm identificador em DNS reverso, negociação por campo de capacidades e versão própria, independente da especificação. MCP Apps permite que servidores entreguem interfaces HTML dentro de um iframe isolado no host. Tasks passou de recurso experimental do núcleo para extensão, com ciclo de vida redesenhado.

## Depreciações

Roots, Sampling e Logging marcados como depreciados, sem remoção na revisão e com pelo menos um ano de convivência. Mesmo post lista a política de ciclo de vida, que exige que um recurso novo tenha cenário na suíte de conformidade antes de ficar final.

## Fonte

https://blog.modelcontextprotocol.io/posts/2026-07-28-release-candidate/
