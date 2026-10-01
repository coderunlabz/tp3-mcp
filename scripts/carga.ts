import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';

const url = process.env.MCP_URL ?? 'http://127.0.0.1:3000/mcp';
const n = Number(process.env.CARGA ?? 20);

async function uma(i: number): Promise<string> {
    const client = new Client({ name: `carga-${i}`, version: '0.1.0' });
    const transport = new StreamableHTTPClientTransport(new URL(url));
    await client.connect(transport);
    const tools = await client.listTools();
    await client.close();
    return `ok ${i} tools=${tools.tools.length}`;
}

const saidas = await Promise.all(Array.from({ length: n }, (_, i) => uma(i + 1).catch(erro => `falha ${i + 1}: ${erro instanceof Error ? erro.message : erro}`)));
for (const linha of saidas) console.log(linha);
const falhas = saidas.filter(linha => linha.startsWith('falha')).length;
console.log(`total=${n} falhas=${falhas}`);
if (falhas > 0) process.exit(1);
