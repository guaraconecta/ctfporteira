export default function handler(req, res) {
    if (req.method === 'OPTIONS') {
        // Trata requisições preflight CORS
        res.setHeader('Access-Control-Allow-Origin', '*'); // Ou especifique o domínio do GitHub Pages
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.status(200).end();
        return;
    }

    if (req.method === 'POST') {
        // Parseia os dados do formulário
        const { team, type, flag } = req.body; // Pode precisar de body-parser ou parsing manual

        // Lógica de validação de flags (personalize para seu CTF)
        const validFlags = {
            'CONTINGENCIA': 'ENIAC',
            'ANALISE': 'UFJRQkZISQ==',
            'HEURISTICA': 'IA',
            'EXECUCAO': 'GURANZVVFRGUVPCG'
        };

        if (flag === validFlags[type]) {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.status(200).json({
                success: true,
                message: `Flag correta para ${type}!`,
                next_step: 'Próximo desafio: [insira dica aqui]' // Opcional
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
}
