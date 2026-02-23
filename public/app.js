// ==================== VARIÁVEIS GLOBAIS ====================
const API_URL = window.location.origin;
let socket;
let currentConfig = null;
let editingIndex = -1;

// ==================== ELEMENTOS DO DOM ====================
const elements = {
    // Status
    statusDot: document.getElementById('statusDot'),
    statusText: document.getElementById('statusText'),
    
    // QR Code
    qrSection: document.getElementById('qrSection'),
    qrCode: document.getElementById('qrCode'),
    
    // Controle do Bot
    btnStart: document.getElementById('btnStart'),
    btnStop: document.getElementById('btnStop'),
    
    // Stats
    totalReplies: document.getElementById('totalReplies'),
    totalBlacklist: document.getElementById('totalBlacklist'),
    
    // Configurações
    replyGroups: document.getElementById('replyGroups'),
    replyPrivate: document.getElementById('replyPrivate'),
    caseSensitive: document.getElementById('caseSensitive'),
    wholeWord: document.getElementById('wholeWord'),
    delayMin: document.getElementById('delayMin'),
    delayMax: document.getElementById('delayMax'),
    btnSaveConfig: document.getElementById('btnSaveConfig'),
    
    // Respostas
    repliesList: document.getElementById('repliesList'),
    btnNewReply: document.getElementById('btnNewReply'),
    
    // Lista Negra
    blacklistContainer: document.getElementById('blacklistContainer'),
    btnNewTerm: document.getElementById('btnNewTerm'),
    
    // Histórico
    historyContainer: document.getElementById('historyContainer'),
    btnClearHistory: document.getElementById('btnClearHistory'),
    
    // Modal Resposta
    replyModal: document.getElementById('replyModal'),
    modalTitle: document.getElementById('modalTitle'),
    inputTriggers: document.getElementById('inputTriggers'),
    inputResponse: document.getElementById('inputResponse'),
    btnCloseModal: document.getElementById('btnCloseModal'),
    btnCancel: document.getElementById('btnCancel'),
    btnSaveReply: document.getElementById('btnSaveReply'),
    
    // Modal Lista Negra
    blacklistModal: document.getElementById('blacklistModal'),
    inputBlacklist: document.getElementById('inputBlacklist'),
    btnCloseBlacklistModal: document.getElementById('btnCloseBlacklistModal'),
    btnCancelBlacklist: document.getElementById('btnCancelBlacklist'),
    btnSaveBlacklist: document.getElementById('btnSaveBlacklist'),
    
    // Toast
    toast: document.getElementById('toast')
};

// ==================== WEBSOCKET ====================
let statusTimeoutId = null;
let nextStatus = null;

function initWebSocket() {
    socket = io(API_URL);
    
    socket.on('connect', () => {
        console.log('✅ Conectado ao servidor via WebSocket');
    });
    
    socket.on('status', (status) => {
        // Se houver um delay em andamento para status "autenticado"
        if (statusTimeoutId && status !== 'autenticado') {
            nextStatus = status;
            return;
        }
        
        updateStatus(status);
    });
    
    socket.on('qrcode', (qrcode) => {
        if (qrcode) {
            elements.qrCode.src = qrcode;
            elements.qrSection.style.display = 'block';
        } else {
            elements.qrSection.style.display = 'none';
        }
    });
    
    socket.on('nova-resposta', (record) => {
        addHistoryItem(record);
    });
    
    socket.on('disconnect', () => {
        console.log('⚠️  Desconectado do servidor');
    });
}

// ==================== FUNÇÕES DE STATUS ====================
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
    
    // Se o status for "autenticado", adiciona um delay antes de aceitar novos status
    if (status === 'autenticado') {
        statusTimeoutId = setTimeout(() => {
            statusTimeoutId = null;
            // Se houver um próximo status na fila, atualiza agora
            if (nextStatus) {
                const pendingStatus = nextStatus;
                nextStatus = null;
                updateStatus(pendingStatus);
            }
        }, 2000); // 2 segundos de delay
    }
}

// ==================== FUNÇÕES DE API ====================
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

async function loadConfig() {
    try {
        const config = await makeRequest('/api/config');
        currentConfig = config;
        
        // Atualiza configurações gerais
        elements.replyGroups.checked = config.settings.replyInGroups;
        elements.replyPrivate.checked = config.settings.replyInPrivate;
        elements.caseSensitive.checked = config.settings.caseSensitive;
        elements.wholeWord.checked = config.settings.wholeWord;
        elements.delayMin.value = config.settings.delayRange.min;
        elements.delayMax.value = config.settings.delayRange.max;
        
        // Atualiza stats
        elements.totalReplies.textContent = config.autoReplies.length;
        elements.totalBlacklist.textContent = config.blacklist.length;
        
        // Renderiza listas
        renderReplies();
        renderBlacklist();
    } catch (error) {
        console.error('Erro ao carregar configurações:', error);
    }
}

async function saveConfig() {
    try {
        currentConfig.settings.replyInGroups = elements.replyGroups.checked;
        currentConfig.settings.replyInPrivate = elements.replyPrivate.checked;
        currentConfig.settings.caseSensitive = elements.caseSensitive.checked;
        currentConfig.settings.wholeWord = elements.wholeWord.checked;
        currentConfig.settings.delayRange.min = parseInt(elements.delayMin.value);
        currentConfig.settings.delayRange.max = parseInt(elements.delayMax.value);
        
        const result = await makeRequest('/api/config', {
            method: 'POST',
            body: JSON.stringify(currentConfig)
        });
        
        if (result.success) {
            showToast('Configurações salvas com sucesso!', 'success');
        }
    } catch (error) {
        console.error('Erro ao salvar configurações:', error);
    }
}

async function loadHistory() {
    try {
        const history = await makeRequest('/api/historico');
        elements.historyContainer.innerHTML = '';
        
        if (history.length === 0) {
            elements.historyContainer.innerHTML = '<p class="text-muted">Nenhuma resposta enviada ainda</p>';
        } else {
            history.forEach(item => addHistoryItem(item));
        }
    } catch (error) {
        console.error('Erro ao carregar histórico:', error);
    }
}

// ==================== FUNÇÕES DE RENDERIZAÇÃO ====================
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

// ==================== FUNÇÕES DE MODAL ====================
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

// ==================== FUNÇÕES DE RESPOSTAS ====================
window.editReply = function(index) {
    openReplyModal(index);
};

window.deleteReply = async function(index) {
    if (!confirm('Tem certeza que deseja deletar esta resposta?')) return;
    
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

// ==================== FUNÇÕES DE CONTROLE DO BOT ====================
async function startBot() {
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

async function stopBot() {
    if (!confirm('Tem certeza que deseja parar o bot?')) return;
    
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

async function clearHistory() {
    if (!confirm('Tem certeza que deseja limpar o histórico?')) return;
    
    try {
        const result = await makeRequest('/api/historico', {
            method: 'DELETE'
        });
        
        if (result.success) {
            elements.historyContainer.innerHTML = '<p class="text-muted">Nenhuma resposta enviada ainda</p>';
            showToast('Histórico limpo com sucesso!', 'success');
        }
    } catch (error) {
        console.error('Erro ao limpar histórico:', error);
    }
}

// ==================== FUNÇÕES UTILITÁRIAS ====================
function showToast(message, type = 'success') {
    elements.toast.textContent = message;
    elements.toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        elements.toast.classList.remove('show');
    }, 3000);
}

// ==================== EVENT LISTENERS ====================
elements.btnStart.addEventListener('click', startBot);
elements.btnStop.addEventListener('click', stopBot);
elements.btnSaveConfig.addEventListener('click', saveConfig);
elements.btnNewReply.addEventListener('click', () => openReplyModal());
elements.btnNewTerm.addEventListener('click', openBlacklistModal);
elements.btnClearHistory.addEventListener('click', clearHistory);

// Modal Resposta
elements.btnCloseModal.addEventListener('click', closeReplyModal);
elements.btnCancel.addEventListener('click', closeReplyModal);
elements.btnSaveReply.addEventListener('click', saveReply);

// Modal Lista Negra
elements.btnCloseBlacklistModal.addEventListener('click', closeBlacklistModal);
elements.btnCancelBlacklist.addEventListener('click', closeBlacklistModal);
elements.btnSaveBlacklist.addEventListener('click', addBlacklist);

// Fechar modal ao clicar fora
elements.replyModal.addEventListener('click', (e) => {
    if (e.target === elements.replyModal) closeReplyModal();
});

elements.blacklistModal.addEventListener('click', (e) => {
    if (e.target === elements.blacklistModal) closeBlacklistModal();
});

// ==================== INICIALIZAÇÃO ====================
document.addEventListener('DOMContentLoaded', () => {
    initWebSocket();
    loadConfig();
    loadHistory();
});
