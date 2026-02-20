// Configuração das respostas automáticas
module.exports = {   // Lista de palavras-chave e suas respostas (nomes em português)
  respostasAutomaticas: [
    {
      gatilhos: ['testing'],
      resposta: 'Olá! Como posso ajudar? 😊'
    }
    // {
    //   gatilhos: ['oi', 'olá', 'ola', 'hey'],
    //   resposta: 'Olá! Como posso ajudar? 😊'
    // },
    // {
    //   gatilhos: ['tudo bem', 'como vai', 'td bem'],
    //   resposta: 'Tudo ótimo! E você? 👍'
    // },
    // {
    //   gatilhos: ['preço', 'preco', 'quanto custa'],
    //   resposta: 'Para informações sobre preços, por favor entre em contato pelo telefone (XX) XXXXX-XXXX ou email@exemplo.com'
    // },
    // {
    //   gatilhos: ['horário', 'horario', 'funciona'],
    //   resposta: 'Nosso horário de atendimento é:\n📅 Segunda a Sexta: 9h às 18h\n📅 Sábado: 9h às 13h'
    // }
  ],

  // Lista de padrões para ignorar (lista negra)
  // Mensagens contendo essas palavras não serão respondidas pelo bot
  listaNegra: [
    'oferta imperdível',
    'clique aqui',
    'ganhe dinheiro',
    'cadastre-se',
    'promoção relâmpago',
    'inscreva-se',
    'bot:',
    'sistema automático'
  ],

  // Configurações gerais (em português)
  configuracoes: {
    responderEmGrupos: true,      // Responder em grupos
    responderEmPrivado: false,     // Responder em conversas privadas
    responderPropriasMensagens: true, // Responder às suas próprias mensagens
    diferenciarMaiusculas: false, // Diferenciar maiúsculas/minúsculas
    palavraInteira: false,        // Exigir palavra completa (true) ou permitir parte da palavra (false)
    intervaloAtraso: {
      minimo: 10,                 // Delay mínimo em segundos antes de responder
      maximo: 20                  // Delay máximo em segundos antes de responder
    }
  }
};
