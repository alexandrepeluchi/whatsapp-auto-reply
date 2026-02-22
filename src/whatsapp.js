const QRCode = require('qrcode');
const { Client, LocalAuth } = require('whatsapp-web.js');
const configManager = require('./config-manager');

function inicializarBot(estado, io) {
    if (estado.cliente) {
        console.log('⚠️  Bot já está inicializado');
        return;
    }

    console.log('🤖 Iniciando WhatsApp Bot...\n');

    estado.cliente = new Client({
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
    estado.cliente.on('qr', async (codigoQR) => {
        console.log('📱 QR CODE GERADO!');
        estado.statusBot = 'aguardando-qr';

        try {
            estado.qrCodeAtual = await QRCode.toDataURL(codigoQR);
            io.emit('qrcode', estado.qrCodeAtual);
            io.emit('status', estado.statusBot);
        } catch (err) {
            console.error('Erro ao gerar QR Code:', err);
        }
    });

    // Evento: Cliente pronto
    estado.cliente.on('ready', () => {
        const config = configManager.carregar();
        console.log('✅ Bot conectado com sucesso!');
        console.log('🎯 Listener de mensagens registrado e ativo (capturando TODAS as mensagens)!');
        console.log('📊 Configurações ativas:');
        console.log(`   - Responder em grupos: ${config.configuracoes.responderEmGrupos ? 'SIM' : 'NÃO'}`);
        console.log(`   - Responder em privado: ${config.configuracoes.responderEmPrivado ? 'SIM' : 'NÃO'}`);
        console.log(`   - Responder próprias mensagens: ${config.configuracoes.responderPropriasMensagens ? 'SIM' : 'NÃO'}`);
        console.log(`   - Total de gatilhos: ${config.respostasAutomaticas.length}\n`);
        estado.statusBot = 'conectado';
        estado.qrCodeAtual = null;
        io.emit('status', estado.statusBot);
        io.emit('qrcode', null);
    });

    // Evento: Autenticação bem-sucedida
    estado.cliente.on('authenticated', () => {
        console.log('🔐 Autenticação realizada com sucesso!');
        estado.statusBot = 'autenticado';
        io.emit('status', estado.statusBot);
    });

    // Evento: Falha na autenticação
    estado.cliente.on('auth_failure', (mensagem) => {
        console.error('❌ Falha na autenticação:', mensagem);
        estado.statusBot = 'erro-autenticacao';
        io.emit('status', estado.statusBot);
    });

    // Evento: Cliente desconectado
    estado.cliente.on('disconnected', (motivo) => {
        console.log('🔌 Cliente desconectado:', motivo);
        estado.statusBot = 'desconectado';
        estado.cliente = null;
        io.emit('status', estado.statusBot);
    });

    // Evento: Mensagem recebida (message_create captura TODAS as mensagens, inclusive as suas)
    estado.cliente.on('message_create', async (mensagem) => {
        try {
            const config = configManager.carregar();
            const chat = await mensagem.getChat();
            const ehGrupo = chat.isGroup;

            // DEBUG: Log de mensagem recebida
            console.log(`\n📨 Mensagem recebida: "${mensagem.body}"`);
            console.log(`   fromMe: ${mensagem.fromMe}`);
            console.log(`   ehGrupo: ${ehGrupo}`);
            console.log(`   responderPropriasMensagens: ${config.configuracoes.responderPropriasMensagens}`);

            // Ignora mensagens que o bot acabou de enviar (evita loops)
            if (estado.mensagensEnviadasRecentemente.has(mensagem.id._serialized)) {
                console.log('   ⏭️  Ignorando: mensagem enviada pelo próprio bot');
                return;
            }

            // Verifica se deve ignorar mensagens próprias
            if (mensagem.fromMe && !config.configuracoes.responderPropriasMensagens) {
                console.log('   ❌ Ignorando: mensagem própria e config desativada');
                return;
            }

            // Se for mensagem própria E a config está ativa, pode prosseguir
            // Senão, verifica as regras normais de grupo/privado
            if (!mensagem.fromMe) {
                const deveResponder = (ehGrupo && config.configuracoes.responderEmGrupos) ||
                                     (!ehGrupo && config.configuracoes.responderEmPrivado);
                console.log(`   deveResponder (outros): ${deveResponder}`);
                if (!deveResponder) {
                    console.log('   ❌ Ignorando: regras de grupo/privado');
                    return;
                }
            } else {
                console.log('   ✅ Mensagem própria COM config ativa - processando...');
            }

            // Verifica lista negra
            const textoMensagem = mensagem.body.toLowerCase();
            const estaListaNegra = config.listaNegra.some(termo =>
                textoMensagem.includes(termo.toLowerCase())
            );

            if (estaListaNegra) {
                console.log('   ❌ Ignorando: mensagem contém termo da lista negra');
                return;
            }

            // Procura por gatilhos
            console.log(`   🔍 Procurando gatilhos em ${config.respostasAutomaticas.length} regra(s)...`);
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
                    console.log(`   ✅ Gatilho encontrado! Preparando resposta...`);
                    // Delay aleatório
                    const delayMin = config.configuracoes.intervaloAtraso.minimo * 1000;
                    const delayMax = config.configuracoes.intervaloAtraso.maximo * 1000;
                    const delay = Math.floor(Math.random() * (delayMax - delayMin + 1)) + delayMin;

                    setTimeout(async () => {
                        // Seleciona resposta aleatória se houver múltiplas
                        const respostas = Array.isArray(item.resposta) ? item.resposta : [item.resposta];
                        const respostaEscolhida = respostas[Math.floor(Math.random() * respostas.length)];

                        const mensagemEnviada = await mensagem.reply(respostaEscolhida);

                        // Adiciona ID da mensagem enviada ao Set (evita loops)
                        if (mensagemEnviada && mensagemEnviada.id) {
                            estado.mensagensEnviadasRecentemente.add(mensagemEnviada.id._serialized);
                            // Remove após 10 segundos
                            setTimeout(() => {
                                estado.mensagensEnviadasRecentemente.delete(mensagemEnviada.id._serialized);
                            }, 10000);
                        }

                        // Adiciona ao histórico
                        const registro = {
                            timestamp: new Date().toISOString(),
                            de: mensagem.from,
                            contato: chat.name || mensagem.from,
                            mensagemRecebida: mensagem.body,
                            respostaEnviada: respostaEscolhida,
                            tipo: ehGrupo ? 'grupo' : 'privado'
                        };

                        estado.historicoMensagens.unshift(registro);
                        if (estado.historicoMensagens.length > 100) estado.historicoMensagens.pop();

                        io.emit('nova-resposta', registro);

                        console.log(`✅ Respondido: ${chat.name || mensagem.from}`);
                    }, delay);

                    break;
                }
            }

            console.log('   ℹ️  Processamento da mensagem concluído.\n');
        } catch (erro) {
            console.error('❌ Erro ao processar mensagem:', erro);
        }
    });

    // Inicializa o cliente
    estado.cliente.initialize();
}

async function pararBot(estado, io) {
    if (estado.cliente) {
        console.log('🛑 Parando o bot...');
        await estado.cliente.destroy();
        estado.cliente = null;
        estado.statusBot = 'desconectado';
        io.emit('status', estado.statusBot);
        console.log('✅ Bot parado com sucesso!');
        return true;
    }
    return false;
}

module.exports = { inicializarBot, pararBot };
