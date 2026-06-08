/**
 * ============================================================================
 * Módulo: CALENDAR
 * ============================================================================
 * Responsabilidade: Gerencia funcionalidades relacionadas a calendar.
 * Este arquivo faz parte do sistema modular do DVC App.
 * Todos os códigos principais aqui agrupados seguem as diretrizes do projeto.
 * ============================================================================
 */

// CALENDAR MODULE DVC APP

import { auth, db, collection, doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc } from "./firebase.js";
import { PROJETO_ATUAL_DVC } from "./state.js";
import {
    escaparHtml,
    safeEditParam,
    normalizarEmailDVC,
    normalizarFuncaoTecnica,
    renderBadgesAtletaDVC
} from "./utils.js";

function usuarioEhEquipeTecnica() {
    return typeof window.usuarioEhEquipeTecnica === "function"
        ? window.usuarioEhEquipeTecnica()
        : false;
}

function usuarioPodeAprovarAvaliacoes() {
    return typeof window.usuarioPodeAprovarAvaliacoes === "function"
        ? window.usuarioPodeAprovarAvaliacoes()
        : false;
}

function ehResponsavelTecnico(user = {}) {
    return typeof window.ehResponsavelTecnico === "function"
        ? window.ehResponsavelTecnico(user)
        : false;
}

function usuarioPodeSerEscaladoComoAtleta(user = {}) {
    return typeof window.usuarioPodeSerEscaladoComoAtleta === "function"
        ? window.usuarioPodeSerEscaladoComoAtleta(user)
        : true;
}

function usuarioTemStatusConvocavel(user = {}) {
    return typeof window.usuarioTemStatusConvocavel === "function"
        ? window.usuarioTemStatusConvocavel(user)
        : true;
}

function usuarioPodeSerConvocadoPorFinanceiro(user = {}) {
    return typeof window.usuarioPodeSerConvocadoPorFinanceiro === "function"
        ? window.usuarioPodeSerConvocadoPorFinanceiro(user)
        : true;
}

function obterStatusFinanceiroEfetivo(user = {}) {
    return typeof window.obterStatusFinanceiroEfetivo === "function"
        ? window.obterStatusFinanceiroEfetivo(user)
        : (user.financeiro || "Sem status");
}

async function carregarEventosCache(forcar = false) {
    return typeof window.carregarEventosCache === "function"
        ? window.carregarEventosCache(forcar)
        : [];
}

async function carregarUsuariosCacheMockDVC(force = false) {
    if (typeof window.carregarUsuariosCacheMockDVC === "function") {
        return window.carregarUsuariosCacheMockDVC(force);
    }

    return {
        docs: [],
        empty: true,
        size: 0,
        forEach() {}
    };
}

async function carregarPresencasEventoDVC(eventId, force = false) {
    return typeof window.carregarPresencasEventoDVC === "function"
        ? window.carregarPresencasEventoDVC(eventId, force)
        : [];
}

async function carregarConvocadosEventoDVC(eventId, force = false) {
    return typeof window.carregarConvocadosEventoDVC === "function"
        ? window.carregarConvocadosEventoDVC(eventId, force)
        : [];
}

function limparCacheDados(tipo = "todos") {
    if (typeof window.limparCacheDados === "function") {
        return window.limparCacheDados(tipo);
    }
}

function limparCachePresencasEventoDVC(eventId = null) {
    if (typeof window.limparCachePresencasEventoDVC === "function") {
        return window.limparCachePresencasEventoDVC(eventId);
    }
}

function limparCacheConvocadosEventoDVC(eventId = null) {
    if (typeof window.limparCacheConvocadosEventoDVC === "function") {
        return window.limparCacheConvocadosEventoDVC(eventId);
    }
}

window.concluirTreino = async (evId) => {
            if (!usuarioEhEquipeTecnica()) {
                return alert("Apenas ADM, Treinador ou Auxiliar podem concluir eventos.");
            }

            if(confirm("Deseja concluir este treino? Ele será movido para o histórico.")) {
                await updateDoc(doc(db, "events", evId), {
                    status: "concluido",
                    statusTreino: "Finalizado",
                    finalizadoEm: new Date().toISOString(),
                    finalizadoPor: window.currentUserData?.nome || auth.currentUser?.email || "Equipe tecnica"
                });
                limparCacheDados("eventos");
                window.renderCalendar();
                if (confirm("Treino finalizado. Deseja avaliar atletas do treino agora?")) {
                    await window.abrirAvaliacaoAtletasDoTreino(evId);
                }
            }
        };

window.toggleCamposJogo = () => {
    const tipo = document.getElementById('ev-tipo')?.value || "treino";
    const camposJogo = document.getElementById('campos-jogo');
    const camposTreino = document.getElementById('campos-treino');
    const opcoesTreino = document.getElementById('ev-opcoes');

    if (camposJogo) {
        camposJogo.classList.toggle('hidden', tipo !== "jogo");
    }

    if (camposTreino) {
        camposTreino.classList.toggle('hidden', tipo !== "treino");
    }

    if (opcoesTreino) {
        opcoesTreino.classList.toggle('hidden', tipo !== "treino");
    }
};

function adicionarResponsavelTecnico(lista, user, emailFallback = "") {
    if (!ehResponsavelTecnico(user)) return;

    const email = String(user?.email || emailFallback || "").trim();
    if (!email || lista.some(item => item.email === email)) return;

    lista.push({
        email,
        nome: String(user?.nome || email).trim(),
        funcao: String(user?.funcao || "Responsável").trim()
    });
}
function renderizarResponsaveisTecnicosSelectLegado(select, responsaveis, selectedEmail = "") {
    const selecionado = String(selectedEmail || select.value || "").trim();

    if (!responsaveis.length) {
        select.innerHTML = `<option value="">Nenhum treinador ou auxiliar encontrado</option>`;
        return;
    }

    responsaveis.sort((a, b) => a.nome.localeCompare(b.nome));
    select.innerHTML = `
        <option value="">Responsável técnico</option>
        ${responsaveis.map(r => {
            return `<option value="${escaparHtml(r.email)}">${escaparHtml(r.nome)} - ${escaparHtml(r.funcao)}</option>`;
        }).join('')}
    `;

    if (selecionado) {
        select.value = selecionado;
    }
}
function renderizarResponsaveisTecnicos(container, responsaveis, selecionados = []) {
    const selecionadosSet = new Set(
        (Array.isArray(selecionados) ? selecionados : [selecionados])
            .map(item => String(item?.email || item || "").trim().toLowerCase())
            .filter(Boolean)
    );

    if (!container) return;

    if (!responsaveis.length) {
        container.innerHTML = `
            <div class="bg-gray-50 border border-dashed rounded-2xl p-3 text-center">
                <p class="text-[10px] text-gray-400 font-bold uppercase">Nenhum treinador ou auxiliar encontrado</p>
            </div>
        `;
        return;
    }

    responsaveis.sort((a, b) => a.nome.localeCompare(b.nome));
    container.innerHTML = `
        <div class="bg-gray-50 border border-gray-100 rounded-2xl p-3 mb-3">
            <p class="text-[8px] font-black text-[#990000] uppercase mb-2">Responsaveis pelo treino</p>
            <div class="space-y-2 max-h-44 overflow-y-auto custom-scroll pr-1">
                ${responsaveis.map(r => {
                    const email = String(r.email || "").trim().toLowerCase();
                    const checked = selecionadosSet.has(email);

                    return `
                        <label class="flex items-center justify-between gap-3 bg-white border border-gray-100 rounded-xl p-2 cursor-pointer">
                            <span class="min-w-0">
                                <span class="block text-[10px] font-black uppercase text-gray-800 truncate">${escaparHtml(r.nome)}</span>
                                <span class="block text-[8px] font-bold uppercase text-gray-400">${escaparHtml(r.funcao)} - ${escaparHtml(email)}</span>
                            </span>
                            <input type="checkbox" class="responsavel-tecnico-check w-4 h-4 accent-[#990000]" value="${escaparHtml(email)}" data-nome="${escaparHtml(r.nome)}" data-funcao="${escaparHtml(r.funcao)}" ${checked ? "checked" : ""}>
                        </label>
                    `;
                }).join("")}
            </div>
        </div>
    `;
}

function obterResponsaveisSelecionadosEvento() {
    return Array.from(document.querySelectorAll(".responsavel-tecnico-check:checked"))
        .map(input => ({
            email: String(input.value || "").trim().toLowerCase(),
            nome: String(input.dataset.nome || input.value || "").trim(),
            funcao: String(input.dataset.funcao || "Responsavel").trim()
        }))
        .filter(item => item.email);
}

function normalizarResponsaveisTecnicosEvento(ev = {}) {
    if (Array.isArray(ev.responsaveisTecnicos) && ev.responsaveisTecnicos.length) {
        return ev.responsaveisTecnicos
            .map(item => ({
                email: String(item.email || "").trim().toLowerCase(),
                nome: String(item.nome || item.email || "").trim(),
                funcao: String(item.funcao || "Responsavel").trim()
            }))
            .filter(item => item.email);
    }

    const email = String(ev.responsavelEmail || "").trim().toLowerCase();
    if (!email) return [];

    return [{
        email,
        nome: String(ev.responsavelNome || email).trim(),
        funcao: "Responsavel"
    }];
}
window.normalizarResponsaveisTecnicosEvento = normalizarResponsaveisTecnicosEvento;

function renderChipsResponsaveisEvento(ev = {}) {
    const responsaveis = normalizarResponsaveisTecnicosEvento(ev);

    if (!responsaveis.length) return "";

    return `
        <div class="flex flex-wrap gap-1 mb-2">
            ${responsaveis.map(r => `
                <span class="bg-red-50 border border-red-100 text-[#990000] text-[8px] font-black px-2 py-1 rounded-full uppercase">
                    ${escaparHtml(r.funcao)}: ${escaparHtml(r.nome)}
                </span>
            `).join("")}
        </div>
    `;
}

function getTipoEventoAgenda(ev) {
    return ev?.tipo === "jogo" ? "jogo" : "treino";
}

function atualizarCachePresencaChamadaDVC(evId, email, dados = {}, remover = false) {
    const emailLimpo = normalizarEmailDVC(email);
    if (!evId || !emailLimpo) return;

    window.DVC_CACHE = window.DVC_CACHE || {};
    window.DVC_CACHE.presencasPorEvento = window.DVC_CACHE.presencasPorEvento || {};
    const cache = window.DVC_CACHE.presencasPorEvento[evId];
    if (!cache || !Array.isArray(cache.dados)) return;

    const indice = cache.dados.findIndex(item => normalizarEmailDVC(item.id || item.email) === emailLimpo);

    if (remover) {
        if (indice >= 0) cache.dados.splice(indice, 1);
        cache.atualizadoEm = Date.now();
        return;
    }

    const atualizado = {
        ...(indice >= 0 ? cache.dados[indice] : {}),
        ...dados,
        id: emailLimpo,
        email: emailLimpo
    };

    if (indice >= 0) cache.dados[indice] = atualizado;
    else cache.dados.push(atualizado);
    cache.atualizadoEm = Date.now();
}

function getStatusSorteioChamadaDVC(evId, email) {
    const emailLimpo = normalizarEmailDVC(email);
    const status = window.chamadaStatusTreinoDVC?.[evId]?.get(emailLimpo) || {};

    return {
        saiuMaisCedo: status.saiuMaisCedo === true,
        ativoNoTreino: status.ativoNoTreino !== false
    };
}

function atletaEstaForaSorteioChamadaDVC(evId, email) {
    const status = getStatusSorteioChamadaDVC(evId, email);
    return status.saiuMaisCedo === true || status.ativoNoTreino === false;
}

async function obterEventoAgendaPorIdDVC(evId) {
    const eventoCache = window.eventosAgendaPorIdDVC?.[evId];
    if (eventoCache) return eventoCache;

    const eventoSnap = await getDoc(doc(db, "events", evId));
    return eventoSnap.exists() ? { id: evId, ...eventoSnap.data() } : { id: evId, tipo: "treino" };
}

async function carregarAtletasChamadaTreinoDVC(evento = {}) {
    const filtrarAdulto = eventoEhTreinoAdulto(evento);
    const anoReferenciaAdulto = getAnoReferenciaEvento(evento);
    const snap = await carregarUsuariosCacheMockDVC();
    const atletas = [];

    snap.forEach(docUsuario => {
        const dados = {
            id: docUsuario.id,
            ...docUsuario.data()
        };
        const email = normalizarEmailDVC(dados.email || docUsuario.id);

        if (!email) return;
        if (!usuarioPodeSerEscaladoComoAtleta(dados)) return;
        if (!usuarioTemStatusConvocavel(dados)) return;
        if (!usuarioPodeSerConvocadoPorFinanceiro(dados)) return;
        if (!usuarioPodeSerConvocadoPorFinanceiro(dados)) return;
        // DVC CHAMADA — PARTE 2B: não restringe mais o Adulto na fonte de dados para que os atletas fiquem disponíveis no "Ver Todos".

        atletas.push({
            ...dados,
            id: email,
            email,
            nome: dados.nome || email
        });
    });

    return atletas.sort((a, b) => a.nome.localeCompare(b.nome));
}

function getAgendaFiltroAtual() {
    return window.agendaFiltroAtual === "jogo" ? "jogo" : "treino";
}
window.setAgendaFiltro = (filtro) => {
    window.agendaFiltroAtual = filtro === "jogo" ? "jogo" : "treino";
    window.renderCalendar();
};
window.mostrarHistoricoCompletoAgendaDVC = window.mostrarHistoricoCompletoAgendaDVC || false;
window.toggleHistoricoAgendaDVC = () => {
    window.mostrarHistoricoCompletoAgendaDVC = !window.mostrarHistoricoCompletoAgendaDVC;
    window.renderCalendar();
};
window.fecharFormularioAgenda = () => {
    const form = document.getElementById('agenda-form-evento');
    if (form) form.classList.add('hidden');
    window.editingEventId = null;
};
window.abrirNovoEventoAgenda = async (tipo = "treino") => {
    const tipoEvento = tipo === "jogo" ? "jogo" : "treino";
    const filtroMudou = getAgendaFiltroAtual() !== tipoEvento;
    window.agendaFiltroAtual = tipoEvento;
    window.editingEventId = null;

    if (filtroMudou && typeof window.renderCalendar === "function") {
        await window.renderCalendar();
    }

    const form = document.getElementById('agenda-form-evento');
    if (!form) return;

    form.classList.remove('hidden');
    document.getElementById('form-title').innerText = tipoEvento === "jogo" ? "Novo Jogo / Amistoso" : "Novo Treino";
    document.getElementById('btn-save-ev').innerText = tipoEvento === "jogo" ? "Criar jogo" : "Criar treino";
    document.getElementById('ev-title').value = "";
    document.getElementById('ev-date').value = "";

    const tipoSelect = document.getElementById('ev-tipo');
    if (tipoSelect) tipoSelect.value = tipoEvento;

    if (document.getElementById('ev-adversario')) document.getElementById('ev-adversario').value = "";
    if (document.getElementById('ev-local')) document.getElementById('ev-local').value = "";
    if (document.getElementById('ev-equipe')) document.getElementById('ev-equipe').value = "";
    if (document.getElementById('ev-categoria-treino')) document.getElementById('ev-categoria-treino').value = "";
    document.querySelectorAll('#ev-opcoes input').forEach(input => input.checked = false);

    window.toggleCamposJogo();
    await window.carregarResponsaveisTecnicos([]);
    form.scrollIntoView({ behavior: "smooth", block: "start" });
};
        window.renderCalendar = async () => {
    const c = document.getElementById('main-content');
    const podeGerenciarAgenda = usuarioEhEquipeTecnica();
    const filtroAtual = getAgendaFiltroAtual();
    const projetoLogo = PROJETO_ATUAL_DVC?.logoFundoEscuro || PROJETO_ATUAL_DVC?.logo || "assets/img/loki2.webp";
    const projetoLogoFundoClaro = PROJETO_ATUAL_DVC?.logoFundoClaro || "assets/img/loki1.webp";
    const projetoMarcaDvc = "assets/img/logo.webp";

    let eventos = await carregarEventosCache();
    if (window.__abaAtualDVC !== "calendar") return;
    eventos = [...eventos];

    eventos.sort((a, b) => new Date(a.data || 0) - new Date(b.data || 0));
    window.eventosAgendaPorIdDVC = Object.fromEntries(eventos.map(ev => [ev.id, ev]));

    const ativos = eventos.filter(ev => ev.status !== "concluido");
    const qtdTreinos = ativos.filter(ev => getTipoEventoAgenda(ev) === "treino").length;
    const qtdJogos = ativos.filter(ev => getTipoEventoAgenda(ev) === "jogo").length;
    const tituloLista = filtroAtual === "jogo" ? "Jogos / amistosos agendados" : "Treinos agendados";
    const vazioLista = filtroAtual === "jogo" ? "Nenhum jogo ou amistoso agendado." : "Nenhum treino agendado.";
    const historicoTitulo = filtroAtual === "jogo" ? "Histórico de Jogos" : "Histórico de Treinos";
    const treinoAtivo = filtroAtual === "treino";
    const jogoAtivo = filtroAtual === "jogo";

    c.innerHTML = `
        <div class="relative overflow-hidden rounded-3xl mb-4 shadow-xl bg-gradient-to-br from-gray-950 via-[#3b0b0b] to-[#990000] text-white p-5">
            <div class="absolute inset-0 opacity-20 bg-[linear-gradient(135deg,rgba(255,255,255,0.16)_0,rgba(255,255,255,0.03)_34%,transparent_34%,transparent_100%)]"></div>
            <div class="absolute -right-10 -bottom-12 opacity-10">
                <img src="${projetoLogo}" class="w-52 h-52 object-contain">
            </div>
            <button onclick="forcarAtualizacaoDados('eventos')" class="absolute top-4 right-28 w-10 h-10 rounded-2xl bg-white/10 border border-white/20 text-white shadow-sm flex items-center justify-center" title="Sincronizar">
                <i class="fa-solid fa-rotate text-xs"></i>
            </button>
            <div class="absolute top-4 right-4 w-20 h-12 rounded-2xl bg-white/90 border border-white/30 shadow-sm flex items-center justify-center px-2">
                <img src="${projetoMarcaDvc}" class="max-w-full max-h-full object-contain" alt="DVC">
            </div>

            <div class="relative z-10 pr-24">
                <p class="text-[8px] font-black uppercase text-white/65">Agenda oficial</p>
                <h3 class="text-2xl font-black uppercase leading-none mt-1 tracking-wide">Treinos e jogos</h3>
                <p class="text-[10px] font-bold text-white/75 mt-2 uppercase">${tituloLista}</p>
            </div>

            <div class="relative z-10 grid grid-cols-2 gap-2 mt-5">
                <div class="rounded-2xl bg-white/10 border border-white/10 p-3">
                    <p class="text-[8px] font-black uppercase text-white/55">Treinos ativos</p>
                    <p class="text-2xl font-black leading-none mt-1">${qtdTreinos}</p>
                </div>
                <div class="rounded-2xl bg-white/10 border border-white/10 p-3">
                    <p class="text-[8px] font-black uppercase text-white/55">Jogos ativos</p>
                    <p class="text-2xl font-black leading-none mt-1">${qtdJogos}</p>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-2 gap-3 mb-4">
            <div onclick="setAgendaFiltro('treino')" class="relative cursor-pointer overflow-hidden p-4 rounded-2xl border shadow-sm transition ${treinoAtivo ? 'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 text-white border-gray-900 shadow-lg' : 'bg-white text-gray-800 border-gray-200'}">
                <div class="absolute inset-x-0 top-0 h-1 ${treinoAtivo ? 'bg-gradient-to-r from-orange-400 to-white/70' : 'bg-gradient-to-r from-orange-500 to-[#990000]'}"></div>
                ${podeGerenciarAgenda ? `
                    <button onclick="event.stopPropagation(); abrirNovoEventoAgenda('treino')" class="absolute top-3 right-3 w-8 h-8 rounded-full ${treinoAtivo ? 'bg-white text-gray-900' : 'bg-gray-900 text-white'} flex items-center justify-center text-[10px] shadow-sm">
                        <i class="fa-solid fa-plus"></i>
                    </button>
                ` : ''}
                <div class="w-11 h-11 rounded-2xl ${treinoAtivo ? 'bg-white/15 border-white/20' : 'bg-orange-50 border-orange-100'} border flex items-center justify-center mb-3">
                    <div class="relative w-7 h-7">
                        <span class="absolute left-1/2 top-1 -translate-x-1/2 w-0 h-0 border-l-[8px] border-r-[8px] border-b-[22px] border-l-transparent border-r-transparent border-b-orange-500"></span>
                        <span class="absolute left-1/2 top-3 -translate-x-1/2 w-3 h-[2px] bg-white"></span>
                        <span class="absolute left-0 bottom-0 w-7 h-1.5 bg-orange-700 rounded"></span>
                    </div>
                </div>
                <p class="text-[9px] font-black uppercase opacity-75">Treinos</p>
                <p class="text-3xl font-black leading-none mt-1">${qtdTreinos}</p>
            </div>

            <div onclick="setAgendaFiltro('jogo')" class="relative cursor-pointer overflow-hidden p-4 rounded-2xl border shadow-sm transition ${jogoAtivo ? 'bg-gradient-to-br from-[#990000] via-[#760707] to-gray-950 text-white border-[#990000] shadow-lg' : 'bg-white text-gray-800 border-red-100'}">
                <div class="absolute inset-x-0 top-0 h-1 ${jogoAtivo ? 'bg-gradient-to-r from-white/90 to-red-200' : 'bg-gradient-to-r from-[#990000] to-gray-900'}"></div>
                ${podeGerenciarAgenda ? `
                    <button onclick="event.stopPropagation(); abrirNovoEventoAgenda('jogo')" class="absolute top-3 right-3 w-8 h-8 rounded-full ${jogoAtivo ? 'bg-white text-[#990000]' : 'bg-[#990000] text-white'} flex items-center justify-center text-[10px] shadow-sm">
                        <i class="fa-solid fa-plus"></i>
                    </button>
                ` : ''}
                <div class="w-11 h-11 rounded-2xl ${jogoAtivo ? 'bg-white/15 border-white/20' : 'bg-red-50 border-red-100'} border flex items-center justify-center mb-3 p-1">
                    <img src="${jogoAtivo ? projetoLogo : projetoLogoFundoClaro}" class="w-full h-full object-contain">
                </div>
                <p class="text-[9px] font-black uppercase opacity-75">Jogos</p>
                <p class="text-3xl font-black leading-none mt-1">${qtdJogos}</p>
            </div>
        </div>
    `;

    if(podeGerenciarAgenda) {
        c.innerHTML += `
        <div id="agenda-form-evento" class="hidden bg-white rounded-3xl mb-5 border border-red-100 shadow-xl overflow-hidden">
            <div class="bg-gradient-to-r from-gray-950 via-[#4b0d0d] to-[#990000] text-white p-4 flex items-center justify-between gap-3">
                <div>
                    <p class="text-[8px] font-black text-white/60 uppercase">Cadastrar agenda</p>
                    <p id="form-title" class="text-sm font-black uppercase leading-tight">Novo Evento</p>
                </div>
                <button onclick="fecharFormularioAgenda()" class="w-9 h-9 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center">
                    <i class="fa-solid fa-xmark text-xs"></i>
                </button>
            </div>

            <div class="p-4">
                <input id="ev-title" placeholder="Título" class="w-full p-3 mb-2 rounded-xl border border-gray-200 text-sm bg-gray-50 outline-none font-semibold">
                
                <select id="ev-tipo" onchange="toggleCamposJogo()" class="w-full p-3 mb-2 rounded-xl border border-gray-200 text-sm font-bold bg-gray-50 outline-none">
                    <option value="treino">Treino</option>
                    <option value="jogo">Jogo / Amistoso</option>
                </select>

                <select id="ev-responsavel" class="w-full p-3 mb-2 rounded-xl border border-gray-200 text-sm font-bold bg-gray-50 outline-none">
                    <option value="">Carregando responsáveis...</option>
                </select>

                <div id="ev-responsaveis" class="mb-2"></div>

                <div id="campos-treino" class="bg-gray-50 border border-gray-100 rounded-2xl p-3 mb-3">
                    <select id="ev-categoria-treino" class="w-full p-3 rounded-xl border border-gray-200 text-sm font-bold bg-white outline-none">
                        <option value="">Categoria do treino</option>
                        <option value="Adulto">Adulto</option>
                        <option value="Sub-17">Sub-17</option>
                    </select>
                </div>

                <div id="campos-jogo" class="hidden bg-red-50 border border-red-100 rounded-2xl p-3 mb-3">
                    <input id="ev-adversario" placeholder="Adversário. Ex: DVC x Time X" class="w-full p-3 mb-2 rounded-xl border border-red-100 text-sm bg-white outline-none font-semibold">
                    <input id="ev-local" placeholder="Local do jogo" class="w-full p-3 mb-2 rounded-xl border border-red-100 text-sm bg-white outline-none font-semibold">

                    <select id="ev-equipe" class="w-full p-3 rounded-xl border border-red-100 text-sm font-bold bg-white outline-none">
                        <option value="">Equipe / Categoria</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Feminino">Feminino</option>
                        <option value="Misto">Misto</option>
                        <option value="Sub-17">Sub-17</option>
                        <option value="Adulto">Adulto</option>
                    </select>
                </div>

                <div id="ev-opcoes" class="grid grid-cols-1 gap-2 mb-3 text-[10px] font-bold text-gray-600 bg-gray-50 border border-gray-100 rounded-2xl p-3">
                    <label><input type="checkbox" value="Toque e Levantamento" class="mr-2"> Toque e Levantamento</label>
                    <label><input type="checkbox" value="Manchete" class="mr-2"> Manchete</label>
                    <label><input type="checkbox" value="Movimentação e Rotação" class="mr-2"> Movimentação e Rotação</label>
                    <label><input type="checkbox" value="Bloqueio e Ataque" class="mr-2"> Bloqueio e Ataque</label>
                </div>
                
                <input id="ev-date" type="datetime-local" class="w-full p-3 mb-3 rounded-xl border border-gray-200 text-sm bg-gray-50 outline-none font-semibold">
                
                <div class="grid grid-cols-2 gap-2">
                    <button onclick="fecharFormularioAgenda()" class="bg-white border border-gray-200 text-gray-500 w-full py-3 rounded-xl font-black text-[10px] uppercase">
                        Cancelar
                    </button>
                    <button id="btn-save-ev" onclick="addEvent()" class="bg-[#990000] text-white w-full py-3 rounded-xl font-black text-[10px] uppercase shadow-sm">
                        Criar
                    </button>
                </div>
            </div>
        </div>`;
    }

    let htmlAtivos = "";
    let cardsConcluidosAgenda = [];

    eventos
        .filter(ev => getTipoEventoAgenda(ev) === filtroAtual)
        .forEach(ev => {
        const isJogo = getTipoEventoAgenda(ev) === "jogo";
        const isConcluido = isJogo ? String(ev.status).trim().toLowerCase() === "concluido" : window.treinoEstaFinalizadoDVC(ev);

        const cardTemaAgenda = isJogo
            ? 'bg-gradient-to-br from-white via-red-50/70 to-white border-red-100 shadow-[0_14px_35px_rgba(153,0,0,0.12)]'
            : 'bg-white border-gray-200 shadow-sm';
        let cardHtml = `<div class="p-4 ${cardTemaAgenda} border rounded-2xl mb-3 relative overflow-hidden fade-in ${isConcluido ? 'opacity-70' : ''}">`;

        cardHtml += `<div class="absolute inset-x-0 top-0 h-1 ${isJogo ? 'bg-gradient-to-r from-[#990000] via-red-500 to-gray-950' : 'bg-gradient-to-r from-gray-900 via-gray-400 to-[#990000]'}"></div>`;

        if (isJogo) {
            cardHtml += `
                <div class="absolute top-3 right-3 z-10 w-16 h-11 rounded-2xl bg-white/95 border border-red-100 shadow-sm flex items-center justify-center px-2">
                    <img src="${projetoMarcaDvc}" alt="DVC" class="max-w-full max-h-full object-contain">
                </div>
            `;
        }

        if(usuarioPodeAprovarAvaliacoes()) {
            cardHtml += `<div class="absolute top-3 ${isJogo ? 'right-24' : 'right-3'} flex gap-2 z-20">`;
            if (!isConcluido) {
                cardHtml += `<button onclick="prepararEdicao(
    '${safeEditParam(ev.id)}', 
    '${safeEditParam(ev.titulo)}', 
    '${safeEditParam(ev.descricao || '')}', 
    '${safeEditParam(ev.data)}',
    '${safeEditParam(ev.tipo || 'treino')}',
    '${safeEditParam(ev.adversario || '')}',
    '${safeEditParam(ev.local || '')}',
    '${safeEditParam(ev.equipe || '')}',
    '${safeEditParam(ev.responsavelEmail || '')}',
    '${safeEditParam(ev.responsavelNome || '')}'
)" class="text-blue-400"><i class="fa-solid fa-pen text-xs"></i></button>`;
            }
            cardHtml += `<button onclick="apagarEvento('${ev.id}')" class="text-red-200"><i class="fa-solid fa-trash-alt text-xs"></i></button></div>`;
        }

        cardHtml += `
    <div class="flex justify-between items-start gap-2 mb-2 ${isJogo ? 'pr-20' : ''}">
        <div class="min-w-0">
            <p class="font-black text-base uppercase leading-tight ${isJogo ? 'text-[#990000]' : 'text-gray-900'}">
                ${ev.titulo || 'Sem Título'}
            </p>
            ${isJogo ? `
                <span class="inline-block mt-1 mb-1 bg-[#990000] text-white text-[8px] font-black px-2 py-1 rounded-full uppercase">
                    Jogo / Amistoso
                </span>
            ` : `
                <span class="inline-block mt-1 mb-1 bg-gray-100 text-gray-500 text-[8px] font-black px-2 py-1 rounded-full uppercase">
                    Treino
                </span>
                ${ev.equipe ? `
                    <span class="inline-block mt-1 mb-1 ml-1 bg-blue-50 text-blue-700 text-[8px] font-black px-2 py-1 rounded-full uppercase">
                        ${ev.equipe}
                    </span>
                ` : ''}
            `}
        </div>
    </div>

    ${renderChipsResponsaveisEvento(ev)}

    <p class="text-[10px] text-gray-500 my-1">
        ${ev.descricao || 'Sem descrição.'}
    </p>

    ${isJogo ? `
        <div class="relative overflow-hidden bg-gradient-to-br from-[#990000] via-[#780808] to-gray-950 border border-red-900/20 rounded-2xl p-3 mb-3 text-white shadow-sm">
            <div class="absolute -right-7 -bottom-8 opacity-10">
                <img src="${projetoLogo}" class="w-24 h-24 object-contain">
            </div>
            <div class="relative z-10 space-y-1">
                <p class="text-[9px] font-black uppercase text-white">
                    <i class="fa-solid fa-volleyball mr-1"></i> ${ev.adversario || 'Adversário não informado'}
                </p>

                <p class="text-[9px] text-white/80 font-semibold">
                    <i class="fa-solid fa-location-dot mr-1"></i> ${ev.local || 'Local não informado'}
                </p>

                ${ev.equipe ? `
                    <p class="text-[9px] text-white/80 font-semibold">
                        <i class="fa-solid fa-people-group mr-1"></i> ${ev.equipe}
                    </p>
                ` : ''}
            </div>
        </div>
    ` : ''}
    <p class="text-[9px] text-gray-400 mb-2 font-semibold">
        <i class="fa-regular fa-clock mr-1"></i> ${new Date(ev.data).toLocaleString('pt-BR')}
    </p>

    <div class="${isJogo ? 'bg-white border-red-100 text-red-900' : 'bg-gray-50 border-gray-100 text-gray-600'} p-3 rounded-2xl text-[10px] mb-3 border">
        <span class="font-black uppercase text-[8px] block mb-1 ${isJogo ? 'text-[#990000]' : 'text-gray-400'}">
            ${isJogo ? 'Convocados para o jogo:' : 'Chamada do treino:'}
        </span>
        <span id="text-conv-${ev.id}">${isJogo ? (ev.convocadosTexto || 'Ninguém ainda.') : 'Registre presenças pelo botão Chamada.'}</span>
    </div>`;

        if(usuarioEhEquipeTecnica()) {
             cardHtml += isJogo ? `
             <div class="grid grid-cols-3 gap-2">
                <button onclick="renderConvocacao('${ev.id}')" class="bg-[#990000] text-white py-2.5 rounded-xl text-[9px] font-black uppercase shadow-sm">Convocar</button>
                <button onclick="renderChamada('${ev.id}')" class="bg-green-600 text-white py-2.5 rounded-xl text-[9px] font-black uppercase shadow-sm">Chamada</button>
                <button onclick="abrirEscaladorTaticoDVC('${ev.id}')" class="bg-indigo-600 text-white py-2.5 rounded-xl text-[9px] font-black uppercase shadow-sm flex items-center justify-center gap-1">
                    <img src="assets/img/icon/alvo.webp" alt="Escalador" class="inline-block object-contain w-3.5 h-3.5 opacity-100">
                    Escalador
                </button>
             </div>` : `
             <div class="grid grid-cols-3 gap-2">
                <button onclick="renderChamada('${ev.id}')" class="bg-green-600 text-white py-2.5 rounded-xl text-[9px] font-black uppercase shadow-sm">Chamada</button>
                <button onclick="abrirModalConfigSorteioTreino('${ev.id}')" class="bg-[#990000] text-white py-2.5 rounded-xl text-[9px] font-black uppercase shadow-sm"><i class="fa-solid fa-shuffle mr-1"></i> Sortear Times</button>
                <button onclick="concluirTreino('${ev.id}')" class="bg-gray-800 text-white px-3 py-2.5 rounded-xl text-[9px] font-black uppercase shadow-sm"><i class="fa-solid fa-check mr-1"></i> Concluir</button>
             </div>`;
        }

        cardHtml += `<div id="gestao-${ev.id}" class="hidden mt-4 border-t pt-3"></div></div>`;

        if (isConcluido) cardsConcluidosAgenda.push(cardHtml);
        else htmlAtivos += cardHtml;
    });

    c.innerHTML += `
        <div class="flex items-center justify-between mb-3 mt-2">
            <div>
                <p class="text-[8px] font-black text-gray-400 uppercase">Agenda selecionada</p>
                <p class="text-xs font-black text-gray-900 uppercase">${tituloLista}</p>
            </div>
            <span class="${filtroAtual === 'jogo' ? 'bg-red-50 text-[#990000] border-red-100' : 'bg-gray-50 text-gray-700 border-gray-100'} border text-[8px] font-black px-3 py-1.5 rounded-full uppercase">
                ${filtroAtual === 'jogo' ? '<i class="fa-solid fa-volleyball mr-1"></i> Jogos' : '<i class="fa-solid fa-person-running mr-1"></i> Treinos'}
            </span>
        </div>
    `;

    c.innerHTML += htmlAtivos || `
        <div class="bg-gradient-to-br from-gray-50 to-white border border-dashed border-gray-200 rounded-2xl p-5 text-center mb-4">
            <div class="w-10 h-10 mx-auto mb-3 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-[#990000]">
                <i class="fa-regular fa-calendar"></i>
            </div>
            <p class="text-[10px] text-gray-400 font-black uppercase">${vazioLista}</p>
        </div>
    `;

    if (cardsConcluidosAgenda.length > 0) {
        const limitarHistoricoTreinos = filtroAtual === "treino" && !window.mostrarHistoricoCompletoAgendaDVC;
        const cardsConcluidosVisiveis = limitarHistoricoTreinos
            ? cardsConcluidosAgenda.slice(0, 3)
            : cardsConcluidosAgenda;

        c.innerHTML += `
            <div class="my-6 rounded-2xl bg-gradient-to-r from-gray-950 via-[#4b0d0d] to-[#990000] text-white p-4 shadow-sm flex items-center justify-between gap-3">
                <div>
                    <p class="text-[8px] font-black uppercase text-white/55">Arquivo da agenda</p>
                    <h4 class="font-black uppercase text-sm mt-1"><i class="fa-solid fa-history mr-2"></i>${historicoTitulo}</h4>
                    ${filtroAtual === "treino" ? `<p class="text-[8px] font-bold uppercase text-white/55 mt-1">${window.mostrarHistoricoCompletoAgendaDVC ? 'Histórico completo' : 'ÚÚltimos 3 registros'}</p>` : ''}
                </div>
                ${filtroAtual === "treino" && cardsConcluidosAgenda.length > 3 ? `
                    <button onclick="toggleHistoricoAgendaDVC()" class="bg-white/10 border border-white/20 text-white px-3 py-2 rounded-full text-[8px] font-black uppercase whitespace-nowrap">
                        ${window.mostrarHistoricoCompletoAgendaDVC ? 'Ocultar histórico' : 'Ver histórico completo'}
                    </button>
                ` : ''}
            </div>
            ${cardsConcluidosVisiveis.join("")}
        `;
    }
};
window.carregarResponsaveisTecnicos = async (selecionados = []) => {
    const selectLegado = document.getElementById('ev-responsavel');
    const container = document.getElementById('ev-responsaveis') || selectLegado;
    if (!container) return;
    if (selectLegado && container !== selectLegado) selectLegado.classList.add("hidden");

    let responsaveis = [];
    adicionarResponsavelTecnico(responsaveis, window.currentUserData, auth.currentUser?.email || "");

    try {
        const snap = await carregarUsuariosCacheMockDVC();

        snap.forEach(docUsuario => {
            adicionarResponsavelTecnico(responsaveis, docUsuario.data(), docUsuario.id);
        });

        renderizarResponsaveisTecnicos(container, responsaveis, selecionados);
    } catch (e) {
        console.error("Erro ao carregar responsáveis técnicos:", e);
        renderizarResponsaveisTecnicos(container, responsaveis, selecionados);
    }
};

function getAnoReferenciaEvento(evento) {
    const dataEvento = new Date(evento?.data || "");
    return Number.isNaN(dataEvento.getTime())
        ? new Date().getFullYear()
        : dataEvento.getFullYear();
}

// DVC CHAMADA — PARTE 2B: Normalização rigorosa do público.
function normalizarPublicoEventoChamadaDVC(valor = "") {
    return String(valor)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase()
        .replace(/[\s_-]+/g, "");
}

// DVC CHAMADA — PARTE 2B: Retorna os atletas que fazem parte do público e os preservados.
function obterPublicoEsperadoChamadaDVC(evento, atletasElegiveis, participantesPreservados) {
    const anoReferencia = getAnoReferenciaEvento(evento);
    
    // Prioridade dos campos reais.
    const publicoBruto = evento.equipe || evento.categoriaTreino || evento.categoria || evento.genero || "";
    const publico = normalizarPublicoEventoChamadaDVC(publicoBruto);
    
    const getId = window.getIdSeguroChamadaDVC || ((a) => String(a.id || a.email).toLowerCase());
    const preservadosSet = new Set(participantesPreservados.map(getId));

    return atletasElegiveis.filter(atleta => {
        // DVC CHAMADA — PARTE 2B: preserva participantes já registrados ou convocados.
        if (preservadosSet.has(getId(atleta))) return true;

        const nascimento = String(atleta?.nascimento || "").trim();
        const temNascimento = nascimento.length >= 4 && Number.isFinite(Number(nascimento.split("-")[0]));
        const ehAdulto = atletaCompleta18NoAno(atleta, anoReferencia);
        const sexo = normalizarPublicoEventoChamadaDVC(atleta.sexo || atleta.genero || "");

        if (publico.includes("sub17")) return temNascimento && !ehAdulto;
        if (publico.includes("adulto")) return temNascimento && ehAdulto;
        if (publico.includes("masculino") || publico === "m" || publico === "masc") return sexo === "m" || sexo === "masculino";
        if (publico.includes("feminino") || publico === "f" || publico === "fem") return sexo === "f" || sexo === "feminino";
        
        // Em Misto ou sem configuração, retorna todos.
        return true; 
    });
}
function eventoEhTreinoAdulto(evento) {
    const tipo = normalizarFuncaoTecnica(evento?.tipo);
    const categoria = normalizarFuncaoTecnica(evento?.equipe);
    return tipo === "treino" && categoria === "adulto";
}
function atletaCompleta18NoAno(atleta, anoReferencia) {
    const nascimento = String(atleta?.nascimento || "").trim();
    const anoNascimento = Number(nascimento.split("-")[0]);

    if (!Number.isFinite(anoNascimento)) return false;

    return anoNascimento <= (anoReferencia - 18);
}

        window.renderConvocacao = async (evId) => {
            if (!usuarioEhEquipeTecnica()) {
                return alert("Apenas ADM, Treinador ou Auxiliar podem convocar atletas.");
            }

            const div = document.getElementById(`gestao-${evId}`); 
            div.classList.toggle('hidden'); 
            if(div.classList.contains('hidden')) return;
            
            const eventoSnap = await getDoc(doc(db, "events", evId));
            const eventoAtual = eventoSnap.exists() ? eventoSnap.data() : {};
            const filtrarAdulto = eventoEhTreinoAdulto(eventoAtual);
            const anoReferenciaAdulto = getAnoReferenciaEvento(eventoAtual);

            div.innerHTML = `<div id="conv-list-${evId}"></div>`;
            const snap = await carregarUsuariosCacheMockDVC();
            
            // 1. Criamos o array, jogamos os dados nele e ordenamos
            let uArr = [];
            snap.forEach(u => uArr.push(u.data()));
            uArr.sort((a,b) => a.nome.localeCompare(b.nome));
            
            // 2. Usamos o uArr.forEach (a lista ordenada) em vez do snap.forEach
            uArr.forEach(async (at) => {
                const podeSerEscalado = usuarioPodeSerConvocadoPorFinanceiro(at);

if(!usuarioPodeSerEscaladoComoAtleta(at) || !usuarioTemStatusConvocavel(at) || !podeSerEscalado) return;
                if (filtrarAdulto && !atletaCompleta18NoAno(at, anoReferenciaAdulto)) return;
                
                const convRef = doc(db, "events", evId, "convocados", at.email);
                const isConv = (await getDoc(convRef)).exists();
                
                const financeiroEfetivo = obterStatusFinanceiroEfetivo(at);
                const isJustificado = financeiroEfetivo === 'Justificado';
                const isCarencia = financeiroEfetivo === window.STATUS_FINANCEIRO_CARENCIA;

const item = document.createElement('div'); 
item.className = `flex justify-between items-start p-2 border-b rounded-lg mb-1 ${
    isJustificado 
        ? 'bg-yellow-50 border-yellow-300' 
        : isCarencia
            ? 'bg-amber-50 border-amber-300'
        : 'bg-white border-gray-100'
}`;

item.innerHTML = `
    <div class="flex items-start justify-between gap-3 min-w-0 flex-1">
        <div class="min-w-0">
        <span class="block text-xs font-semibold ${isJustificado || isCarencia ? 'text-yellow-800' : 'text-gray-800'} truncate">
            ${at.nome}
        </span>

        ${renderBadgesAtletaDVC(at, { financeiro: financeiroEfetivo })}
        </div>
    </div>

    <input type="checkbox" class="ml-2 shrink-0" ${isConv ? 'checked' : ''}>
`;
                item.querySelector('input').onchange = async (e) => { 
    const emailAtleta = (at.email || "").trim().toLowerCase();

    if (!emailAtleta) {
        alert("Este atleta está sem e-mail cadastrado. Não foi possível convocar.");
        return;
    }

    if (e.target.checked) {
        await setDoc(convRef, { 
            nome: at.nome,
            email: emailAtleta,
            nascimento: at.nascimento || at.dataNascimento || at.data_nascimento || "",
            funcao: at.funcao || "",
            funcaoVolei: at.funcaoVolei || at.posicaoVolei || at.posicao || "",
            sexo: at.sexo || at.genero || at.gender || "",
            financeiro: financeiroEfetivo,
            status: usuarioTemStatusConvocavel(at) ? "Ativo" : (at.status || "")
        }); 
    } else {
        await deleteDoc(convRef); 
    }

    limparCacheConvocadosEventoDVC(evId);
    const convocadosCache = await carregarConvocadosEventoDVC(evId);

    const convocados = convocadosCache.map(data => ({
        id: data.id,
        nome: data.nome || "",
        email: data.email || data.id
    }));

    const txt = convocados
        .map(c => c.nome.split(' ')[0])
        .join(', ') || "Ninguém.";

    const emails = convocados
    .map(c => (c.email || c.id || "").trim().toLowerCase())
    .filter(email => email);

    await updateDoc(doc(db, "events", evId), { 
        convocadosTexto: txt,
        convocadosEmails: emails
    });

    document.getElementById(`text-conv-${evId}`).innerText = txt;
};
                div.appendChild(item);
            });
        };

window.chamadaTempDVC = window.chamadaTempDVC || {};
window.chamadaSalvaDVC = window.chamadaSalvaDVC || {};
window.chamadaConvocadosDVC = window.chamadaConvocadosDVC || {};
window.chamadaStatusTreinoDVC = window.chamadaStatusTreinoDVC || {};



        function getIdSeguroChamadaDVC(email = "") {
            return normalizarEmailDVC(email).replace(/[^a-zA-Z0-9_-]/g, "_");
        }

        function chamadaTemAlteracoesPendentes(evId) {
            const estado = window.DVC_CHAMADA_ESTADO?.[evId];
            if (estado && typeof estado.alterada === "boolean") {
                return estado.alterada;
            }

            const temp = window.chamadaTempDVC?.[evId];
            const salva = window.chamadaSalvaDVC?.[evId];
            if (!temp || !salva) return false;
            if (temp.size !== salva.size) return true;
            for (const email of temp) {
                if (!salva.has(email)) return true;
            }
            const statusTemp = window.chamadaStatusTreinoDVC?.[evId];
            const statusSalvo = window.chamadaStatusTreinoSalvoDVC?.[evId];
            if (statusTemp && statusSalvo) {
                for (const email of temp) {
                    const sT = statusTemp.get(email) || {ativoNoTreino: true, saiuMaisCedo: false};
                    const sS = statusSalvo.get(email) || {ativoNoTreino: true, saiuMaisCedo: false};
                    if (sT.ativoNoTreino !== sS.ativoNoTreino || sT.saiuMaisCedo !== sS.saiuMaisCedo) return true;
                }
            }
            return false;
        }
        window.chamadaTemAlteracoesPendentes = chamadaTemAlteracoesPendentes;

        window.marcarChamadaComoAlteradaDVC = function (evId) {
            const estado = window.DVC_CHAMADA_ESTADO[evId] || (window.DVC_CHAMADA_ESTADO[evId] = {});
            estado.alterada = true;
            estado.salvando = false;
            window.atualizarBotaoSalvarChamadaDVC(evId);
        };

// DVC CHAMADA — PARTE 1: pesquisa participantes somente nos dados já carregados.
function normalizarBuscaChamadaDVC(valor = "") {
    return String(valor)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
}

window.DVC_CHAMADA_ESTADO = window.DVC_CHAMADA_ESTADO || {};

window.atualizarBuscaChamada = (evId, valor) => {
    window.DVC_CHAMADA_ESTADO[evId].busca = normalizarBuscaChamadaDVC(valor);
    window.atualizarVisualChamadaTemp(evId);
};

window.atualizarFiltroChamada = (evId, filtro) => {
    window.DVC_CHAMADA_ESTADO[evId].filtro = filtro;
    window.atualizarVisualChamadaTemp(evId);
};

window.mudarAbaChamada = (evId, abaId) => {
    window.DVC_CHAMADA_ESTADO[evId].abaAtiva = abaId;
    window.atualizarVisualChamadaTemp(evId);
};

// DVC CHAMADA — PARTE 1: separa pendentes, presentes e equipe sem novas leituras.
        window.alternarModoPublicoDVC = (evId) => {
            const estado = window.DVC_CHAMADA_ESTADO[evId];
            if (estado) {
                estado.mostrarTodosElegiveis = !estado.mostrarTodosElegiveis;
                window.atualizarVisualChamadaTemp(evId);
            }
        };

        window.acionarSalvamentoChamadaDVC = async function (evId) {
            const estado = window.DVC_CHAMADA_ESTADO[evId] || (window.DVC_CHAMADA_ESTADO[evId] = {});

            if (!estado.alterada || estado.salvando) {
                return;
            }

            estado.salvando = true;
            window.atualizarBotaoSalvarChamadaDVC(evId);

            try {
                const resultado = await window.salvarChamadaEvento(evId);
                const sucesso = resultado === true || resultado?.sucesso === true;

                if (!sucesso) {
                    throw resultado?.erro || new Error("A chamada nǜo foi salva.");
                }

                estado.alterada = false;
                alert("Chamada salva com sucesso!");
            } catch (erro) {
                estado.alterada = true;
                console.error("[DVC Chamada] Falha ao salvar:", erro);
                alert("Nǜo foi possvel salvar a chamada.");
            } finally {
                estado.salvando = false;
                window.atualizarBotaoSalvarChamadaDVC(evId);
            }
        };

        window.atualizarBotaoSalvarChamadaDVC = (evId) => {
            const btnSalvar = document.getElementById(`btn-salvar-chamada-${evId}`);
            if (!btnSalvar) return;
            
            const estado = window.DVC_CHAMADA_ESTADO[evId] || {};

            if (estado.salvando) {
                btnSalvar.disabled = true;
                btnSalvar.textContent = "SALVANDO...";
                btnSalvar.className = "min-h-[48px] w-full rounded-xl bg-slate-600 px-4 py-3 text-[11px] font-black uppercase text-white shadow-md cursor-wait opacity-80 transition-colors";
            } else if (estado.alterada) {
                btnSalvar.disabled = false;
                btnSalvar.textContent = "SALVAR CHAMADA";
                btnSalvar.className = "min-h-[48px] w-full rounded-xl bg-green-600 px-4 py-3 text-[11px] font-black uppercase text-white shadow-md cursor-pointer active:scale-[0.98] transition-colors";
            } else {
                btnSalvar.disabled = true;
                btnSalvar.textContent = "CHAMADA SALVA";
                btnSalvar.className = "min-h-[48px] w-full rounded-xl bg-slate-200 text-slate-500 border border-slate-300 px-4 py-3 text-[11px] font-black uppercase shadow-none cursor-not-allowed transition-colors";
            }

            btnSalvar.setAttribute("aria-disabled", btnSalvar.disabled ? "true" : "false");
        };

        window.atualizarVisualChamadaTemp = (evId) => {
            const selecionados = window.chamadaTempDVC?.[evId] || new Set();
            const todosConvocados = window.chamadaConvocadosDVC?.[evId] || [];
            const estado = window.DVC_CHAMADA_ESTADO[evId] || { abaAtiva: "pendentes", busca: "", filtro: "TODOS", mostrarTodosElegiveis: false };
            
            // DVC CHAMADA — PARTE 2B: aplicar o público esperado.
            const eventoObj = window.eventosAgendaPorIdDVC?.[evId] || { tipo: "treino" };
            const mostrarTodos = estado.mostrarTodosElegiveis === true;
            
            let convocados = todosConvocados;
            let preservadosParaFiltro = [];
            
            if (window.chamadaTempDVC && window.chamadaSalvaDVC) {
                const salvosSet = window.chamadaSalvaDVC[evId] || new Set();
                const getId = window.getIdSeguroChamadaDVC || ((a) => String(a.id || a.email).toLowerCase());
                
                // Pega os convocados explícitos já em cache sem fazer nova leitura
                const cacheConvocados = window.DVC_CACHE?.convocadosPorEvento?.[evId]?.dados || [];
                const setConvocados = new Set(cacheConvocados.map(getId));

                preservadosParaFiltro = todosConvocados.filter(a => {
                    const idA = getId(a);
                    return selecionados.has(idA) || salvosSet.has(idA) || setConvocados.has(idA);
                });
            }

            const equipeStaff = todosConvocados.filter(a => {
                const funcNorm = typeof normalizarFuncaoTecnica === 'function' ? normalizarFuncaoTecnica(a.funcao) : String(a.funcao || "").toLowerCase();
                return (funcNorm === 'treinador' || funcNorm === 'auxiliar' || funcNorm === 'adm' || funcNorm === 'responsavel');
            });

            const publicoAtletas = obterPublicoEsperadoChamadaDVC(eventoObj, todosConvocados.filter(a => {
                const funcNorm = typeof normalizarFuncaoTecnica === 'function' ? normalizarFuncaoTecnica(a.funcao) : String(a.funcao || "").toLowerCase();
                return !(funcNorm === 'treinador' || funcNorm === 'auxiliar' || funcNorm === 'adm' || funcNorm === 'responsavel');
            }), preservadosParaFiltro);

            if (!mostrarTodos) {
                convocados = [...equipeStaff, ...publicoAtletas];
            }
            
            // Renderiza o cabeçalho dinâmico
            const cabecalhoEl = document.getElementById(`cabecalho-publico-${evId}`);
            if (cabecalhoEl) {
                const publicoBruto = eventoObj.equipe || eventoObj.categoriaTreino || eventoObj.categoria || eventoObj.genero || "";
                const nomePublico = publicoBruto.toUpperCase() || "NÃO CONFIGURADO";
                
                const qtsFora = publicoAtletas.length - obterPublicoEsperadoChamadaDVC(eventoObj, todosConvocados.filter(a => {
                    const funcNorm = typeof normalizarFuncaoTecnica === 'function' ? normalizarFuncaoTecnica(a.funcao) : String(a.funcao || "").toLowerCase();
                    return !(funcNorm === 'treinador' || funcNorm === 'auxiliar' || funcNorm === 'adm' || funcNorm === 'responsavel');
                }), []).length;

                let headerHtml = `
                    <div class="flex items-start justify-between">
                        <div>
                            <h3 class="text-[10px] font-black uppercase text-[#990000] mb-0.5">Público do Treino</h3>
                            <p class="text-sm font-black uppercase text-gray-900">${nomePublico}</p>
                            ${!mostrarTodos ? `
                            <p class="text-[10px] font-bold text-gray-500 uppercase mt-1">
                                ${publicoAtletas.length - qtsFora} atletas esperados
                                ${qtsFora > 0 ? `<br><span class="text-amber-600">${qtsFora} inclusões preservadas</span>` : ''}
                            </p>
                            ` : `
                            <p class="text-[10px] font-bold text-gray-500 uppercase mt-1">
                                Atletas elegíveis: ${todosConvocados.length - equipeStaff.length}
                            </p>
                            `}
                        </div>
                        <button onclick="window.alternarModoPublicoDVC('${evId}')" class="px-3 py-1.5 rounded-lg bg-white border border-gray-200 shadow-sm text-[8px] font-black uppercase text-gray-600 hover:bg-gray-50 transition-colors text-right max-w-[120px] leading-tight">
                            ${mostrarTodos ? 'MOSTRAR APENAS O PÚBLICO DO TREINO' : 'VER TODOS OS ATLETAS ELEGÍVEIS'}
                        </button>
                    </div>
                `;
                
                if (!publicoBruto && !mostrarTodos) {
                    headerHtml += `
                        <div class="mt-2 bg-amber-50 border border-amber-100 rounded-lg p-2 flex gap-2 items-start">
                            <i class="fa-solid fa-circle-exclamation text-amber-500 mt-0.5 text-xs"></i>
                            <p class="text-[9px] font-bold uppercase text-amber-800 leading-tight">
                                Público do treino não configurado.<br>Todos os atletas elegíveis estão sendo exibidos.
                            </p>
                        </div>
                    `;
                }
                
                if (!mostrarTodos) {
                    let foraCount = 0;
                    const pubNorm = normalizarPublicoEventoChamadaDVC(publicoBruto);
                    todosConvocados.forEach(a => {
                        const funcNorm = typeof normalizarFuncaoTecnica === 'function' ? normalizarFuncaoTecnica(a.funcao) : String(a.funcao || "").toLowerCase();
                        if (funcNorm === 'treinador' || funcNorm === 'auxiliar' || funcNorm === 'adm' || funcNorm === 'responsavel') return;
                        
                        const nascimento = String(a.nascimento || "").trim();
                        const temNascimento = nascimento.length >= 4 && Number.isFinite(Number(nascimento.split("-")[0]));
                        const sexo = normalizarPublicoEventoChamadaDVC(a.sexo || a.genero || "");
                        
                        let faltandoDado = false;
                        if ((pubNorm.includes("sub17") || pubNorm.includes("adulto")) && !temNascimento) faltandoDado = true;
                        if ((pubNorm.includes("masculino") || pubNorm.includes("feminino")) && !sexo) faltandoDado = true;
                        
                        if (faltandoDado) foraCount++;
                    });
                    
                    if (foraCount > 0) {
                        headerHtml += `
                            <div class="mt-2 bg-gray-100 rounded-lg p-2 border border-gray-200">
                                <p class="text-[9px] font-bold uppercase text-gray-500 leading-tight">
                                    Há ${foraCount} atleta(s) com cadastro incompleto fora do público automático. Use "Ver todos os atletas elegíveis" para localizá-los.
                                </p>
                            </div>
                        `;
                    }
                }
                
                cabecalhoEl.innerHTML = headerHtml;
            }

            const temAlteracao = chamadaTemAlteracoesPendentes(evId);
            const avisoPendente = document.getElementById(`aviso-pendente-${evId}`);
            if (avisoPendente) {
                avisoPendente.innerText = temAlteracao ? "ALTERAÇÕES PENDENTES" : "";
            }

            window.atualizarBotaoSalvarChamadaDVC(evId);

            let countPendentes = 0;
            let countPresentes = 0;
            let countEquipe = 0;
            let countEquipePresente = 0;

            const pendentes = [];
            const presentes = [];
            const equipe = [];

            convocados.forEach(atleta => {
                const email = normalizarEmailDVC(atleta.email || atleta.id);
                const funcNorm = typeof normalizarFuncaoTecnica === 'function' ? normalizarFuncaoTecnica(atleta.funcao) : String(atleta.funcao || "").toLowerCase();
                const ehEquipe = funcNorm === 'treinador' || funcNorm === 'auxiliar' || funcNorm === 'adm' || funcNorm === 'responsavel';
                const presente = selecionados.has(email);
                
                if (ehEquipe) {
                    countEquipe++;
                    if(presente) countEquipePresente++;
                    equipe.push({atleta, email, presente, ehEquipe: true});
                } else {
                    if (presente) {
                        countPresentes++;
                        presentes.push({atleta, email, presente, ehEquipe: false});
                    } else {
                        countPendentes++;
                        pendentes.push({atleta, email, presente, ehEquipe: false});
                    }
                }
            });

            const abaBtnPendentes = document.getElementById(`contador-aba-${evId}-pendentes`);
            if(abaBtnPendentes) abaBtnPendentes.innerText = countPendentes;
            const abaBtnPresentes = document.getElementById(`contador-aba-${evId}-presentes`);
            if(abaBtnPresentes) abaBtnPresentes.innerText = countPresentes;
            const abaBtnEquipe = document.getElementById(`contador-aba-${evId}-equipe`);
            if(abaBtnEquipe) abaBtnEquipe.innerText = countEquipe;

            const resumoFixo = document.getElementById(`resumo-fixo-chamada-${evId}`);
            if(resumoFixo) resumoFixo.innerText = `${countPresentes} atletas · ${countEquipePresente} equipe`;

            let listaAtiva = [];
            if (estado.abaAtiva === 'pendentes') listaAtiva = pendentes;
            else if (estado.abaAtiva === 'presentes') listaAtiva = presentes;
            else if (estado.abaAtiva === 'equipe') listaAtiva = equipe;

            if (estado.busca) {
                listaAtiva = listaAtiva.filter(item => normalizarBuscaChamadaDVC(item.atleta.nome).includes(estado.busca));
            }
            
            if (estado.filtro !== 'TODOS') {
                listaAtiva = listaAtiva.filter(item => {
                    const at = item.atleta;
                    if (estado.filtro === 'SUB-17' || estado.filtro === 'ADULTO') {
                        const isAdulto = typeof atletaCompleta18NoAno === 'function' ? atletaCompleta18NoAno(at, new Date().getFullYear()) : false;
                        if (estado.filtro === 'ADULTO' && !isAdulto) return false;
                        if (estado.filtro === 'SUB-17' && isAdulto) return false;
                    }
                    if (estado.filtro === 'MASCULINO' || estado.filtro === 'FEMININO') {
                        const genero = String(at.sexo || at.genero || at.gender || "").toUpperCase().startsWith('M') ? 'MASCULINO' : 'FEMININO';
                        if (estado.filtro !== genero) return false;
                    }
                    return true;
                });
            }

            const containerLista = document.getElementById(`lista-chamada-${evId}`);
            if (!containerLista) return;

            document.querySelectorAll(`.filtro-chamada-btn-${evId}`).forEach(btn => {
                if(btn.innerText.trim() === estado.filtro) {
                    btn.className = `filtro-chamada-btn-${evId} whitespace-nowrap px-3 py-1.5 rounded-lg text-[9px] font-black uppercase border transition-colors bg-[#990000] text-white border-[#990000]`;
                } else {
                    btn.className = `filtro-chamada-btn-${evId} whitespace-nowrap px-3 py-1.5 rounded-lg text-[9px] font-black uppercase border transition-colors bg-white text-gray-600 border-gray-200`;
                }
            });

            document.querySelectorAll(`.aba-chamada-btn-${evId}`).forEach(btn => {
                if(btn.id === `aba-btn-${evId}-${estado.abaAtiva}`) {
                    btn.className = `aba-chamada-btn-${evId} py-2 rounded-lg text-[9px] font-black uppercase transition-colors bg-white text-gray-900 shadow-sm flex flex-col items-center justify-center`;
                } else {
                    btn.className = `aba-chamada-btn-${evId} py-2 rounded-lg text-[9px] font-black uppercase transition-colors text-gray-500 flex flex-col items-center justify-center`;
                }
            });

            if (listaAtiva.length === 0) {
                containerLista.innerHTML = `
                    <div class="text-center p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <p class="text-[10px] font-semibold text-gray-500 mb-2">Nenhum participante encontrado com estes filtros.</p>
                        <button onclick="window.atualizarBuscaChamada('${evId}', ''); document.getElementById('busca-chamada-${evId}').value = ''; window.atualizarFiltroChamada('${evId}', 'TODOS');" class="text-[#990000] text-[10px] font-black uppercase">Limpar filtros</button>
                    </div>
                `;
                return;
            }

            containerLista.innerHTML = listaAtiva.map(item => {
                const at = item.atleta;
                const email = item.email;
                const presente = item.presente;
                const ehEquipe = item.ehEquipe;
                
                const funcText = ehEquipe ? String(at.funcao || "EQUIPE").toUpperCase() : String(at.funcaoVolei || at.posicaoVolei || at.posicao || "N/A").toUpperCase();
                const genero = String(at.sexo || at.genero || at.gender || "").toUpperCase().startsWith('M') ? 'Masculino' : 'Feminino';
                const isAdulto = typeof atletaCompleta18NoAno === 'function' ? atletaCompleta18NoAno(at, new Date().getFullYear()) : false;
                const catText = isAdulto ? 'Adulto' : 'Sub-17';
                
                let tagsHtml = "";
                if (ehEquipe) {
                    tagsHtml = `<span class="text-[9px] font-semibold text-gray-500 uppercase">${funcText}</span>`;
                } else {
                    tagsHtml = `<span class="text-[9px] font-semibold text-gray-500">${catText} · ${genero} · ${funcText}</span>`;
                }

                const bgColor = presente ? (ehEquipe ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200') : 'bg-white border-gray-100';
                const textBtn = presente ? (ehEquipe ? 'MARCADO' : 'MARCADO') : 'PRESENTE';
                const btnClass = presente ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 border border-gray-200';

                const foraSorteio = presente && atletaEstaForaSorteioChamadaDVC(evId, email);

                let btnSorteioHtml = "";
                // DVC CHAMADA — PARTE 1.1: retira o atleta apenas dos próximos sorteios.
                if (presente && !ehEquipe) {
                    if (foraSorteio) {
                        btnSorteioHtml = `<button onclick="event.stopPropagation(); window.toggleAtivoSorteioTreino('${evId}', '${email}')" class="text-[9px] font-black uppercase text-amber-700 bg-amber-100/50 hover:bg-amber-200 px-2 py-1 rounded-md transition-colors mt-1">Retornou ao treino</button>`;
                    } else {
                        btnSorteioHtml = `<button onclick="event.stopPropagation(); window.toggleAtivoSorteioTreino('${evId}', '${email}')" class="text-[9px] font-black uppercase text-gray-400 hover:text-amber-700 hover:bg-amber-50 px-2 py-1 rounded-md transition-colors mt-1">Saiu mais cedo</button>`;
                    }
                }

                return `
                    <div onclick="togglePresencaTemp('${evId}', '${email}')" class="flex justify-between items-center p-3 border rounded-xl mb-1 cursor-pointer transition-colors ${foraSorteio ? 'bg-amber-50 border-amber-200' : bgColor}">
                        <div class="flex flex-col min-w-0 pr-2">
                            <span class="block text-xs font-bold text-gray-900 truncate uppercase tracking-tight">${at.nome}</span>
                            <div class="flex items-center gap-1 mt-0.5 flex-wrap">
                                ${tagsHtml}
                            </div>
                            ${foraSorteio ? `<span class="block text-[8px] font-black uppercase text-amber-700 mt-0.5">SAIU MAIS CEDO · FORA DO SORTEIO</span>` : ''}
                        </div>
                        <div class="flex flex-col items-end gap-1 shrink-0">
                            <button class="rounded-lg px-3 py-1.5 text-[9px] font-black uppercase pointer-events-none ${btnClass}">${textBtn}</button>
                            ${btnSorteioHtml}
                        </div>
                    </div>
                `;
            }).join('');
        };

        window.togglePresencaTemp = (evId, email) => {
            const emailLimpo = normalizarEmailDVC(email);
            if (!emailLimpo) return;
            window.chamadaTempDVC[evId] = window.chamadaTempDVC[evId] || new Set();
            if (window.chamadaTempDVC[evId].has(emailLimpo)) window.chamadaTempDVC[evId].delete(emailLimpo);
            else window.chamadaTempDVC[evId].add(emailLimpo);
            window.marcarChamadaComoAlteradaDVC(evId);
            window.atualizarVisualChamadaTemp(evId);
        };

        window.toggleAtivoSorteioTreino = (evId, email) => {
            const emailLimpo = normalizarEmailDVC(email);
            if (!emailLimpo) return;

            window.chamadaStatusTreinoDVC[evId] = window.chamadaStatusTreinoDVC[evId] || new Map();
            const statusAtual = getStatusSorteioChamadaDVC(evId, emailLimpo);
            const marcarFora = statusAtual.ativoNoTreino !== false && statusAtual.saiuMaisCedo !== true;

            const convocados = window.chamadaConvocadosDVC?.[evId] || [];
            const atleta = convocados.find(item => normalizarEmailDVC(item.email || item.id) === emailLimpo) || {};
            const nome = atleta.nome || emailLimpo;
            const mensagem = marcarFora 
                ? `Retirar ${nome} dos próximos sorteios?\n\nEla continuará registrada como presente neste treino.`
                : `Disponibilizar ${nome} novamente para os sorteios?`;

            // DVC CHAMADA — PARTE 1.1: impede propagação do botão para a linha de presença. (A propagacao ja é contida no HTML event.stopPropagation())
            if (!confirm(mensagem)) return;

            // DVC CHAMADA — PARTE 1.1: mantém presença mesmo após saída antecipada.
            window.chamadaStatusTreinoDVC[evId].set(emailLimpo, {
                ativoNoTreino: !marcarFora,
                saiuMaisCedo: marcarFora
            });

            window.marcarChamadaComoAlteradaDVC(evId);
            window.atualizarVisualChamadaTemp(evId);
        };

        window.marcarTodosChamadaTemp = (evId) => {
            const convocados = window.chamadaConvocadosDVC?.[evId] || [];
            window.chamadaTempDVC[evId] = new Set(convocados.map(atleta => normalizarEmailDVC(atleta.email || atleta.id)).filter(Boolean));
            window.marcarChamadaComoAlteradaDVC(evId);
            window.atualizarVisualChamadaTemp(evId);
        };

        window.limparChamadaTemp = (evId) => {
            window.chamadaTempDVC[evId] = new Set();
            window.marcarChamadaComoAlteradaDVC(evId);
            window.atualizarVisualChamadaTemp(evId);
        };

        window.salvarChamadaEvento = async (evId) => {
            try {
                const selecionados = window.chamadaTempDVC?.[evId] || new Set();
                const salvos = window.chamadaSalvaDVC?.[evId] || new Set();
                const convocados = window.chamadaConvocadosDVC?.[evId] || [];
                const porEmail = new Map(convocados.map(atleta => [normalizarEmailDVC(atleta.email || atleta.id), atleta]));
                const operacoes = [];
                const atualizacoesCache = [];
                const remocoesCache = [];
                const agora = new Date().toISOString();
                const responsavel = window.currentUserData?.nome || auth.currentUser?.email || "Equipe tecnica";

                selecionados.forEach(email => {
                    const statusSorteio = getStatusSorteioChamadaDVC(evId, email);
                    const sS = window.chamadaStatusTreinoSalvoDVC?.[evId]?.get(email) || {ativoNoTreino: true, saiuMaisCedo: false};
                    const statusMudou = statusSorteio.ativoNoTreino !== sS.ativoNoTreino || statusSorteio.saiuMaisCedo !== sS.saiuMaisCedo;
                    
                    if (salvos.has(email) && !statusMudou) return;

                    const atleta = porEmail.get(email) || {};
                    const dadosPresenca = {
                        nome: atleta.nome || email,
                        email,
                        presente: true,
                        ativoNoTreino: statusSorteio.ativoNoTreino !== false,
                        saiuMaisCedo: statusSorteio.saiuMaisCedo === true,
                        salvoEm: agora,
                        salvoPor: responsavel
                    };
                    // DVC CHAMADA — PARTE 1.1: preserva times e partidas já registrados.
                    operacoes.push(setDoc(doc(db, "events", evId, "presencas", email), dadosPresenca, { merge: true }));
                    atualizacoesCache.push({ email, dados: dadosPresenca });
                });

                salvos.forEach(email => {
                    if (selecionados.has(email)) return;
                    operacoes.push(deleteDoc(doc(db, "events", evId, "presencas", email)));
                    remocoesCache.push(email);
                });

                await Promise.all(operacoes);
                atualizacoesCache.forEach(item => atualizarCachePresencaChamadaDVC(evId, item.email, item.dados));
                atualizacoesCache.forEach(item => {
                    window.chamadaStatusTreinoDVC[evId] = window.chamadaStatusTreinoDVC[evId] || new Map();
                    window.chamadaStatusTreinoDVC[evId].set(item.email, {
                        ativoNoTreino: item.dados.ativoNoTreino !== false,
                        saiuMaisCedo: item.dados.saiuMaisCedo === true
                    });
                });
                remocoesCache.forEach(email => {
                    atualizarCachePresencaChamadaDVC(evId, email, {}, true);
                    window.chamadaStatusTreinoDVC?.[evId]?.delete(email);
                });
                return { sucesso: true };
            } catch (e) {
                console.error("[DVC Chamada] Erro ao salvar chamada no Firestore:", e);
                return { sucesso: false, erro: e };
            }
        };

        window.renderChamada = async (evId, forceOpen = false) => {
            const div = document.getElementById(`gestao-${evId}`);
            if (!div) return;
            if (!forceOpen) div.classList.toggle('hidden');
            if (div.classList.contains('hidden') && !forceOpen) return;

            const eventoAtual = await obterEventoAgendaPorIdDVC(evId);
            const chamadaEhTreino = getTipoEventoAgenda(eventoAtual) === "treino";
            const [convArrOriginal, presArr] = await Promise.all([
                chamadaEhTreino ? carregarAtletasChamadaTreinoDVC(eventoAtual) : carregarConvocadosEventoDVC(evId),
                carregarPresencasEventoDVC(evId)
            ]);

            const convArr = convArrOriginal.map(data => ({
                ...data,
                email: normalizarEmailDVC(data.email || data.id),
                nome: data.nome || data.id
            })).sort((a, b) => a.nome.localeCompare(b.nome));

            const presencasSalvas = new Set(presArr.map(p => normalizarEmailDVC(p.id)));
            const statusPresencas = new Map(
                presArr.map(p => [
                    normalizarEmailDVC(p.id || p.email),
                    {
                        ativoNoTreino: p.ativoNoTreino !== false,
                        saiuMaisCedo: p.saiuMaisCedo === true
                    }
                ])
            );
            window.chamadaConvocadosDVC[evId] = convArr;
            window.chamadaSalvaDVC[evId] = new Set(presencasSalvas);
            window.chamadaTempDVC[evId] = new Set(presencasSalvas);
            window.chamadaStatusTreinoDVC[evId] = statusPresencas;
            window.chamadaStatusTreinoSalvoDVC = window.chamadaStatusTreinoSalvoDVC || {};
            window.chamadaStatusTreinoSalvoDVC[evId] = new Map(
                Array.from(statusPresencas.entries()).map(([k, v]) => [k, { ...v }])
            );

            // DVC CHAMADA — PARTE 1: mantém marcações em memória até o salvamento oficial.
            if (!window.DVC_CHAMADA_ESTADO[evId]) {
                window.DVC_CHAMADA_ESTADO[evId] = {
                    abaAtiva: "pendentes",
                    busca: "",
                    filtro: "TODOS",
                    mostrarTodosElegiveis: false
                };
            }
            window.DVC_CHAMADA_ESTADO[evId].alterada = false;
            window.DVC_CHAMADA_ESTADO[evId].salvando = false;

            const total = convArr.length;

            div.innerHTML = `
                <div class="bg-gray-50 border rounded-xl p-3 mb-3 flex flex-col gap-3">
                    <div id="cabecalho-publico-${evId}"></div>

                    <div class="flex flex-col gap-2">
                        <input type="text" id="busca-chamada-${evId}" placeholder="Buscar participante pelo nome..." 
                            class="w-full p-3 rounded-xl border border-gray-200 text-sm bg-white outline-none font-semibold"
                            oninput="window.atualizarBuscaChamada('${evId}', this.value)"
                            value="${window.DVC_CHAMADA_ESTADO[evId].busca}">
                        
                        <div class="flex overflow-x-auto gap-2 pb-1 scrollbar-hide">
                            ${['TODOS', 'SUB-17', 'ADULTO', 'MASCULINO', 'FEMININO'].map(f => `
                                <button onclick="window.atualizarFiltroChamada('${evId}', '${f}')" 
                                    class="filtro-chamada-btn-${evId} whitespace-nowrap px-3 py-1.5 rounded-lg text-[9px] font-black uppercase border transition-colors bg-white text-gray-600 border-gray-200">
                                    ${f}
                                </button>
                            `).join('')}
                        </div>
                    </div>

                    <div class="grid grid-cols-3 gap-1 bg-gray-200 p-1 rounded-xl">
                        ${[
                            { id: 'pendentes', label: 'Pendentes' },
                            { id: 'presentes', label: 'Presentes' },
                            { id: 'equipe', label: 'Equipe' }
                        ].map(aba => `
                            <button onclick="window.mudarAbaChamada('${evId}', '${aba.id}')"
                                id="aba-btn-${evId}-${aba.id}"
                                class="aba-chamada-btn-${evId} py-2 rounded-lg text-[9px] font-black uppercase transition-colors text-gray-500 flex flex-col items-center justify-center">
                                <span>${aba.label}</span>
                                <span id="contador-aba-${evId}-${aba.id}" class="text-xs mt-0.5 font-bold">0</span>
                            </button>
                        `).join('')}
                    </div>
                </div>
                
                <div id="lista-chamada-${evId}" class="space-y-1">
                </div>

                <div id="dvc-chamada-acoes-${evId}" class="sticky bottom-0 z-20 mt-3 border-t border-slate-200 bg-white/95 px-3 py-3 backdrop-blur">
                    <div class="mb-2 flex items-center justify-between">
                        <span class="text-[10px] font-bold text-amber-700" id="aviso-pendente-${evId}">
                        </span>
                        <span class="text-[10px] font-black text-slate-600" id="resumo-fixo-chamada-${evId}">
                            0 atletas · 0 equipe
                        </span>
                    </div>
                    <button
                        type="button"
                        id="btn-salvar-chamada-${evId}"
                        onclick="window.acionarSalvamentoChamadaDVC('${evId}')"
                        class="min-h-[48px] w-full rounded-xl bg-slate-200 text-slate-500 border border-slate-300 px-4 py-3 text-[11px] font-black uppercase shadow-none cursor-not-allowed transition-colors"
                        disabled
                        aria-disabled="true"
                    >
                        CHAMADA SALVA
                    </button>
                </div>
            `;
            window.atualizarVisualChamadaTemp(evId);
        };

        window.addEvent = async () => {
    if (!usuarioEhEquipeTecnica()) {
        return alert("Apenas ADM, Treinador ou Auxiliar podem criar eventos na agenda.");
    }

    const t = document.getElementById('ev-title').value;
    const d = document.getElementById('ev-date').value;
    const tipo = document.getElementById('ev-tipo')?.value || "treino";

    const adversario = tipo === "jogo" ? (document.getElementById('ev-adversario')?.value || "") : "";
    const local = tipo === "jogo" ? (document.getElementById('ev-local')?.value || "") : "";
    const equipeJogo = document.getElementById('ev-equipe')?.value || "";
    const categoriaTreino = document.getElementById('ev-categoria-treino')?.value || "";
    const equipe = tipo === "treino" ? categoriaTreino : equipeJogo;

    const responsaveisTecnicos = typeof obterResponsaveisSelecionadosEvento === 'function' ? obterResponsaveisSelecionadosEvento() : [];
    const responsavelEmail = responsaveisTecnicos[0]?.email || "";
    const responsavelNome = responsaveisTecnicos[0]?.nome || "";
    if (!t || !d) {
        return alert("Falta dados (Título e Data).");
    }

    if (tipo === "jogo" && (!adversario || !local)) {
        return alert("Para cadastrar um jogo/amistoso, informe o adversário e o local.");
    }

    if (!responsaveisTecnicos.length) {
        return alert("Selecione ao menos um responsavel tecnico pelo evento.");
    }

    // Captura apenas os checkboxes marcados
    const checkboxes = document.querySelectorAll('#ev-opcoes input:checked');
    const desc = Array.from(checkboxes).map(cb => cb.value).join(', ');

        if(window.editingEventId) { 
    await updateDoc(doc(db, "events", window.editingEventId), { 
        titulo: t, 
        descricao: desc, 
        data: d,
        tipo: tipo,
        adversario: adversario,
        local: local,
        equipe: equipe,

        responsaveisTecnicos: responsaveisTecnicos,
        responsavelEmail: responsavelEmail,
        responsavelNome: responsavelNome
    }); 
    window.editingEventId = null; 
    limparCacheDados("eventos");
    alert("Evento atualizado!");
}

     else { 
    await addDoc(collection(db, "events"), { 
        titulo: t, 
        descricao: desc, 
        data: d, 
        status: "ativo",
        tipo: tipo,
        adversario: adversario,
        local: local,
        equipe: equipe,

        responsaveisTecnicos: responsaveisTecnicos,
        responsavelEmail: responsavelEmail,
        responsavelNome: responsavelNome,
        avaliacaoTecnicaStatus: "Nao iniciada",

        convocadosTexto: "" 
    }); 

    limparCacheDados("eventos");
    alert("Evento criado!");
}

    window.agendaFiltroAtual = tipo === "jogo" ? "jogo" : "treino";
    window.renderCalendar();
};

        window.prepararEdicao = async (id, tit, desc, data, tipo = "treino", adversario = "", local = "", equipe = "", responsavelEmail = "", responsavelNome = "") => { 
    if (!usuarioPodeAprovarAvaliacoes()) {
        return alert("Apenas ADM ou Treinador podem editar eventos.");
    }

    window.editingEventId = id; 
    const tipoEvento = tipo === "jogo" ? "jogo" : "treino";
    window.agendaFiltroAtual = tipoEvento;

    const form = document.getElementById('agenda-form-evento');
    if (form) form.classList.remove('hidden');

    document.getElementById('ev-title').value = tit; 
    document.getElementById('ev-date').value = data; 
    document.getElementById('form-title').innerText = "Editando"; 
    document.getElementById('btn-save-ev').innerText = "Salvar";

    const tipoSelect = document.getElementById('ev-tipo');
    if (tipoSelect) {
        tipoSelect.value = tipoEvento;
    }

    window.toggleCamposJogo();

    if (document.getElementById('ev-adversario')) {
        document.getElementById('ev-adversario').value = tipoEvento === "jogo" ? (adversario || "") : "";
    }

    if (document.getElementById('ev-local')) {
        document.getElementById('ev-local').value = tipoEvento === "jogo" ? (local || "") : "";
    }

    if (document.getElementById('ev-equipe')) {
        document.getElementById('ev-equipe').value = tipoEvento === "jogo" ? (equipe || "") : "";
    }

    if (document.getElementById('ev-categoria-treino')) {
        document.getElementById('ev-categoria-treino').value = tipoEvento === "treino" ? (equipe || "") : "";
    }

    let responsaveisSelecionadosEdicao = [];

    try {
        const eventoEdicaoSnap = await getDoc(doc(db, "events", id));
        if (eventoEdicaoSnap.exists()) {
            responsaveisSelecionadosEdicao = typeof normalizarResponsaveisTecnicosEvento === 'function' ? normalizarResponsaveisTecnicosEvento(eventoEdicaoSnap.data()) : [];
        }
    } catch (erroResponsaveisEdicao) {
        console.warn("Nao foi possivel carregar responsaveis salvos:", erroResponsaveisEdicao);
    }

    if (!responsaveisSelecionadosEdicao.length && responsavelEmail) {
        responsaveisSelecionadosEdicao = [{
            email: String(responsavelEmail || "").trim().toLowerCase(),
            nome: responsavelNome || responsavelEmail,
            funcao: "Responsavel"
        }];
    }

    await window.carregarResponsaveisTecnicos(responsaveisSelecionadosEdicao);

    const listaMarcacoes = desc ? desc.split(', ') : [];
    const inputs = document.querySelectorAll('#ev-opcoes input');
    
    inputs.forEach(input => {
        input.checked = listaMarcacoes.includes(input.value);
    });

    if (form) form.scrollIntoView({ behavior: "smooth", block: "start" });
};
window.apagarEvento = async (id) => {
    if (!usuarioPodeAprovarAvaliacoes()) {
        return alert("Apenas ADM ou Treinador podem apagar eventos.");
    }

    if(confirm("Apagar?")) { await deleteDoc(doc(db, "events", id)); limparCacheDados("eventos"); window.renderCalendar(); }
};

const renderCalendar = window.renderCalendar;
const concluirTreino = window.concluirTreino;
const toggleCamposJogo = window.toggleCamposJogo;
const setAgendaFiltro = window.setAgendaFiltro;
const toggleHistoricoAgendaDVC = window.toggleHistoricoAgendaDVC;
const fecharFormularioAgenda = window.fecharFormularioAgenda;
const abrirNovoEventoAgenda = window.abrirNovoEventoAgenda;
const carregarResponsaveisTecnicos = window.carregarResponsaveisTecnicos;
const renderConvocacao = window.renderConvocacao;
const renderChamada = window.renderChamada;
const salvarChamadaEvento = window.salvarChamadaEvento;
const atualizarVisualChamadaTemp = window.atualizarVisualChamadaTemp;
const togglePresencaTemp = window.togglePresencaTemp;
const toggleAtivoSorteioTreino = window.toggleAtivoSorteioTreino;
const marcarTodosChamadaTemp = window.marcarTodosChamadaTemp;
const limparChamadaTemp = window.limparChamadaTemp;
const addEvent = window.addEvent;
const prepararEdicao = window.prepararEdicao;
const apagarEvento = window.apagarEvento;

export {
    renderCalendar,
    concluirTreino,
    toggleCamposJogo,
    setAgendaFiltro,
    toggleHistoricoAgendaDVC,
    fecharFormularioAgenda,
    abrirNovoEventoAgenda,
    carregarResponsaveisTecnicos,
    renderConvocacao,
    renderChamada,
    salvarChamadaEvento,
    atualizarVisualChamadaTemp,
    togglePresencaTemp,
    toggleAtivoSorteioTreino,
    marcarTodosChamadaTemp,
    limparChamadaTemp,
    addEvent,
    prepararEdicao,
    apagarEvento
};
