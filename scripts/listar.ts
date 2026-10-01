import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';

const porta = process.env.PORT ?? '3000';
const client = new Client({ name: 'listar', version: '0.1.0' });
await client.connect(new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${porta}/mcp`)));

const tools = await client.listTools();
const prompts = await client.listPrompts();
const resources = await client.listResources();

console.log('tools', tools.tools.map(item => item.name).sort().join(', '));
console.log('prompts', prompts.prompts.map(item => item.name).sort().join(', '));
console.log('resources', resources.resources.map(item => item.uri).sort().join(', '));

await client.close();
