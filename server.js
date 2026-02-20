const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const { Client, LocalAuth } = require('whatsapp-web.js');
const configuracao = require('./config');

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

// Variáveis globais
let cliente = null;
let statusBot = 'desconectado';
let historicoMensagens = [];
let qrCodeAtual = null;

// Função para salvar configurações no arquivo
function salvarConfiguracoes(novaConfig) {
    const conteudo = `// Configuração das respostas automáticas
module.exports = ${JSON.stringify(novaConfig, null, 2)};
`;
    fs.writeFileSync(path.join(__dirname, 'config.js'), conteudo, 'utf8');
    delete require.cache[require.resolve('./config')];
    return require('./config');
}

// Função para inicializar o bot
function inicializarBot() {
    if (cliente) {
        console.log('⚠️  Bot já está inicializado');
        return;
    }

    console.log('🤖 Iniciando WhatsApp Bot...\n');
    
    cliente = new Client({
        authStrategy: new LocalAuth({
            dataPath: '.wwebjs_auth'
        }),
        puppeteer: {
            headless: true,
            timeout: 60000,
            protocolTimeout: 120000,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        }
    });

    // Evento: QR Code gerado
    cliente.on('qr', async (codigoQR) => {
        console.log('📱 QR CODE GERADO!');
        statusBot = 'aguardando-qr';
        
        try {
            qrCodeAtual = await QRCode.toDataURL(codigoQR);
            io.emit('qrcode', qrCodeAtual);
            io.emit('status', statusBot);
        } catch (err) {
            console.error('Erro ao gerar QR Code:', err);
        }
    });

    // Evento: Cliente pronto
    cliente.on('ready', () => {
        console.log('✅ Bot conectado com sucesso!');
        statusBot = 'conectado';
        qrCodeAtual = null;
        io.emit('status', statusBot);
        io.emit('qrcode', null);
    });

    // Evento: Autenticação bem-sucedida
    cliente.on('authenticated', () => {
        console.log('🔐 Autenticação realizada com sucesso!');
        statusBot = 'autenticado';
        io.emit('status', statusBot);
    });

    // Evento: Falha na autenticação
    cliente.on('auth_failure', (mensagem) => {
        console.error('❌ Falha na autenticação:', mensagem);
        statusBot = 'erro-autenticacao';
        io.emit('status', statusBot);
    });

    // Evento: Cliente desconectado
    cliente.on('disconnected', (motivo) => {
        console.log('🔌 Cliente desconectado:', motivo);
        statusBot = 'desconectado';
        cliente = null;
        io.emit('status', statusBot);
    });

    // Evento: Mensagem recebida
    cliente.on('message', async (mensagem) => {
        try {
            const config = require('./config');
            const chat = await mensagem.getChat();
            const ehGrupo = chat.isGroup;
            const deveResponder = (ehGrupo && config.configuracoes.responderEmGrupos) || 
                                 (!ehGrupo && config.configuracoes.responderEmPrivado);

            if (!deveResponder) return;

            // Verifica lista negra
            const textoMensagem = mensagem.body.toLowerCase();
            const estaListaNegra = config.listaNegra.some(termo => 
                textoMensagem.includes(termo.toLowerCase())
            );

            if (estaListaNegra) return;

            // Procura por gatilhos
            for (const item of config.respostasAutomaticas) {
                const gatilhoEncontrado = item.gatilhos.some(gatilho => {
                    const textoComparacao = config.configuracoes.diferenciarMaiusculas ? 
                        mensagem.body : textoMensagem;
                    const gatilhoComparacao = config.configuracoes.diferenciarMaiusculas ? 
                        gatilho : gatilho.toLowerCase();

                    if (config.configuracoes.palavraInteira) {
                        const regex = new RegExp(`\\b${gatilhoComparacao}\\b`);
                        return regex.test(textoComparacao);
                    } else {
                        return textoComparacao.includes(gatilhoComparacao);
                    }
                });

                if (gatilhoEncontrado) {
                    // Delay aleatório
                    const delayMin = config.configuracoes.intervaloAtraso.minimo * 1000;
                    const delayMax = config.configuracoes.intervaloAtraso.maximo * 1000;
                    const delay = Math.floor(Math.random() * (delayMax - delayMin + 1)) + delayMin;

                    setTimeout(async () => {
                        // Seleciona resposta aleatória se houver múltiplas
                        const respostas = Array.isArray(item.resposta) ? item.resposta : [item.resposta];
                        const respostaEscolhida = respostas[Math.floor(Math.random() * respostas.length)];
                        
                        await mensagem.reply(respostaEscolhida);
                        
                        // Adiciona ao histórico
                        const registro = {
                            timestamp: new Date().toISOString(),
                            de: mensagem.from,
                            contato: chat.name || mensagem.from,
                            mensagemRecebida: mensagem.body,
                            respostaEnviada: respostaEscolhida,
                            tipo: ehGrupo ? 'grupo' : 'privado'
                        };
                        
                        historicoMensagens.unshift(registro);
                        if (historicoMensagens.length > 100) historicoMensagens.pop();
                        
                        io.emit('nova-resposta', registro);
                        
                        console.log(`✅ Respondido: ${chat.name || mensagem.from}`);
                    }, delay);
                    
                    break;
                }
            }
        } catch (erro) {
            console.error('❌ Erro ao processar mensagem:', erro);
        }
    });

    // Inicializa o cliente
    cliente.initialize();
}

// ==================== ROTAS DA API ====================

// Rota: Status do bot
app.get('/api/status', (req, res) => {
    res.json({
        status: statusBot,
        qrcode: qrCodeAtual,
        tempoAtivo: cliente ? 'ativo' : 'inativo'
    });
});

// Rota: Obter configurações
app.get('/api/config', (req, res) => {
    delete require.cache[require.resolve('./config')];
    const config = require('./config');
    res.json(config);
});

// Rota: Atualizar configurações
app.post('/api/config', (req, res) => {
    try {
        const novaConfig = req.body;
        salvarConfiguracoes(novaConfig);
        res.json({ sucesso: true, mensagem: 'Configurações salvas com sucesso!' });
    } catch (erro) {
        res.status(500).json({ sucesso: false, mensagem: erro.message });
    }
});

// Rota: Adicionar resposta automática
app.post('/api/respostas', (req, res) => {
    try {
        const config = require('./config');
        config.respostasAutomaticas.push(req.body);
        salvarConfiguracoes(config);
        res.json({ sucesso: true, mensagem: 'Resposta adicionada com sucesso!' });
    } catch (erro) {
        res.status(500).json({ sucesso: false, mensagem: erro.message });
    }
});

// Rota: Atualizar resposta automática
app.put('/api/respostas/:indice', (req, res) => {
    try {
        const indice = parseInt(req.params.indice);
        const config = require('./config');
        
        if (indice >= 0 && indice < config.respostasAutomaticas.length) {
            config.respostasAutomaticas[indice] = req.body;
            salvarConfiguracoes(config);
            res.json({ sucesso: true, mensagem: 'Resposta atualizada com sucesso!' });
        } else {
            res.status(404).json({ sucesso: false, mensagem: 'Resposta não encontrada' });
        }
    } catch (erro) {
        res.status(500).json({ sucesso: false, mensagem: erro.message });
    }
});

// Rota: Deletar resposta automática
app.delete('/api/respostas/:indice', (req, res) => {
    try {
        const indice = parseInt(req.params.indice);
        const config = require('./config');
        
        if (indice >= 0 && indice < config.respostasAutomaticas.length) {
            config.respostasAutomaticas.splice(indice, 1);
            salvarConfiguracoes(config);
            res.json({ sucesso: true, mensagem: 'Resposta removida com sucesso!' });
        } else {
            res.status(404).json({ sucesso: false, mensagem: 'Resposta não encontrada' });
        }
    } catch (erro) {
        res.status(500).json({ sucesso: false, mensagem: erro.message });
    }
});

// Rota: Obter histórico
app.get('/api/historico', (req, res) => {
    res.json(historicoMensagens);
});

// Rota: Limpar histórico
app.delete('/api/historico', (req, res) => {
    historicoMensagens = [];
    res.json({ sucesso: true, mensagem: 'Histórico limpo com sucesso!' });
});

// Rota: Iniciar bot
app.post('/api/bot/iniciar', (req, res) => {
    if (cliente && statusBot !== 'desconectado') {
        res.json({ sucesso: false, mensagem: 'Bot já está em execução' });
    } else {
        inicializarBot();
        res.json({ sucesso: true, mensagem: 'Bot iniciado com sucesso!' });
    }
});

// Rota: Parar bot
app.post('/api/bot/parar', async (req, res) => {
    if (cliente) {
        await cliente.destroy();
        cliente = null;
        statusBot = 'desconectado';
        res.json({ sucesso: true, mensagem: 'Bot parado com sucesso!' });
    } else {
        res.json({ sucesso: false, mensagem: 'Bot não está em execução' });
    }
});

// ==================== WEBSOCKET ====================

io.on('connection', (socket) => {
    console.log('🔌 Cliente conectado ao WebSocket');
    
    // Envia status atual
    socket.emit('status', statusBot);
    if (qrCodeAtual) {
        socket.emit('qrcode', qrCodeAtual);
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
    inicializarBot();
});
