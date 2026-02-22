const configManager = require('./config-manager');
const { inicializarBot, pararBot } = require('./whatsapp');

function registrarRotas(app, estado, io) {

    // ==================== STATUS ====================

    app.get('/api/status', (req, res) => {
        res.json({
            status: estado.statusBot,
            qrcode: estado.qrCodeAtual,
            tempoAtivo: estado.cliente ? 'ativo' : 'inativo'
        });
    });

    // ==================== CONFIGURAÇÕES ====================

    app.get('/api/config', (req, res) => {
        const config = configManager.carregar();
        res.json(config);
    });

    app.post('/api/config', (req, res) => {
        try {
            configManager.salvar(req.body);
            console.log('⚙️  Configurações atualizadas via dashboard');
            res.json({ sucesso: true, mensagem: 'Configurações salvas com sucesso!' });
        } catch (erro) {
            console.error('❌ Erro ao salvar configurações:', erro.message);
            res.status(500).json({ sucesso: false, mensagem: erro.message });
        }
    });

    // ==================== RESPOSTAS AUTOMÁTICAS ====================

    app.post('/api/respostas', (req, res) => {
        try {
            const config = configManager.carregar();
            config.respostasAutomaticas.push(req.body);
            configManager.salvar(config);
            console.log('➕ Nova resposta automática adicionada via dashboard');
            res.json({ sucesso: true, mensagem: 'Resposta adicionada com sucesso!' });
        } catch (erro) {
            console.error('❌ Erro ao adicionar resposta:', erro.message);
            res.status(500).json({ sucesso: false, mensagem: erro.message });
        }
    });

    app.put('/api/respostas/:indice', (req, res) => {
        try {
            const indice = parseInt(req.params.indice);
            const config = configManager.carregar();

            if (indice >= 0 && indice < config.respostasAutomaticas.length) {
                config.respostasAutomaticas[indice] = req.body;
                configManager.salvar(config);
                console.log(`✏️  Resposta automática #${indice} atualizada via dashboard`);
                res.json({ sucesso: true, mensagem: 'Resposta atualizada com sucesso!' });
            } else {
                res.status(404).json({ sucesso: false, mensagem: 'Resposta não encontrada' });
            }
        } catch (erro) {
            res.status(500).json({ sucesso: false, mensagem: erro.message });
        }
    });

    app.delete('/api/respostas/:indice', (req, res) => {
        try {
            const indice = parseInt(req.params.indice);
            const config = configManager.carregar();

            if (indice >= 0 && indice < config.respostasAutomaticas.length) {
                config.respostasAutomaticas.splice(indice, 1);
                configManager.salvar(config);
                console.log(`🗑️  Resposta automática #${indice} removida via dashboard`);
                res.json({ sucesso: true, mensagem: 'Resposta removida com sucesso!' });
            } else {
                res.status(404).json({ sucesso: false, mensagem: 'Resposta não encontrada' });
            }
        } catch (erro) {
            res.status(500).json({ sucesso: false, mensagem: erro.message });
        }
    });

    // ==================== HISTÓRICO ====================

    app.get('/api/historico', (req, res) => {
        res.json(estado.historicoMensagens);
    });

    app.delete('/api/historico', (req, res) => {
        estado.historicoMensagens = [];
        console.log('🧹 Histórico de mensagens limpo via dashboard');
        res.json({ sucesso: true, mensagem: 'Histórico limpo com sucesso!' });
    });

    // ==================== CONTROLE DO BOT ====================

    app.post('/api/bot/iniciar', (req, res) => {
        if (estado.cliente && estado.statusBot !== 'desconectado') {
            console.log('⚠️  Bot já está em execução');
            res.json({ sucesso: false, mensagem: 'Bot já está em execução' });
        } else {
            console.log('▶️  Iniciando bot via dashboard...');
            inicializarBot(estado, io);
            res.json({ sucesso: true, mensagem: 'Bot iniciado com sucesso!' });
        }
    });

    app.post('/api/bot/parar', async (req, res) => {
        const parado = await pararBot(estado, io);
        if (parado) {
            res.json({ sucesso: true, mensagem: 'Bot parado com sucesso!' });
        } else {
            console.log('⚠️  Tentativa de parar bot que não está em execução');
            res.json({ sucesso: false, mensagem: 'Bot não está em execução' });
        }
    });
}

module.exports = { registrarRotas };
