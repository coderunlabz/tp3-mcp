# Spec 2026-07-28 — Overview

- Consultado em: 01/10/2026
- URL: https://modelcontextprotocol.io/specification/2026-07-28

## O que a página diz (fiel ao Overview)

MCP é um protocolo aberto para ligar aplicativos de LLM a fontes e ferramentas. A spec é a autoridade; o schema TypeScript é a referência do fio.

Papéis (JSON-RPC 2.0):

- Hosts: aplicativos de LLM que iniciam a conexão
- Clients: conectores dentro do host
- Servers: serviços que oferecem contexto e capacidades

Inspiração citada: Language Server Protocol.

Detalhes-chave do núcleo:

- Formato JSON-RPC
- Pedidos sem estado, autossuficientes
- Negociação de capacidades por pedido

O servidor pode expor Resources (contexto/dados), Prompts (mensagens e fluxos para a pessoa) e Tools (funções para o modelo executar). O cliente pode oferecer elicitation.

Extensões são opcionais e exigem suporte explícito dos dois lados. O Overview ainda fala em “negotiated during initialization”. O blog da revisão diz que o handshake `initialize` saiu; a página de Overview, neste trecho, não alinha essa frase com o resto da revisão. **Marcar se for citado no seminário.**

Extensões notáveis no Overview: Tasks (trabalho longo), Skills over MCP, MCP Apps (UI interativa na conversa).

Segurança: consentimento da pessoa, privacidade dos dados, tools como execução de código; anotações de tool não confiáveis salvo servidor confiável.
