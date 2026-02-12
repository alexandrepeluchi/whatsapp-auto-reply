// Configuração das respostas automáticas
module.exports = {
  // Lista de palavras-chave e suas respostas
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

  // Configurações gerais
  settings: {
    respondToGroups: true,      // Responder em grupos
    respondToPrivate: true,      // Responder em conversas privadas
    caseSensitive: false,        // Diferenciar maiúsculas/minúsculas
    matchWholeWord: false        // Exigir palavra completa (true) ou permitir parte da palavra (false)
  }
};
