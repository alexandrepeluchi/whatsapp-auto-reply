const fs = require('fs');
const path = require('path');

const CAMINHO_CONFIG = path.join(__dirname, '..', 'config.js');

function carregar() {
    delete require.cache[require.resolve(CAMINHO_CONFIG)];
    return require(CAMINHO_CONFIG);
}

function salvar(novaConfig) {
    const conteudo = `// Configuração das respostas automáticas\nmodule.exports = ${JSON.stringify(novaConfig, null, 2)};\n`;
    fs.writeFileSync(CAMINHO_CONFIG, conteudo, 'utf8');
    return carregar();
}

module.exports = { carregar, salvar };
