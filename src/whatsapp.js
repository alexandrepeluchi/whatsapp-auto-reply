const QRCode = require('qrcode');
const { Client, LocalAuth } = require('whatsapp-web.js');
const configManager = require('./config-manager');

function initializeBot(state, io) {
    if (state.client) {
        console.log('⚠️  Bot já está inicializado');
        return;
    }

    console.log('🤖 Iniciando WhatsApp Bot...\n');

    state.client = new Client({
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
    state.client.on('qr', async (qrCode) => {
        console.log('📱 QR CODE GERADO!');
        state.botStatus = 'aguardando-qr';

        try {
            state.currentQrCode = await QRCode.toDataURL(qrCode);
            io.emit('qrcode', state.currentQrCode);
            io.emit('status', state.botStatus);
        } catch (err) {
            console.error('Erro ao gerar QR Code:', err);
        }
    });

    // Evento: Cliente pronto
    state.client.on('ready', () => {
        const config = configManager.load();
        console.log('✅ Bot conectado com sucesso!');
        console.log('🎯 Listener de mensagens registrado e ativo (capturando TODAS as mensagens)!');
        console.log('📊 Configurações ativas:');
        console.log(`   - Responder em grupos: ${config.settings.replyInGroups ? 'SIM' : 'NÃO'}`);
        console.log(`   - Responder em privado: ${config.settings.replyInPrivate ? 'SIM' : 'NÃO'}`);
        console.log(`   - Responder próprias mensagens: ${config.settings.replyOwnMessages ? 'SIM' : 'NÃO'}`);
        console.log(`   - Total de gatilhos: ${config.autoReplies.length}\n`);
        state.botStatus = 'conectado';
        state.botStartedAt = Date.now();
        state.currentQrCode = null;
        io.emit('status', state.botStatus);
        io.emit('qrcode', null);
    });

    // Evento: Autenticação bem-sucedida
    state.client.on('authenticated', () => {
        console.log('🔐 Autenticação realizada com sucesso!');
        state.botStatus = 'autenticado';
        io.emit('status', state.botStatus);
    });

    // Evento: Falha na autenticação
    state.client.on('auth_failure', (message) => {
        console.error('❌ Falha na autenticação:', message);
        state.botStatus = 'erro-autenticacao';
        io.emit('status', state.botStatus);
    });

    // Evento: Cliente desconectado
    state.client.on('disconnected', (reason) => {
        console.log('🔌 Cliente desconectado:', reason);
        state.botStatus = 'desconectado';
        state.client = null;
        io.emit('status', state.botStatus);
    });

    // Evento: Mensagem recebida (message_create captura TODAS as mensagens, inclusive as suas)
    state.client.on('message_create', async (message) => {
        try {
            const config = configManager.load();
            const chat = await message.getChat();
            const isGroup = chat.isGroup;

            // DEBUG: Log de mensagem recebida
            console.log(`\n📨 Mensagem recebida: "${message.body}"`);
            console.log(`   fromMe: ${message.fromMe}`);
            console.log(`   isGroup: ${isGroup}`);
            console.log(`   replyOwnMessages: ${config.settings.replyOwnMessages}`);
            // Ignora mensagens anteriores ao início do bot (evita processar fila de mensagens antigas)
            const messageTimestamp = message.timestamp * 1000;
            if (state.botStartedAt && messageTimestamp < state.botStartedAt) {
                console.log(`   ⏭️  Ignorando: mensagem anterior ao início do bot (${new Date(messageTimestamp).toLocaleString('pt-BR')})`);
                return;
            }
            // Ignora mensagens que o bot acabou de enviar (evita loops)
            if (state.recentlySentMessages.has(message.id._serialized)) {
                console.log('   ⏭️  Ignorando: mensagem enviada pelo próprio bot');
                return;
            }

            // Registra a mensagem no histórico de mensagens (todas as mensagens)
            const contactName = chat.name || message.from;
            const msgRecord = {
                timestamp: new Date().toISOString(),
                from: message.from,
                contact: contactName,
                body: message.body,
                fromMe: message.fromMe,
                type: isGroup ? 'grupo' : 'privado'
            };
            state.allMessages.unshift(msgRecord);
            if (state.allMessages.length > 200) state.allMessages.pop();
            io.emit('nova-mensagem', msgRecord);

            // Anti-loop: se a mensagem é própria, verifica se o conteúdo bate com alguma resposta configurada
            if (message.fromMe && config.settings.replyOwnMessages) {
                const msgBody = message.body;
                const isAutoReply = config.autoReplies.some(item => {
                    const responses = Array.isArray(item.response) ? item.response : [item.response];
                    return responses.some(r => r === msgBody);
                });

                if (isAutoReply) {
                    console.log('   ⏭️  Ignorando: mensagem própria igual a uma resposta configurada (anti-loop)');
                    return;
                }
            }

            // Verifica se deve ignorar mensagens próprias
            if (message.fromMe && !config.settings.replyOwnMessages) {
                console.log('   ❌ Ignorando: mensagem própria e config desativada');
                return;
            }

            // Se for mensagem própria E a config está ativa, pode prosseguir
            // Senão, verifica as regras normais de grupo/privado
            if (!message.fromMe) {
                const shouldReply = (isGroup && config.settings.replyInGroups) ||
                                     (!isGroup && config.settings.replyInPrivate);
                console.log(`   shouldReply (outros): ${shouldReply}`);
                if (!shouldReply) {
                    console.log('   ❌ Ignorando: regras de grupo/privado');
                    return;
                }
            } else {
                console.log('   ✅ Mensagem própria COM config ativa - processando...');
            }

            // Verifica blacklist de grupos
            if (isGroup && config.groupBlacklist && config.groupBlacklist.length > 0) {
                const groupName = (chat.name || '').toLowerCase();
                const isGroupBlacklisted = config.groupBlacklist.some(term =>
                    groupName.includes(term.toLowerCase())
                );

                if (isGroupBlacklisted) {
                    console.log(`   ❌ Ignorando: grupo "${chat.name}" está na lista negra de grupos`);
                    return;
                }
            }

            // Verifica blacklist de palavras
            const messageText = message.body.toLowerCase();
            const isBlacklisted = config.blacklist.some(term =>
                messageText.includes(term.toLowerCase())
            );

            if (isBlacklisted) {
                console.log('   ❌ Ignorando: mensagem contém termo da lista negra');
                return;
            }

            // Procura por gatilhos
            console.log(`   🔍 Procurando gatilhos em ${config.autoReplies.length} regra(s)...`);
            for (const item of config.autoReplies) {
                const triggerFound = item.triggers.some(trigger => {
                    const comparisonText = config.settings.caseSensitive ?
                        message.body : messageText;
                    const triggerComparison = config.settings.caseSensitive ?
                        trigger : trigger.toLowerCase();

                    if (config.settings.wholeWord) {
                        const regex = new RegExp(`\\b${triggerComparison}\\b`);
                        return regex.test(comparisonText);
                    } else {
                        return comparisonText.includes(triggerComparison);
                    }
                });

                if (triggerFound) {
                    console.log(`   ✅ Gatilho encontrado! Preparando resposta...`);
                    // Delay: fixo se max não definido, aleatório se ambos definidos
                    const delayMin = config.settings.delayRange.min * 1000;
                    const delayMax = config.settings.delayRange.max ? config.settings.delayRange.max * 1000 : null;
                    const delay = delayMax
                        ? Math.floor(Math.random() * (delayMax - delayMin + 1)) + delayMin
                        : delayMin;

                    console.log(`   ⏳ Aguardando ${(delay / 1000).toFixed(1)}s para responder ${contactName}...`);

                    setTimeout(async () => {
                        // Seleciona resposta aleatória se houver múltiplas
                        const responses = Array.isArray(item.response) ? item.response : [item.response];
                        const chosenResponse = responses[Math.floor(Math.random() * responses.length)];

                        const sentMessage = await message.reply(chosenResponse);

                        console.log(`   ✅ Respondido: ${contactName}`);

                        // Adiciona ID da mensagem enviada ao Set (evita loops)
                        if (sentMessage && sentMessage.id) {
                            state.recentlySentMessages.add(sentMessage.id._serialized);
                            // Remove após 10 segundos
                            setTimeout(() => {
                                state.recentlySentMessages.delete(sentMessage.id._serialized);
                            }, 10000);
                        }

                        // Adiciona ao histórico
                        const record = {
                            timestamp: new Date().toISOString(),
                            from: message.from,
                            contact: contactName,
                            receivedMessage: message.body,
                            sentReply: chosenResponse,
                            type: isGroup ? 'grupo' : 'privado'
                        };

                        state.messageHistory.unshift(record);
                        if (state.messageHistory.length > 100) state.messageHistory.pop();

                        io.emit('nova-resposta', record);
                    }, delay);

                    break;
                }
            }

            console.log('   ℹ️  Processamento da mensagem concluído.\n');
        } catch (error) {
            console.error('❌ Erro ao processar mensagem:', error);
        }
    });

    // Inicializa o cliente
    state.client.initialize();
}

async function stopBot(state, io) {
    if (state.client) {
        console.log('🛑 Parando o bot...');
        const stoppedAt = new Date().toLocaleString('pt-BR');
        await state.client.destroy();
        state.client = null;
        state.botStatus = 'desconectado';
        state.botStartedAt = null;
        io.emit('status', state.botStatus);
        console.log(`\u2705 Bot parado com sucesso! (${stoppedAt})`);
        return true;
    }
    return false;
}

module.exports = { initializeBot, stopBot };
