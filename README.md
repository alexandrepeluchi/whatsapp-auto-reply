# 🤖 WhatsApp Bot Local - Respostas Automáticas

Bot automatizado para WhatsApp que responde mensagens baseadas em palavras-chave específicas. Funciona em grupos e conversas privadas.

## 📋 Índice

- [O que é este projeto?](#-o-que-é-este-projeto)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação do Node.js](#-instalação-do-nodejs)
- [Configuração do Projeto](#-configuração-do-projeto)
- [Personalizando as Respostas](#-personalizando-as-respostas)
- [Executando o Bot](#-executando-o-bot)
- [Lendo o QR Code](#-lendo-o-qr-code)
- [Parando o Bot](#-parando-o-bot)
- [Solução de Problemas](#-solução-de-problemas)

---

## 🎯 O que é este projeto?

Este bot monitora suas conversas do WhatsApp e responde automaticamente quando detecta palavras ou frases específicas. Por exemplo:

- Alguém escreve "oi" → Bot responde "Olá! Como posso ajudar? 😊"
- Alguém pergunta "horário" → Bot responde com seu horário de atendimento
- Você pode criar quantas respostas quiser!

**Funciona em:**
- ✅ Grupos do WhatsApp
- ✅ Conversas privadas
- ✅ WhatsApp Business

---

## 📦 Pré-requisitos

Antes de começar, você precisa ter:

1. **Um computador** (Windows, Mac ou Linux)
2. **WhatsApp instalado no celular**
3. **Conexão com a internet**
4. **Node.js instalado** (veja como instalar abaixo)

---

## 🔧 Instalação do Node.js

### Windows

1. **Baixar o Node.js:**
   - Acesse: https://nodejs.org/
   - Clique no botão verde "LTS" (Recomendado)
   - Baixe o instalador `.msi` para Windows

2. **Instalar:**
   - Execute o arquivo baixado
   - Clique em "Next" até finalizar
   - Aceite todas as opções padrão
   - Aguarde a instalação concluir

3. **Verificar instalação:**
   - Abra o **Prompt de Comando** (CMD) ou **PowerShell**
   - Digite: `node --version`
   - Você deve ver algo como: `v20.11.0`
   - Digite: `npm --version`
   - Você deve ver algo como: `10.2.4`

### Mac

1. **Baixar o Node.js:**
   - Acesse: https://nodejs.org/
   - Clique no botão verde "LTS"
   - Baixe o instalador `.pkg` para Mac

2. **Instalar:**
   - Execute o arquivo baixado
   - Siga as instruções na tela
   - Digite sua senha de administrador quando solicitado

3. **Verificar instalação:**
   - Abra o **Terminal**
   - Digite: `node --version`
   - Digite: `npm --version`

### Linux (Ubuntu/Debian)

```bash
# Atualizar sistema
sudo apt update

# Instalar Node.js
sudo apt install nodejs npm

# Verificar instalação
node --version
npm --version
```

---

## ⚙️ Configuração do Projeto

### Passo 1: Baixar o Projeto

Se você ainda não tem o projeto:

```bash
# Clone o repositório (ou baixe o ZIP e extraia)
git clone https://github.com/SEU-USUARIO/whatsapp-local-bot.git

# Entre na pasta do projeto
cd whatsapp-local-bot
```

### Passo 2: Instalar Dependências

Abra o terminal/prompt dentro da pasta do projeto e execute:

```bash
npm install
```

**O que este comando faz?**
- Instala a biblioteca `whatsapp-web.js` (conecta com WhatsApp)
- Instala a biblioteca `qrcode-terminal` (mostra QR Code no terminal)
- Baixa todas as dependências necessárias

**Aguarde:** Este processo pode levar alguns minutos. Você verá muitas mensagens passando - isso é normal!

---

## 🎨 Personalizando as Respostas

Abra o arquivo [config.js](config.js) em qualquer editor de texto (Bloco de Notas, VSCode, etc.)

### Estrutura Básica

```javascript
{
  triggers: ['palavra1', 'palavra2'],  // Palavras que ativam a resposta
  response: 'Sua resposta aqui'        // O que o bot vai responder
}
```

### Exemplos de Configurações

```javascript
// Exemplo 1: Saudação
{
  triggers: ['oi', 'olá', 'hey', 'bom dia'],
  response: 'Olá! Como posso ajudar você hoje? 😊'
}

// Exemplo 2: Informações de contato
{
  triggers: ['contato', 'telefone', 'email'],
  response: '📞 Telefone: (11) 99999-9999\n📧 Email: contato@exemplo.com'
}

// Exemplo 3: Horário de funcionamento
{
  triggers: ['horário', 'horario', 'aberto', 'funciona'],
  response: '🕐 Horários:\nSeg-Sex: 9h às 18h\nSáb: 9h às 13h\nDom: Fechado'
}

// Exemplo 4: Localização
{
  triggers: ['endereço', 'endereco', 'localização', 'onde fica'],
  response: '📍 Rua Exemplo, 123 - Centro\nSão Paulo - SP\nCEP: 01234-567'
}
```

### Configurações Adicionais

No arquivo [config.js](config.js), você também pode ajustar:

```javascript
settings: {
  respondToGroups: true,      // true = responde em grupos | false = não responde
  respondToPrivate: true,      // true = responde em privado | false = não responde
  caseSensitive: false,        // false = ignora maiúsculas/minúsculas
  matchWholeWord: false        // false = procura palavra dentro do texto
}
```

**Dica:** Use `false` em `matchWholeWord` para respostas mais flexíveis!

---

## 🚀 Executando o Bot

### Passo 1: Iniciar o Bot

No terminal, dentro da pasta do projeto, execute:

```bash
npm start
```

**Ou:**

```bash
node bot.js
```

### Passo 2: O que você verá

Após executar o comando, você verá mensagens como:

```
🤖 Iniciando WhatsApp Bot...

⏳ Aguardando conexão...

📱 QR CODE GERADO!
👉 Escaneie o código abaixo com seu WhatsApp:

[QR CODE APARECE AQUI NO TERMINAL]

⚠️  Para escanear:
   1. Abra o WhatsApp no seu celular
   2. Toque em Menu (⋮) > Aparelhos conectados
   3. Toque em "Conectar um aparelho"
   4. Aponte a câmera para o QR Code acima
```

---

## 📱 Lendo o QR Code

### Passo a Passo:

1. **No seu celular:**
   - Abra o aplicativo WhatsApp
   - Toque nos **três pontinhos** (⋮) no canto superior direito
   - Selecione **"Aparelhos conectados"**
   - Toque em **"Conectar um aparelho"**

2. **Escaneie o código:**
   - Aponte a câmera do celular para o QR Code no terminal
   - Aguarde a confirmação

3. **Conectado!**
   - Você verá as mensagens:
     ```
     🔐 Autenticação realizada com sucesso!
     ✅ Bot conectado com sucesso!
     🟢 Bot está rodando e pronto para responder mensagens...
     ```

### ⚠️ Importante!

- O QR Code expira em 20 segundos - seja rápido!
- Se expirar, não se preocupe! O bot gerará um novo automaticamente
- Na primeira conexão, pode levar 1-2 minutos para sincronizar

---

## 📊 Bot em Funcionamento

Quando o bot estiver rodando, você verá logs das mensagens:

```
📩 Mensagem de João Silva (Privado): "oi"
🤖 Respondendo: "Olá! Como posso ajudar? 😊"

📩 Mensagem de Grupo Família (Grupo): "qual o horário?"
🤖 Respondendo: "Nosso horário de atendimento é:..."
```

### Testando o Bot

1. Envie uma mensagem para você mesmo com uma palavra-gatilho (ex: "oi")
2. O bot deve responder automaticamente
3. Teste em grupos e conversas privadas!

---

## 🛑 Parando o Bot

Para parar o bot:

- **Windows:** Pressione `Ctrl + C` no terminal
- **Mac/Linux:** Pressione `Ctrl + C` ou `Cmd + C`

O bot será desconectado e parará de responder mensagens.

---

## 🔧 Solução de Problemas

### ❌ Erro: "node não é reconhecido"

**Problema:** Node.js não está instalado ou não está no PATH

**Solução:**
1. Reinstale o Node.js
2. Reinicie o terminal
3. No Windows, certifique-se de marcar "Add to PATH" durante instalação

### ❌ Erro: "Cannot find module 'whatsapp-web.js'"

**Problema:** As dependências não foram instaladas

**Solução:**
```bash
npm install
```

### ❌ QR Code não aparece

**Problema:** Terminal muito pequeno ou biblioteca não instalada

**Solução:**
1. Maximize a janela do terminal
2. Verifique se instalou as dependências: `npm install`
3. Use um terminal diferente (PowerShell, CMD, Git Bash)

### ❌ Bot não responde mensagens

**Possíveis causas:**

1. **Bot não está rodando** → Execute `npm start` novamente
2. **Palavra-gatilho incorreta** → Verifique o arquivo [config.js](config.js)
3. **Configurações erradas** → Verifique `respondToGroups` e `respondToPrivate`
4. **Responder próprias mensagens** → Bot nunca responde mensagens enviadas por você

### ❌ "Puppeteer error" ou "chromium"

**Problema:** Falta de dependências do sistema

**Solução Windows:**
```bash
npm install --force
```

**Solução Linux:**
```bash
sudo apt-get install -y gconf-service libasound2 libatk1.0-0 libcups2 libdbus-1-3 \
  libgconf-2-4 libgtk-3-0 libnspr4 libx11-xcb1 libxss1 libxtst6 fonts-liberation \
  libnss3 xdg-utils
```

### 🔄 Resetar Autenticação

Se tiver problemas de conexão:

1. **Feche o bot** (Ctrl + C)
2. **Delete a pasta** `.wwebjs_auth`
3. **Execute novamente:** `npm start`
4. **Escaneie o QR Code** novamente

---

## 📁 Estrutura de Arquivos

```
whatsapp-local-bot/
│
├── bot.js              # Código principal do bot
├── config.js           # Configurações e respostas automáticas
├── package.json        # Dependências do projeto
├── .gitignore          # Arquivos ignorados pelo Git
├── README.md           # Este arquivo (documentação)
│
└── .wwebjs_auth/       # Pasta criada automaticamente (dados de login)
```

---

## 💡 Dicas Avançadas

### Executar em Background (servidor sempre ligado)

**Windows - usando PM2:**
```bash
npm install -g pm2
pm2 start bot.js --name whatsapp-bot
pm2 save
pm2 startup
```

**Para ver logs:**
```bash
pm2 logs whatsapp-bot
```

**Para parar:**
```bash
pm2 stop whatsapp-bot
```

### Usar em Servidor (VPS/Cloud)

1. Alugue um servidor (DigitalOcean, AWS, Heroku, etc.)
2. Clone o projeto no servidor
3. Instale dependências: `npm install`
4. Use PM2 para manter rodando 24/7
5. Use `screen` ou `tmux` para manter sessão ativa

### Adicionar mais funcionalidades

Consulte a documentação oficial: https://docs.wwebjs.dev/

---

## 🤝 Contribuindo

Sinta-se à vontade para:
- Reportar bugs
- Sugerir melhorias
- Fazer fork e criar pull requests

---

## ⚠️ Avisos Legais

- **Respeite os Termos de Serviço do WhatsApp**
- Não use para spam ou mensagens indesejadas
- Use com responsabilidade
- O WhatsApp pode banir contas que violem seus termos
- Este projeto é apenas para fins educacionais

---

## 📞 Suporte

Encontrou algum problema? 

1. Verifique a seção [Solução de Problemas](#-solução-de-problemas)
2. Abra uma issue no GitHub
3. Consulte a documentação do whatsapp-web.js

---

## 📝 Licença

MIT License - Veja o arquivo LICENSE para mais detalhes

---

## 🎉 Pronto!

Seu bot está funcionando! Agora você pode:

✅ Responder mensagens automaticamente  
✅ Configurar respostas personalizadas  
✅ Usar em grupos e conversas privadas  
✅ Automatizar seu WhatsApp  

**Divirta-se! 🚀**