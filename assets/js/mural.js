/**
 * ============================================================================
 * Módulo: MURAL
 * ============================================================================
 * Responsabilidade: Gerencia funcionalidades relacionadas a mural.
 * Este arquivo faz parte do sistema modular do DVC App.
 * Todos os códigos principais aqui agrupados seguem as diretrizes do projeto.
 * ============================================================================
 */

// MURAL AND AVISOS MODULE DVC APP

import { db, auth, getDocs, collection, doc, getDoc, setDoc, updateDoc, deleteDoc } from "./firebase.js";
import {
    normalizarBuscaDVC,
    normalizarFuncaoTecnica,
    calcularCategoriaEtariaDVC,
    escaparHtml,
    safeEditParam,
    renderBadgeDVC
} from "./utils.js";

// Helper functions for roles and cache clearing from window context
const usuarioEhADM = () => typeof window.usuarioEhADM === 'function' ? window.usuarioEhADM() : false;
const usuarioEhEquipeTecnica = () => typeof window.usuarioEhEquipeTecnica === 'function' ? window.usuarioEhEquipeTecnica() : false;
const limparCacheDados = (tipo) => typeof window.limparCacheDados === 'function' ? window.limparCacheDados(tipo) : null;

const refreshUI = () => {
    if (window.__abaAtualDVC === "home" && typeof window.renderHome === 'function') window.renderHome();
    if (window.__abaAtualDVC === "mural" && typeof window.renderMural === 'function') window.renderMural();
};

const CATEGORIAS_AVISOS_DVC = {
    geral: { label: "Geral", icone: "fa-bullhorn", classe: "bg-gray-50 text-gray-600 border-gray-200" },
    treino: { label: "Treino", icone: "fa-volleyball", classe: "bg-red-50 text-[#990000] border-red-100" },
    financeiro: { label: "Financeiro", icone: "fa-file-invoice-dollar", classe: "bg-green-50 text-green-700 border-green-100" },
    uniforme: { label: "Uniforme", icone: "fa-shirt", classe: "bg-blue-50 text-blue-700 border-blue-100" },
    campeonato: { label: "Campeonato", icone: "fa-trophy", classe: "bg-yellow-50 text-yellow-800 border-yellow-100" },
    documentos: { label: "Documentos", icone: "fa-file-lines", classe: "bg-indigo-50 text-indigo-700 border-indigo-100" },
    urgente: { label: "Urgente", icone: "fa-triangle-exclamation", classe: "bg-red-100 text-[#990000] border-red-200" }
};

const PRIORIDADES_AVISOS_DVC = {
    baixa: { label: "Baixa", peso: 1, classe: "bg-gray-50 text-gray-500 border-gray-100" },
    normal: { label: "Normal", peso: 2, classe: "bg-white text-gray-500 border-gray-200" },
    alta: { label: "Alta", peso: 3, classe: "bg-yellow-50 text-yellow-800 border-yellow-100" },
    urgente: { label: "Urgente", peso: 4, classe: "bg-red-50 text-[#990000] border-red-100" }
};

function snapshotToArray(snapshot) {
    if (Array.isArray(snapshot)) return snapshot;
    return snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
    }));
}

async function carregarAvisosDVCCache(forcar = false) {
    if (!forcar && window.AppCache?.avisos) return window.AppCache.avisos;

    const snap = await getDocs(collection(db, "avisosDVC"));
    if (!window.AppCache) window.AppCache = {};
    window.AppCache.avisos = snapshotToArray(snap);
    return window.AppCache.avisos;
}

function chaveMetaAvisoDVC(valor = "") {
    const chave = normalizarBuscaDVC(valor).replace(/\s+/g, "");
    if (chave.includes("financ")) return "financeiro";
    if (chave.includes("uniform")) return "uniforme";
    if (chave.includes("campeonato")) return "campeonato";
    if (chave.includes("document")) return "documentos";
    if (chave.includes("treino")) return "treino";
    if (chave.includes("urgent")) return "urgente";
    return "geral";
}

function chavePrioridadeAvisoDVC(valor = "") {
    const chave = normalizarBuscaDVC(valor).replace(/\s+/g, "");
    if (chave.includes("urgent")) return "urgente";
    if (chave.includes("alta")) return "alta";
    if (chave.includes("baixa")) return "baixa";
    return "normal";
}

function avisoEstaAtivoDVC(aviso = {}) {
    if (aviso.ativo === false) return false;

    const expiraEm = String(aviso.expiraEm || "").trim();
    if (!expiraEm) return true;

    const dataExpiracao = new Date(`${expiraEm}T23:59:59`);
    if (isNaN(dataExpiracao.getTime())) return true;

    return dataExpiracao >= new Date();
}

function avisoEhParaUsuarioDVC(aviso = {}, user = window.currentUserData) {
    const publico = normalizarBuscaDVC(aviso.publico || "Todos");
    if (!publico || publico === "todos") return true;

    const equipe = usuarioEhEquipeTecnica();
    if (publico.includes("equipe")) return equipe;
    if (publico.includes("atleta")) return !equipe || normalizarFuncaoTecnica(user?.funcao) === "auxiliar";

    const genero = normalizarBuscaDVC(user?.sexo || user?.genero || user?.gender || "");
    if (publico.includes("masculino")) return genero === "m" || genero.includes("masc");
    if (publico.includes("feminino")) return genero === "f" || genero.includes("fem");

    const categoria = calcularCategoriaEtariaDVC(user);
    if (publico.includes("sub")) return categoria === "Sub-17";
    if (publico.includes("adulto")) return categoria === "Adulto";

    return true;
}

function ordenarAvisosDVC(a, b) {
    if (!!b.fixado !== !!a.fixado) return b.fixado ? 1 : -1;

    const prioridadeA = PRIORIDADES_AVISOS_DVC[chavePrioridadeAvisoDVC(a.prioridade)]?.peso || 0;
    const prioridadeB = PRIORIDADES_AVISOS_DVC[chavePrioridadeAvisoDVC(b.prioridade)]?.peso || 0;
    if (prioridadeB !== prioridadeA) return prioridadeB - prioridadeA;

    return new Date(b.criadoEm || 0) - new Date(a.criadoEm || 0);
}

function renderCardAvisoDVC(aviso = {}, compacto = false, admin = false) {
    const categoriaKey = chaveMetaAvisoDVC(aviso.categoria);
    const prioridadeKey = chavePrioridadeAvisoDVC(aviso.prioridade);
    const categoria = CATEGORIAS_AVISOS_DVC[categoriaKey] || CATEGORIAS_AVISOS_DVC.geral;
    const prioridade = PRIORIDADES_AVISOS_DVC[prioridadeKey] || PRIORIDADES_AVISOS_DVC.normal;
    const mensagem = escaparHtml(aviso.mensagem || "");
    const textoMensagem = compacto && mensagem.length > 150 ? `${mensagem.slice(0, 150)}...` : mensagem;
    const ativo = avisoEstaAtivoDVC(aviso);

    return `
        <article class="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                    <div class="flex flex-wrap items-center gap-1">
                        <span class="inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[8px] font-black uppercase border ${categoria.classe}">
                            <i class="fa-solid ${categoria.icone} text-[8px]"></i>
                            ${categoria.label}
                        </span>
                        <span class="inline-flex items-center justify-center whitespace-nowrap rounded-full px-2.5 py-1 text-[8px] font-black uppercase border ${prioridade.classe}">
                            ${prioridade.label}
                        </span>
                        ${aviso.fixado ? renderBadgeDVC("Fixado", "vermelho") : ""}
                        ${!ativo ? renderBadgeDVC("Inativo/expirado", "neutro") : ""}
                    </div>
                    <h3 class="text-sm font-black text-gray-900 uppercase leading-tight mt-2">${escaparHtml(aviso.titulo || "Aviso DVC")}</h3>
                </div>
                <div class="w-10 h-10 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                    <i class="fa-solid ${categoria.icone} text-[#990000]"></i>
                </div>
            </div>

            <p class="text-[10px] text-gray-500 font-semibold leading-relaxed mt-2">${textoMensagem}</p>
            <p class="text-[8px] font-bold uppercase text-gray-400 mt-2">
                ${aviso.criadoEm ? new Date(aviso.criadoEm).toLocaleDateString("pt-BR") : ""}
                ${aviso.expiraEm ? `- Expira em ${escaparHtml(aviso.expiraEm)}` : ""}
            </p>

            ${aviso.link ? `
                <a href="${escaparHtml(aviso.link)}" target="_blank" rel="noopener" class="mt-3 inline-flex items-center justify-center w-full rounded-2xl bg-[#990000] text-white py-3 text-[10px] font-black uppercase shadow-sm">
                    ${escaparHtml(aviso.botaoTexto || "Abrir link")}
                </a>
            ` : ""}

            ${admin ? `
                <div class="grid grid-cols-3 gap-2 mt-3">
                    <button onclick="abrirModalCriarAvisoDVC('${safeEditParam(aviso.id)}')" class="bg-gray-900 text-white rounded-xl py-2 text-[8px] font-black uppercase">Editar</button>
                    <button onclick="desativarAvisoDVC('${safeEditParam(aviso.id)}')" class="bg-yellow-50 text-yellow-800 border border-yellow-100 rounded-xl py-2 text-[8px] font-black uppercase">${aviso.ativo === false ? "Ativar" : "Desativar"}</button>
                    <button onclick="excluirAvisoDVC('${safeEditParam(aviso.id)}')" class="bg-white text-red-700 border border-red-100 rounded-xl py-2 text-[8px] font-black uppercase">Excluir</button>
                </div>
            ` : ""}
        </article>
    `;
}

async function renderAvisosHomeDVC() {
    try {
        const avisos = (await carregarAvisosDVCCache())
            .filter(aviso => avisoEstaAtivoDVC(aviso) && avisoEhParaUsuarioDVC(aviso))
            .sort(ordenarAvisosDVC);

        const importantes = avisos
            .filter(aviso => aviso.fixado || ["alta", "urgente"].includes(chavePrioridadeAvisoDVC(aviso.prioridade)))
            .slice(0, 2);

        if (!importantes.length) return "";

        return `
            <section class="bg-white border border-gray-100 rounded-3xl p-4 shadow-sm">
                <div class="flex items-center justify-between gap-3 mb-3">
                    <div>
                        <p class="text-[10px] font-black uppercase text-[#990000]">Avisos importantes</p>
                        <p class="text-[9px] font-semibold text-gray-500">Comunicados ativos da gestão DVC.</p>
                    </div>
                    <button onclick="changeTab('mural')" class="text-[8px] font-black uppercase text-[#990000]">Ver todos</button>
                </div>
                <div class="space-y-2">
                    ${importantes.map(aviso => renderCardAvisoDVC(aviso, true)).join("")}
                </div>
            </section>
        `;
    } catch (erro) {
        console.warn("Não foi possível carregar avisos na Home:", erro);
        return "";
    }
}

async function renderAvisosMuralDVC() {
    try {
        const avisos = (await carregarAvisosDVCCache())
            .filter(aviso => avisoEstaAtivoDVC(aviso) && avisoEhParaUsuarioDVC(aviso))
            .sort(ordenarAvisosDVC);

        if (!avisos.length) return "";

        return `
            <section id="mural-comunicados-dvc" class="mb-5">
                <div class="flex items-center justify-between gap-3 mb-2">
                    <p class="text-[10px] font-black text-[#990000] uppercase">
                        <i class="fa-solid fa-bullhorn mr-1"></i> Comunicados DVC
                    </p>
                    <span class="text-[8px] font-black uppercase text-gray-400">${avisos.length} ativo(s)</span>
                </div>
                <div class="space-y-3">
                    ${avisos.map(aviso => renderCardAvisoDVC(aviso, false)).join("")}
                </div>
            </section>
        `;
    } catch (erro) {
        console.warn("Não foi possível carregar avisos no muralá", erro);
        return "";
    }
}

async function abrirModalCriarAvisoDVC(avisoId = null) {
    if (!usuarioEhADM()) return alert("Apenas ADM pode gerenciar avisos.");

    try {
        const avisos = await carregarAvisosDVCCache();
        const aviso = avisoId ? (avisos.find(item => item.id === avisoId) || {}) : {};

        document.getElementById("m-aviso-dvc")?.remove();

        const modal = `
            <div id="m-aviso-dvc" class="fixed inset-0 bg-black/80 z-[110] p-4 flex items-center justify-center">
                <div class="bg-white w-full max-w-sm rounded-3xl shadow-2xl max-h-[88vh] overflow-y-auto">
                    <div class="bg-gradient-to-r from-gray-950 via-[#4b0d0d] to-[#990000] text-white p-4 flex items-start justify-between gap-3">
                        <div>
                            <p class="text-[8px] font-black uppercase text-white/60">Comunicados DVC</p>
                            <h3 class="text-sm font-black uppercase">${avisoId ? "Editar aviso" : "Criar aviso"}</h3>
                        </div>
                        <button onclick="document.getElementById('m-aviso-dvc')?.remove()" class="w-9 h-9 rounded-full bg-white/10 border border-white/20">
                            <i class="fa-solid fa-xmark text-xs"></i>
                        </button>
                    </div>

                    <div class="p-4 space-y-3">
                        <div>
                            <label class="text-[8px] font-black uppercase text-gray-400">Título</label>
                            <input id="aviso-titulo-dvc" value="${escaparHtml(aviso.titulo || "")}" class="w-full border rounded-2xl p-3 text-xs font-semibold bg-gray-50 outline-none">
                        </div>
                        <div>
                            <label class="text-[8px] font-black uppercase text-gray-400">Mensagem</label>
                            <textarea id="aviso-mensagem-dvc" class="w-full min-h-[120px] border rounded-2xl p-3 text-xs font-semibold bg-gray-50 outline-none">${escaparHtml(aviso.mensagem || "")}</textarea>
                        </div>
                        <div class="grid grid-cols-2 gap-2">
                            <div>
                                <label class="text-[8px] font-black uppercase text-gray-400">Categoria</label>
                                <select id="aviso-categoria-dvc" class="w-full border rounded-2xl p-3 text-[10px] font-black uppercase bg-gray-50">
                                    ${["Geral", "Treino", "Financeiro", "Uniforme", "Campeonato", "Documentos", "Urgente"].map(opcao => `<option value="${opcao}" ${String(aviso.categoria || "Geral") === opcao ? "selected" : ""}>${opcao}</option>`).join("")}
                                </select>
                            </div>
                            <div>
                                <label class="text-[8px] font-black uppercase text-gray-400">Prioridade</label>
                                <select id="aviso-prioridade-dvc" class="w-full border rounded-2xl p-3 text-[10px] font-black uppercase bg-gray-50">
                                    ${["Baixa", "Normal", "Alta", "Urgente"].map(opcao => `<option value="${opcao}" ${String(aviso.prioridade || "Normal") === opcao ? "selected" : ""}>${opcao}</option>`).join("")}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label class="text-[8px] font-black uppercase text-gray-400">Público</label>
                            <select id="aviso-publico-dvc" class="w-full border rounded-2xl p-3 text-[10px] font-black uppercase bg-gray-50">
                                ${["Todos", "Atletas", "Equipe Técnica", "Masculino", "Feminino", "Sub-17", "Adulto"].map(opcao => `<option value="${opcao}" ${String(aviso.publico || "Todos") === opcao ? "selected" : ""}>${opcao}</option>`).join("")}
                            </select>
                        </div>
                        <div class="grid grid-cols-2 gap-2">
                            <label class="bg-gray-50 border rounded-2xl p-3 text-[9px] font-black uppercase text-gray-600 flex items-center gap-2">
                                <input id="aviso-fixado-dvc" type="checkbox" class="accent-[#990000]" ${aviso.fixado ? "checked" : ""}>
                                Fixado
                            </label>
                            <label class="bg-gray-50 border rounded-2xl p-3 text-[9px] font-black uppercase text-gray-600 flex items-center gap-2">
                                <input id="aviso-ativo-dvc" type="checkbox" class="accent-[#990000]" ${aviso.ativo === false ? "" : "checked"}>
                                Ativo
                            </label>
                        </div>
                        <div>
                            <label class="text-[8px] font-black uppercase text-gray-400">Link opcional</label>
                            <input id="aviso-link-dvc" value="${escaparHtml(aviso.link || "")}" class="w-full border rounded-2xl p-3 text-xs font-semibold bg-gray-50 outline-none" placeholder="https://...">
                        </div>
                        <div class="grid grid-cols-2 gap-2">
                            <div>
                                <label class="text-[8px] font-black uppercase text-gray-400">Texto do botão</label>
                                <input id="aviso-botao-dvc" value="${escaparHtml(aviso.botaoTexto || "")}" class="w-full border rounded-2xl p-3 text-xs font-semibold bg-gray-50 outline-none" placeholder="Abrir link">
                            </div>
                            <div>
                                <label class="text-[8px] font-black uppercase text-gray-400">Expira em</label>
                                <input id="aviso-expira-dvc" type="date" value="${escaparHtml(aviso.expiraEm || "")}" class="w-full border rounded-2xl p-3 text-xs font-semibold bg-gray-50 outline-none">
                            </div>
                        </div>
                        <button onclick="salvarAvisoDVC('${safeEditParam(avisoId || "")}')" class="w-full bg-[#990000] text-white py-3 rounded-2xl text-[10px] font-black uppercase shadow-sm">
                            Salvar aviso
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML("beforeend", modal);
    } catch (erro) {
        console.error("Erro ao abrir modal de aviso:", erro);
        alert("Não foi possível abrir o formulário de aviso.");
    }
}

async function salvarAvisoDVC(avisoId = null) {
    if (!usuarioEhADM()) return alert("Apenas ADM pode gerenciar avisos.");

    try {
        const titulo = String(document.getElementById("aviso-titulo-dvc")?.value || "").trim();
        const mensagem = String(document.getElementById("aviso-mensagem-dvc")?.value || "").trim();

        if (!titulo || !mensagem) return alert("Informe título e mensagem do aviso.");

        const idFinal = avisoId || `aviso_${Date.now()}`;
        const agoraIso = new Date().toISOString();
        const refAviso = doc(db, "avisosDVC", idFinal);
        const anterior = avisoId ? await getDoc(refAviso) : null;

        await setDoc(refAviso, {
            titulo,
            mensagem,
            categoria: document.getElementById("aviso-categoria-dvc")?.value || "Geral",
            prioridade: document.getElementById("aviso-prioridade-dvc")?.value || "Normal",
            publico: document.getElementById("aviso-publico-dvc")?.value || "Todos",
            fixado: document.getElementById("aviso-fixado-dvc")?.checked === true,
            ativo: document.getElementById("aviso-ativo-dvc")?.checked !== false,
            link: String(document.getElementById("aviso-link-dvc")?.value || "").trim(),
            botaoTexto: String(document.getElementById("aviso-botao-dvc")?.value || "").trim(),
            expiraEm: String(document.getElementById("aviso-expira-dvc")?.value || "").trim(),
            criadoPor: anterior?.exists() ? (anterior.data().criadoPor || window.currentUserData?.nome || "") : (window.currentUserData?.nome || auth.currentUser?.email || ""),
            criadoPorEmail: anterior?.exists() ? (anterior.data().criadoPorEmail || auth.currentUser?.email || "") : (auth.currentUser?.email || ""),
            criadoEm: anterior?.exists() ? (anterior.data().criadoEm || agoraIso) : agoraIso,
            atualizadoEm: agoraIso
        }, { merge: true });

        if (window.AppCache) window.AppCache.avisos = null;
        limparCacheDados("avisos");
        document.getElementById("m-aviso-dvc")?.remove();
        alert("Aviso salvo com sucesso.");

        await renderGestaoAvisosDVC();
        refreshUI();
    } catch (erro) {
        console.error("Erro ao salvar aviso:", erro);
        alert("Não foi possível salvar o aviso.");
    }
}

async function desativarAvisoDVC(avisoId) {
    if (!usuarioEhADM()) return alert("Apenas ADM pode gerenciar avisos.");

    try {
        const refAviso = doc(db, "avisosDVC", avisoId);
        const snap = await getDoc(refAviso);
        if (!snap.exists()) return alert("Aviso não encontrado.");

        await updateDoc(refAviso, {
            ativo: snap.data().ativo === false,
            atualizadoEm: new Date().toISOString()
        });

        if (window.AppCache) window.AppCache.avisos = null;
        limparCacheDados("avisos");
        await renderGestaoAvisosDVC();
        refreshUI();
    } catch (erro) {
        console.error("Erro ao alternar aviso:", erro);
        alert("Não foi possível alterar o aviso.");
    }
}

async function excluirAvisoDVC(avisoId) {
    if (!usuarioEhADM()) return alert("Apenas ADM pode excluir avisos.");
    if (!confirm("Excluir este aviso definitivamente?")) return;

    try {
        await deleteDoc(doc(db, "avisosDVC", avisoId));
        if (window.AppCache) window.AppCache.avisos = null;
        limparCacheDados("avisos");
        await renderGestaoAvisosDVC();
        refreshUI();
    } catch (erro) {
        console.error("Erro ao excluir aviso:", erro);
        alert("Não foi possível excluir the aviso.");
    }
}

async function renderGestaoAvisosDVC() {
    const alvo = document.getElementById("box-gestao-avisos-dvc");
    if (!alvo || !usuarioEhADM()) return "";

    try {
        const avisos = (await carregarAvisosDVCCache(true)).sort(ordenarAvisosDVC);
        const ativos = avisos.filter(avisoEstaAtivoDVC).length;

        alvo.innerHTML = `
            <section class="bg-white border border-gray-100 rounded-3xl p-4 shadow-sm mb-5">
                <div class="flex items-start justify-between gap-3 mb-3">
                    <div>
                        <p class="text-[10px] font-black text-[#990000] uppercase">
                            <i class="fa-solid fa-bullhorn mr-1"></i> Avisos / comunicados DVC
                        </p>
                        <p class="text-[8px] font-bold text-gray-400 uppercase mt-1">
                            Criar, editar, fixar e desativar comunicados
                        </p>
                    </div>
                    <button onclick="abrirModalCriarAvisoDVC()" class="bg-[#990000] text-white rounded-2xl px-4 py-3 text-[9px] font-black uppercase shadow-sm">
                        Criar aviso
                    </button>
                </div>

                <div class="grid grid-cols-2 gap-2 mb-3">
                    <div class="bg-red-50 border border-red-100 rounded-2xl p-3 text-center">
                        <p class="text-2xl font-black text-[#990000]">${ativos}</p>
                        <p class="text-[8px] font-black uppercase text-red-800">Ativos</p>
                    </div>
                    <div class="bg-gray-50 border border-gray-100 rounded-2xl p-3 text-center">
                        <p class="text-2xl font-black text-gray-700">${avisos.length}</p>
                        <p class="text-[8px] font-black uppercase text-gray-500">Total</p>
                    </div>
                </div>

                ${avisos.length ? `
                    <div class="space-y-3 max-h-[520px] overflow-y-auto custom-scroll pr-1">
                        ${avisos.map(aviso => renderCardAvisoDVC(aviso, false, true)).join("")}
                    </div>
                ` : `
                    <div class="bg-gray-50 border border-dashed rounded-2xl p-4 text-center">
                        <p class="text-[10px] font-bold text-gray-400 uppercase">Nenhum aviso criado ainda.</p>
                    </div>
                `}
            </section>
        `;

        return alvo.innerHTML;
    } catch (erro) {
        console.error("Erro ao renderizar gestão de avisos:", erro);
        alvo.innerHTML = "";
        return "";
    }
}

function irParaBlocoMural(idBloco) {
    const bloco = document.getElementById(idBloco);
    const container = document.getElementById('main-content');

    if (!bloco || !container) return;

    const topoBloco = bloco.offsetTop;
    const ajuste = 12;

    container.scrollTo({
        top: topoBloco - ajuste,
        behavior: "smooth"
    });
}

async function renderMural() {
    const c = document.getElementById('main-content');

    const projetoNome = window.PROJETO_ATUAL_DVC?.nome || "DVC";
    const projetoSelo = window.PROJETO_ATUAL_DVC?.selo || "DVC";
    const projetoLogo = window.PROJETO_ATUAL_DVC?.logo || "Loki2.webp";
    const projetoLogoFundoClaro = window.PROJETO_ATUAL_DVC?.logoFundoClaro || "Loki1.webp";
    const avisosMuralHtml = await renderAvisosMuralDVC();

    c.innerHTML = `
        <div class="bg-gradient-to-br from-gray-950 via-gray-900 to-[#990000] text-white p-5 rounded-3xl mb-5 shadow-xl relative overflow-hidden border border-white/10">
            <div class="absolute -right-10 -bottom-12 opacity-10 pointer-events-none">
                <img src="${projetoLogo}" class="w-48 h-48 object-contain">
            </div>
            <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.16),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.08)_0,transparent_38%)] pointer-events-none"></div>

            <div class="relative z-10">
                <div class="flex items-center justify-between gap-3 mb-4">
                    <div class="flex items-center gap-3">
                        <div class="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center p-2">
                            <img src="${projetoLogo}" class="w-full h-full object-contain">
                        </div>

                        <div>
                            <p class="text-[8px] font-black uppercase text-white/60">
                                Mural oficial
                            </p>

                            <h3 class="text-xl font-black uppercase tracking-wide leading-none">
                                ${projetoNome}
                            </h3>
                        </div>
                    </div>

                    <div class="bg-white text-[#990000] px-3 py-1 rounded-full shadow-sm">
                        <span class="text-[9px] font-black uppercase">
                            Selo ${projetoSelo}
                        </span>
                    </div>
                </div>

                <p class="text-[10px] font-semibold text-white/75 leading-relaxed">
                Acompanhe os avisos do projeto, próximos compromissos, jogos organizados no treino e aniversariantes do mês.
                </p>

                <div class="grid grid-cols-3 gap-2 mt-5">
                    <button 
                        onclick="irParaBlocoMural('mural-sequencia-jogos')" 
                        class="min-h-[76px] bg-white/10 hover:bg-white/20 border border-white/15 rounded-2xl px-2 py-3 text-center active:scale-95 transition backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                        <span class="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
                            <i class="fa-solid fa-list-ol text-white text-sm"></i>
                        </span>
                        <p class="text-[9px] leading-none font-black uppercase text-white/80">Jogos</p>
                    </button>

                    <button 
                        onclick="irParaBlocoMural('mural-proximo-jogo')" 
                        class="min-h-[76px] bg-white/10 hover:bg-white/20 border border-white/15 rounded-2xl px-2 py-3 text-center active:scale-95 transition backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                        <span class="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
                            <i class="fa-solid fa-volleyball text-white text-sm"></i>
                        </span>
                        <p class="text-[9px] leading-none font-black uppercase text-white/80">Amistoso</p>
                    </button>

                    <button 
                        onclick="irParaBlocoMural('mural-aniversariantes')" 
                        class="min-h-[76px] bg-white/10 hover:bg-white/20 border border-white/15 rounded-2xl px-2 py-3 text-center active:scale-95 transition backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                        <span class="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
                            <i class="fa-solid fa-cake-candles text-white text-sm"></i>
                        </span>
                        <p class="text-[9px] leading-none font-black uppercase text-white/80">Aniversários</p>
                    </button>
                </div>
            </div>
        </div>
        ${avisosMuralHtml}
        <div id="mural-sequencia-jogos" class="mb-5 hidden"></div>
        <div id="mural-proximo-jogo" class="mb-5">
            <p class="text-[10px] font-black text-[#990000] uppercase mb-2">
                <i class="fa-solid fa-volleyball mr-1"></i> Próximo amistoso
            </p>

            <div class="bg-white border rounded-xl p-4 text-center">
                <p class="text-[10px] text-gray-400 font-bold uppercase">
                    Carregando próximo amistoso...
                </p>
            </div>
        </div>

        <div id="mural-aniversariantes" class="mb-5">
            <p class="text-[10px] font-black text-[#990000] uppercase mb-2">
                <i class="fa-solid fa-cake-candles mr-1"></i> Aniversariantes do mês
            </p>

            <div class="bg-white border rounded-xl p-4 text-center">
                <p class="text-[10px] text-gray-400 font-bold uppercase">
                    Carregando aniversariantes...
                </p>
            </div>
        </div>
    `;

    if (typeof window.carregarJogosTreinoNoMural === 'function') {
        await window.carregarJogosTreinoNoMural();
    }

    try {
        const agora = new Date();

        // =========================
        // 1. PRÓXIMO AMISTOSO
        // =========================
        let eventosSnap = [];
        if (typeof window.carregarEventosCacheMockDVC === 'function') {
            eventosSnap = await window.carregarEventosCacheMockDVC();
        }

        let jogos = [];

        eventosSnap.forEach(docEvento => {
            const ev = docEvento.data();

            if (ev.tipo !== "jogo") return;
            if (ev.status === "concluido") return;

            const dataJogo = new Date(ev.data);

            if (isNaN(dataJogo.getTime())) return;
            if (dataJogo < agora) return;

            jogos.push({
                id: docEvento.id,
                ...ev
            });
        });

        jogos.sort((a, b) => new Date(a.data) - new Date(b.data));

        const proximoJogo = jogos[0];

        const jogoHtml = proximoJogo ? `
            <div class="bg-white border border-gray-100 rounded-3xl p-4 shadow-sm overflow-hidden relative">
                <div class="absolute top-0 left-0 right-0 h-1 bg-[#990000]"></div>

                <div class="flex items-center justify-between gap-3 mb-4">
                    <div>
                        <span class="inline-flex items-center gap-1 bg-[#990000] text-white text-[8px] font-black px-2.5 py-1 rounded-full uppercase">
                            <i class="fa-solid fa-trophy text-[8px]"></i>
                            Match day
                        </span>
                        <p class="text-[10px] font-black text-gray-400 uppercase mt-2">
                            Próximo compromisso
                        </p>
                    </div>

                    <p class="text-[9px] font-black text-[#990000] uppercase text-right leading-tight">
                        ${proximoJogo.titulo || "Jogo / Amistoso"}
                    </p>
                </div>

                <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-3 bg-gray-50 border border-gray-100 rounded-2xl p-4">
                    <div class="text-center min-w-0">
                        <div class="mx-auto w-14 h-14 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center p-2">
                            <img src="${projetoLogoFundoClaro}" class="w-full h-full object-contain">
                        </div>
                        <p class="text-[10px] font-black text-gray-950 uppercase mt-2 truncate">DVC</p>
                    </div>

                    <div class="w-11 h-11 rounded-full bg-gray-950 text-white flex items-center justify-center shadow-md border border-[#990000]/30">
                        <span class="text-[11px] font-black uppercase">VS</span>
                    </div>

                    <div class="text-center min-w-0">
                        <div class="mx-auto w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center">
                            <i class="fa-solid fa-shield-halved text-[#990000] text-xl"></i>
                        </div>
                        <p class="text-[10px] font-black text-gray-950 uppercase mt-2 truncate">
                            ${proximoJogo.adversario || "Adversário"}
                        </p>
                    </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
                    <div class="bg-gray-50 border border-gray-100 rounded-2xl px-3 py-2 flex items-center gap-2">
                        <i class="fa-regular fa-calendar text-[#990000] text-xs"></i>
                        <span class="text-[10px] font-bold text-gray-700">${new Date(proximoJogo.data).toLocaleDateString('pt-BR')}</span>
                    </div>

                    <div class="bg-red-50 border border-red-100 rounded-2xl px-3 py-2 flex items-center gap-2">
                        <i class="fa-regular fa-clock text-[#990000] text-xs"></i>
                        <span class="text-[10px] font-bold text-gray-700">${new Date(proximoJogo.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div class="bg-gray-50 border border-gray-100 rounded-2xl px-3 py-2 flex items-center gap-2 min-w-0">
                        <i class="fa-solid fa-location-dot text-[#990000] text-xs"></i>
                        <span class="text-[10px] font-bold text-gray-700 truncate">${proximoJogo.local || "Local não informado"}</span>
                    </div>
                </div>

                ${proximoJogo.equipe ? `
                    <div class="bg-gray-950 text-white rounded-2xl px-3 py-2 mt-3 flex items-center gap-2">
                        <i class="fa-solid fa-people-group text-red-200 text-xs"></i>
                        <span class="text-[10px] font-black uppercase truncate">${proximoJogo.equipe}</span>
                    </div>
                ` : ''}

                <div class="bg-[#990000] text-white rounded-2xl p-3 mt-4 text-center">
                    <p class="text-[10px] font-black uppercase">
                        Venha apoiar o DVC na torcida!
                    </p>
                </div>
            </div>
        ` : `
            <div class="bg-white border border-dashed rounded-xl p-4 text-center">
                <p class="text-[10px] text-gray-400 font-bold uppercase">
                    Nenhum amistoso futuro cadastrado.
                </p>
            </div>
        `;

        const elProximoJogo = document.getElementById('mural-proximo-jogo');
        if (elProximoJogo) {
            elProximoJogo.innerHTML = `
                <p class="text-[10px] font-black text-[#990000] uppercase mb-2">
                    <i class="fa-solid fa-volleyball mr-1"></i> Próximo amistoso
                </p>
                ${jogoHtml}
            `;
        }

        // =========================
        // 2. ANIVERSARIANTES DO MÊS
        // =========================
        let usersSnap = [];
        if (typeof window.carregarUsuariosCacheMockDVC === 'function') {
            usersSnap = await window.carregarUsuariosCacheMockDVC();
        }
        const mesAtual = agora.getMonth() + 1;

        let aniversariantes = [];

        usersSnap.forEach(docUsuario => {
            const user = docUsuario.data();

            if (user.status !== "Ativo") return;
            if (typeof window.ehResponsavelTecnico === 'function' && window.ehResponsavelTecnico(user)) return;
            if (!user.nascimento) return;

            const partes = user.nascimento.split("-");
            if (partes.length < 3) return;

            const mesNascimento = Number(partes[1]);
            const diaNascimento = Number(partes[2]);

            if (mesNascimento === mesAtual) {
                aniversariantes.push({
                    nome: user.nome || "Sem nome",
                    dia: diaNascimento,
                    nascimento: user.nascimento
                });
            }
        });

        aniversariantes.sort((a, b) => a.dia - b.dia);

        const aniversariantesHtml = aniversariantes.length > 0 ? `
            <div class="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
                ${aniversariantes.map(aniv => `
                    <div class="flex items-center gap-3 p-3 border-b border-gray-100 last:border-b-0">
                        <div class="w-11 h-11 rounded-full bg-gradient-to-br from-[#990000] to-gray-950 text-white flex items-center justify-center font-black text-sm shadow-sm">
                            ${String(aniv.dia).padStart(2, "0")}
                        </div>

                        <div class="flex-1">
                            <p class="text-xs font-semibold text-gray-900 uppercase tracking-wide">
                                ${aniv.nome}
                            </p>
                            <p class="text-[9px] font-bold text-gray-400 uppercase">
                                Aniversário neste mês
                            </p>
                        </div>

                        <span class="w-9 h-9 rounded-full bg-red-50 text-[#990000] flex items-center justify-center">
                            <i class="fa-solid fa-cake-candles text-sm"></i>
                        </span>
                    </div>
                `).join('')}
            </div>
        ` : `
            <div class="bg-white border border-dashed rounded-xl p-4 text-center">
                <p class="text-[10px] text-gray-400 font-bold uppercase">
                    Nenhum aniversariante ativo neste mês.
                </p>
            </div>
        `;

        const elAniversariantes = document.getElementById('mural-aniversariantes');
        if (elAniversariantes) {
            elAniversariantes.innerHTML = `
                <p class="text-[10px] font-black text-[#990000] uppercase mb-2">
                    <i class="fa-solid fa-cake-candles mr-1"></i> Aniversariantes do mês
                </p>
                ${aniversariantesHtml}
            `;
        }

    } catch (e) {
        console.error("Erro ao carregar mural", e);

        c.innerHTML += `
            <div class="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                <p class="text-xs font-bold text-red-700">
                    Não foi possível carregar o mural agora.
                </p>
            </div>
        `;
    }
}

// Bind to window for HTML onclick compatibility and external files (e.g. index.html)
window.carregarAvisosDVCCache = carregarAvisosDVCCache;
window.avisoEstaAtivoDVC = avisoEstaAtivoDVC;
window.avisoEhParaUsuarioDVC = avisoEhParaUsuarioDVC;
window.renderCardAvisoDVC = renderCardAvisoDVC;
window.renderAvisosHomeDVC = renderAvisosHomeDVC;
window.renderAvisosMuralDVC = renderAvisosMuralDVC;
window.abrirModalCriarAvisoDVC = abrirModalCriarAvisoDVC;
window.salvarAvisoDVC = salvarAvisoDVC;
window.desativarAvisoDVC = desativarAvisoDVC;
window.excluirAvisoDVC = excluirAvisoDVC;
window.renderGestaoAvisosDVC = renderGestaoAvisosDVC;
window.irParaBlocoMural = irParaBlocoMural;
window.renderMural = renderMural;

export {
    CATEGORIAS_AVISOS_DVC,
    PRIORIDADES_AVISOS_DVC,
    carregarAvisosDVCCache,
    chaveMetaAvisoDVC,
    chavePrioridadeAvisoDVC,
    avisoEstaAtivoDVC,
    avisoEhParaUsuarioDVC,
    ordenarAvisosDVC,
    renderCardAvisoDVC,
    renderAvisosHomeDVC,
    renderAvisosMuralDVC,
    abrirModalCriarAvisoDVC,
    salvarAvisoDVC,
    desativarAvisoDVC,
    excluirAvisoDVC,
    renderGestaoAvisosDVC,
    irParaBlocoMural,
    renderMural
};
