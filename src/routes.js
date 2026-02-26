const configManager = require('./config-manager');
const { initializeBot, stopBot } = require('./whatsapp');

function registerRoutes(app, state, io) {

    // ==================== STATUS ====================

    app.get('/api/status', (req, res) => {
        res.json({
            status: state.botStatus,
            qrcode: state.currentQrCode,
            uptime: state.client ? 'ativo' : 'inativo'
        });
    });

    // ==================== CONFIGURAÇÕES ====================

    app.get('/api/config', (req, res) => {
        const config = configManager.load();
        res.json(config);
    });

    app.post('/api/config', (req, res) => {
        try {
            configManager.save(req.body);
            console.log('⚙️  Configurações atualizadas via dashboard');
            res.json({ success: true, message: 'Configurações salvas com sucesso!' });
        } catch (error) {
            console.error('❌ Erro ao salvar configurações:', error.message);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    app.post('/api/config/reset', (req, res) => {
        try {
            const config = configManager.resetToDefaults();
            console.log('🔄 Configurações restauradas para os padrões');
            res.json({ success: true, message: 'Configurações restauradas para os padrões!', config });
        } catch (error) {
            console.error('❌ Erro ao restaurar configurações:', error.message);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // ==================== RESPOSTAS AUTOMÁTICAS ====================

    app.post('/api/respostas', (req, res) => {
        try {
            const config = configManager.load();
            config.autoReplies.push(req.body);
            configManager.save(config);
            console.log('➕ Nova resposta automática adicionada via dashboard');
            res.json({ success: true, message: 'Resposta adicionada com sucesso!' });
        } catch (error) {
            console.error('❌ Erro ao adicionar resposta:', error.message);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    app.put('/api/respostas/:index', (req, res) => {
        try {
            const index = parseInt(req.params.index);
            const config = configManager.load();

            if (index >= 0 && index < config.autoReplies.length) {
                config.autoReplies[index] = req.body;
                configManager.save(config);
                console.log(`✏️  Resposta automática #${index} atualizada via dashboard`);
                res.json({ success: true, message: 'Resposta atualizada com sucesso!' });
            } else {
                res.status(404).json({ success: false, message: 'Resposta não encontrada' });
            }
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    app.delete('/api/respostas/:index', (req, res) => {
        try {
            const index = parseInt(req.params.index);
            const config = configManager.load();

            if (index >= 0 && index < config.autoReplies.length) {
                config.autoReplies.splice(index, 1);
                configManager.save(config);
                console.log(`🗑️  Resposta automática #${index} removida via dashboard`);
                res.json({ success: true, message: 'Resposta removida com sucesso!' });
            } else {
                res.status(404).json({ success: false, message: 'Resposta não encontrada' });
            }
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // ==================== HISTÓRICO ====================

    app.get('/api/historico', (req, res) => {
        res.json(state.messageHistory);
    });

    app.delete('/api/historico', (req, res) => {
        state.messageHistory = [];
        console.log('🧹 Histórico de respostas limpo via dashboard');
        res.json({ success: true, message: 'Histórico limpo com sucesso!' });
    });

    // ==================== HISTÓRICO DE MENSAGENS ====================

    app.get('/api/mensagens', (req, res) => {
        res.json(state.allMessages);
    });

    app.delete('/api/mensagens', (req, res) => {
        state.allMessages = [];
        console.log('🧹 Histórico de mensagens limpo via dashboard');
        res.json({ success: true, message: 'Histórico de mensagens limpo com sucesso!' });
    });

    // ==================== CONTROLE DO BOT ====================

    app.post('/api/bot/iniciar', (req, res) => {
        if (state.client && state.botStatus !== 'desconectado') {
            console.log('⚠️  Bot já está em execução');
            res.json({ success: false, message: 'Bot já está em execução' });
        } else {
            console.log('▶️  Iniciando bot via dashboard...');
            initializeBot(state, io);
            res.json({ success: true, message: 'Bot iniciado com sucesso!' });
        }
    });

    app.post('/api/bot/parar', async (req, res) => {
        const stopped = await stopBot(state, io);
        if (stopped) {
            res.json({ success: true, message: 'Bot parado com sucesso!' });
        } else {
            console.log('⚠️  Tentativa de parar bot que não está em execução');
            res.json({ success: false, message: 'Bot não está em execução' });
        }
    });
}

module.exports = { registerRoutes };
