# 🤖 WhatsApp Local Bot

Bot local para WhatsApp com respostas automáticas inteligentes e dashboard web em tempo real. Sem banco de dados, sem cloud — tudo roda na sua máquina.

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

O bot monitora mensagens no WhatsApp e responde automaticamente quando detecta palavras-chave configuradas. Todas as configurações são gerenciadas por uma interface web moderna, sem necessidade de editar arquivos manualmente.

**Exemplo:** alguém escreve _"oi"_ → o bot responde _"Olá! Como posso ajudar? 😊"_

Funciona em:
- ✅ Grupos do WhatsApp
- ✅ Conversas privadas
- ✅ WhatsApp Business

---

## ✨ Funcionalidades

| Recurso | Descrição |
|---------|-----------|
| 🎲 Respostas múltiplas | Várias respostas por gatilho — escolhidas aleatoriamente para parecer natural |
| ⏱️ Delay configurável | Fixo ou aleatório (range), simulando tempo de digitação humana |
| 🎯 Gatilhos flexíveis | Por palavra inteira ou parte da palavra, com ou sem case-sensitive |
| 🚫 Blacklist de palavras | Ignora mensagens contendo termos de spam |
| 🚫 Blacklist de grupos | Ignora grupos por nome (busca parcial, case-insensitive) |
| 📊 Mensagens Respondidas | Histórico em tempo real de todas as respostas enviadas |
| 📨 Histórico de Mensagens | Log de todas as mensagens recebidas enquanto o bot está ativo |
| 🔄 Anti-loop | Impede que o bot responda às próprias respostas |
| 🕐 Filtro temporal | Ignora mensagens enfileiradas antes do bot iniciar |
| 💾 Auto-save | Configurações salvas automaticamente ao alterar (debounce 400ms) |
| 🔁 Reset de fábrica | Restaura todas as configurações para os valores padrão |
| 🌐 Dashboard web | Interface completa com WebSocket em tempo real |

---

## 🎨 Dashboard Web

Após iniciar o servidor, acesse:

```
http://localhost:3000
```

### Recursos do Dashboard

- **Status em tempo real** — conectado, desconectado, aguardando QR
- **QR Code integrado** — escaneie direto no navegador
- **Mensagens Respondidas** — histórico de respostas enviadas pelo bot
- **Controle do Bot** — iniciar/parar com confirmação
- **Configurações visuais** — toggles, delay com preview dinâmico
- **Respostas automáticas** — CRUD completo (criar, editar, deletar)
- **Lista negra de palavras** — adicionar/remover termos
- **Lista negra de grupos** — bloquear grupos por nome parcial
- **Histórico de mensagens** — log de todas as mensagens recebidas
- **Notificações toast** — feedback visual para todas as ações
- **Modal de confirmação** — confirmações para ações destrutivas
- **Reset de configurações** — dupla confirmação para restaurar padrões

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

- **Node.js** v16 ou superior ([download](https://nodejs.org/))
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

Todas as configurações podem ser feitas pelo dashboard. Abaixo estão os detalhes de cada seção.

### Respostas Automáticas

Cada resposta automática tem **gatilhos** (palavras-chave) e **respostas**:

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
- Gatilhos são verificados na mensagem recebida (contains ou palavra inteira)

### Delay de Resposta

Simula tempo de digitação humana:

- **Fixo**: preencha apenas o campo mínimo (ex: `10` = sempre 10 segundos)
- **Aleatório**: preencha mínimo e máximo (ex: `5` a `15` = entre 5 e 15 segundos)

O dashboard exibe um preview dinâmico do delay configurado.

### Lista Negra de Palavras

Mensagens contendo termos da blacklist são ignoradas pelo bot. Útil para evitar respostas a spam.

**Exemplos:** `oferta imperdível`, `clique aqui`, `ganhe dinheiro`

### Lista Negra de Grupos

Bloqueia grupos pelo nome (ou parte do nome). O bot não responde em grupos cujo nome contenha algum termo configurado.

- Busca parcial (contains) e case-insensitive
- Exemplo: o termo `"vendas"` bloqueia _"Grupo de Vendas"_, _"VENDAS 2026"_, _"promovendas"_

### Configurações Gerais

| Configuração | Descrição | Padrão |
|-------------|-----------|--------|
| Responder em Grupos | Bot responde em chats de grupo | ✅ Ativo |
| Responder em Privado | Bot responde em conversas privadas | ❌ Inativo |
| Diferenciar Maiúsculas | Case-sensitive nos gatilhos | ❌ Inativo |
| Somente Palavra Inteira | Exige match exato da palavra (vs. substring) | ❌ Inativo |

---

## 💾 Persistência de Configurações

O sistema usa dois arquivos:

| Arquivo | Propósito | Versionado no Git? |
|---------|-----------|---------------------|
| `config.js` | Valores padrão de fábrica (nunca modificado em runtime) | ✅ Sim |
| `config.local.json` | Customizações do usuário (criado automaticamente) | ❌ Não (.gitignore) |

- Ao salvar configurações pelo dashboard, apenas `config.local.json` é atualizado
- Ao carregar, o sistema faz merge: `config.local.json` > `config.js`
- "Resetar Configurações" deleta `config.local.json` e volta aos padrões de `config.js`

---

## 📱 Conectando ao WhatsApp

1. Inicie o servidor com `npm start`
2. Acesse `http://localhost:3000`
3. Clique em **Iniciar Bot**
4. No celular: WhatsApp → **Aparelhos conectados** → **Conectar um aparelho**
5. Escaneie o QR Code exibido no dashboard
6. Após autenticação, o status mostra **Conectado**

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

**Stack:**
- **Backend:** Node.js, Express, Socket.IO, whatsapp-web.js
- **Frontend:** HTML, CSS, JavaScript (vanilla — sem frameworks)
- **Comunicação:** REST API + WebSocket (tempo real)
- **Persistência:** JSON em arquivo (sem banco de dados)

**API REST:**

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/status` | Status do bot |
| GET | `/api/config` | Configurações atuais |
| POST | `/api/config` | Salvar configurações |
| POST | `/api/config/reset` | Resetar para padrões |
| GET | `/api/respostas` | Listar respostas |
| POST | `/api/respostas` | Criar resposta |
| PUT | `/api/respostas/:index` | Editar resposta |
| DELETE | `/api/respostas/:index` | Deletar resposta |
| GET | `/api/historico` | Histórico de respostas |
| DELETE | `/api/historico` | Limpar histórico de respostas |
| GET | `/api/mensagens` | Histórico de mensagens |
| DELETE | `/api/mensagens` | Limpar histórico de mensagens |
| POST | `/api/bot/iniciar` | Iniciar o bot |
| POST | `/api/bot/parar` | Parar o bot |

**Eventos WebSocket:**

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
