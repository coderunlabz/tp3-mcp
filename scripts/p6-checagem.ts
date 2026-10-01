import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';

const porta = process.env.PORT ?? '3001';
const client = new Client({ name: 'p6', version: '0.1.0' });
await client.connect(new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${porta}/mcp`)));

const texto = (r: { content: Array<{ type: string; text?: string }> }) =>
    r.content.map(item => item.type === 'text' ? item.text : '').join('\n');

async function umaPergunta() {
    const bruto = texto(await client.callTool({ name: 'checar_entendimento', arguments: {} }) as never);
    const [id, ...resto] = bruto.split('\n');
    return { id, pergunta: resto.join('\n') };
}

async function responder(id: string, resposta: string) {
    return texto(await client.callTool({ name: 'checar_entendimento', arguments: { id, resposta } }) as never);
}

const a = await umaPergunta();
console.log('p1', a.pergunta);
console.log('certo-curto', await responder(a.id, a.pergunta.includes('tool') ? 'o modelo' : 'n vezes m'));

const b = await umaPergunta();
console.log('p2', b.pergunta);
if (b.pergunta.toLowerCase().includes('problema')) {
    console.log('parafrase', await responder(b.id, 'o custo de integrar cada chat a cada ferramenta, o N vezes M'));
} else {
    console.log('negacao', await responder(b.id, 'o modelo nao decide'));
}

const c = await umaPergunta();
console.log('p3', c.pergunta);
if (c.pergunta.toLowerCase().includes('problema')) {
    console.log('parafrase', await responder(c.id, 'o custo de integrar cada chat a cada ferramenta, o N vezes M'));
} else {
    console.log('negacao', await responder(c.id, 'o modelo nao decide'));
}

await client.callTool({ name: 'registrar_duvida', arguments: { texto: 'nao entendi o _meta' } });
await client.callTool({ name: 'registrar_duvida', arguments: { texto: 'o que e host?' } });
console.log('sala\n', texto(await client.callTool({ name: 'ver_duvidas_da_sala', arguments: {} }) as never));

await client.close();
