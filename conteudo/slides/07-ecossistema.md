---
tema: ecossistema
fonte: modelcontextprotocol.io (SDKs e página inicial); documentação da Cloudflare, acessadas em 03/10/2026
autor: Nicolas
---

Os SDKs oficiais têm níveis de suporte. Nível 1: TypeScript, Python, C#, Go, Rust e Ruby. Nível 2: Java. Nível 3: Swift, PHP e Kotlin. Entre os clientes citados na documentação estão Claude, ChatGPT, Visual Studio Code, Cursor e MCPJam.

Para publicar um servidor remoto há plataformas como a Cloudflare, cujo guia usa Workers e o transporte Streamable HTTP, com ou sem OAuth. Esta demonstração não usa Workers: roda em Node.js, com um túnel temporário (Cloudflare Quick Tunnel).
