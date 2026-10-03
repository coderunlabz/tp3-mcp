import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';

const host = (process.env.HOSTS ?? process.env.TUNEL_HOSTNAME ?? '').split(',')[0]?.trim();
const publico = Boolean(host);
const url = host
    ? `https://${host.replace(/^https?:\/\//, '').replace(/\/mcp\/?$/, '')}/mcp`
    : `http://127.0.0.1:${process.env.PORT ?? '3000'}/mcp`;

const esperadas = publico
    ? ['ajudar_ideia_mcp', 'consultar_acervo', 'registrar_duvida']
    : ['ajudar_ideia_mcp', 'consultar_acervo', 'registrar_duvida', 'ver_duvidas_da_sala'];

try {
    const client = new Client({ name: 'verificar', version: '0.1.0' });
    await client.connect(new StreamableHTTPClientTransport(new URL(url)));
    const tools = await client.listTools();
    await client.close();
    const nomes = tools.tools.map(item => item.name).sort();
    const ok = esperadas.length === nomes.length && esperadas.every(nome => nomes.includes(nome));
    if (!ok) {
        console.log('FALHOU');
        console.log('url', url);
        console.log('esperado', esperadas.join(', '));
        console.log('tools', nomes.join(', '));
        process.exit(1);
    }
    if (publico && nomes.includes('ver_duvidas_da_sala')) {
        console.log('FALHOU');
        console.log('tool privada listada no endereço público');
        process.exit(1);
    }
    console.log('OK');
    console.log('url', url);
    console.log('acesso', publico ? 'publico (3 tools)' : 'local (4 tools)');
    console.log('tools', nomes.join(', '));
} catch (erro) {
    console.log('FALHOU');
    console.log('url', url);
    console.log(erro instanceof Error ? erro.message : erro);
    process.exit(1);
}
