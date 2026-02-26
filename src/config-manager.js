const fs = require('fs');
const path = require('path');

const DEFAULTS_PATH = path.join(__dirname, '..', 'config.js');
const LOCAL_PATH = path.join(__dirname, '..', 'config.local.json');

/**
 * Carrega a configuração padrão de config.js (defaults imutáveis)
 */
function loadDefaults() {
    delete require.cache[require.resolve(DEFAULTS_PATH)];
    return require(DEFAULTS_PATH);
}

/**
 * Carrega as customizações do usuário salvas em config.local.json
 */
function loadLocal() {
    if (fs.existsSync(LOCAL_PATH)) {
        try {
            const raw = fs.readFileSync(LOCAL_PATH, 'utf8');
            return JSON.parse(raw);
        } catch (err) {
            console.error('⚠️  Erro ao ler config.local.json, usando defaults:', err.message);
            return null;
        }
    }
    return null;
}

/**
 * Carrega a configuração mesclando defaults com customizações locais.
 * Se config.local.json existir, ele tem prioridade total (substituição completa).
 */
function load() {
    const defaults = loadDefaults();
    const local = loadLocal();

    if (local) {
        return local;
    }

    return defaults;
}

/**
 * Salva a configuração no arquivo config.local.json (nunca altera config.js)
 */
function save(newConfig) {
    fs.writeFileSync(LOCAL_PATH, JSON.stringify(newConfig, null, 2), 'utf8');
    return load();
}

/**
 * Restaura para os defaults, removendo o arquivo local
 */
function resetToDefaults() {
    if (fs.existsSync(LOCAL_PATH)) {
        fs.unlinkSync(LOCAL_PATH);
    }
    return loadDefaults();
}

module.exports = { load, save, resetToDefaults };
