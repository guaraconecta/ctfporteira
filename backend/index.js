// /backend/index.js

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); 
const app = express();
const port = process.env.PORT || 3000;

// Configuração da Resend
const Resend = require('resend').Resend;

// Chaves de Flags Intermediárias (Para a ROTA /api/submit)
const flagsCorretas = {
    "CONTINGENCIA": "ENIAC",
    "ANALISE": "UFJRQkZISQ==", 
    "HEURISTICA": "IA",
    "EXECUCAO": "GURANZVVFRGUVPCG" 
};

// --- MIDDLEWARE ---

// Configura CORS para permitir apenas o seu site no GitHub Pages
const corsOptions = {
    // Adiciona o domínio exato do seu frontend para evitar erros de segurança
    origin: 'https://guaraconecta.github.io', 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204
};

app.use(cors(corsOptions)); 

// Permite ao Express ler dados de formulários (FormData) de forma robusta
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Permite ao Express ler JSON
app.use(bodyParser.json({ limit: '50mb' })); 


// ROTA 1: Intercepta o acesso GET ao caminho do terminal (Redirecionamento 302)
app.get('/terminal/4858/', (req, res) => {
    // Redireciona o usuário para o frontend correto
    res.redirect(302, 'https://guaraconecta.github.io/ctfporteira/index.html');
});

// ROTA 2: Validação das Flags Intermediárias (Usada por submit.html)
app.post('/api/submit', (req, res) => {
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
    // Extração segura dos dados
    const telefone = (req.body.telefone || "").trim();
    const email = (req.body.email || "").trim();
    const expurgo = (req.body.expurgo || "").trim().toUpperCase();
    
    // Validação da senha mestra CACHE (SUCESSO FINAL)
    if (expurgo === "CACHE" && telefone && email) {
        
        const resend = new Resend(process.env.RESEND_KEY);
        const brTimeString = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
        
        // Remetente padrão para evitar falhas de verificação de domínio
        const remetentePadrao = "onboarding@resend.dev"; 

        try {
            // ENVIO PARA A POLYPUS LABS (Registo de Vencedor)
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
            console.error("Erro fatal no envio de e-mail pela Resend:", error);
            // Retorna sucesso para o frontend (para evitar o erro de rede),
            // mas com uma mensagem de aviso.
            return res.json({ 
                success: true, 
                message: "Comando executado. (ALERTA: Falha no registro de e-mail. Contactar a equipe de suporte.)"
            });
        }
    }
    
    // --- Lógica de ERRO ---
    // Se algum campo estiver faltando
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

