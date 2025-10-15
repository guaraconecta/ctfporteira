// /backend/index.js

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 3000;

// Importe as dependências de e-mail e outras que você precisa
const { Resend } = require('resend');

// Substitua o KV por um objeto simples ou banco de dados externo
const flagsCorretas = {
    "CONTINGENCIA": "ENIAC",
    "ANALISE": "[RESULTADO CIFRADO BASE64 AQUI]",
    "HEURISTICA": "IA",
    "EXECUCAO": "GURANMVVFRGUVPCG"
};

// Middleware para processar requisições POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Rota para a submissão de flags
app.post('/api/submit', (req, res) => {
    const { team, type, flag } = req.body;

    const flagSubmetida = (flag || "").trim().toUpperCase();
    const flagType = (type || "").trim().toUpperCase();
    
    if (!team || !flagSubmetida || !flagType) {
        return res.status(400).json({ success: false, message: "Preencha todos os campos." });
    }

    // 1. Verifica se a flag submetida é a correta
    const flagCorreta = flagsCorretas[flagType];

    if (!flagCorreta) {
        return res.status(404).json({ success: false, message: `Tipo de flag (${flagType}) desconhecido.` });
    }

    if (flagSubmetida !== flagCorreta.toUpperCase()) {
        return res.status(200).json({ success: false, message: "Flag incorreta. Tente novamente." });
    }

    // 2. A flag está correta! 
    const currentTime = new Date().toISOString();

    // Se a flag final for submetida, envia o e-mail de vitória
    if (flagType === "EXECUCAO") {
        const resend = new Resend(process.env.RESEND_KEY);
        // Lógica para enviar o e-mail (usando as credenciais da Vercel)
        resend.emails.send({
            from: "noreply@resend.dev",
            to: ["polypuslabs@proton.me"],
            subject: "Novo vencedor do CTF",
            text: `Novo vencedor!\nEquipe: ${team}\nData/hora: ${currentTime}`
        });

        return res.status(200).json({ 
            success: true, 
            message: "Flag EXECUTADA! A última barreira foi desativada. Encontre o Terminal de Expurgo.",
            next_step: "/terminal/4858/"
        });
    }

    // Retorno padrão para flags intermediárias
    res.status(200).json({ 
        success: true, 
        message: `Flag ${flagType} aceita! A próxima pista foi liberada.` 
    });
});

// A Vercel precisa de um arquivo de configuração para saber qual é o script de entrada
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});

// Nota: Para usar a Resend na Vercel, você precisará instalar a biblioteca: npm install resend
