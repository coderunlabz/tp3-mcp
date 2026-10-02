import { entradaVaga } from '../src/criarServidor.ts';
import { alvoDoPedido, clienteDoPedido, mensagensDoCorpo, respostaTemErro } from '../src/logChamada.ts';

if (!entradaVaga('MCP')) throw new Error('uma palavra e vaga');
if (entradaVaga('o que o slide 04 diz sobre tools')) throw new Error('com contexto nao e vaga');
console.log('vaga ok');

const msg = mensagensDoCorpo(JSON.stringify({
    jsonrpc: '2.0',
    method: 'tools/call',
    params: {
        name: 'consultar_acervo',
        arguments: { pergunta: 'nao deve aparecer no log' },
        _meta: { 'io.modelcontextprotocol/clientInfo': { name: 'demo-claude', version: '0.1.0' } }
    }
}))[0];
const quem = clienteDoPedido(msg, 'User-Agent-Reserva');
if (quem.cliente !== 'demo-claude' || quem.versao !== '0.1.0') throw new Error('cliente do _meta');
if (alvoDoPedido(msg) !== 'consultar_acervo') throw new Error('alvo');
if (!respostaTemErro(JSON.stringify({ error: { code: -32600 } }), true)) throw new Error('erro jsonrpc');
console.log('log ok');
