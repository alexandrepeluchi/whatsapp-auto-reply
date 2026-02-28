// ==================== DASHBOARD DO WHATSAPP BOT ====================
// Interface web para gerenciar o bot em tempo real.
// Comunica-se com o servidor via REST API e WebSocket (Socket.IO).
// Responsável por: configurações, respostas automáticas, históricos,
// blacklists, controle do bot e exibição de status/QR Code.

// ==================== VARIÁVEIS GLOBAIS ====================
const API_URL = window.location.origin;  // URL base para chamadas à API
let socket;                               // Instância do Socket.IO
let currentConfig = null;                 // Configurações carregadas do servidor
let editingIndex = -1;                    // Índice da resposta em edição (-1 = nova)

// ==================== MODAL DE CONFIRMAÇÃO GENÉRICO ====================
const ConfirmModal = {
    _resolve: null,

    /**
     * Exibe o modal de confirmação genérico.
     * @param {Object} options
     * @param {string} options.title - Título do modal
     * @param {string} options.message - Mensagem descritiva
     * @param {string} [options.confirmText='Sim'] - Texto do botão de confirmar
     * @param {string} [options.cancelText='Não'] - Texto do botão de cancelar
     * @param {string} [options.type='warning'] - Tipo visual: 'warning' | 'danger' | 'success' | 'info'
     * @param {string} [options.confirmClass='btn-primary'] - Classe CSS do botão de confirmar
     * @returns {Promise<boolean>} Resolve true se confirmou, false se cancelou
     */
    show({
        title = 'Confirmação',
        message = 'Tem certeza que deseja continuar?',
        confirmText = 'Sim',
        cancelText = 'Não',
        type = 'warning',
        confirmClass = 'btn-primary'
    } = {}) {
        const modal = document.getElementById('confirmModal');
        const titleEl = document.getElementById('confirmModalTitle');
        const messageEl = document.getElementById('confirmModalMessage');
        const iconEl = document.getElementById('confirmModalIcon');
        const btnYes = document.getElementById('btnConfirmYes');
        const btnNo = document.getElementById('btnConfirmNo');

        titleEl.textContent = title;
        messageEl.textContent = message;

        // Ícone e cor conforme o tipo
        const iconMap = {
            warning: 'fas fa-exclamation-triangle',
            danger: 'fas fa-exclamation-circle',
            success: 'fas fa-check-circle',
            info: 'fas fa-info-circle'
        };
        iconEl.innerHTML = `<i class="${iconMap[type] || iconMap.warning}"></i>`;
        iconEl.className = 'confirm-modal-icon ' + type;

        // Texto e classe dos botões
        btnYes.innerHTML = `<i class="fas fa-check"></i> ${confirmText}`;
        btnYes.className = `btn ${confirmClass}`;
        btnNo.innerHTML = `<i class="fas fa-times"></i> ${cancelText}`;

        modal.classList.add('active');

        return new Promise((resolve) => {
            this._resolve = resolve;
        });
    },

    _close(result) {
        const modal = document.getElementById('confirmModal');
        modal.classList.remove('active');
        if (this._resolve) {
            this._resolve(result);
            this._resolve = null;
        }
    },

    init() {
        const modal = document.getElementById('confirmModal');
        document.getElementById('btnConfirmYes').addEventListener('click', () => this._close(true));
        document.getElementById('btnConfirmNo').addEventListener('click', () => this._close(false));
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this._close(false);
        });
    }
};

// ==================== ELEMENTOS DO DOM ====================
// Cache de referências a elementos HTML reutilizados ao longo do código.
// Agrupados por seção da interface para facilitar a manutenção.

const elements = {
    // Indicador de status (dot + texto)
    statusDot: document.getElementById('statusDot'),
    statusText: document.getElementById('statusText'),
    
    // Seção do QR Code para autenticação
    qrSection: document.getElementById('qrSection'),
    qrCode: document.getElementById('qrCode'),
    
    // Botões de controle do bot
    btnStart: document.getElementById('btnStart'),
    btnStop: document.getElementById('btnStop'),
    
    // Contadores exibidos no painel de estatísticas
    totalReplies: document.getElementById('totalReplies'),
    totalSentReplies: document.getElementById('totalSentReplies'),
    totalBlacklist: document.getElementById('totalBlacklist'),
    
    // Toggles e inputs de configuração geral
    replyGroups: document.getElementById('replyGroups'),
    replyPrivate: document.getElementById('replyPrivate'),
    caseSensitive: document.getElementById('caseSensitive'),
    wholeWord: document.getElementById('wholeWord'),
    delayMin: document.getElementById('delayMin'),
    delayMax: document.getElementById('delayMax'),
    delayPreview: document.getElementById('delayPreview'),
    delayPreviewText: document.getElementById('delayPreviewText'),
    
    // Lista de respostas automáticas
    repliesList: document.getElementById('repliesList'),
    btnNewReply: document.getElementById('btnNewReply'),
    
    // Lista negra de palavras
    blacklistContainer: document.getElementById('blacklistContainer'),
    btnNewTerm: document.getElementById('btnNewTerm'),
    
    // Lista negra de grupos
    groupBlacklistContainer: document.getElementById('groupBlacklistContainer'),
    btnNewGroupTerm: document.getElementById('btnNewGroupTerm'),
    totalGroupBlacklist: document.getElementById('totalGroupBlacklist'),
    
    // Modal: adicionar grupo à lista negra
    groupBlacklistModal: document.getElementById('groupBlacklistModal'),
    inputGroupBlacklist: document.getElementById('inputGroupBlacklist'),
    btnCloseGroupBlacklistModal: document.getElementById('btnCloseGroupBlacklistModal'),
    btnCancelGroupBlacklist: document.getElementById('btnCancelGroupBlacklist'),
    btnSaveGroupBlacklist: document.getElementById('btnSaveGroupBlacklist'),
    
    // Histórico de respostas enviadas pelo bot
    historyContainer: document.getElementById('historyContainer'),
    btnClearHistory: document.getElementById('btnClearHistory'),
    
    // Histórico de todas as mensagens recebidas
    messagesContainer: document.getElementById('messagesContainer'),
    btnClearMessages: document.getElementById('btnClearMessages'),
    
    // Modal: criar/editar resposta automática
    replyModal: document.getElementById('replyModal'),
    modalTitle: document.getElementById('modalTitle'),
    inputTriggers: document.getElementById('inputTriggers'),
    inputResponse: document.getElementById('inputResponse'),
    btnCloseModal: document.getElementById('btnCloseModal'),
    btnCancel: document.getElementById('btnCancel'),
    btnSaveReply: document.getElementById('btnSaveReply'),
    
    // Modal: adicionar termo à lista negra de palavras
    blacklistModal: document.getElementById('blacklistModal'),
    inputBlacklist: document.getElementById('inputBlacklist'),
    btnCloseBlacklistModal: document.getElementById('btnCloseBlacklistModal'),
    btnCancelBlacklist: document.getElementById('btnCancelBlacklist'),
    btnSaveBlacklist: document.getElementById('btnSaveBlacklist'),
    
    // Notificação toast (feedback visual temporário)
    toast: document.getElementById('toast')
};

// ==================== WEBSOCKET ====================
// Comunicação em tempo real com o servidor via Socket.IO.
// Recebe atualizações de status, QR Code, novas respostas e mensagens.

let statusTimeoutId = null;  // Timer para delay de transição do status "autenticado"
let nextStatus = null;       // Status pendente durante a transição

/** Inicializa a conexão WebSocket e registra os handlers de eventos */
function initWebSocket() {
    socket = io(API_URL);
    
    socket.on('connect', () => {
        console.log('✅ Conectado ao servidor via WebSocket');
    });
    
    socket.on('status', (status) => {
        // Durante a transição "autenticado" → "conectado", enfileira o próximo status
        // para exibir "Autenticado ✓" por pelo menos 2 segundos
        if (statusTimeoutId && status !== 'autenticado') {
            nextStatus = status;
            return;
        }
        updateStatus(status);
    });
    
    // Exibe ou esconde a seção do QR Code conforme o servidor envia/limpa
    socket.on('qrcode', (qrcode) => {
        if (qrcode) {
            elements.qrCode.src = qrcode;
            elements.qrSection.style.display = 'block';
        } else {
            elements.qrSection.style.display = 'none';
        }
    });
    
    // Nova resposta enviada pelo bot — adiciona ao histórico em tempo real
    socket.on('nova-resposta', (record) => {
        addHistoryItem(record);
        updateSentRepliesCount();
    });
    
    // Nova mensagem recebida — adiciona ao log de mensagens em tempo real
    socket.on('nova-mensagem', (record) => {
        addMessageItem(record);
    });
    
    socket.on('disconnect', () => {
        console.log('⚠️  Desconectado do servidor');
    });
}

// ==================== FUNÇÕES DE STATUS ====================

/**
 * Atualiza o indicador visual de status no header do dashboard.
 * Quando o status é "autenticado", exibe por 2s antes de aceitar o próximo.
 * @param {string} status - Status atual do bot
 */
function updateStatus(status) {
    const statusMap = {
        'desconectado': { text: 'Desconectado', class: '' },
        'aguardando-qr': { text: 'Aguardando QR Code', class: 'aguardando' },
        'autenticado': { text: 'Autenticado ✓', class: 'conectado' },
        'conectado': { text: 'Conectado', class: 'conectado' },
        'erro-autenticacao': { text: 'Erro na Autenticação', class: '' }
    };
    
    const statusInfo = statusMap[status] || statusMap['desconectado'];
    elements.statusText.textContent = statusInfo.text;
    elements.statusDot.className = 'status-dot ' + statusInfo.class;
    
    // Delay de 2s no status "autenticado" para o usuário visualizar a confirmação
    if (status === 'autenticado') {
        statusTimeoutId = setTimeout(() => {
            statusTimeoutId = null;
            if (nextStatus) {
                const pendingStatus = nextStatus;
                nextStatus = null;
                updateStatus(pendingStatus);
            }
        }, 2000);
    }
}

// ==================== FUNÇÕES DE API ====================
// Helpers para comunicação com o servidor via REST API.

/**
 * Faz uma requisição HTTP à API do servidor.
 * Trata erros automaticamente e exibe toast de erro ao usuário.
 * @param {string} url - Caminho da API (ex: '/api/config')
 * @param {Object} options - Opções do fetch (method, body, headers, etc.)
 * @returns {Promise<Object>} Resposta JSON do servidor
 */
async function makeRequest(url, options = {}) {
    try {
        const response = await fetch(API_URL + url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Erro na requisição:', error);
        showToast('Erro ao comunicar com o servidor', 'error');
        throw error;
    }
}

/** Carrega as configurações do servidor e atualiza toda a interface */
async function loadConfig() {
    try {
        const config = await makeRequest('/api/config');
        currentConfig = config;
        
        // Sincroniza os toggles e inputs com os valores do servidor
        elements.replyGroups.checked = config.settings.replyInGroups;
        elements.replyPrivate.checked = config.settings.replyInPrivate;
        elements.caseSensitive.checked = config.settings.caseSensitive;
        elements.wholeWord.checked = config.settings.wholeWord;
        elements.delayMin.value = config.settings.delayRange.min;
        elements.delayMax.value = config.settings.delayRange.max || '';
        updateDelayPreview();
        
        // Atualiza os contadores de estatísticas
        elements.totalReplies.textContent = config.autoReplies.length;
        elements.totalBlacklist.textContent = config.blacklist.length;
        elements.totalGroupBlacklist.textContent = (config.groupBlacklist || []).length;
        
        // Re-renderiza as listas visuais
        renderReplies();
        renderBlacklist();
        renderGroupBlacklist();
    } catch (error) {
        console.error('Erro ao carregar configurações:', error);
    }
}

/** Atualiza o texto de preview do delay conforme os valores de min/max */
function updateDelayPreview() {
    const min = parseInt(elements.delayMin.value);
    const max = parseInt(elements.delayMax.value);
    const preview = elements.delayPreview;
    const text = elements.delayPreviewText;

    if (!min && !max) {
        text.textContent = 'Defina o tempo de delay';
        preview.className = 'delay-preview';
    } else if (min && !max) {
        text.textContent = `Delay fixo de ${min} segundo${min !== 1 ? 's' : ''}`;
        preview.className = 'delay-preview';
    } else if (min && max) {
        if (max <= min) {
            text.textContent = 'O máximo deve ser maior que o mínimo';
            preview.className = 'delay-preview';
        } else {
            text.textContent = `Delay aleatório entre ${min}s e ${max}s`;
            preview.className = 'delay-preview random';
        }
    }
}

/** Lê os valores atuais da interface e envia ao servidor para salvar */
async function saveConfig() {
    try {
        currentConfig.settings.replyInGroups = elements.replyGroups.checked;
        currentConfig.settings.replyInPrivate = elements.replyPrivate.checked;
        currentConfig.settings.caseSensitive = elements.caseSensitive.checked;
        currentConfig.settings.wholeWord = elements.wholeWord.checked;
        currentConfig.settings.delayRange.min = parseInt(elements.delayMin.value) || 1;
        currentConfig.settings.delayRange.max = elements.delayMax.value ? parseInt(elements.delayMax.value) : null;
        
        await makeRequest('/api/config', {
            method: 'POST',
            body: JSON.stringify(currentConfig)
        });
    } catch (error) {
        console.error('Erro ao salvar configurações:', error);
    }
}

// Auto-save com debounce de 400ms — evita salvar a cada tecla/toggle
let _saveConfigTimeout = null;
function autoSaveConfig() {
    clearTimeout(_saveConfigTimeout);
    _saveConfigTimeout = setTimeout(() => saveConfig(), 400);
}

/** Carrega o histórico de respostas enviadas e renderiza na interface */
async function loadHistory() {
    try {
        const history = await makeRequest('/api/historico');
        elements.historyContainer.innerHTML = '';
        
        if (history.length === 0) {
            elements.historyContainer.innerHTML = '<p class="text-muted">Nenhuma resposta enviada ainda</p>';
        } else {
            history.forEach(item => addHistoryItem(item));
        }
        updateSentRepliesCount();
    } catch (error) {
        console.error('Erro ao carregar histórico:', error);
    }
}

/** Carrega o histórico de todas as mensagens recebidas e renderiza na interface */
async function loadMessages() {
    try {
        const messages = await makeRequest('/api/mensagens');
        elements.messagesContainer.innerHTML = '';
        
        if (messages.length === 0) {
            elements.messagesContainer.innerHTML = '<p class="text-muted">Nenhuma mensagem recebida ainda</p>';
        } else {
            messages.forEach(item => addMessageItem(item));
        }
    } catch (error) {
        console.error('Erro ao carregar mensagens:', error);
    }
}

/** Atualiza o contador de respostas enviadas no painel de estatísticas */
function updateSentRepliesCount() {
    const items = elements.historyContainer.querySelectorAll('.historico-item');
    elements.totalSentReplies.textContent = items.length;
}

// ==================== FUNÇÕES DE RENDERIZAÇÃO ====================
// Geram o HTML dinâmico para as listas de respostas, blacklists e históricos.

/** Renderiza a lista de respostas automáticas com botões de editar/deletar */
function renderReplies() {
    elements.repliesList.innerHTML = '';
    
    if (currentConfig.autoReplies.length === 0) {
        elements.repliesList.innerHTML = '<p class="text-muted">Nenhuma resposta automática configurada</p>';
        return;
    }
    
    currentConfig.autoReplies.forEach((reply, index) => {
        const div = document.createElement('div');
        div.className = 'resposta-item';
        
        const responseText = Array.isArray(reply.response) 
            ? reply.response.join('\n--- OU ---\n')
            : reply.response;
        
        div.innerHTML = `
            <div class="resposta-header">
                <div>
                    <div class="resposta-gatilhos">
                        ${reply.triggers.map(g => `<span class="gatilho-tag">${g}</span>`).join('')}
                    </div>
                    <div class="resposta-text">${responseText}</div>
                </div>
                <div class="resposta-actions">
                    <button class="btn btn-primary btn-icon" onclick="editReply(${index})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-icon" onclick="deleteReply(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        
        elements.repliesList.appendChild(div);
    });
}

/** Renderiza os termos da lista negra de palavras como tags removíveis */
function renderBlacklist() {
    elements.blacklistContainer.innerHTML = '';
    
    if (currentConfig.blacklist.length === 0) {
        elements.blacklistContainer.innerHTML = '<p class="text-muted">Nenhum termo na lista negra</p>';
        return;
    }
    
    currentConfig.blacklist.forEach((term, index) => {
        const span = document.createElement('span');
        span.className = 'lista-negra-item';
        span.innerHTML = `
            ${term}
            <button onclick="removeBlacklist(${index})">
                <i class="fas fa-times"></i>
            </button>
        `;
        elements.blacklistContainer.appendChild(span);
    });
}

/** Renderiza os termos da lista negra de grupos como tags removíveis */
function renderGroupBlacklist() {
    elements.groupBlacklistContainer.innerHTML = '';
    
    const groupBlacklist = currentConfig.groupBlacklist || [];
    
    if (groupBlacklist.length === 0) {
        elements.groupBlacklistContainer.innerHTML = '<p class="text-muted">Nenhum grupo na lista negra</p>';
        return;
    }
    
    groupBlacklist.forEach((term, index) => {
        const span = document.createElement('span');
        span.className = 'lista-negra-item group-blacklist-item';
        span.innerHTML = `
            ${term}
            <button onclick="removeGroupBlacklist(${index})">
                <i class="fas fa-times"></i>
            </button>
        `;
        elements.groupBlacklistContainer.appendChild(span);
    });
}

/** Adiciona um item de resposta ao histórico visual (inserido no topo) */
function addHistoryItem(item) {
    const firstItem = elements.historyContainer.querySelector('.text-muted');
    if (firstItem) {
        elements.historyContainer.innerHTML = '';
    }
    
    const div = document.createElement('div');
    div.className = 'historico-item';
    
    const date = new Date(item.timestamp);
    const formattedDate = date.toLocaleString('pt-BR');
    
    div.innerHTML = `
        <div class="historico-header">
            <div>
                <span class="historico-contato">${item.contact}</span>
                <span class="historico-tipo ${item.type}">${item.type}</span>
            </div>
            <span class="historico-timestamp">${formattedDate}</span>
        </div>
        <div class="historico-mensagem">
            <strong>Recebido:</strong> ${item.receivedMessage}
        </div>
        <div class="historico-resposta">
            <strong>Respondido:</strong> ${item.sentReply}
        </div>
    `;
    
    elements.historyContainer.insertBefore(div, elements.historyContainer.firstChild);
}

/** Adiciona uma mensagem recebida ao log visual (inserida no topo) */
function addMessageItem(item) {
    const firstItem = elements.messagesContainer.querySelector('.text-muted');
    if (firstItem) {
        elements.messagesContainer.innerHTML = '';
    }
    
    const div = document.createElement('div');
    div.className = `mensagem-item ${item.fromMe ? 'sent' : 'received'}`;
    
    const date = new Date(item.timestamp);
    const formattedDate = date.toLocaleString('pt-BR');
    
    const directionIcon = item.fromMe ? 'fa-arrow-up' : 'fa-arrow-down';
    const directionLabel = item.fromMe ? 'Enviada' : 'Recebida';
    
    div.innerHTML = `
        <div class="mensagem-header">
            <div>
                <i class="fas ${directionIcon} mensagem-direction ${item.fromMe ? 'sent' : 'received'}"></i>
                <span class="mensagem-contato">${item.contact}</span>
                <span class="historico-tipo ${item.type}">${item.type}</span>
            </div>
            <span class="historico-timestamp">${formattedDate}</span>
        </div>
        <div class="mensagem-body">${item.body}</div>
    `;
    
    elements.messagesContainer.insertBefore(div, elements.messagesContainer.firstChild);
}

/** Limpa o histórico de mensagens recebidas (com confirmação) */
async function clearMessages() {
    const confirmed = await ConfirmModal.show({
        title: 'Limpar Mensagens',
        message: 'Tem certeza que deseja limpar todo o histórico de mensagens?',
        confirmText: 'Limpar',
        type: 'danger',
        confirmClass: 'btn-danger'
    });
    if (!confirmed) return;
    
    try {
        const result = await makeRequest('/api/mensagens', {
            method: 'DELETE'
        });
        
        if (result.success) {
            elements.messagesContainer.innerHTML = '<p class="text-muted">Nenhuma mensagem recebida ainda</p>';
            showToast('Histórico de mensagens limpo com sucesso!', 'success');
        }
    } catch (error) {
        console.error('Erro ao limpar mensagens:', error);
    }
}

// ==================== FUNÇÕES DE MODAL ====================
// Controle de abertura/fechamento dos modais de criação e edição.

/** Abre o modal de resposta automática (nova ou edição pelo índice) */
function openReplyModal(index = -1) {
    editingIndex = index;
    
    if (index >= 0) {
        const reply = currentConfig.autoReplies[index];
        elements.modalTitle.textContent = 'Editar Resposta Automática';
        elements.inputTriggers.value = reply.triggers.join('\n');
        
        const responseText = Array.isArray(reply.response) 
            ? reply.response.join('\n')
            : reply.response;
        elements.inputResponse.value = responseText;
    } else {
        elements.modalTitle.textContent = 'Nova Resposta Automática';
        elements.inputTriggers.value = '';
        elements.inputResponse.value = '';
    }
    
    elements.replyModal.classList.add('active');
}

function closeReplyModal() {
    elements.replyModal.classList.remove('active');
    editingIndex = -1;
}

function openBlacklistModal() {
    elements.inputBlacklist.value = '';
    elements.blacklistModal.classList.add('active');
}

function closeBlacklistModal() {
    elements.blacklistModal.classList.remove('active');
}

function openGroupBlacklistModal() {
    elements.inputGroupBlacklist.value = '';
    elements.groupBlacklistModal.classList.add('active');
}

function closeGroupBlacklistModal() {
    elements.groupBlacklistModal.classList.remove('active');
}

// ==================== FUNÇÕES DE RESPOSTAS ====================
// CRUD de respostas automáticas via API.

/** Abre o modal de edição para a resposta no índice informado */
window.editReply = function(index) {
    openReplyModal(index);
};

/** Deleta uma resposta automática após confirmação do usuário */
window.deleteReply = async function(index) {
    const confirmed = await ConfirmModal.show({
        title: 'Deletar Resposta',
        message: 'Tem certeza que deseja deletar esta resposta automática?',
        confirmText: 'Deletar',
        type: 'danger',
        confirmClass: 'btn-danger'
    });
    if (!confirmed) return;
    
    try {
        const result = await makeRequest(`/api/respostas/${index}`, {
            method: 'DELETE'
        });
        
        if (result.success) {
            await loadConfig();
            showToast('Resposta deletada com sucesso!', 'success');
        }
    } catch (error) {
        console.error('Erro ao deletar resposta:', error);
    }
};

/** Salva a resposta automática (nova ou editada) via API */
async function saveReply() {
    const triggers = elements.inputTriggers.value
        .split('\n')
        .map(g => g.trim())
        .filter(g => g.length > 0);
    
    const responses = elements.inputResponse.value
        .split('\n')
        .map(r => r.trim())
        .filter(r => r.length > 0);
    
    if (triggers.length === 0 || responses.length === 0) {
        showToast('Preencha todos os campos!', 'warning');
        return;
    }
    
    const newReply = {
        triggers: triggers,
        response: responses.length === 1 ? responses[0] : responses
    };
    
    try {
        let result;
        
        if (editingIndex >= 0) {
            result = await makeRequest(`/api/respostas/${editingIndex}`, {
                method: 'PUT',
                body: JSON.stringify(newReply)
            });
        } else {
            result = await makeRequest('/api/respostas', {
                method: 'POST',
                body: JSON.stringify(newReply)
            });
        }
        
        if (result.success) {
            await loadConfig();
            closeReplyModal();
            showToast(result.message, 'success');
        }
    } catch (error) {
        console.error('Erro ao salvar resposta:', error);
    }
}

// ==================== FUNÇÕES DE LISTA NEGRA ====================
// Gerenciamento dos termos bloqueados (palavras e grupos).

/** Remove um termo da lista negra de palavras pelo índice */
window.removeBlacklist = async function(index) {
    try {
        currentConfig.blacklist.splice(index, 1);
        
        const result = await makeRequest('/api/config', {
            method: 'POST',
            body: JSON.stringify(currentConfig)
        });
        
        if (result.success) {
            await loadConfig();
            showToast('Termo removido da lista negra!', 'success');
        }
    } catch (error) {
        console.error('Erro ao remover termo:', error);
    }
};

/** Adiciona um novo termo à lista negra de palavras */
async function addBlacklist() {
    const term = elements.inputBlacklist.value.trim();
    
    if (!term) {
        showToast('Digite um termo!', 'warning');
        return;
    }
    
    try {
        currentConfig.blacklist.push(term);
        
        const result = await makeRequest('/api/config', {
            method: 'POST',
            body: JSON.stringify(currentConfig)
        });
        
        if (result.success) {
            await loadConfig();
            closeBlacklistModal();
            showToast('Termo adicionado à lista negra!', 'success');
        }
    } catch (error) {
        console.error('Erro ao adicionar termo:', error);
    }
}

// ==================== FUNÇÕES DE LISTA NEGRA DE GRUPOS ====================

/** Remove um grupo da lista negra pelo índice */
window.removeGroupBlacklist = async function(index) {
    try {
        if (!currentConfig.groupBlacklist) currentConfig.groupBlacklist = [];
        currentConfig.groupBlacklist.splice(index, 1);
        
        const result = await makeRequest('/api/config', {
            method: 'POST',
            body: JSON.stringify(currentConfig)
        });
        
        if (result.success) {
            await loadConfig();
            showToast('Grupo removido da lista negra!', 'success');
        }
    } catch (error) {
        console.error('Erro ao remover grupo:', error);
    }
};

/** Adiciona um novo grupo à lista negra */
async function addGroupBlacklist() {
    const term = elements.inputGroupBlacklist.value.trim();
    
    if (!term) {
        showToast('Digite o nome ou parte do nome do grupo!', 'warning');
        return;
    }
    
    try {
        if (!currentConfig.groupBlacklist) currentConfig.groupBlacklist = [];
        currentConfig.groupBlacklist.push(term);
        
        const result = await makeRequest('/api/config', {
            method: 'POST',
            body: JSON.stringify(currentConfig)
        });
        
        if (result.success) {
            await loadConfig();
            closeGroupBlacklistModal();
            showToast('Grupo adicionado à lista negra!', 'success');
        }
    } catch (error) {
        console.error('Erro ao adicionar grupo:', error);
    }
}

// ==================== FUNÇÕES DE CONTROLE DO BOT ====================
// Iniciar/parar o bot e limpar históricos, sempre com confirmação.

/** Inicia o bot do WhatsApp após confirmação do usuário */
async function startBot() {
    const confirmed = await ConfirmModal.show({
        title: 'Iniciar Bot',
        message: 'Deseja iniciar o bot do WhatsApp?',
        confirmText: 'Iniciar',
        type: 'success',
        confirmClass: 'btn-success'
    });
    if (!confirmed) return;

    try {
        const result = await makeRequest('/api/bot/iniciar', {
            method: 'POST'
        });
        
        if (result.success) {
            showToast(result.message, 'success');
        } else {
            showToast(result.message, 'warning');
        }
    } catch (error) {
        console.error('Erro ao iniciar bot:', error);
    }
}

/** Para o bot do WhatsApp após confirmação do usuário */
async function stopBot() {
    const confirmed = await ConfirmModal.show({
        title: 'Parar Bot',
        message: 'Tem certeza que deseja parar o bot? Ele deixará de responder mensagens.',
        confirmText: 'Parar',
        type: 'danger',
        confirmClass: 'btn-danger'
    });
    if (!confirmed) return;
    
    try {
        const result = await makeRequest('/api/bot/parar', {
            method: 'POST'
        });
        
        if (result.success) {
            showToast(result.message, 'success');
        } else {
            showToast(result.message, 'warning');
        }
    } catch (error) {
        console.error('Erro ao parar bot:', error);
    }
}

/** Limpa o histórico de respostas enviadas (com confirmação) */
async function clearHistory() {
    const confirmed = await ConfirmModal.show({
        title: 'Limpar Histórico',
        message: 'Tem certeza que deseja limpar todo o histórico de respostas?',
        confirmText: 'Limpar',
        type: 'danger',
        confirmClass: 'btn-danger'
    });
    if (!confirmed) return;
    
    try {
        const result = await makeRequest('/api/historico', {
            method: 'DELETE'
        });
        
        if (result.success) {
            elements.historyContainer.innerHTML = '<p class="text-muted">Nenhuma resposta enviada ainda</p>';
            elements.totalSentReplies.textContent = '0';
            showToast('Histórico limpo com sucesso!', 'success');
        }
    } catch (error) {
        console.error('Erro ao limpar histórico:', error);
    }
}

// ==================== FUNÇÕES DE RESET ====================

/** Restaura as configurações para os padrões de fábrica (dupla confirmação) */
async function resetConfig() {
    // Primeira confirmação — intenção
    const firstConfirm = await ConfirmModal.show({
        title: 'Resetar Configurações',
        message: 'Deseja resetar todas as configurações para os valores padrão?',
        confirmText: 'Resetar',
        type: 'warning',
        confirmClass: 'btn-warning'
    });
    if (!firstConfirm) return;

    // Segunda confirmação — alerta de irreversibilidade
    const secondConfirm = await ConfirmModal.show({
        title: 'Ação Irreversível',
        message: 'Tem certeza absoluta? Após a confirmação será impossível desfazer os ajustes. Todas as configurações personalizadas serão perdidas permanentemente.',
        confirmText: 'Tenho Certeza',
        cancelText: 'Cancelar',
        type: 'danger',
        confirmClass: 'btn-danger'
    });
    if (!secondConfirm) return;

    try {
        const result = await makeRequest('/api/config/reset', {
            method: 'POST'
        });

        if (result.success) {
            await loadConfig();
            showToast('Configurações restauradas para os padrões!', 'success');
        }
    } catch (error) {
        console.error('Erro ao resetar configurações:', error);
    }
}

// ==================== FUNÇÕES UTILITÁRIAS ====================

/**
 * Exibe uma notificação toast temporária (3 segundos).
 * @param {string} message - Texto da notificação
 * @param {'success'|'error'|'warning'} type - Tipo visual do toast
 */
function showToast(message, type = 'success') {
    elements.toast.textContent = message;
    elements.toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        elements.toast.classList.remove('show');
    }, 3000);
}

// ==================== EVENT LISTENERS ====================
// Vincula ações da interface aos handlers correspondentes.

// Controle do bot
elements.btnStart.addEventListener('click', startBot);
elements.btnStop.addEventListener('click', stopBot);
elements.btnResetConfig = document.getElementById('btnResetConfig');
elements.btnResetConfig.addEventListener('click', resetConfig);

// Auto-save: qualquer alteração nos toggles/inputs salva automaticamente (debounce 400ms)
elements.replyGroups.addEventListener('change', autoSaveConfig);
elements.replyPrivate.addEventListener('change', autoSaveConfig);
elements.caseSensitive.addEventListener('change', autoSaveConfig);
elements.wholeWord.addEventListener('change', autoSaveConfig);
elements.delayMin.addEventListener('input', () => { updateDelayPreview(); autoSaveConfig(); });
elements.delayMax.addEventListener('input', () => { updateDelayPreview(); autoSaveConfig(); });

// Botões de ação principal
elements.btnNewReply.addEventListener('click', () => openReplyModal());
elements.btnNewTerm.addEventListener('click', openBlacklistModal);
elements.btnNewGroupTerm.addEventListener('click', openGroupBlacklistModal);
elements.btnClearHistory.addEventListener('click', clearHistory);
elements.btnClearMessages.addEventListener('click', clearMessages);

// Modal: resposta automática
elements.btnCloseModal.addEventListener('click', closeReplyModal);
elements.btnCancel.addEventListener('click', closeReplyModal);
elements.btnSaveReply.addEventListener('click', saveReply);

// Modal: lista negra de palavras
elements.btnCloseBlacklistModal.addEventListener('click', closeBlacklistModal);
elements.btnCancelBlacklist.addEventListener('click', closeBlacklistModal);
elements.btnSaveBlacklist.addEventListener('click', addBlacklist);

// Modal: lista negra de grupos
elements.btnCloseGroupBlacklistModal.addEventListener('click', closeGroupBlacklistModal);
elements.btnCancelGroupBlacklist.addEventListener('click', closeGroupBlacklistModal);
elements.btnSaveGroupBlacklist.addEventListener('click', addGroupBlacklist);

// Fecha qualquer modal ao clicar no overlay (fora do conteúdo)
elements.replyModal.addEventListener('click', (e) => {
    if (e.target === elements.replyModal) closeReplyModal();
});

elements.blacklistModal.addEventListener('click', (e) => {
    if (e.target === elements.blacklistModal) closeBlacklistModal();
});

elements.groupBlacklistModal.addEventListener('click', (e) => {
    if (e.target === elements.groupBlacklistModal) closeGroupBlacklistModal();
});

// ==================== INICIALIZAÇÃO ====================
// Executa quando o DOM estiver pronto: inicia WebSocket, carrega configs e históricos.

document.addEventListener('DOMContentLoaded', () => {
    ConfirmModal.init();
    initWebSocket();
    loadConfig();
    loadHistory();
    loadMessages();
});
