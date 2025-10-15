// /backend/index.js

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 3000;

// Importe as dependências de e-mail e outras que você precisa
const { Resend } = require('resend');

// Substitua o KV por um objeto simples (Chaves de Flags Intermediárias)
const flagsCorretas = {
    "CONTINGENCIA": "ENIAC",
    "ANALISE": "UFJRQkZISQ==", // Valor da Chave 2 (Vigenère/Base64)
    "HEURISTICA": "IA",
    "EXECUCAO": "GUR ANZV VF RGUVPCG" // Valor da Chave 4 (ROT13)
};

// Middleware para processar requisições POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Adiciona CORS para permitir comunicação entre domínios (obrigatório para Vercel <-> GitHub Pages)
app.use((req, res, next) => {
    res.set('Access-Control-Allow-Origin', '*'); 
    res.set('Access-Control-Allow-Methods', 'GET, POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// ROTA 1: Intercepta o acesso GET ao caminho do terminal (Redirecionamento 302)
app.get('/terminal/4858/', (req, res) => {
    // Redireciona o usuário para a página correta no GitHub Pages
    res.redirect(302, 'https://guaraconecta.github.io/ctfporteira/index.html');
});

// ROTA 2: Validação das Flags Intermediárias (Usada por submit.html)
app.post('/api/submit', (req, res) => {
    // Lógica para CORS e Validação de Flags Intermediárias
    const { team, type, flag } = req.body;
    const flagSubmetida = (flag || "").trim().toUpperCase();
    const flagType = (type || "").trim().toUpperCase();

    if (!team || !flagSubmetida || !flagType) {
        return res.status(400).json({ success: false, message: "Preencha todos os campos." });
    }

    const flagCorreta = flagsCorretas[flagType];

    if (!flagCorreta) {
        return res.status(404).json({ success: false, message: `Tipo de flag (${flagType}) desconhecido.` });
    }

    if (flagSubmetida !== flagCorreta.toUpperCase()) {
        return res.status(200).json({ success: false, message: "Flag incorreta. Tente novamente." });
    }

    if (flagType === "EXECUCAO") {
        return res.status(200).json({ 
            success: true, 
            message: "Flag EXECUTADA! O Terminal de Expurgo está ativo.",
            next_step: "https://guaraconecta.github.io/ctfporteira/index.html" // URL do terminal
        });
    }

    return res.status(200).json({ 
        success: true, 
        message: `Flag ${flagType} aceita! A próxima pista foi liberada.` 
    });
});


// ROTA 3: Validação do Terminal de Expurgo (Chave 5) (Usada por index.html)
app.post('/api/submit-terminal', async (req, res) => {
    // O frontend envia todos os campos. O 'resposta' contém a palavra 'CODIGO' ou o valor vazio.
    const { telefone, email, expurgo, resposta } = req.body;
    
    const flagResposta = (resposta || "").trim().toUpperCase();
    const flagExpurgo = (expurgo || "").trim().toUpperCase();
    
    // CASO 1: Validação da senha mestra CACHE (SUCESSO FINAL)
    if (flagExpurgo === "CACHE" && telefone && email) {
        
        // Simulação de registro de tempo (Vercel não tem KV, então fazemos apenas o cálculo)
        const now = new Date();
        const brNow = new Date(now.getTime() - 3 * 60 * 60 * 1000); // Ajuste simples para GMT-3
        const brTimeString = brNow.toLocaleString("pt-BR") + " GMT-3";
        
        const resend = new Resend(process.env.RESEND_KEY);

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

            // RESPOSTA FINAL DE VITÓRIA
            return res.json({ 
                success: true, 
                message: "Parabéns! Você executou o comando de expurgo e receberá um e-mail de confirmação!"
            });

        } catch (error) {
            // Se o envio do e-mail falhar, ainda retornamos sucesso para o usuário, 
            // mas logamos o erro (Vercel logs)
            console.error("Erro no envio de e-mail pela Resend:", error);
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
    
    // CASO 3: Qualquer outro cenário que não seja a validação inicial (CODIGO)
    // ou a submissão final (CACHE) (Ex: campos vazios)
    return res.json({ success: false, message: "Dados incompletos ou requisição inválida." });
});


// ROTA 4: Tratamento 404 para qualquer outra rota não definida
app.use((req, res, next) => {
    res.status(404).json({ success: false, message: "Endpoint da API não encontrado.", code: "API_NOT_FOUND" });
});


// A Vercel precisa que você exporte o app
module.exports = app;

