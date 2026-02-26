const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const { registerRoutes } = require('./src/routes');
const { initializeBot } = require('./src/whatsapp');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Estado compartilhado entre módulos
const state = {
    client: null,
    botStatus: 'desconectado',
    messageHistory: [],
    allMessages: [],
    currentQrCode: null,
    recentlySentMessages: new Set(),
    botStartedAt: null
};

// Registrar rotas da API
registerRoutes(app, state, io);

// ==================== WEBSOCKET ====================

io.on('connection', (socket) => {
    console.log('🔌 Cliente conectado ao WebSocket');

    socket.emit('status', state.botStatus);
    if (state.currentQrCode) {
        socket.emit('qrcode', state.currentQrCode);
    }

    socket.on('disconnect', () => {
        console.log('🔌 Cliente desconectado do WebSocket');
    });
});

// ==================== INICIALIZAÇÃO ====================

// Handler global para evitar crash por erros não tratados
process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️  Unhandled Rejection:', reason?.message || reason);
});

process.on('uncaughtException', (err) => {
    console.error('⚠️  Uncaught Exception:', err.message);
    // Não encerra o processo — apenas loga
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`\n🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log(`📊 Dashboard disponível em http://localhost:${PORT}\n`);

    // Inicializa o bot automaticamente
    initializeBot(state, io);
});
