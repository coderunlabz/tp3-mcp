import { arquivarDuvidasAtivas, pastaRegistro } from '../src/registro.ts';

console.log('Pare o servidor (npm start / npm run tunel) nesta pasta antes de arquivar.');
console.log('Este comando não para nem reinicia processos. Com o Node ainda gravando, a lista ativa pode voltar a misturar com o histórico.');
console.log(`Pasta de registro: ${pastaRegistro()}`);

const resultado = await arquivarDuvidasAtivas();
if (resultado.vazio) {
    console.log('Nenhuma dúvida ativa para arquivar.');
    process.exit(0);
}

console.log(`Histórico salvo em ${resultado.destino}`);
console.log(`Arquivos: ${resultado.arquivos.join(', ')}`);
console.log('A próxima dúvida cria de novo registro/duvidas.jsonl. ideias.jsonl e chamadas.jsonl não foram mexidos.');
