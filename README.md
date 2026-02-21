# 🤖 WhatsApp Auto Reply - Respostas Automáticas Inteligentes

Bot automatizado para WhatsApp com respostas naturais e humanizadas. Suporta respostas múltiplas, delays aleatórios, regex e blacklist anti-spam.

**✨ NOVO: Agora com Interface Web para Gerenciamento!**

## 📋 Índice

- [Interface Web Dashboard](#-interface-web-dashboard-novo)
- [O que é este projeto?](#-o-que-é-este-projeto)
- [✨ Funcionalidades](#-funcionalidades)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação do Node.js](#-instalação-do-nodejs)
- [Configuração do Projeto](#-configuração-do-projeto)
- [Executando com Interface Web](#-executando-com-interface-web)
- [Executando via Terminal](#-executando-via-terminal)
- [Personalizando as Respostas](#-personalizando-as-respostas)
- [Configurações Avançadas](#-configurações-avançadas)
- [Lendo o QR Code](#-lendo-o-qr-code)
- [Parando o Bot](#-parando-o-bot)
- [Solução de Problemas](#-solução-de-problemas)

---

## 🎨 Interface Web Dashboard (NOVO)

Agora você pode gerenciar o bot através de uma interface web moderna e intuitiva!

### 🚀 Recursos do Dashboard

- **Visualização em Tempo Real**: Veja o status do bot (conectado/desconectado)
- **QR Code Integrado**: Escaneie o QR Code diretamente no navegador
- **Gerenciamento de Respostas**: Adicione, edite e remova respostas automáticas
- **Lista Negra Interativa**: Gerencie termos bloqueados facilmente
- **Histórico de Mensagens**: Acompanhe todas as respostas enviadas pelo bot
- **Configurações Visuais**: Ajuste todas as configurações com interface amigável
- **Controles do Bot**: Inicie e pare o bot com um clique
- **Responsivo**: Funciona perfeitamente em celulares, tablets e desktops

### 📸 Acesso ao Dashboard

Após iniciar o servidor, acesse:
```
http://localhost:3000
```

### ⚙️ Como Usar

1. Instale as dependências:
```bash
npm install
```

2. Inicie o servidor:
```bash
npm run server
```

3. Abra o navegador e acesse: `http://localhost:3000`

4. Use a interface para:
   - Ver o QR Code e conectar o WhatsApp
   - Gerenciar respostas automáticas
   - Configurar delays e preferências
   - Acompanhar o histórico em tempo real

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

## ✨ Funcionalidades

### 🎲 Respostas Variadas
- Configure múltiplas respostas para o mesmo trigger
- O bot escolhe aleatoriamente para parecer mais natural
- Exemplo: "Posso", "Posso sim", "Eu posso pegar"

### ⏱️ Delays Aleatórios
- Bot aguarda um tempo aleatório antes de responder
- Parece mais humano e natural
- Configurável: min/max em segundos

### 🎯 Triggers Avançados
- **Palavra simples**: busca por uma palavra
- **Múltiplas palavras**: busca por várias palavras na mesma mensagem
- **Regex**: use expressões regulares para padrões complexos

### 🚫 Blacklist Anti-Spam
- Ignore automaticamente mensagens indesejadas
- Bloqueie spam, propagandas e ofertas
- Personalizável

### 📊 Logs Detalhados
- Acompanhe todas as interações em tempo real
- Timestamps formatados (DD/MM/YYYY HH:MM:SS)
- Informação de grupo/privado e tempo de delay

### 🛡️ Tratamento de Erros Robusto
- Continua funcionando mesmo com erros de conexão
- Timeouts configurados para evitar travamentos
- Retry automático em caso de falhas

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
git clone https://github.com/SEU-USUARIO/whatsapp-auto-reply.git

# Entre na pasta do projeto
cd whatsapp-auto-reply
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

### Estrutura Básica (Resposta Simples)

```javascript
{
  triggers: ['palavra1', 'palavra2'],  // Palavras que ativam a resposta
  response: 'Sua resposta aqui'        // O que o bot vai responder
}
```

### 🎲 Respostas Múltiplas (Mais Natural!)

```javascript
{
  triggers: ['oi', 'olá', 'hey'],
  responses: [
    'Olá! Como posso ajudar? 😊',
    'Oi! Tudo bem?',
    'Hey! Em que posso ajudar?'
  ]
}
// O bot escolhe UMA resposta aleatoriamente cada vez
```

### 🎯 Busca por Múltiplas Palavras

```javascript
{
  triggers: [
    ['alguém', 'disponível'],  // Busca "alguém" E "disponível" na mesma mensagem
    ['alguem', 'disponivel']   // Variação sem acento
  ],
  requireAll: true,            // Todas as palavras devem estar presentes
  responses: ['Eu posso!', 'Posso ajudar', 'Estou disponível']
}
```

### 🔍 Usando Expressões Regulares (Avançado)

```javascript
{
  triggers: [
    ['plantão', '\\b\\d{1,2}h\\b'],  // Busca "plantão" + horário (ex: "14h", "9h")
    ['plantao', '\\b\\d{1,2}h\\b']
  ],
  requireAll: true,
  isRegex: true,               // Ativa suporte a regex
  responses: ['Posso pegar!', 'Eu pego esse']
}
// Exemplo: "Alguém pode pegar o plantão das 14h?" → Bot responde!
```

### Exemplos de Configurações

```javascript
// Exemplo 1: Saudação simples
{
  triggers: ['oi', 'olá', 'hey', 'bom dia'],
  response: 'Olá! Como posso ajudar você hoje? 😊'
}

// Exemplo 2: Saudação com respostas variadas
{
  triggers: ['oi', 'olá', 'hey'],
  responses: [
    'Olá! Como vai? 😊',
    'Oi! Tudo bem?',
    'Hey! Em que posso ajudar?',
    'Olá! Seja bem-vindo!'
  ]
}

// Exemplo 3: Informações de contato
{
  triggers: ['contato', 'telefone', 'email'],
  response: '📞 Telefone: (11) 99999-9999\n📧 Email: contato@exemplo.com'
}

// Exemplo 4: Horário de funcionamento
{
  triggers: ['horário', 'horario', 'aberto', 'funciona'],
  response: '🕐 Horários:\nSeg-Sex: 9h às 18h\nSáb: 9h às 13h\nDom: Fechado'
}

// Exemplo 5: Localização
{
  triggers: ['endereço', 'endereco', 'localização', 'onde fica'],
  response: '📍 Rua Exemplo, 123 - Centro\nSão Paulo - SP\nCEP: 01234-567'
}

// Exemplo 6: Busca avançada - detectar quando alguém oferece algo
{
  triggers: [
    ['passo', 'plantão'],
    ['vendo', 'vaga']
  ],
  requireAll: true,
  responses: ['Tenho interesse!', 'Posso pegar']
}
```

---

## ⚙️ Configurações Avançadas

### 🚫 Blacklist - Ignorar Mensagens Indesejadas

Configure palavras ou frases para que o bot NÃO responda, mesmo se houver um trigger:

```javascript
blacklist: [
  'oferta imperdível',
  'clique aqui',
  'ganhe dinheiro',
  'cadastre-se',
  'promoção relâmpago',
  'inscreva-se',
  'bot:',
  'sistema automático'
]
```

**Como funciona:**
- Se uma mensagem contém qualquer palavra da blacklist, o bot ignora
- Útil para evitar spam, propagandas e mensagens de outros bots
- Exemplo: "Oi! Clique aqui para ganhar dinheiro" → Bot NÃO responde (tem "clique aqui")

### ⏱️ Delays Aleatórios - Parecer Humano

Configure quanto tempo o bot espera antes de responder:

```javascript
settings: {
  delayRange: {
    min: 10,   // Mínimo: 10 segundos
    max: 20    // Máximo: 20 segundos
  }
}
```

**Como funciona:**
- Bot espera um tempo aleatório entre min e max
- Torna as respostas mais naturais e humanas
- Evita detecção como bot automatizado

**Exemplos de configuração:**
- Resposta rápida: `min: 2, max: 5` (2-5 segundos)
- Resposta normal: `min: 10, max: 20` (10-20 segundos)
- Resposta lenta: `min: 30, max: 60` (30-60 segundos)

### 🎛️ Configurações Gerais

No arquivo [config.js](config.js), você também pode ajustar:

```javascript
settings: {
  respondToGroups: true,      // true = responde em grupos | false = não responde
  respondToPrivate: true,      // true = responde em privado | false = não responde
  caseSensitive: false,        // false = ignora maiúsculas/minúsculas
  matchWholeWord: false,       // false = procura palavra dentro do texto
  delayRange: {
    min: 10,                   // Delay mínimo em segundos
    max: 20                    // Delay máximo em segundos
  }
}
```

**Explicação de cada opção:**

| Opção | `true` | `false` |
|-------|--------|---------|
| `respondToGroups` | Responde em grupos | Ignora grupos |
| `respondToPrivate` | Responde no privado | Ignora privado |
| `caseSensitive` | Diferencia maiúsculas | Ignora maiúsculas |
| `matchWholeWord` | Busca palavra exata | Busca parte da palavra |

**Exemplos práticos:**

```javascript
// Apenas grupos (não responde privado)
settings: {
  respondToGroups: true,
  respondToPrivate: false
}

// Apenas privado (não responde grupos)
settings: {
  respondToGroups: false,
  respondToPrivate: true
}

// Busca exata (apenas "oi", não "oito" ou "coisa")
settings: {
  matchWholeWord: true
}

// Diferencia maiúsculas (OI ≠ oi ≠ Oi)
settings: {
  caseSensitive: true
}
```

**Dica:** Use `matchWholeWord: false` para respostas mais flexíveis!

---

## 🚀 Executando com Interface Web

**Recomendado para a maioria dos usuários!**

### Passo 1: Iniciar o Servidor

No terminal, dentro da pasta do projeto, execute:

```bash
npm run server
```

**Ou:**

```bash
node server.js
```

### Passo 2: Acessar o Dashboard

Após executar o comando, você verá:

```
🤖 Iniciando WhatsApp Bot...

🚀 Servidor rodando em http://localhost:3000
📊 Dashboard disponível em http://localhost:3000
```

Abra seu navegador e acesse: **http://localhost:3000**

### Passo 3: Conectar o WhatsApp

1. No dashboard, você verá o QR Code automaticamente
2. Escaneie o QR Code com seu WhatsApp (veja [instruções abaixo](#-lendo-o-qr-code))
3. Após conectar, você pode gerenciar tudo pelo navegador!

---

## 🖥️ Executando via Terminal

Se preferir usar apenas o terminal (sem interface web):

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

Quando o bot estiver rodando, você verá logs detalhados das mensagens:

```
────────────────────────────────────────
📅 14/02/2026 15:30:45
📩 Grupo Trabalho (Grupo): "oi pessoal"
🎯 Resposta escolhida: "Olá! Tudo bem?"
⏳ Aguardando 15s antes de responder...
✅ Resposta enviada!
────────────────────────────────────────

────────────────────────────────────────
📅 14/02/2026 15:31:12
📩 Privado: "qual o horário?"
🎯 Resposta escolhida: "Nosso horário de atendimento é:..."
⏳ Aguardando 12s antes de responder...
✅ Resposta enviada!
────────────────────────────────────────
```

**O que significam os logs:**
- 📅 **Data/Hora**: Timestamp de quando a mensagem foi recebida
- 📩 **Origem**: Nome do grupo ou "Privado" para mensagens diretas
- 🎯 **Resposta**: Qual resposta foi escolhida (em caso de múltiplas)
- ⏳ **Delay**: Tempo que o bot vai esperar antes de responder
- ✅ **Confirmação**: Resposta enviada com sucesso

### Testando o Bot

1. Envie uma mensagem para você mesmo com uma palavra-gatilho (ex: "oi")
2. Observe o log no terminal mostrando o delay
3. Aguarde o tempo indicado
4. O bot responderá automaticamente
5. Teste em grupos e conversas privadas!

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
5. **Mensagem na blacklist** → Verifique se a mensagem contém palavras da blacklist
6. **Delay muito longo** → Aguarde o tempo configurado em `delayRange`

### ❌ Bot responde a spam ou mensagens indesejadas

**Problema:** Bot está respondendo propagandas, ofertas, etc.

**Solução:**
1. Abra o arquivo [config.js](config.js)
2. Adicione palavras-chave à `blacklist`:
```javascript
blacklist: [
  'palavra indesejada',
  'spam',
  'promoção'
]
```
3. Salve o arquivo e reinicie o bot

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
whatsapp-auto-reply/
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

## 💡 Exemplos Práticos Completos

### Exemplo 1: Atendimento ao Cliente

```javascript
autoReplies: [
  // Saudações variadas
  {
    triggers: ['oi', 'olá', 'ola', 'hey', 'bom dia', 'boa tarde', 'boa noite'],
    responses: [
      'Olá! Como posso ajudar? 😊',
      'Oi! Seja bem-vindo!',
      'Hey! Em que posso ajudar você hoje?'
    ]
  },
  // Horário
  {
    triggers: ['horário', 'horario', 'aberto', 'funciona', 'atendimento'],
    response: '🕐 Horários de Atendimento:\n📅 Seg-Sex: 9h às 18h\n📅 Sábado: 9h às 13h\n📅 Domingo: Fechado'
  },
  // Contato
  {
    triggers: ['contato', 'telefone', 'email', 'falar'],
    response: '📞 Contatos:\nTelefone: (11) 99999-9999\nEmail: contato@exemplo.com'
  }
],
blacklist: [
  'spam', 'clique aqui', 'ganhe dinheiro'
],
settings: {
  respondToGroups: true,
  respondToPrivate: true,
  caseSensitive: false,
  matchWholeWord: false,
  delayRange: { min: 5, max: 15 }
}
```

### Exemplo 2: Grupo de Trabalho (Detectar Palavras Múltiplas)

```javascript
autoReplies: [
  // Detectar quando alguém oferece ajuda
  {
    triggers: [
      ['alguém', 'pode'],
      ['alguem', 'pode']
    ],
    requireAll: true,
    responses: ['Eu posso!', 'Posso ajudar!', 'Conte comigo!']
  },
  // Detectar disponibilidade
  {
    triggers: [
      ['alguém', 'disponível'],
      ['alguem', 'disponivel']
    ],
    requireAll: true,
    responses: ['Estou disponível!', 'Eu estou!']
  }
],
blacklist: [],
settings: {
  respondToGroups: true,
  respondToPrivate: false,  // Apenas grupos
  caseSensitive: false,
  matchWholeWord: false,
  delayRange: { min: 10, max: 25 }
}
```

### Exemplo 3: Expressões Regulares (Avançado)

```javascript
autoReplies: [
  // Detectar horários (ex: "às 14h", "14h30")
  {
    triggers: [
      ['disponível', '\\b\\d{1,2}h'],
      ['disponivel', '\\b\\d{1,2}h']
    ],
    requireAll: true,
    isRegex: true,
    responses: ['Eu posso nesse horário!', 'Posso pegar!']
  },
  // Detectar datas (ex: "dia 15", "15/02")
  {
    triggers: [
      ['alguém', '\\b\\d{1,2}/\\d{1,2}'],
      ['alguem', '\\b\\d{1,2}/\\d{1,2}']
    ],
    requireAll: true,
    isRegex: true,
    responses: ['Posso nesse dia!', 'Eu posso!']
  }
],
blacklist: ['ofereço', 'passo', 'vendo'],
settings: {
  respondToGroups: true,
  respondToPrivate: false,
  caseSensitive: false,
  matchWholeWord: false,
  delayRange: { min: 15, max: 30 }
}
```

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
✅ Configurar respostas personalizadas e múltiplas  
✅ Usar delays aleatórios para parecer humano  
✅ Criar triggers avançados com regex  
✅ Bloquear spam com blacklist  
✅ Usar em grupos e conversas privadas  
✅ Acompanhar tudo com logs detalhados  
✅ Automatizar seu WhatsApp de forma inteligente  

**Divirta-se! 🚀**