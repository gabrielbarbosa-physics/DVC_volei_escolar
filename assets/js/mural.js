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

import { db, auth, getDocs, collection, doc, getDoc, setDoc, updateDoc, deleteDoc, arrayUnion } from "./firebase.js";
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
    geral: { label: "Geral", icone: "fa-bullhorn", classe: "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700" },
    treino: { label: "Treino", icone: "fa-volleyball", classe: "bg-red-50 dark:bg-red-950/20 text-[#990000] dark:text-red-400 border-red-100 dark:border-red-900/50" },
    financeiro: { label: "Financeiro", icone: "fa-file-invoice-dollar", classe: "bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border-green-100 dark:border-green-900/50" },
    uniforme: { label: "Uniforme", icone: "fa-shirt", classe: "bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-900/50" },
    campeonato: { label: "Campeonato", icone: "fa-trophy", classe: "bg-yellow-50 dark:bg-yellow-950/20 text-yellow-800 dark:text-yellow-400 border-yellow-100 dark:border-yellow-900/50" },
    documentos: { label: "Documentos", icone: "fa-file-lines", classe: "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/50" },
    urgente: { label: "Urgente", icone: "fa-triangle-exclamation", classe: "bg-red-100 dark:bg-red-950/40 text-[#990000] dark:text-red-400 border-red-200 dark:border-red-900/60" }
};

const PRIORIDADES_AVISOS_DVC = {
    baixa: { label: "Baixa", peso: 1, classe: "bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-100 dark:border-gray-700" },
    normal: { label: "Normal", peso: 2, classe: "bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-800" },
    alta: { label: "Alta", peso: 3, classe: "bg-yellow-50 dark:bg-yellow-950/20 text-yellow-800 dark:text-yellow-400 border-yellow-100 dark:border-yellow-900/50" },
    urgente: { label: "Urgente", peso: 4, classe: "bg-red-50 dark:bg-red-950/20 text-[#990000] dark:text-red-400 border-red-100 dark:border-red-900/50" }
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

window.verSequenciaJogosBanner = function() {
    irParaBlocoMural('mural-sequencia-jogos');
    setTimeout(() => {
        const detailsList = document.querySelectorAll('#mural-sequencia-jogos details');
        detailsList.forEach(d => {
            if (!d.open) d.open = true;
        });
    }, 400);
};

window.toggleComunicadoMuralDVC = function (avisoId, botao, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    const mensagem = document.getElementById(`mensagem-aviso-mural-${avisoId}`);

    if (!mensagem || !botao) return;

    const estaExpandido = botao.getAttribute("aria-expanded") === "true";

    if (estaExpandido) {
        mensagem.classList.add("line-clamp-3");
        mensagem.style.webkitLineClamp = "3";
        mensagem.style.overflow = "hidden";

        botao.textContent = "LER COMUNICADO";
        botao.setAttribute("aria-expanded", "false");
    } else {
        mensagem.classList.remove("line-clamp-3");
        mensagem.style.webkitLineClamp = "unset";
        mensagem.style.overflow = "visible";

        botao.textContent = "RECOLHER COMUNICADO";
        botao.setAttribute("aria-expanded", "true");
    }
};

function renderCardAvisoDVC(aviso = {}, compacto = false, admin = false, ehDestaque = false) {
    const categoriaKey = chaveMetaAvisoDVC(aviso.categoria);
    const prioridadeKey = chavePrioridadeAvisoDVC(aviso.prioridade);
    const categoria = CATEGORIAS_AVISOS_DVC[categoriaKey] || CATEGORIAS_AVISOS_DVC.geral;
    const prioridade = PRIORIDADES_AVISOS_DVC[prioridadeKey] || PRIORIDADES_AVISOS_DVC.normal;
    const mensagem = escaparHtml(aviso.mensagem || "");
    const textoMensagem = compacto && mensagem.length > 150 ? `${mensagem.slice(0, 150)}...` : mensagem;
    const ativo = avisoEstaAtivoDVC(aviso);

    const isCardDestaque = ehDestaque && !admin;

    // DVC MURAL — DESTAQUE: diferencia o comunicado principal dos cards operacionais.
    const cardClass = isCardDestaque 
        ? "bg-gradient-to-br from-white via-white to-red-50 dark:from-gray-900 dark:via-gray-900 dark:to-red-950/20 border border-red-200 dark:border-red-900/60 border-l-4 border-l-[#990000] rounded-2xl p-4 shadow-md relative overflow-hidden transition-colors duration-200"
        : "bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm transition-colors duration-200";

    const titleClass = isCardDestaque
        ? "text-[15px] font-black text-slate-950 dark:text-gray-100 uppercase leading-tight mt-2"
        : "text-sm font-black text-gray-900 dark:text-gray-200 uppercase leading-tight mt-2";

    const msgClass = isCardDestaque
        ? "text-[11px] text-gray-600 dark:text-gray-300 font-medium leading-relaxed mt-2 line-clamp-3 msg-aviso-dvc"
        : "text-[10px] text-gray-500 dark:text-gray-400 font-semibold leading-relaxed mt-2";

    const roundedIcon = isCardDestaque ? "rounded-xl" : "rounded-2xl";

    let headerChips = "";
    if (isCardDestaque) {
        const destaqueLabel = aviso.fixado ? "Comunicado Fixado" : "Alta Prioridade";
        headerChips = `
            <span class="inline-flex items-center justify-center whitespace-nowrap rounded-full px-2.5 py-1 text-[9px] font-black uppercase border bg-[#990000] text-white border-[#990000]">
                ${destaqueLabel}
            </span>
            <span class="inline-flex items-center justify-center gap-1 whitespace-nowrap px-1 py-1 text-[9px] font-bold uppercase text-gray-500">
                <i class="fa-solid ${categoria.icone} text-[9px]"></i>
                ${categoria.label}
            </span>
            ${!ativo ? renderBadgeDVC("Inativo/expirado", "neutro") : ""}
        `;
    } else {
        headerChips = `
            <span class="inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[8px] font-black uppercase border ${categoria.classe}">
                <i class="fa-solid ${categoria.icone} text-[8px]"></i>
                ${categoria.label}
            </span>
            <span class="inline-flex items-center justify-center whitespace-nowrap rounded-full px-2.5 py-1 text-[8px] font-black uppercase border ${prioridade.classe}">
                ${prioridade.label}
            </span>
            ${aviso.fixado ? renderBadgeDVC("Fixado", "vermelho") : ""}
            ${!ativo ? renderBadgeDVC("Inativo/expirado", "neutro") : ""}
        `;
    }

    // DVC MURAL — REVISÃO: expande e recolhe apenas o texto do card selecionado.
    // DVC MURAL — REVISÃO: impede conflito entre expansão e clique do card.
    const readMoreAction = isCardDestaque
        ? `<button type="button" aria-expanded="false" aria-controls="mensagem-aviso-mural-${aviso.id}" onclick="window.toggleComunicadoMuralDVC('${aviso.id}', this, event)" class="mt-2 text-[#990000] text-[10px] font-black uppercase tracking-wide hover:underline text-left">Ler comunicado</button>`
        : "";

    const dtCriadoFormatada = aviso.criadoEm ? new Date(aviso.criadoEm).toLocaleDateString("pt-BR") : "";
    const dtExpiraFormatada = aviso.expiraEm ? aviso.expiraEm.split("-").reverse().join("/") : "";

    const logoMarcaDagua = window.PROJETO_ATUAL_DVC?.logoFundoClaro || window.PROJETO_ATUAL_DVC?.logo || "assets/img/loki1.webp";
    const watermarkHtml = isCardDestaque
        ? `<img src="${logoMarcaDagua}" alt="" aria-hidden="true" class="pointer-events-none select-none absolute z-0 object-contain" style="bottom: -0.25rem; right: 0.5rem; width: 4rem; height: auto; opacity: 0.15;" />`
        : "";

    return `
        <article class="${cardClass}">
            ${watermarkHtml}
            <div class="relative z-10">
                <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                        <div class="flex flex-wrap items-center gap-1">
                            ${headerChips}
                        </div>
                        <h3 class="${titleClass}">${escaparHtml(aviso.titulo || "Aviso DVC")}</h3>
                    </div>
                    <div class="w-10 h-10 ${roundedIcon} bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                        <i class="fa-solid ${categoria.icone} text-[#990000]"></i>
                    </div>
                </div>

                <p id="mensagem-aviso-mural-${aviso.id}" class="${msgClass}" ${isCardDestaque ? 'style="display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;"' : ''}>${textoMensagem}</p>
                ${readMoreAction}
                
                <p class="text-[8px] font-bold uppercase text-gray-400 dark:text-gray-500 mt-2">
                    ${dtCriadoFormatada ? `Publicado em ${dtCriadoFormatada}` : ""}
                    ${dtExpiraFormatada ? ` &bull; Válido até ${dtExpiraFormatada}` : ""}
                </p>

                ${aviso.link ? `
                    <a href="${escaparHtml(aviso.link)}" target="_blank" rel="noopener" class="mt-3 inline-flex items-center justify-center w-full rounded-2xl bg-[#990000] text-white py-3 text-[10px] font-black uppercase shadow-sm">
                        ${escaparHtml(aviso.botaoTexto || "Abrir link")}
                    </a>
                ` : ""}

                ${admin ? `
                    <div class="grid grid-cols-3 gap-2 mt-3">
                        <button onclick="abrirModalCriarAvisoDVC('${safeEditParam(aviso.id)}')" class="bg-gray-900 dark:bg-gray-800 text-white rounded-xl py-2 text-[8px] font-black uppercase cursor-pointer">Editar</button>
                        <button onclick="desativarAvisoDVC('${safeEditParam(aviso.id)}')" class="bg-yellow-50 dark:bg-yellow-950/20 text-yellow-800 dark:text-yellow-400 border border-yellow-100 dark:border-yellow-900/50 rounded-xl py-2 text-[8px] font-black uppercase cursor-pointer">${aviso.ativo === false ? "Ativar" : "Desativar"}</button>
                        <button onclick="excluirAvisoDVC('${safeEditParam(aviso.id)}')" class="bg-white dark:bg-gray-950 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-950 rounded-xl py-2 text-[8px] font-black uppercase cursor-pointer">Excluir</button>
                    </div>
                ` : ""}
            </div>
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
            <section class="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-4 shadow-sm transition-colors duration-200">
                <div class="flex items-center justify-between gap-3 mb-3">
                    <div>
                        <p class="text-[10px] font-black uppercase text-[#990000]">Avisos importantes</p>
                        <p class="text-[9px] font-semibold text-gray-500 dark:text-gray-400">Comunicados ativos da gestão DVC.</p>
                    </div>
                    <button onclick="changeTab('mural')" class="text-[8px] font-black uppercase text-[#990000] cursor-pointer">Ver todos</button>
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

        // DVC MURAL — REVISÃO: localiza o primeiro aviso realmente elegível para destaque.
        const indiceAvisoDestaque = avisos.findIndex(aviso => {
            const prioridade = typeof chavePrioridadeAvisoDVC === "function"
                ? chavePrioridadeAvisoDVC(aviso.prioridade)
                : String(aviso?.prioridade || "").trim().toLowerCase();

            return aviso?.fixado === true || prioridade === "alta" || prioridade === "urgente";
        });

        const temDestaque = indiceAvisoDestaque !== -1;
        const plural = avisos.length === 1 ? "comunicado ativo" : "comunicados ativos";

        return `
            <section id="mural-comunicados-dvc" class="mb-6">
                <div class="flex items-start justify-between gap-3 mb-2">
                    <div>
                        <p class="text-[10px] font-black text-[#990000] uppercase">
                            <i class="fa-solid fa-bullhorn mr-1"></i> ${temDestaque ? "Comunicado em destaque" : "Comunicados DVC"}
                        </p>
                        ${temDestaque ? `<p class="text-[8px] font-semibold text-gray-500 uppercase mt-0.5">Informações importantes do projeto</p>` : ""}
                    </div>
                    <span class="text-[8px] font-black uppercase text-gray-400 mt-0.5 whitespace-nowrap">${avisos.length} ${temDestaque ? plural : "ativo(s)"}</span>
                </div>
                <div class="space-y-3">
                    ${avisos.map((aviso, i) => {
                        const ehDestaque = temDestaque && i === indiceAvisoDestaque;
                        return renderCardAvisoDVC(aviso, false, false, ehDestaque);
                    }).join("")}
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
                <div class="bg-white dark:bg-gray-900 w-full max-w-sm rounded-3xl shadow-2xl max-h-[88vh] overflow-y-auto transition-colors duration-200">
                    <div class="bg-gradient-to-r from-gray-950 via-[#4b0d0d] to-[#990000] text-white p-4 flex items-start justify-between gap-3">
                        <div>
                            <p class="text-[8px] font-black uppercase text-white/60">Comunicados DVC</p>
                            <h3 class="text-sm font-black uppercase">${avisoId ? "Editar aviso" : "Criar aviso"}</h3>
                        </div>
                        <button onclick="document.getElementById('m-aviso-dvc')?.remove()" class="w-9 h-9 rounded-full bg-white/10 border border-white/20 cursor-pointer">
                            <i class="fa-solid fa-xmark text-xs"></i>
                        </button>
                    </div>

                    <div class="p-4 space-y-3">
                        <div>
                            <label class="text-[8px] font-black uppercase text-gray-400 dark:text-gray-500">Título</label>
                            <input id="aviso-titulo-dvc" value="${escaparHtml(aviso.titulo || "")}" class="w-full border dark:border-gray-800 rounded-2xl p-3 text-xs font-semibold bg-gray-50 dark:bg-gray-950 dark:text-gray-100 outline-none">
                        </div>
                        <div>
                            <label class="text-[8px] font-black uppercase text-gray-400 dark:text-gray-500">Mensagem</label>
                            <textarea id="aviso-mensagem-dvc" class="w-full min-h-[120px] border dark:border-gray-800 rounded-2xl p-3 text-xs font-semibold bg-gray-50 dark:bg-gray-950 dark:text-gray-100 outline-none">${escaparHtml(aviso.mensagem || "")}</textarea>
                        </div>
                        <div class="grid grid-cols-2 gap-2">
                            <div>
                                <label class="text-[8px] font-black uppercase text-gray-400 dark:text-gray-500">Categoria</label>
                                <select id="aviso-categoria-dvc" class="w-full border dark:border-gray-800 rounded-2xl p-3 text-[10px] font-black uppercase bg-gray-50 dark:bg-gray-950 dark:text-gray-100 outline-none">
                                    ${["Geral", "Treino", "Financeiro", "Uniforme", "Campeonato", "Documentos", "Urgente"].map(opcao => `<option value="${opcao}" ${String(aviso.categoria || "Geral") === opcao ? "selected" : ""}>${opcao}</option>`).join("")}
                                </select>
                            </div>
                            <div>
                                <label class="text-[8px] font-black uppercase text-gray-400 dark:text-gray-500">Prioridade</label>
                                <select id="aviso-prioridade-dvc" class="w-full border dark:border-gray-800 rounded-2xl p-3 text-[10px] font-black uppercase bg-gray-50 dark:bg-gray-950 dark:text-gray-100 outline-none">
                                    ${["Baixa", "Normal", "Alta", "Urgente"].map(opcao => `<option value="${opcao}" ${String(aviso.prioridade || "Normal") === opcao ? "selected" : ""}>${opcao}</option>`).join("")}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label class="text-[8px] font-black uppercase text-gray-400 dark:text-gray-500">Público</label>
                            <select id="aviso-publico-dvc" class="w-full border dark:border-gray-800 rounded-2xl p-3 text-[10px] font-black uppercase bg-gray-50 dark:bg-gray-950 dark:text-gray-100 outline-none">
                                ${["Todos", "Atletas", "Equipe Técnica", "Masculino", "Feminino", "Sub-17", "Adulto"].map(opcao => `<option value="${opcao}" ${String(aviso.publico || "Todos") === opcao ? "selected" : ""}>${opcao}</option>`).join("")}
                            </select>
                        </div>
                        <div class="grid grid-cols-2 gap-2">
                            <label class="bg-gray-50 dark:bg-gray-950 border dark:border-gray-800 rounded-2xl p-3 text-[9px] font-black uppercase text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                <input id="aviso-fixado-dvc" type="checkbox" class="accent-[#990000]" ${aviso.fixado ? "checked" : ""}>
                                Fixado
                            </label>
                            <label class="bg-gray-50 dark:bg-gray-950 border dark:border-gray-800 rounded-2xl p-3 text-[9px] font-black uppercase text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                <input id="aviso-ativo-dvc" type="checkbox" class="accent-[#990000]" ${aviso.ativo === false ? "" : "checked"}>
                                Ativo
                            </label>
                        </div>
                        <div>
                            <label class="text-[8px] font-black uppercase text-gray-400 dark:text-gray-500">Link opcional</label>
                            <input id="aviso-link-dvc" value="${escaparHtml(aviso.link || "")}" class="w-full border dark:border-gray-800 rounded-2xl p-3 text-xs font-semibold bg-gray-50 dark:bg-gray-950 dark:text-gray-100 outline-none" placeholder="https://...">
                        </div>
                        <div class="grid grid-cols-2 gap-2">
                            <div>
                                <label class="text-[8px] font-black uppercase text-gray-400 dark:text-gray-500">Texto do botão</label>
                                <input id="aviso-botao-dvc" value="${escaparHtml(aviso.botaoTexto || "")}" class="w-full border dark:border-gray-800 rounded-2xl p-3 text-xs font-semibold bg-gray-50 dark:bg-gray-950 dark:text-gray-100 outline-none" placeholder="Abrir link">
                            </div>
                            <div>
                                <label class="text-[8px] font-black uppercase text-gray-400 dark:text-gray-500">Expira em</label>
                                <input id="aviso-expira-dvc" type="date" value="${escaparHtml(aviso.expiraEm || "")}" class="w-full border dark:border-gray-800 rounded-2xl p-3 text-xs font-semibold bg-gray-50 dark:bg-gray-950 dark:text-gray-100 outline-none">
                            </div>
                        </div>
                        <button onclick="salvarAvisoDVC('${safeEditParam(avisoId || "")}')" class="w-full bg-[#990000] text-white py-3 rounded-2xl text-[10px] font-black uppercase shadow-sm cursor-pointer">
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
            <section class="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-4 shadow-sm mb-5 transition-colors duration-200">
                <div class="flex items-start justify-between gap-3 mb-3">
                    <div>
                        <p class="text-[10px] font-black text-[#990000] uppercase">
                            <i class="fa-solid fa-bullhorn mr-1"></i> Avisos / comunicados DVC
                        </p>
                        <p class="text-[8px] font-bold text-gray-400 dark:text-gray-500 uppercase mt-1">
                            Criar, editar, fixar e desativar comunicados
                        </p>
                    </div>
                    <button onclick="abrirModalCriarAvisoDVC()" class="bg-[#990000] text-white rounded-2xl px-4 py-3 text-[9px] font-black uppercase shadow-sm cursor-pointer">
                        Criar aviso
                    </button>
                </div>

                <div class="grid grid-cols-2 gap-2 mb-3">
                    <div class="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 rounded-2xl p-3 text-center">
                        <p class="text-2xl font-black text-[#990000]">${ativos}</p>
                        <p class="text-[8px] font-black uppercase text-red-800 dark:text-red-400">Ativos</p>
                    </div>
                    <div class="bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-2xl p-3 text-center">
                        <p class="text-2xl font-black text-gray-700 dark:text-gray-200">${avisos.length}</p>
                        <p class="text-[8px] font-black uppercase text-gray-500 dark:text-gray-400">Total</p>
                    </div>
                </div>

                ${avisos.length ? `
                    <div class="space-y-3 max-h-[520px] overflow-y-auto custom-scroll pr-1">
                        ${avisos.map(aviso => renderCardAvisoDVC(aviso, false, true)).join("")}
                    </div>
                ` : `
                    <div class="bg-gray-50 dark:bg-gray-950 border border-dashed dark:border-gray-800 rounded-2xl p-4 text-center">
                        <p class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">Nenhum aviso criado ainda.</p>
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
    const projetoLogo = window.PROJETO_ATUAL_DVC?.logo || "assets/img/loki2.webp";
    const projetoLogoFundoClaro = window.PROJETO_ATUAL_DVC?.logoFundoClaro || "assets/img/loki1.webp";


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

                    <div class="bg-white text-[#990000] px-3 py-1 rounded-full shadow-sm border border-transparent dark-mural-badge">
                        <span class="text-[9px] font-black uppercase">
                            Selo ${projetoSelo}
                        </span>
                    </div>
                </div>

                <p class="text-[10px] font-semibold text-white/75 leading-relaxed">
                Acompanhe os avisos do projeto, próximos compromissos, jogos organizados no treino e aniversariantes do mês.
                </p>

                <div class="flex flex-row items-center gap-2 mt-4 overflow-x-auto [&::-webkit-scrollbar]:hidden" style="scrollbar-width: none;">
                    <button 
                        onclick="irParaBlocoMural('mural-sequencia-jogos')" 
                        class="bg-white/10 hover:bg-white/20 border border-white/15 rounded-full px-3 py-1.5 flex items-center gap-1.5 active:scale-95 transition shrink-0">
                        <i class="fa-solid fa-list-ol text-white text-[10px]"></i>
                        <span class="text-[9px] font-black uppercase tracking-wider text-white/90">Jogos</span>
                    </button>

                    <button 
                        onclick="irParaBlocoMural('mural-proximo-jogo')" 
                        class="bg-white/10 hover:bg-white/20 border border-white/15 rounded-full px-3 py-1.5 flex items-center gap-1.5 active:scale-95 transition shrink-0">
                        <i class="fa-solid fa-volleyball text-white text-[10px]"></i>
                        <span class="text-[9px] font-black uppercase tracking-wider text-white/90">Amistoso</span>
                    </button>

                    <button 
                        onclick="irParaBlocoMural('mural-aniversariantes')" 
                        class="bg-white/10 hover:bg-white/20 border border-white/15 rounded-full px-3 py-1.5 flex items-center gap-1.5 active:scale-95 transition shrink-0">
                        <i class="fa-solid fa-cake-candles text-white text-[10px]"></i>
                        <span class="text-[9px] font-black uppercase tracking-wider text-white/90">Aniversários</span>
                    </button>
                </div>

                <div id="banner-dynamic-sequencia" class="hidden"></div>
            </div>
        </div>
        <div id="mural-proximo-jogo" class="mb-5">
            <p class="text-[10px] font-black text-[#990000] dark:text-red-400 uppercase mb-2">
                <i class="fa-solid fa-volleyball mr-1"></i> Próximo amistoso
            </p>

            <div class="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-xl p-4 text-center transition-colors duration-200">
                <p class="text-[10px] text-gray-400 dark:text-gray-550 font-bold uppercase">
                    Carregando próximo amistoso...
                </p>
            </div>
        </div>
        <div id="mural-sequencia-jogos" class="mb-5 hidden"></div>
        <div id="mural-aniversariantes" class="mb-5">
            <p class="text-[10px] font-black text-[#990000] dark:text-red-400 uppercase mb-2">
                <i class="fa-solid fa-cake-candles mr-1"></i> Aniversariantes do mês
            </p>

            <div class="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-xl p-4 text-center transition-colors duration-200">
                <p class="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase">
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
            <div class="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-4 shadow-sm overflow-hidden relative transition-colors duration-200">
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

                <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-3 bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-2xl p-4">
                    <div class="text-center min-w-0">
                        <div class="mx-auto w-14 h-14 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-center p-2">
                            <img src="${projetoLogoFundoClaro}" class="w-full h-full object-contain light-logo">
                            <img src="${projetoLogo}" class="w-full h-full object-contain p-0.5 dark-logo">
                        </div>
                        <p class="text-[10px] font-black text-gray-950 dark:text-gray-100 uppercase mt-2 truncate">DVC</p>
                    </div>

                    <div class="w-11 h-11 rounded-full bg-gray-950 dark:bg-gray-800 text-white flex items-center justify-center shadow-md border border-[#990000]/30">
                        <span class="text-[11px] font-black uppercase">VS</span>
                    </div>

                    <div class="text-center min-w-0">
                        <div class="mx-auto w-14 h-14 rounded-2xl bg-red-50 dark:bg-gray-900 border border-red-100 dark:border-gray-800 flex items-center justify-center">
                            <i class="fa-solid fa-shield-halved text-[#990000] dark:text-red-400 text-xl"></i>
                        </div>
                        <p class="text-[10px] font-black text-gray-950 dark:text-gray-100 uppercase mt-2 truncate">
                            ${proximoJogo.adversario || "Adversário"}
                        </p>
                    </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
                    <div class="bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-2xl px-3 py-2 flex items-center gap-2">
                        <i class="fa-regular fa-calendar text-[#990000] text-xs"></i>
                        <span class="text-[10px] font-bold text-gray-700 dark:text-gray-300">${new Date(proximoJogo.data).toLocaleDateString('pt-BR')}</span>
                    </div>

                    <div class="bg-red-50 dark:bg-gray-950 border border-red-100 dark:border-gray-800 rounded-2xl px-3 py-2 flex items-center gap-2">
                        <i class="fa-regular fa-clock text-[#990000] dark:text-red-400 text-xs"></i>
                        <span class="text-[10px] font-bold text-gray-700 dark:text-gray-100">${new Date(proximoJogo.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div class="bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-2xl px-3 py-2 flex items-center gap-2 min-w-0">
                        <i class="fa-solid fa-location-dot text-[#990000] text-xs"></i>
                        <span class="text-[10px] font-bold text-gray-700 dark:text-gray-300 truncate">${proximoJogo.local || "Local não informado"}</span>
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
            <div class="bg-white dark:bg-gray-900 border border-dashed dark:border-gray-800 rounded-xl p-4 text-center transition-colors duration-200">
                <p class="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase">
                    Nenhum amistoso futuro cadastrado.
                </p>
            </div>
        `;

        const elProximoJogo = document.getElementById('mural-proximo-jogo');
        if (elProximoJogo) {
            elProximoJogo.innerHTML = `
                <p class="text-[10px] font-black text-[#990000] dark:text-red-400 uppercase mb-2">
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
                    nascimento: user.nascimento,
                    photoURL: user.photoURL || user.fotoUrl || user.foto || ""
                });
            }
        });

        const diaAtual = agora.getDate();
        const aniversariantesFiltrados = aniversariantes
            .filter(aniv => aniv.dia >= diaAtual)
            .sort((a, b) => a.dia - b.dia);

        const aniversariantesHtml = aniversariantesFiltrados.length > 0 ? `
            <div class="flex overflow-x-auto gap-3 snap-x pb-2 pt-2 [&::-webkit-scrollbar]:hidden" style="scrollbar-width: none;">
                ${aniversariantesFiltrados.map(aniv => {
                    const isHoje = aniv.dia === diaAtual;
                    const cardClass = isHoje
                        ? "bg-yellow-50 dark:bg-yellow-950/20 border-2 border-yellow-400 rounded-2xl p-3 shadow-[0_0_12px_rgba(234,179,8,0.25)] scale-105 text-center snap-start flex flex-col items-center justify-center w-28 shrink-0 relative transition-all"
                        : "bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-3 shadow-sm text-center snap-start flex flex-col items-center justify-center w-28 shrink-0 transition-all";
                    const badgeText = isHoje
                        ? '<span class="text-[8px] font-black uppercase text-yellow-700 dark:text-yellow-400 tracking-wider">🎉 Hoje!</span>'
                        : `<span class="text-[8px] font-bold text-gray-400 dark:text-gray-500 uppercase mt-0.5">Dia ${String(aniv.dia).padStart(2, "0")}</span>`;
                    const circleClass = isHoje
                        ? "w-10 h-10 rounded-full bg-yellow-400 text-white flex items-center justify-center font-black text-xs shadow-sm mb-2 shrink-0 border-none"
                        : "w-10 h-10 rounded-full bg-[#990000] text-white flex items-center justify-center font-black text-xs shadow-sm mb-2 shrink-0 border-none";

                    const photoHtml = aniv.photoURL
                        ? `<img src="${aniv.photoURL}" class="w-10 h-10 rounded-full object-cover border-2 ${isHoje ? 'border-yellow-400' : 'border-[#990000]'} mb-2 shadow-sm shrink-0" onerror="this.onerror=null; this.outerHTML='<div class=\&quot;${circleClass}\&quot;>${String(aniv.dia).padStart(2, "0")}</div>';">`
                        : `<div class="${circleClass}">${String(aniv.dia).padStart(2, "0")}</div>`;

                    return `
                        <div class="${cardClass}">
                            ${photoHtml}
                            <p class="text-[10px] font-black text-gray-950 dark:text-gray-100 uppercase tracking-wide truncate w-full" title="${escaparHtml(aniv.nome)}">
                                ${aniv.nome}
                            </p>
                            ${badgeText}
                        </div>
                    `;
                }).join('')}
            </div>
        ` : `
            <div class="bg-white dark:bg-gray-900 border border-dashed dark:border-gray-800 rounded-xl p-4 text-center transition-colors duration-200">
                <p class="text-[10px] text-gray-400 dark:text-gray-500 font-medium py-2">
                    Nenhum próximo aniversário neste mês.
                </p>
            </div>
        `;

        const elAniversariantes = document.getElementById('mural-aniversariantes');
        if (elAniversariantes) {
            elAniversariantes.innerHTML = `
                <p class="text-[10px] font-black text-[#990000] dark:text-red-400 uppercase mb-2">
                    <i class="fa-solid fa-cake-candles mr-1"></i> Aniversariantes do mês
                </p>
                ${aniversariantesHtml}
            `;
        }

        setTimeout(() => {
            verificarComunicadosObrigatoriosDVC();
        }, 100);

    } catch (e) {
        console.error("Erro ao carregar mural", e);

        c.innerHTML += `
            <div class="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl p-4 text-center transition-colors duration-200">
                <p class="text-xs font-bold text-red-700 dark:text-red-400">
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

// ============================================================================
// ACKNOLWEDGE PATTERN: COMUNICADO OBRIGATÓRIO COM CONFIRMAÇÃO
// ============================================================================

async function verificarComunicadosObrigatoriosDVC() {
    if (!auth.currentUser || !window.currentUserData) return;

    try {
        const avisos = await carregarAvisosDVCCache();
        const lidos = window.currentUserData.comunicadosLidos || [];

        // Filtra avisos que estão ativos, são direcionados a este usuário e ainda não foram marcados como lidos
        const pendentes = avisos.filter(aviso => 
            avisoEstaAtivoDVC(aviso) && 
            avisoEhParaUsuarioDVC(aviso) && 
            !lidos.includes(aviso.id)
        );

        if (pendentes.length > 0) {
            abrirModalLeituraObrigatoriaDVC(pendentes[0]);
        }
    } catch (e) {
        console.warn("Erro ao verificar comunicados obrigatórios:", e);
    }
}

function abrirModalLeituraObrigatoriaDVC(aviso) {
    if (document.getElementById("m-comunicado-obrigatorio")) return;

    // Bloqueia a rolagem do body e do container de trás
    document.body.style.overflow = "hidden";
    const mainContent = document.getElementById("main-content");
    if (mainContent) mainContent.style.overflow = "hidden";

    const modalHtml = `
        <div id="m-comunicado-obrigatorio" class="fixed inset-0 flex items-center justify-center p-4 backdrop-blur-md text-left block border-none fade-in" style="z-index: 999999; background-color: rgba(3, 7, 18, 0.95);">
            <div class="bg-white dark:bg-gray-900 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden flex flex-col relative border border-gray-200 dark:border-gray-800 text-left block transition-colors duration-200" style="max-height: 80vh;">
                <!-- Header -->
                <div class="text-white p-5 text-left shrink-0" style="background: linear-gradient(to right, #030712, #4b0d0d, #990000);">
                    <p class="text-[8px] font-black uppercase text-white/60 tracking-wider">Comunicado Importante</p>
                    <h3 class="text-xs font-black uppercase mt-1 leading-tight">${escaparHtml(aviso.titulo || "Aviso Obrigatório")}</h3>
                </div>

                <!-- Body (Scrollable container) -->
                <div id="comunicado-corpo-scroll" class="p-6 overflow-y-auto flex-1 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 text-xs font-normal leading-relaxed whitespace-pre-wrap text-left block custom-scroll">${escaparHtml(aviso.mensagem || "")}</div>

                <!-- Footer / Confirm Button -->
                <div class="p-4 border-t dark:border-gray-800 bg-gray-50 dark:bg-gray-950 shrink-0 flex flex-col gap-2">
                    <button 
                        id="btn-confirmar-leitura" 
                        disabled 
                        onclick="confirmarLeituraComunicadoDVC('${safeEditParam(aviso.id)}')" 
                        class="w-full bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 py-3 rounded-2xl font-black uppercase shadow-inner dark:shadow-none cursor-not-allowed transition-all duration-300" style="font-size: 9px;">
                        Confirmar Leitura (3s)
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHtml);

    let tempoRestante = 3;
    const btn = document.getElementById("btn-confirmar-leitura");

    const timer = setInterval(() => {
        tempoRestante--;
        if (tempoRestante > 0) {
            if (btn) btn.textContent = `Confirmar Leitura (${tempoRestante}s)`;
        } else {
            clearInterval(timer);
            habilitarBotaoConfirmar();
        }
    }, 1000);

    const container = document.getElementById("comunicado-corpo-scroll");
    let scrollAtingido = false;

    if (container) {
        container.addEventListener("scroll", () => {
            if (container.scrollHeight - container.scrollTop <= container.clientHeight + 15) {
                scrollAtingido = true;
                if (tempoRestante <= 0) {
                    habilitarBotaoConfirmar();
                }
            }
        });
    }

    function habilitarBotaoConfirmar() {
        const isShortText = container ? (container.scrollHeight <= container.clientHeight) : true;
        if (tempoRestante <= 0 && (scrollAtingido || isShortText)) {
            if (btn && btn.hasAttribute("disabled")) {
                btn.removeAttribute("disabled");
                btn.className = "w-full bg-[#990000] text-white py-3 rounded-2xl font-black uppercase shadow-md active:scale-95 transition-all cursor-pointer hover:bg-red-800";
                btn.style.fontSize = "9px";
                btn.textContent = "Confirmar Leitura";
            }
        }
    }
}

async function confirmarLeituraComunicadoDVC(avisoId) {
    if (!auth.currentUser || !window.currentUserData) return;

    const btn = document.getElementById("btn-confirmar-leitura");
    if (btn) {
        btn.disabled = true;
        btn.textContent = "Gravando...";
    }

    try {
        const email = auth.currentUser.email;
        const userRef = doc(db, "users", email);

        // a) Grava no Firestore na propriedade array comunicadosLidos
        await updateDoc(userRef, {
            comunicadosLidos: arrayUnion(avisoId)
        });

        // Atualiza estado local
        if (!window.currentUserData.comunicadosLidos) {
            window.currentUserData.comunicadosLidos = [];
        }
        if (!window.currentUserData.comunicadosLidos.includes(avisoId)) {
            window.currentUserData.comunicadosLidos.push(avisoId);
        }

        // Restaura a rolagem do body e do container de trás
        document.body.style.overflow = "";
        const mainContent = document.getElementById("main-content");
        if (mainContent) mainContent.style.overflow = "";

        // b) Fecha o modal
        document.getElementById("m-comunicado-obrigatorio")?.remove();

        // c) Invalida cache local e força re-renderização do mural
        if (window.AppCache) {
            window.AppCache.avisos = null;
        }

        await renderMural();
    } catch (e) {
        console.error("Erro ao confirmar leitura do comunicado:", e);
        alert("Não foi possível registrar a confirmação. Tente novamente.");
        if (btn) {
            btn.removeAttribute("disabled");
            btn.textContent = "Confirmar Leitura";
        }
    }
}

window.verificarComunicadosObrigatoriosDVC = verificarComunicadosObrigatoriosDVC;
window.abrirModalLeituraObrigatoriaDVC = abrirModalLeituraObrigatoriaDVC;
window.confirmarLeituraComunicadoDVC = confirmarLeituraComunicadoDVC;

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
    renderMural,
    verificarComunicadosObrigatoriosDVC,
    abrirModalLeituraObrigatoriaDVC,
    confirmarLeituraComunicadoDVC
};
