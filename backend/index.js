// /backend/index.js

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); 
const app = express();
const port = process.env.PORT || 3000;

const Resend = require('resend').Resend;

// Chaves de Flags Intermediárias
const flagsCorretas = {
    "CONTINGENCIA": "ENIAC",
    "ANALISE": "UFJRQkZISQ==", 
    "HEURISTICA": "IA",
    "EXECUCAO": "GURANZVVFRGUVPCG" 
};

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors()); 

// ROTA 1: Intercepta o acesso GET ao caminho do terminal (Redirecionamento 302)
app.get('/terminal/4858/', (req, res) => {
    res.redirect(302, 'https://guaraconecta.github.io/ctfporteira/index.html');
});

// ROTA 2: Validação das Flags Intermediárias (Usada por submit.html)
app.post('/api/submit', (req, res) => {
    // Lógica para flags intermediárias (mantida para completar o projeto)
    const { team, type, flag } = req.body;
    const flagSubmetida = (flag || "").trim().toUpperCase().replace(/\s/g, ''); 
    const flagType = (type || "").trim().toUpperCase();

    // 1. Validação
    const flagCorreta = flagsCorretas[flagType];
    if (!flagCorreta || flagSubmetida !== flagCorreta.toUpperCase()) {
        return res.status(200).json({ success: false, message: "Flag incorreta. Tente novamente." });
    }

    // 2. Resposta de Sucesso
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


// ROTA 3: Validação do Terminal de Expurgo (Chave 5 - CACHE)
app.post('/api/submit-terminal', async (req, res) => {
    // Extração segura dos dados e preenchimento de variáveis
    const telefone = (req.body.telefone || "").trim();
    const email = (req.body.email || "").trim();
    const expurgo = (req.body.expurgo || "").trim().toUpperCase();
    
    // Validação da senha mestra CACHE (SUCESSO FINAL)
    if (expurgo === "CACHE" && telefone && email) {
        
        const resend = new Resend(process.env.RESEND_KEY);
        const brTimeString = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
        
        const remetentePadrao = "onboarding@resend.dev"; 

        try {
            // **ENVIO PARA A POLYPUS LABS (Registo de Vencedor)**
            await resend.emails.send({
                from: remetentePadrao,
                to: ["polypuslabs@proton.me"],
                subject: "NOVO VENCEDOR DO CTF",
                text: `REGISTRO DE VITÓRIA\n--------------------\nTelefone: ${telefone}\nE-mail: ${email}\nData/Hora: ${brTimeString}`
            });

            // Resposta de Sucesso
            return res.json({ 
                success: true, 
                message: "Comando de expurgo executado com sucesso! O registro da sua vitória foi salvo."
            });

        } catch (error) {
            console.error("Erro fatal na Resend, mas registrando sucesso para o usuário:", error);
            // Retorna SUCESSO para o frontend para evitar o erro de rede.
            return res.json({ 
                success: true, 
                message: "Comando executado. (ALERTA: Falha no registro de e-mail. Contactar a equipe de suporte.)"
            });
        }
    }
    
    // --- Lógica de ERRO CORRIGIDA ---
    // Checa se os campos estão faltando
    if (!telefone || !email || !expurgo) {
         return res.json({ success: false, message: "Erro: Todos os campos (telefone, e-mail e senha) devem ser preenchidos." });
    }
    
    // Se não for CACHE e os campos estiverem preenchidos, é uma senha incorreta.
    return res.json({ success: false, message: "Senha-mestra incorreta. Tente novamente." });
});


// ROTA 4: Tratamento 404 para qualquer outra rota não definida
app.use((req, res, next) => {
    res.status(404).json({ success: false, message: "Endpoint da API não encontrado.", code: "API_NOT_FOUND" });
});


// Exporta o app para o Vercel
module.exports = app;

