/**
 * ============================================================================
 * Módulo: RANKING
 * ============================================================================
 * Responsabilidade: Gerencia funcionalidades relacionadas a ranking.
 * Este arquivo faz parte do sistema modular do DVC App.
 * Todos os códigos principais aqui agrupados seguem as diretrizes do projeto.
 * ============================================================================
 */

// RANKING MODULE DVC APP

import { auth } from "./firebase.js";
import { PROJETO_ATUAL_DVC } from "./state.js";
import {
    escaparHtml,
    safeEditParam,
    normalizarTextoRankingDVC,
    obterPrimeiroValorRankingDVC,
    getNomeFuncaoVoleiDVC,
    formatarPontuacaoRankingDVC,
    getUnidadeRankingDVC,
    getMensagemSemDadosRankingDVC,
    normalizarGeneroRankingDvc as normalizarGeneroRankingDVC,
    normalizarCategoriaRankingDvc as normalizarCategoriaRankingDVC,
    normalizarFuncaoVoleiRankingDvc as normalizarFuncaoVoleiRankingDVC
} from "./utils.js";

function usuarioTemAvaliacaoTecnicaRealDVC(user = {}) {
    return typeof window.usuarioTemAvaliacaoTecnicaRealDVC === "function"
        ? window.usuarioTemAvaliacaoTecnicaRealDVC(user)
        : false;
}

function calcularScoreGeralDVC(habilidades = {}) {
    return typeof window.calcularScoreGeralDVC === "function"
        ? window.calcularScoreGeralDVC(habilidades)
        : 0;
}

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

async function carregarAtletasCache(forcar = false) {
    return typeof window.carregarAtletasCache === "function"
        ? window.carregarAtletasCache(forcar)
        : [];
}

async function carregarEventosCache(forcar = false) {
    return typeof window.carregarEventosCache === "function"
        ? window.carregarEventosCache(forcar)
        : [];
}

function criarMockSnapshotRankingDVC(array = []) {
    return {
        docs: array.map(item => ({
            id: item.id,
            data: () => item,
            exists: () => true
        })),
        empty: array.length === 0,
        size: array.length,
        forEach(cb) {
            this.docs.forEach(cb);
        }
    };
}

async function carregarUsuariosCacheMockDVC(force = false) {
    if (typeof window.carregarUsuariosCacheMockDVC === "function") {
        return window.carregarUsuariosCacheMockDVC(force);
    }

    return criarMockSnapshotRankingDVC(await carregarAtletasCache(force));
}

async function carregarEventosCacheMockDVC(force = false) {
    if (typeof window.carregarEventosCacheMockDVC === "function") {
        return window.carregarEventosCacheMockDVC(force);
    }

    return criarMockSnapshotRankingDVC(await carregarEventosCache(force));
}

// ============================================================================
        // SECAO 08 - RANKING E MAPA DE HABILIDADES
        // ============================================================================
        // Responsabilidade: rankings gerais e comparativos tecnicos.
        window.filtrosRankingDVC = window.filtrosRankingDVC || {
            tipo: "tecnico",
            genero: "todos",
            categoria: "todos",
            funcao: "todas",
            busca: ""
        };
        window.filtrosRankingAbertoDVC = window.filtrosRankingAbertoDVC || false;
        window.limiteListaRankingDVC = window.limiteListaRankingDVC || 10;
        window.aguardandoAvaliacaoAbertoDVC = window.aguardandoAvaliacaoAbertoDVC || false;
        window.limiteAguardandoAvaliacaoDVC = window.limiteAguardandoAvaliacaoDVC || 10;
        
        window.toggleFiltrosRankingDVC = () => {
            window.filtrosRankingAbertoDVC = !window.filtrosRankingAbertoDVC;
            window.renderRanking();
        };
        window.carregarMaisAtletasRankingDVC = () => {
            window.limiteListaRankingDVC = (window.limiteListaRankingDVC || 10) + 10;
            window.renderRanking();
        };
        window.toggleAguardandoAvaliacaoDVC = () => {
            window.aguardandoAvaliacaoAbertoDVC = !window.aguardandoAvaliacaoAbertoDVC;
            window.renderRanking();
        };
        window.carregarMaisAguardandoAvaliacaoDVC = () => {
            window.limiteAguardandoAvaliacaoDVC = (window.limiteAguardandoAvaliacaoDVC || 10) + 10;
            window.renderRanking();
        };

        const TIPOS_RANKING_DVC = [
            { id: "tecnico", label: "Técnico", icon: "fa-chart-line" },
            { id: "inteligencia", label: "Mestres da Tática", icon: "fa-brain" },
            { id: "presenca", label: "Presença", icon: "fa-user-check" },
            { id: "evolucao", label: "Evolução", icon: "fa-arrow-trend-up" }
        ];

        const GENEROS_RANKING_DVC = [
            { id: "todos", label: "Todos" },
            { id: "masculino", label: "Masculino" },
            { id: "feminino", label: "Feminino" }
        ];

        const CATEGORIAS_RANKING_DVC = [
            { id: "todos", label: "Todos" },
            { id: "sub17", label: "Sub-17" },
            { id: "adulto", label: "Adulto" }
        ];

        const FUNCOES_RANKING_DVC = [
            { id: "todas", label: "Todas" },
            { id: "levantador", label: "Levantador" },
            { id: "oposto", label: "Oposto" },
            { id: "ponteiro", label: "Ponteiro" },
            { id: "central", label: "Central" },
            { id: "libero", label: "Líbero" },
            { id: "universal", label: "Universal" },
            { id: "formacao", label: "Em formação" }
        ];



function atletaTemAvaliacaoRealDVC(user = {}) {
    if (typeof usuarioTemAvaliacaoTecnicaRealDVC === "function") {
        return usuarioTemAvaliacaoTecnicaRealDVC(user);
    }

    const habilidades = user?.habilidades || {};
    const valores = Object.values(habilidades).filter(valor => valor !== undefined && valor !== null && valor !== "");
    const temHabilidadeReal = valores.length > 0 && valores.some(valor => Number(valor) !== 3);

    return user?.habilidadesAvaliadasPorEquipe === true ||
        user?.habilidadesStatus === "Aprovada" ||
        !!user?.avaliadoEm ||
        !!user?.avaliadoPor ||
        temHabilidadeReal;
}

function obterNumeroRankingDVC(valor) {
    if (Array.isArray(valor)) return valor.length;

    if (valor && typeof valor === "object") {
        if (Number.isFinite(Number(valor.score))) return Number(valor.score);
        if (Number.isFinite(Number(valor.media))) return Number(valor.media);
        if (Number.isFinite(Number(valor.total))) return Number(valor.total);
        return null;
    }

    if (valor === undefined || valor === null || valor === "") return null;

    const numero = Number(String(valor).replace("%", "").replace(",", "."));
    return Number.isFinite(numero) ? numero : null;
}

function calcularPontuacaoRankingDVC(user = {}, tipo = "tecnico") {
    if (tipo === "tecnico") {
        if (!atletaTemAvaliacaoRealDVC(user)) return null;
        const scoreTecnico = Number(calcularScoreGeralDVC(user.habilidades || {}));
        return Number.isFinite(scoreTecnico) ? scoreTecnico : null;
    }

    if (tipo === "inteligencia") {
        return obterNumeroRankingDVC(obterPrimeiroValorRankingDVC(user, [
            "scoreInteligencia",
            "quizScore",
            "inteligenciaJogo"
        ]));
    }

    if (tipo === "presenca") {
        return obterNumeroRankingDVC(obterPrimeiroValorRankingDVC(user, [
            "presencasRankingDVC",
            "presencas",
            "totalPresencas",
            "frequencia"
        ]));
    }

    if (tipo === "evolucao") {
        return obterNumeroRankingDVC(obterPrimeiroValorRankingDVC(user, [
            "scoreEvolucao",
            "evolucaoScore",
            "indiceEvolucao",
            "crescimentoTecnico",
            "evolucaoTecnica",
            "evolucao"
        ]));
    }

    return null;
}

function getLabelGeneroRankingDVC(chave = "") {
    if (chave === "masculino") return "Masculino";
    if (chave === "feminino") return "Feminino";
    if (chave === "outro") return "Outro";
    return "Não informado";
}

function getLabelCategoriaRankingDVC(chave = "") {
    if (chave === "adulto") return "Adulto";
    if (chave === "sub17") return "Sub-17";
    return "Sem categoria";
}

function getLabelFuncaoRankingDVC(chave = "") {
    const local = FUNCOES_RANKING_DVC.find(item => item.id === chave);
    return local?.label || getNomeFuncaoVoleiDVC?.(chave) || "Em formação";
}

function getLabelTipoRankingDVC(tipo = "tecnico") {
    const local = TIPOS_RANKING_DVC.find(item => item.id === tipo);
    return local?.label || "Técnico";
}



function usuarioPodeAbrirPerfilRankingDVC(atleta = {}) {
    const emailAtleta = String(atleta.email || atleta.id || "").trim().toLowerCase();
    const emailAtual = String(auth.currentUser?.email || "").trim().toLowerCase();

    return emailAtleta && (emailAtleta === emailAtual || usuarioEhEquipeTecnica());
}

window.abrirPerfilAtletaRankingDVC = (email = "", nome = "") => {
    const emailLimpo = String(email || "").trim().toLowerCase();
    const emailAtual = String(auth.currentUser?.email || "").trim().toLowerCase();

    if (!emailLimpo) return;

    if (emailLimpo !== emailAtual && !usuarioEhEquipeTecnica()) {
        return alert("A visualização de perfis de outros atletas é restrita à equipe técnica.");
    }

    if (emailLimpo === emailAtual) {
        window.modoTestePerfilEmail = null;
        window.modoTestePerfilNome = null;
    } else {
        window.modoTestePerfilEmail = emailLimpo;
        window.modoTestePerfilNome = nome || emailLimpo;
    }

    window.changeTab("profile");
};

let timeoutBuscaRankingDVC = null;

window.buscarRankingDVC = (valor) => {
    clearTimeout(timeoutBuscaRankingDVC);
    timeoutBuscaRankingDVC = setTimeout(() => {
        window.alterarFiltroRankingDVC('busca', valor);
    }, 250);
};

window.alterarFiltroRankingDVC = (chave, valor) => {
    window.filtrosRankingDVC = window.filtrosRankingDVC || {
        tipo: "tecnico",
        genero: "todos",
        categoria: "todos",
        funcao: "todas",
        busca: ""
    };

    window.filtrosRankingDVC[chave] = valor;
    window.limiteListaRankingDVC = 10;
    window.limiteAguardandoAvaliacaoDVC = 10;
    window.aguardandoAvaliacaoAbertoDVC = false;
    window.renderRanking();
};

window.filtrarAtletasRankingDVC = (atletas = []) => {
    const filtros = window.filtrosRankingDVC || {};
    const busca = normalizarTextoRankingDVC(filtros.busca || "");

    return atletas.filter(atleta => {
        if (filtros.genero && filtros.genero !== "todos" && atleta.generoRanking !== filtros.genero) return false;
        if (filtros.categoria && filtros.categoria !== "todos" && atleta.categoriaRanking !== filtros.categoria) return false;
        if (filtros.funcao && filtros.funcao !== "todas" && atleta.funcaoRanking !== filtros.funcao) return false;

        if (busca) {
            const textoAtleta = normalizarTextoRankingDVC(`${atleta.nome || ""} ${atleta.email || atleta.id || ""}`);
            if (!textoAtleta.includes(busca)) return false;
        }

        return true;
    });
};

function filtrarParaContadorRankingDVC(atletas = [], chaveFiltro = "", valorFiltro = "") {
    const filtrosOriginais = window.filtrosRankingDVC || {};
    const filtrosTemporarios = {
        ...filtrosOriginais,
        [chaveFiltro]: valorFiltro,
        busca: ""
    };

    return atletas.filter(atleta => {
        if (filtrosTemporarios.genero && filtrosTemporarios.genero !== "todos" && atleta.generoRanking !== filtrosTemporarios.genero) return false;
        if (filtrosTemporarios.categoria && filtrosTemporarios.categoria !== "todos" && atleta.categoriaRanking !== filtrosTemporarios.categoria) return false;
        if (filtrosTemporarios.funcao && filtrosTemporarios.funcao !== "todas" && atleta.funcaoRanking !== filtrosTemporarios.funcao) return false;
        return true;
    }).length;
}

function botaoFiltroRankingDVC(chave, valor, label, contador = null) {
    const filtros = window.filtrosRankingDVC || {};
    const ativo = String(filtros[chave] || "") === String(valor);
    const classe = ativo
        ? "bg-[#990000] text-white border-[#990000] shadow-md shadow-red-900/10 dark:shadow-red-900/30"
        : "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750";
    const contadorHtml = contador !== null && contador !== undefined
        ? `<span class="${ativo ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-gray-955 text-gray-500 dark:text-gray-400'} ml-1 px-1.5 py-0.5 rounded-full">${contador}</span>`
        : "";

    return `
        <button onclick="alterarFiltroRankingDVC('${chave}', '${safeEditParam(valor)}')" class="${classe} border px-3 py-2 rounded-full text-[9px] font-black uppercase whitespace-nowrap transition">
            ${label}${contadorHtml}
        </button>
    `;
}

function renderTagsRankingDVC(atleta = {}, modoEscuro = false) {
    const classeBase = modoEscuro
        ? "bg-white/10 text-white/85 border-white/15"
        : "bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-450 border-gray-100 dark:border-gray-800";

    return `
        <div class="flex flex-wrap gap-1.5 mt-2">
            <span class="${classeBase} border px-2 py-1 rounded-full text-[8px] font-black uppercase">${getLabelGeneroRankingDVC(atleta.generoRanking)}</span>
            <span class="${classeBase} border px-2 py-1 rounded-full text-[8px] font-black uppercase">${getLabelCategoriaRankingDVC(atleta.categoriaRanking)}</span>
            <span class="${classeBase} border px-2 py-1 rounded-full text-[8px] font-black uppercase">${getLabelFuncaoRankingDVC(atleta.funcaoRanking)}</span>
        </div>
    `;
}

function renderCardTopLokiDVC(atleta, posicao, destaque = false) {
    if (!atleta) return "";

    const logoEscuro = PROJETO_ATUAL_DVC?.logoFundoEscuro || PROJETO_ATUAL_DVC?.logo || "assets/img/loki2.webp";
    const logoClaro = PROJETO_ATUAL_DVC?.logoFundoClaro || PROJETO_ATUAL_DVC?.logo || "assets/img/loki1.webp";
    const score = formatarPontuacaoRankingDVC(atleta.pontuacaoRanking, window.filtrosRankingDVC?.tipo || "tecnico", atleta.valorOcultoParaMim);
    const unidade = getUnidadeRankingDVC(window.filtrosRankingDVC?.tipo || "tecnico");

    if (destaque) {
        return `
            <div class="relative overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-[#990000] rounded-3xl p-5 text-white shadow-xl border border-white/10">
                <img src="${logoEscuro}" class="absolute -right-10 -bottom-12 w-40 h-40 opacity-10 object-contain">
                <div class="relative z-10">
                    <div class="flex items-start justify-between gap-4">
                        <div class="min-w-0">
                            <p class="text-[8px] font-black uppercase text-white/60">Loki Destaque #${posicao}</p>
                            <h3 class="text-lg font-black uppercase leading-tight truncate mt-1">${escaparHtml(atleta.nome || "Sem nome")}</h3>
                        </div>
                        <div class="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center p-1.5 shrink-0">
                            <img src="${logoClaro}" class="w-full h-full object-contain">
                        </div>
                    </div>
                    <div class="mt-5 flex items-end justify-between gap-3">
                        <div>
                            <p class="text-4xl font-black leading-none">${score}</p>
                            <p class="text-[8px] font-black uppercase text-white/55 mt-1">${unidade}</p>
                        </div>
                        <span class="bg-white text-[#990000] px-3 py-1 rounded-full text-[10px] font-black">#${posicao}</span>
                    </div>
                    ${renderTagsRankingDVC(atleta, true)}
                </div>
            </div>
        `;
    }

    return `
        <div class="relative overflow-hidden bg-white dark:bg-gray-900 border border-red-100 dark:border-red-950/40 rounded-3xl p-4 shadow-sm text-gray-900 dark:text-gray-100">
            <img src="${logoClaro}" class="absolute -right-7 -bottom-8 w-28 h-28 opacity-10 object-contain">
            <div class="relative z-10">
                <div class="flex items-center justify-between gap-3">
                    <div class="w-11 h-11 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 flex items-center justify-center p-1.5 shrink-0">
                        <img src="${logoClaro}" class="w-full h-full object-contain">
                    </div>
                    <span class="bg-[#990000] text-white px-2 py-1 rounded-full text-[9px] font-black">#${posicao}</span>
                </div>
                <p class="text-[8px] font-black uppercase text-[#990000] dark:text-red-400 mt-3">Loki Destaque #${posicao}</p>
                <h3 class="text-xs font-black uppercase text-gray-900 dark:text-gray-100 truncate mt-1">${escaparHtml(atleta.nome || "Sem nome")}</h3>
                <div class="mt-3 flex items-end justify-between gap-2">
                    <p class="text-2xl font-black text-[#990000] dark:text-red-400 leading-none">${score}</p>
                    <p class="text-[8px] font-black uppercase text-gray-400 dark:text-gray-500">${unidade}</p>
                </div>
                ${renderTagsRankingDVC(atleta)}
            </div>
        </div>
    `;
}

function renderCardRankingAtletaDVC(atleta, posicao) {
    const tipo = window.filtrosRankingDVC?.tipo || "tecnico";
    let score;
    let unidade = getUnidadeRankingDVC(tipo);
    
    if (tipo === "inteligencia" && window.subabaMestresDaTatica === "semana") {
        score = Number(atleta.ultimaPontuacaoQuizInteligencia || 0);
        unidade = "pts";
    } else {
        score = formatarPontuacaoRankingDVC(atleta.pontuacaoRanking, tipo, atleta.valorOcultoParaMim);
    }
    
    const podeAbrirPerfil = usuarioPodeAbrirPerfilRankingDVC(atleta);
    const avatarUrl = atleta.photoURL || atleta.fotoUrl || atleta.foto || 'assets/img/logo.webp';
    const corScore = tipo === "inteligencia" ? "text-indigo-900 dark:text-indigo-400" : "text-[#990000] dark:text-red-400";

    return `
        <div class="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-3 shadow-sm flex items-center justify-between gap-3 animate-fadeIn text-gray-900 dark:text-gray-100">
            <div class="flex items-center gap-3 min-w-0">
                <div class="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-850 flex items-center justify-center shrink-0 overflow-hidden">
                    <img src="${avatarUrl}" class="w-full h-full object-cover" onerror="this.src='assets/img/logo.webp'">
                </div>
                <div class="min-w-0 text-left">
                    <p class="text-xs font-black uppercase text-gray-900 dark:text-gray-100 truncate">
                        <span class="text-gray-400 dark:text-gray-550 font-bold mr-1">#${posicao}</span> ${escaparHtml(atleta.nome || "Sem nome")}
                    </p>
                    ${podeAbrirPerfil ? `
                        <button onclick="abrirPerfilAtletaRankingDVC('${safeEditParam(atleta.email || atleta.id || "")}', '${safeEditParam(atleta.nome || "")}')" class="text-[9px] font-black uppercase text-[#990000] dark:text-red-400 hover:underline transition mt-0.5 block">
                            VER PERFIL
                        </button>
                    ` : ""}
                </div>
            </div>
            <div class="text-right shrink-0">
                <p class="text-sm font-black ${atleta.valorOcultoParaMim ? 'text-gray-400 dark:text-gray-500 italic' : corScore} leading-none">${score}</p>
                <p class="text-[8px] font-black uppercase text-gray-400 dark:text-gray-555 mt-1">${unidade}</p>
            </div>
        </div>
    `;
}

function renderCardAguardandoAvaliacaoDVC(user = {}) {
    return `
        <div class="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-3 shadow-sm flex items-center justify-between gap-3 text-gray-900 dark:text-gray-100">
            <div class="min-w-0">
                <p class="text-xs font-black uppercase text-gray-800 dark:text-gray-200 truncate">${escaparHtml(user.nome || user.email || "Atleta")}</p>
                ${renderTagsRankingDVC(user)}
                <p class="text-[8px] font-black uppercase text-yellow-700 dark:text-yellow-450 mt-2">Aguardando avaliação técnica</p>
            </div>
            <div class="w-10 h-10 rounded-2xl bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-100 dark:border-yellow-900/50 flex items-center justify-center shrink-0">
                <i class="fa-solid fa-hourglass-half text-yellow-700 dark:text-yellow-400 text-sm"></i>
            </div>
        </div>
    `;
}

function prepararAtletasRankingDVC(atletas = [], tipo = "tecnico") {
    const emailAtual = String(auth.currentUser?.email || "").trim().toLowerCase();
    const podeVerScorePrivado = usuarioEhEquipeTecnica();

    return atletas
        .filter(user => !ehResponsavelTecnico(user))
        .map(user => {
            const email = String(user.email || user.id || "").trim().toLowerCase();
            const avaliacaoReal = atletaTemAvaliacaoRealDVC(user);
            const pontuacao = calcularPontuacaoRankingDVC(user, tipo);
            const scorePublico = user.scoreTecnicoPublico !== false;
            const valorOcultoParaMim = tipo === "tecnico" &&
                pontuacao !== null &&
                !podeVerScorePrivado &&
                email !== emailAtual &&
                !scorePublico;

            return {
                ...user,
                email,
                generoRanking: normalizarGeneroRankingDVC(user),
                categoriaRanking: normalizarCategoriaRankingDVC(user),
                funcaoRanking: normalizarFuncaoVoleiRankingDVC(user),
                avaliacaoRealRanking: avaliacaoReal,
                pontuacaoRanking: pontuacao,
                valorOcultoParaMim
            };
        });
}

async function aplicarDadosPresencaRankingDVC(atletas = []) {
    const contagem = {};

    try {
        const eventos = await carregarEventosCache();
        
        eventos.forEach(ev => {
            const presencas = window.DVC_CACHE?.presencasPorEvento?.[ev.id]?.dados || [];
            presencas.forEach(presencaDoc => {
                const email = String(presencaDoc.id || "").trim().toLowerCase();
                if (!email) return;
                contagem[email] = (contagem[email] || 0) + 1;
            });
        });

        atletas.forEach(user => {
            const email = String(user.email || user.id || "").trim().toLowerCase();
            user.presencasRankingDVC = contagem[email] || 0;
        });
    } catch (e) {
        console.warn("Nao foi possivel calcular presencas do ranking:", e);
    }
}

async function renderRankingDVCNovo(tipoRankingParametro = null) {
    const c = document.getElementById("main-content");
    if (!c) return;

    window.filtrosRankingDVC = window.filtrosRankingDVC || {
        tipo: "tecnico",
        genero: "todos",
        categoria: "todos",
        funcao: "todas",
        busca: ""
    };

    if (typeof tipoRankingParametro === "string" && tipoRankingParametro) {
        const tipoValido = TIPOS_RANKING_DVC.some(item => item.id === tipoRankingParametro);
        if (tipoValido) window.filtrosRankingDVC.tipo = tipoRankingParametro;
    }

    const filtros = window.filtrosRankingDVC;
    const tipoAtual = filtros.tipo || "tecnico";
    const projetoNomeRanking = PROJETO_ATUAL_DVC?.nome || "DVC";
    const projetoLogoRanking = PROJETO_ATUAL_DVC?.logoFundoEscuro || PROJETO_ATUAL_DVC?.logo || "assets/img/loki2.webp";

    window.subabaMestresDaTatica = window.subabaMestresDaTatica || "geral";
    window.alterarSubabaMestresDaTatica = (aba) => {
        window.subabaMestresDaTatica = aba;
        renderRankingDVCNovo();
    };

    function obterChaveSemanaRankingDVC(data = new Date()) {
        const dataRef = new Date(data.getTime());
        const dia = dataRef.getDay();
        const diff = dataRef.getDate() - dia + (dia === 0 ? -6 : 1);
        dataRef.setDate(diff);
        dataRef.setHours(0, 0, 0, 0);
        const inicioAno = new Date(dataRef.getFullYear(), 0, 1);
        const dias = Math.floor((dataRef - inicioAno) / (24 * 60 * 60 * 1000));
        const semanaDoAno = Math.ceil((dataRef.getDay() + 1 + dias) / 7);
        return `${dataRef.getFullYear()}-W${String(semanaDoAno).padStart(2, '0')}`;
    }

    c.innerHTML = `
        <div class="space-y-4">
            <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-950 via-gray-900 to-[#990000] text-white p-5 shadow-xl">
                <img src="${projetoLogoRanking}" class="absolute -right-10 -bottom-12 w-48 h-48 opacity-10 object-contain">
                <div class="relative z-10">
                    <p class="text-[8px] font-black uppercase text-white/55">Ranking oficial</p>
                    <h2 class="text-2xl font-black uppercase leading-none mt-1">Ranking ${projetoNomeRanking}</h2>
                    <p class="text-[10px] font-semibold text-white/70 mt-3 max-w-xs leading-relaxed">
                        Compare atletas por categoria, gênero, função e desempenho.
                    </p>
                </div>
            </div>

            <div class="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-4 shadow-sm">
                <p class="text-[9px] font-black uppercase text-[#990000] dark:text-red-400 mb-3">Carregando ranking</p>
                <div class="h-2 bg-gray-100 dark:bg-gray-955 rounded-full overflow-hidden">
                    <div class="h-full bg-[#990000] w-1/2 animate-pulse"></div>
                </div>
            </div>
        </div>
    `;

    try {
        let atletas = window.AppCache?.atletas || window.DVC_CACHE?.users?.dados;
        if (!atletas || atletas.length === 0) {
            atletas = await carregarAtletasCache();
        }

        if (tipoAtual === "presenca") {
            await aplicarDadosPresencaRankingDVC(atletas);
        }

        const atletasPreparados = prepararAtletasRankingDVC(atletas, tipoAtual);
        const atletasFiltrados = window.filtrarAtletasRankingDVC(atletasPreparados);

        let rankingPrincipal = [];
        
        if (tipoAtual === "inteligencia" && window.subabaMestresDaTatica === "semana") {
            const semanaAtual = obterChaveSemanaRankingDVC();
            rankingPrincipal = atletasFiltrados
                .filter(a => a.avaliacaoRealRanking && a.ultimaSemanaQuizInteligencia === semanaAtual)
                .sort((a, b) => {
                    const pa = Number(a.ultimaPontuacaoQuizInteligencia || 0);
                    const pb = Number(b.ultimaPontuacaoQuizInteligencia || 0);
                    return pb - pa || (a.nome || "").localeCompare(b.nome || "");
                });
        } else {
            rankingPrincipal = atletasFiltrados
                .filter(atleta => atleta.avaliacaoRealRanking && atleta.pontuacaoRanking !== null)
                .sort((a, b) => {
                    if (a.valorOcultoParaMim && !b.valorOcultoParaMim) return 1;
                    if (!a.valorOcultoParaMim && b.valorOcultoParaMim) return -1;
                    if (a.valorOcultoParaMim && b.valorOcultoParaMim) {
                        return (a.nome || "").localeCompare(b.nome || "");
                    }
                    return Number(b.pontuacaoRanking || 0) - Number(a.pontuacaoRanking || 0) ||
                        (a.nome || "").localeCompare(b.nome || "");
                });
        }

        const aguardandoAvaliacao = atletasFiltrados
            .filter(atleta => !atleta.avaliacaoRealRanking)
            .sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));

        const semDados = atletasFiltrados
            .filter(atleta => atleta.avaliacaoRealRanking && atleta.pontuacaoRanking === null)
            .sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));

        const top3 = rankingPrincipal.filter(atleta => !atleta.valorOcultoParaMim).slice(0, 3);
        const contadorEncontrados = rankingPrincipal.length;
        const tipoLabel = getLabelTipoRankingDVC(tipoAtual);
        const deveFocarBusca = document.activeElement?.id === "ranking-busca";

        const botoesTipo = TIPOS_RANKING_DVC.map(item => botaoFiltroRankingDVC("tipo", item.id, `<i class="fa-solid ${item.icon} mr-1"></i>${item.label}`)).join("");
        const botoesGenero = GENEROS_RANKING_DVC.map(item => botaoFiltroRankingDVC("genero", item.id, item.label, filtrarParaContadorRankingDVC(atletasPreparados, "genero", item.id))).join("");
        const botoesCategoria = CATEGORIAS_RANKING_DVC.map(item => botaoFiltroRankingDVC("categoria", item.id, item.label, filtrarParaContadorRankingDVC(atletasPreparados, "categoria", item.id))).join("");
        const botoesFuncao = FUNCOES_RANKING_DVC.map(item => botaoFiltroRankingDVC("funcao", item.id, item.label, filtrarParaContadorRankingDVC(atletasPreparados, "funcao", item.id))).join("");

        const renderMestresConquistasDVC = (atletas) => {
            const onFireUsers = atletas.filter(a => a.badgesQuizInteligencia?.onFire).length;
            const mestreUsers = atletas.filter(a => a.badgesQuizInteligencia?.mestreDaSemana).length;
            const topStreaks = [...atletas].sort((a,b) => (b.melhorStreakQuiz || 0) - (a.melhorStreakQuiz || 0)).slice(0, 5).filter(a => a.melhorStreakQuiz > 0);
            const topDesafios = [...atletas].sort((a,b) => (b.totalDesafiosQuizConcluidos || 0) - (a.totalDesafiosQuizConcluidos || 0)).slice(0, 5).filter(a => a.totalDesafiosQuizConcluidos > 0);

            return `
                <section class="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-4 shadow-sm space-y-4 text-gray-900 dark:text-gray-100">
                    <div>
                        <p class="text-[9px] font-black uppercase text-[#990000] dark:text-red-400">Conquistas Gerais</p>
                        <h3 class="text-sm font-black uppercase text-gray-900 dark:text-gray-200">Mural de Inteligência</h3>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div class="bg-red-50 dark:bg-red-955/20 border border-red-100 dark:border-red-900/40 rounded-2xl p-4 text-center">
                            <i class="fa-solid fa-fire text-red-500 dark:text-red-455 text-xl mb-2"></i>
                            <p class="text-2xl font-black text-red-700 dark:text-red-400 leading-none">${onFireUsers}</p>
                            <p class="text-[8px] font-black uppercase text-red-600 dark:text-red-450 mt-1">On Fire</p>
                        </div>
                        <div class="bg-yellow-50 dark:bg-yellow-955/20 border border-yellow-100 dark:border-yellow-900/40 rounded-2xl p-4 text-center">
                            <i class="fa-solid fa-star text-yellow-500 dark:text-yellow-455 text-xl mb-2"></i>
                            <p class="text-2xl font-black text-yellow-700 dark:text-yellow-400 leading-none">${mestreUsers}</p>
                            <p class="text-[8px] font-black uppercase text-yellow-600 dark:text-yellow-450 mt-1">Mestres</p>
                        </div>
                    </div>
                    <div class="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <p class="text-[9px] font-black uppercase text-gray-400 dark:text-gray-500 mb-3"><i class="fa-solid fa-bolt mr-1"></i>Maiores Sequências</p>
                        <div class="space-y-2">
                            ${topStreaks.length ? topStreaks.map(a => `
                                <div class="bg-gray-50 dark:bg-gray-955 border border-gray-100 dark:border-gray-850 rounded-xl p-3 flex justify-between items-center text-gray-700 dark:text-gray-300">
                                    <span class="text-xs font-black uppercase text-gray-700 dark:text-gray-300 truncate">${escaparHtml(a.nome || "Sem nome")}</span>
                                    <span class="text-sm font-black text-indigo-700 dark:text-indigo-400">${a.melhorStreakQuiz} <i class="fa-solid fa-fire text-[8px]"></i></span>
                                </div>
                            `).join("") : '<p class="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 text-center py-2">Sem registros ainda.</p>'}
                        </div>
                    </div>
                    <div class="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <p class="text-[9px] font-black uppercase text-gray-400 dark:text-gray-500 mb-3"><i class="fa-solid fa-check-double mr-1"></i>Mais Desafios Concluídos</p>
                        <div class="space-y-2">
                            ${topDesafios.length ? topDesafios.map(a => `
                                <div class="bg-gray-50 dark:bg-gray-955 border border-gray-100 dark:border-gray-850 rounded-xl p-3 flex justify-between items-center text-gray-700 dark:text-gray-300">
                                    <span class="text-xs font-black uppercase text-gray-700 dark:text-gray-300 truncate">${escaparHtml(a.nome || "Sem nome")}</span>
                                    <span class="text-sm font-black text-indigo-700 dark:text-indigo-400">${a.totalDesafiosQuizConcluidos} <i class="fa-solid fa-check text-[8px]"></i></span>
                                </div>
                            `).join("") : '<p class="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 text-center py-2">Sem registros ainda.</p>'}
                        </div>
                    </div>
                </section>
            `;
        };

        const renderConteudoListaMestresDVC = (ranking, tipo, contador) => {
            const rankingExcluidoTop3 = ranking.slice(3);
            const limite = window.limiteListaRankingDVC || 10;
            const rankingPaginado = rankingExcluidoTop3.slice(0, limite);
            
            const exibirBotao = limite < rankingExcluidoTop3.length;
            const botaoHtml = exibirBotao ? `
                <div class="mt-4 flex justify-center">
                    <button onclick="window.carregarMaisAtletasRankingDVC()" class="w-full py-3 bg-gray-50 hover:bg-gray-100 dark:bg-gray-950 dark:hover:bg-gray-900 text-[#990000] dark:text-red-400 border border-gray-200 dark:border-gray-800 rounded-2xl text-xs font-black uppercase tracking-wider transition active:scale-[0.98]">
                        Carregar mais atletas (+10)
                    </button>
                </div>
            ` : "";

            return `
                <section class="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-4 shadow-sm animate-fadeIn text-gray-900 dark:text-gray-100">
                    <div class="flex items-center justify-between gap-3 mb-3">
                        <div>
                            <p class="text-[9px] font-black uppercase text-[#990000] dark:text-red-400">Lista completa</p>
                            <h3 class="text-sm font-black uppercase text-gray-900 dark:text-gray-200">${contador} atletas no ranking</h3>
                        </div>
                        <span class="text-[8px] font-black uppercase text-gray-400 dark:text-gray-500">${getUnidadeRankingDVC(tipo)}</span>
                    </div>
                    <div class="space-y-2">
                        ${rankingPaginado.length ? rankingPaginado.map((atleta, index) => {
                            const posicaoReal = index + 4;
                            return renderCardRankingAtletaDVC(atleta, posicaoReal);
                        }).join("") : `
                            <div class="bg-gray-50 dark:bg-gray-955 border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl p-5 text-center animate-fadeIn">
                                <p class="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500">${window.subabaMestresDaTatica === 'semana' ? "Ainda ninguém completou o desafio desta semana." : getMensagemSemDadosRankingDVC(tipo)}</p>
                            </div>
                        `}
                    </div>
                    ${botaoHtml}
                </section>
            `;
        };

        c.innerHTML = `
            <div class="space-y-4 pb-6">
                <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-950 via-gray-900 to-[#990000] text-white p-5 shadow-xl">
                    <img src="${projetoLogoRanking}" class="absolute -right-10 -bottom-12 w-48 h-48 opacity-10 object-contain">
                    <div class="relative z-10">
                        <div class="flex items-center gap-3">
                            <div class="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center p-2">
                                <img src="${projetoLogoRanking}" class="w-full h-full object-contain">
                            </div>
                            <div class="min-w-0">
                                <p class="text-[8px] font-black uppercase text-white/55">Ranking oficial</p>
                                <h2 class="text-2xl font-black uppercase leading-none truncate">Ranking ${projetoNomeRanking}</h2>
                                <p class="text-[9px] font-bold text-white/60 uppercase mt-1">${tipoLabel}</p>
                            </div>
                        </div>
                        <p class="text-[10px] font-semibold text-white/70 mt-4 max-w-sm leading-relaxed">
                            ${tipoAtual === "inteligencia" 
                                ? "Ranking de leitura de jogo, comunicação e tomada de decisão nos desafios semanais." 
                                : "Compare atletas por categoria, gênero, função e desempenho."}
                        </p>
                    </div>
                </div>

                <!-- Barra de Busca e Botão de Filtros lado a lado -->
                <div class="flex items-center gap-2 mb-3">
                    <div class="relative flex-grow">
                        <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
                        <input id="ranking-busca" value="${escaparHtml(filtros.busca || "")}" oninput="buscarRankingDVC(this.value)" placeholder="Buscar atleta..." class="w-full pl-9 pr-3 py-3 rounded-2xl border border-gray-200 dark:border-gray-850 bg-gray-50 dark:bg-gray-950 text-xs font-bold text-gray-905 dark:text-gray-150 outline-none focus:border-[#990000] dark:focus:border-red-600 transition-colors">
                    </div>
                    <button onclick="window.toggleFiltrosRankingDVC()" class="shrink-0 flex items-center gap-1.5 px-4 py-3 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-2xl text-xs font-black uppercase text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95 transition">
                        <i class="fa-solid fa-filter text-gray-500"></i>
                        Filtros
                    </button>
                </div>

                <!-- Seção de filtros colapsável (Accordion) -->
                <div id="ranking-filtros-accordion" class="${window.filtrosRankingAbertoDVC ? '' : 'hidden'} bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-4 shadow-sm mb-3 space-y-4 fade-in text-gray-900 dark:text-gray-100">
                    <div>
                        <p class="text-[9px] font-black uppercase text-[#990000] dark:text-red-400 mb-2">Tipo de ranking</p>
                        <div class="flex gap-2 overflow-x-auto pb-1 custom-scroll" style="scrollbar-width: none;">${botoesTipo}</div>
                    </div>
                    
                    ${tipoAtual === "inteligencia" ? `
                        <div class="pt-3 border-t border-gray-100 dark:border-gray-800">
                            <div class="flex gap-2 overflow-x-auto pb-1 custom-scroll" style="scrollbar-width: none;">
                                <button onclick="window.alterarSubabaMestresDaTatica('geral')" class="${window.subabaMestresDaTatica === 'geral' ? 'bg-[#990000] text-white border-[#990000]' : 'bg-gray-50 dark:bg-gray-950 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-900'} border px-4 py-2.5 rounded-full text-[9px] font-black uppercase whitespace-nowrap transition flex-1">Geral</button>
                                <button onclick="window.alterarSubabaMestresDaTatica('semana')" class="${window.subabaMestresDaTatica === 'semana' ? 'bg-[#990000] text-white border-[#990000]' : 'bg-gray-50 dark:bg-gray-955 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-900'} border px-4 py-2.5 rounded-full text-[9px] font-black uppercase whitespace-nowrap transition flex-1">Semana Atual</button>
                                <button onclick="window.alterarSubabaMestresDaTatica('conquistas')" class="${window.subabaMestresDaTatica === 'conquistas' ? 'bg-[#990000] text-white border-[#990000]' : 'bg-gray-50 dark:bg-gray-955 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-900'} border px-4 py-2.5 rounded-full text-[9px] font-black uppercase whitespace-nowrap transition flex-1">Conquistas</button>
                            </div>
                        </div>
                    ` : ""}

                    <div class="grid grid-cols-1 gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                        <div>
                            <p class="text-[9px] font-black uppercase text-gray-500 dark:text-gray-450 mb-2">Gênero</p>
                            <div class="flex gap-2 overflow-x-auto pb-1 custom-scroll" style="scrollbar-width: none;">${botoesGenero}</div>
                        </div>

                        <div>
                            <p class="text-[9px] font-black uppercase text-gray-500 dark:text-gray-455 mb-2">Categoria</p>
                            <div class="flex gap-2 overflow-x-auto pb-1 custom-scroll" style="scrollbar-width: none;">${botoesCategoria}</div>
                        </div>

                        <div>
                            <p class="text-[9px] font-black uppercase text-gray-500 dark:text-gray-455 mb-2">Função</p>
                            <div class="flex gap-2 overflow-x-auto pb-1 custom-scroll" style="scrollbar-width: none;">${botoesFuncao}</div>
                        </div>
                    </div>
                </div>

                <!-- Mini-Cards de Métricas em linha única compacta -->
                <div class="flex flex-row ${usuarioPodeAprovarAvaliacoes() ? 'justify-between' : 'justify-center'} items-center bg-gray-50 dark:bg-gray-955 p-2 rounded-xl text-[10px] text-gray-500 dark:text-gray-400 font-bold mb-3 border border-gray-200/50 dark:border-gray-800">
                    <span class="uppercase">Atletas Encontrados: <strong class="text-[#990000] dark:text-red-400 ml-1">${contadorEncontrados}</strong></span>
                    ${usuarioPodeAprovarAvaliacoes() ? `
                        <span class="uppercase">Aguardando Avaliação: <strong class="text-yellow-700 dark:text-yellow-450 ml-1">${aguardandoAvaliacao.length}</strong></span>
                    ` : ""}
                </div>

                <section class="space-y-3">
                    <div class="flex items-center justify-between gap-3">
                        <div>
                            <p class="text-[9px] font-black uppercase text-[#990000] dark:text-red-400">Top 3 Loki</p>
                            <h3 class="text-sm font-black uppercase text-gray-900 dark:text-gray-200">Destaques do filtro</h3>
                        </div>
                        <span class="bg-red-50 dark:bg-red-955/20 border border-red-100 dark:border-red-900/50 text-[#990000] dark:text-red-400 px-3 py-1 rounded-full text-[8px] font-black uppercase">${tipoLabel}</span>
                    </div>

                    ${top3.length ? `
                        <div class="space-y-3">
                            ${renderCardTopLokiDVC(top3[0], 1, true)}
                            ${top3.length > 1 ? `
                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    ${renderCardTopLokiDVC(top3[1], 2)}
                                    ${renderCardTopLokiDVC(top3[2], 3)}
                                </div>
                            ` : ""}
                        </div>
                    ` : `
                        <div class="bg-white dark:bg-gray-900 border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl p-5 text-center">
                            <p class="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500">${getMensagemSemDadosRankingDVC(tipoAtual)}</p>
                        </div>
                    `}
                </section>

                ${tipoAtual === "inteligencia" && window.subabaMestresDaTatica === "conquistas" 
                    ? renderMestresConquistasDVC(atletasFiltrados) 
                    : renderConteudoListaMestresDVC(rankingPrincipal, tipoAtual, contadorEncontrados)}

                ${semDados.length ? `
                    <section class="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-4 shadow-sm text-gray-900 dark:text-gray-100">
                        <p class="text-[9px] font-black uppercase text-gray-500 dark:text-gray-450 mb-3">${getMensagemSemDadosRankingDVC(tipoAtual)}</p>
                        <div class="space-y-2">
                            ${semDados.slice(0, 30).map(atleta => `
                                <div class="bg-gray-50 dark:bg-gray-955 border border-gray-100 dark:border-gray-850 rounded-2xl p-3">
                                    <p class="text-xs font-black uppercase text-gray-700 dark:text-gray-300 truncate">${escaparHtml(atleta.nome || atleta.email || "Atleta")}</p>
                                    ${renderTagsRankingDVC(atleta)}
                                </div>
                            `).join("")}
                        </div>
                    </section>
                ` : ""}

                ${aguardandoAvaliacao.length && usuarioPodeAprovarAvaliacoes() ? `
                    <section class="bg-white dark:bg-gray-900 border border-yellow-100 dark:border-yellow-950/40 rounded-3xl p-4 shadow-sm text-gray-900 dark:text-gray-100">
                        <!-- Cabeçalho clicável (Accordion Trigger) -->
                        <div onclick="window.toggleAguardandoAvaliacaoDVC()" class="flex items-center justify-between gap-3 cursor-pointer select-none">
                            <div>
                                <p class="text-[9px] font-black uppercase text-yellow-700 dark:text-yellow-450">Aguardando avaliação</p>
                                <h3 class="text-sm font-black uppercase text-gray-900 dark:text-gray-200">${aguardandoAvaliacao.length} atletas fora do ranking principal</h3>
                            </div>
                            <div class="flex items-center gap-2 shrink-0">
                                <i class="fa-solid fa-hourglass-half text-yellow-700 dark:text-yellow-455"></i>
                                <i class="fa-solid ${window.aguardandoAvaliacaoAbertoDVC ? 'fa-chevron-up' : 'fa-chevron-down'} text-gray-400 dark:text-gray-500 text-xs transition-transform duration-200"></i>
                            </div>
                        </div>
                        
                        <!-- Conteúdo colapsável -->
                        <div class="${window.aguardandoAvaliacaoAbertoDVC ? 'mt-4' : 'hidden'} space-y-2 fade-in">
                            ${(() => {
                                const limiteAguardando = window.limiteAguardandoAvaliacaoDVC || 10;
                                const paginados = aguardandoAvaliacao.slice(0, limiteAguardando);
                                const cards = paginados.map(atleta => renderCardAguardandoAvaliacaoDVC(atleta)).join("");
                                const exibirBotao = limiteAguardando < aguardandoAvaliacao.length;
                                const botao = exibirBotao ? `
                                    <div class="mt-4 flex justify-center">
                                        <button onclick="event.stopPropagation(); window.carregarMaisAguardandoAvaliacaoDVC();" class="w-full py-2.5 bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-955 dark:hover:bg-yellow-900 text-yellow-800 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-900/50 rounded-2xl text-[10px] font-black uppercase tracking-wider transition active:scale-[0.98]">
                                            Carregar mais (+10)
                                        </button>
                                    </div>
                                ` : "";
                                return cards + botao;
                            })()}
                        </div>
                    </section>
                ` : ""}
            </div>
        `;

        const buscaInput = document.getElementById("ranking-busca");
        if (buscaInput && deveFocarBusca) {
            buscaInput.focus();
            buscaInput.setSelectionRange(buscaInput.value.length, buscaInput.value.length);
        }
    } catch (e) {
        console.error("Erro ao carregar ranking:", e);
        c.innerHTML = `
            <div class="bg-red-50 border border-red-200 rounded-2xl p-5 text-center">
                <p class="text-xs font-black text-red-700 uppercase">Nao foi possivel carregar o ranking agora.</p>
            </div>
        `;
    }
};

window.renderRanking = renderRankingDVCNovo;
window.renderRankingDVCNovo = renderRankingDVCNovo;

export {
    TIPOS_RANKING_DVC,
    GENEROS_RANKING_DVC,
    CATEGORIAS_RANKING_DVC,
    FUNCOES_RANKING_DVC,
    atletaTemAvaliacaoRealDVC,
    obterNumeroRankingDVC,
    calcularPontuacaoRankingDVC,
    getLabelTipoRankingDVC,
    prepararAtletasRankingDVC,
    aplicarDadosPresencaRankingDVC,
    renderRankingDVCNovo,
    renderRankingDVCNovo as renderRanking
};
