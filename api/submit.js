import { Resend } from 'resend';

export default async function handler(req, res) {
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.status(200).end();
        return;
    }

    if (req.method === 'POST') {
        // Parseia os dados do formulário
        const { team, type, flag, telefone, email } = req.body;

        // Lógica de validação de flags
        const validFlags = {
            'CONTINGENCIA': 'ENIAC',
            'ANALISE': 'UFJRQkZISQ==',
            'HEURISTICA': 'IA',
            'EXECUCAO': 'GURANZVVFRGUVPCG'
        };

        // Sucesso só quando for a chave final
        if (flag === validFlags[type]) {
            // Se for o terminal final, enviar o email
            if (type === 'EXECUCAO' && telefone && email) {
                try {
                    const resend = new Resend(process.env.RESEND_KEY);
                    const brTimeString = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
                    const remetentePadrao = "onboarding@resend.dev";

                    await resend.emails.send({
                        from: remetentePadrao,
                        to: ["polypuslabs@proton.me"],
                        subject: "NOVO VENCEDOR DO CTF",
                        text: `REGISTRO DE VITÓRIA
--------------------
Telefone: ${telefone}
E-mail: ${email}
Data/Hora: ${brTimeString}`
                    });

                    res.setHeader('Access-Control-Allow-Origin', '*');
                    res.status(200).json({
                        success: true,
                        message: "Flag correta e registro enviado!",
                        next_step: "Você venceu!"
                    });
                    return;
                } catch (error) {
                    res.setHeader('Access-Control-Allow-Origin', '*');
                    res.status(200).json({
                        success: true,
                        message: "Flag correta, mas houve erro ao registrar a vitória por e-mail.",
                        next_step: "Você venceu!"
                    });
                    return;
                }
            }

            res.setHeader('Access-Control-Allow-Origin', '*');
            res.status(200).json({
                success: true,
                message: Flag correta para ${type}!,
                next_step: 'Próximo desafio: [insira dica aqui]'
            });
        } else {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.status(200).json({
                success: false,
                message: 'Flag incorreta. Tente novamente.'
            });
        }
    } else {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.status(405).json({ success: false, message: 'Método não permitido.' });
    }
} "resend": "^3.2.0"
