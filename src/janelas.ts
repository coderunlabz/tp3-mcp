export const MIME_APP = 'text/html;profile=mcp-app';

function pagina(titulo: string, rotulo: string, botao: string): string {
    return `<!doctype html>
<html lang="pt-BR">
<head><meta charset="utf-8"><title>${titulo}</title>
<style>
body { font-family: sans-serif; margin: 1.5rem; }
label, input, button, pre { display: block; margin: 0.5rem 0; }
input { width: 100%; max-width: 28rem; padding: 0.4rem; }
button { padding: 0.4rem 0.8rem; }
pre { white-space: pre-wrap; background: #f4f4f4; padding: 0.6rem; }
</style>
</head>
<body>
<h1>${titulo}</h1>
<label>${rotulo}</label>
<input id="campo" type="text">
<button type="button" id="ok">${botao}</button>
<pre id="saida">O resultado também aparece em texto no chat.</pre>
<script>
document.getElementById('ok').onclick = function () {
  var v = document.getElementById('campo').value;
  document.getElementById('saida').textContent = 'Pedido: ' + v + '\\nO chat recebe o mesmo texto pela tool.';
};
</script>
</body>
</html>`;
}

export const htmlConsultar = pagina('Consultar o acervo', 'Sua dúvida', 'Consultar');
export const htmlDuvida = pagina('Registrar dúvida', 'Dúvida (nome é opcional no chat)', 'Enviar');
