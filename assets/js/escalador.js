/**
 * ============================================================================
 * Módulo: ESCALADOR
 * ============================================================================
 * Responsabilidade: Gerencia funcionalidades relacionadas a escalador.
 * Este arquivo faz parte do sistema modular do DVC App.
 * Todos os códigos principais aqui agrupados seguem as diretrizes do projeto.
 * ============================================================================
 */

import { db, auth, doc, getDoc } from "./firebase.js";

let currentEvento = null;
let currentAtletas = [];
let currentEstrategia = "forca_maxima";
let currentSistema = "5x1";
let currentQuantidadeSets = 3;
let setAtualSelecionado = 1;
let planoSets = null;
let escalacaoAtiva = null;
let debounceRegerarEscaladorDVC = null;

if (typeof window.DVC_DEBUG_PERFORMANCE === "undefined") {
    window.DVC_DEBUG_PERFORMANCE = false;
}

let estadoEscaladorDVC = window.estadoEscaladorDVC || {
    eventoId: null,
    atletasOriginais: [],
    atletasNormalizados: [],
    scoresCache: new Map(),
    funcaoCache: new Map(),
    habilidadesCache: new Map(),
    plano: null,
    estrategia: currentEstrategia,
    sistema: currentSistema,
    quantidadeSets: currentQuantidadeSets,
    setAtualSelecionado
};
window.estadoEscaladorDVC = estadoEscaladorDVC;

function perfInicioEscaladorDVC() {
    return typeof performance !== "undefined" ? performance.now() : Date.now();
}

function perfLogEscaladorDVC(label, inicio) {
    if (window.DVC_DEBUG_PERFORMANCE === true) {
        const agora = typeof performance !== "undefined" ? performance.now() : Date.now();
        console.log(`[DVC Escalador] ${label}: ${Math.round(agora - inicio)}ms`);
    }
}

// Helper to render local DVC icons safely
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
        />
    `;
}

// Session Storage Helpers
function salvarEscalacaoSession(eventoId, data) {
    const key = `dvc_escalador_${eventoId}`;
    sessionStorage.setItem(key, JSON.stringify(data));
}

function obterEscalacaoSession(eventoId) {
    const key = `dvc_escalador_${eventoId}`;
    const item = sessionStorage.getItem(key);
    if (!item) return null;
    try {
        return JSON.parse(item);
    } catch (e) {
        return null;
    }
}

function normalizarTextoEscaladorDVC(valor) {
    return String(valor || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, " ");
}

function normalizarChaveEscaladorDVC(valor) {
    return normalizarTextoEscaladorDVC(valor).replace(/\s+/g, "");
}

function obterCampoFuncaoEscaladorDVC(atleta, campos) {
    for (const campo of campos) {
        const valor = atleta?.[campo];
        if (valor !== undefined && valor !== null && String(valor).trim() !== "") {
            return valor;
        }
    }
    return "";
}

function normalizarFuncaoVoleiEscaladorDVC(atleta) {
    if (!atleta) return "universal";
    const cacheId = getEmailAtletaEscaladorDVC(atleta);
    if (cacheId && estadoEscaladorDVC.funcaoCache.has(cacheId)) {
        return estadoEscaladorDVC.funcaoCache.get(cacheId);
    }
    const finalizar = (funcao) => {
        if (cacheId) estadoEscaladorDVC.funcaoCache.set(cacheId, funcao);
        return funcao;
    };

    const raw = obterCampoFuncaoEscaladorDVC(atleta, [
        "posicaoOficial",
        "funcaoVolei",
        "posicaoVolei",
        "posicao",
        "funcao"
    ]);
    const norm = normalizarTextoEscaladorDVC(raw);
    const compact = norm.replace(/\s+/g, "");

    if (!norm || norm === "sem posicao" || norm === "formacao" || norm === "membro") return finalizar("universal");
    if (compact.includes("levant")) return finalizar("levantador");
    if (compact.includes("oposto")) return finalizar("oposto");
    if (compact.includes("ponteir") || compact.includes("ponteira") || compact === "ponta" || compact.includes("ponta") || compact.includes("ponteiropassador")) return finalizar("ponteiro");
    if (compact.includes("central") || compact.includes("meio")) return finalizar("central");
    if (compact.includes("libero") || compact.includes("lbero")) return finalizar("libero");
    if (compact.includes("universal")) return finalizar("universal");

    return finalizar("universal");
}

// Normalizes athlete positions
function normalizarFuncaoAtleta(atleta) {
    return normalizarFuncaoVoleiEscaladorDVC(atleta);
}

// Get standard name for display
function getDisplayRoleName(role) {
    const names = {
        "levantador": "Levantador",
        "oposto": "Oposto",
        "ponteiro": "Ponteiro",
        "central": "Central",
        "libero": "Líbero",
        "universal": "Universal",
        "formacao": "Em formação"
    };
    return names[role] || role;
}

function getDisplayEstrategiaName(est) {
    const names = {
        "forca_maxima": "Força Máxima",
        "distribuida": "Rodízio de Elenco",
        "ofensiva": "Ofensiva",
        "defensiva": "Defensiva"
    };
    return names[est] || est;
}

function numeroSeguroEscaladorDVC(valor, fallback = 0) {
    const num = Number(valor);
    return Number.isFinite(num) ? num : fallback;
}

function obterHabilidadeEscaladorDVC(habilidades = {}, aliases = [], fallback = 0) {
    const h = habilidades || {};
    const mapa = {};

    Object.keys(h).forEach(chave => {
        mapa[normalizarChaveEscaladorDVC(chave)] = h[chave];
    });

    for (const alias of aliases) {
        if (h[alias] !== undefined && h[alias] !== null && h[alias] !== "") {
            return numeroSeguroEscaladorDVC(h[alias], fallback);
        }

        const chaveNormalizada = normalizarChaveEscaladorDVC(alias);
        if (mapa[chaveNormalizada] !== undefined && mapa[chaveNormalizada] !== null && mapa[chaveNormalizada] !== "") {
            return numeroSeguroEscaladorDVC(mapa[chaveNormalizada], fallback);
        }
    }

    return fallback;
}

function obterHabilidadesNormalizadasEscaladorDVC(atleta = {}) {
    const cacheId = getEmailAtletaEscaladorDVC(atleta);
    if (cacheId && estadoEscaladorDVC.habilidadesCache.has(cacheId)) {
        return estadoEscaladorDVC.habilidadesCache.get(cacheId);
    }

    const h = atleta?.habilidades || {};
    const visaoJogo = obterHabilidadeEscaladorDVC(h, ["visaoJogo", "visao de jogo", "visão de jogo", "leituraJogo", "leitura de jogo"], 0);
    const comunicacao = obterHabilidadeEscaladorDVC(h, ["comunicacao", "comunicação", "comunicacaoQuadra", "comunicação em quadra", "trabalhoEquipe", "trabalho em equipe"], 0);

    const normalizadas = {
        recepcao: obterHabilidadeEscaladorDVC(h, ["recepcao", "recepção", "manchete"], 0),
        levantamento: obterHabilidadeEscaladorDVC(h, ["levantamento", "toque"], 0),
        toque: obterHabilidadeEscaladorDVC(h, ["toque", "levantamento"], 0),
        ataque: obterHabilidadeEscaladorDVC(h, ["ataque"], 0),
        bloqueio: obterHabilidadeEscaladorDVC(h, ["bloqueio"], 0),
        defesa: obterHabilidadeEscaladorDVC(h, ["defesa"], 0),
        saque: obterHabilidadeEscaladorDVC(h, ["saque"], 0),
        visaoJogo,
        antecipacao: obterHabilidadeEscaladorDVC(h, ["antecipacao", "antecipação"], visaoJogo),
        comunicacao,
        trabalhoEquipe: obterHabilidadeEscaladorDVC(h, ["trabalhoEquipe", "trabalho em equipe"], comunicacao)
    };

    if (cacheId) estadoEscaladorDVC.habilidadesCache.set(cacheId, normalizadas);
    return normalizadas;
}

function calcularMediaValoresEscaladorDVC(valores = []) {
    const validos = valores.map(v => numeroSeguroEscaladorDVC(v, 0)).filter(v => v > 0);
    if (validos.length === 0) return 0;
    return validos.reduce((acc, v) => acc + v, 0) / validos.length;
}

function calcularMediaPonderadaEscaladorDVC(habilidades, pesos) {
    let somaNotas = 0;
    let somaPesos = 0;

    Object.entries(pesos).forEach(([chave, peso]) => {
        const nota = numeroSeguroEscaladorDVC(habilidades[chave], 0);
        if (nota <= 0) return;
        somaNotas += nota * peso;
        somaPesos += peso;
    });

    return somaPesos > 0 ? somaNotas / somaPesos : 0;
}

function obterScoreGeralEscaladorDVC(atleta = {}, habilidades = null) {
    const scoreSalvo = numeroSeguroEscaladorDVC(
        atleta.scoreGeral ?? atleta.scoreTecnico ?? atleta.score ?? atleta.mediaHabilidades,
        NaN
    );

    if (Number.isFinite(scoreSalvo)) return scoreSalvo;

    const h = habilidades || obterHabilidadesNormalizadasEscaladorDVC(atleta);
    return calcularMediaValoresEscaladorDVC([
        h.recepcao,
        h.levantamento,
        h.ataque,
        h.bloqueio,
        h.defesa,
        h.saque,
        h.antecipacao,
        h.comunicacao,
        h.trabalhoEquipe
    ]);
}

function calcularScorePorFuncaoEscaladorDVC(atleta, funcaoDesejada, estrategia) {
    if (!atleta) return 0;
    const cacheId = getEmailAtletaEscaladorDVC(atleta);
    const cacheKey = `${cacheId}_${funcaoDesejada || "geral"}_${estrategia || "padrao"}`;
    if (cacheId && estadoEscaladorDVC.scoresCache.has(cacheKey)) {
        return estadoEscaladorDVC.scoresCache.get(cacheKey);
    }

    const h = obterHabilidadesNormalizadasEscaladorDVC(atleta);
    const scoreGeral = obterScoreGeralEscaladorDVC(atleta, h);
    const pesosPorFuncao = {
        levantador: {
            levantamento: 2,
            toque: 1.5,
            visaoJogo: 1.5,
            comunicacao: 1,
            defesa: 0.5
        },
        oposto: {
            ataque: 2,
            bloqueio: 1.5,
            saque: 1,
            defesa: 0.5
        },
        ponteiro: {
            recepcao: 1.7,
            ataque: 1.5,
            defesa: 1.2,
            saque: 0.8,
            comunicacao: 0.8
        },
        central: {
            bloqueio: 2,
            ataque: 1.7,
            saque: 0.8,
            visaoJogo: 0.8,
            defesa: 0.5
        },
        libero: {
            recepcao: 2,
            defesa: 2,
            antecipacao: 1.2,
            comunicacao: 1
        }
    };

    const pesos = pesosPorFuncao[funcaoDesejada] || {};
    const scoreFuncao = calcularMediaPonderadaEscaladorDVC(h, pesos);
    const scoreBase = scoreFuncao > 0 ? scoreFuncao : scoreGeral;

    const scoreFinal = Number(scoreBase.toFixed(1));
    if (cacheId) estadoEscaladorDVC.scoresCache.set(cacheKey, scoreFinal);
    return scoreFinal;
}

// Safe function to calculate technical scores based on strategy and position
function calcularScoreEstrategiaPosicaoDVC(atleta, estrategia, role) {
    if (!atleta) return 0;
    if (role) return calcularScorePorFuncaoEscaladorDVC(atleta, role, estrategia);
    return Number(obterScoreGeralEscaladorDVC(atleta).toFixed(1));
}

// Internal score strategy wrapper for user profile
function calcularScoreEstrategiaDVC(atleta, estrategia) {
    return calcularScoreEstrategiaPosicaoDVC(atleta, estrategia, null);
}

// Balance and select indices for Rodízio strategy
function selecionarIndicesDistribuidos(arr, qtdNecessaria) {
    if (arr.length <= qtdNecessaria) return arr;

    const resultado = [];
    const n = arr.length;

    if (qtdNecessaria === 1) {
        const idx = n >= 3 ? 1 : 0;
        resultado.push(arr[idx]);
    } else if (qtdNecessaria === 2) {
        resultado.push(arr[0]);
        const midIdx = Math.min(n - 1, Math.max(1, Math.floor(n / 2)));
        resultado.push(arr[midIdx]);
    } else {
        for (let i = 0; i < qtdNecessaria; i++) {
            if (i % 2 === 0) {
                resultado.push(arr[Math.floor(i / 2)]);
            } else {
                resultado.push(arr[n - 1 - Math.floor(i / 2)]);
            }
        }
    }
    return resultado;
}

function getEmailAtletaEscaladorDVC(atleta) {
    return String(atleta?.email || atleta?.id || atleta?.uid || atleta?.nome || "").trim().toLowerCase();
}

function reiniciarEstadoEscaladorDVC(eventoId = null) {
    estadoEscaladorDVC = {
        eventoId,
        atletasOriginais: [],
        atletasNormalizados: [],
        scoresCache: new Map(),
        funcaoCache: new Map(),
        habilidadesCache: new Map(),
        plano: null,
        estrategia: currentEstrategia,
        sistema: currentSistema,
        quantidadeSets: currentQuantidadeSets,
        setAtualSelecionado
    };
    window.estadoEscaladorDVC = estadoEscaladorDVC;
}

function atualizarEstadoPlanoEscaladorDVC() {
    estadoEscaladorDVC.plano = planoSets;
    estadoEscaladorDVC.estrategia = currentEstrategia;
    estadoEscaladorDVC.sistema = currentSistema;
    estadoEscaladorDVC.quantidadeSets = currentQuantidadeSets;
    estadoEscaladorDVC.setAtualSelecionado = setAtualSelecionado;
}

function aquecerCacheAtletasEscaladorDVC(atletas = []) {
    estadoEscaladorDVC.atletasOriginais = atletas;
    estadoEscaladorDVC.atletasNormalizados = atletas.map(atleta => ({
        email: getEmailAtletaEscaladorDVC(atleta),
        funcao: normalizarFuncaoVoleiEscaladorDVC(atleta),
        habilidades: obterHabilidadesNormalizadasEscaladorDVC(atleta)
    }));
}

function agendarRegerarSugestaoEscaladorDVC() {
    if (debounceRegerarEscaladorDVC) {
        clearTimeout(debounceRegerarEscaladorDVC);
    }
    debounceRegerarEscaladorDVC = setTimeout(() => {
        debounceRegerarEscaladorDVC = null;
        window.regerarSugestaoDVC();
    }, 200);
}

function adicionarAvisoEscaladorDVC(avisos, mensagem) {
    if (!avisos.includes(mensagem)) {
        avisos.push(mensagem);
    }
}

function obterSlotsSistemaEscaladorDVC(sistema) {
    if (sistema === "4x2_simples" || sistema === "4x2_infiltracao") {
        return [
            { zone: 1, role: "levantador" },
            { zone: 2, role: "ponteiro" },
            { zone: 3, role: "central" },
            { zone: 4, role: "levantador" },
            { zone: 5, role: "ponteiro" },
            { zone: 6, role: "central" }
        ];
    }

    return [
        { zone: 1, role: "levantador" },
        { zone: 2, role: "ponteiro" },
        { zone: 3, role: "central" },
        { zone: 4, role: "oposto" },
        { zone: 5, role: "ponteiro" },
        { zone: 6, role: "central" }
    ];
}

function obterTipoCompatibilidadeFuncaoEscaladorDVC(funcaoAtleta, funcaoDesejada) {
    if (funcaoAtleta === funcaoDesejada) return "exata";
    if (funcaoAtleta === "universal") return "universal";
    if (
        (funcaoDesejada === "ponteiro" && funcaoAtleta === "oposto") ||
        (funcaoDesejada === "oposto" && funcaoAtleta === "ponteiro")
    ) {
        return "proxima";
    }
    return "fora";
}

function obterMultiplicadorCompatibilidadeEscaladorDVC(tipo) {
    if (tipo === "exata") return 1;
    if (tipo === "universal") return 0.9;
    if (tipo === "proxima") return 0.75;
    return 0.55;
}

function ordenarCandidatosEscaladorDVC(candidatos, estrategia, participacoesPorAtleta) {
    candidatos.sort((a, b) => {
        const partsA = participacoesPorAtleta[getEmailAtletaEscaladorDVC(a.atleta)] || 0;
        const partsB = participacoesPorAtleta[getEmailAtletaEscaladorDVC(b.atleta)] || 0;

        if (estrategia === "distribuida" && partsA !== partsB) {
            return partsA - partsB;
        }

        if (Math.abs(a.scoreAjustado - b.scoreAjustado) <= 0.3 && partsA !== partsB) {
            return partsA - partsB;
        }

        return b.scoreAjustado - a.scoreAjustado;
    });
}

function montarCandidatosFuncaoEscaladorDVC(disponiveis, funcaoDesejada, estrategia) {
    return disponiveis.map(atleta => {
        const funcaoAtleta = normalizarFuncaoAtleta(atleta);
        const tipo = obterTipoCompatibilidadeFuncaoEscaladorDVC(funcaoAtleta, funcaoDesejada);
        const scoreFuncao = calcularScorePorFuncaoEscaladorDVC(atleta, funcaoDesejada, estrategia);
        const scoreGeral = obterScoreGeralEscaladorDVC(atleta);
        const baseScore = tipo === "fora" ? scoreGeral : scoreFuncao;

        return {
            atleta,
            funcaoAtleta,
            tipo,
            scoreAjustado: baseScore * obterMultiplicadorCompatibilidadeEscaladorDVC(tipo)
        };
    });
}

function buscarMelhorPorFuncaoEscaladorDVC(disponiveis, funcaoDesejada, estrategia, participacoesPorAtleta) {
    const candidatos = montarCandidatosFuncaoEscaladorDVC(disponiveis, funcaoDesejada, estrategia);
    const prioridades = ["exata", "universal", "proxima", "fora"];

    for (const tipo of prioridades) {
        const grupo = candidatos.filter(candidato => candidato.tipo === tipo);
        if (grupo.length === 0) continue;

        ordenarCandidatosEscaladorDVC(grupo, estrategia, participacoesPorAtleta);
        return grupo[0];
    }

    return null;
}

function selecionarLiberosEscaladorDVC(pool, estrategia) {
    return pool
        .filter(at => normalizarFuncaoAtleta(at) === "libero")
        .sort((a, b) => {
            const scoreA = calcularScorePorFuncaoEscaladorDVC(a, "libero", estrategia);
            const scoreB = calcularScorePorFuncaoEscaladorDVC(b, "libero", estrategia);
            return scoreB - scoreA;
        })
        .slice(0, 2);
}

function normalizarLiberosSetEscaladorDVC(set = {}) {
    const liberos = Array.isArray(set.liberos) ? set.liberos.filter(Boolean) : [];
    if (set.libero) liberos.push(set.libero);

    const vistos = new Set();
    return liberos.filter(atleta => {
        const chave = getEmailAtletaEscaladorDVC(atleta);
        if (!chave || vistos.has(chave)) return false;
        vistos.add(chave);
        return true;
    }).slice(0, 2);
}

function normalizarSetEscaladorDVC(set = {}) {
    const normalizado = {
        ...set,
        titulares: Array.isArray(set.titulares) ? set.titulares.filter(Boolean) : [],
        liberos: normalizarLiberosSetEscaladorDVC(set),
        reservas: Array.isArray(set.reservas) ? set.reservas.filter(Boolean) : [],
        esquemaQuadra: set.esquemaQuadra || {},
        avisos: Array.isArray(set.avisos) ? set.avisos : []
    };

    delete normalizado.libero;
    return limparDuplicidadesSetEscaladorDVC(normalizado);
}

function limparDuplicidadesSetEscaladorDVC(set = {}) {
    const liberos = normalizarLiberosSetEscaladorDVC(set);
    const emailsLiberos = new Set(liberos.map(getEmailAtletaEscaladorDVC).filter(Boolean));
    const esquemaQuadra = { ...(set.esquemaQuadra || {}) };

    Object.keys(esquemaQuadra).forEach(zone => {
        const atleta = esquemaQuadra[zone];
        const email = getEmailAtletaEscaladorDVC(atleta);
        if (!atleta || emailsLiberos.has(email) || normalizarFuncaoAtleta(atleta) === "libero") {
            esquemaQuadra[zone] = null;
        }
    });

    const emailsTitulares = new Set(Object.values(esquemaQuadra).filter(Boolean).map(getEmailAtletaEscaladorDVC));
    const vistosReservas = new Set();
    const reservas = (set.reservas || []).filter(atleta => {
        const email = getEmailAtletaEscaladorDVC(atleta);
        if (!email || emailsLiberos.has(email) || emailsTitulares.has(email) || vistosReservas.has(email)) return false;
        vistosReservas.add(email);
        return true;
    });

    return {
        ...set,
        liberos,
        reservas,
        esquemaQuadra,
        titulares: Object.values(esquemaQuadra).filter(Boolean)
    };
}

// Generate unique set suggestion
function gerarSugestaoSetUnicoDVC(pool, estrategia, sistema, setNumero, participacoesPorAtleta) {
    const avisos = [];
    
    // Check if athletes lack technical data
    const temFaltaDados = pool.some(at => {
        const hab = at.habilidades || {};
        const chaves = Object.keys(hab);
        if (chaves.length === 0) return true;
        return chaves.every(k => hab[k] === 3);
    });

    if (temFaltaDados) {
        avisos.push("Alguns atletas ainda não têm dados técnicos completos. O app usou o score geral como referência.");
    }

    if (pool.length === 6) {
        avisos.push("Há apenas 6 atletas disponíveis. O app repetirá a mesma base em todos os sets.");
    } else if (pool.length > 6 && pool.length < 8 && estrategia === "distribuida") {
        avisos.push("O rodízio foi limitado porque há poucos atletas reservas disponíveis.");
    }

    let libero = null;
    let poolSemLibero = [...pool];

    // Assign Libero if applicable (minimum 7 players)
    if (pool.length >= 7) {
        const liberosOficiais = pool.filter(at => normalizarFuncaoAtleta(at) === "libero");
        if (liberosOficiais.length > 0) {
            liberosOficiais.sort((a, b) => {
                const partsA = participacoesPorAtleta[a.email] || 0;
                const partsB = participacoesPorAtleta[b.email] || 0;
                const scoreA = calcularScoreEstrategiaPosicaoDVC(a, estrategia, "libero");
                const scoreB = calcularScoreEstrategiaPosicaoDVC(b, estrategia, "libero");
                
                if (partsA !== partsB) return partsA - partsB;
                return scoreB - scoreA;
            });
            libero = liberosOficiais[0];
            poolSemLibero = poolSemLibero.filter(at => at.email !== libero.email);
        }
    }

    // Set rotational positions
    let slotsNecessarios = [];
    if (sistema === "5x1") {
        slotsNecessarios = [
            { zone: 1, role: "levantador" },
            { zone: 2, role: "ponteiro" },
            { zone: 3, role: "central" },
            { zone: 4, role: "oposto" },
            { zone: 5, role: "ponteiro" },
            { zone: 6, role: "central" }
        ];
    } else if (sistema === "4x2_simples" || sistema === "4x2_infiltracao") {
        slotsNecessarios = [
            { zone: 1, role: "levantador" },
            { zone: 2, role: "ponteiro" },
            { zone: 3, role: "central" },
            { zone: 4, role: "levantador" },
            { zone: 5, role: "ponteiro" },
            { zone: 6, role: "central" }
        ];
    }

    const titulares = {};
    const disponiveis = [...poolSemLibero];

    // Sort order of matching priority
    const rolesOrder = ["levantador", "central", "ponteiro", "oposto"];

    for (const role of rolesOrder) {
        const slotsForRole = slotsNecessarios.filter(s => s.role === role);
        if (slotsForRole.length === 0) continue;

        let matchingPlayers = disponiveis.filter(p => {
            const f = normalizarFuncaoAtleta(p);
            return f === role || f === "universal";
        });

        // Sort based on strategy and play participations
        matchingPlayers.sort((a, b) => {
            const scoreA = calcularScoreEstrategiaPosicaoDVC(a, estrategia, role);
            const scoreB = calcularScoreEstrategiaPosicaoDVC(b, estrategia, role);
            
            const partsA = participacoesPorAtleta[a.email] || 0;
            const partsB = participacoesPorAtleta[b.email] || 0;
            
            if (estrategia === "distribuida") {
                if (partsA !== partsB) return partsA - partsB;
                return scoreB - scoreA;
            } else {
                if (Math.abs(scoreA - scoreB) <= 0.3) {
                    if (partsA !== partsB) return partsA - partsB;
                }
                return scoreB - scoreA;
            }
        });

        if (estrategia === "distribuida" && matchingPlayers.length > slotsForRole.length) {
            matchingPlayers = selecionarIndicesDistribuidos(matchingPlayers, slotsForRole.length);
        }

        for (const slot of slotsForRole) {
            if (matchingPlayers.length > 0) {
                const player = matchingPlayers.shift();
                titulares[slot.zone] = player;
                const idx = disponiveis.findIndex(p => p.email === player.email);
                if (idx !== -1) disponiveis.splice(idx, 1);
            } else {
                if (disponiveis.length > 0) {
                    disponiveis.sort((a, b) => {
                        const scoreA = calcularScoreEstrategiaPosicaoDVC(a, estrategia, role);
                        const scoreB = calcularScoreEstrategiaPosicaoDVC(b, estrategia, role);
                        const partsA = participacoesPorAtleta[a.email] || 0;
                        const partsB = participacoesPorAtleta[b.email] || 0;
                        
                        if (partsA !== partsB) return partsA - partsB;
                        return scoreB - scoreA;
                    });
                    const player = disponiveis.shift();
                    titulares[slot.zone] = player;

                    const msgAviso = "Não havia atleta suficiente em uma das funções. O app sugeriu a melhor alternativa disponível.";
                    if (!avisos.includes(msgAviso)) {
                        avisos.push(msgAviso);
                    }
                } else {
                    titulares[slot.zone] = null;
                }
            }
        }
    }

    const esquemaQuadra = {};
    for (let i = 1; i <= 6; i++) {
        esquemaQuadra[String(i)] = titulares[i] || null;
    }

    return {
        numero: setNumero,
        titulares: Object.values(titulares).filter(Boolean),
        libero,
        reservas: disponiveis,
        esquemaQuadra,
        avisos
    };
}

function gerarSugestaoSetUnicoCorrigidaDVC(pool, estrategia, sistema, setNumero, participacoesPorAtleta) {
    const avisos = [];

    const temFaltaDados = pool.some(at => {
        const hab = at.habilidades || {};
        const chaves = Object.keys(hab);
        if (chaves.length === 0) return true;
        return chaves.every(k => Number(hab[k]) === 3);
    });

    if (temFaltaDados) {
        avisos.push("Alguns atletas ainda nao tem dados tecnicos completos. A sugestao por posicao pode ficar menos precisa.");
    }

    if (pool.length === 6) {
        avisos.push("HÃ¡ apenas 6 atletas disponÃ­veis. O app repetirÃ¡ a mesma base em todos os sets.");
    } else if (pool.length > 6 && pool.length < 8 && estrategia === "distribuida") {
        avisos.push("O rodÃ­zio foi limitado porque hÃ¡ poucos atletas reservas disponÃ­veis.");
    }

    const liberos = selecionarLiberosEscaladorDVC(pool, estrategia);
    const emailsLiberosSelecionados = new Set(liberos.map(getEmailAtletaEscaladorDVC));
    const liberosReservas = pool.filter(at => {
        return normalizarFuncaoAtleta(at) === "libero" && !emailsLiberosSelecionados.has(getEmailAtletaEscaladorDVC(at));
    });
    const poolQuadra = pool.filter(at => normalizarFuncaoAtleta(at) !== "libero");

    if (liberos.length === 0) {
        adicionarAvisoEscaladorDVC(avisos, "Nenhum libero identificado entre os convocados.");
    }

    const slotsNecessarios = obterSlotsSistemaEscaladorDVC(sistema);
    const titulares = {};
    const disponiveis = [...poolQuadra];

    for (const slot of slotsNecessarios) {
        const escolhido = buscarMelhorPorFuncaoEscaladorDVC(disponiveis, slot.role, estrategia, participacoesPorAtleta);

        if (!escolhido) {
            titulares[slot.zone] = null;
            continue;
        }

        titulares[slot.zone] = escolhido.atleta;
        const idx = disponiveis.findIndex(p => getEmailAtletaEscaladorDVC(p) === getEmailAtletaEscaladorDVC(escolhido.atleta));
        if (idx !== -1) disponiveis.splice(idx, 1);

        if (escolhido.tipo !== "exata") {
            adicionarAvisoEscaladorDVC(
                avisos,
                `Na posicao ${getDisplayRoleName(slot.role)}, nao havia atleta suficiente da funcao. O app usou a melhor alternativa disponivel.`
            );
        }
    }

    const esquemaQuadra = {};
    for (let i = 1; i <= 6; i++) {
        esquemaQuadra[String(i)] = titulares[i] || null;
    }

    return limparDuplicidadesSetEscaladorDVC({
        numero: setNumero,
        titulares: Object.values(titulares).filter(Boolean),
        liberos,
        reservas: [...disponiveis, ...liberosReservas],
        esquemaQuadra,
        avisos
    });
}

// Generate multi-sets plan
function gerarPlanoSetsEscaladorDVC(atletasConvocados, estrategia, sistema, quantidadeSets) {
    const inicioPlano = perfInicioEscaladorDVC();
    const pool = atletasConvocados.filter(at => {
        if (!at) return false;
        if (typeof window.usuarioEhAtletaAtivo === "function") {
            return window.usuarioEhAtletaAtivo(at);
        }
        const func = String(at.funcao || "").trim().toLowerCase();
        return func !== "adm" && func !== "treinador";
    });

    const sets = [];
    const participacoesPorAtleta = {};
    pool.forEach(at => {
        participacoesPorAtleta[getEmailAtletaEscaladorDVC(at)] = 0;
    });

    for (let setNum = 1; setNum <= quantidadeSets; setNum++) {
        const setEscalacao = gerarSugestaoSetUnicoCorrigidaDVC(pool, estrategia, sistema, setNum, participacoesPorAtleta);
        
        setEscalacao.titulares.forEach(p => {
            const chave = getEmailAtletaEscaladorDVC(p);
            if (p && participacoesPorAtleta[chave] !== undefined) {
                participacoesPorAtleta[chave]++;
            }
        });
        
        sets.push(setEscalacao);
    }

    const plano = {
        eventoId: currentEvento?.id || "",
        estrategia,
        sistema,
        quantidadeSets,
        setAtualSelecionado: 1,
        sets
    };
    perfLogEscaladorDVC("gerar plano de sets", inicioPlano);
    return plano;
}

function gerarSugestaoEscalacaoDVC(atletasConvocados, estrategia = "forca_maxima", sistemaRotacao = "5x1") {
    if (typeof gerarPlanoSetsEscaladorDVC === "function") {
        const plano = gerarPlanoSetsEscaladorDVC(atletasConvocados, estrategia, sistemaRotacao, 1);
        return plano?.sets?.[0] || null;
    }

    console.warn("[DVC Escalador] gerarPlanoSetsEscaladorDVC indisponivel para compatibilidade.");
    return null;
}

// UI trigger controller methods
function alterarQuantidadeSetsEscaladorDVC(qtdSets) {
    currentQuantidadeSets = Number(qtdSets) || 3;
    agendarRegerarSugestaoEscaladorDVC();
}

function selecionarSetEscaladorDVC(numeroSet) {
    const inicioTrocaSet = perfInicioEscaladorDVC();
    setAtualSelecionado = Number(numeroSet) || 1;
    if (planoSets) {
        planoSets.setAtualSelecionado = setAtualSelecionado;
        planoSets.sets[setAtualSelecionado - 1] = normalizarSetEscaladorDVC(planoSets.sets[setAtualSelecionado - 1]);
        escalacaoAtiva = planoSets.sets[setAtualSelecionado - 1];
        salvarEscalacaoSession(currentEvento.id, planoSets);
        atualizarEstadoPlanoEscaladorDVC();
    }
    window.renderEscaladorTaticoDVC(currentEvento, currentAtletas);
    perfLogEscaladorDVC("trocar set", inicioTrocaSet);
}

window.alterarQuantidadeSetsEscaladorDVC = alterarQuantidadeSetsEscaladorDVC;
window.selecionarSetEscaladorDVC = selecionarSetEscaladorDVC;

window.alterarEstrategiaEscaladorDVC = (estrategia) => {
    currentEstrategia = estrategia;
    agendarRegerarSugestaoEscaladorDVC();
};

window.alterarSistemaEscaladorDVC = (sistema) => {
    currentSistema = sistema;
    agendarRegerarSugestaoEscaladorDVC();
};

window.regerarSugestaoDVC = () => {
    const inicioRegerar = perfInicioEscaladorDVC();
    planoSets = gerarPlanoSetsEscaladorDVC(currentAtletas, currentEstrategia, currentSistema, currentQuantidadeSets);
    setAtualSelecionado = 1;
    planoSets.setAtualSelecionado = 1;
    escalacaoAtiva = planoSets.sets[0];
    atualizarEstadoPlanoEscaladorDVC();
    
    salvarEscalacaoSession(currentEvento.id, planoSets);
    window.renderEscaladorTaticoDVC(currentEvento, currentAtletas);
    perfLogEscaladorDVC("regerar sugestao", inicioRegerar);
};

window.fecharEscaladorTaticoDVC = () => {
    if (debounceRegerarEscaladorDVC) {
        clearTimeout(debounceRegerarEscaladorDVC);
        debounceRegerarEscaladorDVC = null;
    }
    document.getElementById("modal-escalador-tatico")?.remove();
};

function trocarTitularEscaladorDVC(posicaoQuadra, reserveEmail) {
    const inicioTrocaAtleta = perfInicioEscaladorDVC();
    if (!posicaoQuadra || !reserveEmail) return;
    if (!planoSets || !escalacaoAtiva) return;

    escalacaoAtiva = normalizarSetEscaladorDVC(escalacaoAtiva);
    planoSets.sets[setAtualSelecionado - 1] = escalacaoAtiva;

    const reserveIdx = escalacaoAtiva.reservas.findIndex(r => getEmailAtletaEscaladorDVC(r) === String(reserveEmail).trim().toLowerCase());
    if (reserveIdx === -1) return;

    const reservePlayer = escalacaoAtiva.reservas[reserveIdx];
    const reservaEhLibero = normalizarFuncaoAtleta(reservePlayer) === "libero";

    if (String(posicaoQuadra).startsWith("libero")) {
        if (!reservaEhLibero) return;

        const liberoIndex = Number(String(posicaoQuadra).replace("libero", "")) - 1;
        const indexSeguro = Number.isInteger(liberoIndex) && liberoIndex >= 0 ? Math.min(liberoIndex, 1) : 0;
        const oldLibero = escalacaoAtiva.liberos[indexSeguro] || null;
        escalacaoAtiva.liberos[indexSeguro] = reservePlayer;
        escalacaoAtiva.reservas.splice(reserveIdx, 1);
        if (oldLibero) {
            escalacaoAtiva.reservas.push(oldLibero);
        }
    } else {
        if (reservaEhLibero) return;

        const zoneStr = String(posicaoQuadra);
        const oldStarter = escalacaoAtiva.esquemaQuadra[zoneStr];
        escalacaoAtiva.esquemaQuadra[zoneStr] = reservePlayer;
        escalacaoAtiva.reservas.splice(reserveIdx, 1);
        if (oldStarter) {
            escalacaoAtiva.reservas.push(oldStarter);
        }
    }

    escalacaoAtiva = limparDuplicidadesSetEscaladorDVC(escalacaoAtiva);
    planoSets.sets[setAtualSelecionado - 1] = escalacaoAtiva;
    atualizarEstadoPlanoEscaladorDVC();

    // Save planoSets update in sessionStorage
    salvarEscalacaoSession(currentEvento.id, planoSets);

    // Render layout updates
    window.renderEscaladorTaticoDVC(currentEvento, currentAtletas);
    perfLogEscaladorDVC("trocar atleta", inicioTrocaAtleta);
}

window.trocarTitularEscaladorDVC = trocarTitularEscaladorDVC;

// UI Rendering Functions
function renderizarAvisosHtml() {
    if (!escalacaoAtiva || !escalacaoAtiva.avisos || escalacaoAtiva.avisos.length === 0) return "";
    return `
        <div class="bg-amber-50 border border-amber-100 rounded-2xl p-3 flex items-start gap-2 shadow-sm animate-fade-in">
            <div class="shrink-0 mt-0.5">
                ${renderIconeLocalDVC("ICON/red.webp", "Aviso", "w-3.5 h-3.5")}
            </div>
            <div class="text-[9px] text-amber-800 font-bold uppercase space-y-1">
                ${escalacaoAtiva.avisos.map(aviso => `<p>${aviso}</p>`).join("")}
            </div>
        </div>
    `;
}

function renderizarQuadraHtml() {
    const esquema = escalacaoAtiva.esquemaQuadra || {};
    const zonasOrdem = [4, 3, 2, 5, 6, 1];
    
    // Find highest score inside starters for star highlight
    let melhorAtletaEmail = null;
    let melhorScore = -1;
    zonasOrdem.forEach(zone => {
        const atleta = esquema[String(zone)];
        if (atleta) {
            const role = obterRoleParaZona(zone, currentSistema);
            const score = calcularScoreEstrategiaPosicaoDVC(atleta, currentEstrategia, role);
            if (score > melhorScore) {
                melhorScore = score;
                melhorAtletaEmail = atleta.email;
            }
        }
    });

    const cellsHtml = zonasOrdem.map(zone => {
        const atleta = esquema[String(zone)];
        const role = obterRoleParaZona(zone, currentSistema);
        const roleLabel = getDisplayRoleName(role);
        
        let scoreStr = "-";
        let isMelhor = false;
        if (atleta) {
            const score = calcularScoreEstrategiaPosicaoDVC(atleta, currentEstrategia, role);
            scoreStr = score.toFixed(1);
            isMelhor = atleta.email === melhorAtletaEmail;
        }

        return `
            <div class="bg-white/10 backdrop-blur-sm border ${atleta ? 'border-white/30' : 'border-dashed border-white/20'} rounded-xl p-2.5 flex flex-col justify-between text-center min-h-[95px] relative">
                <span class="absolute top-1 left-2 text-[10px] font-black text-white/30">Z${zone}</span>
                
                ${isMelhor && atleta ? `
                    <div class="absolute top-1 right-2">
                        ${renderIconeLocalDVC("ICON/estrela.webp", "Estrela", "w-3.5 h-3.5")}
                    </div>
                ` : ""}
                
                <span class="text-[7.5px] uppercase tracking-wider font-extrabold text-indigo-200 block mt-1">${roleLabel}</span>
                
                <div class="my-auto">
                    <span class="text-[10px] font-black text-white truncate block max-w-full px-1">
                        ${atleta ? atleta.nome : "Vazio"}
                    </span>
                </div>
                
                <span class="text-[8px] font-bold text-white/70 block mt-1">
                    ${atleta ? `Score ${scoreStr}` : ""}
                </span>
            </div>
        `;
    }).join("");

    return `
        <div class="bg-gradient-to-br from-indigo-950 via-[#371616] to-[#990000] border-4 border-white rounded-3xl p-3 shadow-xl relative overflow-hidden flex flex-col gap-2">
            <!-- Line Net indicator -->
            <div class="w-full text-center py-1 bg-white/10 text-white text-[7.5px] font-black uppercase tracking-widest rounded border border-white/15">
                REDE (Net)
            </div>
            
            <div class="grid grid-cols-3 gap-2 relative">
                <!-- Inner Court Lines -->
                <div class="absolute inset-x-0 top-1/2 h-[1px] bg-white/20 pointer-events-none"></div>
                ${cellsHtml}
            </div>
        </div>
    `;
}

function renderizarLiberoHtml() {
    const liberoAtleta = escalacaoAtiva.libero;
    
    if (!liberoAtleta) {
        return `
            <div class="bg-white border border-gray-100 rounded-2xl p-3 text-center">
                <p class="text-[9px] font-bold text-gray-400 uppercase">Nenhum líbero identificado entre os convocados.</p>
            </div>
        `;
    }

    const score = calcularScoreEstrategiaPosicaoDVC(liberoAtleta, currentEstrategia, "libero");

    return `
        <div class="bg-white border border-indigo-100 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-sm">
            <div class="flex items-center gap-2 min-w-0">
                <div class="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                    ${renderIconeLocalDVC("ICON/certoverde.webp", "Líbero", "w-4 h-4")}
                </div>
                <div class="min-w-0">
                    <p class="text-xs font-black text-gray-900 truncate">${liberoAtleta.nome}</p>
                    <p class="text-[8px] font-bold text-indigo-600 uppercase mt-0.5">Líbero Especialista</p>
                </div>
            </div>
            <div class="text-right">
                <span class="bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full px-2 py-0.5 text-[8px] font-black uppercase">
                    Score ${score.toFixed(1)}
                </span>
            </div>
        </div>
    `;
}

function renderizarLiberosHtml() {
    escalacaoAtiva = normalizarSetEscaladorDVC(escalacaoAtiva);
    const liberosAtivos = escalacaoAtiva.liberos || [];

    if (liberosAtivos.length === 0) {
        return `
            <div class="bg-white border border-gray-100 rounded-2xl p-3 flex items-center gap-2">
                ${renderIconeLocalDVC("ICON/red.webp", "Aviso", "w-4 h-4")}
                <p class="text-[9px] font-bold text-gray-400 uppercase">Nenhum l&iacute;bero identificado entre os convocados.</p>
            </div>
        `;
    }

    return `
        <div class="space-y-2">
            ${liberosAtivos.slice(0, 2).map((liberoAtleta, idx) => {
                const score = calcularScoreEstrategiaPosicaoDVC(liberoAtleta, currentEstrategia, "libero");
                return `
                    <div class="bg-white border border-indigo-100 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-sm">
                        <div class="flex items-center gap-2 min-w-0">
                            <div class="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                                ${renderIconeLocalDVC("ICON/certoverde.webp", "L&iacute;bero", "w-4 h-4")}
                            </div>
                            <div class="min-w-0">
                                <p class="text-[8px] font-black text-indigo-600 uppercase mt-0.5">L&iacute;bero ${idx + 1}</p>
                                <p class="text-xs font-black text-gray-900 truncate">${liberoAtleta.nome}</p>
                            </div>
                        </div>
                        <div class="text-right">
                            <span class="bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full px-2 py-0.5 text-[8px] font-black uppercase">
                                Score ${score.toFixed(1)}
                            </span>
                        </div>
                    </div>
                `;
            }).join("")}
        </div>
    `;
}

function renderizarReservasHtml() {
    const reservas = escalacaoAtiva.reservas || [];
    const esquema = escalacaoAtiva.esquemaQuadra || {};
    
    if (reservas.length === 0) {
        return `
            <div class="bg-white border border-dashed rounded-2xl p-4 text-center">
                <p class="text-[9px] font-bold text-gray-400 uppercase">Sem atletas reservas disponíveis.</p>
            </div>
        `;
    }

    const cardsHtml = reservas.map(reserve => {
        const officialRole = normalizarFuncaoAtleta(reserve);
        const roleLabel = getDisplayRoleName(officialRole);
        const score = calcularScoreEstrategiaPosicaoDVC(reserve, currentEstrategia, officialRole);
        const reserveEhLibero = officialRole === "libero";
        const reserveEmailSeguro = getEmailAtletaEscaladorDVC(reserve).replace(/'/g, "\\'");
        const liberosAtivos = normalizarSetEscaladorDVC(escalacaoAtiva).liberos || [];
        const opcoesQuadra = reserveEhLibero ? "" : `
                        <option value="1">Zona 1 - ${esquema["1"] ? esquema["1"].nome : "Vazio"}</option>
                        <option value="2">Zona 2 - ${esquema["2"] ? esquema["2"].nome : "Vazio"}</option>
                        <option value="3">Zona 3 - ${esquema["3"] ? esquema["3"].nome : "Vazio"}</option>
                        <option value="4">Zona 4 - ${esquema["4"] ? esquema["4"].nome : "Vazio"}</option>
                        <option value="5">Zona 5 - ${esquema["5"] ? esquema["5"].nome : "Vazio"}</option>
                        <option value="6">Zona 6 - ${esquema["6"] ? esquema["6"].nome : "Vazio"}</option>
        `;
        const opcoesLiberos = reserveEhLibero ? `
                        <option value="libero1">L&iacute;bero 1 - ${liberosAtivos[0] ? liberosAtivos[0].nome : "Vazio"}</option>
                        <option value="libero2">L&iacute;bero 2 - ${liberosAtivos[1] ? liberosAtivos[1].nome : "Vazio"}</option>
        ` : "";

        return `
            <div class="bg-white border border-gray-100 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-sm animate-fade-in">
                <div class="min-w-0 flex-1">
                    <p class="text-xs font-black text-gray-900 truncate">${reserve.nome}</p>
                    <div class="flex items-center gap-1.5 mt-1">
                        <span class="bg-gray-50 text-gray-500 border border-gray-150 rounded px-1.5 py-0.5 text-[7.5px] font-black uppercase">
                            ${roleLabel}
                        </span>
                        <span class="text-[8px] font-bold text-gray-400 uppercase">
                            Score: ${score.toFixed(1)}
                        </span>
                    </div>
                </div>
                
                <div class="shrink-0 flex items-center gap-2">
                    ${renderIconeLocalDVC("ICON/dvclist.webp", "Reserva", "w-4 h-4 opacity-40")}
                    <select onchange="window.trocarTitularEscaladorDVC(this.value, '${reserveEmailSeguro}')" class="p-1.5 border border-gray-200 rounded-xl text-[9px] font-black bg-gray-50 outline-none w-24">
                        <option value="">Trocar...</option>
                        <option value="1">Zona 1 - ${esquema["1"] ? esquema["1"].nome : "Vazio"}</option>
                        <option value="2">Zona 2 - ${esquema["2"] ? esquema["2"].nome : "Vazio"}</option>
                        <option value="3">Zona 3 - ${esquema["3"] ? esquema["3"].nome : "Vazio"}</option>
                        <option value="4">Zona 4 - ${esquema["4"] ? esquema["4"].nome : "Vazio"}</option>
                        <option value="5">Zona 5 - ${esquema["5"] ? esquema["5"].nome : "Vazio"}</option>
                        <option value="6">Zona 6 - ${esquema["6"] ? esquema["6"].nome : "Vazio"}</option>
                        ${habilitarLibero ? `<option value="libero">Líbero - ${escalacaoAtiva.libero ? escalacaoAtiva.libero.nome : "Vazio"}</option>` : ""}
                    </select>
                </div>
            </div>
        `;
    }).join("");

    return `<div class="space-y-2">${cardsHtml}</div>`;
}

function renderizarReservasEscaladorCorrigidasHtml() {
    escalacaoAtiva = normalizarSetEscaladorDVC(escalacaoAtiva);
    const reservas = escalacaoAtiva.reservas || [];
    const esquema = escalacaoAtiva.esquemaQuadra || {};

    if (reservas.length === 0) {
        return `
            <div class="bg-white border border-dashed rounded-2xl p-4 text-center">
                <p class="text-[9px] font-bold text-gray-400 uppercase">Sem atletas reservas dispon&iacute;veis.</p>
            </div>
        `;
    }

    const cardsHtml = reservas.map(reserve => {
        const officialRole = normalizarFuncaoAtleta(reserve);
        const roleLabel = getDisplayRoleName(officialRole);
        const score = calcularScoreEstrategiaPosicaoDVC(reserve, currentEstrategia, officialRole);
        const reserveEhLibero = officialRole === "libero";
        const reserveEmailSeguro = getEmailAtletaEscaladorDVC(reserve).replace(/'/g, "\\'");
        const liberosAtivos = escalacaoAtiva.liberos || [];
        const opcoesQuadra = reserveEhLibero ? "" : `
                        <option value="1">Zona 1 - ${esquema["1"] ? esquema["1"].nome : "Vazio"}</option>
                        <option value="2">Zona 2 - ${esquema["2"] ? esquema["2"].nome : "Vazio"}</option>
                        <option value="3">Zona 3 - ${esquema["3"] ? esquema["3"].nome : "Vazio"}</option>
                        <option value="4">Zona 4 - ${esquema["4"] ? esquema["4"].nome : "Vazio"}</option>
                        <option value="5">Zona 5 - ${esquema["5"] ? esquema["5"].nome : "Vazio"}</option>
                        <option value="6">Zona 6 - ${esquema["6"] ? esquema["6"].nome : "Vazio"}</option>
        `;
        const opcoesLiberos = reserveEhLibero ? `
                        <option value="libero1">L&iacute;bero 1 - ${liberosAtivos[0] ? liberosAtivos[0].nome : "Vazio"}</option>
                        <option value="libero2">L&iacute;bero 2 - ${liberosAtivos[1] ? liberosAtivos[1].nome : "Vazio"}</option>
        ` : "";

        return `
            <div class="bg-white border border-gray-100 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-sm animate-fade-in">
                <div class="min-w-0 flex-1">
                    <p class="text-xs font-black text-gray-900 truncate">${reserve.nome}</p>
                    <div class="flex items-center gap-1.5 mt-1">
                        <span class="bg-gray-50 text-gray-500 border border-gray-150 rounded px-1.5 py-0.5 text-[7.5px] font-black uppercase">
                            ${roleLabel}
                        </span>
                        <span class="text-[8px] font-bold text-gray-400 uppercase">
                            Score: ${score.toFixed(1)}
                        </span>
                    </div>
                </div>

                <div class="shrink-0 flex items-center gap-2">
                    ${renderIconeLocalDVC("ICON/dvclist.webp", "Reserva", "w-4 h-4 opacity-40")}
                    <select onchange="window.trocarTitularEscaladorDVC(this.value, '${reserveEmailSeguro}')" class="p-1.5 border border-gray-200 rounded-xl text-[9px] font-black bg-gray-50 outline-none w-24">
                        <option value="">Trocar...</option>
                        ${opcoesQuadra}
                        ${opcoesLiberos}
                    </select>
                </div>
            </div>
        `;
    }).join("");

    return `<div class="space-y-2">${cardsHtml}</div>`;
}

function obterRoleParaZona(zone, sistema) {
    if (sistema === "5x1") {
        const roles = {
            1: "levantador",
            2: "ponteiro",
            3: "central",
            4: "oposto",
            5: "ponteiro",
            6: "central"
        };
        return roles[zone];
    }
    
    const roles4x2 = {
        1: "levantador",
        2: "ponteiro",
        3: "central",
        4: "levantador",
        5: "ponteiro",
        6: "central"
    };
    return roles4x2[zone];
}

// Controller trigger to open the modal
async function abrirEscaladorTaticoDVC(eventoId) {
    if (typeof window.usuarioEhEquipeTecnica === "function" && !window.usuarioEhEquipeTecnica()) {
        return alert("Acesso restrito à equipe técnica.");
    }

    const inicioAbrir = perfInicioEscaladorDVC();
    reiniciarEstadoEscaladorDVC(eventoId);

    try {
        let evento = null;
        if (typeof window.obterEventoCacheDVC === "function") {
            evento = await window.obterEventoCacheDVC(eventoId);
        }
        if (!evento) {
            const snap = await getDoc(doc(db, "events", eventoId));
            evento = snap.exists() ? { id: snap.id, ...snap.data() } : null;
        }

        if (!evento) {
            return alert("Não foi possível localizar este jogo agora.");
        }

        currentEvento = evento;

        const inicioConvocados = perfInicioEscaladorDVC();
        const [convocados, presencas] = await Promise.all([
            typeof window.carregarConvocadosEventoDVC === "function"
                ? window.carregarConvocadosEventoDVC(eventoId)
                : Promise.resolve([]),
            typeof window.carregarPresencasEventoDVC === "function"
                ? window.carregarPresencasEventoDVC(eventoId)
                : Promise.resolve([])
        ]);
        perfLogEscaladorDVC("carregar convocados/presencas", inicioConvocados);

        let listEmails = [];
        const presPresentes = presencas.filter(p => p.presente === true);
        if (presPresentes.length > 0) {
            listEmails = presPresentes.map(p => p.id || p.email);
        } else {
            listEmails = convocados.map(c => c.id || c.email);
        }

        const inicioAtletas = perfInicioEscaladorDVC();
        const promessasAtletasPorEmail = new Map();
        const carregarAtletaPorEmail = (email) => {
            const chave = String(email || "").trim().toLowerCase();
            if (!chave || typeof window.obterUsuarioCacheDVC !== "function") {
                return Promise.resolve(null);
            }
            if (!promessasAtletasPorEmail.has(chave)) {
                promessasAtletasPorEmail.set(chave, window.obterUsuarioCacheDVC(email));
            }
            return promessasAtletasPorEmail.get(chave);
        };
        currentAtletas = (await Promise.all(listEmails.map(carregarAtletaPorEmail))).filter(Boolean);
        aquecerCacheAtletasEscaladorDVC(currentAtletas);
        perfLogEscaladorDVC("carregar/normalizar atletas", inicioAtletas);

        const saved = obterEscalacaoSession(eventoId);
        if (saved) {
            if (saved.sets && Array.isArray(saved.sets)) {
                planoSets = {
                    ...saved,
                    sets: saved.sets.map(set => normalizarSetEscaladorDVC(set))
                };
                currentEstrategia = planoSets.estrategia;
                currentSistema = planoSets.sistema;
                currentQuantidadeSets = planoSets.quantidadeSets || 3;
                setAtualSelecionado = planoSets.setAtualSelecionado || 1;
                escalacaoAtiva = planoSets.sets[setAtualSelecionado - 1];
            } else {
                const singleEscalacao = saved.escalacao || saved;
                currentEstrategia = saved.estrategia || "forca_maxima";
                currentSistema = saved.sistema || "5x1";
                currentQuantidadeSets = 1;
                setAtualSelecionado = 1;
                
                planoSets = {
                    eventoId,
                    estrategia: currentEstrategia,
                    sistema: currentSistema,
                    quantidadeSets: 1,
                    setAtualSelecionado: 1,
                    sets: [
                        normalizarSetEscaladorDVC({
                            numero: 1,
                            titulares: singleEscalacao.titulares || [],
                            liberos: normalizarLiberosSetEscaladorDVC(singleEscalacao),
                            reservas: singleEscalacao.reservas || [],
                            esquemaQuadra: singleEscalacao.esquemaQuadra || {},
                            avisos: singleEscalacao.avisos || []
                        })
                    ]
                };
                escalacaoAtiva = planoSets.sets[0];
            }

            const availableEmails = new Set(currentAtletas.map(getEmailAtletaEscaladorDVC));
            let startersValid = true;
            
            planoSets.sets.forEach(set => {
                Object.values(set.esquemaQuadra).forEach(p => {
                    if (p && !availableEmails.has(getEmailAtletaEscaladorDVC(p))) startersValid = false;
                });
                (set.liberos || []).forEach(libero => {
                    if (libero && !availableEmails.has(getEmailAtletaEscaladorDVC(libero))) startersValid = false;
                });
            });

            if (!startersValid) {
                planoSets = gerarPlanoSetsEscaladorDVC(currentAtletas, currentEstrategia, currentSistema, currentQuantidadeSets);
                setAtualSelecionado = 1;
                escalacaoAtiva = planoSets.sets[0];
            }
        } else {
            currentEstrategia = "forca_maxima";
            currentSistema = "5x1";
            currentQuantidadeSets = 3;
            setAtualSelecionado = 1;
            planoSets = gerarPlanoSetsEscaladorDVC(currentAtletas, currentEstrategia, currentSistema, currentQuantidadeSets);
            escalacaoAtiva = planoSets.sets[0];
        }

        atualizarEstadoPlanoEscaladorDVC();
        window.renderEscaladorTaticoDVC(currentEvento, currentAtletas);
        perfLogEscaladorDVC("abrir modal", inicioAbrir);

    } catch (e) {
        console.error("Erro ao abrir Escalador Tático:", e);
        alert("Não foi possível carregar a escalação agora.");
    }
}

// Render the actual modal
function renderEscaladorTaticoDVC(evento, atletasConvocados) {
    const inicioRender = perfInicioEscaladorDVC();
    document.getElementById("modal-escalador-tatico")?.remove();

    if (escalacaoAtiva) {
        escalacaoAtiva = normalizarSetEscaladorDVC(escalacaoAtiva);
        if (planoSets?.sets?.[setAtualSelecionado - 1]) {
            planoSets.sets[setAtualSelecionado - 1] = escalacaoAtiva;
        }
    }

    const totalAthletes = currentAtletas.filter(at => {
        if (!at) return false;
        if (typeof window.usuarioEhAtletaAtivo === "function") {
            return window.usuarioEhAtletaAtivo(at);
        }
        const func = String(at.funcao || "").trim().toLowerCase();
        return func !== "adm" && func !== "treinador";
    }).length;

    const btnLabel = currentQuantidadeSets > 1 ? "Gerar plano de sets" : "Gerar escalação";

    const modal = `
        <div id="modal-escalador-tatico" class="fixed inset-0 z-[100] bg-black/85 flex items-center justify-center p-4">
            <div class="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-fade-in border border-gray-100">
                
                <!-- Header -->
                <div class="bg-gradient-to-r from-gray-950 via-[#4b0d0d] to-[#990000] text-white p-4 flex items-center justify-between gap-3 shrink-0">
                    <div class="flex items-center gap-2">
                        ${renderIconeLocalDVC("ICON/alvo.webp", "Escalador", "w-5 h-5")}
                        <div>
                            <h3 class="text-xs font-black uppercase tracking-tight">Escalador Tático</h3>
                            <p class="text-[7.5px] font-bold text-white/70 uppercase">Sugestão de Plano de Sets</p>
                        </div>
                    </div>
                    <button onclick="window.fecharEscaladorTaticoDVC()" class="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/80 hover:text-white">
                        <i class="fa-solid fa-xmark text-xs"></i>
                    </button>
                </div>
                
                <!-- Scrollable Content -->
                <div class="p-4 overflow-y-auto space-y-4 flex-1 custom-scroll bg-gray-50">
                    <p class="text-[9px] text-gray-500 font-bold uppercase leading-relaxed">
                        Planeje as escalações sugeridas por set com foco no equilíbrio do time.
                    </p>
                    
                    <!-- Filters Grid -->
                    <div class="grid grid-cols-3 gap-2 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
                        <div>
                            <label class="text-[7px] font-black text-gray-400 uppercase block mb-1">Estratégia</label>
                            <select onchange="window.alterarEstrategiaEscaladorDVC(this.value)" class="w-full p-2 border border-gray-200 rounded-xl text-[9px] font-black bg-gray-50 outline-none cursor-pointer">
                                <option value="forca_maxima" ${currentEstrategia === "forca_maxima" ? "selected" : ""}>Força Máxima</option>
                                <option value="distribuida" ${currentEstrategia === "distribuida" ? "selected" : ""}>Rodízio de Elenco</option>
                                <option value="ofensiva" ${currentEstrategia === "ofensiva" ? "selected" : ""}>Ofensiva</option>
                                <option value="defensiva" ${currentEstrategia === "defensiva" ? "selected" : ""}>Defensiva</option>
                            </select>
                        </div>
                        <div>
                            <label class="text-[7px] font-black text-gray-400 uppercase block mb-1">Sistema</label>
                            <select onchange="window.alterarSistemaEscaladorDVC(this.value)" class="w-full p-2 border border-gray-200 rounded-xl text-[9px] font-black bg-gray-50 outline-none cursor-pointer">
                                <option value="5x1" ${currentSistema === "5x1" ? "selected" : ""}>5x1</option>
                                <option value="4x2_simples" ${currentSistema === "4x2_simples" ? "selected" : ""}>4x2 Simples</option>
                                <option value="4x2_infiltracao" ${currentSistema === "4x2_infiltracao" ? "selected" : ""}>4x2 Infiltração</option>
                            </select>
                        </div>
                        <div>
                            <label class="text-[7px] font-black text-gray-400 uppercase block mb-1">Sets Planejados</label>
                            <select onchange="window.alterarQuantidadeSetsEscaladorDVC(this.value)" class="w-full p-2 border border-gray-200 rounded-xl text-[9px] font-black bg-gray-50 outline-none cursor-pointer">
                                <option value="1" ${currentQuantidadeSets === 1 ? "selected" : ""}>1 set</option>
                                <option value="2" ${currentQuantidadeSets === 2 ? "selected" : ""}>2 sets</option>
                                <option value="3" ${currentQuantidadeSets === 3 ? "selected" : ""}>3 sets</option>
                                <option value="4" ${currentQuantidadeSets === 4 ? "selected" : ""}>4 sets</option>
                                <option value="5" ${currentQuantidadeSets === 5 ? "selected" : ""}>5 sets</option>
                            </select>
                        </div>
                    </div>
                    
                    <!-- Main Action Button -->
                    <button onclick="window.regerarSugestaoDVC()" class="w-full bg-[#990000] text-white py-3 rounded-2xl text-[9px] font-black uppercase shadow-md flex items-center justify-center gap-1.5 hover:bg-[#780808] transition active:scale-[0.99]">
                        ${renderIconeLocalDVC("ICON/dvcev.webp", "Gerar", "w-4 h-4")}
                        ${btnLabel}
                    </button>
                    
                    ${totalAthletes < 6 ? `
                        <!-- Insufficient players card -->
                        <div class="bg-red-50 border border-red-200 rounded-3xl p-5 text-center flex flex-col items-center gap-2">
                            ${renderIconeLocalDVC("ICON/certovernelho.webp", "Erro", "w-8 h-8")}
                            <p class="text-xs font-black uppercase text-red-900 leading-tight">Sugestão Indisponível</p>
                            <p class="text-[9.5px] font-semibold text-red-700">É preciso ter pelo menos 6 atletas convocados ou confirmados para gerar o plano de sets.</p>
                        </div>
                    ` : `
                        <!-- Set selection buttons -->
                        <div class="flex items-center gap-1.5 overflow-x-auto pb-1">
                            ${Array.from({ length: currentQuantidadeSets }).map((_, idx) => {
                                const num = idx + 1;
                                const active = num === setAtualSelecionado;
                                return `
                                    <button onclick="window.selecionarSetEscaladorDVC(${num})" class="px-3.5 py-1.5 rounded-full text-[9px] font-black uppercase border transition shrink-0 ${
                                        active 
                                            ? 'bg-[#990000] text-white border-[#990000] shadow-sm' 
                                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                    }">
                                        Set ${num}
                                    </button>
                                `;
                            }).join("")}
                        </div>

                        <!-- Set Info Detail -->
                        <div class="bg-white border border-gray-150 rounded-2xl p-3 flex flex-col gap-1 shadow-sm text-[8px] font-bold text-gray-400 uppercase">
                            <div class="flex justify-between">
                                <span>Set ${setAtualSelecionado} de ${currentQuantidadeSets}</span>
                                <span>Estratégia: ${getDisplayEstrategiaName(currentEstrategia)}</span>
                            </div>
                            <div>Sistema: ${currentSistema.replace("_", " ")}</div>
                            
                            ${currentEstrategia === "distribuida" ? `
                                <div class="bg-green-50 border border-green-100 rounded-xl p-2 text-center mt-1.5">
                                    <p class="text-[8px] font-black text-green-700 uppercase flex items-center justify-center gap-1">
                                        ${renderIconeLocalDVC("ICON/certoverde.webp", "Info", "w-3 h-3")}
                                        O app está distribuindo oportunidades entre os sets, mantendo equilíbrio técnico.
                                    </p>
                                </div>
                            ` : ""}
                        </div>

                        <!-- Warnings -->
                        ${renderizarAvisosHtml()}
                        
                        <!-- Court Diagram -->
                        <section class="space-y-2">
                            <div class="flex items-center gap-1">
                                ${renderIconeLocalDVC("ICON/alvo.webp", "Quadra", "w-3.5 h-3.5")}
                                <h4 class="text-[9.5px] font-black text-gray-700 uppercase">Organização em Quadra</h4>
                            </div>
                            ${renderizarQuadraHtml()}
                        </section>
                        
                        <!-- Libero Section -->
                        <section class="space-y-2">
                            <div class="flex items-center gap-1">
                                ${renderIconeLocalDVC("ICON/certoverde.webp", "Libero", "w-3.5 h-3.5")}
                                <h4 class="text-[9.5px] font-black text-gray-700 uppercase">L&iacute;beros</h4>
                            </div>
                            ${renderizarLiberosHtml()}
                        </section>
                        
                        <!-- Reserves Bench -->
                        <section class="space-y-2">
                            <div class="flex items-center gap-1">
                                ${renderIconeLocalDVC("ICON/dvclist.webp", "Banco", "w-3.5 h-3.5")}
                                <h4 class="text-[9.5px] font-black text-gray-700 uppercase">Banco de Reservas</h4>
                            </div>
                            ${renderizarReservasEscaladorCorrigidasHtml()}
                        </section>
                    `}
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modal);
    perfLogEscaladorDVC("renderizar modal/quadra", inicioRender);
}

// Global Exports
window.abrirEscaladorTaticoDVC = abrirEscaladorTaticoDVC;
window.gerarSugestaoEscalacaoDVC = gerarSugestaoEscalacaoDVC;
window.renderEscaladorTaticoDVC = renderEscaladorTaticoDVC;
window.alterarQuantidadeSetsEscaladorDVC = alterarQuantidadeSetsEscaladorDVC;
window.selecionarSetEscaladorDVC = selecionarSetEscaladorDVC;
window.trocarTitularEscaladorDVC = trocarTitularEscaladorDVC;
window.calcularScoreEstrategiaDVC = calcularScoreEstrategiaDVC;
window.gerarPlanoSetsEscaladorDVC = gerarPlanoSetsEscaladorDVC;
