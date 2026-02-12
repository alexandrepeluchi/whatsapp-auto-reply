// Configuração das respostas automáticas
module.exports = {
  // Lista de palavras-chave e suas respostas
  autoReplies: [
    {
      triggers: [['alguém', 'hoje'], ['alguem', 'hoje']],
      requireAll: true,
      responses: ['Posso', 'Posso pegar', 'Eu posso']
    },
    {
      triggers: [['alguém', 'pode'], ['alguem', 'pode']],
      requireAll: true,
      responses: ['Posso', 'Posso pegar', 'Eu posso']
    },
    {
      triggers: [['passo', 'dia']],
      requireAll: true,
      responses: ['Posso', 'Posso pegar', 'Eu posso']
    },
    {
      triggers: [['passo', 'plantão'], ['passo', 'plantao']],
      requireAll: true,
      responses: ['Posso', 'Posso pegar', 'Eu posso']
    },
    {
      triggers: [['alguém', 'dia'], ['alguem', 'dia']],
      requireAll: true,
      responses: ['Posso', 'Posso pegar', 'Eu posso']
    },
    {
      triggers: [['alguém', 'disponível'], ['alguem', 'disponivel'], ['alguém', 'disponivel'], ['alguem', 'disponível']],
      requireAll: true,
      responses: ['Posso', 'Posso pegar', 'Eu posso']
    },
    {
      triggers: [['alguém', '\\b\\d{1,2}h\\b'], ['alguem', '\\b\\d{1,2}h\\b']],
      requireAll: true,
      isRegex: true,
      responses: ['Posso', 'Posso pegar', 'Eu posso']
    },
    {
      triggers: [['plantão', '\\b\\d{1,2}h\\b'], ['plantao', '\\b\\d{1,2}h\\b']],
      requireAll: true,
      isRegex: true,
      responses: ['Posso', 'Posso pegar', 'Eu posso']
    },
    {
      triggers: [['alguém', 'plantão'], ['alguem', 'plantao'], ['alguém', 'plantao'], ['alguem', 'plantão']],
      requireAll: true,
      responses: ['Posso', 'Posso pegar', 'Eu posso']
    }
  ],

  // Configurações gerais
  settings: {
    respondToGroups: true,      // Responder em grupos
    respondToPrivate: true,      // Responder em conversas privadas
    caseSensitive: false,        // Diferenciar maiúsculas/minúsculas
    matchWholeWord: false,       // Exigir palavra completa (true) ou permitir parte da palavra (false)
    delayRange: {
      min: 10,                   // Delay mínimo em segundos antes de responder
      max: 20                    // Delay máximo em segundos antes de responder
    }
  }
};
