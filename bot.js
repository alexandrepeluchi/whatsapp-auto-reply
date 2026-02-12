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
        ? message.toLowerCase() 
        : message.toLowerCase();

    for (const autoReply of config.autoReplies) {
        for (const trigger of autoReply.triggers) {
            const triggerText = config.settings.caseSensitive 
                ? trigger 
                : trigger.toLowerCase();

            let match = false;
            
            if (config.settings.matchWholeWord) {
                // Verificar palavra completa
                const regex = new RegExp(`\\b${triggerText}\\b`, 'i');
                match = regex.test(messageText);
            } else {
                // Verificar se contém a palavra
                match = messageText.includes(triggerText);
            }

            if (match) {
                return autoReply.response;
            }
        }
    }
    
    return null;
}

// Evento: Nova mensagem recebida
client.on('message', async (message) => {
    try {
        const chat = await message.getChat();
        const isGroup = chat.isGroup;
        
        // Verificar se deve responder baseado no tipo de chat
        if (isGroup && !config.settings.respondToGroups) return;
        if (!isGroup && !config.settings.respondToPrivate) return;

        // Não responder mensagens próprias
        if (message.fromMe) return;

        // Verificar gatilhos
        const response = checkTriggers(message.body);
        
        if (response) {
            // Log da mensagem recebida
            const chatName = isGroup ? chat.name : (await message.getContact()).pushname || 'Desconhecido';
            console.log(`📩 Mensagem de ${chatName} ${isGroup ? '(Grupo)' : '(Privado)'}: "${message.body}"`);
            console.log(`🤖 Respondendo: "${response}"\n`);
            
            // Enviar resposta
            await message.reply(response);
        }
    } catch (error) {
        console.error('❌ Erro ao processar mensagem:', error);
    }
});

// Tratamento de erros gerais
process.on('unhandledRejection', (error) => {
    console.error('❌ Erro não tratado:', error);
});

// Inicializar o cliente
client.initialize();

console.log('⏳ Aguardando conexão...\n');
