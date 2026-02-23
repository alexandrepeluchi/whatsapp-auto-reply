const { Client, LocalAuth } = require('whatsapp-web.js');
const qrGenerator = require('qrcode-terminal');
const config = require('./config');

// Para evitar loops - armazena IDs de mensagens enviadas recentemente
const recentlySentMessages = new Set();

console.log('🤖 Iniciando WhatsApp Bot...\n');

// Cria o cliente do WhatsApp com autenticação local
const client = new Client({
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

// Evento: Gera o QR Code para escanear
client.on('qr', (qrCode) => {
    console.log('📱 QR CODE GERADO!');
    console.log('👉 Escaneie o código abaixo com seu WhatsApp:\n');
    qrGenerator.generate(qrCode, { small: true });
    console.log('\n⚠️  Para escanear:');
    console.log('   1. Abra o WhatsApp no seu celular');
    console.log('   2. Toque em Menu (⋮) > Aparelhos conectados');
    console.log('   3. Toque em "Conectar um aparelho"');
    console.log('   4. Aponte a câmera para o QR Code acima\n');
});

// Evento: Cliente está pronto e conectado
client.on('ready', () => {
    console.log('✅ Bot conectado com sucesso!');
    console.log('🟢 Bot está rodando e pronto para responder mensagens...\n');
    console.log('🎯 Listener de mensagens ativo (capturando TODAS as mensagens)!');
    console.log('📊 Configurações ativas:');
    console.log(`   - Responder em grupos: ${config.settings.replyInGroups ? 'SIM' : 'NÃO'}`);
    console.log(`   - Responder em privado: ${config.settings.replyInPrivate ? 'SIM' : 'NÃO'}`);
    console.log(`   - Responder próprias mensagens: ${config.settings.replyOwnMessages ? 'SIM' : 'NÃO'}`);
    console.log(`   - Total de gatilhos: ${config.autoReplies.length}\n`);
});

// Evento: Autenticação bem-sucedida
client.on('authenticated', () => {
    console.log('🔐 Autenticação realizada com sucesso!');
});

// Evento: Falha na autenticação
client.on('auth_failure', (msg) => {
    console.error('❌ Falha na autenticação:', msg);
    console.log('💡 Tente deletar a pasta .wwebjs_auth e escanear o QR Code novamente.');
});

// Evento: Cliente desconectado
client.on('disconnected', (reason) => {
    console.log('⚠️  Cliente desconectado:', reason);
    console.log('🔄 Tentando reconectar...');
});

// Função para verificar se a mensagem contém algum gatilho
function checkTriggers(messageBody) {
    const messageText = config.settings.caseSensitive 
        ? messageBody 
        : messageBody.toLowerCase();

    for (const autoReply of config.autoReplies) {
        for (const trigger of autoReply.triggers) {
            let found = false;
            
            // Se requireAll é true, gatilho é um array de palavras
            if (autoReply.requireAll && Array.isArray(trigger)) {
                // Verificar se TODAS as palavras/padrões do gatilho estão na mensagem
                found = trigger.every(word => {
                    // Se tem isRegex, tratar como expressão regular
                    if (autoReply.isRegex && word.includes('\\')) {
                        try {
                            const regex = new RegExp(word, config.settings.caseSensitive ? '' : 'i');
                            return regex.test(messageText);
                        } catch (e) {
                            console.error(`❌ Erro no regex "${word}":`, e.message);
                            return false;
                        }
                    }
                    
                    // Senão, busca normal por palavra
                    const wordToSearch = config.settings.caseSensitive ? word : word.toLowerCase();
                    
                    if (config.settings.wholeWord) {
                        // Verificar palavra completa
                        const regex = new RegExp(`\\b${wordToSearch}\\b`, 'i');
                        return regex.test(messageText);
                    } else {
                        // Verificar se contém a palavra
                        return messageText.includes(wordToSearch);
                    }
                });
            } else {
                // Modo antigo: busca por string completa
                const triggerText = config.settings.caseSensitive 
                    ? trigger 
                    : trigger.toLowerCase();

                if (config.settings.wholeWord) {
                    const regex = new RegExp(`\\b${triggerText}\\b`, 'i');
                    found = regex.test(messageText);
                } else {
                    found = messageText.includes(triggerText);
                }
            }

            if (found) {
                // Se há múltiplas respostas, escolher uma aleatória
                if (Array.isArray(autoReply.responses)) {
                    const randomIndex = Math.floor(Math.random() * autoReply.responses.length);
                    return autoReply.responses[randomIndex];
                }
                // Compatibilidade com resposta única (deprecated)
                return autoReply.response || autoReply.responses;
            }
        }
    }
    
    return null;
}

// Função para gerar delay aleatório
function getRandomDelay(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min) * 1000;
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Função para formatar data e hora
function getFormattedTimestamp() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

// Função para verificar se a mensagem está na blacklist
function isBlacklisted(messageBody) {
    const messageText = messageBody.toLowerCase();
    
    for (const blacklistPattern of config.blacklist) {
        if (messageText.includes(blacklistPattern.toLowerCase())) {
            return true;
        }
    }
    
    return false;
}

// Evento: Nova mensagem recebida
// Evento: Mensagem recebida (message_create captura TODAS as mensagens, inclusive as suas)
client.on('message_create', async (message) => {
    try {
        // Ignorar mensagens que o próprio bot enviou (prevenção de loop)
        if (recentlySentMessages.has(message.id._serialized)) {
            console.log('⏭️  Ignorando: mensagem enviada pelo próprio bot');
            return;
        }

        // Verifica se deve ignorar mensagens próprias
        if (message.fromMe && !config.settings.replyOwnMessages) {
            return; // Ignora mensagens enviadas por você mesmo
        }

        // Verificar blacklist PRIMEIRO (spam, propagandas, etc)
        if (isBlacklisted(message.body)) {
            return; // Não responder mensagens da lista negra
        }

        // Verificar gatilhos (antes de fazer operações pesadas)
        const reply = checkTriggers(message.body);
        if (!reply) return; // Se não há resposta, não precisa continuar
        
        // Obter informações do chat com timeout
        let chat;
        try {
            chat = await Promise.race([
                message.getChat(),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout ao obter chat')), 10000)
                )
            ]);
        } catch (chatError) {
            // Atraso aleatório configurável
            const delay = getRandomDelay(config.settings.delayRange.min, config.settings.delayRange.max);
            const timestamp = getFormattedTimestamp();
            
            console.log('\n────────────────────────────────────────');
            console.log(`📅 ${timestamp}`);
            console.log(`📩 Mensagem: "${message.body}"`);
            console.log(`🎯 Resposta escolhida: "${reply}"`);
            console.log(`⏳ Aguardando ${delay / 1000}s antes de responder...`);
            
            await wait(delay);
            
            // Responde mesmo sem conseguir pegar info da conversa
            const sentMessage = await message.reply(reply);
            
            // Armazena no Set para evitar loops
            recentlySentMessages.add(sentMessage.id._serialized);
            setTimeout(() => {
                recentlySentMessages.delete(sentMessage.id._serialized);
            }, 10000); // Remove após 10 segundos
            
            console.log(`✅ Resposta enviada!`);
            console.log('────────────────────────────────────────');
            return;
        }
        
        const isGroup = chat.isGroup;
        
        // Verificar se deve responder baseado no tipo de conversa
        // Se for mensagem própria com config ativa, ignora essas regras
        if (!message.fromMe) {
            if (isGroup && !config.settings.replyInGroups) return;
            if (!isGroup && !config.settings.replyInPrivate) return;
        }
        
        // Atraso aleatório configurável
        const delay = getRandomDelay(config.settings.delayRange.min, config.settings.delayRange.max);
        const chatName = isGroup ? chat.name : 'Privado';
        const timestamp = getFormattedTimestamp();
        
        // Log completo antes de aguardar (tudo junto, síncrono)
        console.log('\n────────────────────────────────────────');
        console.log(`📅 ${timestamp}`);
        console.log(`📩 ${chatName} ${isGroup ? '(Grupo)' : ''}: "${message.body}"`);
        console.log(`🎯 Resposta escolhida: "${reply}"`);
        console.log(`⏳ Aguardando ${delay / 1000}s antes de responder...`);
        
        // Aguardar (silenciosamente)
        await wait(delay);
        
        // Enviar resposta
        const sentMessage = await message.reply(reply);
        
        // Armazena no Set para evitar loops
        recentlySentMessages.add(sentMessage.id._serialized);
        setTimeout(() => {
            recentlySentMessages.delete(sentMessage.id._serialized);
        }, 10000); // Remove após 10 segundos
        
        console.log(`✅ Resposta enviada!`);
        console.log('────────────────────────────────────────');
        
    } catch (error) {
        console.error('❌ Erro ao processar mensagem:', error.message || error);
        // Tentar responder mesmo com erro
        try {
            const reply = checkTriggers(message.body);
            if (reply) {
                const delay = getRandomDelay(config.settings.delayRange.min, config.settings.delayRange.max);
                const timestamp = getFormattedTimestamp();
                
                console.log('\n────────────────────────────────────────');
                console.log(`📅 ${timestamp}`);
                console.log(`📩 Mensagem: "${message.body}"`);
                console.log(`🎯 Resposta escolhida: "${reply}"`);
                console.log(`⏳ Aguardando ${delay / 1000}s antes de responder...`);
                
                await wait(delay);
                const sentMessage = await message.reply(reply);
                
                // Armazena no Set para evitar loops
                recentlySentMessages.add(sentMessage.id._serialized);
                setTimeout(() => {
                    recentlySentMessages.delete(sentMessage.id._serialized);
                }, 10000); // Remove após 10 segundos
                
                console.log(`✅ Resposta enviada! (apesar do erro anterior)`);
                console.log('────────────────────────────────────────');
            }
        } catch (replyError) {
            console.error('❌ Não foi possível enviar resposta:', replyError.message || replyError);
        }
    }
});

// Tratamento de erros gerais
process.on('unhandledRejection', (error) => {
    console.error('❌ Erro não tratado:', error);
});

// Inicializar o cliente
client.initialize();

console.log('⏳ Aguardando conexão...\n');
