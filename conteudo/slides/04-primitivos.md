---
tema: primitivos
fonte: especificação MCP 2026-07-28
autor: Nicolas
---

O servidor oferece três tipos de peça, e cada uma tem um dono. Tool é uma ação que o modelo decide chamar. Resource é contexto e dados, identificados por uma URI: o aplicativo ou a pessoa abre, e o modelo pode ler. Prompt é um atalho pronto que a pessoa escolhe.

Neste servidor: as tools são consultar_acervo, registrar_duvida e ajudar_ideia_mcp (mais ver_duvidas_da_sala, só no acesso local). Os resources são os arquivos do acervo, em acervo://slides, acervo://manual e acervo://referencias. Os prompts são cinco atalhos, como comece-aqui e mostra-o-slide.

Há ainda a elicitation: o servidor pode fazer uma pergunta de volta à pessoa, se o cliente declarar suporte. Aqui isso acontece no máximo uma vez, quando a pergunta chega curta demais.
