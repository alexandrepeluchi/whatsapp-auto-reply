// ==================== SERVIDOR PRINCIPAL ====================
// Ponto de entrada da aplicação. Configura o Express, WebSocket (Socket.IO)
// e inicializa o bot do WhatsApp automaticamente ao subir o servidor.

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const { registerRoutes } = require('./src/routes');
const { initializeBot } = require('./src/whatsapp');

// Inicialização do servidor HTTP com Express e Socket.IO
const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middlewares globais
app.use(cors());                    // Permite requisições cross-origin
app.use(express.json());            // Parse automático de JSON no body
app.use(express.static('public'));  // Serve o dashboard (arquivos estáticos)

// Estado global compartilhado entre todos os módulos da aplicação
// Centraliza informações do bot, históricos e conexão WebSocket
const state = {
    client: null,                       // Instância do cliente WhatsApp (whatsapp-web.js)
    botStatus: 'desconectado',          // Status atual: desconectado | aguardando-qr | autenticado | conectado
    messageHistory: [],                 // Histórico de respostas enviadas pelo bot (máx. 100)
    allMessages: [],                    // Histórico de todas as mensagens recebidas (máx. 200)
    currentQrCode: null,                // QR Code atual em base64 (null se já autenticado)
    recentlySentMessages: new Set(),    // IDs de mensagens enviadas recentemente (anti-loop)
    botStartedAt: null                  // Timestamp de quando o bot foi iniciado (filtro temporal)
};

// Registra todas as rotas da API REST
registerRoutes(app, state, io);

// ==================== WEBSOCKET ====================
// Conexão em tempo real com o dashboard para enviar status, QR Code e notificações

io.on('connection', (socket) => {
    console.log('🔌 Cliente conectado ao WebSocket');

    // Envia o estado atual para o cliente que acabou de conectar
    socket.emit('status', state.botStatus);
    if (state.currentQrCode) {
        socket.emit('qrcode', state.currentQrCode);
    }

    socket.on('disconnect', () => {
        console.log('🔌 Cliente desconectado do WebSocket');
    });
});

// ==================== TRATAMENTO GLOBAL DE ERROS ====================
// Captura erros não tratados para evitar que o processo encerre inesperadamente

process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️  Unhandled Rejection:', reason?.message || reason);
});

process.on('uncaughtException', (err) => {
    console.error('⚠️  Uncaught Exception:', err.message);
});

// ==================== INICIALIZAÇÃO DO SERVIDOR ====================

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`\n🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log(`📊 Dashboard disponível em http://localhost:${PORT}\n`);

    // Inicia o bot do WhatsApp assim que o servidor estiver pronto
    initializeBot(state, io);
});
