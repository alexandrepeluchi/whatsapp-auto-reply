// ==================== ROTAS DA API REST ====================
// Define todos os endpoints da API utilizada pelo dashboard.
// As rotas são organizadas por domínio: status, configurações,
// respostas automáticas, históricos e controle do bot.

const configManager = require('./config-manager');
const { initializeBot, stopBot } = require('./whatsapp');

/**
 * Registra todas as rotas da API no app Express.
 * @param {import('express').Express} app - Instância do Express
 * @param {Object} state - Estado global compartilhado da aplicação
 * @param {import('socket.io').Server} io - Instância do Socket.IO para emitir eventos
 */
function registerRoutes(app, state, io) {

    // ==================== STATUS ====================
    // Retorna o estado atual do bot para o dashboard

    app.get('/api/status', (req, res) => {
        res.json({
            status: state.botStatus,
            qrcode: state.currentQrCode,
            uptime: state.client ? 'ativo' : 'inativo'
        });
    });

    // ==================== CONFIGURAÇÕES ====================
    // Leitura, salvamento e reset das configurações do bot

    /** Retorna as configurações ativas (local > defaults) */
    app.get('/api/config', (req, res) => {
        const config = configManager.load();
        res.json(config);
    });

    /** Salva as configurações enviadas pelo dashboard em config.local.json */
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

    /** Remove config.local.json e restaura os valores padrão de config.js */
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
    // CRUD de regras de resposta automática (gatilhos + respostas)

    /** Adiciona uma nova resposta automática à lista */
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

    /** Atualiza uma resposta automática existente pelo índice */
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

    /** Remove uma resposta automática pelo índice */
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

    // ==================== HISTÓRICO DE RESPOSTAS ====================
    // Registro das respostas enviadas pelo bot (máximo de 100 entradas)

    app.get('/api/historico', (req, res) => {
        res.json(state.messageHistory);
    });

    app.delete('/api/historico', (req, res) => {
        state.messageHistory = [];
        console.log('🧹 Histórico de respostas limpo via dashboard');
        res.json({ success: true, message: 'Histórico limpo com sucesso!' });
    });

    // ==================== HISTÓRICO DE MENSAGENS ====================
    // Log de todas as mensagens recebidas enquanto o bot está ativo (máximo de 200 entradas)

    app.get('/api/mensagens', (req, res) => {
        res.json(state.allMessages);
    });

    app.delete('/api/mensagens', (req, res) => {
        state.allMessages = [];
        console.log('🧹 Histórico de mensagens limpo via dashboard');
        res.json({ success: true, message: 'Histórico de mensagens limpo com sucesso!' });
    });

    // ==================== CONTROLE DO BOT ====================
    // Iniciar e parar o cliente do WhatsApp via dashboard

    /** Inicia o bot se ainda não estiver em execução */
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

    /** Para o bot, desconectando o cliente do WhatsApp */
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
