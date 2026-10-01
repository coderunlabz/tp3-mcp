import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';

const porta = process.env.PORT ?? '3003';
const client = new Client(
    { name: 'p6-spec', version: '0.1.0' },
    { versionNegotiation: { mode: { pin: '2026-07-28' } } }
);
await client.connect(new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${porta}/mcp`)));

const discover = await client.discover();
console.log('discover');
console.log(JSON.stringify(discover, null, 2));

const tools = await client.listTools();
console.log('listTools ttlMs', (tools as { ttlMs?: unknown }).ttlMs);
console.log('listTools cacheScope', (tools as { cacheScope?: unknown }).cacheScope);
console.log('listTools keys', Object.keys(tools).sort().join(', '));

const resources = await client.listResources();
console.log('listResources ttlMs', (resources as { ttlMs?: unknown }).ttlMs);
console.log('listResources cacheScope', (resources as { cacheScope?: unknown }).cacheScope);

const lido = await client.readResource({ uri: 'acervo://slides/04-primitivos.md' });
console.log('readResource ttlMs', (lido as { ttlMs?: unknown }).ttlMs);
console.log('readResource cacheScope', (lido as { cacheScope?: unknown }).cacheScope);
console.log('readResource keys', Object.keys(lido).sort().join(', '));

await client.close();
