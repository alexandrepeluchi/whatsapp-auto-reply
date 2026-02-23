# 🤖 WhatsApp Auto Reply - Respostas Automáticas Inteligentes

Bot automatizado para WhatsApp com respostas naturais e humanizadas. Suporta respostas múltiplas, delays aleatórios e blacklist anti-spam.

**✨ Agora com Interface Web para Gerenciamento!**

## 📋 Índice

- [🤖 WhatsApp Auto Reply - Respostas Automáticas Inteligentes](#-whatsapp-auto-reply---respostas-automáticas-inteligentes)
  - [📋 Índice](#-índice)
  - [🎨 Interface Web Dashboard](#-interface-web-dashboard)
    - [🚀 Recursos do Dashboard](#-recursos-do-dashboard)
    - [📸 Acesso ao Dashboard](#-acesso-ao-dashboard)
  - [🎯 O que é este projeto?](#-o-que-é-este-projeto)
  - [✨ Funcionalidades](#-funcionalidades)
  - [� Estrutura do Projeto](#-estrutura-do-projeto)
  - [�📦 Pré-requisitos](#-pré-requisitos)
  - [🔧 Instalação do Node.js](#-instalação-do-nodejs)
    - [Windows](#windows)
    - [Mac](#mac)
    - [Linux (Ubuntu/Debian)](#linux-ubuntudebian)
  - [⚙️ Configuração do Projeto](#️-configuração-do-projeto)
    - [Passo 1: Baixar o projeto](#passo-1-baixar-o-projeto)
    - [Passo 2: Instalar dependências](#passo-2-instalar-dependências)
  - [🚀 Executando](#-executando)
  - [🎨 Personalizando as Respostas](#-personalizando-as-respostas)
    - [Estrutura usada no projeto](#estrutura-usada-no-projeto)
  - [⚙️ Configurações Avançadas](#️-configurações-avançadas)
    - [Exemplo único de configuração](#exemplo-único-de-configuração)
  - [📱 Lendo o QR Code](#-lendo-o-qr-code)
  - [🛑 Parando o Bot](#-parando-o-bot)
  - [🤝 Contribuindo](#-contribuindo)
  - [⚠️ Avisos Legais](#️-avisos-legais)
  - [📞 Suporte](#-suporte)
  - [🎉 Pronto!](#-pronto)
  - [📝 Licença](#-licença)

## 🎨 Interface Web Dashboard

Agora você pode gerenciar o bot através de uma interface web moderna e intuitiva.

### 🚀 Recursos do Dashboard

- **Visualização em tempo real**: status do bot (conectado/desconectado)
- **QR Code integrado**: escaneie direto no navegador
- **Gerenciamento de respostas**: adicione, edite e remova respostas automáticas
- **Lista negra interativa**: gerencie termos bloqueados
- **Histórico de mensagens**: acompanhe respostas enviadas
- **Configurações visuais**: ajuste delays e comportamento sem editar arquivo manualmente
- **Controles do bot**: inicie e pare com um clique

### 📸 Acesso ao Dashboard

Após iniciar o servidor, acesse:

```text
http://localhost:3000
```

## 🎯 O que é este projeto?

Este bot monitora conversas no WhatsApp e responde automaticamente quando detecta palavras ou frases específicas.

Exemplo:
- Alguém escreve **"oi"** → Bot responde **"Olá! Como posso ajudar? 😊"**

Funciona em:
- ✅ Grupos do WhatsApp
- ✅ Conversas privadas
- ✅ WhatsApp Business

## ✨ Funcionalidades

- 🎲 Respostas variadas para parecer mais natural
- ⏱️ Delay aleatório configurável
- 🎯 Gatilhos por palavras ou frases
- 🚫 Blacklist anti-spam
- 📊 Logs e histórico de respostas
- 🛡️ Tratamento de erros e reconexão

## � Estrutura do Projeto

```text
server.js            # Ponto de entrada do servidor web
config.js            # Configurações e respostas automáticas
package.json
README.md
src/
  config-manager.js  # Leitura e escrita do config.js
  whatsapp.js        # Gerenciamento do client WhatsApp
  routes.js          # Rotas da API REST
public/
  index.html         # Dashboard HTML
  app.js             # Lógica do dashboard
  styles.css         # Estilos do dashboard
```

## �📦 Pré-requisitos

Antes de começar, você precisa de:

1. Um computador (Windows, Mac ou Linux)
2. WhatsApp no celular
3. Conexão com internet
4. Node.js instalado

## 🔧 Instalação do Node.js

### Windows

1. Acesse: https://nodejs.org/
2. Baixe a versão **LTS**
3. Execute o instalador e conclua com as opções padrão
4. Verifique no terminal:

```bash
node --version
npm --version
```

### Mac

1. Acesse: https://nodejs.org/
2. Baixe a versão **LTS**
3. Instale o pacote `.pkg`
4. Verifique no terminal:

```bash
node --version
npm --version
```

### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install nodejs npm
node --version
npm --version
```

## ⚙️ Configuração do Projeto

### Passo 1: Baixar o projeto

```bash
git clone https://github.com/SEU-USUARIO/whatsapp-auto-reply.git
cd whatsapp-auto-reply
```

### Passo 2: Instalar dependências

```bash
npm install
```

## 🚀 Executando

```bash
npm start
```

Depois abra o dashboard:

```text
http://localhost:3000
```

## 🎨 Personalizando as Respostas

Você pode editar pelo dashboard ou diretamente no arquivo `config.js`.

### Estrutura usada no projeto

```javascript
{
  triggers: ['oi', 'olá', 'hey'],
  response: [
    'Olá! Como posso ajudar? 😊',
    'Oi! Tudo bem?',
    'Hey! Em que posso ajudar?'
  ]
}
```

> Exemplo único: acima já mostra gatilhos + respostas múltiplas com sorteio automático.

## ⚙️ Configurações Avançadas

As configurações ficam em `config.js`.

### Exemplo único de configuração

```javascript
module.exports = {
  autoReplies: [
    {
      triggers: ['horário', 'horario'],
      response: 'Nosso horário é de segunda a sexta, das 9h às 18h.'
    }
  ],
  blacklist: ['oferta imperdível', 'clique aqui', 'ganhe dinheiro'],
  settings: {
    replyInGroups: true,
    replyInPrivate: false,
    replyOwnMessages: true,
    caseSensitive: false,
    wholeWord: false,
    delayRange: {
      min: 10,
      max: 20
    }
  }
};
```

## 📱 Lendo o QR Code

1. Abra o WhatsApp no celular
2. Vá em **Aparelhos conectados**
3. Toque em **Conectar um aparelho**
4. Escaneie o QR Code exibido no dashboard

## 🛑 Parando o Bot

- Windows/Mac/Linux: pressione `Ctrl + C` no terminal onde o bot está rodando.

## 🤝 Contribuindo

Sinta-se à vontade para:
- Reportar bugs
- Sugerir melhorias
- Fazer fork e abrir pull requests

## ⚠️ Avisos Legais

- Respeite os Termos de Serviço do WhatsApp
- Não use para spam ou mensagens indesejadas
- Use com responsabilidade
- O WhatsApp pode banir contas que violem seus termos
- Projeto para fins educacionais

## 📞 Suporte

Encontrou algum problema?

1. Abra uma issue no GitHub
2. Consulte a documentação do whatsapp-web.js

## 🎉 Pronto!

Seu bot está funcionando. Agora você pode:

✅ Responder mensagens automaticamente  
✅ Configurar respostas personalizadas  
✅ Usar delays aleatórios para parecer humano  
✅ Bloquear spam com blacklist  
✅ Usar em grupos e conversas privadas  
✅ Gerenciar tudo pelo dashboard web

## 📝 Licença

MIT License
