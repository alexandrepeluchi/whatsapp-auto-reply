// ==================== VARIÁVEIS GLOBAIS ====================
const API_URL = window.location.origin;
let socket;
let configuracaoAtual = null;
let indiceEditando = -1;

// ==================== ELEMENTOS DO DOM ====================
const elements = {
    // Status
    statusDot: document.getElementById('statusDot'),
    statusText: document.getElementById('statusText'),
    
    // QR Code
    qrSection: document.getElementById('qrSection'),
    qrCode: document.getElementById('qrCode'),
    
    // Controle do Bot
    btnIniciar: document.getElementById('btnIniciar'),
    btnParar: document.getElementById('btnParar'),
    
    // Stats
    totalRespostas: document.getElementById('totalRespostas'),
    totalListaNegra: document.getElementById('totalListaNegra'),
    
    // Configurações
    responderGrupos: document.getElementById('responderGrupos'),
    responderPrivado: document.getElementById('responderPrivado'),
    diferenciarMaiusculas: document.getElementById('diferenciarMaiusculas'),
    palavraInteira: document.getElementById('palavraInteira'),
    delayMin: document.getElementById('delayMin'),
    delayMax: document.getElementById('delayMax'),
    btnSalvarConfig: document.getElementById('btnSalvarConfig'),
    
    // Respostas
    listaRespostas: document.getElementById('listaRespostas'),
    btnNovaResposta: document.getElementById('btnNovaResposta'),
    
    // Lista Negra
    listaNegraContainer: document.getElementById('listaNegraContainer'),
    btnNovoTermo: document.getElementById('btnNovoTermo'),
    
    // Histórico
    historicoContainer: document.getElementById('historicoContainer'),
    btnLimparHistorico: document.getElementById('btnLimparHistorico'),
    
    // Modal Resposta
    modalResposta: document.getElementById('modalResposta'),
    modalTitle: document.getElementById('modalTitle'),
    inputGatilhos: document.getElementById('inputGatilhos'),
    inputResposta: document.getElementById('inputResposta'),
    btnFecharModal: document.getElementById('btnFecharModal'),
    btnCancelar: document.getElementById('btnCancelar'),
    btnSalvarResposta: document.getElementById('btnSalvarResposta'),
    
    // Modal Lista Negra
    modalListaNegra: document.getElementById('modalListaNegra'),
    inputListaNegra: document.getElementById('inputListaNegra'),
    btnFecharModalListaNegra: document.getElementById('btnFecharModalListaNegra'),
    btnCancelarListaNegra: document.getElementById('btnCancelarListaNegra'),
    btnSalvarListaNegra: document.getElementById('btnSalvarListaNegra'),
    
    // Toast
    toast: document.getElementById('toast')
};

// ==================== WEBSOCKET ====================
let statusTimeoutId = null;
let proximoStatus = null;

function inicializarWebSocket() {
    socket = io(API_URL);
    
    socket.on('connect', () => {
        console.log('✅ Conectado ao servidor via WebSocket');
    });
    
    socket.on('status', (status) => {
        // Se houver um delay em andamento para status "autenticado"
        if (statusTimeoutId && status !== 'autenticado') {
            proximoStatus = status;
            return;
        }
        
        atualizarStatus(status);
    });
    
    socket.on('qrcode', (qrcode) => {
        if (qrcode) {
            elements.qrCode.src = qrcode;
            elements.qrSection.style.display = 'block';
        } else {
            elements.qrSection.style.display = 'none';
        }
    });
    
    socket.on('nova-resposta', (registro) => {
        adicionarItemHistorico(registro);
    });
    
    socket.on('disconnect', () => {
        console.log('⚠️  Desconectado do servidor');
    });
}

// ==================== FUNÇÕES DE STATUS ====================
function atualizarStatus(status) {
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
            if (proximoStatus) {
                const statusParaAtualizar = proximoStatus;
                proximoStatus = null;
                atualizarStatus(statusParaAtualizar);
            }
        }, 2000); // 2 segundos de delay
    }
}

// ==================== FUNÇÕES DE API ====================
async function fazerRequisicao(url, opcoes = {}) {
    try {
        const resposta = await fetch(API_URL + url, {
            headers: {
                'Content-Type': 'application/json',
                ...opcoes.headers
            },
            ...opcoes
        });
        
        if (!resposta.ok) {
            throw new Error(`Erro HTTP: ${resposta.status}`);
        }
        
        return await resposta.json();
    } catch (erro) {
        console.error('Erro na requisição:', erro);
        mostrarToast('Erro ao comunicar com o servidor', 'error');
        throw erro;
    }
}

async function carregarConfiguracoes() {
    try {
        const config = await fazerRequisicao('/api/config');
        configuracaoAtual = config;
        
        // Atualiza configurações gerais
        elements.responderGrupos.checked = config.configuracoes.responderEmGrupos;
        elements.responderPrivado.checked = config.configuracoes.responderEmPrivado;
        elements.diferenciarMaiusculas.checked = config.configuracoes.diferenciarMaiusculas;
        elements.palavraInteira.checked = config.configuracoes.palavraInteira;
        elements.delayMin.value = config.configuracoes.intervaloAtraso.minimo;
        elements.delayMax.value = config.configuracoes.intervaloAtraso.maximo;
        
        // Atualiza stats
        elements.totalRespostas.textContent = config.respostasAutomaticas.length;
        elements.totalListaNegra.textContent = config.listaNegra.length;
        
        // Renderiza listas
        renderizarRespostas();
        renderizarListaNegra();
    } catch (erro) {
        console.error('Erro ao carregar configurações:', erro);
    }
}

async function salvarConfiguracoes() {
    try {
        configuracaoAtual.configuracoes.responderEmGrupos = elements.responderGrupos.checked;
        configuracaoAtual.configuracoes.responderEmPrivado = elements.responderPrivado.checked;
        configuracaoAtual.configuracoes.diferenciarMaiusculas = elements.diferenciarMaiusculas.checked;
        configuracaoAtual.configuracoes.palavraInteira = elements.palavraInteira.checked;
        configuracaoAtual.configuracoes.intervaloAtraso.minimo = parseInt(elements.delayMin.value);
        configuracaoAtual.configuracoes.intervaloAtraso.maximo = parseInt(elements.delayMax.value);
        
        const resultado = await fazerRequisicao('/api/config', {
            method: 'POST',
            body: JSON.stringify(configuracaoAtual)
        });
        
        if (resultado.sucesso) {
            mostrarToast('Configurações salvas com sucesso!', 'success');
        }
    } catch (erro) {
        console.error('Erro ao salvar configurações:', erro);
    }
}

async function carregarHistorico() {
    try {
        const historico = await fazerRequisicao('/api/historico');
        elements.historicoContainer.innerHTML = '';
        
        if (historico.length === 0) {
            elements.historicoContainer.innerHTML = '<p class="text-muted">Nenhuma resposta enviada ainda</p>';
        } else {
            historico.forEach(item => adicionarItemHistorico(item));
        }
    } catch (erro) {
        console.error('Erro ao carregar histórico:', erro);
    }
}

// ==================== FUNÇÕES DE RENDERIZAÇÃO ====================
function renderizarRespostas() {
    elements.listaRespostas.innerHTML = '';
    
    if (configuracaoAtual.respostasAutomaticas.length === 0) {
        elements.listaRespostas.innerHTML = '<p class="text-muted">Nenhuma resposta automática configurada</p>';
        return;
    }
    
    configuracaoAtual.respostasAutomaticas.forEach((resposta, indice) => {
        const div = document.createElement('div');
        div.className = 'resposta-item';
        
        const respostaTexto = Array.isArray(resposta.resposta) 
            ? resposta.resposta.join('\n--- OU ---\n')
            : resposta.resposta;
        
        div.innerHTML = `
            <div class="resposta-header">
                <div>
                    <div class="resposta-gatilhos">
                        ${resposta.gatilhos.map(g => `<span class="gatilho-tag">${g}</span>`).join('')}
                    </div>
                    <div class="resposta-text">${respostaTexto}</div>
                </div>
                <div class="resposta-actions">
                    <button class="btn btn-primary btn-icon" onclick="editarResposta(${indice})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-icon" onclick="deletarResposta(${indice})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        
        elements.listaRespostas.appendChild(div);
    });
}

function renderizarListaNegra() {
    elements.listaNegraContainer.innerHTML = '';
    
    if (configuracaoAtual.listaNegra.length === 0) {
        elements.listaNegraContainer.innerHTML = '<p class="text-muted">Nenhum termo na lista negra</p>';
        return;
    }
    
    configuracaoAtual.listaNegra.forEach((termo, indice) => {
        const span = document.createElement('span');
        span.className = 'lista-negra-item';
        span.innerHTML = `
            ${termo}
            <button onclick="removerListaNegra(${indice})">
                <i class="fas fa-times"></i>
            </button>
        `;
        elements.listaNegraContainer.appendChild(span);
    });
}

function adicionarItemHistorico(item) {
    const primeiroItem = elements.historicoContainer.querySelector('.text-muted');
    if (primeiroItem) {
        elements.historicoContainer.innerHTML = '';
    }
    
    const div = document.createElement('div');
    div.className = 'historico-item';
    
    const data = new Date(item.timestamp);
    const dataFormatada = data.toLocaleString('pt-BR');
    
    div.innerHTML = `
        <div class="historico-header">
            <div>
                <span class="historico-contato">${item.contato}</span>
                <span class="historico-tipo ${item.tipo}">${item.tipo}</span>
            </div>
            <span class="historico-timestamp">${dataFormatada}</span>
        </div>
        <div class="historico-mensagem">
            <strong>Recebido:</strong> ${item.mensagemRecebida}
        </div>
        <div class="historico-resposta">
            <strong>Respondido:</strong> ${item.respostaEnviada}
        </div>
    `;
    
    elements.historicoContainer.insertBefore(div, elements.historicoContainer.firstChild);
}

// ==================== FUNÇÕES DE MODAL ====================
function abrirModalResposta(indice = -1) {
    indiceEditando = indice;
    
    if (indice >= 0) {
        const resposta = configuracaoAtual.respostasAutomaticas[indice];
        elements.modalTitle.textContent = 'Editar Resposta Automática';
        elements.inputGatilhos.value = resposta.gatilhos.join('\n');
        
        const respostaTexto = Array.isArray(resposta.resposta) 
            ? resposta.resposta.join('\n')
            : resposta.resposta;
        elements.inputResposta.value = respostaTexto;
    } else {
        elements.modalTitle.textContent = 'Nova Resposta Automática';
        elements.inputGatilhos.value = '';
        elements.inputResposta.value = '';
    }
    
    elements.modalResposta.classList.add('active');
}

function fecharModalResposta() {
    elements.modalResposta.classList.remove('active');
    indiceEditando = -1;
}

function abrirModalListaNegra() {
    elements.inputListaNegra.value = '';
    elements.modalListaNegra.classList.add('active');
}

function fecharModalListaNegra() {
    elements.modalListaNegra.classList.remove('active');
}

// ==================== FUNÇÕES DE RESPOSTAS ====================
window.editarResposta = function(indice) {
    abrirModalResposta(indice);
};

window.deletarResposta = async function(indice) {
    if (!confirm('Tem certeza que deseja deletar esta resposta?')) return;
    
    try {
        const resultado = await fazerRequisicao(`/api/respostas/${indice}`, {
            method: 'DELETE'
        });
        
        if (resultado.sucesso) {
            await carregarConfiguracoes();
            mostrarToast('Resposta deletada com sucesso!', 'success');
        }
    } catch (erro) {
        console.error('Erro ao deletar resposta:', erro);
    }
};

async function salvarResposta() {
    const gatilhos = elements.inputGatilhos.value
        .split('\n')
        .map(g => g.trim())
        .filter(g => g.length > 0);
    
    const respostas = elements.inputResposta.value
        .split('\n')
        .map(r => r.trim())
        .filter(r => r.length > 0);
    
    if (gatilhos.length === 0 || respostas.length === 0) {
        mostrarToast('Preencha todos os campos!', 'warning');
        return;
    }
    
    const novaResposta = {
        gatilhos: gatilhos,
        resposta: respostas.length === 1 ? respostas[0] : respostas
    };
    
    try {
        let resultado;
        
        if (indiceEditando >= 0) {
            resultado = await fazerRequisicao(`/api/respostas/${indiceEditando}`, {
                method: 'PUT',
                body: JSON.stringify(novaResposta)
            });
        } else {
            resultado = await fazerRequisicao('/api/respostas', {
                method: 'POST',
                body: JSON.stringify(novaResposta)
            });
        }
        
        if (resultado.sucesso) {
            await carregarConfiguracoes();
            fecharModalResposta();
            mostrarToast(resultado.mensagem, 'success');
        }
    } catch (erro) {
        console.error('Erro ao salvar resposta:', erro);
    }
}

// ==================== FUNÇÕES DE LISTA NEGRA ====================
window.removerListaNegra = async function(indice) {
    try {
        configuracaoAtual.listaNegra.splice(indice, 1);
        
        const resultado = await fazerRequisicao('/api/config', {
            method: 'POST',
            body: JSON.stringify(configuracaoAtual)
        });
        
        if (resultado.sucesso) {
            await carregarConfiguracoes();
            mostrarToast('Termo removido da lista negra!', 'success');
        }
    } catch (erro) {
        console.error('Erro ao remover termo:', erro);
    }
};

async function adicionarListaNegra() {
    const termo = elements.inputListaNegra.value.trim();
    
    if (!termo) {
        mostrarToast('Digite um termo!', 'warning');
        return;
    }
    
    try {
        configuracaoAtual.listaNegra.push(termo);
        
        const resultado = await fazerRequisicao('/api/config', {
            method: 'POST',
            body: JSON.stringify(configuracaoAtual)
        });
        
        if (resultado.sucesso) {
            await carregarConfiguracoes();
            fecharModalListaNegra();
            mostrarToast('Termo adicionado à lista negra!', 'success');
        }
    } catch (erro) {
        console.error('Erro ao adicionar termo:', erro);
    }
}

// ==================== FUNÇÕES DE CONTROLE DO BOT ====================
async function iniciarBot() {
    try {
        const resultado = await fazerRequisicao('/api/bot/iniciar', {
            method: 'POST'
        });
        
        if (resultado.sucesso) {
            mostrarToast(resultado.mensagem, 'success');
        } else {
            mostrarToast(resultado.mensagem, 'warning');
        }
    } catch (erro) {
        console.error('Erro ao iniciar bot:', erro);
    }
}

async function pararBot() {
    if (!confirm('Tem certeza que deseja parar o bot?')) return;
    
    try {
        const resultado = await fazerRequisicao('/api/bot/parar', {
            method: 'POST'
        });
        
        if (resultado.sucesso) {
            mostrarToast(resultado.mensagem, 'success');
        } else {
            mostrarToast(resultado.mensagem, 'warning');
        }
    } catch (erro) {
        console.error('Erro ao parar bot:', erro);
    }
}

async function limparHistorico() {
    if (!confirm('Tem certeza que deseja limpar o histórico?')) return;
    
    try {
        const resultado = await fazerRequisicao('/api/historico', {
            method: 'DELETE'
        });
        
        if (resultado.sucesso) {
            elements.historicoContainer.innerHTML = '<p class="text-muted">Nenhuma resposta enviada ainda</p>';
            mostrarToast('Histórico limpo com sucesso!', 'success');
        }
    } catch (erro) {
        console.error('Erro ao limpar histórico:', erro);
    }
}

// ==================== FUNÇÕES UTILITÁRIAS ====================
function mostrarToast(mensagem, tipo = 'success') {
    elements.toast.textContent = mensagem;
    elements.toast.className = `toast ${tipo} show`;
    
    setTimeout(() => {
        elements.toast.classList.remove('show');
    }, 3000);
}

// ==================== EVENT LISTENERS ====================
elements.btnIniciar.addEventListener('click', iniciarBot);
elements.btnParar.addEventListener('click', pararBot);
elements.btnSalvarConfig.addEventListener('click', salvarConfiguracoes);
elements.btnNovaResposta.addEventListener('click', () => abrirModalResposta());
elements.btnNovoTermo.addEventListener('click', abrirModalListaNegra);
elements.btnLimparHistorico.addEventListener('click', limparHistorico);

// Modal Resposta
elements.btnFecharModal.addEventListener('click', fecharModalResposta);
elements.btnCancelar.addEventListener('click', fecharModalResposta);
elements.btnSalvarResposta.addEventListener('click', salvarResposta);

// Modal Lista Negra
elements.btnFecharModalListaNegra.addEventListener('click', fecharModalListaNegra);
elements.btnCancelarListaNegra.addEventListener('click', fecharModalListaNegra);
elements.btnSalvarListaNegra.addEventListener('click', adicionarListaNegra);

// Fechar modal ao clicar fora
elements.modalResposta.addEventListener('click', (e) => {
    if (e.target === elements.modalResposta) fecharModalResposta();
});

elements.modalListaNegra.addEventListener('click', (e) => {
    if (e.target === elements.modalListaNegra) fecharModalListaNegra();
});

// ==================== INICIALIZAÇÃO ====================
document.addEventListener('DOMContentLoaded', () => {
    inicializarWebSocket();
    carregarConfiguracoes();
    carregarHistorico();
});
