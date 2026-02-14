const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const config = require('./config');

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
client.on('qr', (qr) => {
    console.log('📱 QR CODE GERADO!');
    console.log('👉 Escaneie o código abaixo com seu WhatsApp:\n');
    qrcode.generate(qr, { small: true });
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
    console.log('📊 Configurações ativas:');
    console.log(`   - Responder em grupos: ${config.settings.respondToGroups ? 'SIM' : 'NÃO'}`);
    console.log(`   - Responder em privado: ${config.settings.respondToPrivate ? 'SIM' : 'NÃO'}`);
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
function checkTriggers(message) {
    const messageText = config.settings.caseSensitive 
        ? message 
        : message.toLowerCase();

    for (const autoReply of config.autoReplies) {
        for (const trigger of autoReply.triggers) {
            let match = false;
            
            // Se requireAll é true, trigger é um array de palavras
            if (autoReply.requireAll && Array.isArray(trigger)) {
                // Verificar se TODAS as palavras/padrões do trigger estão na mensagem
                match = trigger.every(word => {
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
                    const wordToFind = config.settings.caseSensitive ? word : word.toLowerCase();
                    
                    if (config.settings.matchWholeWord) {
                        // Verificar palavra completa
                        const regex = new RegExp(`\\b${wordToFind}\\b`, 'i');
                        return regex.test(messageText);
                    } else {
                        // Verificar se contém a palavra
                        return messageText.includes(wordToFind);
                    }
                });
            } else {
                // Modo antigo: busca por string completa
                const triggerText = config.settings.caseSensitive 
                    ? trigger 
                    : trigger.toLowerCase();

                if (config.settings.matchWholeWord) {
                    const regex = new RegExp(`\\b${triggerText}\\b`, 'i');
                    match = regex.test(messageText);
                } else {
                    match = messageText.includes(triggerText);
                }
            }

            if (match) {
                // Se há múltiplas respostas, escolher uma aleatória
                if (Array.isArray(autoReply.responses)) {
                    const randomIndex = Math.floor(Math.random() * autoReply.responses.length);
                    return autoReply.responses[randomIndex];
                }
                // Compatibilidade com response única (deprecated)
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

function sleep(ms) {
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
function isBlacklisted(message) {
    const messageText = message.toLowerCase();
    
    for (const blacklistPattern of config.blacklist) {
        if (messageText.includes(blacklistPattern.toLowerCase())) {
            return true;
        }
    }
    
    return false;
}

// Evento: Nova mensagem recebida
client.on('message', async (message) => {
    try {
        // Não responder mensagens próprias
        if (message.fromMe) return;

        // Verificar blacklist PRIMEIRO (mensagens de oferta)
        if (isBlacklisted(message.body)) {
            return; // Não responder se for oferta de plantão
        }

        // Verificar gatilhos (antes de fazer operações pesadas)
        const response = checkTriggers(message.body);
        if (!response) return; // Se não há resposta, não precisa continuar
        
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
            // Delay aleatório configurável
            const delay = getRandomDelay(config.settings.delayRange.min, config.settings.delayRange.max);
            const timestamp = getFormattedTimestamp();
            
            console.log('\n────────────────────────────────────────');
            console.log(`📅 ${timestamp}`);
            console.log(`📩 Mensagem: "${message.body}"`);
            console.log(`🎯 Resposta escolhida: "${response}"`);
            console.log(`⏳ Aguardando ${delay / 1000}s antes de responder...`);
            
            await sleep(delay);
            
            // Responde mesmo sem conseguir pegar info do chat
            await message.reply(response);
            console.log(`✅ Resposta enviada!`);
            console.log('────────────────────────────────────────');
            return;
        }
        
        const isGroup = chat.isGroup;
        
        // Verificar se deve responder baseado no tipo de chat
        if (isGroup && !config.settings.respondToGroups) return;
        if (!isGroup && !config.settings.respondToPrivate) return;
        
        // Delay aleatório configurável
        const delay = getRandomDelay(config.settings.delayRange.min, config.settings.delayRange.max);
        const chatName = isGroup ? chat.name : 'Privado';
        const timestamp = getFormattedTimestamp();
        
        // Log completo antes de aguardar (tudo junto, síncrono)
        console.log('\n────────────────────────────────────────');
        console.log(`📅 ${timestamp}`);
        console.log(`📩 ${chatName} ${isGroup ? '(Grupo)' : ''}: "${message.body}"`);
        console.log(`🎯 Resposta escolhida: "${response}"`);
        console.log(`⏳ Aguardando ${delay / 1000}s antes de responder...`);
        
        // Aguardar (silenciosamente)
        await sleep(delay);
        
        // Enviar resposta
        await message.reply(response);
        console.log(`✅ Resposta enviada!`);
        console.log('────────────────────────────────────────');
        
    } catch (error) {
        console.error('❌ Erro ao processar mensagem:', error.message || error);
        // Tentar responder mesmo com erro
        try {
            const response = checkTriggers(message.body);
            if (response) {
                const delay = getRandomDelay(config.settings.delayRange.min, config.settings.delayRange.max);
                const timestamp = getFormattedTimestamp();
                
                console.log('\n────────────────────────────────────────');
                console.log(`📅 ${timestamp}`);
                console.log(`📩 Mensagem: "${message.body}"`);
                console.log(`🎯 Resposta escolhida: "${response}"`);
                console.log(`⏳ Aguardando ${delay / 1000}s antes de responder...`);
                
                await sleep(delay);
                await message.reply(response);
                
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
