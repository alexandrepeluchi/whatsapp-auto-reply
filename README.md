# 🤖 WhatsApp Local Bot

Bot local para WhatsApp com respostas automáticas e dashboard web em tempo real.  
Sem banco de dados, sem cloud — tudo roda na sua máquina.

---

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Funcionalidades](#-funcionalidades)
- [Dashboard Web](#-dashboard-web)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação](#-instalação)
- [Executando](#-executando)
- [Configuração](#️-configuração)
  - [Respostas Automáticas](#respostas-automáticas)
  - [Delay de Resposta](#delay-de-resposta)
  - [Lista Negra de Palavras](#lista-negra-de-palavras)
  - [Lista Negra de Grupos](#lista-negra-de-grupos)
  - [Configurações Gerais](#configurações-gerais)
- [Persistência de Configurações](#-persistência-de-configurações)
- [Conectando ao WhatsApp](#-conectando-ao-whatsapp)
- [Arquitetura Técnica](#-arquitetura-técnica)
- [Contribuindo](#-contribuindo)
- [Avisos Legais](#️-avisos-legais)
- [Licença](#-licença)

---

## 🎯 Visão Geral

O **WhatsApp Local Bot** monitora mensagens no WhatsApp e responde automaticamente com base em palavras-chave configuráveis. Toda a gestão é feita por um dashboard web — sem necessidade de editar arquivos manualmente.

**Como funciona:** alguém envia _"oi"_ → o bot responde _"Olá! Como posso ajudar? 😊"_

Compatível com:
- ✅ Grupos do WhatsApp
- ✅ Conversas privadas
- ✅ WhatsApp Business

---

## ✨ Funcionalidades

| Recurso | Descrição |
|---------|-----------|
| 🎲 **Respostas múltiplas** | Várias respostas por gatilho, escolhidas aleatoriamente para parecer natural |
| ⏱️ **Delay configurável** | Fixo ou aleatório (range), simulando tempo de digitação humana |
| 🎯 **Gatilhos flexíveis** | Correspondência por palavra inteira ou parcial, com ou sem diferenciação de maiúsculas |
| 🚫 **Blacklist de palavras** | Ignora mensagens que contenham termos indesejados (ex: spam) |
| 🚫 **Blacklist de grupos** | Ignora grupos pelo nome (busca parcial, case-insensitive) |
| 📊 **Mensagens respondidas** | Histórico em tempo real de todas as respostas enviadas pelo bot |
| 📨 **Histórico de mensagens** | Log de todas as mensagens recebidas enquanto o bot está ativo |
| 🔄 **Anti-loop** | Impede que o bot responda às próprias respostas |
| 🕐 **Filtro temporal** | Ignora mensagens enfileiradas antes do bot iniciar |
| 💾 **Auto-save** | Configurações salvas automaticamente ao alterar (debounce 400ms) |
| 🔁 **Reset de fábrica** | Restaura todas as configurações para os valores padrão |
| 🌐 **Dashboard web** | Interface completa com comunicação via WebSocket em tempo real |

---

## 🎨 Dashboard Web

Após iniciar o servidor, acesse:

```
http://localhost:3000
```

### O que o Dashboard oferece

- **Status em tempo real** — conectado, desconectado, aguardando QR
- **QR Code integrado** — escaneie direto no navegador para autenticar
- **Mensagens respondidas** — veja o histórico de respostas enviadas pelo bot
- **Controle do bot** — iniciar e parar com confirmação visual
- **Configurações visuais** — toggles, inputs de delay com preview dinâmico
- **Respostas automáticas** — criar, editar e deletar direto na interface
- **Lista negra de palavras** — adicionar e remover termos bloqueados
- **Lista negra de grupos** — bloquear grupos por nome (parcial)
- **Histórico de mensagens** — log completo de mensagens recebidas
- **Notificações toast** — feedback visual para todas as ações
- **Modal de confirmação** — dupla confirmação para ações destrutivas
- **Reset de configurações** — restaura os valores padrão com segurança

---

## 📁 Estrutura do Projeto

```
whatsapp-local-bot/
├── server.js              # Servidor Express + WebSocket
├── config.js              # Configurações padrão (imutável em runtime)
├── config.local.json      # Configurações do usuário (gerado automaticamente)
├── package.json
├── README.md
├── src/
│   ├── config-manager.js  # Gerenciador de configurações (load/save/reset)
│   ├── whatsapp.js        # Cliente WhatsApp + processamento de mensagens
│   └── routes.js          # Rotas da API REST
└── public/
    ├── index.html         # Dashboard HTML
    ├── app.js             # Lógica do dashboard (WebSocket + API)
    └── styles.css         # Estilos do dashboard
```

---

## 📦 Pré-requisitos

- [**Node.js**](https://nodejs.org/) v16 ou superior
- **npm** (incluso com Node.js)
- **WhatsApp** ativo no celular
- Conexão com internet

Verifique a instalação:

```bash
node --version
npm --version
```

---

## 🔧 Instalação

```bash
# Clone o repositório
git clone https://github.com/alexandrepeluchi/whatsapp-local-bot.git
cd whatsapp-local-bot

# Instale as dependências
npm install
```

---

## 🚀 Executando

```bash
npm start
```

O servidor inicia na porta **3000**. Acesse o dashboard em `http://localhost:3000`.

Na primeira execução, escaneie o QR Code exibido no dashboard para autenticar o WhatsApp. Sessões posteriores reconectam automaticamente.

---

## ⚙️ Configuração

Todas as configurações podem ser feitas pelo dashboard web. Abaixo estão os detalhes de cada seção.

### Respostas Automáticas

Cada resposta automática possui **gatilhos** (palavras-chave) e uma ou mais **respostas**:

```javascript
{
  triggers: ['oi', 'olá', 'hey'],       // Palavras que ativam a resposta
  response: [                            // Uma ou mais respostas (sorteio automático)
    'Olá! Como posso ajudar? 😊',
    'Oi! Tudo bem?',
    'Hey! Em que posso ajudar?'
  ]
}
```

- Se houver múltiplas respostas, uma é escolhida aleatoriamente a cada mensagem
- Resposta única pode ser uma string simples (sem array)
- Gatilhos são verificados na mensagem recebida (por substring ou palavra inteira)

### Delay de Resposta

Simula o tempo de digitação humana para tornar as respostas mais naturais:

- **Fixo:** preencha apenas o campo mínimo (ex: `10` = sempre 10 segundos)
- **Aleatório:** preencha mínimo e máximo (ex: `5` a `15` = entre 5 e 15 segundos)

O dashboard exibe um preview dinâmico do delay configurado.

### Lista Negra de Palavras

Mensagens que contenham termos da blacklist são completamente ignoradas pelo bot. Útil para evitar respostas a spam ou conteúdo indesejado.

**Exemplos:** `oferta imperdível`, `clique aqui`, `ganhe dinheiro`

### Lista Negra de Grupos

Bloqueia grupos pelo nome (ou parte do nome). O bot não responde em grupos cujo nome contenha algum termo configurado.

- A busca é parcial (contains) e case-insensitive
- **Exemplo:** o termo `"vendas"` bloqueia os grupos _"Grupo de Vendas"_, _"VENDAS 2026"_ e _"promovendas"_

### Configurações Gerais

| Configuração | Descrição | Padrão |
|-------------|-----------|--------|
| Responder em Grupos | Bot responde em chats de grupo | ✅ Ativo |
| Responder em Privado | Bot responde em conversas privadas | ✅ Ativo |
| Diferenciar Maiúsculas | Case-sensitive nos gatilhos | ❌ Inativo |
| Somente Palavra Inteira | Exige correspondência exata da palavra (vs. substring) | ❌ Inativo |

---

## 💾 Persistência de Configurações

O sistema utiliza dois arquivos para separar padrões de customizações:

| Arquivo | Propósito | Versionado no Git? |
|---------|-----------|---------------------|
| `config.js` | Valores padrão de fábrica (nunca modificado em runtime) | ✅ Sim |
| `config.local.json` | Customizações do usuário (criado automaticamente) | ❌ Não (.gitignore) |

**Como funciona:**
- Ao salvar pelo dashboard, apenas `config.local.json` é atualizado
- Ao carregar, o sistema prioriza `config.local.json` sobre `config.js`
- O botão "Resetar Configurações" remove `config.local.json` e restaura os padrões de `config.js`

---

## 📱 Conectando ao WhatsApp

1. Instale as dependências com `npm install`
2. Inicie o servidor com `npm start`
3. Acesse `http://localhost:3000`
4. Clique em **Iniciar Bot**
5. No celular: WhatsApp → **Aparelhos conectados** → **Conectar um aparelho**
6. Escaneie o QR Code exibido no dashboard
7. Após autenticação, o status mostra **Conectado**

> A sessão é salva localmente (pasta `.wwebjs_auth`). Reinícios subsequentes reconectam automaticamente sem QR Code.

---

## 🏗️ Arquitetura Técnica

```
┌─────────────┐     WebSocket      ┌──────────────┐
│  Dashboard   │◄──────────────────►│   Express    │
│  (Browser)   │     REST API       │   Server     │
└─────────────┘                     └──────┬───────┘
                                           │
                                    ┌──────┴───────┐
                                    │  whatsapp.js │
                                    │  (Client)    │
                                    └──────┬───────┘
                                           │
                                    ┌──────┴───────┐
                                    │  WhatsApp    │
                                    │  Web API     │
                                    └──────────────┘
```

### Stack

- **Backend:** Node.js, Express, Socket.IO, whatsapp-web.js
- **Frontend:** HTML, CSS, JavaScript vanilla (sem frameworks)
- **Comunicação:** REST API + WebSocket (tempo real)
- **Persistência:** Arquivo JSON local (sem banco de dados)

### API REST

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/status` | Status atual do bot |
| GET | `/api/config` | Configurações atuais |
| POST | `/api/config` | Salvar configurações |
| POST | `/api/config/reset` | Resetar para padrões |
| POST | `/api/respostas` | Criar resposta automática |
| PUT | `/api/respostas/:index` | Editar resposta automática |
| DELETE | `/api/respostas/:index` | Deletar resposta automática |
| GET | `/api/historico` | Histórico de respostas |
| DELETE | `/api/historico` | Limpar histórico de respostas |
| GET | `/api/mensagens` | Histórico de mensagens |
| DELETE | `/api/mensagens` | Limpar histórico de mensagens |
| POST | `/api/bot/iniciar` | Iniciar o bot |
| POST | `/api/bot/parar` | Parar o bot |

### Eventos WebSocket

| Evento | Direção | Descrição |
|--------|---------|-----------|
| `status` | Server → Client | Atualização de status do bot |
| `qrcode` | Server → Client | QR Code para autenticação |
| `nova-resposta` | Server → Client | Nova resposta enviada pelo bot |
| `nova-mensagem` | Server → Client | Nova mensagem recebida |

---

## 🤝 Contribuindo

1. Faça um fork do repositório
2. Crie uma branch para sua feature (`git checkout -b feature/minha-feature`)
3. Commit suas mudanças (`git commit -m 'feat: minha feature'`)
4. Push para a branch (`git push origin feature/minha-feature`)
5. Abra um Pull Request

---

## ⚠️ Avisos Legais

- Respeite os [Termos de Serviço do WhatsApp](https://www.whatsapp.com/legal/terms-of-service)
- Não use para spam ou mensagens indesejadas
- O WhatsApp pode banir contas que violem seus termos
- Projeto para fins educacionais e de uso pessoal

---

## 📝 Licença

MIT License
