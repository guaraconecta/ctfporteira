const express = require('express');
const bodyParser = require('body-parser');
const { Resend } = require('resend');

const app = express();
const resend = new Resend(process.env.RESEND_API_KEY);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Flags corretas para validação
const flagsCorretas = {
  CONTINGENCIA: "ENIAC",
  ANALISE: "UFJRQkZISQ==",
  HEURISTICA: "IA",
  EXECUCAO: "GURANZVVFRGUVPCG"
};

// Resposta CORS para o frontend hospedado no Github Pages
const corsMiddleware = (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://guaraconecta.github.io");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  next();
};

app.use(corsMiddleware);

// Rota GET para redirecionamento
app.get('/terminal/4858/', (req, res) => {
  res.redirect(302, 'https://guaraconecta.github.io/ctfporteira/index.html');
});

// Rota POST para submissão de flags intermediárias
app.post('/api/submit', (req, res) => {
  const flagSubmetida = (req.body.flag || "").trim().toUpperCase().replace(/\s/g, '');
  const flagType = (req.body.type || "").trim().toUpperCase();

  const flagCorreta = flagsCorretas[flagType];
  if (!flagCorreta || flagSubmetida !== flagCorreta.toUpperCase()) {
    return res.json({ success: false, message: "Flag incorreta. Tente novamente." });
  }

  if (flagType === "EXECUCAO") {
    return res.json({
      success: true,
      message: "Flag EXECUTADA! O Terminal de Expurgo está ativo.",
      next_step: "https://guaraconecta.github.io/ctfporteira/index.html"
    });
  }
  return res.json({ success: true, message: Flag ${flagType} aceita! A próxima pista foi liberada. });
});

// Rota POST para o comando de expurgo/cache
app.post('/api/submit-terminal', async (req, res) => {
  const telefone = (req.body.telefone || "").trim();
  const email = (req.body.email || "").trim();
  const expurgo = (req.body.expurgo || "").trim().toUpperCase();

  if (!telefone || !email || !expurgo) {
    return res.json({ success: false, message: "Erro: Todos os campos (telefone, e-mail e senha) devem ser preenchidos." });
  }

  if (expurgo !== "CACHE") {
    return res.json({ success: false, message: "Senha-mestra incorreta. Tente novamente." });
  }

  try {
    // Envia e-mail com Resend
    await resend.emails.send({
      from: 'polypuslabs@proton.me',  // configure email remetente
      to: email,
      subject: 'Comando de Expurgo Executado - Vitória CTF',
      html: `
        <p>Olá,</p>
        <p>Seu comando de expurgo foi executado com sucesso.</p>
        <p>Telefone registrado: ${telefone}</p>`,
    });

    // Aqui você pode adicionar armazenamento em banco (não incluso neste exemplo)

    return res.json({ success: true, message: "Comando de expurgo executado com sucesso! Email enviado." });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Erro ao enviar email.", error: error.toString() });
  }
});

// Rota para 404 (endpoints não encontrados)
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Endpoint da API não encontrado.", code: "API_NOT_FOUND" });
});

// Inicia o servidor (Vercel usar export default para serverless)
module.exports = app;
