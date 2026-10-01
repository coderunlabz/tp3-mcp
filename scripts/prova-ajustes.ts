import { respostaCerta, temaDaDuvida } from '../src/criarServidor.ts';

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
console.log('checagem ok');
