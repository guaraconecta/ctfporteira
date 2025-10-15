// /backend/index.js

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 3000;

// Não inicialize a Resend aqui! Iremos inicializá-la dentro da rota.
const Resend = require('resend').Resend; // Use require para inicialização dinâmica

// Substitua o KV por um objeto simples (Chaves de Flags Intermediárias)
const flagsCorretas = {
    "CONTINGENCIA": "ENIAC",
    "ANALISE": "UFJRQkZISQ==",
    "HEURISTICA": "IA",
    "EXECUCAO": "GURANZVVFRGUVPCG"
};

// Middleware para processar requisições POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Adiciona CORS para permitir comunicação entre domínios
app.use((req, res, next) => {
    res.set('Access-Control-Allow-Origin', '*'); 
    res.set('Access-Control-Allow-Methods', 'GET, POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// ROTA 1: Intercepta o acesso GET ao caminho do terminal (Redirecionamento 302)
app.get('/terminal/4858/', (req, res) => {
    res.redirect(302, 'https://guaraconecta.github.io/ctfporteira/index.html');
});

// ROTA 2: Validação das Flags Intermediárias (Usada por submit.html)
app.post('/api/submit', (req, res) => {
    const { team, type, flag } = req.body;
    const flagSubmetida = (flag || "").trim().toUpperCase().replace(/\s/g, '');
    const flagType = (type || "").trim().toUpperCase();

    if (!team || !flagSubmetida || !flagType) {
        return res.status(400).json({ success: false, message: "Preencha todos os campos." });
    }

    const flagCorreta = flagsCorretas[flagType];

    if (!flagCorreta) {
        return res.status(404).json({ success: false, message: `Tipo de flag (${flagType}) desconhecido.` });
    }
    
    if (flagSubmetida !== flagCorreta.toUpperCase().replace(/\s/g, '')) {
        return res.status(200).json({ success: false, message: "Flag incorreta. Tente novamente." });
    }

    if (flagType === "EXECUCAO") {
        return res.status(200).json({ 
            success: true, 
            message: "Flag EXECUTADA! O Terminal de Expurgo está ativo.",
            next_step: "https://guaraconecta.github.io/ctfporteira/index.html"
        });
    }

    return res.status(200).json({ 
        success: true, 
        message: `Flag ${flagType} aceita! A próxima pista foi liberada.` 
    });
});


// ROTA 3: Validação do Terminal de Expurgo (Chave 5) (Usada por index.html)
app.post('/api/submit-terminal', async (req, res) => {
    const { telefone, email, expurgo, resposta } = req.body;
    
    const flagExpurgo = (expurgo || "").trim().toUpperCase();
    
    // CASO 1: Validação da senha mestra CACHE (SUCESSO FINAL)
    if (flagExpurgo === "CACHE" && telefone && email) {
        
        // --- INICIALIZAÇÃO DA RESEND AQUI (NO MOMENTO DO USO) ---
        // Isso garante que process.env.RESEND_KEY já está disponível.
        const resend = new Resend(process.env.RESEND_KEY);
        // --------------------------------------------------------

        const now = new Date();
        const brNow = new Date(now.getTime() - 3 * 60 * 60 * 1000);
        const brTimeString = brNow.toLocaleString("pt-BR") + " GMT-3";
        
        try {
            // Envio de E-mail ao Participante
            await resend.emails.send({
                from: "noreply@resend.dev",
                to: [email],
                subject: "Parabéns! Você concluiu o CTF",
                text: `Parabéns! Você concluiu o CTF. Telefone: ${telefone}, Data/hora: ${brTimeString}`
            });

            // Envio de E-mail para a Polypus Labs
            await resend.emails.send({
                from: "noreply@resend.dev",
                to: ["polypuslabs@proton.me"],
                subject: "Novo vencedor do CTF",
                text: `Novo vencedor!\nTelefone: ${telefone}\nE-mail: ${email}\nData/hora: ${brTimeString}`
            });

            return res.json({ 
                success: true, 
                message: "Parabéns! Você executou o comando de expurgo e receberá um e-mail de confirmação!"
            });

        } catch (error) {
            console.error("Erro no envio de e-mail pela Resend:", error);
            // Retornamos sucesso no frontend para não travar o usuário, mas logamos o erro.
            return res.json({ 
                success: true, 
                message: "Comando executado, mas houve um erro no envio do e-mail de confirmação. Verifique sua caixa de entrada mais tarde."
            });
        }
    }

    // CASO 2: Senha mestra incorreta (Após a transição de tela)
    if (telefone && email && flagExpurgo !== "CACHE") {
        return res.json({ success: false, message: "Senha-mestra incorreta. Tente novamente." });
    }
    
    // CASO 3: Resposta inicial incorreta ou dados incompletos para a submissão
    return res.json({ success: false, message: "Resposta incorreta, tente novamente." });
});


// ROTA 4: Tratamento 404 para qualquer outra rota não definida
app.use((req, res, next) => {
    res.status(404).json({ success: false, message: "Endpoint da API não encontrado.", code: "API_NOT_FOUND" });
});


// Exporta o app para o Vercel
module.exports = app;

