import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';

const url = process.env.MCP_URL ?? 'http://127.0.0.1:3002/mcp';

async function um(nome: string, versao: string): Promise<void> {
    const client = new Client({ name: nome, version: versao });
    await client.connect(new StreamableHTTPClientTransport(new URL(url)));
    await client.callTool({ name: 'sobre_este_acervo', arguments: {} });
    await client.close();
    console.log(`cliente ${nome}@${versao} fechou`);
}

await um('demo-claude', '0.1.0');
await um('demo-perplexity', '0.2.0');
