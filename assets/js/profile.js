/**
 * ============================================================================
 * Módulo: PROFILE
 * ============================================================================
 * Responsabilidade: Gerencia funcionalidades relacionadas a profile.
 * Este arquivo faz parte do sistema modular do DVC App.
 * Todos os códigos principais aqui agrupados seguem as diretrizes do projeto.
 * ============================================================================
 */

// js/profile.js
// Stage 7: Perfil A Modularization

import { 
    db, 
    auth, 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc, 
    collection, 
    getDocs, 
    addDoc 
} from "./firebase.js";

// Safe getters for window-scoped variables
const get_modoTestePerfilEmail = () => window.modoTestePerfilEmail;
const get_modoTestePerfilNome = () => window.modoTestePerfilNome;
const get_subAbaPerfilAtiva = () => window.subAbaPerfilAtiva;
const get_currentUserData = () => window.currentUserData;
const get_PROJETO_ATUAL_DVC = () => window.PROJETO_ATUAL_DVC;
const get_STATUS_FINANCEIRO_CARENCIA = () => window.STATUS_FINANCEIRO_CARENCIA;

if (typeof window.DVC_DEBUG_PERFORMANCE === "undefined") {
    window.DVC_DEBUG_PERFORMANCE = false;
}

const PERFIL_CACHE_TTL_DVC = 5 * 60 * 1000;
const profileCacheDVC = window.profileCacheDVC || {};
window.profileCacheDVC = profileCacheDVC;

function perfInicioPerfilDVC() {
    return typeof performance !== "undefined" ? performance.now() : Date.now();
}

function perfLogPerfilDVC(label, inicio) {
    if (window.DVC_DEBUG_PERFORMANCE === true) {
        const agora = typeof performance !== "undefined" ? performance.now() : Date.now();
        console.log(`[DVC Perfil] ${label}: ${Math.round(agora - inicio)}ms`);
    }
}

function normalizarEmailPerfilDVC(email = "") {
    return window.normalizarEmailDVC
        ? window.normalizarEmailDVC(email)
        : String(email || "").trim().toLowerCase();
}

function obterCachePerfilDVC(email, userData = {}) {
    const key = normalizarEmailPerfilDVC(email);
    const cache = profileCacheDVC[key];
    const assinatura = JSON.stringify({
        habilidades: userData.habilidades || {},
        funcaoVolei: userData.funcaoVolei || "formacao",
        categoria: userData.categoria || "",
        subcategoria: userData.subcategoria || "",
        statusHabilidades: userData.habilidadesStatus || "",
        avaliadas: userData.habilidadesAvaliadasPorEquipe || false
    });

    if (cache && cache.assinatura === assinatura && Date.now() - cache.ts < PERFIL_CACHE_TTL_DVC) {
        return cache;
    }

    if (cache) {
        delete profileCacheDVC[key];
    }

    return { key, assinatura };
}

function salvarCachePerfilDVC(email, dados) {
    const key = normalizarEmailPerfilDVC(email);
    profileCacheDVC[key] = {
        ...profileCacheDVC[key],
        ...dados,
        ts: Date.now()
    };
    return profileCacheDVC[key];
}

function renderIconeLocalDVC(src, alt = "", extraClasses = "") {
    const srcSeguro = String(src || "").replace(/"/g, "&quot;");
    const altSeguro = String(alt || "").replace(/"/g, "&quot;");
    const classesSeguras = String(extraClasses || "").replace(/"/g, "");

    return `
        <img 
            src="${srcSeguro}" 
            alt="${altSeguro}" 
            class="inline-block object-contain ${classesSeguras}" 
            loading="lazy"
            onerror="this.style.display='none';"
        >
    `;
}

function corrigirHtmlVisualPerfilDVC(html = "") {
    let corrigido = String(html || "");
    const extras = {
        "Ãš": "Ú",
        "ÃšLTIMO": "ÚLTIMO",
        "Ãšltima": "Última",
        "ðŸ’°": "",
        "ðŸ": "",
        "\u00C3\u00B0\u00C5\u00B8\u00E2\u20AC\u2122\u00C2\u00B0": "",
        "\u00C3\u00B0\u00C5\u00B8\u00C2\u008F\u00C2\u0090": ""
    };

    const aplicarExtras = (valor) => {
        let resultado = String(valor || "");
        Object.entries(extras).forEach(([origem, destino]) => {
            resultado = resultado.split(origem).join(destino);
        });
        return resultado;
    };

    corrigido = aplicarExtras(corrigido);
    if (typeof window.corrigirMojibakeDVC === "function") {
        corrigido = window.corrigirMojibakeDVC(corrigido);
    }
    corrigido = aplicarExtras(corrigido);

    return corrigido;
}

function getIconeFinanceiroPerfilDVC(status = "") {
    const normalizado = String(status || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

    if (normalizado === "em dia" || normalizado === "pago" || normalizado === "validado") {
        return "assets/img/icon/certoverde.webp";
    }

    if (normalizado === "justificado" || normalizado.includes("carencia")) {
        return "assets/img/icon/dinheirocolorido.webp";
    }

    return "assets/img/icon/certovernelho.webp";
}

// 1. obterMediaPorCategoria
async function obterMediaPorCategoria(categoria) {
    if (!categoria) return null;

    try {
        const docRef = doc(db, "parametros", "mediaCategorias");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            return data[categoria] || null;
        }
        return null;
    } catch (error) {
        console.warn("Erro ao obter mÃ©dia por categoria:", error);
        return null;
    }
}

// Helper: classeBotaoSubAbaPerfil
function classeBotaoSubAbaPerfil(aba) {
    return window.subAbaPerfilAtiva === aba
        ? "bg-white text-[#990000] shadow-sm ring-1 ring-red-100"
        : "text-gray-400 hover:text-gray-700";
}

// 2. mudarSubAbaPerfil
async function mudarSubAbaPerfil(aba) {
    const inicio = perfInicioPerfilDVC();
    window.subAbaPerfilAtiva = ["habilidades", "financeiro", "presenca"].includes(aba) ? aba : "habilidades";

    ["habilidades", "financeiro", "presenca"].forEach(nomeAba => {
        const secao = document.getElementById(`sub-secao-${nomeAba}`);
        const botao = document.getElementById(`btn-subaba-perfil-${nomeAba}`);

        if (secao) secao.classList.toggle("hidden", nomeAba !== window.subAbaPerfilAtiva);

        if (botao) {
            botao.className = `flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-[8px] font-black uppercase leading-tight transition ${classeBotaoSubAbaPerfil(nomeAba)}`;
            const img = botao.querySelector("img");
            if (img) {
                if (window.subAbaPerfilAtiva === nomeAba) {
                    img.classList.remove("opacity-60");
                    img.classList.add("opacity-100");
                } else {
                    img.classList.remove("opacity-100");
                    img.classList.add("opacity-60");
                }
            }
        }
    });

    if (window.subAbaPerfilAtiva === "habilidades") {
        setTimeout(() => {
            if (window.graficoHabilidadesPerfil?.update) {
                window.graficoHabilidadesPerfil.update();
            }

            if (typeof window.atualizarRadarDVC === "function") {
                window.atualizarRadarDVC(window.filtroRadarDVC || "todas");
            }
        }, 80);
    }
    
    if (window.subAbaPerfilAtiva === "presenca") {
        const emailAtual = window.modoTestePerfilEmail || (auth.currentUser ? auth.currentUser.email : "");
        if (typeof window.carregarEExibirHistoricoJogosDVC === "function" && !window._historicoPresencaCarregadoDVC) {
            window._historicoPresencaCarregadoDVC = true;
            await window.carregarEExibirHistoricoJogosDVC(emailAtual);
        }
    }

    perfLogPerfilDVC(`mudar subaba ${window.subAbaPerfilAtiva}`, inicio);
}

// 3. renderProfile
// Helper: abrirMicroModalFinanceiroPerfilDVC
async function abrirMicroModalFinanceiroPerfilDVC(email) {
    document.getElementById('m-financeiro-micro-dvc')?.remove();

    const modalHtml = corrigirHtmlVisualPerfilDVC(`
        <div id="m-financeiro-micro-dvc" class="fixed inset-0 bg-black/70 z-[110] p-4 flex items-center justify-center fade-in">
            <div class="bg-white w-full max-w-xs rounded-2xl p-5 relative shadow-2xl">
                <button 
                    onclick="document.getElementById('m-financeiro-micro-dvc').remove()" 
                    class="absolute top-4 right-4 text-gray-400 hover:text-red-600 font-black text-lg">
                    &times;
                </button>
                <h3 class="font-bold text-xs uppercase mb-3 text-[#990000] flex items-center gap-1.5">
                    <i class="fa-solid fa-file-invoice-dollar"></i> Resumo Financeiro
                </h3>
                <div id="micro-financeiro-conteudo" class="space-y-2 max-h-[300px] overflow-y-auto custom-scroll pr-1">
                    <p class="text-[9px] font-bold text-gray-400 uppercase text-center py-4">Carregando...</p>
                </div>
            </div>
        </div>
    `);
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    try {
        const contribuicoes = await window.carregarContribuicoesAtletaDVC(email);
        const registros = contribuicoes.sort((a, b) => new Date(b.enviadoEm || 0) - new Date(a.enviadoEm || 0));
        const container = document.getElementById('micro-financeiro-conteudo');
        if (!container) return;

        if (!registros.length) {
            container.innerHTML = corrigirHtmlVisualPerfilDVC(`
                <div class="bg-gray-50 border border-dashed rounded-xl p-3 text-center">
                    <p class="text-[9px] text-gray-400 font-bold uppercase">Nenhum envio registrado.</p>
                </div>`);
            return;
        }

        container.innerHTML = corrigirHtmlVisualPerfilDVC(registros.map(item => {
            const status = item.status || "Pendente";
            const tipo = item.tipo || "Comprovante";
            const cor = status === "Validado" || item.resultadoFinanceiro === "Pago"
                ? "bg-green-50 border-green-200 text-green-700"
                : status === "Justificado" || item.resultadoFinanceiro === "Justificado"
                    ? "bg-blue-50 border-blue-200 text-blue-700"
                    : "bg-yellow-50 border-yellow-200 text-yellow-700";

            return `
                <div class="${cor} border rounded-lg p-2.5 flex justify-between items-center text-[10px] text-left">
                    <div>
                        <p class="font-black uppercase">${item.mes || "Sem mÃªs"}</p>
                        <p class="text-[8px] font-semibold opacity-70 mt-0.5">${tipo}</p>
                    </div>
                    <span class="bg-white/90 border text-[8px] font-black px-2 py-0.5 rounded-full uppercase shrink-0 inline-flex items-center gap-1">
                        ${renderIconeLocalDVC(getIconeFinanceiroPerfilDVC(status), status, "w-3 h-3")}
                        ${status}
                    </span>
                </div>
            `;
        }).join(''));
    } catch (e) {
        console.error("Erro no micro-modal financeiro:", e);
        const container = document.getElementById('micro-financeiro-conteudo');
        if (container) {
            container.innerHTML = corrigirHtmlVisualPerfilDVC(`<p class="text-[9px] text-red-600 font-bold uppercase text-center py-4">Erro ao carregar dados.</p>`);
        }
    }
}

// Helper: toggleHabilidadeAccordionDVC
async function toggleHabilidadeAccordionDVC(detailsEl, email, skillId) {
    if (!detailsEl.open) return;
    const container = detailsEl.querySelector(`.historico-criterio-container-dvc`);
    if (!container) return;
    
    if (container.dataset.loaded === "true") return;

    if (typeof window.carregarHistoricoHabilidadeHtml === "function") {
        container.innerHTML = corrigirHtmlVisualPerfilDVC(`<p class="text-[8px] text-gray-400 font-bold uppercase"><i class="fa-solid fa-spinner fa-spin mr-1"></i> Carregando...</p>`);
        try {
            const html = await window.carregarHistoricoHabilidadeHtml(email, skillId);
            container.innerHTML = corrigirHtmlVisualPerfilDVC(html);
            container.dataset.loaded = "true";
        } catch (e) {
            console.warn("Erro ao carregar histÃ³rico:", e);
            container.innerHTML = `<p class="text-[8px] text-gray-400 font-semibold uppercase">HistÃ³rico tÃ©cnico ainda nÃ£o disponÃ­vel</p>`;
            container.innerHTML = corrigirHtmlVisualPerfilDVC(container.innerHTML);
        }
    } else {
        container.innerHTML = `<p class="text-[8px] text-gray-400 font-semibold uppercase">HistÃ³rico tÃ©cnico ainda nÃ£o disponÃ­vel</p>`;
    }
}



// 3. renderProfile
async function renderProfile() {
    const inicioTotalPerfil = perfInicioPerfilDVC();
    const c = document.getElementById('main-content');
    const modoTestePerfilEmail = get_modoTestePerfilEmail();
    const subAbaPerfilAtiva = get_subAbaPerfilAtiva();
    const currentUserData = get_currentUserData();
    const PROJETO_ATUAL_DVC = get_PROJETO_ATUAL_DVC();
    const STATUS_FINANCEIRO_CARENCIA = get_STATUS_FINANCEIRO_CARENCIA();

    const emailPerfil = modoTestePerfilEmail || (auth.currentUser ? auth.currentUser.email : "");
    const estouEmModoTeste = !!modoTestePerfilEmail;
    
    // Mostra o loading inicial
    c.innerHTML = `
        <h3 class="font-bold mb-4 uppercase flex items-center">
            Perfil 
            <i class="fa-solid fa-circle-notch fa-spin text-xs ml-2 text-gray-400" id="loading-profile"></i>
        </h3>
    `;

    try {
        // 1. Dispara buscas de usuÃ¡rios em paralelo
        const inicioDadosUsuario = perfInicioPerfilDVC();
        const emailAtualAuth = String(auth.currentUser?.email || "").trim().toLowerCase();
        const emailPerfilNormalizado = String(emailPerfil || "").trim().toLowerCase();
        const userDataPerfil = !estouEmModoTeste && currentUserData && emailPerfilNormalizado === emailAtualAuth
            ? currentUserData
            : await window.obterUsuarioCacheDVC(emailPerfil);
        perfLogPerfilDVC("carregar dados do usuario", inicioDadosUsuario);

        const userSnap = {
            exists: () => !!userDataPerfil,
            data: () => userDataPerfil
        };

        // 2. MantÃ©m a proteÃ§Ã£o antiga caso o cadastro nÃ£o exista
        if (!userSnap.exists()) {
            c.innerHTML = `
                <p class="p-6 text-center text-sm font-bold text-gray-500">
                    Seu perfil ainda nÃ£o foi localizado no sistema. Por favor, fale com um treinador.
                </p>
            `;
            return;
        }

        const userData = userSnap.data() || {};
        
        const precisaAutoAvaliacaoPerfil = !estouEmModoTeste &&
            String(emailPerfil || "").trim().toLowerCase() === String(auth.currentUser?.email || "").trim().toLowerCase() &&
            await window.usuarioPrecisaAutoAvaliacaoComHistoricoDVC(userData, emailPerfil);
            
        const possuiAvaliacaoTecnicaRealPerfil = window.usuarioTemAvaliacaoTecnicaRealDVC(userData);
        const projetoNome = userData.projetoNome || PROJETO_ATUAL_DVC.nome;
        const projetoSelo = userData.projetoSelo || PROJETO_ATUAL_DVC.selo;
        const projetoLogo = userData.projetoLogo || PROJETO_ATUAL_DVC.logo;
        
        // 3. CÃ¡lculo da mÃ©dia tÃ©cnica preservando a lÃ³gica antiga
        const funcaoVolei = userData.funcaoVolei || "formacao";
        const inicioCalculoHabilidades = perfInicioPerfilDVC();
        const cachePerfil = obterCachePerfilDVC(emailPerfil, userData);
        const habilidadesCompostas = cachePerfil.habilidadesNormalizadas || window.normalizarHabilidadesDVC(userData.habilidades || {});
        const h = habilidadesCompostas;
        const scoreGeralDVC = cachePerfil.scoreGeral ?? window.calcularScoreGeralDVC(habilidadesCompostas || {});
        const scoreFuncaoDVC = cachePerfil.scoreFuncao ?? window.calcularScoreFuncaoDVC(habilidadesCompostas || {}, funcaoVolei);
        salvarCachePerfilDVC(emailPerfil, {
            assinatura: cachePerfil.assinatura,
            habilidadesNormalizadas: habilidadesCompostas,
            scoreGeral: scoreGeralDVC,
            scoreFuncao: scoreFuncaoDVC
        });
        perfLogPerfilDVC("calcular habilidades e scores", inicioCalculoHabilidades);

        const mediaHabilidades = possuiAvaliacaoTecnicaRealPerfil
            ? scoreGeralDVC.toFixed(1)
            : "Aguardando";
            
        window.filtroRadarDVC = "todas";
        window.habilidadeSelecionadaRadarDVC = null;
        window.habilidadesRadarAtualDVC = {};

        // 4. Verifica advertÃªncias e situaÃ§Ã£o geral
        const advs = userData.advertencias || [];
        const isSuspenso = advs.length >= 3;
        const ok = window.usuarioPodeSerConvocadoPorFinanceiro(userData) && userData.status === 'Ativo' && !isSuspenso;

        // Fetch weekly plans count in parallel before rendering to avoid sync-async mismatch
        window.contagemSemanaPerfilDVC = cachePerfil.contagemSemana || {};

        const inicioQuizPerfil = perfInicioPerfilDVC();
        const quizPerfilHtml = typeof window.renderQuizPerfilHtmlDVC === "function"
            ? window.renderQuizPerfilHtmlDVC(userData)
            : "";
        perfLogPerfilDVC("renderizar card Inteligencia de Quadra", inicioQuizPerfil);
        
        // 5. PresenÃ§as
        const minhasPresencas = userData.presencas || 0;
        let proximosJogosHtml = ""; 
        let historicoJogosHtml = ""; 
        const modoTesteBannerHtml = estouEmModoTeste ? `
            <div class="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4 shadow-sm fade-in">
                <div class="flex justify-between items-center gap-3">
                    <div>
                        <p class="text-[10px] font-black text-yellow-800 uppercase">
                            <i class="fa-solid fa-eye mr-1"></i> Modo Teste Ativo
                        </p>
                        <p class="text-[9px] font-bold text-yellow-700 mt-1">
                            VocÃª estÃ¡ visualizando o perfil de outro atleta.
                        </p>
                    </div>

                    <button 
                        onclick="sairModoTesteAtleta()" 
                        class="bg-yellow-600 text-white px-3 py-2 rounded-lg text-[8px] font-black uppercase">
                        Sair
                    </button>
                </div>
            </div>
        ` : "";

        const nomeFuncaoVolei = window.getNomeFuncaoVoleiDVC(funcaoVolei);
        const scoreGeralPerfilTexto = possuiAvaliacaoTecnicaRealPerfil ? scoreGeralDVC.toFixed(1) : "Aguard.";
        const scoreFuncaoPerfilTexto = possuiAvaliacaoTecnicaRealPerfil ? scoreFuncaoDVC.toFixed(1) : "Aguard.";
        
        // Financial status
        const financeiroPerfilStatus = window.obterStatusFinanceiroEfetivo(userData);
        const financeiroPerfilCor = financeiroPerfilStatus === "Em dia"
            ? "bg-green-100 text-green-700 border-green-200"
            : financeiroPerfilStatus === "Justificado"
                ? "bg-blue-100 text-blue-700 border-blue-200"
                : financeiroPerfilStatus === STATUS_FINANCEIRO_CARENCIA
                    ? "bg-amber-100 text-amber-700 border-amber-200"
                    : "bg-red-100 text-red-700 border-red-200";

        let financeiroPerfilHtml = "";

        try {
            financeiroPerfilHtml = `
                <div class="bg-white p-4 rounded-xl border mb-4 shadow-sm text-left">
                    <div class="flex justify-between items-start gap-3 mb-3">
                        <div>
                            <p class="text-[10px] font-black text-[#990000] uppercase">
                                <i class="fa-solid fa-file-invoice-dollar mr-1"></i> SituaÃ§Ã£o Financeira
                            </p>
                            <p class="text-[9px] font-bold text-gray-400 uppercase mt-1">
                                ContribuiÃ§Ãµes e justificativas
                            </p>
                        </div>
                        <span class="${financeiroPerfilCor} border text-[8px] font-black px-2 py-1 rounded-full uppercase shrink-0">
                            ${financeiroPerfilStatus}
                        </span>
                    </div>

                    <div class="bg-gray-50 border rounded-xl p-3 mb-3">
                        <p class="text-[8px] font-black text-gray-400 uppercase">
                            Ãšltima regularizaÃ§Ã£o
                        </p>
                        <p class="text-xs font-black text-gray-800 uppercase mt-1">
                            ${userData.mesFinanceiro || "Sem registro"}
                        </p>
                    </div>

                    <details class="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden mt-4">
                        <summary class="cursor-pointer list-none p-3.5 flex items-center justify-between gap-3 select-none">
                            <span class="text-[10px] font-black uppercase text-gray-700">HistÃ³rico de ContribuiÃ§Ãµes</span>
                            <i class="fa-solid fa-chevron-down text-gray-300 text-xs shrink-0"></i>
                        </summary>
                        <div id="dvc-historico-financeiro-container-${emailPerfil.replace(/[@.]/g, '')}" class="px-4 pb-4 mt-2">
                            <button onclick="carregarEExibirRegistrosFinanceirosDVC('${emailPerfil}', this)" class="w-full bg-blue-50 text-blue-700 border border-blue-200 rounded-xl p-3 text-xs font-black uppercase shadow-sm transition active:bg-blue-100">
                                <i class="fa-solid fa-download mr-1"></i> Carregar HistÃ³rico Detalhado
                            </button>
                        </div>
                    </details>
                </div>
            `;
        } catch (erroFinanceiroPerfil) {
            console.warn("NÃ£o foi possÃ­vel carregar histÃ³rico financeiro do perfil", erroFinanceiroPerfil);
            financeiroPerfilHtml = `
                <div class="bg-white p-4 rounded-xl border mb-4 shadow-sm">
                    <p class="text-[10px] text-gray-400 font-bold uppercase">
                        HistÃ³rico financeiro indisponÃ­vel agora.
                    </p>
                </div>
            `;
        }

        const avaliacaoEquipePendentePerfil = !estouEmModoTeste && !window.usuarioEhADM() && window.usuarioPodeAvaliarEquipeTecnicaDVC()
            ? await window.usuarioTemAvaliacoesEquipePendentesDVC()
            : false;
        const avaliacaoColegaPendentePerfil = !estouEmModoTeste && typeof window.usuarioTemAvaliacaoColegaPendenteDVC === "function"
            ? await window.usuarioTemAvaliacaoColegaPendenteDVC()
            : false;

        const avaliacaoMensalEquipePerfilHtml = !estouEmModoTeste && (avaliacaoEquipePendentePerfil || window.usuarioEhADM())
            ? await window.renderAvaliacaoMensalEquipeDVC("perfil", avaliacaoEquipePendentePerfil)
            : "";
        const avaliacaoMensalEquipeCardPerfilHtml = window.usuarioEhADM() ? avaliacaoMensalEquipePerfilHtml : (avaliacaoEquipePendentePerfil ? (avaliacaoMensalEquipePerfilHtml || `
            <div class="bg-white p-4 rounded-xl border shadow-sm text-left flex flex-col justify-between">
                <div>
                    <p class="text-[10px] font-black text-gray-700 uppercase mb-2">
                        <i class="fa-solid fa-comments mr-1"></i> AvaliaÃ§Ã£o da equipe tÃ©cnica
                    </p>
                    <p class="text-[10px] text-gray-500 font-semibold leading-relaxed mb-3">
                        Avalie treinador/equipe tÃ©cnica para ajudar a melhorar os treinos e o projeto.
                    </p>
                </div>
                <button onclick="abrirModalAvaliacaoEquipeTecnica()" class="w-full bg-[#990000] text-white py-3 rounded-lg font-black text-[10px] uppercase shadow-md mt-auto">
                    Avaliar treinador/equipe tÃ©cnica
                </button>
            </div>
        `) : "");

        const avaliacaoColegasPerfilHtml = avaliacaoColegaPendentePerfil ? `
            <div class="bg-white p-4 rounded-xl border shadow-sm text-left flex flex-col justify-between">
                <div>
                    <p class="text-[10px] font-black text-gray-700 uppercase mb-2">
                        <i class="fa-solid fa-users-viewfinder mr-1"></i> AvaliaÃ§Ã£o entre colegas
                    </p>
                    <p class="text-[10px] text-gray-500 font-semibold leading-relaxed mb-3">
                        Avalie colegas em resiliÃªncia, comunicaÃ§Ã£o em quadra e trabalho em equipe.
                    </p>
                </div>
                <button onclick="abrirAvaliacaoColegas()" class="w-full bg-indigo-700 text-white py-3 rounded-lg font-black text-[10px] uppercase shadow-md mt-auto">
                    Avaliar Colegas
                </button>
            </div>
        ` : "";

        const temAlguemPendente = avaliacaoEquipePendentePerfil || avaliacaoColegaPendentePerfil;
        let conteudoAvaliacoes = "";

        if (window.usuarioEhADM()) {
            conteudoAvaliacoes = `
                <div class="space-y-3">
                    ${avaliacaoMensalEquipeCardPerfilHtml}
                </div>
            `;
        } else if (temAlguemPendente) {
            conteudoAvaliacoes = `
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    ${avaliacaoEquipePendentePerfil ? avaliacaoMensalEquipeCardPerfilHtml : ""}
                    ${avaliacaoColegaPendentePerfil ? avaliacaoColegasPerfilHtml : ""}
                </div>
            `;
        } else {
            conteudoAvaliacoes = `
                <div class="bg-green-50 border border-green-100 rounded-2xl p-4 text-center">
                    <p class="text-[10px] text-green-700 font-black uppercase flex items-center justify-center gap-1.5">
                        <i class="fa-solid fa-circle-check text-xs"></i> AvaliaÃ§Ãµes concluÃ­das
                    </p>
                    <p class="text-[9px] text-gray-500 font-semibold mt-1">
                        AvaliaÃ§Ãµes mensais concluÃ­das. Obrigado por contribuir com o desenvolvimento do projeto.
                    </p>
                </div>
            `;
        }
        const avaliacoesParticipacaoPerfilHtml = window.renderSecaoRecolhivelDVC({
            id: "perfil-avaliacoes-participacao-dvc",
            titulo: "AvaliaÃ§Ãµes e participaÃ§Ã£o",
            subtitulo: temAlguemPendente ? "AvaliaÃ§Ã£o mensal obrigatÃ³ria pendente" : "AvaliaÃ§Ã£o mensal e participaÃ§Ã£o no projeto",
            icone: "fa-comments",
            aberta: true,
            conteudo: conteudoAvaliacoes
        });

        const inteligenciaJogoPerfilHtml = quizPerfilHtml;
        

        // Privacy controls
        const scoreTecnicoPublico = userData.scoreTecnicoPublico !== false;
        const scorePrivacidadeHtml = corrigirHtmlVisualPerfilDVC(`
            <div class="bg-white p-4 rounded-xl border mb-4 shadow-sm text-left">
                <div class="flex items-center justify-between mb-2">
                    <p class="text-[10px] font-black text-gray-700 uppercase">
                        <i class="fa-solid fa-eye mr-1"></i> Privacidade do Score
                    </p>

                    <span class="inline-flex items-center justify-center gap-1 whitespace-nowrap leading-none text-[8px] font-black px-2.5 py-1 rounded-full uppercase ${scoreTecnicoPublico ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}">
                        ${scoreTecnicoPublico ? 'VisÃ­vel' : 'Oculto'}
                    </span>
                </div>

                <p class="text-[10px] text-gray-500 font-semibold leading-relaxed mb-3">
                    Escolha se outros atletas podem ver seu score tÃ©cnico no ranking. 
                    Treinadores sempre poderÃ£o visualizar para acompanhamento pedagÃ³gico.
                </p>

                <button 
                    onclick="alternarPrivacidadeScoreTecnico(${!scoreTecnicoPublico})"
                    class="w-full ${scoreTecnicoPublico ? 'bg-gray-800' : 'bg-green-600'} text-white py-3 rounded-lg font-black text-[10px] uppercase shadow-md">
                    ${scoreTecnicoPublico ? 'Ocultar meu score dos atletas' : 'Permitir que atletas vejam meu score'}
                </button>
            </div>
        `);
        const privacidadeScorePerfilHtml = window.renderSecaoRecolhivelDVC({
            id: "perfil-configuracoes-privacidade-dvc",
            titulo: "ConfiguraÃ§Ãµes e privacidade",
            subtitulo: "Controle de visibilidade do score",
            icone: "fa-shield-halved",
            aberta: false,
            conteudo: scorePrivacidadeHtml
        });

        // HTML strings and layout
        let habilidadesHtml = `<p class="text-[10px] text-gray-400 italic">
                                    Nenhuma habilidade avaliada ainda.
                               </p>`;
        let mediaCategoria = null;
        let planoEvolucaoHtml = "";
        let avaliacoesPendentesHtml = "";

        try {
            const inicioMapaRadar = perfInicioPerfilDVC();
            const cacheAtualPerfil = profileCacheDVC[normalizarEmailPerfilDVC(emailPerfil)] || {};
            const assinaturaPlanoPerfil = JSON.stringify(habilidadesCompostas || {});
            const [
                mediaCategoriaResult,
                planoEvolucaoResult,
                avaliacoesPendentesResult
            ] = await Promise.allSettled([
                cacheAtualPerfil.mediaCategoria !== undefined
                    ? Promise.resolve(cacheAtualPerfil.mediaCategoria)
                    : obterMediaPorCategoria(userData.subcategoria || userData.categoria || ""),
                cacheAtualPerfil.planoEvolucaoHtml !== undefined && cacheAtualPerfil.planoAssinatura === assinaturaPlanoPerfil
                    ? Promise.resolve(cacheAtualPerfil.planoEvolucaoHtml)
                    : (window.gerarPlanoEvolucaoHtml ? window.gerarPlanoEvolucaoHtml(emailPerfil, habilidadesCompostas) : Promise.resolve("")),
                cacheAtualPerfil.avaliacoesPendentesHtml !== undefined
                    ? Promise.resolve(cacheAtualPerfil.avaliacoesPendentesHtml)
                    : (window.usuarioEhEquipeTecnica() && typeof window.gerarHtmlAvaliacoesPendentesPerfil === "function"
                    ? window.gerarHtmlAvaliacoesPendentesPerfil(emailPerfil)
                    : Promise.resolve(""))
            ]);

            if (mediaCategoriaResult.status === "fulfilled") {
                mediaCategoria = mediaCategoriaResult.value;
            }

            if (planoEvolucaoResult.status === "fulfilled") {
                planoEvolucaoHtml = planoEvolucaoResult.value;
            }

            if (avaliacoesPendentesResult.status === "fulfilled") {
                avaliacoesPendentesHtml = avaliacoesPendentesResult.value;
            }

            salvarCachePerfilDVC(emailPerfil, {
                assinatura: cacheAtualPerfil.assinatura || cachePerfil.assinatura,
                mediaCategoria,
                planoEvolucaoHtml,
                avaliacoesPendentesHtml
            });

            if (!possuiAvaliacaoTecnicaRealPerfil) {
                planoEvolucaoHtml = "";
                habilidadesHtml = `
                    <div class="bg-white p-4 rounded-xl border mb-4 shadow-sm text-left">
                        <p class="text-[10px] font-black text-[#990000] uppercase mb-2">
                            <i class="fa-solid fa-hourglass-half mr-1"></i> Aguardando avaliaÃ§Ã£o
                        </p>
                        <p class="text-[10px] text-gray-500 font-semibold leading-relaxed mb-3">
                            Suas habilidades ainda nÃ£o foram aprovadas pela equipe tÃ©cnica. A nota padrÃ£o 3 nÃ£o serÃ¡ tratada como avaliaÃ§Ã£o real.
                        </p>
                        ${window.renderInfoCriteriosAvaliacaoDVC()}
                    </div>
                `;
            } else if (typeof window.gerarMapaHabilidadesDVC === "function") {
                const cacheMapaAtual = profileCacheDVC[normalizarEmailPerfilDVC(emailPerfil)] || {};
                habilidadesHtml = cacheMapaAtual.mapaHabilidadesHtml ||
                    window.gerarMapaHabilidadesDVC(habilidadesCompostas || {}, mediaCategoria, emailPerfil);
                salvarCachePerfilDVC(emailPerfil, {
                    assinatura: cachePerfil.assinatura,
                    mapaHabilidadesHtml: habilidadesHtml
                });
            } else {
                console.warn("FunÃ§Ã£o gerarMapaHabilidadesDVC nÃ£o encontrada.");
                habilidadesHtml = `
                    <p class="text-[10px] text-gray-400 italic">
                        Não foi possível carregar o mapa de habilidades agora.
                    </p>
                `;
            }

            perfLogPerfilDVC("gerar mapa/radar", inicioMapaRadar);

        } catch (erroHabilidades) {
            console.warn("Erro ao gerar habilidades tÃ©cnicas. O perfil serÃ¡ exibido mesmo assim:", erroHabilidades);
            habilidadesHtml = `
                <p class="text-[10px] text-gray-400 italic">
                    NÃ£o foi possÃ­vel carregar o nÃ­vel tÃ©cnico agora.
                </p>
            `;
        }

        // Sticky Header Component
        const stickyHeaderHtml = `
            <div class="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b px-4 py-3 mx-[-1rem] mt-[-1rem] mb-4 flex justify-between items-center shadow-sm">
                <div class="text-left">
                    <p class="text-xs font-black text-gray-800 uppercase tracking-wide truncate max-w-[185px]">
                        ${userData.nome || 'Atleta'}
                    </p>
                    <p class="text-[8px] font-bold text-gray-400 uppercase mt-0.5">
                        DVC App
                    </p>
                </div>
                <div class="flex gap-1.5 shrink-0">
                    <span onclick="mudarSubAbaPerfil('financeiro')" role="button" tabindex="0" class="cursor-pointer inline-flex items-center gap-1 border text-[8px] font-black px-2.5 py-1 rounded-full uppercase transition hover:scale-105 active:scale-95 ${financeiroPerfilCor}">
                        ${renderIconeLocalDVC(getIconeFinanceiroPerfilDVC(financeiroPerfilStatus), financeiroPerfilStatus, "w-3.5 h-3.5")}
                        ${financeiroPerfilStatus}
                    </span>
                    <span onclick="mudarSubAbaPerfil('presenca')" role="button" tabindex="0" class="cursor-pointer inline-flex items-center gap-1 bg-indigo-50 border border-indigo-200 text-indigo-700 text-[8px] font-black px-2.5 py-1 rounded-full uppercase transition hover:scale-105 active:scale-95">
                        ${renderIconeLocalDVC("assets/img/icon/Listab.webp", "Presenças", "w-3.5 h-3.5")}
                        PresenÃ§as: ${minhasPresencas}
                    </span>
                </div>
            </div>
        `;

        // Unified Ficha de Jogador (Player Card)
        const isFormacao = funcaoVolei === "formacao";
        const cardFichaHtml = `
            <div class="bg-gradient-to-br from-gray-900 via-gray-950 to-red-950 p-4 rounded-2xl mb-4 shadow-lg text-white border border-gray-800/80 relative overflow-hidden flex items-center justify-between gap-3 text-left">
                <div class="absolute -right-8 -bottom-10 opacity-10 pointer-events-none">
                    <img src="${projetoLogo}" class="w-32 h-32 object-contain">
                </div>
                
                <div class="flex items-center gap-3 min-w-0 z-10">
                    <div class="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center p-0.5 shrink-0 overflow-hidden">
                        <img src="${auth.currentUser?.photoURL || 'assets/img/logo.webp'}" class="w-full h-full object-cover rounded-xl" onerror="this.src='assets/img/logo.webp'">
                    </div>
                    <div class="min-w-0">
                        <p class="text-[8px] font-black uppercase text-white/50 truncate">Ficha de Jogador</p>
                        <h4 class="text-sm font-black uppercase tracking-wide text-white truncate max-w-[140px] mt-0.5">${userData.nome}</h4>
                        <div class="mt-1 inline-flex items-center gap-1.5 bg-white/10 border border-white/10 text-white px-2.5 py-0.5 rounded-full">
                            <span class="w-1.5 h-1.5 rounded-full ${isFormacao ? 'bg-yellow-400' : 'bg-green-400'} animate-pulse"></span>
                            <span class="text-[8px] font-black uppercase tracking-wider">${nomeFuncaoVolei}</span>
                        </div>
                    </div>
                </div>

                <div class="flex gap-2 shrink-0 z-10">
                    <div class="px-2.5 py-2 rounded-xl text-center flex flex-col justify-center border transition ${isFormacao ? 'bg-yellow-500/20 border-yellow-500/50 shadow-[0_0_12px_rgba(234,179,8,0.2)] scale-105' : 'bg-white/5 border-white/10 opacity-80'}">
                        <p class="text-[7px] font-black uppercase text-white/60">Geral</p>
                        <p class="text-lg font-black text-white leading-none mt-1">${scoreGeralPerfilTexto}</p>
                    </div>
                    <div class="px-2.5 py-2 rounded-xl text-center flex flex-col justify-center border transition ${!isFormacao ? 'bg-red-600/35 border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.25)] scale-105' : 'bg-white/5 border-white/10 opacity-80'}">
                        <p class="text-[7px] font-black uppercase text-white/60 font-bold">Posição</p>
                        <p class="text-lg font-black text-white leading-none mt-1">${scoreFuncaoPerfilTexto}</p>
                    </div>
                </div>
            </div>
        `;

        // Warning/Suspended banner (only active if not ok)
        const statusBannerHtml = isSuspenso
            ? `<div class="bg-red-100 border border-red-200 text-red-800 rounded-xl p-3.5 mb-3 text-[10px] font-bold uppercase flex items-center gap-2 shadow-sm text-left">
                  <i class="fa-solid fa-ban text-red-600 text-sm"></i>
                  <span>Você está SUSPENSO devido ao acúmulo de infrações! Fale com um treinador.</span>
               </div>`
            : (!ok
                ? `<div class="bg-amber-100 border border-amber-200 text-amber-800 rounded-xl p-3.5 mb-3 text-[10px] font-bold uppercase flex items-center gap-2 shadow-sm text-left">
                      <i class="fa-solid fa-triangle-exclamation text-amber-600 text-sm"></i>
                      <span>Situação irregular: verifique suas pendências financeiras.</span>
                   </div>`
                : "");

        // ExposiÃ§Ã£o das estrelas (Protagonismo) e advertÃªncias de forma recolhÃ­vel
        const protagonismoHtml = (userData.estrelas || []).length > 0 
            ? window.renderSecaoRecolhivelDVC({
                  id: "perfil-protagonismo-dvc",
                  titulo: "Registro de Protagonismo",
                  subtitulo: "Seus reconhecimentos e estrelas conquistadas",
                  icone: "fa-star",
                  aberta: false,
                  conteudo: `
                      <ul class="text-[10px] text-yellow-800 space-y-2 font-semibold text-left">
                          ${userData.estrelas.map(e => `
                              <li class="bg-yellow-50/50 border border-yellow-100 rounded-xl p-2.5 flex justify-between items-center">
                                  <span>${e.motivo}</span>
                                  <span class="text-[8px] font-black text-gray-400 uppercase shrink-0 ml-2">${e.data}</span>
                              </li>
                          `).join('')}
                      </ul>
                  `
              })
            : "";

        const infracoesHtml = advs.length > 0
            ? window.renderSecaoRecolhivelDVC({
                  id: "perfil-infracoes-dvc",
                  titulo: "Histórico de Infrações",
                  subtitulo: "Registro de advertências e ocorrências",
                  icone: "fa-triangle-exclamation",
                  aberta: false,
                  conteudo: `
                      <ul class="list-disc pl-4 text-[10px] text-red-700 space-y-1 font-semibold mb-3 text-left">
                          ${advs.map(motivo => `<li>${motivo}</li>`).join('')}
                      </ul>
                      ${isSuspenso ? `
                          <p class="text-[10px] font-black text-white bg-red-700 p-2.5 rounded-xl text-center uppercase shadow-sm">
                              Você está suspenso!
                          </p>
                      ` : ''}
                  `
              })
            : "";

        // Subtabs Navigation Layout (Sticky below header)
        const subTabsHtml = `
            <div class="bg-gray-100/80 border border-gray-100 rounded-2xl p-1 mb-4 flex gap-1 sticky top-[58px] z-20 backdrop-blur-md shadow-sm">
                <button id="btn-subaba-perfil-habilidades" onclick="mudarSubAbaPerfil('habilidades')" class="flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-[8px] font-black uppercase leading-tight transition ${classeBotaoSubAbaPerfil('habilidades')}">
                    ${renderIconeLocalDVC("assets/img/icon/dvcev.webp", "Evolução Técnica", "w-4 h-4 sm:w-5 sm:h-5 " + (subAbaPerfilAtiva === 'habilidades' ? 'opacity-100' : 'opacity-60'))}
                    Evolução Técnica
                </button>
                <button id="btn-subaba-perfil-financeiro" onclick="mudarSubAbaPerfil('financeiro')" class="flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-[8px] font-black uppercase leading-tight transition ${classeBotaoSubAbaPerfil('financeiro')}">
                    ${renderIconeLocalDVC("assets/img/icon/dvccart.webp", "Financeiro", "w-4 h-4 sm:w-5 sm:h-5 " + (subAbaPerfilAtiva === 'financeiro' ? 'opacity-100' : 'opacity-60'))}
                    Financeiro
                </button>
                <button id="btn-subaba-perfil-presenca" onclick="mudarSubAbaPerfil('presenca')" class="flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-[8px] font-black uppercase leading-tight transition ${classeBotaoSubAbaPerfil('presenca')}">
                    ${renderIconeLocalDVC("assets/img/icon/dvclist.webp", "Presenças", "w-4 h-4 sm:w-5 sm:h-5 " + (subAbaPerfilAtiva === 'presenca' ? 'opacity-100' : 'opacity-60'))}
                    Presenças
                </button>
            </div>
        `;

        // Collapsible Registration details edit block
        const dadosCadastraisHtml = window.renderSecaoRecolhivelDVC({
            id: "perfil-dados-cadastrais-dvc",
            titulo: "Dados Cadastrais",
            subtitulo: "Visualize ou edite seus dados pessoais",
            icone: "fa-address-card",
            aberta: false,
            conteudo: `
                <div class="space-y-4 relative pt-4 text-left">
                    <button 
                        onclick="toggleEditProfile()" 
                        id="btn-edit-toggle" 
                        class="absolute top-0 right-0 text-blue-600 text-[10px] font-black uppercase underline">
                        Editar
                    </button>

                    <div>
                        <label class="text-[9px] font-bold text-gray-400 uppercase">Nome</label>
                        <input 
                            id="p-nome" 
                            disabled 
                            value="${userData.nome || ''}" 
                            class="w-full text-sm font-bold border-b py-1 outline-none">
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="text-[9px] font-bold text-gray-400 uppercase">WhatsApp</label>
                            <input 
                                id="p-tel" 
                                disabled 
                                value="${userData.telefone || ''}" 
                                class="w-full text-sm font-bold border-b py-1 outline-none">
                        </div>

                        <div>
                            <label class="text-[9px] font-bold text-gray-400 uppercase">Sexo</label>
                            <select 
                                id="p-sexo" 
                                disabled 
                                class="w-full text-sm font-bold border-b py-1 outline-none">
                                <option value="M" ${userData.sexo === 'M' ? 'selected' : ''}>M</option>
                                <option value="F" ${userData.sexo === 'F' ? 'selected' : ''}>F</option>
                            </select>
                        </div>
                    </div>

                    <div class="pt-2 border-t">
                        <p class="text-[9px] font-bold text-red-800 uppercase mb-2">
                            ResponsÃ¡vel (Se menor de idade)
                        </p>

                        <div>
                            <label class="text-[9px] font-bold text-gray-400 uppercase">Nome</label>
                            <input 
                                id="p-resp-nome" 
                                disabled 
                                value="${userData.responsavelNome || ''}" 
                                class="w-full text-sm border-b py-1 outline-none">
                        </div>

                        <div>
                            <label class="text-[9px] font-bold text-gray-400 uppercase">WhatsApp</label>
                            <input 
                                id="p-resp-tel" 
                                disabled 
                                value="${userData.responsavelTel || ''}" 
                                class="w-full text-sm border-b py-1 outline-none">
                        </div>
                    </div>

                    <button 
                        id="btn-save-profile" 
                        onclick="saveProfileChanges()" 
                        class="hidden w-full bg-blue-600 text-white py-3 rounded-lg font-bold text-xs uppercase shadow-md mt-4">
                        Confirmar AlteraÃ§Ãµes
                    </button>
                </div>
            `
        });

        c.innerHTML = corrigirHtmlVisualPerfilDVC(`
            ${stickyHeaderHtml}
            ${modoTesteBannerHtml}
            ${statusBannerHtml}
            ${cardFichaHtml}
            ${avaliacoesPendentesHtml}
            ${subTabsHtml}

            <!-- Evolução Técnica Subtab -->
            <div id="sub-secao-habilidades" class="${subAbaPerfilAtiva !== 'habilidades' ? 'hidden' : ''}">
                ${habilidadesHtml}

                <details class="bg-white p-4 rounded-xl border mb-4 shadow-sm group text-left" ontoggle="window.toggleHistoricoTecnicoDVC(this, '${emailPerfil}')">
                    <summary class="flex justify-between items-center cursor-pointer outline-none select-none">
                        <div class="flex items-center gap-3">
                            <span class="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                                <i class="fa-solid fa-chart-line text-indigo-700"></i>
                            </span>
                            <span class="block text-[10px] font-black uppercase text-gray-700">HISTÓRICO TÉCNICO GERAL</span>
                        </div>
                        <i class="fa-solid fa-chevron-down text-gray-300 text-xs"></i>
                    </summary>
                    <div class="pt-4" id="container-historico-tecnico-${emailPerfil.replace(/[@.]/g, '')}">
                        <p class="text-[9px] text-gray-400 font-bold uppercase text-center">Abra para carregar o hist&oacute;rico t&eacute;cnico.</p>
                    </div>
                </details>

                ${planoEvolucaoHtml}
                ${inteligenciaJogoPerfilHtml}
                ${privacidadeScorePerfilHtml}
                ${avaliacoesParticipacaoPerfilHtml}
                ${protagonismoHtml}
                ${infracoesHtml}
                ${dadosCadastraisHtml}
            </div>

            <!-- Financeiro Subtab -->
            <div id="sub-secao-financeiro" class="${subAbaPerfilAtiva !== 'financeiro' ? 'hidden' : ''}">
                ${financeiroPerfilHtml}
                ${dadosCadastraisHtml}
            </div>

            <!-- FrequÃªncia / PresenÃ§a Subtab -->
            <div id="sub-secao-presenca" class="${subAbaPerfilAtiva !== 'presenca' ? 'hidden' : ''}">
                <div class="bg-gray-950 text-white p-4 rounded-2xl border border-gray-800 mb-4 shadow-sm text-left">
                    <p class="text-[8px] font-black uppercase text-white/50">FrequÃªncia DVC</p>
                    <p class="text-3xl font-black text-[#FFC107] leading-none mt-1">${minhasPresencas}</p>
                    <p class="text-[9px] font-bold uppercase text-white/60 mt-1">PresenÃ§as registradas</p>
                </div>
                ${proximosJogosHtml}
                ${historicoJogosHtml}
                ${dadosCadastraisHtml}
            </div>
        `);

        setTimeout(() => {
            if (precisaAutoAvaliacaoPerfil) {
                window.abrirModalAutoAvaliacaoObrigatoria();
            }
        }, 100);
        perfLogPerfilDVC("renderProfile total", inicioTotalPerfil);

    } catch (e) {
        console.error("Erro no Perfil", e);
        c.innerHTML = corrigirHtmlVisualPerfilDVC(`
            <p class="p-6 text-center text-red-600 font-bold uppercase">
                Erro ao carregar perfil. Verifique a conexÃ£o.
            </p>
        `);
    }
}
function toggleEditProfile() {
    const isEd = document.getElementById('btn-save-profile').classList.toggle('hidden') === false;
    ['p-nome', 'p-tel', 'p-resp-nome', 'p-resp-tel', 'p-sexo'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.disabled = !isEd;
    });
    const editToggle = document.getElementById('btn-edit-toggle');
    if (editToggle) {
        editToggle.innerText = isEd ? "Cancelar" : "Editar";
    }
}

// 5. saveProfileChanges
async function saveProfileChanges() {
    try {
        const upd = { 
            nome: document.getElementById('p-nome').value, 
            telefone: document.getElementById('p-tel').value, 
            sexo: document.getElementById('p-sexo').value,
            responsavelNome: document.getElementById('p-resp-nome').value,
            responsavelTel: document.getElementById('p-resp-tel').value
        };
        await updateDoc(doc(db, "users", auth.currentUser.email), upd); 
        location.reload();
    } catch (e) {
        console.error("Erro ao salvar altera\u00E7\u00F5es no perfil:", e);
        alert("N\u00E3o foi poss\u00EDvel salvar as altera\u00E7\u00F5es.");
    }
}

// Expose public functions to window
window.renderProfile = renderProfile;
window.mudarSubAbaPerfil = mudarSubAbaPerfil;
window.classeBotaoSubAbaPerfil = classeBotaoSubAbaPerfil;
window.toggleEditProfile = toggleEditProfile;
window.saveProfileChanges = saveProfileChanges;
window.obterMediaPorCategoria = obterMediaPorCategoria;
window.abrirMicroModalFinanceiroPerfilDVC = abrirMicroModalFinanceiroPerfilDVC;
window.toggleHabilidadeAccordionDVC = toggleHabilidadeAccordionDVC;
window.gerarMapaHabilidadesDVC = gerarMapaHabilidadesDVC;
window.atualizarHistoricoRadarDVC = atualizarHistoricoRadarDVC;
window.atualizarRadarDVC = atualizarRadarDVC;
window.selecionarHabilidadeRadarDVC = selecionarHabilidadeRadarDVC;
window.registrarHistoricoHabilidade = registrarHistoricoHabilidade;
window.carregarHistoricoHabilidadesAtletaDVC = carregarHistoricoHabilidadesAtletaDVC;
window.toggleHistoricoTecnicoDVC = toggleHistoricoTecnicoDVC;
window.limparCacheHistoricoHabilidades = limparCacheHistoricoHabilidades;
window.getPlanoPorCriterio = getPlanoPorCriterio;
window.obterFocosPlanoEvolucao = obterFocosPlanoEvolucao;
window.getSemanaAtualPlano = getSemanaAtualPlano;
window.getDiaAtualPlano = getDiaAtualPlano;
window.marcarTreinoPlanoRealizado = marcarTreinoPlanoRealizado;
window.gerarPlanoEvolucaoHtml = gerarPlanoEvolucaoHtml;
window.alternarPrivacidadeScoreTecnico = alternarPrivacidadeScoreTecnico;

// --- Expose Perfil C functions ---
window.carregarContribuicoesAtletaDVC = carregarContribuicoesAtletaDVC;
window.carregarAcessosAtletaDVC = carregarAcessosAtletaDVC;
window.limparCacheContribuicoesAtleta = limparCacheContribuicoesAtleta;
window.carregarEExibirPlanoEvolucaoDVC = carregarEExibirPlanoEvolucaoDVC;
window.carregarEExibirHistoricoJogosDVC = carregarEExibirHistoricoJogosDVC;
window.carregarEExibirRegistrosFinanceirosDVC = carregarEExibirRegistrosFinanceirosDVC;
window.renderSecaoRecolhivelDVC = renderSecaoRecolhivelDVC;
window.gerarAvaliacoesPendentesHtml = gerarAvaliacoesPendentesHtml;
window.gerarHtmlAvaliacoesPendentesPerfil = gerarAvaliacoesPendentesHtml;
window.aplicarAvaliacaoPendenteAtleta = aplicarAvaliacaoPendenteAtleta;
window.rejeitarAvaliacaoPendenteAtleta = rejeitarAvaliacaoPendenteAtleta;
window.atualizarResumoPendenciasAvaliacao = atualizarResumoPendenciasAvaliacao;
window.aprovarAvaliacaoEvento = aprovarAvaliacaoEvento;
window.rejeitarAvaliacaoEvento = rejeitarAvaliacaoEvento;
window.autorizarAvaliacaoAtletaPendente = autorizarAvaliacaoAtletaPendente;
window.rejeitarAvaliacaoAtletaPendente = rejeitarAvaliacaoAtletaPendente;
window.verDetalhesAvaliacaoPendente = verDetalhesAvaliacaoPendente;
window.aplicarEvolucaoGradual = aplicarEvolucaoGradual;

// --- Radar & Habilidades Helper Functions ---

function getHabilidadesPorFiltroDVC(filtro = "todas") {
    if (filtro === "tecnicos") return window.GRUPOS_HABILIDADES_DVC.tecnicos.habilidades;
    if (filtro === "taticos") return window.GRUPOS_HABILIDADES_DVC.taticos.habilidades;
    if (filtro === "socioemocionais") return window.GRUPOS_HABILIDADES_DVC.socioemocionais.habilidades;

    return window.TODAS_HABILIDADES_DVC;
}

function getNomeFiltroRadarDVC(filtro = "todas") {
    if (filtro === "tecnicos") return "CritÃ©rios TÃ©cnicos";
    if (filtro === "taticos") return "CritÃ©rios TÃ¡ticos";
    if (filtro === "socioemocionais") return "Soft Skills";

    return "Todas as Habilidades";
}

function gerarPontosRadarDVC(habilidades, listaSkills) {
    const centroX = 110;
    const centroY = 110;
    const raioMaximo = 78;

    return listaSkills.map((skill, index) => {
        const angulo = (-Math.PI / 2) + (2 * Math.PI * index / listaSkills.length);
        const nota = Number(habilidades[skill.id] ?? 3);
        const raio = (nota / 5) * raioMaximo;

        const x = centroX + raio * Math.cos(angulo);
        const y = centroY + raio * Math.sin(angulo);

        const labelX = centroX + (raioMaximo + 20) * Math.cos(angulo);
        const labelY = centroY + (raioMaximo + 20) * Math.sin(angulo);

        const eixoX = centroX + raioMaximo * Math.cos(angulo);
        const eixoY = centroY + raioMaximo * Math.sin(angulo);

        return {
            ...skill,
            nota,
            x,
            y,
            labelX,
            labelY,
            eixoX,
            eixoY
        };
    });
}

function renderizarConteudoRadarDVC(filtro = "todas") {
    const habilidades = window.normalizarHabilidadesDVC(window.habilidadesRadarAtualDVC || {});
    const mediaCategoriaObj = window.mediaCategoriaRadarDVC || null;
    const habilidadesMediaCategoria = (mediaCategoriaObj && mediaCategoriaObj.habilidades)
        ? window.normalizarHabilidadesDVC(mediaCategoriaObj.habilidades)
        : null;
    const listaSkills = getHabilidadesPorFiltroDVC(filtro);

    if (!window.habilidadeSelecionadaRadarDVC && listaSkills.length > 0) {
        window.habilidadeSelecionadaRadarDVC = listaSkills[0].id;
    }

    const pontos = gerarPontosRadarDVC(habilidades, listaSkills);
    const polygonPoints = pontos.map(p => `${p.x},${p.y}`).join(" ");
    const pontosMediaCategoria = habilidadesMediaCategoria
        ? gerarPontosRadarDVC(habilidadesMediaCategoria, listaSkills)
        : [];

    const polygonMediaCategoriaPoints = pontosMediaCategoria.length > 0
        ? pontosMediaCategoria.map(p => `${p.x},${p.y}`).join(" ")
        : "";
    const scoreGeral = window.calcularScoreGeralDVC(habilidades);
    const skillSelecionada = pontos.find(p => p.id === window.habilidadeSelecionadaRadarDVC) || pontos[0];

    const filtros = [
        { id: "todas", nome: "Todas" },
        { id: "tecnicos", nome: "TÃ©cnicas" },
        { id: "taticos", nome: "TÃ¡ticas" },
        { id: "socioemocionais", nome: "Soft Skills" }
    ];

    const filtrosHtml = filtros.map(item => {
        const ativo = filtro === item.id;

        return `
            <button 
                onclick="atualizarRadarDVC('${item.id}')"
                class="${ativo ? 'bg-[#990000] text-white' : 'bg-gray-100 text-gray-500'} px-3 py-2 rounded-full text-[8px] font-black uppercase">
                ${item.nome}
            </button>
        `;
    }).join('');

    const linhasGrade = [1, 2, 3, 4, 5].map(nivel => {
        const raio = (nivel / 5) * 78;

        const pontosGrade = listaSkills.map((skill, index) => {
            const angulo = (-Math.PI / 2) + (2 * Math.PI * index / listaSkills.length);
            const x = 110 + raio * Math.cos(angulo);
            const y = 110 + raio * Math.sin(angulo);

            return `${x},${y}`;
        }).join(" ");

        return `
            <polygon 
                points="${pontosGrade}" 
                fill="none" 
                stroke="#e5e7eb" 
                stroke-width="1">
            </polygon>
        `;
    }).join('');

    const eixosHtml = pontos.map(p => `
        <line 
            x1="110" 
            y1="110" 
            x2="${p.eixoX}" 
            y2="${p.eixoY}" 
            stroke="#e5e7eb" 
            stroke-width="1">
        </line>
    `).join('');

    const labelsHtml = pontos.map(p => {
        const texto = p.nome.length > 12 ? p.nome.slice(0, 11) + "." : p.nome;

        return `
            <text 
                x="${p.labelX}" 
                y="${p.labelY}" 
                text-anchor="middle" 
                dominant-baseline="middle" 
                font-size="7" 
                font-weight="800" 
                fill="#6b7280">
                ${texto}
            </text>
        `;
    }).join('');

    const pontosHtml = pontos.map(p => {
        const selecionado = p.id === window.habilidadeSelecionadaRadarDVC;

        return `
            <circle 
                cx="${p.x}" 
                cy="${p.y}" 
                r="${selecionado ? 6 : 4}" 
                fill="${selecionado ? '#f59e0b' : '#990000'}" 
                stroke="white" 
                stroke-width="2"
                style="cursor:pointer"
                onclick="selecionarHabilidadeRadarDVC('${p.id}')">
            </circle>
        `;
    }).join('');

    const detalheSelecionado = skillSelecionada ? `
        <div class="bg-red-50 border border-red-100 rounded-xl p-3 mb-4 text-left">
            <p class="text-[9px] font-black text-[#990000] uppercase mb-1">
                Habilidade selecionada
            </p>

            <div class="flex justify-between items-center">
                <p class="text-sm font-black text-gray-800 uppercase">
                    ${skillSelecionada.nome}
                </p>

                <span class="bg-white border text-[#990000] text-[10px] font-black px-2.5 py-1 rounded-full">
                    ${skillSelecionada.nota.toFixed(1)}/5
                </span>
            </div>

            <p class="text-[9px] text-gray-500 font-semibold mt-2">
                EficiÃªncia aproximada: ${Math.round((skillSelecionada.nota / 5) * 100)}%
            </p>
            ${habilidadesMediaCategoria ? `
                <p class="text-[9px] text-blue-700 font-bold mt-1">
                    MÃ©dia da categoria: ${Number(habilidadesMediaCategoria[skillSelecionada.id] || 0).toFixed(1)}/5
                </p>
                ` : ''}
            <div id="historico-habilidade-radar-dvc" class="mt-3 bg-white border border-dashed rounded-lg p-2">
                <p class="text-[8px] text-gray-400 font-bold uppercase">
                    Selecione uma habilidade para carregar o hist&oacute;rico.
                </p>
            </div>
        </div>
    ` : '';

    const emailPerfil = window.emailRadarAtualDVC || "";
    const userCached = emailPerfil ? window.DVC_CACHE.users.porEmail?.get(emailPerfil) : null;
    const funcaoVolei = userCached?.funcaoVolei || "formacao";
    const focos = obterFocosPlanoEvolucao(habilidades);
    const contagemSemana = window.contagemSemanaPerfilDVC || {};

    const accordionsHtml = pontos.map(p => {
        const percentual = Math.round((p.nota / 5) * 100);
        const peso = window.PESOS_FUNCAO_VOLEI_DVC[funcaoVolei]?.[p.id];
        const isImportantePosicao = peso && peso >= 1.5;
        const isFocoPlano = focos.some(f => f.chave === p.id);
        const plano = isFocoPlano ? getPlanoPorCriterio(p.id) : null;
        const realizados = isFocoPlano ? (contagemSemana[p.id] || 0) : 0;
        
        let priorityBadge = "";
        if (p.nota <= 2.5) {
            priorityBadge = `<span class="bg-red-50 border border-red-200 text-red-700 text-[7px] font-black px-1.5 py-0.5 rounded uppercase shrink-0">AtenÃ§Ã£o</span>`;
        } else if (isImportantePosicao) {
            priorityBadge = `<span class="bg-amber-50 border border-amber-200 text-amber-700 text-[7px] font-black px-1.5 py-0.5 rounded uppercase shrink-0 inline-flex items-center gap-1">${renderIconeLocalDVC("assets/img/icon/estrela.webp", "Prioridade", "w-3 h-3")} Prioridade</span>`;
        }

        let cardBorderClass = "border-gray-200";
        if (isFocoPlano) {
            cardBorderClass = "border-yellow-400 shadow-sm bg-yellow-50/5";
        } else if (isImportantePosicao) {
            cardBorderClass = "border-amber-300";
        }

        let interpretacao = "";
        if (p.nota < 2.0) {
            interpretacao = "Abaixo do esperado. Necessita de atenÃ§Ã£o imediata e treinos bÃ¡sicos.";
        } else if (p.nota < 3.0) {
            interpretacao = "Desenvolvimento inicial. Executa o fundamento com limitaÃ§Ãµes ou sob baixa pressÃ£o.";
        } else if (p.nota < 4.0) {
            interpretacao = "NÃ­vel intermediÃ¡rio. Executa com consistÃªncia razoÃ¡vel na maioria dos treinos.";
        } else if (p.nota < 4.8) {
            interpretacao = "NÃ­vel avanÃ§ado. Executa com precisÃ£o e controle sob pressÃ£o competitiva.";
        } else {
            interpretacao = "NÃ­vel de excelÃªncia/referÃªncia. DomÃ­nio completo e tomada de decisÃ£o refinada.";
        }

        const progressColorClass = p.nota >= 4.0 
            ? "bg-green-600" 
            : p.nota >= 3.0 
                ? "bg-indigo-600" 
                : p.nota >= 2.0 
                    ? "bg-amber-500" 
                    : "bg-red-600";

        return `
            <details class="bg-white border ${cardBorderClass} rounded-2xl mb-2 shadow-sm overflow-hidden" ontoggle="window.toggleHabilidadeAccordionDVC(this, '${emailPerfil}', '${p.id}')">
                <summary class="cursor-pointer list-none p-3.5 flex items-center justify-between gap-2 select-none">
                    <div class="flex items-center gap-2.5 min-w-0">
                        <span class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isFocoPlano ? 'bg-yellow-100 text-yellow-800' : 'bg-red-50 text-[#990000]'}">
                            <i class="fa-solid ${isFocoPlano ? 'fa-star' : 'fa-chart-bar'} text-xs"></i>
                        </span>
                        <div class="min-w-0">
                            <span class="block text-[10px] font-black uppercase text-gray-800 truncate">${p.nome}</span>
                            <div class="flex items-center gap-1.5 mt-0.5">
                                <span class="text-[9px] font-extrabold text-[#990000]">${p.nota.toFixed(1)}/5</span>
                                <span class="text-gray-300 text-[8px] font-bold">â€¢</span>
                                <span class="text-[8px] font-semibold text-gray-400">${percentual}%</span>
                                ${priorityBadge}
                            </div>
                        </div>
                    </div>
                    <i class="fa-solid fa-chevron-down text-gray-300 text-xs shrink-0 transition-transform duration-300"></i>
                </summary>
                <div class="px-4 pb-4 border-t border-gray-50 pt-3 space-y-3">
                    <div>
                        <div class="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                            <div class="h-full ${progressColorClass} rounded-full" style="width:${percentual}%"></div>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-2 text-[9px] text-left">
                        <div class="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                            <p class="font-black text-gray-400 uppercase font-bold">ImportÃ¢ncia</p>
                            <p class="font-extrabold text-gray-700 mt-1 uppercase">
                                ${peso ? `Peso para PosiÃ§Ã£o: ${peso.toFixed(1)}x` : "Peso para PosiÃ§Ã£o: Normal (1.0x)"}
                            </p>
                        </div>
                        <div class="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                            <p class="font-black text-gray-400 uppercase font-bold">RelevÃ¢ncia</p>
                            <p class="font-extrabold text-gray-700 mt-1 uppercase">
                                ${isImportantePosicao ? `${renderIconeLocalDVC("assets/img/icon/estrela.webp", "Alta relevância", "w-3 h-3")} Alta RelevÃ¢ncia` : 'RelevÃ¢ncia Geral PadrÃ£o'}
                            </p>
                        </div>
                    </div>

                    <div class="bg-gray-50/50 p-2.5 rounded-xl border border-gray-100/50 text-left">
                        <p class="text-[8px] font-black text-gray-400 uppercase mb-1">Como interpretamos esta nota</p>
                        <p class="text-[9px] text-gray-600 font-medium leading-relaxed">${interpretacao}</p>
                    </div>

                    ${plano ? `
                        <div class="bg-yellow-50/40 border border-yellow-200/80 rounded-2xl p-3 text-left">
                            <div class="flex justify-between items-center mb-2">
                                <p class="text-[9px] font-black text-yellow-800 uppercase flex items-center gap-1">
                                    <i class="fa-solid fa-route"></i> Plano de EvoluÃ§Ã£o Ativo
                                </p>
                                <span class="bg-yellow-100 text-yellow-900 text-[8px] font-black px-2 py-0.5 rounded-full uppercase shrink-0">Foco Ativo</span>
                            </div>
                            <p class="text-[9px] font-bold text-gray-800 uppercase mb-1">${plano.titulo}</p>
                            <p class="text-[9px] text-gray-600 font-medium mb-2 leading-relaxed">${plano.objetivo}</p>
                            
                            <div class="bg-white border border-yellow-100 rounded-xl p-2.5 mb-2">
                                <p class="text-[8px] font-black text-yellow-800 uppercase mb-1">Treino sugerido</p>
                                <p class="text-[9px] text-gray-700 font-bold leading-normal">${plano.treino}</p>
                            </div>

                            <button onclick="marcarTreinoPlanoRealizado('${p.id}')" class="w-full bg-gray-950 hover:bg-gray-900 text-white py-2 rounded-xl text-[9px] font-black uppercase transition active:scale-98">
                                <i class="fa-solid fa-check mr-1"></i> Marcar treino realizado
                            </button>
                            
                            <p class="text-[8px] text-gray-400 font-bold uppercase mt-2 text-center">
                                Realizado ${realizados} vez(es) nesta semana
                            </p>
                        </div>
                    ` : ""}

                    <div class="historico-criterio-container-dvc text-left border-t border-dashed border-gray-100 pt-3" data-loaded="false">
                        <p class="text-[8px] text-gray-400 font-bold uppercase"><i class="fa-solid fa-spinner fa-spin mr-1"></i> Carregando histórico...</p>
                    </div>
                </div>
            </details>
        `;
    }).join('');

    return `
        <div class="bg-white p-4 rounded-xl border mb-4 shadow-sm text-left">
            <div class="flex justify-between items-start gap-2 mb-3">
                <div>
                    <p class="text-[10px] font-black text-[#990000] uppercase">
                        <i class="fa-solid fa-chart-simple mr-1"></i> Mapa de Habilidades DVC
                    </p>

                    <p class="text-[8px] font-bold text-gray-400 uppercase mt-1">
                        ${getNomeFiltroRadarDVC(filtro)}
                    </p>
                </div>

                <div class="text-right">
                    <p class="text-[8px] font-black text-gray-400 uppercase">
                        Score Geral
                    </p>
                    <p class="text-2xl font-black text-[#990000]">
                        ${scoreGeral.toFixed(1)}
                    </p>
                </div>
            </div>

            <div class="flex flex-wrap gap-2 mb-4">
                ${filtrosHtml}
            </div>

            <div class="bg-gray-50 border rounded-2xl p-2 mb-4 flex justify-center">
                <svg viewBox="0 0 220 220" width="100%" height="240" style="max-width:280px;">
                    ${linhasGrade}
                    ${eixosHtml}

                    ${polygonMediaCategoriaPoints ? `
                        <polygon 
                            points="${polygonMediaCategoriaPoints}" 
                            fill="rgba(37,99,235,0.12)" 
                            stroke="#2563eb" 
                            stroke-width="1.5"
                            stroke-dasharray="3 2">
                        </polygon>
                    ` : ''}

                    <polygon 
                        points="${polygonPoints}" 
                        fill="rgba(153,0,0,0.18)" 
                        stroke="#990000" 
                        stroke-width="2">
                    </polygon>

                    ${pontosHtml}
                    ${labelsHtml}

                    <text x="110" y="112" text-anchor="middle" font-size="9" font-weight="900" fill="#990000">
                        DVC
                    </text>
                </svg>
            </div>
            <div class="flex justify-center gap-3 mb-4">
                <div class="flex items-center gap-1">
                    <span class="w-2.5 h-2.5 rounded-full bg-[#990000] inline-block"></span>
                    <span class="text-[8px] font-black text-gray-500 uppercase">Atleta</span>
                </div>

                ${mediaCategoriaObj ? `
                    <div class="flex items-center gap-1">
                        <span class="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span>
                        <span class="text-[8px] font-black text-gray-500 uppercase">
                            ${mediaCategoriaObj.tipo || "MÃ©dia da Categoria"}
                        </span>
                    </div>
                ` : ''}
            </div>
            ${detalheSelecionado}

            <details class="mt-4 pt-4 border-t border-gray-100 group">
                <summary class="cursor-pointer list-none flex items-center justify-between gap-3 select-none">
                    <span class="min-w-0">
                        <span class="text-[10px] font-black text-gray-700 uppercase flex items-center gap-1.5">
                            <i class="fa-solid fa-chart-column text-[#990000]"></i> Detalhamento das Habilidades
                        </span>
                        <span class="block text-[9px] font-bold text-gray-400 uppercase leading-snug mt-1">
                            Ver notas por fundamento, barras e detalhes tÃ©cnicos
                        </span>
                    </span>
                    <i class="fa-solid fa-chevron-down text-gray-300 text-xs shrink-0"></i>
                </summary>
                <div class="space-y-2 text-left mt-3">
                    ${accordionsHtml}
                </div>
            </details>
        </div>
    `;
}

function gerarMapaHabilidadesDVC(habilidades = {}, mediaCategoria = null, emailAluno = "") {
    window.habilidadesRadarAtualDVC = window.normalizarHabilidadesDVC(habilidades);
    window.mediaCategoriaRadarDVC = mediaCategoria;
    window.emailRadarAtualDVC = emailAluno;
    window.filtroRadarDVC = "todas";
    window.habilidadeSelecionadaRadarDVC = null;

    return `
        <div id="radar-habilidades-dvc">
            ${renderizarConteudoRadarDVC("todas")}
        </div>
    `;
}

async function atualizarHistoricoRadarDVC() {
    try {
        const box = document.getElementById("historico-habilidade-radar-dvc");

        if (!box) return;

        const emailAluno = window.emailRadarAtualDVC || "";
        const habilidadeId = window.habilidadeSelecionadaRadarDVC || "";

        if (!emailAluno || !habilidadeId) {
            box.innerHTML = `
                <p class="text-[8px] text-gray-400 font-bold uppercase">
                    Histórico indisponível para esta visualização.
                </p>
            `;
            box.innerHTML = corrigirHtmlVisualPerfilDVC(box.innerHTML);
            return;
        }

        box.innerHTML = `
            <p class="text-[8px] text-gray-400 font-bold uppercase">
                Carregando histórico...
            </p>
        `;

        box.innerHTML = corrigirHtmlVisualPerfilDVC(box.innerHTML);
        box.outerHTML = corrigirHtmlVisualPerfilDVC(await window.carregarHistoricoHabilidadeHtml(emailAluno, habilidadeId));

    } catch (e) {
        console.warn("Erro ao atualizar histÃ³rico do radar:", e);
    }
}

function atualizarRadarDVC(filtro = "todas") {
    window.filtroRadarDVC = filtro;

    const listaSkills = getHabilidadesPorFiltroDVC(filtro);

    if (!listaSkills.some(skill => skill.id === window.habilidadeSelecionadaRadarDVC)) {
        window.habilidadeSelecionadaRadarDVC = listaSkills[0]?.id || null;
    }

    const el = document.getElementById("radar-habilidades-dvc");

    if (el) {
        el.innerHTML = corrigirHtmlVisualPerfilDVC(renderizarConteudoRadarDVC(filtro));

    }
}

function selecionarHabilidadeRadarDVC(habilidadeId) {
    window.habilidadeSelecionadaRadarDVC = habilidadeId;
    window.atualizarRadarDVC(window.filtroRadarDVC || "todas");
    window.atualizarHistoricoRadarDVC();
}

async function registrarHistoricoHabilidade(emailAluno, criterio, valorAnterior, valorNovo, origem = "AvaliaÃ§Ã£o manual", detalhes = "") {
    try {
        const anterior = Number(valorAnterior || 0);
        const novo = Number(valorNovo || 0);

        if (anterior === novo) return;

        const diferenca = Number((novo - anterior).toFixed(1));

        await addDoc(collection(db, "users", emailAluno, "historicoHabilidades"), {
            criterio: criterio,
            valorAnterior: anterior,
            valorNovo: novo,
            diferenca: diferenca,
            origem: origem,
            detalhes: detalhes,
            registradoEm: new Date().toISOString(),
            registradoPor: window.currentUserData?.nome || auth.currentUser?.email || "Sistema",
        });
        window.limparCacheHistoricoHabilidades(emailAluno);

    } catch (e) {
        console.warn("Não foi possível registrar histórico da habilidade:", e);
    }
}

// --- Extracted Perfil B functions ---

async function carregarHistoricoHabilidadesAtletaDVC(email, force = false) {
  if (!email) return [];
  const inicioHistorico = perfInicioPerfilDVC();
  const key = normalizarEmailPerfilDVC(email);
  window.DVC_CACHE.historicoHabilidadesPorAtleta = window.DVC_CACHE.historicoHabilidadesPorAtleta || {};
  const cache = window.DVC_CACHE.historicoHabilidadesPorAtleta[key];

  if (!force && cache && Array.isArray(cache.dados) && Date.now() - cache.atualizadoEm < PERFIL_CACHE_TTL_DVC) {
    perfLogPerfilDVC("renderizar historico tecnico cache", inicioHistorico);
    return cache.dados;
  }

  const cacheKey = `historicoHabilidades_${key}`;
  const opcoes = { cacheKey, force, ttl: PERFIL_CACHE_TTL_DVC };

  const snap = await window.getDocsDVC(collection(db, "users", key, "historicoHabilidades"), opcoes);

  if (!snap || !snap.docs) return cache?.dados || [];

  const dados = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  window.DVC_CACHE.historicoHabilidadesPorAtleta[key] = { dados, atualizadoEm: Date.now() };
  window.salvarCacheDVC(cacheKey, { dados });
  perfLogPerfilDVC("renderizar historico tecnico fetch", inicioHistorico);
  return dados;
}

async function toggleHistoricoTecnicoDVC(detailsEl, email) {
    const inicioToggleHistorico = perfInicioPerfilDVC();
    if (!detailsEl.open) {
        if (window.chartHistoricoTecnicoDVC) {
            window.chartHistoricoTecnicoDVC.destroy();
            window.chartHistoricoTecnicoDVC = null;
        }
        return;
    }

    const containerId = `container-historico-tecnico-${email.replace(/[@.]/g, '')}`;
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = corrigirHtmlVisualPerfilDVC(`<div class="p-4 text-center"><i class="fa-solid fa-spinner fa-spin text-gray-400 text-xl"></i></div>`);

    try {
        const registros = await carregarHistoricoHabilidadesAtletaDVC(email);
        
        if (registros.length === 0) {
            container.innerHTML = corrigirHtmlVisualPerfilDVC(`<p class="text-[10px] text-gray-400 font-bold uppercase text-center">Nenhum histórico encontrado.</p>`);
            return;
        }

        registros.sort((a, b) => new Date(a.data) - new Date(b.data));

        const labels = registros.map(r => new Date(r.data).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }));
        const dataGeral = registros.map(r => r.scoreGeral || 0);

        container.innerHTML = corrigirHtmlVisualPerfilDVC(`
            <div class="w-full h-48 relative">
                <canvas id="canvas-historico-tecnico-${email.replace(/[@.]/g, '')}"></canvas>
            </div>
        `);

        const ctx = document.getElementById(`canvas-historico-tecnico-${email.replace(/[@.]/g, '')}`);

        if (window.chartHistoricoTecnicoDVC) {
            window.chartHistoricoTecnicoDVC.destroy();
        }

        window.chartHistoricoTecnicoDVC = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Score Geral',
                    data: dataGeral,
                    borderColor: '#4f46e5',
                    backgroundColor: 'rgba(79, 70, 229, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3,
                    pointBackgroundColor: '#4f46e5',
                    pointRadius: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 5,
                        ticks: { stepSize: 1, font: { size: 8 } }
                    },
                    x: {
                        ticks: { font: { size: 8 } }
                    }
                }
            }
        });
        perfLogPerfilDVC("renderizar historico tecnico", inicioToggleHistorico);
    } catch (err) {
        console.error("Erro ao carregar historico tecnico", err);
        container.innerHTML = `<p class="text-[10px] text-red-500 font-bold uppercase text-center">Erro ao carregar grÃ¡fico.</p>`;
        container.innerHTML = corrigirHtmlVisualPerfilDVC(container.innerHTML);
    }
}

function limparCacheHistoricoHabilidades(email = null) {
  if (email) {
    const key = window.normalizarEmailDVC ? window.normalizarEmailDVC(email) : email.trim().toLowerCase();
    delete window.DVC_CACHE.historicoHabilidadesPorAtleta[key];
  } else {
    window.DVC_CACHE.historicoHabilidadesPorAtleta = {};
  }
}

function getPlanoPorCriterio(criterio) {
    const planos = {
        recepcao: {
            titulo: "Melhorar RecepÃ§Ã£o",
            objetivo: "Aumentar o controle da primeira bola e melhorar a qualidade do passe.",
            treino: "Treino de recepÃ§Ã£o dirigida",
            passos: [
                "Posicione-se com joelhos semiflexionados e braÃ§os preparados.",
                "PeÃ§a para alguÃ©m lanÃ§ar ou sacar bolas em diferentes direÃ§Ãµes.",
                "Tente direcionar a bola para uma zona-alvo definida.",
                "Repita o exercÃ­cio focando mais no controle do que na forÃ§a."
            ],
            meta: "Realizar 3 sÃ©ries de 15 recepÃ§Ãµes controladas."
        },

        levantamento: {
            titulo: "Melhorar Levantamento",
            objetivo: "Aprimorar precisÃ£o, postura e tomada de decisÃ£o no segundo toque.",
            treino: "Treino de levantamento para alvo",
            passos: [
                "Fique embaixo da bola antes de executar o toque.",
                "Use pernas e braÃ§os juntos para dar direÃ§Ã£o.",
                "Escolha um alvo fixo e tente levantar sempre para ele.",
                "Varie a distÃ¢ncia para simular situaÃ§Ãµes reais de jogo."
            ],
            meta: "Realizar 3 sÃ©ries de 20 levantamentos para alvo."
        },

        ataque: {
            titulo: "Melhorar Ataque",
            objetivo: "Desenvolver coordenaÃ§Ã£o de passada, tempo de bola e direÃ§Ã£o do ataque.",
            treino: "Treino de passada e finalizaÃ§Ã£o",
            passos: [
                "Treine a sequÃªncia de passadas sem bola.",
                "Depois, execute a passada com lanÃ§amento simples.",
                "Foque no braÃ§o alto e contato com a bola Ã  frente do corpo.",
                "Alterne ataques na diagonal e na paralela."
            ],
            meta: "Realizar 30 ataques controlados, priorizando direÃ§Ã£o e tÃ©cnica."
        },

        bloqueio: {
            titulo: "Melhorar Bloqueio",
            objetivo: "Aprimorar tempo de salto, posicionamento e leitura do atacante.",
            treino: "Treino de deslocamento e bloqueio",
            passos: [
                "Comece prÃ³ximo Ã  rede, com braÃ§os preparados.",
                "Treine deslocamentos laterais curtos.",
                "Salte com os dois braÃ§os firmes e mÃ£os invadindo o espaÃ§o da rede.",
                "Observe o braÃ§o do atacante para ajustar o tempo do bloqueio."
            ],
            meta: "Realizar 3 sÃ©ries of 10 bloqueios com deslocamento."
        },

        defesa: {
            titulo: "Melhorar Defesa",
            objetivo: "Aumentar reaÃ§Ã£o, posicionamento e controle das bolas atacadas.",
            treino: "Treino de defesa baixa",
            passos: [
                "Mantenha postura baixa e peso do corpo Ã  frente.",
                "PeÃ§a ataques ou lanÃ§amentos rÃ¡pidos em diferentes direÃ§Ãµes.",
                "Priorize manter a bola em jogo, mesmo sem passe perfeito.",
                "ApÃ³s defender, recupere rapidamente a posiÃ§Ã£o."
            ],
            meta: "Realizar 3 sÃ©ries de 12 defesas com recuperaÃ§Ã£o."
        },

        saque: {
            titulo: "Melhorar Saque",
            objetivo: "Aumentar regularidade, direÃ§Ã£o e confianÃ§a no saque.",
            treino: "Treino de saque por zones",
            passos: [
                "Escolha uma zona da quadra adversÃ¡ria como alvo.",
                "Execute saques buscando precisÃ£o antes da forÃ§a.",
                "Anote quantos saques entram na zona escolhida.",
                "Depois varie os alvos para desenvolver controle."
            ],
            meta: "Realizar 30 saques, tentando acertar pelo menos 18 na quadra."
        },

        antecipacao: {
            titulo: "Melhorar AntecipaÃ§Ã£o",
            objetivo: "Desenvolver leitura prÃ©via das jogadas e reaÃ§Ã£o mais rÃ¡pida.",
            treino: "Treino de observaÃ§Ã£o e reaÃ§Ã£o",
            passos: [
                "Observe a posiÃ§Ã£o corporal do adversÃ¡rio antes do toque na bola.",
                "Tente prever para onde a bola serÃ¡ enviada.",
                "Movimente-se antes da bola chegar, sem abandonar sua zona.",
                "ApÃ³s cada jogada, reflita se sua leitura foi correta."
            ],
            meta: "Durante o treino, registrar mentalmente 10 situaÃ§Ãµes de antecipaÃ§Ã£o."
        },

        tomadaDecisao: {
            titulo: "Melhorar Tomada de DecisÃ£o",
            objetivo: "Escolher melhor entre atacar, passar, largar, defender ou reorganizar a jogada.",
            treino: "Treino de escolhas em situaÃ§Ã£o de jogo",
            passos: [
                "Em cada bola, observe quantas opÃ§Ãµes vocÃª tem.",
                "Evite decidir antes de ver a posiÃ§Ã£o dos colegas e adversÃ¡rios.",
                "Escolha a aÃ§Ã£o mais segura quando estiver desequilibrado.",
                "Escolha a aÃ§Ã£o mais agressiva quando estiver bem posicionado."
            ],
            meta: "Identificar 5 boas decisÃµes e 3 decisÃµes a melhorar durante o treino."
        },

        leituraJogo: {
            titulo: "Melhorar Leitura de Jogo",
            objetivo: "Compreender melhor os espaÃ§os vazios e a movimentaÃ§Ã£o antes da partida.",
            treino: "Treino de leitura de espaÃ§os",
            passos: [
                "Antes da bola vir, observe os espaÃ§os livres na quadra.",
                "Perceba quais jogadores adversÃ¡rios estÃ£o fora de posiÃ§Ã£o.",
                "Comunique aos colegas quando identificar uma oportunidade.",
                "Depois da jogada, avalie se havia uma opÃ§Ã£o melhor."
            ],
            meta: "Apontar pelo menos 5 espaÃ§os ou oportunidades durante o treino."
        },

        resiliencia: {
            titulo: "Melhorar ResiliÃªncia",
            objetivo: "Manter foco, postura e confianÃ§a mesmo apÃ³s erros.",
            treino: "Treino de resposta ao erro",
            passos: [
                "ApÃ³s errar, respire e volte rapidamente para a prÃ³xima jogada.",
                "Evite demonstrar frustraÃ§Ã£o que prejudique a equipe.",
                "Transforme o erro em ajuste: pense no que corrigir.",
                "Incentive outro colega apÃ³s um erro dele."
            ],
            meta: "Durante o treino, reagir positivamente a pelo menos 3 erros."
        },

        comunicacaoQuadra: {
            titulo: "Melhorar ComunicaÃ§Ã£o em Quadra",
            objetivo: "Aumentar clareza, frequÃªncia e objetividade na comunicaÃ§Ã£o durante o jogo.",
            treino: "Treino de comunicaÃ§Ã£o ativa",
            passos: [
                "Chame todas as bolas que forem suas.",
                "Avise bloqueio, cobertura, bola fora ou bola curta.",
                "Use comandos curtos e claros.",
                "Mantenha comunicaÃ§Ã£o positiva com os colegas."
            ],
            meta: "Comunicar-se ativamente em pelo menos 15 jogadas do treino."
        },

        trabalhoEquipe: {
            titulo: "Melhorar Trabalho em Equipe",
            objetivo: "Fortalecer cooperaÃ§Ã£o, apoio e responsabilidade coletiva em quadra.",
            treino: "Treino de cooperaÃ§Ã£o em jogo",
            passos: [
                "Ajude colegas no posicionamento sem criticar.",
                "Cubra o espaÃ§o deixado por outro jogador.",
                "Comemore boas aÃ§Ãµes coletivas, nÃ£o apenas pontos.",
                "Assuma responsabilidade quando sua aÃ§Ã£o prejudicar a equipe."
            ],
            meta: "Realizar pelo menos 5 aÃ§Ãµes claras de apoio Ã  equipe durante o treino."
        }
    };

    return planos[criterio] || {
        titulo: "Plano de EvoluÃ§Ã£o",
        objetivo: "Desenvolver uma habilidade importante para sua evoluÃ§Ã£o.",
        treino: "Treino individual orientado",
        passos: [
            "Revise o fundamento indicado.",
            "Pratique com atenÃ§Ã£o Ã  execuÃ§Ã£o correta.",
            "PeÃ§a feedback ao treinador.",
            "Repita o exercÃ­cio durante a semana."
        ],
        meta: "Realizar o treino sugerido pelo menos 2 vezes na semana."
    };
}

function obterFocosPlanoEvolucao(habilidades) {
    const h = window.normalizarHabilidadesDVC ? window.normalizarHabilidadesDVC(habilidades || {}) : (habilidades || {});
    const avaliados = window.TODAS_HABILIDADES_DVC
        .map(skill => ({
            chave: skill.id,
            nome: skill.nome,
            nota: Number(h[skill.id] || 3),
            plano: getPlanoPorCriterio(skill.id)
        }))
        .filter(item => item.plano && item.nota > 0);

    if (avaliados.length === 0) {
        return [];
    }

    avaliados.sort((a, b) => a.nota - b.nota);

    return avaliados.slice(0, 3);
}

function getSemanaAtualPlano() {
    const hoje = new Date();
    const primeiroDiaAno = new Date(hoje.getFullYear(), 0, 1);
    const dias = Math.floor((hoje - primeiroDiaAno) / (24 * 60 * 60 * 1000));
    const semana = Math.ceil((dias + primeiroDiaAno.getDay() + 1) / 7);

    return hoje.getFullYear() + "-S" + String(semana).padStart(2, "0");
}

function getDiaAtualPlano() {
    const hoje = new Date();
    return hoje.getFullYear() + "-" +
        String(hoje.getMonth() + 1).padStart(2, "0") + "-" +
        String(hoje.getDate()).padStart(2, "0");
}

async function marcarTreinoPlanoRealizado(criterio) {
    try {
        const emailAluno = window.modoTestePerfilEmail || auth.currentUser.email;

        if (window.modoTestePerfilEmail) {
            return alert("No modo teste, nÃ£o Ã© possÃ­vel marcar treino realizado pelo atleta.");
        }

        const dia = getDiaAtualPlano();
        const semana = getSemanaAtualPlano();

        const docId = `${criterio}_${dia}`;

        const registroRef = doc(db, "users", emailAluno, "planoTreinoRegistros", docId);
        const registroSnap = await getDoc(registroRef);

        if (registroSnap.exists()) {
            return alert("VocÃª jÃ¡ marcou este treino hoje. Tente novamente amanhÃ£.");
        }

        await setDoc(registroRef, {
            criterio: criterio,
            semana: semana,
            dia: dia,
            realizadoEm: new Date().toISOString(),
            origem: "planoAutomatico"
        });

        alert("Treino registrado com sucesso!");

        renderProfile();

    } catch (e) {
        console.error("Erro ao marcar treino realizado:", e);
        alert("NÃ£o foi possÃ­vel registrar o treino agora.");
    }
}

async function gerarPlanoEvolucaoHtml(emailAluno, habilidades) {
    const inicioPlano = perfInicioPerfilDVC();
    const emailKey = normalizarEmailPerfilDVC(emailAluno);
    const cachePerfil = profileCacheDVC[emailKey];
    const assinaturaPlano = JSON.stringify(habilidades || {});
    if (
        cachePerfil?.planoEvolucaoHtml &&
        cachePerfil.planoAssinatura === assinaturaPlano &&
        Date.now() - cachePerfil.ts < PERFIL_CACHE_TTL_DVC
    ) {
        window.contagemSemanaPerfilDVC = cachePerfil.contagemSemana || {};
        perfLogPerfilDVC("gerar plano evolucao cache", inicioPlano);
        return cachePerfil.planoEvolucaoHtml;
    }

    const focos = obterFocosPlanoEvolucao(habilidades);

    if (focos.length === 0) {
        const planoVazioHtml = renderSecaoRecolhivelDVC({
            id: "perfil-plano-evolucao-individual-dvc",
            titulo: "Plano de EvoluÃ§Ã£o Individual",
            subtitulo: "Treinos sugeridos com base nas habilidades que mais precisam evoluir",
            icone: "fa-route",
            aberta: false,
            conteudo: `
                <div class="bg-gray-50 border border-dashed rounded-xl p-4 text-center">
                    <p class="text-[10px] text-gray-400 font-bold uppercase">
                        O plano serÃ¡ gerado apÃ³s a primeira avaliaÃ§Ã£o tÃ©cnica.
                    </p>
                </div>
            `
        });
        salvarCachePerfilDVC(emailAluno, {
            planoEvolucaoHtml: planoVazioHtml,
            planoAssinatura: assinaturaPlano,
            contagemSemana: {}
        });
        perfLogPerfilDVC("gerar plano evolucao vazio", inicioPlano);
        return planoVazioHtml;
    }

    const semanaAtual = getSemanaAtualPlano();
    const contagemSemana = {};

    try {
        const registrosSnap = await getDocs(collection(db, "users", emailAluno, "planoTreinoRegistros"));

        registrosSnap.forEach(docRegistro => {
            const reg = docRegistro.data();

            if (reg.semana !== semanaAtual) return;

            contagemSemana[reg.criterio] = (contagemSemana[reg.criterio] || 0) + 1;
        });
    } catch (erroRegistrosPlano) {
        console.warn("NÃ£o foi possÃ­vel carregar registros do plano. O plano serÃ¡ exibido sem contagem semanal", erroRegistrosPlano);
    }

    const cardsPlanoHtml = focos.map((item, index) => {
        const plano = item.plano;
        const nota = item.nota;
        const realizados = contagemSemana[item.chave] || 0;

        let prioridadeClasse = "bg-yellow-50 border-yellow-200 text-yellow-800";
        let prioridadeTexto = "Prioridade MÃ©dia";

        if (nota <= 2) {
            prioridadeClasse = "bg-red-50 border-red-200 text-red-800";
            prioridadeTexto = "Prioridade Alta";
        }

        const passosHtml = plano.passos.map((passo, i) => `
            <li class="text-[10px] text-gray-600 font-semibold leading-relaxed">
                <span class="font-black text-[#990000]">${i + 1}.</span> ${passo}
            </li>
        `).join('');

        return `
            <div class="border rounded-2xl p-4 mb-3 bg-white shadow-sm">
                <div class="flex justify-between items-start gap-2 mb-3">
                    <div>
                        <p class="text-[9px] font-black text-gray-400 uppercase">
                            Foco ${index + 1}
                        </p>
                        <p class="text-sm font-black text-gray-800 uppercase">
                            ${plano.titulo}
                        </p>
                    </div>

                    <div class="text-right shrink-0">
                        <span class="${prioridadeClasse} inline-flex items-center justify-center gap-1 whitespace-nowrap leading-none border text-[8px] font-black px-2.5 py-1 rounded-full uppercase">
                            ${prioridadeTexto.replace("Prioridade ", "Prioridade: ")}
                        </span>
                        <p class="text-[9px] font-black text-[#990000] mt-2">
                            Nota atual: ${nota}/5
                        </p>
                    </div>
                </div>

                <div class="bg-gray-50 border rounded-xl p-3 mb-3">
                    <p class="text-[9px] font-black text-gray-500 uppercase mb-1">
                        Objetivo
                    </p>
                    <p class="text-[10px] text-gray-700 font-semibold leading-relaxed">
                        ${plano.objetivo}
                    </p>
                </div>

                <div class="bg-red-50 border border-red-100 rounded-xl p-3 mb-3">
                    <p class="text-[9px] font-black text-[#990000] uppercase mb-1">
                        Treino sugerido
                    </p>
                    <p class="text-[10px] text-red-900 font-semibold leading-relaxed">
                        ${plano.treino}
                    </p>
                </div>

                <div class="mb-3">
                    <p class="text-[9px] font-black text-gray-500 uppercase mb-2">
                        Como fazer
                    </p>
                    <ul class="space-y-1">
                        ${passosHtml}
                    </ul>
                </div>

                <div class="bg-green-50 border border-green-100 rounded-xl p-3 mb-3">
                    <p class="text-[9px] font-black text-green-800 uppercase mb-1">
                        Meta da semana
                    </p>
                    <p class="text-[10px] text-green-900 font-semibold leading-relaxed">
                        ${plano.meta}
                    </p>
                </div>

                <div class="grid grid-cols-1 gap-2">
                    ${plano.videoUrl ? `
                        <a 
                            href="${plano.videoUrl}" 
                            target="_blank" 
                            class="block w-full text-center bg-[#990000] text-white py-2 rounded-lg text-[9px] font-black uppercase">
                            <i class="fa-solid fa-play mr-1"></i> Assistir demonstraÃ§Ã£o
                        </a>
                    ` : ''}

                    <button 
                        onclick="marcarTreinoPlanoRealizado('${item.chave}')"
                        class="w-full bg-gray-900 text-white py-2 rounded-lg text-[9px] font-black uppercase">
                        <i class="fa-solid fa-check mr-1"></i> Marcar treino realizado
                    </button>
                </div>

                <p class="text-[9px] text-gray-400 font-bold uppercase mt-3 text-center">
                    Realizado ${realizados} vez(es) nesta semana
                </p>
            </div>
        `;
    });

    const focoPrincipalHtml = cardsPlanoHtml[0] || "";
    const proximosFocosHtml = cardsPlanoHtml.slice(1).join("");

    const planoHtml = renderSecaoRecolhivelDVC({
        id: "perfil-plano-evolucao-individual-dvc",
        titulo: "Plano de EvoluÃ§Ã£o Individual",
        subtitulo: "Treinos sugeridos com base nas habilidades que mais precisam evoluir",
        icone: "fa-route",
        aberta: false,
        conteudo: `
            <p class="text-[9px] font-black text-gray-400 uppercase mb-2">
                Foco principal da semana
            </p>
            ${focoPrincipalHtml}

            ${proximosFocosHtml ? window.renderSecaoRecolhivelDVC({
                id: "perfil-plano-completo-evolucao-dvc",
                titulo: "PrÃ³ximos focos",
                subtitulo: "Foco 2, Foco 3 e plano completo",
                icone: "fa-list-check",
                aberta: false,
                conteudo: proximosFocosHtml
            }) : ""}
        `
    });
    salvarCachePerfilDVC(emailAluno, {
        planoEvolucaoHtml: planoHtml,
        planoAssinatura: assinaturaPlano,
        contagemSemana
    });
    perfLogPerfilDVC("gerar plano evolucao fetch", inicioPlano);
    return planoHtml;
}

async function alternarPrivacidadeScoreTecnico(novoValor) {
    try {
        await updateDoc(doc(db, "users", auth.currentUser.email), {
           scoreTecnicoPublico: novoValor
        });

        if (window.currentUserData) {
            window.currentUserData.scoreTecnicoPublico = novoValor;
        }

        alert(novoValor 
            ? "Seu score agora estÃ¡ visÃ­vel para outros atletas no ranking." 
            : "Seu score agora estÃ¡ oculto para outros atletas no ranking."
        );

        renderProfile();

    } catch (e) {
        console.error("Erro ao alterar privacidade do score:", e);
        alert("NÃ£o foi possÃ­vel alterar a privacidade do score agora.");
    }
}

// --- Perfil C Integration Functions ---

async function carregarContribuicoesAtletaDVC(email, force = false) {
    if (!email) return [];
    const inicioFinanceiro = perfInicioPerfilDVC();
    const key = window.normalizarEmailDVC(email);
    const cache = window.DVC_CACHE.contribuicoesPorAtleta[key];
    if (!force && cache && Array.isArray(cache.dados) && Date.now() - cache.atualizadoEm < 2 * 60 * 1000) {
        perfLogPerfilDVC("carregar financeiro cache", inicioFinanceiro);
        return cache.dados;
    }
    if (window.DVC_DEBUG_PERFORMANCE === true) console.log("[DVC leitura] contribuicoes atleta", key);
    const snap = await getDocs(collection(db, "users", key, "contribuicoes"));
    const dados = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    window.DVC_CACHE.contribuicoesPorAtleta[key] = { dados, atualizadoEm: Date.now() };
    perfLogPerfilDVC("carregar financeiro fetch", inicioFinanceiro);
    return dados;
}

async function carregarAcessosAtletaDVC(email, force = false) {
    if (!email) return [];
    const inicioAcessos = perfInicioPerfilDVC();
    const key = window.normalizarEmailDVC(email);
    const cache = window.DVC_CACHE.acessosPorAtleta[key];
    if (!force && cache && Array.isArray(cache.dados) && Date.now() - cache.atualizadoEm < 2 * 60 * 1000) {
        perfLogPerfilDVC("carregar acessos cache", inicioAcessos);
        return cache.dados;
    }
    if (window.DVC_DEBUG_PERFORMANCE === true) console.log("[DVC leitura] acessos", key);
    const snap = await getDocs(collection(db, "users", key, "acessos"));
    const dados = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    window.DVC_CACHE.acessosPorAtleta[key] = { dados, atualizadoEm: Date.now() };
    perfLogPerfilDVC("carregar acessos fetch", inicioAcessos);
    return dados;
}

function limparCacheContribuicoesAtleta(email = null) {
    if (email) delete window.DVC_CACHE.contribuicoesPorAtleta[window.normalizarEmailDVC(email)];
    else window.DVC_CACHE.contribuicoesPorAtleta = {};
}

async function carregarEExibirPlanoEvolucaoDVC(email, btn) {
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1"></i> Carregando...`;
    btn.disabled = true;
    try {
        const userRef = doc(db, "users", email);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data() || {};
        const habilidades = window.normalizarHabilidadesDVC(userData.habilidades || {});
        const html = await window.gerarPlanoEvolucaoHtml(email, habilidades);
        const containerId = `container-plano-evolucao-${email.replace(/[@.]/g, '')}`;
        const container = document.getElementById(containerId);
        if (container) container.outerHTML = corrigirHtmlVisualPerfilDVC(html);
    } catch (e) {
        console.error("Erro DVC Plano EvoluÃ§Ã£o:", e);
        btn.innerHTML = corrigirHtmlVisualPerfilDVC(`Nenhum registro encontrado.`);
    }
}

async function carregarEExibirHistoricoJogosDVC(emailAtual) {
    const inicioPresencas = perfInicioPerfilDVC();
    const container = document.getElementById('sub-secao-presenca');
    if (!container) return;

    container.innerHTML = `
        <div class="p-6 text-center text-gray-500">
            <i class="fa-solid fa-spinner fa-spin text-2xl mb-2"></i>
            <p class="text-xs font-black uppercase">Carregando frequÃªncias...</p>
        </div>
    `;

    container.innerHTML = corrigirHtmlVisualPerfilDVC(container.innerHTML);

    try {
        const emailLimpo = String(emailAtual).trim().toLowerCase();
        const dadosAtleta = window.DVC_CACHE?.users?.porEmail?.get(emailLimpo) || { presencas: 0 };
        const eventsSnap = await window.carregarEventosCacheMockDVC();
        const eventosPerfil = eventsSnap.docs.map(doc => ({ id: doc.id, data: doc.data() }));
        
        let proximosJogosHtml = "";
        let historicoJogosHtml = "";

        const agora = new Date();
        let jogosProximos = [];
        let historicoJogos = [];
        let totalConvocado = 0;
        let totalParticipou = 0;

        for (const evento of eventosPerfil) {
            const ev = evento.data;
            if (ev.tipo !== "jogo") continue;

            const convocadosEmails = Array.isArray(ev.convocadosEmails)
                ? ev.convocadosEmails.map(email => String(email).trim().toLowerCase())
                : [];
            const fuiConvocado = convocadosEmails.includes(emailLimpo);

            const dataJogo = new Date(ev.data);

            if (ev.status !== "concluido" && !isNaN(dataJogo.getTime()) && dataJogo >= agora) {
                jogosProximos.push({ id: evento.id, ...ev, fuiConvocado });
                continue;
            }

            if (!fuiConvocado) continue;

            totalConvocado++;

            const presencas = await window.carregarPresencasEventoDVC(evento.id);
            const participou = presencas.some(p => String(p.id).trim().toLowerCase() === emailLimpo);

            if (participou) totalParticipou++;

            if (ev.status === "concluido") {
                historicoJogos.push({
                    id: evento.id,
                    titulo: ev.titulo || "Jogo / Amistoso",
                    adversario: ev.adversario || "",
                    data: ev.data || "",
                    local: ev.local || "",
                    equipe: ev.equipe || "",
                    participou
                });
            }
        }

        jogosProximos.sort((a, b) => new Date(a.data) - new Date(b.data));
        const uÃšltimosProximos = jogosProximos.slice(0, 3);

        if (uÃšltimosProximos.length > 0) {
            proximosJogosHtml = `
                <div class="bg-white p-4 rounded-xl border mb-4 shadow-sm">
                    <p class="text-[10px] font-black text-[#990000] uppercase mb-3">
                        <i class="fa-solid fa-volleyball mr-1"></i> PrÃ³ximos Jogos
                    </p>
                    <div class="space-y-3">
                        ${uÃšltimosProximos.map(jogo => `
                            <div class="${jogo.fuiConvocado ? 'bg-red-50 border-red-300' : 'bg-gray-50 border-gray-200'} border rounded-xl p-3 relative overflow-hidden">
                                <div class="flex justify-between items-start gap-2 mb-2">
                                    <p class="text-xs font-black uppercase ${jogo.fuiConvocado ? 'text-red-800' : 'text-gray-700'}">
                                        ${jogo.titulo || 'Jogo'}
                                    </p>
                                    ${jogo.fuiConvocado ? `<span class="bg-[#990000] text-white text-[8px] font-black px-2 py-1 rounded-full uppercase">Convocado</span>` : `<span class="bg-gray-200 text-gray-600 text-[8px] font-black px-2 py-1 rounded-full uppercase">Torcida</span>`}
                                </div>
                                <p class="text-[10px] text-gray-600 font-semibold mt-1">
                                    <i class="fa-regular fa-clock mr-1"></i> ${new Date(jogo.data).toLocaleString('pt-BR')}
                                </p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        historicoJogos.sort((a, b) => new Date(b.data) - new Date(a.data));
        const uÃšltimosJogos = historicoJogos.slice(0, 5);
        const percentualParticipacao = totalConvocado > 0 ? Math.round((totalParticipou / totalConvocado) * 100) : 0;

        if (totalConvocado > 0) {
            historicoJogosHtml = `
                <div class="bg-white p-4 rounded-xl border mb-4 shadow-sm">
                    <div class="flex justify-between items-center mb-4">
                        <div>
                            <p class="text-[10px] font-black text-gray-700 uppercase">
                                <i class="fa-solid fa-clock-rotate-left mr-1"></i> HistÃ³rico de ConvocaÃ§Ãµes
                            </p>
                            <p class="text-[9px] font-bold text-gray-400 uppercase mt-0.5">
                                ${totalParticipou} presenÃ§as em ${totalConvocado} convocaÃ§Ãµes
                            </p>
                        </div>
                        <div class="w-10 h-10 rounded-full border-4 flex items-center justify-center shrink-0 ${percentualParticipacao >= 75 ? 'border-green-500 text-green-700' : percentualParticipacao >= 50 ? 'border-yellow-500 text-yellow-700' : 'border-red-500 text-red-700'}">
                            <span class="text-[9px] font-black">${percentualParticipacao}%</span>
                        </div>
                    </div>

                    <div class="space-y-3">
                        ${uÃšltimosJogos.map(jogo => `
                            <div class="flex items-center gap-3 bg-gray-50 p-2 rounded-lg border">
                                <div class="w-8 h-8 rounded-lg bg-white border flex items-center justify-center shrink-0">
                                    <i class="fa-solid fa-volleyball ${jogo.participou ? 'text-green-600' : 'text-red-600'} text-[10px]"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <p class="text-[9px] font-black text-gray-800 uppercase truncate">${jogo.titulo}</p>
                                    <p class="text-[8px] font-bold text-gray-500 uppercase mt-0.5">${jogo.data ? new Date(jogo.data).toLocaleDateString('pt-BR') : ''}</p>
                                </div>
                                <span class="text-[8px] font-black px-2 py-1 rounded uppercase shrink-0 ${jogo.participou ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                                    ${jogo.participou ? 'Presente' : 'Ausente'}
                                </span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        } else {
            historicoJogosHtml = `<p class="text-[10px] text-gray-400 font-bold uppercase text-center py-4">Nenhum histÃ³rico de jogo concluÃ­do ainda.</p>`;
        }

        container.innerHTML = `
            <div class="bg-gray-950 text-white p-4 rounded-2xl border border-gray-800 mb-4 shadow-sm">
                <p class="text-[8px] font-black uppercase text-white/50">FrequÃªncia DVC</p>
                <p class="text-3xl font-black text-[#FFC107] leading-none mt-1">${dadosAtleta.presencas || 0}</p>
                <p class="text-[9px] font-bold uppercase text-white/60 mt-1">PresenÃ§as registradas globais</p>
            </div>
            ${proximosJogosHtml}
            ${historicoJogosHtml}
        `;
        container.innerHTML = corrigirHtmlVisualPerfilDVC(container.innerHTML);
        perfLogPerfilDVC("carregar financeiro/presencas presencas", inicioPresencas);
    } catch (e) {
        console.error("Erro DVC Presencas:", e);
        container.innerHTML = `<p class="p-6 text-center text-red-500 font-bold text-xs uppercase">Erro ao carregar presenÃ§as.</p>`;
        container.innerHTML = corrigirHtmlVisualPerfilDVC(container.innerHTML);
    }
}

async function carregarEExibirRegistrosFinanceirosDVC(email, btn) {
    const inicioFinanceiroDetalhado = perfInicioPerfilDVC();
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1"></i> Carregando...`;
    btn.disabled = true;
    try {
        const contribuicoes = await carregarContribuicoesAtletaDVC(email);
        const registros = contribuicoes.sort((a, b) => new Date(b.enviadoEm || 0) - new Date(a.enviadoEm || 0));
        
        const containerId = `dvc-historico-financeiro-container-${email.replace(/[@.]/g, '')}`;
        const container = document.getElementById(containerId);
        if (!container) return;

        if (!registros.length) {
            container.innerHTML = corrigirHtmlVisualPerfilDVC(`
                <div class="bg-gray-50 border border-dashed rounded-xl p-4 text-center">
                    <p class="text-[10px] text-gray-400 font-bold uppercase">Nenhum envio financeiro registrado.</p>
                </div>`);
            return;
        }

        container.innerHTML = corrigirHtmlVisualPerfilDVC(`
            <div class="space-y-2 mt-4">
                ${registros.map(item => {
                    const status = item.status || "Pendente";
                    const tipo = item.tipo || "Comprovante";
                    const cor = status === "Validado" || item.resultadoFinanceiro === "Pago"
                        ? "bg-green-50 border-green-200 text-green-800"
                        : status === "Justificado" || item.resultadoFinanceiro === "Justificado"
                            ? "bg-blue-50 border-blue-200 text-blue-800"
                            : "bg-yellow-50 border-yellow-200 text-yellow-800";

                    return `
                        <div class="${cor} border rounded-xl p-3">
                            <div class="flex justify-between items-start gap-2">
                                <div>
                                    <p class="text-xs font-black uppercase">${item.mes || "Sem mÃªs"}</p>
                                    <p class="text-[8px] font-black uppercase opacity-80 mt-1">${tipo}</p>
                                </div>
                                <span class="bg-white/70 border text-[8px] font-black px-2 py-1 rounded-full uppercase inline-flex items-center gap-1">
                                    ${renderIconeLocalDVC(getIconeFinanceiroPerfilDVC(status), status, "w-3 h-3")}
                                    ${status}
                                </span>
                            </div>
                            ${item.enviadoEm ? `
                                <p class="text-[8px] font-bold uppercase mt-2 opacity-80">
                                    Enviado: ${window.formatarDataHoraFinanceira(item.enviadoEm)}
                                </p>
                            ` : ""}
                        </div>
                    `;
                }).join('')}
            </div>
        `);
        perfLogPerfilDVC("carregar financeiro/presencas financeiro", inicioFinanceiroDetalhado);
    } catch (e) {
        console.error("Erro DVC Financeiro:", e);
        btn.innerHTML = `Erro. Tentar novamente`;
        btn.disabled = false;
    }
}

function renderSecaoRecolhivelDVC({ id = "", titulo = "", subtitulo = "", icone = "fa-chevron-down", aberta = false, conteudo = "" } = {}) {
    const idAttr = id ? `id="${window.escaparHtml(id)}"` : "";

    return `
        <details ${idAttr} ${aberta ? "open" : ""} class="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden mb-4">
            <summary class="cursor-pointer list-none p-4 flex items-center justify-between gap-3">
                <div class="flex items-center gap-3 min-w-0">
                    <span class="w-10 h-10 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                        <i class="fa-solid ${window.escaparHtml(icone)} text-[#990000] text-sm"></i>
                    </span>
                    <span class="min-w-0">
                        <span class="block text-[10px] font-black uppercase text-[#990000] truncate">${window.escaparHtml(titulo)}</span>
                        ${subtitulo ? `<span class="block text-[9px] font-bold text-gray-400 uppercase leading-snug mt-0.5">${window.escaparHtml(subtitulo)}</span>` : ""}
                    </span>
                </div>
                <i class="fa-solid fa-chevron-down text-gray-300 text-xs shrink-0"></i>
            </summary>
            <div class="px-4 pb-4">
                ${conteudo || ""}
            </div>
        </details>
    `;
}

async function gerarAvaliacoesPendentesHtml() {
    try {
        if (!window.usuarioEhEquipeTecnica()) {
            return "";
        }

        const eventsSnap = await window.carregarEventosCacheMockDVC();
        let eventosPendentes = [];

        for (const eventoDoc of eventsSnap.docs) {
            const ev = eventoDoc.data();

            if (ev.avaliacaoTecnicaStatus !== "Pendente") continue;

            const pendentesSnap = await getDocs(
                collection(db, "events", eventoDoc.id, "avaliacoesTecnicasPendentes")
            );

            if (pendentesSnap.empty) continue;

            let avaliacoes = [];
            let somaCriterios = {};
            let contagemCriterios = {};

            pendentesSnap.forEach(docAvaliacao => {
                const av = docAvaliacao.data();
                if (String(av.status || "Pendente") !== "Pendente") return;
                avaliacoes.push(av);

                const criterios = av.criterios || {};

                Object.keys(criterios).forEach(chave => {
                    somaCriterios[chave] = (somaCriterios[chave] || 0) + Number(criterios[chave] || 0);
                    contagemCriterios[chave] = (contagemCriterios[chave] || 0) + 1;
                });
            });

            if (avaliacoes.length === 0) continue;

            let medias = {};

            Object.keys(somaCriterios).forEach(chave => {
                medias[chave] = Number((somaCriterios[chave] / contagemCriterios[chave]).toFixed(1));
            });

            eventosPendentes.push({
                id: eventoDoc.id,
                titulo: ev.titulo || "Evento DVC",
                tipo: ev.tipo || "treino",
                data: ev.data || "",
                responsavelNome: ev.avaliacaoTecnicaPor || ev.responsavelNome || "NÃ£o informado",
                totalAtletas: avaliacoes.length,
                medias
            });
        }

        if (eventosPendentes.length === 0) {
            return "";
        }

        const nomesCriterios = {
            recepcao: "RecepÃ§Ã£o",
            levantamento: "Levantamento",
            ataque: "Ataque",
            bloqueio: "Bloqueio",
            defesa: "Defesa",
            saque: "Saque",

            antecipacao: "AntecipaÃ§Ã£o",
            tomadaDecisao: "Tomada de DecisÃ£o",
            leituraJogo: "Leitura de Jogo",

            resiliencia: "ResiliÃªncia",
            comunicacaoQuadra: "ComunicaÃ§Ã£o em Quadra",
            trabalhoEquipe: "Trabalho em Equipe"
        };

        const cardsHtml = eventosPendentes.map(ev => {
            const mediasHtml = Object.keys(ev.medias).map(chave => `
                <div class="bg-white border rounded-lg p-2 text-center">
                    <p class="text-[8px] font-black text-gray-400 uppercase">
                        ${nomesCriterios[chave] || chave}
                    </p>
                    <p class="text-lg font-black text-[#990000]">
                        ${ev.medias[chave]}
                    </p>
                </div>
            `).join('');

            return `
                <div class="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-3 shadow-sm">
                    <div class="flex justify-between items-start gap-2 mb-3">
                        <div>
                            <p class="text-[9px] font-black text-yellow-700 uppercase">
                                AvaliaÃ§Ã£o pendente
                            </p>
                            <p class="text-sm font-black text-gray-800 uppercase">
                                ${ev.titulo}
                            </p>
                            <p class="text-[9px] font-bold text-gray-500 mt-1">
                                ResponsÃ¡vel: ${ev.responsavelNome}
                            </p>
                        </div>

                        <span class="bg-yellow-200 text-yellow-900 text-[8px] font-black px-2 py-1 rounded-full uppercase">
                            ${ev.tipo === "jogo" ? "Jogo" : "Treino"}
                        </span>
                    </div>

                    <button 
                        onclick="aprovarAvaliacaoEvento('${ev.id}')"
                        class="w-full bg-green-600 text-white py-2.5 rounded-xl text-[9px] font-black uppercase mb-3 shadow-sm">
                        ${ev.tipo === "jogo" ? "Autorizar Todas as AvaliaÃ§Ãµes Deste Jogo" : "Autorizar Todas as AvaliaÃ§Ãµes Deste Treino"}
                    </button>

                    <div class="grid grid-cols-2 gap-2 mb-3">
                        <div class="bg-white border rounded-lg p-2 text-center">
                            <p class="text-[8px] font-black text-gray-400 uppercase">
                                Atletas avaliados
                            </p>
                            <p class="text-lg font-black text-gray-800">
                                ${ev.totalAtletas}
                            </p>
                        </div>

                        <div class="bg-white border rounded-lg p-2 text-center">
                            <p class="text-[8px] font-black text-gray-400 uppercase">
                                Status
                            </p>
                            <p class="text-[10px] font-black text-yellow-700 uppercase mt-1">
                                Pendente
                            </p>
                        </div>
                    </div>

                    <p class="text-[9px] font-black text-gray-500 uppercase mb-2">
                        MÃ©dias da avaliaÃ§Ã£o
                    </p>

                    <div class="grid grid-cols-2 gap-2 mb-4">
                        ${mediasHtml}
                    </div>

                    <div class="grid grid-cols-2 gap-2">
                        <button 
                            onclick="verDetalhesAvaliacaoPendente('${ev.id}')"
                            class="bg-gray-800 text-white py-2 rounded-lg text-[9px] font-black uppercase">
                            Ver detalhes
                        </button>

                        <button 
                            onclick="aprovarAvaliacaoEvento('${ev.id}')"
                            class="bg-[#990000] text-white py-2 rounded-lg text-[9px] font-black uppercase">
                            Autorizar todas
                        </button>
                    </div>

                    <button 
                        onclick="rejeitarAvaliacaoEvento('${ev.id}')"
                        class="w-full bg-white border border-red-200 text-red-700 py-2 rounded-lg text-[9px] font-black uppercase mt-2">
                        Rejeitar avaliaÃ§Ã£o
                    </button>
                </div>
            `;
        }).join('');

        return `
            <div class="bg-white p-4 rounded-xl border mb-4 shadow-sm">
                <p class="text-[10px] font-black text-[#990000] uppercase mb-2">
                    <i class="fa-solid fa-clipboard-check mr-1"></i> AvaliaÃ§Ãµes TÃ©cnicas Pendentes
                </p>

                <p class="text-[9px] font-bold text-gray-400 uppercase mb-3">
                    Revise o resumo e aprove para aplicar a evoluÃ§Ã£o no score dos atletas.
                </p>

                ${cardsHtml}
            </div>
        `;

    } catch (e) {
        console.error("Erro ao gerar avaliaÃ§Ãµes pendentes:", e);
        return "";
    }
}

async function aplicarAvaliacaoPendenteAtleta(evId, docAvaliacao) {
    const av = docAvaliacao.data();
    const emailAtleta = av.email || docAvaliacao.id;
    const criterios = av.criterios || {};
    const agora = new Date().toISOString();
    const analisadorNome = window.currentUserData?.nome || auth.currentUser?.email || "Equipe tecnica";
    const analisadorEmail = auth.currentUser?.email || "";

    const userRef = doc(db, "users", emailAtleta);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return false;

    const dadosAtleta = userSnap.data();
    const habilidadesAtuais = window.normalizarHabilidadesDVC(dadosAtleta.habilidades || {});
    let novasHabilidades = { ...habilidadesAtuais };
    let historicosParaRegistrar = [];

    Object.keys(criterios).forEach(chave => {
        const notaAtual = Number(habilidadesAtuais[chave] || 0);
        const notaEvento = Number(criterios[chave] || 0);
        const notaNova = aplicarEvolucaoGradual(notaAtual, notaEvento);

        novasHabilidades[chave] = notaNova;

        if (notaAtual !== notaNova) {
            historicosParaRegistrar.push({
                criterio: chave,
                valorAnterior: notaAtual,
                valorNovo: notaNova
            });
        }
    });

    await updateDoc(userRef, {
        habilidades: novasHabilidades,
        habilidadesAvaliadasPorEquipe: true,
        habilidadesStatus: "Aprovada",
        avaliadoEm: agora,
        avaliadoPor: analisadorNome,
        avaliadoPorEmail: analisadorEmail,
        atualizadoEm: agora
    });

    try {
        for (const hist of historicosParaRegistrar) {
            await registrarHistoricoHabilidade(
                emailAtleta,
                hist.criterio,
                hist.valorAnterior,
                hist.valorNovo,
                av.tipoEvento === "jogo" ? "AvaliaÃ§Ã£o de jogo/amistoso" : "AvaliaÃ§Ã£o de treino",
                `AvaliaÃ§Ã£o aprovada por ${analisadorNome}`
            );
        }
    } catch (erroHistoricoAvaliacaoTreino) {
        console.warn("Historico de avaliacao de treino nao foi registrado:", erroHistoricoAvaliacaoTreino);
    }

    await setDoc(doc(db, "events", evId, "avaliacoesTecnicas", emailAtleta), {
        ...av,
        status: "Aprovada",
        analisadoEm: agora,
        analisadoPor: analisadorNome,
        analisadoPorEmail: analisadorEmail,
        aprovadoPor: analisadorNome,
        aprovadoPorEmail: analisadorEmail,
        aprovadoEm: agora
    }, { merge: true });

    await setDoc(docAvaliacao.ref || doc(db, "events", evId, "avaliacoesTecnicasPendentes", docAvaliacao.id), {
        status: "Aprovada",
        analisadoEm: agora,
        analisadoPor: analisadorNome,
        analisadoPorEmail: analisadorEmail
    }, { merge: true });

    return true;
}

async function rejeitarAvaliacaoPendenteAtleta(evId, docAvaliacao) {
    const av = docAvaliacao.data();
    const emailAtleta = av.email || docAvaliacao.id;
    const agora = new Date().toISOString();
    const analisadorNome = window.currentUserData?.nome || auth.currentUser?.email || "Equipe tecnica";
    const analisadorEmail = auth.currentUser?.email || "";

    await setDoc(doc(db, "events", evId, "avaliacoesTecnicasRejeitadas", emailAtleta), {
        ...av,
        status: "Rejeitada",
        analisadoEm: agora,
        analisadoPor: analisadorNome,
        analisadoPorEmail: analisadorEmail,
        rejeitadoPor: analisadorNome,
        rejeitadoPorEmail: analisadorEmail,
        rejeitadoEm: agora
    }, { merge: true });

    await setDoc(docAvaliacao.ref || doc(db, "events", evId, "avaliacoesTecnicasPendentes", docAvaliacao.id), {
        status: "Rejeitada",
        analisadoEm: agora,
        analisadoPor: analisadorNome,
        analisadoPorEmail: analisadorEmail
    }, { merge: true });
}

async function atualizarResumoPendenciasAvaliacao(evId, statusFinal = "Aprovada") {
    const pendentesSnap = await getDocs(collection(db, "events", evId, "avaliacoesTecnicasPendentes"));
    const pendentesAtivos = pendentesSnap.docs.filter(docPendente => {
        const data = docPendente.data();
        return String(data.status || "Pendente") === "Pendente";
    });

    if (pendentesAtivos.length > 0) {
        await updateDoc(doc(db, "events", evId), {
            avaliacaoTecnicaStatus: "Pendente",
            avaliacaoTecnicaPendentesRestantes: pendentesAtivos.length
        });
        return;
    }

    await updateDoc(doc(db, "events", evId), {
        avaliacaoTecnicaStatus: statusFinal,
        avaliacaoTecnicaFinalizadaEm: new Date().toISOString(),
        avaliacaoTecnicaFinalizadaPor: window.currentUserData.nome || auth.currentUser.email
    });
}

async function aprovarAvaliacaoEvento(evId) {
    try {
        if (!window.usuarioEhEquipeTecnica()) {
            return alert("Apenas ADM, Treinador ou Auxiliar podem aprovar avaliaÃ§Ãµes.");
        }

        if (!confirm("Autorizar todas as avaliaÃ§Ãµes deste treino e aplicar a evoluÃ§Ã£o no score dos atletas?")) {
            return;
        }

        const pendentesSnap = await getDocs(
            collection(db, "events", evId, "avaliacoesTecnicasPendentes")
        );

        const avaliacoesPendentes = pendentesSnap.docs.filter(docAvaliacao => {
            const data = docAvaliacao.data();
            return String(data.status || "Pendente") === "Pendente";
        });

        if (avaliacoesPendentes.length === 0) {
            return alert("NÃ£o hÃ¡ avaliaÃ§Ãµes pendentes para este evento.");
        }

        let totalAplicados = 0;

        for (const docAvaliacao of avaliacoesPendentes) {
            const aplicado = await aplicarAvaliacaoPendenteAtleta(evId, docAvaliacao);
            if (aplicado) totalAplicados++;
        }

        await updateDoc(doc(db, "events", evId), {
            avaliacaoTecnicaStatus: "Aprovada",
            avaliacaoTecnicaAprovadaEm: new Date().toISOString(),
            avaliacaoTecnicaAprovadaPor: window.currentUserData.nome || auth.currentUser.email,
            avaliacaoTecnicaAplicadaTotal: totalAplicados
        });

        alert(`AvaliaÃ§Ã£o aprovada e aplicada para ${totalAplicados} atleta(s).`);

        window.limparCacheDados("eventos");
        window.limparCacheDados("atletas");
        window.limparCacheDados("avaliacoes");
        renderProfile();

    } catch (e) {
        console.error("Erro ao aprovar avaliaÃ§Ã£o:", e);
        alert("NÃ£o foi possÃ­vel aprovar a avaliaÃ§Ã£o.");
    }
}

async function rejeitarAvaliacaoEvento(evId) {
    try {
        if (!window.usuarioEhEquipeTecnica()) {
            return alert("Apenas ADM, Treinador ou Auxiliar podem rejeitar avaliaÃ§Ãµes.");
        }

        if (!confirm("Rejeitar esta avaliaÃ§Ã£o? Ela nÃ£o serÃ¡ aplicada ao score dos atletas.")) {
            return;
        }

        const pendentesSnap = await getDocs(
            collection(db, "events", evId, "avaliacoesTecnicasPendentes")
        );

        const avaliacoesPendentes = pendentesSnap.docs.filter(docAvaliacao => {
            const data = docAvaliacao.data();
            return String(data.status || "Pendente") === "Pendente";
        });

        for (const docAvaliacao of avaliacoesPendentes) {
            await rejeitarAvaliacaoPendenteAtleta(evId, docAvaliacao);
        }

        await updateDoc(doc(db, "events", evId), {
            avaliacaoTecnicaStatus: "Rejeitada",
            avaliacaoTecnicaRejeitadaEm: new Date().toISOString(),
            avaliacaoTecnicaRejeitadaPor: window.currentUserData.nome || auth.currentUser.email
        });

        alert("AvaliaÃ§Ã£o rejeitada.");

        window.limparCacheDados("eventos");
        renderProfile();

    } catch (e) {
        console.error("Erro ao rejeitar avaliaÃ§Ã£o:", e);
        alert("NÃ£o foi possÃ­vel rejeitar a avaliaÃ§Ã£o.");
    }
}

async function autorizarAvaliacaoAtletaPendente(evId, emailAtleta) {
    try {
        if (!window.usuarioEhEquipeTecnica()) {
            return alert("Apenas ADM, Treinador ou Auxiliar podem autorizar avaliaÃ§Ãµes.");
        }

        if (!confirm("Autorizar a avaliaÃ§Ã£o deste atleta e aplicar no score?")) {
            return;
        }

        const avaliacaoRef = doc(db, "events", evId, "avaliacoesTecnicasPendentes", emailAtleta);
        const avaliacaoSnap = await getDoc(avaliacaoRef);

        if (!avaliacaoSnap.exists()) {
            return alert("AvaliaÃ§Ã£o pendente nÃ£o encontrada.");
        }

        const aplicado = await aplicarAvaliacaoPendenteAtleta(evId, avaliacaoSnap);
        await atualizarResumoPendenciasAvaliacao(evId, "Aprovada");

        alert(aplicado ? "AvaliaÃ§Ã£o autorizada e aplicada." : "Atleta nÃ£o encontrado para aplicar a avaliaÃ§Ã£o.");
        document.getElementById('m-detalhes-avaliacao')?.remove();
        window.limparCacheDados("eventos");
        window.limparCacheDados("atletas");
        window.limparCacheDados("avaliacoes");
        renderProfile();

    } catch (e) {
        console.error("Erro ao autorizar avaliaÃ§Ã£o individual:", e);
        alert("NÃ£o foi possÃ­vel autorizar esta avaliaÃ§Ã£o.");
    }
}

async function rejeitarAvaliacaoAtletaPendente(evId, emailAtleta) {
    try {
        if (!window.usuarioEhEquipeTecnica()) {
            return alert("Apenas ADM, Treinador ou Auxiliar podem rejeitar avaliaÃ§Ãµes.");
        }

        if (!confirm("Rejeitar a avaliaÃ§Ã£o deste atleta? Ela nÃ£o serÃ¡ aplicada ao score.")) {
            return;
        }

        const avaliacaoRef = doc(db, "events", evId, "avaliacoesTecnicasPendentes", emailAtleta);
        const avaliacaoSnap = await getDoc(avaliacaoRef);

        if (!avaliacaoSnap.exists()) {
            return alert("AvaliaÃ§Ã£o pendente nÃ£o encontrada.");
        }

        await rejeitarAvaliacaoPendenteAtleta(evId, avaliacaoSnap);
        await atualizarResumoPendenciasAvaliacao(evId, "Rejeitada");

        alert("AvaliaÃ§Ã£o rejeitada.");
        document.getElementById('m-detalhes-avaliacao')?.remove();
        window.limparCacheDados("eventos");
        renderProfile();

    } catch (e) {
        console.error("Erro ao rejeitar avaliaÃ§Ã£o individual:", e);
        alert("NÃ£o foi possÃ­vel rejeitar esta avaliaÃ§Ã£o.");
    }
}

async function verDetalhesAvaliacaoPendente(evId) {
    try {
        const eventoSnap = await getDoc(doc(db, "events", evId));
        const evento = eventoSnap.exists() ? eventoSnap.data() : {};

        const pendentesSnap = await getDocs(
            collection(db, "events", evId, "avaliacoesTecnicasPendentes")
        );

        const avaliacoesPendentes = pendentesSnap.docs.filter(docAvaliacao => {
            const data = docAvaliacao.data();
            return String(data.status || "Pendente") === "Pendente";
        });

        if (avaliacoesPendentes.length === 0) {
            return alert("NÃ£o hÃ¡ detalhes pendentes para este evento.");
        }

        const nomesCriterios = {
            recepcao: "RecepÃ§Ã£o",
            levantamento: "Levantamento",
            ataque: "Ataque",
            bloqueio: "Bloqueio",
            defesa: "Defesa",
            saque: "Saque",

            antecipacao: "AntecipaÃ§Ã£o",
            tomadaDecisao: "Tomada de DecisÃ£o",
            leituraJogo: "Leitura de Jogo",

            resiliencia: "ResiliÃªncia",
            comunicacaoQuadra: "ComunicaÃ§Ã£o em Quadra",
            trabalhoEquipe: "Trabalho em Equipe",

            // Compatibilidade com registros antigos
            manchete: "Manchete",
            toque: "Toque",
            visaoJogo: "VisÃ£o de Jogo",
            comunicacao: "ComunicaÃ§Ã£o"
        };

        let detalhesHtml = "";

        avaliacoesPendentes.forEach(docAvaliacao => {
            const av = docAvaliacao.data();
            const criterios = av.criterios || {};
            const emailSeguro = window.safeEditParam(av.email || docAvaliacao.id);

            const criteriosHtml = Object.keys(criterios).map(chave => `
                <span class="bg-gray-100 border rounded-full px-2 py-1 text-[8px] font-black text-gray-700 uppercase">
                    ${nomesCriterios[chave] || chave}: ${criterios[chave]}
                </span>
            `).join('');

            detalhesHtml += `
                <div class="bg-gray-50 border rounded-xl p-3 mb-3">
                    <div class="flex items-start justify-between gap-2">
                        <div class="min-w-0">
                            <p class="text-xs font-black text-gray-800 uppercase truncate">
                                ${av.nome || av.email}
                            </p>
                            <p class="text-[8px] font-bold text-gray-400 uppercase truncate">
                                ${av.avaliadorNome ? `Avaliado por ${av.avaliadorNome}` : "AvaliaÃ§Ã£o pendente"}
                            </p>
                        </div>

                        <div class="flex gap-1 shrink-0">
                            <button 
                                onclick="autorizarAvaliacaoAtletaPendente('${evId}', '${emailSeguro}')"
                                class="bg-green-600 text-white px-2 py-1 rounded-lg text-[8px] font-black uppercase">
                                Autorizar
                            </button>
                            <button 
                                onclick="rejeitarAvaliacaoAtletaPendente('${evId}', '${emailSeguro}')"
                                class="bg-red-600 text-white px-2 py-1 rounded-lg text-[8px] font-black uppercase">
                                Rejeitar
                            </button>
                        </div>
                    </div>

                    <div class="flex flex-wrap gap-1 mt-2 mb-2">
                        ${criteriosHtml}
                    </div>

                    ${av.observacao ? `
                        <p class="text-[9px] text-gray-500 font-semibold italic">
                            "${av.observacao}"
                        </p>
                    ` : ''}
                </div>
            `;
        });

        const modal = `
            <div id="m-detalhes-avaliacao" class="fixed inset-0 bg-black/80 z-[100] p-4 flex items-center justify-center">
                <div class="bg-white w-full max-w-sm rounded-2xl p-5 max-h-[85vh] overflow-y-auto relative shadow-2xl">
                    <button 
                        onclick="document.getElementById('m-detalhes-avaliacao').remove()" 
                        class="absolute top-4 right-4 text-red-600 font-black text-xl">
                        &times;
                    </button>

                    <h2 class="font-bold text-xs uppercase mb-1 text-[#990000]">
                        Detalhes da AvaliaÃ§Ã£o
                    </h2>

                    <p class="text-[9px] text-gray-400 font-bold uppercase mb-4">
                        ${evento.titulo || "Evento DVC"}
                    </p>

                    ${detalhesHtml}
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modal);

    } catch (e) {
        console.error("Erro ao abrir detalhes da avaliaÃ§Ã£o:", e);
        alert("NÃ£o foi possÃ­vel abrir os detalhes.");
    }
}

function aplicarEvolucaoGradual(notaAtual, notaEvento) {
    const atual = Number(notaAtual || 0);
    const evento = Number(notaEvento || 0);

    if (evento <= 0) return atual;
    if (atual <= 0) return evento;

    return Number(((atual * 0.9) + (evento * 0.1)).toFixed(1));
}



