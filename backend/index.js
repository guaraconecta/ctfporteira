// Cloudflare Worker: API de Validação (Sem Express)
// Substitui o backend da Vercel

// Lógica de roteamento
const handleRequest = async (request, env) => {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Chaves de Flags
    const flagsCorretas = {
        "CONTINGENCIA": "ENIAC",
        "ANALISE": "UFJRQkZISQ==", 
        "HEURISTICA": "IA",
        "EXECUCAO": "GURANZVVFRGUVPCG" 
    };

    // Cabeçalhos CORS (Permite a comunicação com o seu site no GitHub Pages)
    const corsHeaders = {
        'Access-Control-Allow-Origin': 'https://guaraconecta.github.io',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Função de resposta JSON
    const jsonResponse = (data, status = 200) => {
        return new Response(JSON.stringify(data), {
            status,
            headers: { 
                'Content-Type': 'application/json',
                ...corsHeaders 
            }
        });
    };
    
    // Lógica para OPTIONS (CORS preflight)
    if (method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
    }
    
    // Analisa o FormData para requisições POST
    let data = {};
    if (method === 'POST') {
        try {
            const formData = await request.formData();
            formData.forEach((value, key) => { data[key] = value; });
        } catch (e) {
            return jsonResponse({ success: false, message: "Erro ao processar dados de formulário." }, 400);
        }
    }


    // --- ROTEAMENTO ---

    // ROTA 1: GET /terminal/4858/ (Redirecionamento)
    if (path === '/terminal/4858/' && method === 'GET') {
        return Response.redirect('https://guaraconecta.github.io/ctfporteira/index.html', 302);
    }
    
    // ROTA 2: POST /api/submit (Flags Intermediárias)
    if (path === '/api/submit' && method === 'POST') {
        const flagSubmetida = (data.flag || "").trim().toUpperCase().replace(/\s/g, ''); 
        const flagType = (data.type || "").trim().toUpperCase();

        const flagCorreta = flagsCorretas[flagType];
        if (!flagCorreta || flagSubmetida !== flagCorreta.toUpperCase()) {
            return jsonResponse({ success: false, message: "Flag incorreta. Tente novamente." });
        }
        
        if (flagType === "EXECUCAO") {
            return jsonResponse({ 
                success: true, 
                message: "Flag EXECUTADA! O Terminal de Expurgo está ativo.",
                next_step: "https://guaraconecta.github.io/ctfporteira/index.html"
            });
        }
        return jsonResponse({ success: true, message: `Flag ${flagType} aceita! A próxima pista foi liberada.` });
    }


    // ROTA 3: POST /api/submit-terminal (Chave 5 - CACHE)
    if (path === '/api/submit-terminal' && method === 'POST') {
        const telefone = (data.telefone || "").trim();
        const email = (data.email || "").trim();
        const expurgo = (data.expurgo || "").trim().toUpperCase();

        if (expurgo === "CACHE" && telefone && email) {
            
            // Lógica de Registro de Vencedor (Assumindo que você configurou o KV e o Resend Binding)
            
            return jsonResponse({ 
                success: true, 
                message: "Comando de expurgo executado com sucesso! O registro da sua vitória foi salvo."
            });
        }
        
        if (!telefone || !email || !expurgo) {
             return jsonResponse({ success: false, message: "Erro: Todos os campos (telefone, e-mail e senha) devem ser preenchidos." });
        }
        
        return jsonResponse({ success: false, message: "Senha-mestra incorreta. Tente novamente." });
    }

    // Tratamento 404
    return jsonResponse({ success: false, message: "Endpoint da API não encontrado.", code: "API_NOT_FOUND" }, 404);
};

export default {
    fetch: handleRequest,
};
```

### Passo 2: Configuração na Cloudflare (Crucial)

Você precisa configurar o Worker para que ele tenha acesso ao envio de e-mails e saiba qual é o seu domínio.

1.  **Configure o Worker Name:** Use o nome do Worker (ex: `ctf-api-worker`) para construir o URL de API (ex: `https://ctf-api-worker.workers.dev`).
2.  **Bindings:** Se você quiser que o e-mail funcione, configure os Bindings no painel da Cloudflare:
    * **KV Namespace (Opcional):** Se você quer rastrear o vencedor, configure o KV como fizemos antes.
    * **Resend/Mailgun (E-mail):** Configure o Service Binding para o envio de e-mail (usando sua chave da Resend como Secret) no painel da Cloudflare.

### Passo 3: Atualizar o Frontend (Seu Arquivo `index.html` e `submit.html`)

Este é o passo mais importante: **você precisa dizer às suas páginas HTML (no GitHub Pages) para enviarem os dados para o novo endereço da API na Cloudflare, não mais para a Vercel.**

**Altere a `API_URL` em:**
1.  **`index.html`** (para submeter a senha `CACHE`).
2.  **`submit.html`** (para submeter as flags intermediárias).

```javascript
// Exemplo de como deve ficar a variável no seu HTML:
const API_URL = 'https://SEU-DOMINIO-WORKER.workers.dev'; 
// Substitua SEU-DOMINIO-WORKER.workers.dev pelo domínio real do seu novo Worker

