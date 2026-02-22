const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '..', 'config.js');

function load() {
    delete require.cache[require.resolve(CONFIG_PATH)];
    return require(CONFIG_PATH);
}

function save(newConfig) {
    const content = `// Configuração das respostas automáticas\nmodule.exports = ${JSON.stringify(newConfig, null, 2)};\n`;
    fs.writeFileSync(CONFIG_PATH, content, 'utf8');
    return load();
}

module.exports = { load, save };
