const { Client, LocalAuth } = require('whatsapp-web.js');
const geradorQRCode = require('qrcode-terminal');
const configuracao = require('./config');

console.log('🤖 Iniciando WhatsApp Bot...\n');

// Cria o cliente do WhatsApp com autenticação local
const cliente = new Client({
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
cliente.on('qr', (codigoQR) => {
    console.log('📱 QR CODE GERADO!');
    console.log('👉 Escaneie o código abaixo com seu WhatsApp:\n');
    geradorQRCode.generate(codigoQR, { small: true });
    console.log('\n⚠️  Para escanear:');
    console.log('   1. Abra o WhatsApp no seu celular');
    console.log('   2. Toque em Menu (⋮) > Aparelhos conectados');
    console.log('   3. Toque em "Conectar um aparelho"');
    console.log('   4. Aponte a câmera para o QR Code acima\n');
});

// Evento: Cliente está pronto e conectado
cliente.on('ready', () => {
    console.log('✅ Bot conectado com sucesso!');
    console.log('🟢 Bot está rodando e pronto para responder mensagens...\n');
    console.log('📊 Configurações ativas:');
    console.log(`   - Responder em grupos: ${configuracao.configuracoes.responderEmGrupos ? 'SIM' : 'NÃO'}`);
    console.log(`   - Responder em privado: ${configuracao.configuracoes.responderEmPrivado ? 'SIM' : 'NÃO'}`);
    console.log(`   - Total de gatilhos: ${configuracao.respostasAutomaticas.length}\n`);
});

// Evento: Autenticação bem-sucedida
cliente.on('authenticated', () => {
    console.log('🔐 Autenticação realizada com sucesso!');
});

// Evento: Falha na autenticação
cliente.on('auth_failure', (msg) => {
    console.error('❌ Falha na autenticação:', msg);
    console.log('💡 Tente deletar a pasta .wwebjs_auth e escanear o QR Code novamente.');
});

// Evento: Cliente desconectado
cliente.on('disconnected', (reason) => {
    console.log('⚠️  Cliente desconectado:', reason);
    console.log('🔄 Tentando reconectar...');
});

// Função para verificar se a mensagem contém algum gatilho
function verificarGatilhos(mensagem) {
    const textoMensagem = configuracao.configuracoes.diferenciarMaiusculas 
        ? mensagem 
        : mensagem.toLowerCase();

    for (const respostaAutomatica of configuracao.respostasAutomaticas) {
        for (const gatilho of respostaAutomatica.gatilhos) {
            let encontrou = false;
            
            // Se requireAll é true, gatilho é um array de palavras
            if (respostaAutomatica.requireAll && Array.isArray(gatilho)) {
                // Verificar se TODAS as palavras/padrões do gatilho estão na mensagem
                encontrou = gatilho.every(palavra => {
                    // Se tem isRegex, tratar como expressão regular
                    if (respostaAutomatica.isRegex && palavra.includes('\\')) {
                        try {
                            const regex = new RegExp(palavra, configuracao.configuracoes.diferenciarMaiusculas ? '' : 'i');
                            return regex.test(textoMensagem);
                        } catch (e) {
                            console.error(`❌ Erro no regex "${palavra}":`, e.message);
                            return false;
                        }
                    }
                    
                    // Senão, busca normal por palavra
                    const palavraParaProcurar = configuracao.configuracoes.diferenciarMaiusculas ? palavra : palavra.toLowerCase();
                    
                    if (configuracao.configuracoes.palavraInteira) {
                        // Verificar palavra completa
                        const regex = new RegExp(`\\b${palavraParaProcurar}\\b`, 'i');
                        return regex.test(textoMensagem);
                    } else {
                        // Verificar se contém a palavra
                        return textoMensagem.includes(palavraParaProcurar);
                    }
                });
            } else {
                // Modo antigo: busca por string completa
                const gatilhoTexto = configuracao.configuracoes.diferenciarMaiusculas 
                    ? gatilho 
                    : gatilho.toLowerCase();

                if (configuracao.configuracoes.palavraInteira) {
                    const regex = new RegExp(`\\b${gatilhoTexto}\\b`, 'i');
                    encontrou = regex.test(textoMensagem);
                } else {
                    encontrou = textoMensagem.includes(gatilhoTexto);
                }
            }

            if (encontrou) {
                // Se há múltiplas respostas, escolher uma aleatória
                if (Array.isArray(respostaAutomatica.respostas)) {
                    const indiceAleatorio = Math.floor(Math.random() * respostaAutomatica.respostas.length);
                    return respostaAutomatica.respostas[indiceAleatorio];
                }
                // Compatibilidade com resposta única (deprecated)
                return respostaAutomatica.resposta || respostaAutomatica.respostas;
            }
        }
    }
    
    return null;
}

// Função para gerar delay aleatório
function obterAtrasoAleatorio(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min) * 1000;
}

function aguardar(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Função para formatar data e hora
function obterTimestampFormatado() {
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
function estaNaListaNegra(mensagem) {
    const textoMensagem = mensagem.toLowerCase();
    
    for (const padraoListaNegra of configuracao.listaNegra) {
        if (textoMensagem.includes(padraoListaNegra.toLowerCase())) {
            return true;
        }
    }
    
    return false;
}

// Evento: Nova mensagem recebida
cliente.on('message', async (mensagem) => {
    try {
        // Não responder mensagens próprias
        if (mensagem.fromMe) return;

        // Verificar blacklist PRIMEIRO (spam, propagandas, etc)
        if (estaNaListaNegra(mensagem.body)) {
            return; // Não responder mensagens da lista negra
        }

        // Verificar gatilhos (antes de fazer operações pesadas)
        const resposta = verificarGatilhos(mensagem.body);
        if (!resposta) return; // Se não há resposta, não precisa continuar
        
        // Obter informações do chat com timeout
        let conversa;
        try {
            conversa = await Promise.race([
                mensagem.getChat(),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout ao obter chat')), 10000)
                )
            ]);
        } catch (erroConversa) {
            // Atraso aleatório configurável
            const atraso = obterAtrasoAleatorio(configuracao.configuracoes.intervaloAtraso.minimo, configuracao.configuracoes.intervaloAtraso.maximo);
            const horario = obterTimestampFormatado();
            
            console.log('\n────────────────────────────────────────');
            console.log(`📅 ${horario}`);
            console.log(`📩 Mensagem: "${mensagem.body}"`);
            console.log(`🎯 Resposta escolhida: "${resposta}"`);
            console.log(`⏳ Aguardando ${atraso / 1000}s antes de responder...`);
            
            await aguardar(atraso);
            
            // Responde mesmo sem conseguir pegar info da conversa
            await mensagem.reply(resposta);
            console.log(`✅ Resposta enviada!`);
            console.log('────────────────────────────────────────');
            return;
        }
        
        const ehGrupo = conversa.isGroup;
        
        // Verificar se deve responder baseado no tipo de conversa
        if (ehGrupo && !configuracao.configuracoes.responderEmGrupos) return;
        if (!ehGrupo && !configuracao.configuracoes.responderEmPrivado) return;
        
        // Atraso aleatório configurável
        const atraso = obterAtrasoAleatorio(configuracao.configuracoes.intervaloAtraso.minimo, configuracao.configuracoes.intervaloAtraso.maximo);
        const nomeConversa = ehGrupo ? conversa.name : 'Privado';
        const horario = obterTimestampFormatado();
        
        // Log completo antes de aguardar (tudo junto, síncrono)
        console.log('\n────────────────────────────────────────');
        console.log(`📅 ${horario}`);
        console.log(`📩 ${nomeConversa} ${ehGrupo ? '(Grupo)' : ''}: "${mensagem.body}"`);
        console.log(`🎯 Resposta escolhida: "${resposta}"`);
        console.log(`⏳ Aguardando ${atraso / 1000}s antes de responder...`);
        
        // Aguardar (silenciosamente)
        await aguardar(atraso);
        
        // Enviar resposta
        await mensagem.reply(resposta);
        console.log(`✅ Resposta enviada!`);
        console.log('────────────────────────────────────────');
        
    } catch (error) {
        console.error('❌ Erro ao processar mensagem:', error.message || error);
        // Tentar responder mesmo com erro
        try {
            const resposta = verificarGatilhos(mensagem.body);
            if (resposta) {
                const atraso = obterAtrasoAleatorio(configuracao.configuracoes.intervaloAtraso.minimo, configuracao.configuracoes.intervaloAtraso.maximo);
                const horario = obterTimestampFormatado();
                
                console.log('\n────────────────────────────────────────');
                console.log(`📅 ${horario}`);
                console.log(`📩 Mensagem: "${mensagem.body}"`);
                console.log(`🎯 Resposta escolhida: "${resposta}"`);
                console.log(`⏳ Aguardando ${atraso / 1000}s antes de responder...`);
                
                await aguardar(atraso);
                await mensagem.reply(resposta);
                
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
cliente.initialize();

console.log('⏳ Aguardando conexão...\n');
