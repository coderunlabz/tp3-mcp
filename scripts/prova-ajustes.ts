import { respostaCerta, temaDaDuvida } from '../src/criarServidor.ts';
import { alvoDoPedido, clienteDoPedido, mensagensDoCorpo, respostaTemErro } from '../src/logChamada.ts';

const slides = [
    { tema: 'evolucao', palavras: ['_meta', 'julho', 'sessao', 'initialize'], corpo: 'Cada pedido carrega versao e capacidades no campo _meta.' },
    { tema: 'arquitetura', palavras: ['host', 'cliente', 'stdio'], corpo: 'O host e o aplicativo. O cliente fala o protocolo.' },
    { tema: 'primitivos', palavras: ['tool'], corpo: 'O modelo decide a tool.' }
];

const casosTema = [
    ['nao entendi o _meta', 'evolucao'],
    ['o que e host?', 'arquitetura']
] as const;

for (const [texto, esperado] of casosTema) {
    const obtido = temaDaDuvida(slides, texto);
    if (obtido !== esperado) throw new Error(`tema: "${texto}" -> ${obtido}, esperado ${esperado}`);
    console.log('tema ok', texto, obtido);
}

const gabaritoProblema = ['n vezes m', 'nxm', 'integracao n vezes m'];
if (!respostaCerta('o custo de integrar cada chat a cada ferramenta, o N vezes M', gabaritoProblema)) throw new Error('parafrase');
if (respostaCerta('o modelo nao decide', ['o modelo'])) throw new Error('negacao deveria ser errado');
if (!respostaCerta('o modelo', ['o modelo'])) throw new Error('certo simples');
if (respostaCerta('a pessoa escolhe o modelo', ['o modelo'])) throw new Error('um termo: frase longa deveria ser errado');
if (!respostaCerta('o modelo', ['o modelo'])) throw new Error('um termo: gabarito inteiro');
console.log('checagem ok');

const msgInit = mensagensDoCorpo(JSON.stringify({
    jsonrpc: '2.0',
    method: 'initialize',
    params: { clientInfo: { name: 'demo-cursor', version: '1.2.3' } }
}))[0];
if (clienteDoPedido(msgInit, 'node').cliente !== 'demo-cursor') throw new Error('clientInfo do initialize');

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
if (respostaTemErro('{}', true)) throw new Error('ok jsonrpc');
console.log('log ok');
