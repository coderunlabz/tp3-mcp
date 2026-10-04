---
tema: arquitetura
fonte: especificação MCP 2026-07-28
autor: Nicolas
palavras: host, cliente, servidor, stdio, http
---

Há três papéis. O host é o aplicativo onde a pessoa conversa com a IA. O cliente MCP fica dentro do host e fala o protocolo; há um cliente por servidor. O servidor oferece as ferramentas e os dados.

Há dois transportes. No stdio, o host abre o servidor como um processo local no mesmo computador. No Streamable HTTP, o servidor tem uma URL e recebe pedidos POST em um endereço único, como /mcp. Nesta demonstração o servidor é remoto: o chat só precisa da URL.
