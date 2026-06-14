/**
 * ============================================================================
 * MÃ³dulo: FINANCE
 * ============================================================================
 * Responsabilidade: Gerencia funcionalidades relacionadas a finance.
 * Este arquivo faz parte do sistema modular do DVC App.
 * Todos os cÃ³digos principais aqui agrupados seguem as diretrizes do projeto.
 * ============================================================================
 */

// js/finance.js
// Stage 6: Financeiro Extraction

import { 
    db, 
    auth, 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc, 
    deleteDoc, 
    collection, 
    getDocs, 
    arrayUnion
} from "./firebase.js";

// Global constant and state getters/setters via window
const get_currentUserData = () => window.currentUserData;
const get_DIA_INICIO_CARENCIA_CADASTRO_FIM_MES = () => window.DIA_INICIO_CARENCIA_CADASTRO_FIM_MES;
const get_DIA_LIMITE_FINANCEIRO_MENSAL = () => window.DIA_LIMITE_FINANCEIRO_MENSAL;
const get_STATUS_FINANCEIRO_CARENCIA = () => window.STATUS_FINANCEIRO_CARENCIA;
const get_AppCache = () => window.AppCache;

const CHAVE_PIX_DVC = "drummondvoleibol@gmail.com";
const VALOR_SUGERIDO_CONTRIBUICAO_DVC = "R$ 10,00";
const logoContribuicaoDVC = "assets/img/loki2.webp";

// Inner helper functions for renderFinanceiro
function valorMesAno(textoMesAno) {
    const mapaMeses = {
        "Janeiro": 0,
        "Fevereiro": 1,
        "MarÃ§o": 2,
        "Abril": 3,
        "Maio": 4,
        "Junho": 5,
        "Julho": 6,
        "Agosto": 7,
        "Setembro": 8,
        "Outubro": 9,
        "Novembro": 10,
        "Dezembro": 11
    };
    const [nomeMes, ano] = textoMesAno.split("/");
    return Number(ano) * 100 + mapaMeses[nomeMes];
}

function valorMesAnoSeguroFinanceiroDVC(textoMesAno) {
    const valor = valorMesAno(textoMesAno);
    return Number.isFinite(valor) ? valor : -1;
}

function obterMesInicialContribuicao() {
    const criadoEm = get_currentUserData()?.criadoEm;

    // UsuÃ¡rios antigos sem data de cadastro continuam vendo desde Abril/2026
    if (!criadoEm) {
        return valorMesAno("Abril/2026");
    }

    const dataCadastro = new Date(criadoEm);

    if (isNaN(dataCadastro.getTime())) {
        return valorMesAno("Abril/2026");
    }

    let mesCadastro = dataCadastro.getMonth();
    let anoCadastro = dataCadastro.getFullYear();

    // Se cadastrou nos Ãºltimos dias do mÃªs, comeÃ§a no mÃªs seguinte
    if (dataCadastro.getDate() >= get_DIA_INICIO_CARENCIA_CADASTRO_FIM_MES()) {
        mesCadastro++;

        if (mesCadastro > 11) {
            mesCadastro = 0;
            anoCadastro++;
        }
    }

    return anoCadastro * 100 + mesCadastro;
}

function corrigirTextoFinanceiroDVC(valor = "") {
    if (typeof window.corrigirMojibakeDVC === "function") {
        return window.corrigirMojibakeDVC(valor);
    }

    return String(valor || "");
}

function escaparHtmlFinanceiroDVC(valor = "") {
    if (typeof window.escaparHtml === "function") {
        return window.escaparHtml(valor);
    }

    return corrigirTextoFinanceiroDVC(valor)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function normalizarStatusFinanceiroDVC(valor = "") {
    return corrigirTextoFinanceiroDVC(valor)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
}

function obterCompetenciaAtualFinanceiroDVC(mesesPermitidos = []) {
    if (mesesPermitidos.length > 0) {
        return mesesPermitidos[mesesPermitidos.length - 1];
    }

    if (typeof window.obterMesAtualTextoFinanceiro === "function") {
        return window.obterMesAtualTextoFinanceiro();
    }

    const hoje = new Date();
    const meses = [
        "Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    return `${meses[hoje.getMonth()]}/${hoje.getFullYear()}`;
}

function montarOptionsMesesFinanceiroDVC(mesesPermitidos = [], competenciaAtual = "") {
    if (mesesPermitidos.length === 0) {
        return `<option value="">Nenhum mes disponivel ainda</option>`;
    }

    return mesesPermitidos.map(mes => {
        const mesSeguro = escaparHtmlFinanceiroDVC(mes);
        const selecionado = mes === competenciaAtual ? " selected" : "";
        return `<option value="${mesSeguro}"${selecionado}>${mesSeguro}</option>`;
    }).join("");
}

function obterTipoEnvioFinanceiroDVC(tipo = "") {
    const tipoNormalizado = normalizarStatusFinanceiroDVC(tipo);

    if (tipoNormalizado === "justificativa") return "Justificativa";
    if (tipoNormalizado === "carenciaespecial") return "Car&ecirc;ncia especial";
    if (tipoNormalizado.includes("ajustemanual")) return "Ajuste manual";

    return "Comprovante";
}

function obterStatusVisualFinanceiroDVC(item = {}) {
    const statusNormalizado = normalizarStatusFinanceiroDVC(item.status || "");
    const resultadoNormalizado = normalizarStatusFinanceiroDVC(item.resultadoFinanceiro || "");

    if (statusNormalizado.includes("validado") || resultadoNormalizado.includes("pago")) {
        return {
            chave: "validado",
            texto: "Validado",
            peso: 50,
            classe: "bg-green-50 dark:bg-green-955/20 text-green-700 dark:text-green-405 border border-green-200 dark:border-green-900/40 text-[9px] font-bold px-2.5 py-1 rounded-full"
        };
    }

    if (statusNormalizado.includes("justificado") || resultadoNormalizado.includes("justificado") || statusNormalizado.includes("carencia aceita")) {
        return {
            chave: "justificado",
            texto: "Justificado",
            peso: 40,
            classe: "bg-blue-50 dark:bg-blue-955/20 text-blue-700 dark:text-blue-405 border border-blue-200 dark:border-blue-900/40 text-[9px] font-bold px-2.5 py-1 rounded-full"
        };
    }

    if (statusNormalizado.includes("analise")) {
        return {
            chave: "analise",
            texto: "Em an&aacute;lise",
            peso: 30,
            classe: "bg-yellow-50 dark:bg-yellow-955/20 text-yellow-700 dark:text-yellow-405 border border-yellow-200 dark:border-yellow-900/40 text-[9px] font-bold px-2.5 py-1 rounded-full"
        };
    }

    if (statusNormalizado.includes("recus") || resultadoNormalizado.includes("recus")) {
        return {
            chave: "recusado",
            texto: "Recusado",
            peso: 10,
            classe: "bg-red-50 dark:bg-red-955/20 text-red-700 dark:text-red-405 border border-red-200 dark:border-red-900/40 text-[9px] font-bold px-2.5 py-1 rounded-full"
        };
    }

    if (statusNormalizado.includes("pendente")) {
        return {
            chave: "pendente",
            texto: "Pendente",
            peso: 20,
            classe: "bg-red-50 dark:bg-red-955/20 text-red-700 dark:text-red-405 border border-red-200 dark:border-red-900/40 text-[9px] font-bold px-2.5 py-1 rounded-full"
        };
    }

    return {
        chave: "sem_registro",
        texto: "Sem registro",
        peso: 0,
        classe: "bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 text-[9px] font-bold px-2.5 py-1 rounded-full"
    };
}

function obterSituacaoMesFinanceiroDVC(envios = [], competenciaAtual = "") {
    const enviosDoMes = envios.filter(item => item.mes === competenciaAtual);

    if (enviosDoMes.length === 0) {
        return obterStatusVisualFinanceiroDVC({});
    }

    return enviosDoMes
        .map(obterStatusVisualFinanceiroDVC)
        .sort((a, b) => b.peso - a.peso)[0];
}

function obterAcaoRecomendadaFinanceiroDVC(statusTexto = "") {
    const statusNormalizado = normalizarStatusFinanceiroDVC(statusTexto);

    if (statusNormalizado.includes("validado")) {
        return "Contribui&ccedil;&atilde;o validada para este m&ecirc;s.";
    }

    if (statusNormalizado.includes("justificado")) {
        return "Justificativa registrada para este m&ecirc;s.";
    }

    if (statusNormalizado.includes("analise")) {
        return "Seu envio est&aacute; aguardando an&aacute;lise da equipe.";
    }

    if (statusNormalizado.includes("recus")) {
        return "Confira o envio e regularize a compet&ecirc;ncia deste m&ecirc;s.";
    }

    return "Copie a chave PIX e envie o comprovante deste m&ecirc;s.";
}

function obterClasseBadgeHeroFinanceiroDVC(chave = "") {
    if (chave === "validado") return "border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-955/20 text-green-700 dark:text-green-400 font-bold px-2.5 py-1 text-[9px] rounded-full border";
    if (chave === "justificado") return "border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-955/20 text-blue-700 dark:text-blue-400 font-bold px-2.5 py-1 text-[9px] rounded-full border";
    if (chave === "analise") return "border-yellow-200 dark:border-yellow-900/50 bg-yellow-50 dark:bg-yellow-955/20 text-yellow-700 dark:text-yellow-405 font-bold px-2.5 py-1 text-[9px] rounded-full border";
    if (chave === "pendente" || chave === "recusado") return "border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-955/20 text-red-700 dark:text-red-405 font-bold px-2.5 py-1 text-[9px] rounded-full border";

    return "border-white/20 bg-white/10 text-white font-bold px-2.5 py-1 text-[9px] rounded-full border";
}

function montarCabecalhoCardClaroFinanceiroDVC(chamada = "", titulo = "") {
    return `
        <div>
            <p class="text-[9px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">
                ${chamada}
            </p>

            <h2 class="mt-1 text-sm font-black uppercase text-gray-955 dark:text-gray-100">
                ${titulo}
            </h2>
        </div>
    `;
}

function montarHeroContribuicaoFinanceiroDVC(envios = [], competenciaAtual = "", opcoes = {}) {
    const situacao = opcoes.situacao || obterSituacaoMesFinanceiroDVC(envios, competenciaAtual);
    const competenciaBase = opcoes.competencia || competenciaAtual || "Sem competencia";
    const competencia = escaparHtmlFinanceiroDVC(corrigirTextoFinanceiroDVC(competenciaBase)).toUpperCase();
    const acaoRecomendada = opcoes.acaoRecomendada || obterAcaoRecomendadaFinanceiroDVC(situacao.chave);
    const valorSugerido = escaparHtmlFinanceiroDVC(opcoes.valorSugerido || VALOR_SUGERIDO_CONTRIBUICAO_DVC);
    const labelValor = opcoes.labelValor || "CONTRIBUI&Ccedil;&Atilde;O SUGERIDA";
    const badgeClasse = obterClasseBadgeHeroFinanceiroDVC(situacao.chave);

    return `
        <section id="finance-hero-contribuicao" class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-950 via-[#4b0d0d] to-[#990000] p-6 text-white shadow-xl">
            <img
                src="${logoContribuicaoDVC}"
                alt=""
                aria-hidden="true"
                class="pointer-events-none absolute -bottom-10 -right-8 h-40 w-40 object-contain opacity-10"
                onerror="this.style.display='none'"
            >

            <div class="relative z-10 flex items-start justify-between gap-3">
                <div class="flex min-w-0 items-start gap-3">
                    <div class="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/20 bg-white/10 p-2">
                        <img
                            src="${logoContribuicaoDVC}"
                            alt=""
                            class="h-full w-full object-contain"
                            loading="lazy"
                            onerror="this.style.display='none'"
                        >
                    </div>

                    <div class="min-w-0 text-left">
                        <p class="text-[9px] font-black uppercase tracking-wider text-white/60">
                            CORRESPONSABILIDADE
                        </p>

                        <h1 class="mt-1 text-xl font-black uppercase tracking-tight text-white leading-none">
                            CONTRIBUI&Ccedil;&Atilde;O DVC
                        </h1>

                        <p class="mt-2 max-w-[300px] text-[11px] font-semibold leading-relaxed text-white/75">
                            Sua contribui&ccedil;&atilde;o ajuda a manter treinos, organiza&ccedil;&atilde;o e oportunidades.
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onclick="forcarAtualizacaoDados('financeiro')"
                    class="relative z-10 shrink-0 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-[9px] font-black uppercase text-white backdrop-blur-sm transition active:scale-[0.98]"
                >
                    ATUALIZAR
                </button>
            </div>

            <div class="relative z-10 mt-4 flex items-start justify-between gap-3 rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur-sm">
                <div class="min-w-0 text-left">
                    <p class="text-[9px] font-black uppercase tracking-wider text-white/60">
                        SITUA&Ccedil;&Atilde;O DO M&Ecirc;S
                    </p>

                    <p class="mt-1 text-[11px] font-semibold leading-relaxed text-white/80">
                        ${acaoRecomendada}
                    </p>
                </div>

                <span class="${badgeClasse} shrink-0 uppercase">
                    ${situacao.texto}
                </span>
            </div>

            <div class="relative z-10 mt-3 grid grid-cols-2 gap-3">
                <div class="rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur-sm text-left">
                    <p class="text-[9px] font-black uppercase tracking-wider text-white/60">
                        COMPET&Ecirc;NCIA
                    </p>

                    <p class="mt-1 text-base font-black uppercase text-white">
                        ${competencia}
                    </p>
                </div>

                <div class="rounded-2xl border border-white/10 bg-white/10 p-3 text-right backdrop-blur-sm">
                    <p class="text-[9px] font-black uppercase tracking-wider text-white/60">
                        ${labelValor}
                    </p>

                    <p class="mt-1 text-base font-black text-white">
                        ${valorSugerido}
                    </p>
                </div>
            </div>

            <details
                class="relative z-10 mt-4"
                data-dvc-label-fechado="ENTENDA COMO FUNCIONA"
                data-dvc-label-aberto="FECHAR INFORMA&Ccedil;&Otilde;ES"
            >
                <summary class="list-none cursor-pointer flex justify-center">
                    <span class="bg-white/10 hover:bg-white/20 text-white rounded-full text-[10px] py-1.5 px-4 font-bold transition active:scale-[0.98] inline-block">
                        <span data-dvc-details-label>ENTENDA COMO FUNCIONA</span>
                    </span>
                </summary>

                <div class="mt-4 space-y-3 border-t border-white/10 pt-4">
                    <p class="text-[10px] font-semibold leading-relaxed text-white/75 text-left">
                        A contribui&ccedil;&atilde;o &eacute; uma forma de corresponsabilidade para manter o DVC organizado, acess&iacute;vel e constante.
                    </p>

                    <div class="rounded-xl border border-white/10 bg-white/10 p-3 text-left">
                        <p class="text-[9px] font-black uppercase text-white">
                            AVISO IMPORTANTE
                        </p>

                        <p class="mt-1 text-[10px] font-semibold leading-relaxed text-white/75">
                            Quando n&atilde;o for poss&iacute;vel contribuir, a justificativa deve ser enviada para an&aacute;lise da equipe respons&aacute;vel.
                        </p>
                    </div>

                    <div class="grid grid-cols-3 gap-2">
                        <div class="rounded-xl border border-white/10 bg-white/10 px-3 py-4 text-center">
                            <span class="text-[9px] font-black uppercase text-white">TREINOS</span>
                        </div>

                        <div class="rounded-xl border border-white/10 bg-white/10 px-3 py-4 text-center">
                            <span class="text-[9px] font-black uppercase text-white">PROJETO</span>
                        </div>

                        <div class="rounded-xl border border-white/10 bg-white/10 px-3 py-4 text-center">
                            <span class="text-[9px] font-black uppercase text-white">APOIO</span>
                        </div>
                    </div>
                </div>
            </details>
        </section>
    `;
}

function montarCardSituacaoMesFinanceiroDVC(envios = [], competenciaAtual = "") {
    return montarHeroContribuicaoFinanceiroDVC(envios, competenciaAtual);
}

function montarEnviosAgrupadosFinanceiroDVC(envios = []) {
    if (envios.length === 0) {
        return `
            <div class="rounded-xl border border-dashed border-gray-300 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 p-4 text-center">
                <p class="text-[10px] font-bold uppercase text-gray-400 dark:text-gray-500">
                    Nenhum envio registrado ainda.
                </p>
            </div>
        `;
    }

    const grupos = envios.reduce((acc, item) => {
        const chave = item.mes || "Sem mes";
        if (!acc[chave]) acc[chave] = [];
        acc[chave].push(item);
        return acc;
    }, {});

    return Object.entries(grupos)
        .sort(([mesA], [mesB]) => valorMesAnoSeguroFinanceiroDVC(mesB) - valorMesAnoSeguroFinanceiroDVC(mesA))
        .map(([mes, itens], index) => {
            const mesSeguro = escaparHtmlFinanceiroDVC(corrigirTextoFinanceiroDVC(mes)).toUpperCase();
            const totalTextoBadge = itens.length === 1 ? "1 envio" : `${itens.length} envios`;
            const linhas = itens
                .sort((a, b) => new Date(b.enviadoEm || 0) - new Date(a.enviadoEm || 0))
                .map(item => {
                    const status = obterStatusVisualFinanceiroDVC(item);
                    const tipo = obterTipoEnvioFinanceiroDVC(item.tipo);
                    const dataEnvio = item.enviadoEm
                        ? window.formatarDataHoraFinanceira(item.enviadoEm)
                        : "Sem data";

                    return `
                        <div class="flex items-center justify-between gap-3 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-2.5 text-gray-900 dark:text-gray-100">
                            <div class="min-w-0 text-left">
                                <p class="text-[10px] font-black uppercase text-gray-800 dark:text-gray-200 leading-none">
                                    ${tipo}
                                </p>

                                <p class="mt-1 text-[8px] font-bold uppercase text-gray-400 dark:text-gray-550 leading-none">
                                    ${escaparHtmlFinanceiroDVC(dataEnvio)}
                                </p>
                            </div>

                            <span class="${status.classe} shrink-0">
                                ${status.texto}
                            </span>
                        </div>
                    `;
                }).join("");

            return `
                <details class="group overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
                    <summary class="relative flex cursor-pointer items-center justify-between gap-3 text-[10px] font-black uppercase text-gray-800 dark:text-gray-200" style="padding: 16px 16px 12px 16px;">
                        <div class="absolute top-0 left-0 right-0 h-[4px] z-10 bg-gradient-to-r from-gray-950 via-[#4b0d0d] to-[#990000]" style="height: 4px;"></div>
                        <span>${mesSeguro}</span>
                        <span class="shrink-0 rounded-full bg-white dark:bg-gray-900 px-2.5 py-1 text-[9px] font-black uppercase text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-800">
                            ${totalTextoBadge}
                        </span>
                    </summary>

                    <div class="border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                        <div class="h-1 w-12 bg-red-700"></div>
                        ${linhas}
                    </div>
                </details>
            `;
        }).join("");
}

function montarAvisoCarenciaCadastroFinanceiroDVC(dadosCarenciaCadastro = {}) {
    if (!dadosCarenciaCadastro.ativa) return "";
    return `
        <div class="rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-955/20 p-4">
            <p class="text-[9px] font-black uppercase text-amber-700 dark:text-amber-400">
                Car&ecirc;ncia de cadastro ativa
            </p>

            <p class="mt-2 text-[10px] font-semibold leading-relaxed text-amber-900 dark:text-amber-300">
                Como seu cadastro foi feito no fim do m&ecirc;s, voc&ecirc; pode participar normalmente at&eacute; ${escaparHtmlFinanceiroDVC(dadosCarenciaCadastro.label)}. O envio da contribui&ccedil;&atilde;o abre no pr&oacute;ximo m&ecirc;s e segue o prazo mensal.
            </p>
        </div>
    `;
}

function montarCardContribuicaoMesFinanceiroDVC(optionsHtml = "", avisoCarenciaCadastroHtml = "") {
    return `
        <div class="relative overflow-hidden rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 pb-5 pt-7 shadow-sm text-gray-900 dark:text-gray-100" style="padding: 28px 20px 20px 20px;">
            <div class="absolute top-0 left-0 right-0 h-[4px] z-10 bg-gradient-to-r from-gray-950 via-[#4b0d0d] to-[#990000]" style="height: 4px;"></div>
            ${montarCabecalhoCardClaroFinanceiroDVC("PAGAMENTO E COMPROVA&Ccedil;&Atilde;O", "CONTRIBUI&Ccedil;&Atilde;O DO M&Ecirc;S")}

            ${avisoCarenciaCadastroHtml ? `<div class="mt-4">${avisoCarenciaCadastroHtml}</div>` : ""}

            <div class="mt-4 space-y-5">
                <section>
                    <div class="relative overflow-hidden bg-white dark:bg-gray-900 rounded-2xl px-5 pb-5 pt-7 border border-gray-100 dark:border-gray-850 shadow-sm text-left space-y-4" style="padding: 28px 20px 20px 20px;">
                        <div class="absolute top-0 left-0 right-0 h-[4px] z-10 bg-gradient-to-r from-gray-950 via-[#4b0d0d] to-[#990000]" style="height: 4px;"></div>
                        <div class="flex justify-between items-start">
                            <div>
                                <p class="text-[9px] font-black uppercase tracking-wider text-[#990000] dark:text-gray-100">
                                    ETAPA 01
                                </p>

                                <h3 class="mt-1 text-[13px] font-black text-gray-955 dark:text-gray-100">
                                    Copiar chave PIX
                                </h3>
                            </div>
                            <div class="text-right">
                                <p class="text-[9px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-100">
                                    VALOR SUGERIDO
                                </p>
                                <p class="text-base font-black text-gray-955 dark:text-gray-100 mt-0.5">
                                    ${VALOR_SUGERIDO_CONTRIBUICAO_DVC}
                                </p>
                            </div>
                        </div>

                        <div class="space-y-3">
                            <div>
                                <p class="text-[9px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-100 mb-1.5">
                                    CHAVE PIX &mdash; E-MAIL
                                </p>

                                <span class="bg-gray-50 dark:bg-gray-950 text-gray-700 dark:text-gray-100 font-mono text-center p-4 rounded-xl border border-gray-200 dark:border-gray-800 block break-all text-[11px] font-bold">
                                    ${CHAVE_PIX_DVC}
                                </span>
                            </div>

                            <button
                                type="button"
                                onclick="copiarChavePixDVC()"
                                class="w-full bg-[#990000] hover:bg-red-800 text-white font-black uppercase text-[10px] py-3 rounded-2xl shadow-md transition-all active:scale-95 shadow-glow-vinho-light dark:shadow-glow-vinho-dark animate-pulse-slow"
                            >
                                COPIAR CHAVE
                            </button>
                        </div>
                    </div>
                </section>

                <section>
                    <div class="relative overflow-hidden bg-white dark:bg-gray-900 rounded-2xl px-5 pb-5 pt-7 border border-gray-100 dark:border-gray-850 shadow-sm text-left space-y-4" style="padding: 28px 20px 20px 20px;">
                        <div class="absolute top-0 left-0 right-0 h-[4px] z-10 bg-gradient-to-r from-gray-950 via-[#4b0d0d] to-[#990000]" style="height: 4px;"></div>
                        <div>
                            <p class="text-[9px] font-black uppercase tracking-wider text-[#990000] dark:text-gray-100">
                                ETAPA 02
                            </p>

                            <h3 class="mt-1 text-[13px] font-black text-gray-955 dark:text-gray-100">
                                Enviar comprovante
                            </h3>

                            <p class="mt-1 text-[11px] font-medium leading-relaxed text-gray-500 dark:text-gray-100">
                                Selecione a compet&ecirc;ncia e envie uma imagem do comprovante.
                            </p>
                        </div>

                        <select id="f-mes" class="h-12 w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-4 text-[12px] font-bold text-gray-900 dark:text-gray-100 outline-none ring-1 ring-red-100/30 transition focus:border-[#990000] dark:focus:border-red-650">
                            ${optionsHtml}
                        </select>

                        <div class="space-y-3">
                            <label for="f-file" class="bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-850/50 transition-all block">
                                <i class="fa-solid fa-cloud-arrow-up text-gray-400 dark:text-gray-100 text-2xl mb-2"></i>
                                <p class="text-[10px] font-black uppercase text-gray-700 dark:text-gray-100">
                                    ANEXAR COMPROVANTE
                                </p>

                                <p class="mt-1 text-[11px] font-semibold leading-relaxed text-gray-500 dark:text-gray-100">
                                    Selecione uma imagem do pagamento.
                                </p>

                                <span class="mt-3 inline-flex h-10 items-center justify-center rounded-xl border border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-950 px-5 py-2.5 text-[10px] font-black uppercase text-gray-700 dark:text-gray-100 shadow-sm transition active:scale-95">
                                    SELECIONAR IMAGEM
                                </span>
                            </label>

                            <input
                                type="file"
                                id="f-file"
                                accept="image/*"
                                class="sr-only"
                            >

                            <p id="f-file-nome" class="break-all text-[10px] font-semibold text-gray-500 dark:text-gray-100 text-center">
                                Nenhum arquivo selecionado
                            </p>

                            <p class="text-[9px] font-semibold text-gray-400 dark:text-gray-100 text-center">
                                M&aacute;ximo 800 KB. Prefira tirar um print do comprovante.
                            </p>
                        </div>

                        <button
                            type="button"
                            id="btn-enviar-comprovante"
                            onclick="enviarComprovante()"
                            class="w-full bg-[#990000] hover:bg-red-800 text-white font-black uppercase text-[11px] py-3.5 rounded-2xl shadow-lg transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 shadow-glow-vinho-light dark:shadow-glow-vinho-dark animate-pulse-slow"
                        >
                            ENVIAR COMPROVANTE
                        </button>
                        
                        <div class="rounded-xl border border-[#990000] bg-gray-950 px-4 py-3">
                            <p class="text-[11px] font-semibold leading-relaxed text-white">
                                <span class="text-red-500 font-black uppercase text-[9px] block mb-1">Informa&ccedil;&atilde;o</span>
                                Ap&oacute;s o envio, o comprovante ser&aacute; analisado pela equipe respons&aacute;vel.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    `;
}

function montarCardJustificativaFinanceiroDVC() {
    // DVC UX FINANCEIRO - ETAPA 2: apresenta a justificativa como recurso de apoio.
    return `
        <details
            class="group overflow-hidden rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm text-gray-900 dark:text-gray-100"
            data-dvc-label-fechado="ABRIR FORMUL&Aacute;RIO"
            data-dvc-label-aberto="FECHAR FORMUL&Aacute;RIO"
        >
            <summary class="relative list-none cursor-pointer text-left font-bold" style="padding: 28px 20px 20px 20px;">
                <div class="absolute top-0 left-0 right-0 h-[4px] z-10 bg-gradient-to-r from-gray-950 via-[#4b0d0d] to-[#990000]" style="height: 4px;"></div>
                ${montarCabecalhoCardClaroFinanceiroDVC("APOIO AO PARTICIPANTE", "PRECISA DE APOIO NESTE M&Ecirc;S?")}

                <p class="mt-3 text-[11px] font-semibold leading-relaxed text-gray-500 dark:text-gray-400">
                    Envie uma justificativa para an&aacute;lise da equipe respons&aacute;vel.
                </p>

                <span class="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-red-200 dark:border-red-950 bg-white dark:bg-gray-950 px-4 py-3 text-[10px] font-black uppercase text-red-800 dark:text-red-400 transition active:scale-95 shadow-sm">
                    <span data-dvc-details-label>ABRIR FORMUL&Aacute;RIO</span>
                </span>
            </summary>

            <div class="border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 pb-5 pt-4">
                <textarea id="f-just-texto" placeholder="Descreva aqui o motivo..." class="h-24 w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 p-3 text-xs text-gray-850 dark:text-gray-200 outline-none ring-1 ring-red-100/30 transition focus:border-[#990000] dark:focus:border-red-600"></textarea>

                <button
                    type="button"
                    onclick="enviarJustificativa()"
                    class="mt-3 w-full rounded-xl bg-gray-800 dark:bg-gray-950 border border-gray-700/50 dark:border-gray-800 px-4 py-3 text-[10px] font-black uppercase text-white shadow-sm transition active:scale-95 hover:bg-gray-900 transition-colors"
                >
                    ENVIAR JUSTIFICATIVA
                </button>
            </div>
        </details>
    `;
}

function montarBannerInstitucionalFinanceiroDVC(envios = [], competenciaAtual = "", opcoes = {}) {
    return montarHeroContribuicaoFinanceiroDVC(envios, competenciaAtual, opcoes);
}

function prepararInteracoesFinanceiroDVC() {
    const inputArquivo = document.getElementById("f-file");
    const nomeArquivo = document.getElementById("f-file-nome");

    if (inputArquivo && nomeArquivo && inputArquivo.dataset.dvcFileLabelPronto !== "true") {
        inputArquivo.dataset.dvcFileLabelPronto = "true";
        inputArquivo.addEventListener("change", () => {
            const arquivo = inputArquivo.files?.[0];
            if (!arquivo) {
                nomeArquivo.textContent = "Nenhum arquivo selecionado.";
                return;
            }

            const nomeSeguro = escaparHtmlFinanceiroDVC(arquivo.name || "Arquivo selecionado");
            nomeArquivo.innerHTML = `
                <span class="block text-gray-700">${nomeSeguro}</span>
                <span class="mt-1 block text-[9px] font-black uppercase text-red-700">Arquivo pronto para envio</span>
            `;
        });
    }

    document.querySelectorAll("[data-dvc-details-label]").forEach(label => {
        const details = label.closest("details");
        if (!details) return;

        const atualizarLabel = () => {
            label.textContent = details.open
                ? (details.dataset.dvcLabelAberto || "")
                : (details.dataset.dvcLabelFechado || "");
        };

        if (details.dataset.dvcDetailsLabelPronto !== "true") {
            details.dataset.dvcDetailsLabelPronto = "true";
            details.addEventListener("toggle", atualizarLabel);
        }

        atualizarLabel();
    });
}

async function copiarChavePixDVC() {
    try {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(CHAVE_PIX_DVC);
        } else {
            const campoTemporario = document.createElement("textarea");
            campoTemporario.value = CHAVE_PIX_DVC;
            campoTemporario.setAttribute("readonly", "");
            campoTemporario.className = "fixed -top-1 left-0 h-1 w-1 opacity-0";
            document.body.appendChild(campoTemporario);
            campoTemporario.select();
            document.execCommand("copy");
            campoTemporario.remove();
        }

        alert("Chave PIX copiada.");
    } catch (e) {
        console.error("Erro ao copiar chave PIX:", e);
        alert(`Chave PIX: ${CHAVE_PIX_DVC}`);
    }
}

// 1. renderFinanceiro
async function renderFinanceiro() {
    const c = document.getElementById('main-content');

    if (!c) return;

    const mesesAnos = [
        "Abril/2026",
        "Maio/2026",
        "Junho/2026",
        "Julho/2026",
        "Agosto/2026",
        "Setembro/2026",
        "Outubro/2026",
        "Novembro/2026",
        "Dezembro/2026"
    ];

    const hoje = new Date();
    const mesInicialPermitido = obterMesInicialContribuicao();
    const mesAtualValor = hoje.getFullYear() * 100 + hoje.getMonth();

    const mesesPermitidos = mesesAnos.filter(mesAno => {
        const valor = valorMesAno(mesAno);
        return valor >= mesInicialPermitido && valor <= mesAtualValor;
    });

    const competenciaAtual = obterCompetenciaAtualFinanceiroDVC(mesesPermitidos);
    const optionsHtml = montarOptionsMesesFinanceiroDVC(mesesPermitidos, competenciaAtual);
    const dadosCarenciaCadastro = window.obterDadosCarenciaCadastro(get_currentUserData(), hoje);
    const avisoCarenciaCadastroHtml = montarAvisoCarenciaCadastroFinanceiroDVC(dadosCarenciaCadastro);

    if (get_currentUserData()?.funcao === "Auxiliar") {
        c.innerHTML = `
            <div id="dvc-finance-root" class="space-y-4 pb-28 pb-24">
                ${montarHeroContribuicaoFinanceiroDVC([], competenciaAtual, {
                    situacao: { chave: "validado", texto: "Validado" },
                    competencia: "Isencao",
                    acaoRecomendada: "Voc&ecirc; est&aacute; isento de contribui&ccedil;&otilde;es mensais pelo apoio ao DVC.",
                    valorSugerido: "Isento",
                    labelValor: "CONTRIBUI&Ccedil;&Atilde;O MENSAL"
                })}

                <div class="relative overflow-hidden rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 pb-5 pt-7 shadow-sm text-gray-900 dark:text-gray-100" style="padding: 28px 20px 20px 20px;">
                    <div class="absolute top-0 left-0 right-0 h-[4px] z-10 bg-gradient-to-r from-gray-950 via-[#4b0d0d] to-[#990000]" style="height: 4px;"></div>
                    ${montarCabecalhoCardClaroFinanceiroDVC("PAGAMENTO E COMPROVA&Ccedil;&Atilde;O", "CONTRIBUI&Ccedil;&Atilde;O DO M&Ecirc;S")}

                    <p class="mt-3 text-[10px] font-semibold leading-relaxed text-gray-500 dark:text-gray-400">
                        Obrigado por contribuir na organiza&ccedil;&atilde;o dos treinos, chamadas e avalia&ccedil;&otilde;es t&eacute;cnicas do clube.
                    </p>
                </div>
            </div>
        `;
        prepararInteracoesFinanceiroDVC();
        return;
    }

    // DVC UX FINANCEIRO - ETAPA 1: remove apenas duplicidades visuais, preservando os dados.
    // DVC UX FINANCEIRO: preserva todos os handlers, payloads e dados existentes.
    c.innerHTML = `
        <div id="dvc-finance-root" class="space-y-4 pb-28 pb-24">
            <div id="finance-hero-root">
                ${montarHeroContribuicaoFinanceiroDVC([], competenciaAtual)}
            </div>

            ${montarCardContribuicaoMesFinanceiroDVC(optionsHtml, avisoCarenciaCadastroHtml)}

            <div class="relative overflow-hidden rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 pb-5 pt-7 shadow-sm text-gray-900 dark:text-gray-100" style="padding: 28px 20px 20px 20px;">
                <div class="absolute top-0 left-0 right-0 h-[4px] z-10 bg-gradient-to-r from-gray-950 via-[#4b0d0d] to-[#990000]" style="height: 4px;"></div>
                ${montarCabecalhoCardClaroFinanceiroDVC("HIST&Oacute;RICO FINANCEIRO", "SEUS ENVIOS")}

                <div id="finance-status-list" class="mt-4 space-y-2">
                    <div class="rounded-xl border border-dashed border-gray-300 dark:border-gray-800 bg-gray-50 dark:bg-gray-955 p-4 text-center">
                        <p class="text-[10px] font-bold uppercase text-gray-400 dark:text-gray-500">
                            Carregando envios...
                        </p>
                    </div>
                </div>
            </div>

            ${montarCardJustificativaFinanceiroDVC()}
        </div>
    `;

    prepararInteracoesFinanceiroDVC();

    if (!get_AppCache().contribuicoes && auth.currentUser?.email) {
        await migrarContribuicoesLegadasDoAtleta(auth.currentUser.email);
    }

    const contribuicoesFinanceiras = await window.carregarContribuicoesCache();
    if (window.__abaAtualDVC !== "finance") return;

    const listDiv = document.getElementById('finance-status-list');
    if (!listDiv) return;

    const emailAtual = String(auth.currentUser?.email || "").toLowerCase();
    const envios = [];

    contribuicoesFinanceiras
        .filter(docContrib => String(docContrib.email || "").toLowerCase() === emailAtual)
        .forEach(docContrib => {
            const data = docContrib;

            envios.push({
                id: docContrib.id,
                mes: data.mes || "Sem mes",
                tipo: data.tipo || "Comprovante",
                status: data.status || "Pendente",
                resultadoFinanceiro: data.resultadoFinanceiro || "",
                enviadoEm: data.enviadoEm || ""
            });
        });

    envios.sort((a, b) => {
        const dataA = new Date(a.enviadoEm || 0);
        const dataB = new Date(b.enviadoEm || 0);
        return dataB - dataA;
    });

    listDiv.innerHTML = montarEnviosAgrupadosFinanceiroDVC(envios);

    const heroDiv = document.getElementById("finance-hero-root");
    if (heroDiv) {
        heroDiv.innerHTML = montarHeroContribuicaoFinanceiroDVC(envios, competenciaAtual);
        prepararInteracoesFinanceiroDVC();
    }
}
// 2. renderFinance
function renderFinance(...args) {
    if (typeof window.renderFinanceiro === "function") {
        return window.renderFinanceiro(...args);
    }

    const c = document.getElementById('main-content');
    if (c) {
        c.innerHTML = `
            <div class="p-6 text-center bg-red-50 border border-red-100 rounded-2xl">
                <p class="text-xs font-black uppercase text-red-700">Financeiro indisponÃ­vel agora.</p>
            </div>
        `;
    }
}

// 3. abrirModoTesteAtleta
async function abrirModoTesteAtleta() {
    try {
        const usuariosResumo = await window.carregarAtletasCache();

        let atletas = [];

        usuariosResumo.forEach(user => {
            const email = user.email || user.id; // docUsuario.id logic preserved via user.id

            if (window.ehResponsavelTecnico(user)) return;

            atletas.push({
                email,
                nome: user.nome || email,
                status: user.status || "Sem status",
                financeiro: window.obterStatusFinanceiroEfetivo(user)
            });
        });

        atletas.sort((a, b) => a.nome.localeCompare(b.nome));

        if (atletas.length === 0) {
            alert("Nenhum atleta encontrado.");
            return;
        }

        const options = atletas.map(a => `
            <option value="${a.email}">
                ${a.nome} - ${a.status} / ${a.financeiro}
            </option>
        `).join('');

        const modal = `
            <div id="m-modo-teste" class="fixed inset-0 bg-black/80 z-[100] p-4 flex items-center justify-center">
                <div class="bg-white w-full max-w-sm rounded-2xl p-6 relative shadow-2xl">
                    <button 
                        onclick="document.getElementById('m-modo-teste').remove()" 
                        class="absolute top-4 right-4 text-red-600 font-black text-xl">
                        X
                    </button>

                    <h2 class="font-bold text-xs uppercase mb-2 text-[#990000]">
                        Modo Teste
                    </h2>

                    <p class="text-[10px] text-gray-500 font-semibold mb-4 leading-relaxed">
                        Escolha um atleta para visualizar o perfil como se estivesse acessando a conta dele.
                    </p>

                    <label class="text-[9px] font-black text-gray-400 uppercase">
                        Atleta
                    </label>

                    <select id="modo-teste-email" class="w-full p-2 border rounded text-xs font-bold mb-4 bg-gray-50">
                        ${options}
                    </select>

                    <button 
                        onclick="iniciarModoTesteAtleta()" 
                        class="w-full bg-[#990000] text-white py-3 rounded-lg font-black text-[10px] uppercase shadow-md">
                        Visualizar Perfil
                    </button>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modal);

    } catch (e) {
        console.error("Erro ao abrir modo teste:", e);
        alert("NÃ£o foi possÃ­vel abrir o modo teste.");
    }
}

// 4. iniciarModoTesteAtleta
async function iniciarModoTesteAtleta() {
    const select = document.getElementById('modo-teste-email');

    if (!select || !select.value) {
        return alert("Selecione um atleta.");
    }

    window.modoTestePerfilEmail = select.value;
    window.modoTestePerfilNome = select.options[select.selectedIndex].text;

    document.getElementById('m-modo-teste')?.remove();

    window.changeTab('profile');
}

// 5. sairModoTesteAtleta
function sairModoTesteAtleta() {
    window.modoTestePerfilEmail = null;
    window.modoTestePerfilNome = null;

    window.changeTab('profile');
}

// 6. enviarComprovanteLegadoDesativado
async function enviarComprovanteLegadoDesativado() {
    const file = document.getElementById('f-file').files[0];
    const mes = document.getElementById('f-mes').value;

    if (!mes) {
        return alert("Nenhum mÃªs disponÃ­vel para envio no momento.");
    }

    if (!file) {
        return alert("Selecione o arquivo.");
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
        const base64 = e.target.result;
        const enviadoEm = new Date().toISOString();
        const enviadoPor = get_currentUserData()?.nome || auth.currentUser.email;
        const comprovanteRef = doc(db, "users", auth.currentUser.email, "contribuicoes", mes.replace('/','_'));
        const dadosComprovante = {
            mes: mes,
            tipo: "Comprovante",
            comprovante: base64,
            enviadoEm: enviadoEm,
            atualizadoEm: enviadoEm,
            status: "Pendente",
            resultadoFinanceiro: "",
            validadoEm: "",
            validadoPor: "",
            analisadoEm: "",
            analisadoPor: "",
            nome: get_currentUserData()?.nome || "",
            email: auth.currentUser.email,
            arquivoNome: file.name || "comprovante",
            arquivoTipo: file.type || "",
            arquivoTamanho: file.size || 0,
            historicoEnvios: arrayUnion({
                tipo: "Comprovante",
                mes: mes,
                enviadoEm: enviadoEm,
                enviadoPor: enviadoPor,
                email: auth.currentUser.email,
                arquivoNome: file.name || "comprovante",
                arquivoTamanho: file.size || 0
            })
        };

        await updateDoc(doc(db, "users", auth.currentUser.email), { comprovantesEnviados: arrayUnion(mes) });
        await setDoc(comprovanteRef, dadosComprovante, { merge: true });
        await salvarContribuicaoGlobal(auth.currentUser.email, mes.replace('/','_'), dadosComprovante);
        alert("Enviado!"); renderFinance();
    };
    reader.readAsDataURL(file);
}

// 7. enviarComprovante
async function enviarComprovante() {
    const alert = mensagem => window.alert(corrigirTextoFinanceiroDVC(mensagem));
    const file = document.getElementById('f-file')?.files?.[0];
    const mes = document.getElementById('f-mes')?.value;

    if (!mes) {
        const dadosCarencia = window.obterDadosCarenciaCadastro(get_currentUserData());

        if (dadosCarencia.ativa) {
            return alert(`VocÃª estÃ¡ em carÃªncia de cadastro atÃ© ${dadosCarencia.label}. O envio da contribuiÃ§Ã£o abre no prÃ³ximo mÃªs.`);
        }

        return alert("Nenhum mÃªs disponÃ­vel para envio no momento.");
    }

    if (!file) {
        return alert("Selecione o arquivo.");
    }

    if (file.size > 800000) {
        return alert("Arquivo muito grande! No plano gratuito, tire um print da tela do comprovante para diminuir o tamanho antes de enviar (mÃ¡x: 800KB).");
    }

    const btn = document.getElementById("btn-enviar-comprovante");
    const textoOriginal = btn?.textContent?.trim() || "ENVIAR COMPROVANTE";
    const restaurarBotao = () => {
        if (!btn) return;
        btn.textContent = textoOriginal;
        btn.disabled = false;
    };

    if (btn) {
        btn.textContent = "ENVIANDO...";
        btn.disabled = true;
    }

    const reader = new FileReader();

    reader.onload = async (e) => {
        try {
            const base64 = e.target.result;
            const email = auth.currentUser.email;
            const enviadoEm = new Date().toISOString();
            const docIdGlobal = `${mes.replace('/', '_')}_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;

            await setDoc(doc(db, "contribuicoesGlobais", docIdGlobal), {
                mes: mes,
                tipo: "Comprovante",
                comprovante: base64,
                enviadoEm: enviadoEm,
                status: "Pendente",
                resultadoFinanceiro: "",
                nome: get_currentUserData()?.nome || "",
                email: email,
                arquivoNome: file.name || "comprovante"
            }, { merge: true });

            await updateDoc(doc(db, "users", email), {
                comprovantesEnviados: arrayUnion(mes)
            });

            window.limparCacheDados("financeiro"); window.limparCacheContribuicoesAtleta();
            window.limparCacheDados("atletas");
            alert("Enviado!");
            restaurarBotao();
            renderFinance();
        } catch (err) {
            console.error("Erro ao enviar comprovante:", err);
            restaurarBotao();
            alert("NÃ£o foi possÃ­vel enviar o comprovante.");
        }
    };

    reader.onerror = () => {
        restaurarBotao();
        alert("NÃ£o foi possÃ­vel ler o arquivo selecionado.");
    };

    reader.readAsDataURL(file);
}

// 8. enviarJustificativa
async function enviarJustificativa() {
    const alert = mensagem => window.alert(corrigirTextoFinanceiroDVC(mensagem));
    const texto = document.getElementById('f-just-texto').value.trim();
    const mes = document.getElementById('f-mes').value;

    if (!texto) {
        return alert("Descreva o motivo da justificativa.");
    }

    if (!mes) {
        const dadosCarencia = window.obterDadosCarenciaCadastro(get_currentUserData());

        if (dadosCarencia.ativa) {
            return alert(`VocÃª estÃ¡ em carÃªncia de cadastro atÃ© ${dadosCarencia.label}. A justificativa mensal serÃ¡ necessÃ¡ria apenas quando houver mÃªs disponÃ­vel.`);
        }

        return alert("Selecione o mÃªs da justificativa.");
    }
    const consecutivos = await contarJustificativasConsecutivas(auth.currentUser.email, mes);
    if (consecutivos >= 3) {
        window.abrirModalCarenciaEspecial(mes, texto);
        return;
    }
    try {
        // Cria um ID prÃ³prio para justificativa, sem apagar possÃ­vel comprovante do mesmo mÃªs
        const docId = "justificativa_" + mes.replace('/', '_');
        const enviadoEm = new Date().toISOString();
        const enviadoPor = get_currentUserData()?.nome || auth.currentUser.email;

        const dadosJustificativa = {
            mes: mes,
            tipo: "Justificativa",
            justificativa: texto,
            enviadoEm: enviadoEm,
            atualizadoEm: enviadoEm,
            status: "Pendente",
            resultadoFinanceiro: "",
            validadoEm: "",
            validadoPor: "",
            analisadoEm: "",
            analisadoPor: "",
            nome: get_currentUserData()?.nome || "",
            email: auth.currentUser.email,
            historicoEnvios: arrayUnion({
                tipo: "Justificativa",
                mes: mes,
                enviadoEm: enviadoEm,
                enviadoPor: enviadoPor,
                email: auth.currentUser.email
            })
        };

        // 1. Salva a justificativa no Firebase
        await setDoc(doc(db, "users", auth.currentUser.email, "contribuicoes", docId), dadosJustificativa, { merge: true });
        await salvarContribuicaoGlobal(auth.currentUser.email, docId, dadosJustificativa);
        await updateDoc(doc(db, "users", auth.currentUser.email), {
            justificativasEnviadas: arrayUnion(mes)
        });

        window.limparCacheDados("financeiro"); window.limparCacheContribuicoesAtleta();
        window.limparCacheDados("atletas");

        // 2. Continua abrindo o e-mail como antes
        const destinatarios = "tainaradornas1@gmail.com,gabriel0barbosa0@gmail.com,drummondvoleibol@gmail.com";

        const assunto = encodeURIComponent(`Justificativa DVC - ${get_currentUserData().nome || auth.currentUser.email} - ${mes}`);

        const corpo = encodeURIComponent(
            `Atleta: ${get_currentUserData().nome || ""}\n` +
            `E-mail: ${auth.currentUser.email}\n` +
            `MÃªs: ${mes}\n\n` +
            `Justificativa:\n${texto}\n\n` +
            `ObservaÃ§Ã£o: esta justificativa tambÃ©m foi registrada no sistema DVC para anÃ¡lise.`
        );

        alert("Justificativa salva no sistema. Agora o e-mail serÃ¡ aberto para envio.");

        window.location.href = `mailto:${destinatarios}?subject=${assunto}&body=${corpo}`;

        renderFinance();

    } catch (e) {
        console.error("Erro ao enviar justificativa:", e);
        alert("NÃ£o foi possÃ­vel salvar a justificativa. Tente novamente.");
    }
}

// 9. carregarResumoPendenciasFinanceiras
async function carregarResumoPendenciasFinanceiras() {
    try {
        const contribuicoes = await window.carregarContribuicoesCache();

        let comprovantesPendentes = 0;
        let justificativasPendentes = 0;

        contribuicoes.forEach(docContrib => {
            const data = docContrib;
            const status = data.status || "Pendente";
            const tipo = data.tipo || "Comprovante";
            const statusNormalizado = status.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
            const pendenteFinanceiro = status === "Pendente" || (tipo === "CarenciaEspecial" && statusNormalizado.includes("em anal"));

            if (!pendenteFinanceiro) return;

            if (tipo === "Justificativa" || tipo === "CarenciaEspecial") {
                justificativasPendentes++;
            } else {
                comprovantesPendentes++;
            }
        });

        const elComprovantes = document.getElementById('count-comprovantes-pendentes');
        const elJustificativas = document.getElementById('count-justificativas-pendentes');

        if (elComprovantes) elComprovantes.innerText = comprovantesPendentes;
        if (elJustificativas) elJustificativas.innerText = justificativasPendentes;

    } catch (e) {
        console.error("Erro ao carregar resumo de pendÃªncias:", e);

        const elComprovantes = document.getElementById('count-comprovantes-pendentes');
        const elJustificativas = document.getElementById('count-justificativas-pendentes');

        if (elComprovantes) elComprovantes.innerText = "!";
        if (elJustificativas) elJustificativas.innerText = "!";
    }
}

// 10. abrirPendenciasFinanceiras
async function abrirPendenciasFinanceiras() {
    try {
        const contribuicoes = await window.carregarContribuicoesCache();
        let pendencias = [];

        contribuicoes.forEach(docContrib => {
            const data = docContrib;
            const status = data.status || "Pendente";
            const tipo = data.tipo || "Comprovante";
            const statusNormalizado = status.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
            const pendenteFinanceiro = status === "Pendente" || (tipo === "CarenciaEspecial" && statusNormalizado.includes("em anal"));

            if (!pendenteFinanceiro) return;

            pendencias.push({
                email: data.email || "",
                nome: data.nome || data.email || "Atleta",
                docId: docContrib.id,
                legacyDocId: data.legacyDocId || "",
                mes: data.mes || "Sem mÃªs",
                tipo: tipo,
                justificativa: data.justificativa || "",
                comprovante: data.comprovante || "",
                enviadoEm: data.enviadoEm || "",
                atualizadoEm: data.atualizadoEm || "",
                validadoEm: data.validadoEm || "",
                validadoPor: data.validadoPor || "",
                analisadoEm: data.analisadoEm || "",
                analisadoPor: data.analisadoPor || "",
                arquivoNome: data.arquivoNome || "",
                respostaPodeContribuir: data.respostaPodeContribuir || "",
                respostaImportanciaProjeto: data.respostaImportanciaProjeto || "",
                respostaContribuicaoProjeto: data.respostaContribuicaoProjeto || ""
            });
        });

        pendencias.sort((a, b) => {
            const dataA = new Date(a.enviadoEm || 0);
            const dataB = new Date(b.enviadoEm || 0);
            return dataB - dataA;
        });

        const listaHtml = pendencias.length > 0 ? pendencias.map(item => {
            const isJustificativa = item.tipo === "Justificativa";
            const isCarenciaEspecial = item.tipo === "CarenciaEspecial";
            return `
                <div class="${
                    isCarenciaEspecial 
                        ? 'bg-red-50 border-red-200' 
                        : isJustificativa 
                            ? 'bg-blue-50 border-blue-200' 
                            : 'bg-green-50 border-green-200'
                } border rounded-xl p-4 mb-3">
                    
                    <div class="flex justify-between items-start gap-2 mb-2">
                        <div>
                            <p class="text-xs font-black text-gray-800 uppercase">
                                ${item.nome}
                            </p>
                            <p class="text-[9px] font-bold text-gray-500">
                                ${item.email}
                            </p>
                        </div>

                        <span class="${
                            isCarenciaEspecial 
                                ? 'bg-[#990000]' 
                                : isJustificativa 
                                    ? 'bg-blue-600' 
                                    : 'bg-green-600'
                        } text-white text-[8px] font-black px-2 py-1 rounded-full uppercase">
                            ${
                                isCarenciaEspecial 
                                    ? 'CarÃªncia especial' 
                                    : isJustificativa 
                                        ? 'Justificativa' 
                                        : 'Comprovante'
                            }
                        </span>
                    </div>

                    <p class="text-[10px] font-bold text-gray-700 mb-2">
                        MÃªs: ${item.mes}
                    </p>

                    ${montarRastroFinanceiro(item)}

                    ${isCarenciaEspecial ? `
                        <div class="bg-white border rounded-lg p-3 mb-3">
                            <p class="text-[9px] font-black text-[#990000] uppercase mb-1">
                                Justificativa original:
                            </p>
                            <p class="text-[10px] text-gray-700 leading-relaxed mb-3">
                                ${item.justificativa || "Sem texto informado."}
                            </p>

                            <p class="text-[9px] font-black text-gray-500 uppercase mb-1">
                                1. Tem certeza que nÃ£o pode contribuir com nenhum valor?
                            </p>
                            <p class="text-[10px] text-gray-700 leading-relaxed mb-3">
                                ${item.respostaPodeContribuir || "Sem resposta."}
                            </p>

                            <p class="text-[9px] font-black text-gray-500 uppercase mb-1">
                                2. Qual a importÃ¢ncia do projeto?
                            </p>
                            <p class="text-[10px] text-gray-700 leading-relaxed mb-3">
                                ${item.respostaImportanciaProjeto || "Sem resposta."}
                            </p>

                            <p class="text-[9px] font-black text-gray-500 uppercase mb-1">
                                3. Qual serÃ¡ sua contribuiÃ§Ã£o com o projeto?
                            </p>
                            <p class="text-[10px] text-gray-700 leading-relaxed">
                                ${item.respostaContribuicaoProjeto || "Sem resposta."}
                            </p>
                        </div>

                        <div class="grid grid-cols-2 gap-2">
                            <button 
                                onclick="aceitarCarenciaEspecial('${item.email}', '${item.docId}', this)" 
                                class="bg-green-600 text-white py-2 rounded-lg font-bold text-[9px] uppercase">
                                Aceitar carÃªncia
                            </button>

                            <button 
                                onclick="recusarCarenciaEspecial('${item.email}', '${item.docId}', this)" 
                                class="bg-red-600 text-white py-2 rounded-lg font-bold text-[9px] uppercase">
                                Recusar
                            </button>
                        </div>
                    ` : isJustificativa ? `
                        <div class="bg-white border rounded-lg p-3 mb-3">
                            <p class="text-[9px] font-black text-blue-800 uppercase mb-1">
                                Texto da justificativa:
                            </p>
                            <p class="text-[10px] text-gray-700 leading-relaxed">
                                ${item.justificativa || "Sem texto informado."}
                            </p>
                        </div>

                        <button 
                            onclick="aprovarJustificativa('${item.email}', '${item.docId}', this)" 
                            class="w-full bg-blue-600 text-white py-2 rounded-lg font-bold text-[9px] uppercase">
                            Marcar como Justificado
                        </button>
                    ` : `
                        <div class="flex gap-2">
                            <a 
                                href="${item.comprovante}" 
                                download="${item.nome}_${item.mes.replace('/','_')}.webp" 
                                class="flex-1 bg-blue-600 text-white text-center py-2 rounded-lg font-bold text-[9px] uppercase">
                                Baixar
                            </a>

                            <button 
                                onclick="validarExpress('${item.email}', '${item.docId}', this)" 
                                class="flex-1 bg-green-600 text-white py-2 rounded-lg font-bold text-[9px] uppercase">
                                Validar
                            </button>
                        </div>
                    `}
                </div>
            `;
        }).join('') : `
            <div class="bg-gray-50 border border-dashed rounded-xl p-4 text-center">
                <p class="text-[10px] text-gray-400 font-bold uppercase">
                    Nenhuma pendÃªncia financeira no momento.
                </p>
            </div>
        `;

        const modal = `
            <div id="m-pendencias-financeiras" class="fixed inset-0 bg-black/80 z-[100] p-4 flex items-center justify-center">
                <div class="bg-white w-full max-w-sm rounded-2xl p-5 max-h-[85vh] overflow-y-auto relative shadow-2xl">
                    <button 
                        onclick="document.getElementById('m-pendencias-financeiras').remove()" 
                        class="absolute top-4 right-4 text-red-600 font-black text-xl">
                        X
                    </button>

                    <h2 class="font-bold text-xs uppercase mb-1 text-[#990000]">
                        PendÃªncias Financeiras
                    </h2>

                    <p class="text-[9px] text-gray-400 font-bold uppercase mb-4">
                        Comprovantes, justificativas e carÃªncias aguardando anÃ¡lise
                    </p>

                    ${listaHtml}
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modal);

    } catch (e) {
        console.error("Erro ao abrir pendÃªncias financeiras:", e);
        alert("NÃ£o foi possÃ­vel carregar as pendÃªncias financeiras.");
    }
}

// 11. Legacy atualizarFinanceiro for compatibility
async function atualizarFinanceiroLegacy(email, status, selectElement) {
    const dataAtual = new Date();
    const mesAtual = dataAtual.getFullYear() + "-" + String(dataAtual.getMonth() + 1).padStart(2, '0'); 
    
    let updates = { financeiro: status };
    if(status === 'Em dia' || status === 'Justificado') {
        updates.mesFinanceiro = mesAtual;
    }
    
    await updateDoc(doc(db, "users", email.trim()), updates);
    window.limparCacheDados("atletas");

    selectElement.style.outline = "2px solid #22c55e"; 
    setTimeout(() => {
        selectElement.style.outline = "none";
    }, 1000);
}

// 12. Active atualizarFinanceiro (Active)
async function atualizarFinanceiro(email, status, selectElement = null) {
    try {
        const emailLimpo = String(email || "").trim().toLowerCase();

        if (!emailLimpo) {
            alert("E-mail do atleta nÃ£o encontrado.");
            return;
        }

        const agora = new Date().toISOString();
        const mesAtualChave = obterMesAtualChave();
        const mesAtualTexto = window.obterMesAtualTextoFinanceiro();

        const userRef = doc(db, "users", emailLimpo);
        const userSnap = await getDoc(userRef);
        
        const dadosAtleta = userSnap.exists() ? userSnap.data() : {};
        const statusNormalizado = window.normalizarTextoFinanceiro(status);

        let updates = {
            financeiro: status,
            atualizadoEm: agora
        };

        if (status === "Em dia" || status === "Justificado") {
            updates.status = "Ativo";
            updates.mesFinanceiro = mesAtualChave;
            updates.carenciaCadastroEncerrada = true;
            updates.carenciaCadastroEncerradaEm = agora;
        } else if (statusNormalizado === "carencia") {
            const fimCarencia = typeof window.obterFimCarenciaPorDataCadastro === "function" ? window.obterFimCarenciaPorDataCadastro(dadosAtleta) : null;

            updates = {
                ...updates,
                status: "Ativo",
                financeiro: get_STATUS_FINANCEIRO_CARENCIA(),
                carenciaCadastro: true,
                carenciaCadastroAte: window.formatarDataChaveFinanceira(fimCarencia),
                carenciaCadastroMotivo: "Ajuste manual no painel administrativo",
                carenciaCadastroEncerrada: false
            };
        } else if (status === "Inadimplente") {
            updates.carenciaCadastroEncerrada = true;
            updates.carenciaCadastroEncerradaEm = agora;
        }

        await updateDoc(userRef, updates);

        if (status === "Em dia" || status === "Justificado") {
            const ehPagamento = status === "Em dia";

            const docIdLegado = `${mesAtualTexto.replace("/", "_")}_ajuste_manual`;
            const docIdGlobal = window.montarIdContribuicaoGlobal(emailLimpo, docIdLegado);

            // Using local constant dadosAtleta to avoid ReferenceError on userData
            const userData = dadosAtleta;

            await setDoc(window.refContribuicaoGlobal(docIdGlobal), {
                mes: mesAtualTexto,
                tipo: ehPagamento ? "AjusteManualPagamento" : "AjusteManualJustificativa",
                status: ehPagamento ? "Validado" : "Justificado",
                resultadoFinanceiro: ehPagamento ? "Pago" : "Justificado",

                nome: userData.nome || "",
                email: emailLimpo,

                enviadoEm: agora,
                atualizadoEm: agora,
                validadoEm: agora,
                validadoPor: get_currentUserData()?.nome || auth.currentUser?.email || "Gestao",
                analisadoEm: agora,
                analisadoPor: get_currentUserData()?.nome || auth.currentUser?.email || "Gestao",

                origem: "Ajuste manual no painel administrativo",
                legacyDocId: docIdLegado
            }, { merge: true });
        }

        window.limparCacheDados("financeiro"); window.limparCacheContribuicoesAtleta();
        window.limparCacheDados("atletas");

        if (selectElement) {
            selectElement.style.outline = "2px solid #22c55e";

            setTimeout(() => {
                selectElement.style.outline = "none";
            }, 1000);
        }

        if (typeof window.atualizarResumoGestao === "function") {
            window.atualizarResumoGestao();
        }

    } catch (e) {
        console.error("Erro ao atualizar financeiro:", e);
        alert("NÃ£o foi possÃ­vel atualizar o financeiro do atleta.");
    }
}

// Helper functions for monthly dates & differences
function obterMesAtualChave() {
    const hoje = new Date();
    return hoje.getFullYear() + "-" + String(hoje.getMonth() + 1).padStart(2, "0");
}

function diferencaMeses(mesAntigo, mesAtual) {
    if (!mesAntigo || !mesAntigo.includes("-")) {
        return 999;
    }

    const [anoAntigo, mesAntigoNum] = mesAntigo.split("-").map(Number);
    const [anoAtual, mesAtualNum] = mesAtual.split("-").map(Number);

    return (anoAtual - anoAntigo) * 12 + (mesAtualNum - mesAntigoNum);
}

// 13. verificarViradaDeMes
async function verificarViradaDeMes() {
    const dataAtual = new Date();
    
    if (dataAtual.getDate() <= get_DIA_LIMITE_FINANCEIRO_MENSAL()) return; 

    const mesAtual = dataAtual.getFullYear() + "-" + String(dataAtual.getMonth() + 1).padStart(2, '0');
    
    const snap = await window.carregarUsuariosCacheMockDVC();
    let promessas = [];
    
    snap.forEach((u) => {
        let user = u.data();
        if (window.usuarioEstaEmCarenciaCadastro(user, dataAtual)) return;

        if(!window.ehResponsavelTecnico(user) && user.financeiro !== 'Inadimplente' && user.mesFinanceiro !== mesAtual) {
            promessas.push(updateDoc(doc(db, "users", user.email || u.id), {
                financeiro: 'Inadimplente',
                carenciaCadastroEncerrada: true,
                carenciaCadastroEncerradaEm: dataAtual.toISOString()
            }));
        }
    });
    
    if(promessas.length > 0) {
        await Promise.all(promessas);
        if (typeof window.filterAdminList === "function") {
            window.filterAdminList(); 
        }
    }
}

// 14. verificarInadimplenciaProlongada
async function verificarInadimplenciaProlongada() {
    try {
        const mesAtual = obterMesAtualChave();

        const snap = await window.carregarUsuariosCacheMockDVC();

        let paraInativar = [];
        let paraExcluir = [];

        snap.forEach(docUsuario => {
            const user = docUsuario.data();
            const email = user.email || docUsuario.id;

            if (window.ehResponsavelTecnico(user)) return;
            if (user.status === "ExcluÃ­do") return;
            if (window.usuarioEstaEmCarenciaCadastro(user)) return;

            const uÃšltimoMesRegular = user.mesFinanceiro || "";
            const mesesSemContribuicao = diferencaMeses(uÃšltimoMesRegular, mesAtual);
            if (!uÃšltimoMesRegular) {
                return;
            }
            const estaRegularNoMes = 
                (window.usuarioEstaEmDia(user) || window.usuarioEstaJustificado(user)) &&
                uÃšltimoMesRegular === mesAtual;

            if (estaRegularNoMes) return;

            const registro = {
                ...user,
                email,
                mesesSemContribuicao
            };

            if (mesesSemContribuicao >= 4) {
                paraExcluir.push(registro);
            } else if (mesesSemContribuicao >= 3) {
                paraInativar.push(registro);
            }
        });

        if (paraInativar.length === 0 && paraExcluir.length === 0) {
            alert("Nenhum atleta atingiu o prazo de inativaÃ§Ã£o ou exclusÃ£o neste mÃªs.");
            return;
        }

        const corpoEmail = `
RELATÃ“RIO DE CONTROLE FINANCEIRO DVC
MÃªs de referÃªncia: ${mesAtual}

ATLETAS QUE SERÃƒO INATIVADOS - 3 MESES SEM CONTRIBUIÃ‡ÃƒO
Total: ${paraInativar.length}

${paraInativar.length > 0 
    ? paraInativar.map(window.formatarContatoFinanceiro).join("\n\n")
    : "Nenhum atleta nesta situaÃ§Ã£o."}

------------------------------------------------------------

ATLETAS QUE SERÃƒO MARCADOS COMO EXCLUÃDOS - 4 MESES OU MAIS SEM CONTRIBUIÃ‡ÃƒO
Total: ${paraExcluir.length}

${paraExcluir.length > 0 
    ? paraExcluir.map(window.formatarContatoFinanceiro).join("\n\n")
    : "Nenhum atleta nesta situaÃ§Ã£o."}

------------------------------------------------------------

ObservaÃ§Ã£o:
Este relatÃ³rio foi gerado automaticamente pelo sistema DVC antes da aplicaÃ§Ã£o das mudanÃ§as de status.
`;

        const destinatarios = "tainaradornas1@gmail.com,gabriel0barbosa0@gmail.com,drummondvoleibol@gmail.com";
        const assunto = encodeURIComponent(`DVC - InativaÃ§Ãµes e ExclusÃµes Financeiras - ${mesAtual}`);
        const corpo = encodeURIComponent(corpoEmail);

        window.location.href = `mailto:${destinatarios}?subject=${assunto}&body=${corpo}`;

        setTimeout(async () => {
            const confirmar = confirm(
                `O e-mail de relatÃ³rio foi aberto.\n\n` +
                `ApÃ³s revisar/enviar o e-mail, deseja aplicar as mudanÃ§as agora?\n\n` +
                `Inativar: ${paraInativar.length}\n` +
                `Marcar como excluÃ­do: ${paraExcluir.length}`
            );

            if (!confirmar) return;

            for (const atleta of paraInativar) {
                await updateDoc(doc(db, "users", atleta.email), {
                    status: "Inativo",
                    financeiro: "Inadimplente",
                    inativadoEm: new Date().toISOString(),
                    motivoInativacao: "3 meses seguidos sem contribuiÃ§Ã£o"
                });
            }

            for (const atleta of paraExcluir) {
                await updateDoc(doc(db, "users", atleta.email), {
                    status: "ExcluÃ­do",
                    financeiro: "Inadimplente",
                    excluidoEm: new Date().toISOString(),
                    motivoExclusao: "4 meses ou mais sem contribuiÃ§Ã£o"
                });
            }

            alert(
                `Controle aplicado com sucesso!\n\n` +
                `Inativados: ${paraInativar.length}\n` +
                `Marcados como excluÃ­dos: ${paraExcluir.length}`
            );

            window.limparCacheDados("atletas");
            window.renderAdmin();

        }, 1000);

    } catch (e) {
        console.error("Erro ao verificar inadimplÃªncia prolongada:", e);
        alert("NÃ£o foi possÃ­vel verificar a inadimplÃªncia prolongada agora.");
    }
}

// 15. contarJustificativasConsecutivas
async function contarJustificativasConsecutivas(email, mesAtual) {
    try {
        const snap = await getDocs(collection(db, "users", email, "contribuicoes"));

        const mesesJustificados = [];

        snap.forEach(docContrib => {
            const data = docContrib.data();

            const tipo = data.tipo || "";
            const status = data.status || "";
            const mes = data.mes || "";

            const ehJustificativa = tipo === "Justificativa" || tipo === "CarenciaEspecial";

            if (!ehJustificativa || !mes) return;

            if (
                status === "Pendente" ||
                status === "Justificado" ||
                status === "Em anÃ¡lise" ||
                status === "CarÃªncia aceita"
            ) {
                mesesJustificados.push(window.normalizarMesAnoParaValor(mes));
            }
        });

        const valorAtual = window.normalizarMesAnoParaValor(mesAtual);

        let consecutivosAntes = 0;

        for (let i = 1; i <= 6; i++) {
            const valorAnterior = valorAtual - i;

            if (mesesJustificados.includes(valorAnterior)) {
                consecutivosAntes++;
            } else {
                break;
            }
        }

        return consecutivosAntes + 1;

    } catch (e) {
        console.warn("Erro ao contar justificativas consecutivas:", e);
        return 1;
    }
}

// 16. abrirModalCarenciaEspecial
function abrirModalCarenciaEspecial(mes, textoJustificativa) {
    const modalExistente = document.getElementById("m-carencia-especial");
    if (modalExistente) modalExistente.remove();

    const modal = `
        <div id="m-carencia-especial" class="fixed inset-0 bg-black/80 z-[120] p-4 flex items-center justify-center">
            <div class="bg-white w-full max-w-sm rounded-3xl p-5 max-h-[85vh] overflow-y-auto relative shadow-2xl">
                <button 
                    onclick="document.getElementById('m-carencia-especial').remove()" 
                    class="absolute top-4 right-4 text-gray-400 font-black text-xl">
                    X
                </button>

                <h2 class="text-sm font-black text-[#990000] uppercase mb-2">
                    CarÃªncia Especial
                </h2>

                <p class="text-[10px] text-gray-600 font-semibold leading-relaxed mb-4">
                    VocÃª estÃ¡ chegando a 3 meses consecutivos sem contribuir. 
                    O tempo mÃ¡ximo de carÃªncia automÃ¡tica Ã© de 3 meses consecutivos.
                </p>

                <div class="bg-red-50 border border-red-100 rounded-2xl p-3 mb-4">
                    <p class="text-[9px] font-black text-[#990000] uppercase mb-1">
                        Antes de enviar, reflita:
                    </p>
                    <p class="text-[10px] text-gray-600 font-semibold leading-relaxed">
                        O projeto busca acolher quem precisa, mas tambÃ©m depende da corresponsabilidade de todos para continuar existindo.
                    </p>
                </div>

                <label class="text-[9px] font-black text-gray-400 uppercase">
                    VocÃª realmente nÃ£o pode realizar uma contribuiÃ§Ã£o neste mÃªs?
                </label>
                <textarea id="carencia-resposta-1" class="w-full p-3 border rounded-xl text-xs mb-3 h-20 outline-none" placeholder="Explique sua situaÃ§Ã£o..."></textarea>

                <label class="text-[9px] font-black text-gray-400 uppercase">
                    Qual o peso do projeto para vocÃª
                </label>
                <textarea id="carencia-resposta-2" class="w-full p-3 border rounded-xl text-xs mb-3 h-20 outline-none" placeholder="Conte o que o projeto representa..."></textarea>

                <label class="text-[9px] font-black text-gray-400 uppercase">
                    De que forma vocÃª poderÃ¡ contribuir com o projeto?
                </label>
                <textarea id="carencia-resposta-3" class="w-full p-3 border rounded-xl text-xs mb-4 h-20 outline-none" placeholder="Ex: ajudar na organizaÃ§Ã£o, pontualidade, apoio nos treinos, divulgaÃ§Ã£o..."></textarea>

                <button 
                    onclick="enviarCarenciaEspecial('${mes}', \`${textoJustificativa.replace(/`/g, "'")}\`)" 
                    class="w-full bg-[#990000] text-white py-3 rounded-xl font-black text-[10px] uppercase shadow-md">
                    Enviar para anÃ¡lise
                </button>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modal);
}

// 17. enviarCarenciaEspecial
async function enviarCarenciaEspecial(mes, textoJustificativaOriginal) {
    try {
        const r1 = document.getElementById("carencia-resposta-1")?.value.trim();
        const r2 = document.getElementById("carencia-resposta-2")?.value.trim();
        const r3 = document.getElementById("carencia-resposta-3")?.value.trim();

        if (!r1 || !r2 || !r3) {
            return alert("Responda Ã s trÃªs perguntas antes de enviar.");
        }

        const docId = "carencia_especial_" + mes.replace("/", "_");
        const enviadoEm = new Date().toISOString();
        const enviadoPor = get_currentUserData()?.nome || auth.currentUser.email;

        const dadosCarencia = {
            mes: mes,
            tipo: "CarenciaEspecial",
            status: "Em anÃ¡lise",
            resultadoFinanceiro: "",
            justificativa: textoJustificativaOriginal,
            respostaPodeContribuir: r1,
            respostaImportanciaProjeto: r2,
            respostaContribuicaoProjeto: r3,
            enviadoEm: enviadoEm,
            atualizadoEm: enviadoEm,
            validadoEm: "",
            validadoPor: "",
            analisadoEm: "",
            analisadoPor: "",
            nome: get_currentUserData()?.nome || "",
            email: auth.currentUser.email,
            historicoEnvios: arrayUnion({
                tipo: "CarenciaEspecial",
                mes: mes,
                enviadoEm: enviadoEm,
                enviadoPor: enviadoPor,
                email: auth.currentUser.email
            })
        };

        await setDoc(doc(db, "users", auth.currentUser.email, "contribuicoes", docId), dadosCarencia, { merge: true });
        await salvarContribuicaoGlobal(auth.currentUser.email, docId, dadosCarencia);
        await updateDoc(doc(db, "users", auth.currentUser.email), {
            justificativasEnviadas: arrayUnion(mes),
            financeiro: "Em carência",
            carenciaStatus: "Em análise",
            carenciaEspecialSolicitada: true,
            ultimaCarenciaEspecial: new Date().toISOString()
        });

        window.limparCacheDados("financeiro"); window.limparCacheContribuicoesAtleta();
        window.limparCacheDados("atletas");

        document.getElementById("m-carencia-especial")?.remove();

        alert("SolicitaÃ§Ã£o de carÃªncia especial enviada para anÃ¡lise.");

        renderFinance();

    } catch (e) {
        console.error("Erro ao enviar carÃªncia especial", e);
        alert("NÃ£o foi possÃ­vel enviar a solicitaÃ§Ã£o de carÃªncia especial.");
    }
}

// 18. aceitarCarenciaEspecial
async function aceitarCarenciaEspecial(email, docId, btn) {
    try {
        const analisadoEm = new Date().toISOString();
        const analisadoPor = get_currentUserData()?.nome || auth.currentUser?.email || "Gestao";

        await atualizarContribuicaoGlobalComEspelho(email, docId, {
            status: "CarÃªncia aceita",
            resultadoFinanceiro: "Justificado",
            analisadoEm: analisadoEm,
            analisadoPor: analisadoPor,
            validadoEm: analisadoEm,
            validadoPor: analisadoPor,
            historicoAnalise: arrayUnion({
                acao: "Carencia especial aceita",
                em: analisadoEm,
                por: analisadoPor
            })
        });

        const { snap: snapCarencia } = await window.buscarContribuicaoGlobal(email, docId);
        const dadosCarencia = snapCarencia.exists() ? snapCarencia.data() : {};
        const mesReferenciaCarencia = dadosCarencia.mes || window.obterMesAtualTextoFinanceiro();
        const mesFinanceiroCarencia = window.converterMesParaChave(mesReferenciaCarencia);

        await updateDoc(doc(db, "users", email), {
            financeiro: "Justificado",
            carenciaStatus: "Aceita",
            carenciaEspecialSolicitada: false
        });

        window.limparCacheDados("financeiro"); window.limparCacheContribuicoesAtleta();
        window.limparCacheDados("atletas");

        if (btn) {
            btn.innerText = "Aceita";
            btn.disabled = true;
        }

        alert("CarÃªncia especial aceita.");

        document.getElementById("m-pendencias-financeiras")?.remove();
        abrirPendenciasFinanceiras();

    } catch (e) {
        console.error("Erro ao aceitar carÃªncia especial:", e);
        alert("NÃ£o foi possÃ­vel aceitar a carÃªncia.");
    }
}

// 19. recusarCarenciaEspecial
async function recusarCarenciaEspecial(email, docId, btn) {
    try {
        const analisadoEm = new Date().toISOString();
        const analisadoPor = get_currentUserData()?.nome || auth.currentUser?.email || "Gestao";

        await atualizarContribuicaoGlobalComEspelho(email, docId, {
            status: "CarÃªncia recusada",
            resultadoFinanceiro: "Recusado",
            analisadoEm: analisadoEm,
            analisadoPor: analisadoPor,
            historicoAnalise: arrayUnion({
                acao: "Carencia especial recusada",
                em: analisadoEm,
                por: analisadoPor
            })
        });

        await updateDoc(doc(db, "users", email), {
            financeiro: "Inadimplente",
            carenciaStatus: "Recusada",
            carenciaEspecialSolicitada: false
        });

        window.limparCacheDados("financeiro"); window.limparCacheContribuicoesAtleta();
        window.limparCacheDados("atletas");

        if (btn) {
            btn.innerText = "Recusada";
            btn.disabled = true;
        }

        alert("CarÃªncia especial recusada.");

        document.getElementById("m-pendencias-financeiras")?.remove();
        abrirPendenciasFinanceiras();

    } catch (e) {
        console.error("Erro ao recusar carÃªncia especial", e);
        alert("NÃ£o foi possÃ­vel recusar a carÃªncia.");
    }
}

// 20. validarExpress
async function validarExpress(email, docId, btnElement) {
    try {
        if (btnElement) {
            btnElement.innerText = "Validando...";
            btnElement.classList.replace("bg-green-600", "bg-yellow-500");
            btnElement.disabled = true;
        }

        const { snap: contribSnap } = await window.buscarContribuicaoGlobal(email, docId);

        if (!contribSnap.exists()) {
            alert("Registro nÃ£o encontrado.");
            return;
        }

        const data = contribSnap.data();
        const mesReferencia = data.mes || "";
        const formatoMes = window.converterMesParaChave(mesReferencia);

        const analisadoEm = new Date().toISOString();
        const analisadoPor = get_currentUserData()?.nome || auth.currentUser?.email || "Gestao";

        await atualizarContribuicaoGlobalComEspelho(email, docId, { 
            status: "Validado",
            resultadoFinanceiro: "Pago",
            validadoEm: analisadoEm,
            validadoPor: analisadoPor,
            analisadoEm: analisadoEm,
            analisadoPor: analisadoPor,
            historicoAnalise: arrayUnion({
                acao: "Comprovante validado",
                em: analisadoEm,
                por: analisadoPor
            })
        });

        await updateDoc(doc(db, "users", email), { 
            status: "Ativo", 
            financeiro: "Em dia", 
            mesFinanceiro: formatoMes,
            carenciaCadastroEncerrada: true,
            carenciaCadastroEncerradaEm: analisadoEm
        });

        window.limparCacheDados("financeiro"); window.limparCacheContribuicoesAtleta();
        window.limparCacheDados("atletas");

        if (btnElement) {
            btnElement.innerText = "Validado";
            btnElement.classList.replace("bg-yellow-500", "bg-green-500");
        }

        alert("Comprovante validado!");

        document.getElementById('m-fin')?.remove();
        document.getElementById('m-pendencias-financeiras')?.remove();

        window.renderAdmin();

    } catch (e) {
        console.error("Erro ao validar comprovante:", e);
        alert("NÃ£o foi possÃ­vel validar o comprovante.");
    }
}

// 21. aprovarJustificativa
async function aprovarJustificativa(email, docId, btnElement) {
    try {
        await migrarContribuicoesLegadasDoAtleta(email);

        if (btnElement) {
            btnElement.innerText = "Aprovando...";
            btnElement.disabled = true;
            btnElement.classList.replace("bg-blue-600", "bg-yellow-500");
        }

        const { snap: contribSnap } = await window.buscarContribuicaoGlobal(email, docId);

        if (!contribSnap.exists()) {
            alert("Justificativa nÃ£o encontrada.");
            return;
        }

        const data = contribSnap.data();
        const mesReferencia = data.mes || "";
        const formatoMes = window.converterMesParaChave(mesReferencia);

        const analisadoEm = new Date().toISOString();
        const analisadoPor = get_currentUserData()?.nome || auth.currentUser?.email || "Gestao";

        await atualizarContribuicaoGlobalComEspelho(email, docId, {
            status: "Justificado",
            resultadoFinanceiro: "Justificado",
            validadoEm: analisadoEm,
            validadoPor: analisadoPor,
            analisadoEm: analisadoEm,
            analisadoPor: analisadoPor,
            historicoAnalise: arrayUnion({
                acao: "Justificativa aprovada",
                em: analisadoEm,
                por: analisadoPor
            })
        });

        await updateDoc(doc(db, "users", email), {
            status: "Ativo",
            financeiro: "Justificado",
            mesFinanceiro: formatoMes,
            carenciaCadastroEncerrada: true,
            carenciaCadastroEncerradaEm: analisadoEm
        });

        window.limparCacheDados("financeiro"); window.limparCacheContribuicoesAtleta();
        window.limparCacheDados("atletas");

        if (btnElement) {
            btnElement.innerText = "Justificado";
            btnElement.classList.replace("bg-yellow-500", "bg-blue-700");
        }

        alert("Justificativa aprovada!");

        document.getElementById('m-fin')?.remove();
        document.getElementById('m-pendencias-financeiras')?.remove();

        window.renderAdmin();
    } catch (e) {
        console.error("Erro ao aprovar justificativa:", e);
        alert("NÃ£o foi possÃ­vel aprovar a justificativa.");
    }
}

// 22. montarRastroFinanceiro
function montarRastroFinanceiro(item = {}) {
    const enviadoEm = window.formatarDataHoraFinanceira(item.enviadoEm);
    const atualizadoEm = item.atualizadoEm && item.atualizadoEm !== item.enviadoEm
        ? `<p><span class="font-black">Atualizado:</span> ${window.formatarDataHoraFinanceira(item.atualizadoEm)}</p>`
        : "";
    const analisadoEm = item.analisadoEm || item.validadoEm || "";
    const analisadoPor = item.analisadoPor || item.validadoPor || "";
    const arquivo = item.arquivoNome
        ? `<p><span class="font-black">Arquivo:</span> ${item.arquivoNome}</p>`
        : "";
    const analise = analisadoEm
        ? `<p><span class="font-black">Analisado:</span> ${window.formatarDataHoraFinanceira(analisadoEm)}${analisadoPor ? ` por ${analisadoPor}` : ""}</p>`
        : "";

    return `
        <div class="bg-white/70 border border-dashed rounded-lg p-2 mb-3 text-[8px] text-gray-500 font-bold uppercase leading-relaxed">
            <p><span class="font-black">Enviado:</span> ${enviadoEm}</p>
            ${atualizadoEm}
            ${arquivo}
            ${analise}
        </div>
    `;
}

function montarRegistroContribuicaoGlobal(email, docIdLegado, dados) {
    return {
        ...dados,
        email,
        nome: dados.nome || get_currentUserData()?.nome || "",
        legacyDocId: docIdLegado,
        atualizadoEm: dados.atualizadoEm || new Date().toISOString()
    };
}

async function salvarContribuicaoGlobal(email, docIdLegado, dados) {
    const docIdGlobal = window.montarIdContribuicaoGlobal(email, docIdLegado);
    const registro = montarRegistroContribuicaoGlobal(email, docIdLegado, dados);
    await setDoc(window.refContribuicaoGlobal(docIdGlobal), registro, { merge: true });
    return docIdGlobal;
}

async function migrarContribuicoesLegadasDoAtleta(email) {
    const snapLegado = await getDocs(collection(db, "users", email, "contribuicoes"));
    const migracoes = [];

    snapLegado.forEach(docLegado => {
        const dados = docLegado.data();
        const docIdGlobal = window.montarIdContribuicaoGlobal(email, docLegado.id);
        migracoes.push(setDoc(
            window.refContribuicaoGlobal(docIdGlobal),
            montarRegistroContribuicaoGlobal(email, docLegado.id, dados),
            { merge: true }
        ));
    });

    await Promise.allSettled(migracoes);
}

async function atualizarContribuicaoGlobalComEspelho(email, docIdGlobal, dados) {
    const { ref: contribRef, snap: contribSnap } = await window.buscarContribuicaoGlobal(email, docIdGlobal)

    if (!contribSnap.exists()) {
        throw new Error("Registro financeiro global nao encontrado.");
    }

    const registroAtual = contribSnap.data();

    await updateDoc(contribRef, dados);

    if (registroAtual.legacyDocId) {
        try {
            await updateDoc(doc(db, "users", email, "contribuicoes", registroAtual.legacyDocId), dados);
        } catch (erroEspelho) {
            console.warn("Nao foi possivel atualizar o espelho legado da contribuicao:", erroEspelho);
        }
    }

    return registroAtual;
}

// Expose all public finance functions to window
window.renderFinanceiro = renderFinanceiro;
window.renderFinance = renderFinance;
window.abrirModoTesteAtleta = abrirModoTesteAtleta;
window.iniciarModoTesteAtleta = iniciarModoTesteAtleta;
window.sairModoTesteAtleta = sairModoTesteAtleta;
window.enviarComprovanteLegadoDesativado = enviarComprovanteLegadoDesativado;
window.enviarComprovante = enviarComprovante;
window.enviarJustificativa = enviarJustificativa;
window.copiarChavePixDVC = copiarChavePixDVC;
window.carregarResumoPendenciasFinanceiras = carregarResumoPendenciasFinanceiras;
window.abrirPendenciasFinanceiras = abrirPendenciasFinanceiras;
window.atualizarFinanceiro = atualizarFinanceiro;
window.verificarViradaDeMes = verificarViradaDeMes;
window.verificarInadimplenciaProlongada = verificarInadimplenciaProlongada;
window.abrirModalCarenciaEspecial = abrirModalCarenciaEspecial;
window.enviarCarenciaEspecial = enviarCarenciaEspecial;
window.aceitarCarenciaEspecial = aceitarCarenciaEspecial;
window.recusarCarenciaEspecial = recusarCarenciaEspecial;
window.validarExpress = validarExpress;
window.aprovarJustificativa = aprovarJustificativa;
window.montarRegistroContribuicaoGlobal = montarRegistroContribuicaoGlobal;
window.salvarContribuicaoGlobal = salvarContribuicaoGlobal;
window.migrarContribuicoesLegadasDoAtleta = migrarContribuicoesLegadasDoAtleta;
window.atualizarContribuicaoGlobalComEspelho = atualizarContribuicaoGlobalComEspelho;
window.montarRastroFinanceiro = montarRastroFinanceiro;


