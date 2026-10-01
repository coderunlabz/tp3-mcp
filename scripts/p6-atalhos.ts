import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';

const porta = process.env.PORT ?? '3003';
const client = new Client(
    { name: 'p6-atalhos', version: '0.1.0' },
    { versionNegotiation: { mode: { pin: '2026-07-28' } } }
);
await client.connect(new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${porta}/mcp`)));
for (const name of [
    'comece-aqui',
    'me-guia-na-instalacao',
    'prepara-minha-prova',
    'onde-posso-ler-mais',
    'explica-como-se-eu-tivesse-5-anos'
]) {
    const r = await client.getPrompt({ name, arguments: {} });
    const texto = r.messages.map(m => (m.content.type === 'text' ? m.content.text : '')).join(' ').replace(/\s+/g, ' ').slice(0, 90);
    console.log('OK', name, texto);
}
const lista = await client.listPrompts();
console.log('listPrompts', lista.prompts.map(p => p.name).join(', '));
await client.close();
