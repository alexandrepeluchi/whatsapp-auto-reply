// ==================== CLIENTE WHATSAPP ====================
// Módulo responsável por toda a comunicação com o WhatsApp via whatsapp-web.js.
// Gerencia o ciclo de vida do bot: inicialização, autenticação, processamento
// de mensagens, envio de respostas automáticas e desconexão.

const QRCode = require('qrcode');
const { Client, LocalAuth } = require('whatsapp-web.js');
const configManager = require('./config-manager');

/**
 * Inicializa o cliente do WhatsApp e registra todos os event listeners.
 * Configura autenticação local, geração de QR Code, processamento de mensagens
 * e reconexão automática em caso de falha.
 * @param {Object} state - Estado global compartilhado da aplicação
 * @param {import('socket.io').Server} io - Instância do Socket.IO para emitir eventos ao dashboard
 */
function initializeBot(state, io) {
    if (state.client) {
        console.log('⚠️  Bot já está inicializado');
        return;
    }

    console.log('🤖 Iniciando WhatsApp Bot...\n');

    // Cria o cliente com autenticação local (sessão persistida em .wwebjs_auth)
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

    // ==================== EVENTOS DE CONEXÃO ====================

    // QR Code gerado — converte para base64 e envia ao dashboard
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

    // Cliente pronto para receber mensagens — loga configurações ativas
    state.client.on('ready', () => {
        const config = configManager.load();
        console.log('✅ Bot conectado com sucesso!');
        console.log('🎯 Listener de mensagens ativo');
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

    // Autenticação bem-sucedida (ocorre antes do 'ready')
    state.client.on('authenticated', () => {
        console.log('🔐 Autenticação realizada com sucesso!');
        state.botStatus = 'autenticado';
        io.emit('status', state.botStatus);
    });

    // Falha na autenticação — sessão inválida ou expirada
    state.client.on('auth_failure', (message) => {
        console.error('❌ Falha na autenticação:', message);
        state.botStatus = 'erro-autenticacao';
        io.emit('status', state.botStatus);
    });

    // Cliente desconectado — limpa o estado para permitir nova inicialização
    state.client.on('disconnected', (reason) => {
        console.log('🔌 Cliente desconectado:', reason);
        state.botStatus = 'desconectado';
        state.client = null;
        io.emit('status', state.botStatus);
    });

    // ==================== PROCESSAMENTO DE MENSAGENS ====================
    // Usa 'message_create' para capturar TODAS as mensagens (recebidas e enviadas)

    state.client.on('message_create', async (message) => {
        try {
            const config = configManager.load();
            const chat = await message.getChat();
            const isGroup = chat.isGroup;

            console.log(`\n📨 Mensagem recebida: "${message.body}"`);
            console.log(`   fromMe: ${message.fromMe} | isGroup: ${isGroup}`);

            // --- FILTRO 1: Ignora mensagens anteriores ao início do bot ---
            // Evita processar mensagens acumuladas na fila antes da conexão
            const messageTimestamp = message.timestamp * 1000;
            if (state.botStartedAt && messageTimestamp < state.botStartedAt) {
                console.log(`   ⏭️  Ignorando: mensagem anterior ao início do bot`);
                return;
            }

            // --- FILTRO 2: Ignora mensagens recém-enviadas pelo próprio bot ---
            // Previne loops infinitos (bot respondendo à própria resposta)
            if (state.recentlySentMessages.has(message.id._serialized)) {
                console.log('   ⏭️  Ignorando: mensagem enviada pelo próprio bot');
                return;
            }

            // --- REGISTRO NO HISTÓRICO DE MENSAGENS ---
            // Salva todas as mensagens recebidas para exibição no dashboard
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

            // --- FILTRO 3: Anti-loop para mensagens próprias ---
            // Se replyOwnMessages está ativo, verifica se a mensagem é idêntica a uma resposta configurada
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

            // --- FILTRO 4: Mensagens próprias sem permissão ---
            if (message.fromMe && !config.settings.replyOwnMessages) {
                console.log('   ❌ Ignorando: mensagem própria (config desativada)');
                return;
            }

            // --- FILTRO 5: Regras de grupo/privado ---
            // Verifica se o bot deve responder neste tipo de chat
            if (!message.fromMe) {
                const shouldReply = (isGroup && config.settings.replyInGroups) ||
                                     (!isGroup && config.settings.replyInPrivate);
                if (!shouldReply) {
                    console.log('   ❌ Ignorando: tipo de chat não permitido');
                    return;
                }
            }

            // --- FILTRO 6: Lista negra de grupos ---
            // Verifica se o nome do grupo contém algum termo bloqueado
            if (isGroup && config.groupBlacklist && config.groupBlacklist.length > 0) {
                const groupName = (chat.name || '').toLowerCase();
                const isGroupBlacklisted = config.groupBlacklist.some(term =>
                    groupName.includes(term.toLowerCase())
                );

                if (isGroupBlacklisted) {
                    console.log(`   ❌ Ignorando: grupo "${chat.name}" está na lista negra`);
                    return;
                }
            }

            // --- FILTRO 7: Lista negra de palavras ---
            // Verifica se a mensagem contém algum termo bloqueado
            const messageText = message.body.toLowerCase();
            const isBlacklisted = config.blacklist.some(term =>
                messageText.includes(term.toLowerCase())
            );

            if (isBlacklisted) {
                console.log('   ❌ Ignorando: mensagem contém termo da lista negra');
                return;
            }

            // --- BUSCA DE GATILHOS E ENVIO DE RESPOSTA ---
            // Percorre as regras de resposta automática procurando um gatilho correspondente
            console.log(`   🔍 Procurando gatilhos em ${config.autoReplies.length} regra(s)...`);

            for (const item of config.autoReplies) {
                const triggerFound = item.triggers.some(trigger => {
                    // Aplica case-sensitivity conforme configuração
                    const comparisonText = config.settings.caseSensitive ? message.body : messageText;
                    const triggerComparison = config.settings.caseSensitive ? trigger : trigger.toLowerCase();

                    // wholeWord: usa regex com word boundary (\b) para exigir palavra completa
                    if (config.settings.wholeWord) {
                        const regex = new RegExp(`\\b${triggerComparison}\\b`);
                        return regex.test(comparisonText);
                    } else {
                        return comparisonText.includes(triggerComparison);
                    }
                });

                if (triggerFound) {
                    console.log(`   ✅ Gatilho encontrado! Preparando resposta...`);

                    // Calcula o delay (fixo ou aleatório) para simular digitação humana
                    const delayMin = config.settings.delayRange.min * 1000;
                    const delayMax = config.settings.delayRange.max ? config.settings.delayRange.max * 1000 : null;
                    const delay = delayMax
                        ? Math.floor(Math.random() * (delayMax - delayMin + 1)) + delayMin
                        : delayMin;

                    console.log(`   ⏳ Aguardando ${(delay / 1000).toFixed(1)}s para responder ${contactName}...`);

                    // Envia a resposta após o delay calculado
                    setTimeout(async () => {
                        // Se houver múltiplas respostas, escolhe uma aleatoriamente
                        const responses = Array.isArray(item.response) ? item.response : [item.response];
                        const chosenResponse = responses[Math.floor(Math.random() * responses.length)];

                        const sentMessage = await message.reply(chosenResponse);
                        console.log(`   ✅ Respondido: ${contactName}`);

                        // Registra o ID da mensagem enviada para evitar loops (expira em 10s)
                        if (sentMessage && sentMessage.id) {
                            state.recentlySentMessages.add(sentMessage.id._serialized);
                            setTimeout(() => {
                                state.recentlySentMessages.delete(sentMessage.id._serialized);
                            }, 10000);
                        }

                        // Registra no histórico de respostas e notifica o dashboard
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

                    // Interrompe a busca após encontrar o primeiro gatilho correspondente
                    break;
                }
            }

            console.log('   ℹ️  Processamento da mensagem concluído.\n');
        } catch (error) {
            console.error('❌ Erro ao processar mensagem:', error);
        }
    });

    // ==================== INICIALIZAÇÃO COM AUTO-RECONEXÃO ====================
    // Tenta inicializar o cliente. Em caso de falha, aguarda 5s e tenta novamente.

    state.client.initialize().catch(async (err) => {
        console.error('❌ Erro ao inicializar o bot:', err.message);
        console.log('🔄 Tentando reiniciar em 5 segundos...');
        
        // Limpa o cliente com erro antes de tentar novamente
        try {
            if (state.client) {
                await state.client.destroy().catch(() => {});
            }
        } catch (e) { /* ignora */ }
        
        state.client = null;
        state.botStatus = 'desconectado';
        io.emit('status', state.botStatus);
        
        setTimeout(() => {
            console.log('🔄 Reiniciando bot automaticamente...');
            initializeBot(state, io);
        }, 5000);
    });
}

/**
 * Para o bot do WhatsApp, desconectando o cliente e limpando o estado.
 * @param {Object} state - Estado global compartilhado da aplicação
 * @param {import('socket.io').Server} io - Instância do Socket.IO
 * @returns {Promise<boolean>} true se o bot foi parado, false se já estava parado
 */
async function stopBot(state, io) {
    if (state.client) {
        console.log('🛑 Parando o bot...');
        const stoppedAt = new Date().toLocaleString('pt-BR');
        await state.client.destroy();
        state.client = null;
        state.botStatus = 'desconectado';
        state.botStartedAt = null;
        io.emit('status', state.botStatus);
        console.log(`✅ Bot parado com sucesso! (${stoppedAt})`);
        return true;
    }
    return false;
}

module.exports = { initializeBot, stopBot };
