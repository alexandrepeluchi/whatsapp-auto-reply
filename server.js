const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const { registrarRotas } = require('./src/routes');
const { inicializarBot } = require('./src/whatsapp');

const app = express();
const servidor = http.createServer(app);
const io = socketIO(servidor, {
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
const estado = {
    cliente: null,
    statusBot: 'desconectado',
    historicoMensagens: [],
    qrCodeAtual: null,
    mensagensEnviadasRecentemente: new Set()
};

// Registrar rotas da API
registrarRotas(app, estado, io);

// ==================== WEBSOCKET ====================

io.on('connection', (socket) => {
    console.log('🔌 Cliente conectado ao WebSocket');

    socket.emit('status', estado.statusBot);
    if (estado.qrCodeAtual) {
        socket.emit('qrcode', estado.qrCodeAtual);
    }

    socket.on('disconnect', () => {
        console.log('🔌 Cliente desconectado do WebSocket');
    });
});

// ==================== INICIALIZAÇÃO ====================

const PORTA = process.env.PORT || 3000;

servidor.listen(PORTA, () => {
    console.log(`\n🚀 Servidor rodando em http://localhost:${PORTA}`);
    console.log(`📊 Dashboard disponível em http://localhost:${PORTA}\n`);

    // Inicializa o bot automaticamente
    inicializarBot(estado, io);
});
