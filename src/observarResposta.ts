import {
    classificarResposta,
    type Chamada
} from './logChamada.ts';

export function encaminharEObservar(
    resposta: Response,
    observar: (corpo: string, tipo: string, ok: boolean) => Promise<void>
): Response {
    const tipo = resposta.headers.get('content-type') ?? '';
    if (!resposta.body) {
        void observar('', tipo, resposta.ok);
        return resposta;
    }
    const [ida, log] = resposta.body.tee();
    void (async () => {
        try {
            const corpo = await new Response(log).text();
            await observar(corpo, tipo, resposta.ok);
        } catch (erro) {
            console.error(`falha ao observar resposta: ${erro instanceof Error ? erro.message : erro}`);
        }
    })();
    return new Response(ida, {
        status: resposta.status,
        statusText: resposta.statusText,
        headers: resposta.headers
    });
}

export function chamadaDeObservacao(
    base: Omit<Chamada, 'resultado' | 'tipoResposta'>,
    corpo: string,
    tipo: string,
    httpOk: boolean
): Chamada {
    return {
        ...base,
        resultado: classificarResposta(corpo, httpOk, tipo),
        tipoResposta: tipo.includes('event-stream') ? 'sse' : (tipo.includes('json') ? 'json' : (tipo || '-'))
    };
}
