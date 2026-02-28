// ==================== CONFIGURAÇÕES PADRÃO DO BOT ====================
// Este arquivo define os valores padrão de fábrica.
// Alterações feitas pelo dashboard são salvas em config.local.json (gerado automaticamente).
// Para restaurar esses padrões, use o botão "Resetar Configurações" no dashboard.

module.exports = {

  // Respostas automáticas do bot
  // Cada entrada possui gatilhos (palavras-chave) e uma ou mais respostas
  // Se houver múltiplas respostas (array), uma será escolhida aleatoriamente
  autoReplies: [
    {
      triggers: ['oi', 'olá', 'ola', 'hey'],
      response: 'Olá! Como posso ajudar? 😊'
    },
    {
      triggers: ['tudo bem', 'como vai', 'td bem'],
      response: 'Tudo ótimo! E você? 👍'
    },
    {
      triggers: ['preço', 'preco', 'quanto custa'],
      response: 'Para informações sobre preços, por favor entre em contato pelo telefone (XX) XXXXX-XXXX ou email@exemplo.com'
    },
    {
      triggers: ['horário', 'horario', 'funciona'],
      response: 'Nosso horário de atendimento é:\n📅 Segunda a Sexta: 9h às 18h\n📅 Sábado: 9h às 13h'
    }
  ],

  // Lista negra de palavras
  // Mensagens que contenham qualquer um desses termos serão ignoradas pelo bot
  // Útil para filtrar spam e mensagens indesejadas
  blacklist: [
    'oferta imperdível',
    'clique aqui',
    'ganhe dinheiro'
  ],

  // Lista negra de grupos
  // O bot não responderá em grupos cujo nome contenha algum desses termos
  // A busca é parcial e case-insensitive (ex: "vendas" bloqueia "Grupo de Vendas")
  groupBlacklist: [
    'promoções',
    'vendas',
    'spam'
  ],

  // Configurações gerais do comportamento do bot
  settings: {
    replyInGroups: true,          // Responder mensagens em chats de grupo
    replyInPrivate: true,         // Responder mensagens em conversas privadas
    replyOwnMessages: false,      // Responder às próprias mensagens (cuidado com loops)
    caseSensitive: false,         // Diferenciar maiúsculas de minúsculas nos gatilhos
    wholeWord: false,             // true = exige palavra exata | false = aceita parte da palavra
    delayRange: {
      min: 1,                    // Delay mínimo (em segundos) antes de enviar a resposta
      max: 5                     // Delay máximo (em segundos) — se igual ao min, delay é fixo
    }
  }
};
