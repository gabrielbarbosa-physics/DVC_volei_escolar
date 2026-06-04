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
        ? "bg-[#990000] text-white border-[#990000] shadow-md shadow-red-900/10"
        : "bg-white text-gray-500 border-gray-200";
    const contadorHtml = contador !== null && contador !== undefined
        ? `<span class="${ativo ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'} ml-1 px-1.5 py-0.5 rounded-full">${contador}</span>`
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
        : "bg-gray-50 text-gray-500 border-gray-100";

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
        <div class="relative overflow-hidden bg-white border border-red-100 rounded-3xl p-4 shadow-sm">
            <img src="${logoClaro}" class="absolute -right-7 -bottom-8 w-28 h-28 opacity-10 object-contain">
            <div class="relative z-10">
                <div class="flex items-center justify-between gap-3">
                    <div class="w-11 h-11 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center p-1.5 shrink-0">
                        <img src="${logoClaro}" class="w-full h-full object-contain">
                    </div>
                    <span class="bg-[#990000] text-white px-2 py-1 rounded-full text-[9px] font-black">#${posicao}</span>
                </div>
                <p class="text-[8px] font-black uppercase text-[#990000] mt-3">Loki Destaque #${posicao}</p>
                <h3 class="text-xs font-black uppercase text-gray-900 truncate mt-1">${escaparHtml(atleta.nome || "Sem nome")}</h3>
                <div class="mt-3 flex items-end justify-between gap-2">
                    <p class="text-2xl font-black text-[#990000] leading-none">${score}</p>
                    <p class="text-[8px] font-black uppercase text-gray-400">${unidade}</p>
                </div>
                ${renderTagsRankingDVC(atleta)}
            </div>
        </div>
    `;
}

function renderCardRankingAtletaDVC(atleta, posicao) {
    const tipo = window.filtrosRankingDVC?.tipo || "tecnico";
    const logoClaro = PROJETO_ATUAL_DVC?.logoFundoClaro || PROJETO_ATUAL_DVC?.logo || "assets/img/loki1.webp";
    const score = formatarPontuacaoRankingDVC(atleta.pontuacaoRanking, tipo, atleta.valorOcultoParaMim);
    const unidade = getUnidadeRankingDVC(tipo);
    const podeAbrirPerfil = usuarioPodeAbrirPerfilRankingDVC(atleta);

    return `
        <div class="bg-white border border-gray-100 rounded-2xl p-3 shadow-sm flex items-center justify-between gap-3">
            <div class="flex items-center gap-3 min-w-0">
                <div class="${posicao <= 3 ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'} w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 relative overflow-hidden">
                    ${posicao <= 3 ? `<img src="${logoClaro}" class="w-7 h-7 object-contain">` : `<span class="text-[10px] font-black text-gray-500">#${posicao}</span>`}
                </div>
                <div class="min-w-0">
                    <p class="text-xs font-black uppercase text-gray-900 truncate">${escaparHtml(atleta.nome || "Sem nome")}</p>
                    ${renderTagsRankingDVC(atleta)}
                    ${podeAbrirPerfil ? `
                        <button onclick="abrirPerfilAtletaRankingDVC('${safeEditParam(atleta.email || atleta.id || "")}', '${safeEditParam(atleta.nome || "")}')" class="mt-2 text-[8px] font-black uppercase text-[#990000]">
                            Ver perfil
                        </button>
                    ` : ""}
                </div>
            </div>
            <div class="text-right shrink-0">
                <p class="text-lg font-black ${atleta.valorOcultoParaMim ? 'text-gray-400 italic' : 'text-[#990000]'} leading-none">${score}</p>
                <p class="text-[8px] font-black uppercase text-gray-400 mt-1">${unidade}</p>
            </div>
        </div>
    `;
}

function renderCardAguardandoAvaliacaoDVC(user = {}) {
    return `
        <div class="bg-white border border-gray-100 rounded-2xl p-3 shadow-sm flex items-center justify-between gap-3">
            <div class="min-w-0">
                <p class="text-xs font-black uppercase text-gray-800 truncate">${escaparHtml(user.nome || user.email || "Atleta")}</p>
                ${renderTagsRankingDVC(user)}
                <p class="text-[8px] font-black uppercase text-yellow-700 mt-2">Aguardando avaliação técnica</p>
            </div>
            <div class="w-10 h-10 rounded-2xl bg-yellow-50 border border-yellow-100 flex items-center justify-center shrink-0">
                <i class="fa-solid fa-hourglass-half text-yellow-700 text-sm"></i>
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

            <div class="bg-white border border-gray-100 rounded-3xl p-4 shadow-sm">
                <p class="text-[9px] font-black uppercase text-[#990000] mb-3">Carregando ranking</p>
                <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
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
                <section class="bg-white border border-gray-100 rounded-3xl p-4 shadow-sm space-y-4">
                    <div>
                        <p class="text-[9px] font-black uppercase text-[#990000]">Conquistas Gerais</p>
                        <h3 class="text-sm font-black uppercase text-gray-900">Mural de Inteligência</h3>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div class="bg-red-50 border border-red-100 rounded-2xl p-4 text-center">
                            <i class="fa-solid fa-fire text-red-500 text-xl mb-2"></i>
                            <p class="text-2xl font-black text-red-700 leading-none">${onFireUsers}</p>
                            <p class="text-[8px] font-black uppercase text-red-600 mt-1">On Fire</p>
                        </div>
                        <div class="bg-yellow-50 border border-yellow-100 rounded-2xl p-4 text-center">
                            <i class="fa-solid fa-star text-yellow-500 text-xl mb-2"></i>
                            <p class="text-2xl font-black text-yellow-700 leading-none">${mestreUsers}</p>
                            <p class="text-[8px] font-black uppercase text-yellow-600 mt-1">Mestres</p>
                        </div>
                    </div>
                    <div class="mt-4 pt-4 border-t border-gray-100">
                        <p class="text-[9px] font-black uppercase text-gray-400 mb-3"><i class="fa-solid fa-bolt mr-1"></i>Maiores Sequências</p>
                        <div class="space-y-2">
                            ${topStreaks.length ? topStreaks.map(a => `
                                <div class="bg-gray-50 border border-gray-100 rounded-xl p-3 flex justify-between items-center">
                                    <span class="text-xs font-black uppercase text-gray-700 truncate">${escaparHtml(a.nome || "Sem nome")}</span>
                                    <span class="text-sm font-black text-indigo-700">${a.melhorStreakQuiz} <i class="fa-solid fa-fire text-[8px]"></i></span>
                                </div>
                            `).join("") : '<p class="text-[10px] font-black uppercase text-gray-400 text-center py-2">Sem registros ainda.</p>'}
                        </div>
                    </div>
                    <div class="mt-4 pt-4 border-t border-gray-100">
                        <p class="text-[9px] font-black uppercase text-gray-400 mb-3"><i class="fa-solid fa-check-double mr-1"></i>Mais Desafios Concluídos</p>
                        <div class="space-y-2">
                            ${topDesafios.length ? topDesafios.map(a => `
                                <div class="bg-gray-50 border border-gray-100 rounded-xl p-3 flex justify-between items-center">
                                    <span class="text-xs font-black uppercase text-gray-700 truncate">${escaparHtml(a.nome || "Sem nome")}</span>
                                    <span class="text-sm font-black text-indigo-700">${a.totalDesafiosQuizConcluidos} <i class="fa-solid fa-check text-[8px]"></i></span>
                                </div>
                            `).join("") : '<p class="text-[10px] font-black uppercase text-gray-400 text-center py-2">Sem registros ainda.</p>'}
                        </div>
                    </div>
                </section>
            `;
        };

        const renderConteudoListaMestresDVC = (ranking, tipo, contador) => {
            return `
                <section class="bg-white border border-gray-100 rounded-3xl p-4 shadow-sm">
                    <div class="flex items-center justify-between gap-3 mb-3">
                        <div>
                            <p class="text-[9px] font-black uppercase text-[#990000]">Lista completa</p>
                            <h3 class="text-sm font-black uppercase text-gray-900">${contador} atletas no ranking</h3>
                        </div>
                        <span class="text-[8px] font-black uppercase text-gray-400">${getUnidadeRankingDVC(tipo)}</span>
                    </div>
                    <div class="space-y-2">
                        ${ranking.length ? ranking.map((atleta, index) => {
                            if (tipo === "inteligencia") {
                                const score = window.subabaMestresDaTatica === "semana" ? Number(atleta.ultimaPontuacaoQuizInteligencia || 0) : formatarPontuacaoRankingDVC(atleta.pontuacaoRanking, tipo, atleta.valorOcultoParaMim);
                                const ultimaBadge = atleta.ultimaBadgeQuizRecebida ? `<span class="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-[8px] font-black uppercase ml-2">${escaparHtml(atleta.ultimaBadgeQuizRecebida)}</span>` : "";
                                const destaqueSemana = window.subabaMestresDaTatica === "semana" && atleta.ultimaSemanaQuizInteligencia ? `<span class="block text-[8px] font-bold text-gray-400 mt-1 uppercase">Semana: ${atleta.ultimaSemanaQuizInteligencia}</span>` : "";
                                return `
                                    <div class="bg-white border border-gray-100 rounded-2xl p-3 shadow-sm flex items-center justify-between gap-3">
                                        <div class="flex items-center gap-3 min-w-0">
                                            <div class="${index < 3 ? 'bg-indigo-50 border-indigo-100' : 'bg-gray-50 border-gray-100'} w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0">
                                                <span class="text-[10px] font-black text-gray-500">#${index + 1}</span>
                                            </div>
                                            <div class="min-w-0">
                                                <p class="text-xs font-black uppercase text-gray-900 truncate flex items-center">${escaparHtml(atleta.nome || "Sem nome")} ${ultimaBadge}</p>
                                                ${renderTagsRankingDVC(atleta)}
                                                ${destaqueSemana}
                                            </div>
                                        </div>
                                        <div class="text-right shrink-0">
                                            <p class="text-lg font-black text-indigo-900 leading-none">${score}</p>
                                            <p class="text-[8px] font-black uppercase text-gray-400 mt-1">pts</p>
                                        </div>
                                    </div>
                                `;
                            }
                            return renderCardRankingAtletaDVC(atleta, index + 1);
                        }).join("") : `
                            <div class="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-5 text-center">
                                <p class="text-[10px] font-black uppercase text-gray-400">${window.subabaMestresDaTatica === 'semana' ? "Ainda ninguém completou o desafio desta semana." : getMensagemSemDadosRankingDVC(tipo)}</p>
                            </div>
                        `}
                    </div>
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

                <div class="bg-white border border-gray-100 rounded-3xl p-4 shadow-sm space-y-4">
                    <div>
                        <p class="text-[9px] font-black uppercase text-[#990000] mb-2">Tipo de ranking</p>
                        <div class="flex gap-2 overflow-x-auto pb-1 custom-scroll">${botoesTipo}</div>
                    </div>
                    
                    ${tipoAtual === "inteligencia" ? `
                        <div class="pt-3 border-t border-gray-100">
                            <div class="flex gap-2 overflow-x-auto pb-1 custom-scroll">
                                <button onclick="window.alterarSubabaMestresDaTatica('geral')" class="${window.subabaMestresDaTatica === 'geral' ? 'bg-[#990000] text-white border-[#990000]' : 'bg-gray-50 text-gray-500 border-gray-200'} border px-4 py-2.5 rounded-full text-[9px] font-black uppercase whitespace-nowrap transition flex-1">Geral</button>
                                <button onclick="window.alterarSubabaMestresDaTatica('semana')" class="${window.subabaMestresDaTatica === 'semana' ? 'bg-[#990000] text-white border-[#990000]' : 'bg-gray-50 text-gray-500 border-gray-200'} border px-4 py-2.5 rounded-full text-[9px] font-black uppercase whitespace-nowrap transition flex-1">Semana Atual</button>
                                <button onclick="window.alterarSubabaMestresDaTatica('conquistas')" class="${window.subabaMestresDaTatica === 'conquistas' ? 'bg-[#990000] text-white border-[#990000]' : 'bg-gray-50 text-gray-500 border-gray-200'} border px-4 py-2.5 rounded-full text-[9px] font-black uppercase whitespace-nowrap transition flex-1">Conquistas</button>
                            </div>
                        </div>
                    ` : ""}

                    <div>
                        <p class="text-[9px] font-black uppercase text-gray-500 mb-2">Gênero</p>
                        <div class="flex gap-2 overflow-x-auto pb-1 custom-scroll">${botoesGenero}</div>
                    </div>

                    <div>
                        <p class="text-[9px] font-black uppercase text-gray-500 mb-2">Categoria</p>
                        <div class="flex gap-2 overflow-x-auto pb-1 custom-scroll">${botoesCategoria}</div>
                    </div>

                    <div>
                        <p class="text-[9px] font-black uppercase text-gray-500 mb-2">Função</p>
                        <div class="flex gap-2 overflow-x-auto pb-1 custom-scroll">${botoesFuncao}</div>
                    </div>

                    <div class="relative">
                        <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
                        <input id="ranking-busca" value="${escaparHtml(filtros.busca || "")}" oninput="buscarRankingDVC(this.value)" placeholder="Buscar atleta..." class="w-full pl-9 pr-3 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-xs font-bold outline-none focus:border-[#990000]">
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-3">
                    <div class="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                        <p class="text-[8px] font-black uppercase text-gray-400">Atletas encontrados</p>
                        <p class="text-2xl font-black text-[#990000] leading-none mt-2">${contadorEncontrados}</p>
                    </div>
                    <div class="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                        <p class="text-[8px] font-black uppercase text-gray-400">Aguardando avaliação</p>
                        <p class="text-2xl font-black text-yellow-700 leading-none mt-2">${aguardandoAvaliacao.length}</p>
                    </div>
                </div>

                <section class="space-y-3">
                    <div class="flex items-center justify-between gap-3">
                        <div>
                            <p class="text-[9px] font-black uppercase text-[#990000]">Top 3 Loki</p>
                            <h3 class="text-sm font-black uppercase text-gray-900">Destaques do filtro</h3>
                        </div>
                        <span class="bg-red-50 border border-red-100 text-[#990000] px-3 py-1 rounded-full text-[8px] font-black uppercase">${tipoLabel}</span>
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
                        <div class="bg-white border border-dashed border-gray-200 rounded-2xl p-5 text-center">
                            <p class="text-[10px] font-black uppercase text-gray-400">${getMensagemSemDadosRankingDVC(tipoAtual)}</p>
                        </div>
                    `}
                </section>

                ${tipoAtual === "inteligencia" && window.subabaMestresDaTatica === "conquistas" 
                    ? renderMestresConquistasDVC(atletasFiltrados) 
                    : renderConteudoListaMestresDVC(rankingPrincipal, tipoAtual, contadorEncontrados)}

                ${semDados.length ? `
                    <section class="bg-white border border-gray-100 rounded-3xl p-4 shadow-sm">
                        <p class="text-[9px] font-black uppercase text-gray-500 mb-3">${getMensagemSemDadosRankingDVC(tipoAtual)}</p>
                        <div class="space-y-2">
                            ${semDados.slice(0, 30).map(atleta => `
                                <div class="bg-gray-50 border border-gray-100 rounded-2xl p-3">
                                    <p class="text-xs font-black uppercase text-gray-700 truncate">${escaparHtml(atleta.nome || atleta.email || "Atleta")}</p>
                                    ${renderTagsRankingDVC(atleta)}
                                </div>
                            `).join("")}
                        </div>
                    </section>
                ` : ""}

                ${aguardandoAvaliacao.length ? `
                    <section class="bg-white border border-yellow-100 rounded-3xl p-4 shadow-sm">
                        <div class="flex items-center justify-between gap-3 mb-3">
                            <div>
                                <p class="text-[9px] font-black uppercase text-yellow-700">Aguardando avaliação</p>
                                <h3 class="text-sm font-black uppercase text-gray-900">${aguardandoAvaliacao.length} atletas fora do ranking principal</h3>
                            </div>
                            <i class="fa-solid fa-hourglass-half text-yellow-700"></i>
                        </div>
                        <div class="space-y-2">
                            ${aguardandoAvaliacao.map(atleta => renderCardAguardandoAvaliacaoDVC(atleta)).join("")}
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
    }

window.renderRanking = async (tipoRanking = null) => {
    return renderRankingDVCNovo(tipoRanking);
};

// === 2. ABERTURA DA TELA DO RANKING (que tinha sumido) ===
window.renderRankingDVCNovo = async (tipoRanking = null) => {
// =========================================================

    const c = document.getElementById('main-content');

    const tituloRanking = tipoRanking === "inteligencia" 
    ? "Mestres da Tática" 
    : (tipoRanking === "tecnico" ? "Ranking Técnico" : "Ranking de Presença");

    const projetoNomeRanking = PROJETO_ATUAL_DVC?.nome || "DVC";
    const projetoLogoRanking = PROJETO_ATUAL_DVC?.logoFundoEscuro || PROJETO_ATUAL_DVC?.logo || "assets/img/loki2.webp";
    const projetoLogoRankingClaro = PROJETO_ATUAL_DVC?.logoFundoClaro || "assets/img/loki1.webp";

c.innerHTML = `
    <div class="bg-gradient-to-br from-gray-950 via-gray-900 to-[#990000] text-white p-5 rounded-3xl mb-5 shadow-xl relative overflow-hidden">
        <div class="absolute -right-10 -bottom-12 opacity-10">
            <img src="${projetoLogoRanking}" class="w-48 h-48 object-contain">
        </div>

        <div class="relative z-10">
            <div class="flex items-center gap-3 mb-4">
                <div class="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center p-2">
                    <img src="${projetoLogoRanking}" class="w-full h-full object-contain">
                </div>

                <div>
                    <p class="text-[8px] font-black uppercase text-white/60">
                        Ranking oficial
                    </p>

                    <h3 class="text-xl font-black uppercase tracking-wide leading-none">
                        ${projetoNomeRanking}
                    </h3>

                    <p class="text-[9px] font-bold text-white/60 mt-1 uppercase">
                        ${tituloRanking}
                    </p>
                </div>
            </div>

            <div class="bg-white/10 border border-white/10 rounded-2xl p-3">
                <label class="text-[8px] font-black text-white/60 uppercase mb-2 block">
                    Escolher tipo de ranking
                </label>

                <select 
                    onchange="renderRanking(this.value)" 
                    class="w-full p-3 border border-white/20 rounded-xl text-xs font-black bg-white text-gray-800 outline-none">
                    <option value="presenca" ${tipoRanking === "presenca" ? "selected" : ""}>
                        Ranking de Presença
                    </option>
                    <option value="inteligencia" ${tipoRanking === "inteligencia" ? "selected" : ""}>
                        Mestres da Tática
                    </option>
                    <option value="tecnico" ${tipoRanking === "tecnico" ? "selected" : ""}>
                        Ranking Técnico
                    </option>
                </select>
            </div>
        </div>
    </div>

        <div class="flex items-center justify-center gap-2 mb-6">
            <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span class="text-[10px] font-bold">Masculino</span>

            <div class="w-3 h-3 bg-pink-500 rounded-full ml-4"></div>
            <span class="text-[10px] font-bold">Feminino</span>
        </div>
<div id="ranking-list" class="space-y-4">
            <p class="text-center text-xs text-gray-400 font-bold col-span-2">
                Carregando ranking...
            </p>
        </div>
    `;

    try {
        // 1. Busca usuários
        const usersSnap = await carregarUsuariosCacheMockDVC();

        // 2. Se o ranking for de presença, calcula as presenças
        let contagemPresencas = {};

        if (tipoRanking === "presenca") {
            try {
                const eventsSnap = await carregarEventosCacheMockDVC();

                eventsSnap.docs.forEach(ev => {
                    const presencas = window.DVC_CACHE?.presencasPorEvento?.[ev.id]?.dados || [];
                    presencas.forEach(p => {
                        contagemPresencas[p.id] = (contagemPresencas[p.id] || 0) + 1;
                    });
                });

            } catch (erroPresencasRanking) {
                console.warn("Não foi possível carregar todas as presenças do ranking:", erroPresencasRanking);
            }
        }

        // 3. Separa masculino e feminino
        let masc = [];
        let fem = [];
        let geralTecnico = [];
        const emailUsuarioAtual = auth.currentUser.email;
        const ehTreinador = usuarioPodeAprovarAvaliacoes();
        const calcularScoreTecnico = (habilidades) => {
            return calcularScoreGeralDVC(habilidades || {});
        };
        usersSnap.forEach(docUsuario => {
            let user = docUsuario.data();

            // Garante que tenha email mesmo se algum cadastro antigo não tiver o campo email salvo
            user.email = user.email || docUsuario.id;

            if (tipoRanking === "inteligencia") {
    user.qtd = Number(user.inteligenciaJogo || 0);
    user.valorOcultoParaMim = false;

} else if (tipoRanking === "tecnico") {
    user.aguardandoAvaliacao = !usuarioTemAvaliacaoTecnicaRealDVC(user);
    user.qtd = user.aguardandoAvaliacao ? 0 : calcularScoreTecnico(user.habilidades);

    const scorePublico = user.scoreTecnicoPublico !== false;
    const ehMeuProprioScore = user.email === emailUsuarioAtual;

    user.valorOcultoParaMim = !user.aguardandoAvaliacao && !ehTreinador && !ehMeuProprioScore && !scorePublico;

    geralTecnico.push(user);

} else {
    user.qtd = contagemPresencas[user.email] || 0;
    user.valorOcultoParaMim = false;
}
            if (user.sexo === 'M') {
                masc.push(user);
            } else {
                fem.push(user);
            }
        });

        // 4. Ordena do maior para o menor
       const ordenarRanking = (a, b) => {
    if (tipoRanking === "tecnico" && !ehTreinador) {
        if (a.aguardandoAvaliacao && !b.aguardandoAvaliacao) return 1;
        if (!a.aguardandoAvaliacao && b.aguardandoAvaliacao) return -1;
        if (a.valorOcultoParaMim && !b.valorOcultoParaMim) return 1;
        if (!a.valorOcultoParaMim && b.valorOcultoParaMim) return -1;

        if (a.valorOcultoParaMim && b.valorOcultoParaMim) {
            return (a.nome || "").localeCompare(b.nome || "");
        }
    }

    if (tipoRanking === "tecnico") {
        if (a.aguardandoAvaliacao && !b.aguardandoAvaliacao) return 1;
        if (!a.aguardandoAvaliacao && b.aguardandoAvaliacao) return -1;
    }

    return b.qtd - a.qtd;
};

masc.sort(ordenarRanking);
fem.sort(ordenarRanking);
geralTecnico.sort(ordenarRanking);
        // 5. Define o texto da pontuação
        const textoPontuacao = tipoRanking === "inteligencia" 
    ? "pts" 
    : (tipoRanking === "tecnico" ? "score" : "presenças");

        // 6. Renderiza o ranking
        const listDiv = document.getElementById('ranking-list');
        listDiv.innerHTML = "";
        if (tipoRanking === "tecnico") {
    const top20Tecnico = geralTecnico.slice(0, 20);

    let tabelaTecnicaHtml = `
    <div class="bg-white p-4 rounded-2xl border shadow-sm mb-4 overflow-hidden">
        <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
                <div class="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center p-1">
                    <img src="${projetoLogoRankingClaro}" class="w-full h-full object-contain">
                </div>

                <div>
                    <p class="text-[8px] font-black text-gray-400 uppercase">
                        Score Geral DVC
                    </p>
                    <h4 class="font-black text-xs uppercase text-[#990000]">
                        Top 20 Técnico
                    </h4>
                </div>
            </div>

            <span class="bg-red-50 border border-red-100 text-[#990000] text-[8px] font-black px-2 py-1 rounded-full uppercase">
                LOKI
            </span>
        </div>

        <div class="space-y-2">
`;

if (top20Tecnico.length === 0) {
    tabelaTecnicaHtml += `
        <div class="bg-gray-50 border border-dashed rounded-xl p-4 text-center">
            <p class="text-[10px] text-gray-400 font-bold uppercase">
                Nenhum atleta encontrado.
            </p>
        </div>
    `;
}

top20Tecnico.forEach((u, i) => {
    const aguardandoAvaliacao = tipoRanking === "tecnico" && u.aguardandoAvaliacao;
    const valorOculto = tipoRanking === "tecnico" && u.valorOcultoParaMim;

    const destaque = i < 3 && !valorOculto && !aguardandoAvaliacao;
    const nome = u.nome || "Sem nome";
    const sexo = u.sexo || "-";
    const score = aguardandoAvaliacao ? "Aguardando" : (valorOculto ? "Oculto" : `${u.qtd}`);
    const badgeHtml = valorOculto
        ? `
            <div class="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center shrink-0">
                <i class="fa-solid fa-lock text-gray-400 text-sm"></i>
            </div>
        `
        : destaque
            ? `
                <div class="relative w-10 h-10 rounded-xl bg-white border border-red-100 flex items-center justify-center shrink-0 overflow-hidden">
                    <img src="${projetoLogoRankingClaro}" class="w-7 h-7 object-contain">
                    <span class="absolute -top-1 -right-1 bg-[#990000] text-white text-[8px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                        ${i + 1}
                    </span>
                </div>
            `
            : `
                <div class="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center shrink-0">
                    <span class="text-[10px] font-black text-gray-500">
                        ${i + 1}º
                    </span>
                </div>
            `;

        tabelaTecnicaHtml += `
            <div class="${destaque ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'} border rounded-xl p-3 flex items-center justify-between gap-3">
                <div class="flex items-center gap-3 min-w-0">
                    ${badgeHtml}
                    <div class="min-w-0">
                        <p class="${destaque ? 'text-gray-900 font-black' : 'text-gray-700 font-bold'} text-xs uppercase truncate">
                            ${nome}
                        </p>
                        <p class="text-[8px] font-black uppercase ${sexo === 'M' ? 'text-blue-600' : sexo === 'F' ? 'text-pink-600' : 'text-gray-400'}">
                            ${sexo === 'M' ? 'Masculino' : sexo === 'F' ? 'Feminino' : 'Sexo não informado'}
                        </p>
                    </div>
                </div>
                <div class="text-right shrink-0">
                    <p class="text-sm font-black ${valorOculto || aguardandoAvaliacao ? 'text-gray-400 italic' : destaque ? 'text-[#990000]' : 'text-gray-700'}">
                        ${score}
                    </p>
                    <p class="text-[8px] text-gray-400 font-black uppercase">
                        Score
                    </p>
                </div>
            </div>
        `;
    });

    tabelaTecnicaHtml += `
            </div>
        </div>
    `;

    listDiv.innerHTML += tabelaTecnicaHtml;
};
        [
            { titulo: "Masculino", lista: masc.slice(0, 20), cor: "border-blue-500" },
{ titulo: "Feminino", lista: fem.slice(0, 20), cor: "border-pink-500" }
        ].forEach(grupo => {
            const corGrupo = grupo.titulo === "Masculino" ? "blue" : "pink";
const iconeGrupo = grupo.titulo === "Masculino" ? "fa-mars" : "fa-venus";

let html = `
    <div class="bg-white p-4 rounded-2xl border shadow-sm overflow-hidden relative">
        <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
                <div class="w-9 h-9 rounded-xl ${corGrupo === "blue" ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-pink-50 text-pink-700 border-pink-100"} border flex items-center justify-center">
                    <i class="fa-solid ${iconeGrupo} text-sm"></i>
                </div>

                <div>
                    <p class="text-[8px] font-black uppercase text-gray-400">
                        Ranking
                    </p>
                    <h4 class="font-black text-xs uppercase ${corGrupo === "blue" ? "text-blue-700" : "text-pink-700"}">
                        ${grupo.titulo}
                    </h4>
                </div>
            </div>

            <span class="bg-gray-50 border text-gray-500 text-[8px] font-black px-2 py-1 rounded-full uppercase">
                Top ${grupo.lista.length}
            </span>
        </div>
`;

            if (grupo.lista.length === 0) {
                html += `
                    <p class="text-[10px] text-gray-400 font-semibold italic">
                        Nenhum atleta encontrado.
                    </p>
                `;
            }

            grupo.lista.forEach((u, i) => {
                const aguardandoAvaliacaoGrupo = tipoRanking === "tecnico" && u.aguardandoAvaliacao;
                const valorOcultoGrupo = tipoRanking === "tecnico" && u.valorOcultoParaMim;
                const destaque = i < 3 && !aguardandoAvaliacaoGrupo && !valorOcultoGrupo;
                const valorRankingGrupo = aguardandoAvaliacaoGrupo ? "Aguardando" : (valorOcultoGrupo ? "Oculto" : u.qtd);

const badgeHtml = destaque
    ? `
        <div class="relative w-10 h-10 rounded-xl bg-white border border-red-100 flex items-center justify-center shrink-0 overflow-hidden">
            <img src="${projetoLogoRankingClaro}" class="w-7 h-7 object-contain">
            <span class="absolute -top-1 -right-1 bg-[#990000] text-white text-[8px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                ${i + 1}
            </span>
        </div>
    `
    : `
        <div class="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center shrink-0">
            <span class="text-[10px] font-black text-gray-500">
                ${i + 1}º
            </span>
        </div>
    `;

                html += `
                    <div class="${destaque ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'} border rounded-xl p-3 mb-2 flex items-center justify-between gap-3">
                        <div class="flex items-center gap-3 min-w-0">
                            ${badgeHtml}
                            <div class="min-w-0">
                                <p class="${destaque ? 'text-gray-900 font-black' : 'text-gray-700 font-bold'} text-xs uppercase truncate">
                                    ${u.nome || 'Sem nome'}
                                </p>
                                <p class="text-[8px] text-gray-400 font-black uppercase">
                                    ${grupo.titulo}
                                </p>
                            </div>
                        </div>
                        <div class="text-right shrink-0">
                            <p class="text-sm font-black ${aguardandoAvaliacaoGrupo || valorOcultoGrupo ? 'text-gray-400 italic' : destaque ? 'text-[#990000]' : 'text-gray-700'}">
                                ${valorRankingGrupo}
                            </p>
                            <p class="text-[8px] text-gray-400 font-black uppercase">
                                ${textoPontuacao}
                            </p>
                        </div>
                    </div>
                `;
            });


            html += `</div>`;
            listDiv.innerHTML += html;
        });

    } catch (e) {
        console.error("Erro ao carregar ranking:", e);

        const listDiv = document.getElementById('ranking-list');
        if (listDiv) {
            listDiv.innerHTML = `
                <div class="col-span-2 bg-red-50 border border-red-200 p-4 rounded-xl text-center">
                    <p class="text-xs font-bold text-red-700">
                        Não foi possível carregar o ranking agora.
                    </p>
                </div>
            `;
        }
    }
    };

const renderRanking = window.renderRanking;

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
    renderRanking
};
