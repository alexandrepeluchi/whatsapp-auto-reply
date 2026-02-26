// Configuração das respostas automáticas
module.exports = {
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

  // Lista de padrões para ignorar (blacklist de palavras)
  // Mensagens contendo essas palavras não serão respondidas pelo bot
  blacklist: [
    'oferta imperdível',
    'clique aqui',
    'ganhe dinheiro',
    'cadastre-se',
    'promoção relâmpago',
    'inscreva-se',
    'bot:',
    'sistema automático'
  ],

  // Lista negra de grupos
  // Se o nome do grupo contiver algum desses termos, o bot não responderá
  groupBlacklist: [],


  // Configurações gerais
  settings: {
    replyInGroups: true,          // Responder em grupos
    replyInPrivate: false,        // Responder em conversas privadas
    replyOwnMessages: true,      // Responder às suas próprias mensagens
    caseSensitive: false,         // Diferenciar maiúsculas/minúsculas
    wholeWord: false,             // Exigir palavra completa (true) ou permitir parte da palavra (false)
    delayRange: {
      min: 10,                    // Delay mínimo em segundos antes de responder
      max: 20                     // Delay máximo em segundos antes de responder
    }
  }
};
