// ==================== GERENCIADOR DE CONFIGURAÇÕES ====================
// Responsável por carregar, salvar e resetar as configurações do bot.
// Utiliza dois arquivos:
//   - config.js          → valores padrão de fábrica (nunca alterado em runtime)
//   - config.local.json  → customizações do usuário (criado automaticamente pelo dashboard)
// Se config.local.json existir, ele tem prioridade total sobre config.js.

const fs = require('fs');
const path = require('path');

const DEFAULTS_PATH = path.join(__dirname, '..', 'config.js');
const LOCAL_PATH = path.join(__dirname, '..', 'config.local.json');

/**
 * Carrega as configurações padrão de config.js.
 * Limpa o cache do require para sempre ler a versão mais recente do arquivo.
 * @returns {Object} Configurações padrão de fábrica
 */
function loadDefaults() {
    delete require.cache[require.resolve(DEFAULTS_PATH)];
    return require(DEFAULTS_PATH);
}

/**
 * Carrega as customizações do usuário salvas em config.local.json.
 * Retorna null se o arquivo não existir ou houver erro de leitura/parse.
 * @returns {Object|null} Configurações do usuário ou null
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
 * Carrega a configuração ativa do bot.
 * Prioriza config.local.json (customizações do usuário) sobre config.js (defaults).
 * @returns {Object} Configurações ativas
 */
function load() {
    const local = loadLocal();
    return local || loadDefaults();
}

/**
 * Salva as configurações no arquivo config.local.json.
 * Nunca modifica config.js — apenas persiste as customizações do usuário.
 * @param {Object} newConfig - Objeto completo de configurações para salvar
 * @returns {Object} Configurações salvas (releitura do arquivo)
 */
function save(newConfig) {
    fs.writeFileSync(LOCAL_PATH, JSON.stringify(newConfig, null, 2), 'utf8');
    return load();
}

/**
 * Restaura as configurações para os valores padrão de fábrica.
 * Remove config.local.json para que o sistema volte a usar config.js.
 * @returns {Object} Configurações padrão restauradas
 */
function resetToDefaults() {
    if (fs.existsSync(LOCAL_PATH)) {
        fs.unlinkSync(LOCAL_PATH);
    }
    return loadDefaults();
}

module.exports = { load, save, resetToDefaults };
