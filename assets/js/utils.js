/**
 * ============================================================================
 * Módulo: UTILS
 * ============================================================================
 * Responsabilidade: Gerencia funcionalidades relacionadas a utils.
 * Este arquivo faz parte do sistema modular do DVC App.
 * Todos os códigos principais aqui agrupados seguem as diretrizes do projeto.
 * ============================================================================
 */

// HELPERS GERAIS DE DATA, NORMALIZACAO, ESCAPE HTML, BADGES E FORMATACAO DVC

import { 
    DIA_INICIO_CARENCIA_CADASTRO_FIM_MES, 
    DIA_LIMITE_FINANCEIRO_MENSAL, 
    STATUS_FINANCEIRO_CARENCIA,
    FUNCOES_VOLEI_DVC
} from "./state.js";

// 1. Escape and Mojibake
function corrigirMojibakeDVC(texto = "") {
    const mapa = [
        ["\u00C3\u0192\u00C2\u00A1", "\u00E1"],
        ["\u00C3\u0192\u00C2\u00A0", "\u00E0"],
        ["\u00C3\u0192\u00C2\u00A2", "\u00E2"],
        ["\u00C3\u0192\u00C2\u00A3", "\u00E3"],
        ["\u00C3\u0192\u00C2\u00A9", "\u00E9"],
        ["\u00C3\u0192\u00C2\u00AA", "\u00EA"],
        ["\u00C3\u0192\u00C2\u00AD", "\u00ED"],
        ["\u00C3\u0192\u00C2\u00B3", "\u00F3"],
        ["\u00C3\u0192\u00C2\u00B4", "\u00F4"],
        ["\u00C3\u0192\u00C2\u00B5", "\u00F5"],
        ["\u00C3\u0192\u00C2\u00BA", "\u00FA"],
        ["\u00C3\u0192\u00C2\u00A7", "\u00E7"],
        ["\u00C3\u00A1", "\u00E1"],
        ["\u00C3\u00A0", "\u00E0"],
        ["\u00C3\u00A2", "\u00E2"],
        ["\u00C3\u00A3", "\u00E3"],
        ["\u00C3\u00A9", "\u00E9"],
        ["\u00C3\u00AA", "\u00EA"],
        ["\u00C3\u00AD", "\u00ED"],
        ["\u00C3\u00B3", "\u00F3"],
        ["\u00C3\u00B4", "\u00F4"],
        ["\u00C3\u00B5", "\u00F5"],
        ["\u00C3\u00BA", "\u00FA"],
        ["\u00C3\u00A7", "\u00E7"],
        ["\u00C3\u0081", "\u00C1"],
        ["\u00C3\u0089", "\u00C9"],
        ["\u00C3\u0093", "\u00D3"],
        ["\u00C3\u0087", "\u00C7"],
        ["\u00C2\u00BA", "\u00BA"],
        ["\u00C2\u00AA", "\u00AA"],
        ["\u00E2\u20AC\u2122", "'"],
        ["\u00E2\u20AC\u0153", "\""],
        ["\u00E2\u20AC\u009D", "\""],
        ["\u00E2\u20AC\u00A2", "\u2022"],
        ["\u00E2\u20AC\u201D", "\u2014"],
        ["\u00E2\u20AC\u201C", "\u2013"]
    ];

    let resultado = String(texto || "");
    let anterior = "";

    while (resultado !== anterior) {
        anterior = resultado;
        mapa.forEach(([origem, destino]) => {
            resultado = resultado.split(origem).join(destino);
        });
    }

    return resultado;
}

function escaparHtml(valor) {
    return corrigirMojibakeDVC(valor)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function safeEditParam(valor) {
    return String(valor || "")
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'")
        .replace(/"/g, "&quot;")
        .replace(/\n/g, " ")
        .replace(/\r/g, " ");
}

// 2. Normalization functions
function normalizarEmailDVC(email = "") {
    return String(email || "").trim().toLowerCase();
}

function normalizarIdFinanceiro(valor) {
    return String(valor || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9._-]+/g, "_")
        .replace(/^_+|_+$/g, "");
}

function normalizarBuscaDVC(valor = "") {
    return String(valor || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function normalizarTextoFinanceiro(valor) {
    return String(valor || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function normalizarFuncaoTecnica(valor) {
    return String(valor || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function normalizarEmailIdDVC(valor = "") {
    return String(valor || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "") || "sem_email";
}

function normalizarEmailChamadaDVC(email = "") {
    return String(email || "").trim().toLowerCase();
}

function normalizarTextoRankingDVC(valor = "") {
    return String(valor || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function normalizarGeneroRankingDvc(user = {}) {
    const raw = normalizarTextoRankingDVC(user.sexo || user.genero || user.gender || "");

    if (raw === "m" || raw.includes("masc") || raw.includes("homem") || raw.includes("male")) {
        return "masculino";
    }

    if (raw === "f" || raw.includes("fem") || raw.includes("mulher") || raw.includes("female")) {
        return "feminino";
    }

    return raw ? "outro" : "nao_informado";
}

function normalizarCategoriaRankingDvc(user = {}) {
    const categoria = calcularCategoriaEtariaDVC(user);
    if (categoria === "Adulto") return "adulto";
    if (categoria === "Sub-17") return "sub17";
    return "sem_categoria";
}

function normalizarFuncaoVoleiRankingDvc(user = {}) {
    const raw = normalizarTextoRankingDVC(user.funcaoVolei || user.posicaoVolei || user.posicao || user.funcaoVoleiDVC || "");

    if (raw.includes("levant")) return "levantador";
    if (raw.includes("oposto")) return "oposto";
    if (raw.includes("ponteir") || raw === "ponta") return "ponteiro";
    if (raw.includes("central") || raw.includes("meio")) return "central";
    if (raw.includes("libero") || raw.includes("lbero")) return "libero";
    if (raw.includes("universal")) return "universal";
    if (raw.includes("forma") || raw.includes("iniciante")) return "formacao";

    return "formacao";
}

function normalizarSexoSorteioTreino(sexo) {
    const s = String(sexo || "").trim().toUpperCase();
    if (s === "M" || s.includes("MASC")) return "M";
    if (s === "F" || s.includes("FEM")) return "F";
    return "N/I";
}

function normalizarFuncaoVoleiSorteio(valor) {
    const bruto = String(valor || "").trim();
    const normalizado = normalizarFuncaoTecnica(bruto).replace(/\s+/g, "");

    const funcao = FUNCOES_VOLEI_DVC.find(item => {
        const id = normalizarFuncaoTecnica(item.id).replace(/\s+/g, "");
        const nome = normalizarFuncaoTecnica(item.nome).replace(/\s+/g, "");
        return id === normalizado || nome === normalizado;
    });

    return funcao ? funcao.id : "formacao";
}

function normalizarStatusJogoTreinoDVC(status = "") {
    return String(status || "Pendente")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
}

function normalizarMesAnoParaValor(mesAno) {
    const mapaMeses = {
        "Janeiro": 0,
        "Fevereiro": 1,
        "Março": 2,
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

    const [mesNome, ano] = mesAno.split("/");
    return Number(ano) * 12 + mapaMeses[mesNome];
}

// 3. Formatting functions
function formatarDataHoraFinanceira(dataIso) {
    if (!dataIso) return "Sem registro";
    const data = new Date(dataIso);
    if (isNaN(data.getTime())) return "Sem registro";
    return data.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function formatarÚltimoAcesso(dataIso) {
    if (!dataIso) return "Nunca acessou";

    const data = new Date(dataIso);

    if (isNaN(data.getTime())) return "Sem registro";

    const agora = new Date();
    const diffMs = agora - data;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHoras = Math.floor(diffMin / 60);
    const diffDias = Math.floor(diffHoras / 24);

    if (diffMin < 1) return "Agora mesmo";
    if (diffMin < 60) return `há ${diffMin} min`;
    if (diffHoras < 24) return `há ${diffHoras}h`;
    if (diffDias === 1) return "ontem";
    if (diffDias < 7) return `há ${diffDias} dias`;

    return data.toLocaleDateString("pt-BR");
}

function formatarDataChaveFinanceira(data) {
    return [
        data.getFullYear(),
        String(data.getMonth() + 1).padStart(2, "0"),
        String(data.getDate()).padStart(2, "0")
    ].join("-");
}

function formatarDataCurtaFinanceira(data) {
    return data.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
}

function obterDataSeguraDVC(valor) {
    if (!valor) return null;

    try {
        if (valor instanceof Date) {
            return isNaN(valor.getTime()) ? null : valor;
        }

        if (valor && typeof valor.toDate === "function") {
            const data = valor.toDate();
            return isNaN(data.getTime()) ? null : data;
        }

        if (valor && typeof valor.seconds === "number") {
            const data = new Date(valor.seconds * 1000);
            return isNaN(data.getTime()) ? null : data;
        }

        if (typeof valor === "number") {
            const data = new Date(valor);
            return isNaN(data.getTime()) ? null : data;
        }

        if (typeof valor === "string") {
            const texto = valor.trim();
            if (!texto) return null;

            const data = new Date(texto);
            return isNaN(data.getTime()) ? null : data;
        }

        return null;
    } catch (e) {
        console.warn("[DVC Avaliacoes] Data invalida no historico:", valor, e);
        return null;
    }
}

function obterTimestampDataSeguraDVC(valor) {
    const data = obterDataSeguraDVC(valor);
    return data ? data.getTime() : 0;
}

function formatarDataSeguraDVC(valor, fallback = "Data não registrada", opcoes = {}) {
    const data = obterDataSeguraDVC(valor);

    if (!data) return fallback;

    const { incluirHora = false, ...formatacao } = opcoes || {};

    if (incluirHora) {
        const formato = Object.keys(formatacao).length
            ? formatacao
            : { dateStyle: "short", timeStyle: "short" };
        return data.toLocaleString("pt-BR", formato);
    }

    return data.toLocaleDateString("pt-BR", formatacao);
}

function formatarPontuacaoRankingDVC(valor, tipo = "tecnico", oculto = false) {
    if (oculto) return "Oculto";
    if (valor === null || valor === undefined || Number.isNaN(Number(valor))) return "Sem dados";

    const numero = Number(valor);
    if (tipo === "tecnico") return numero.toFixed(1);
    if (tipo === "evolucao") return numero > 0 ? `+${numero.toFixed(1)}` : numero.toFixed(1);
    if (Number.isInteger(numero)) return String(numero);
    return numero.toFixed(1);
}

function formatarContatoFinanceiro(user) {
    const nome = user.nome || "Sem nome";
    const whatsAluno = user.telefone || "Não informado";
    const whatsResponsavel = user.responsavelTel && user.responsavelTel !== "N/A"
        ? user.responsavelTel
        : "Não informado";

return `${nome}
  WhatsApp atleta: ${whatsAluno}
  WhatsApp responsável: ${whatsResponsavel}
  Financeiro: ${typeof window.obterStatusFinanceiroEfetivo === "function" ? window.obterStatusFinanceiroEfetivo(user) : user.financeiro}
  Último mês regular: ${user.mesFinanceiro || "Não registrado"}`;
}

function getValorNumericoPlacarTreino(valor) {
    if (valor === null || valor === undefined || valor === "") return null;
    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : null;
}

function formatarPlacarTreino(rodada) {
    const pontosA = getValorNumericoPlacarTreino(rodada?.pontosA);
    const pontosB = getValorNumericoPlacarTreino(rodada?.pontosB);

    if (pontosA === null || pontosB === null) return "Sem placar";

    return `${pontosA} x ${pontosB}`;
}

// 4. Date calculations & Caret Calculations
function obterDataCadastroUsuario(user = {}) {
    const bruto = user?.criadoEm || user?.cadastroCriadoEm || user?.createdAt || "";

    if (!bruto) return null;

    if (bruto instanceof Date) {
        return isNaN(bruto.getTime()) ? null : bruto;
    }

    if (typeof bruto?.toDate === "function") {
        const data = bruto.toDate();
        return isNaN(data.getTime()) ? null : data;
    }

    if (typeof bruto === "object" && typeof bruto.seconds === "number") {
        const data = new Date(bruto.seconds * 1000);
        return isNaN(data.getTime()) ? null : data;
    }

    const data = new Date(bruto);
    return isNaN(data.getTime()) ? null : data;
}

function obterFimCarenciaPorDataCadastro(dataCadastro) {
    if (!(dataCadastro instanceof Date) || isNaN(dataCadastro.getTime())) {
        return null;
    }

    if (dataCadastro.getDate() < DIA_INICIO_CARENCIA_CADASTRO_FIM_MES) {
        return null;
    }

    return new Date(
        dataCadastro.getFullYear(),
        dataCadastro.getMonth() + 1,
        DIA_LIMITE_FINANCEIRO_MENSAL,
        23,
        59,
        59,
        999
    );
}

function obterFimCarenciaManual(dataReferencia = new Date()) {
    const data = dataReferencia instanceof Date ? dataReferencia : new Date(dataReferencia);

    return new Date(
        data.getFullYear(),
        data.getMonth() + 1,
        DIA_LIMITE_FINANCEIRO_MENSAL,
        23,
        59,
        59,
        999
    );
}

function normalizarDataFimCarencia(valor) {
    if (!valor) return null;

    if (valor instanceof Date) {
        return isNaN(valor.getTime()) ? null : valor;
    }

    if (typeof valor?.toDate === "function") {
        const data = valor.toDate();
        return isNaN(data.getTime()) ? null : data;
    }

    if (typeof valor === "object" && typeof valor.seconds === "number") {
        const data = new Date(valor.seconds * 1000);
        return isNaN(data.getTime()) ? null : data;
    }

    if (typeof valor === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valor)) {
        const [ano, mes, dia] = valor.split("-").map(Number);
        return new Date(ano, mes - 1, dia, 23, 59, 59, 999);
    }

    const data = new Date(valor);
    return isNaN(data.getTime()) ? null : data;
}

function obterDadosCarenciaCadastro(user = {}, dataReferencia = new Date()) {
    if (user?.carenciaCadastroEncerrada === true) {
        return { ativa: false, fim: null, ate: "", label: "" };
    }

    const fimSalvo = normalizarDataFimCarencia(user?.carenciaCadastroAte);
    const fimPorCadastro = obterFimCarenciaPorDataCadastro(obterDataCadastroUsuario(user));
    const fim = fimSalvo || fimPorCadastro;

    if (!fim) {
        return { ativa: false, fim: null, ate: "", label: "" };
    }

    const agora = dataReferencia instanceof Date ? dataReferencia : new Date(dataReferencia);

    return {
        ativa: agora <= fim,
        fim,
        ate: formatarDataChaveFinanceira(fim),
        label: formatarDataCurtaFinanceira(fim)
    };
}

function obterDataNascimentoAtletaDVC(user = {}) {
    const nascimento = user.nascimento || user.dataNascimento || user.data_nascimento || user.dtNascimento || user.birthDate || "";

    if (!nascimento) return null;

    if (nascimento instanceof Date) {
        return isNaN(nascimento.getTime()) ? null : nascimento;
    }

    if (typeof nascimento?.toDate === "function") {
        const data = nascimento.toDate();
        return isNaN(data.getTime()) ? null : data;
    }

    if (typeof nascimento === "object" && typeof nascimento.seconds === "number") {
        const data = new Date(nascimento.seconds * 1000);
        return isNaN(data.getTime()) ? null : data;
    }

    const texto = String(nascimento || "").trim();
    let dataNasc = null;

    if (/^\d{4}-\d{2}-\d{2}/.test(texto)) {
        const [ano, mes, dia] = texto.slice(0, 10).split("-").map(Number);
        dataNasc = new Date(ano, mes - 1, dia);
    } else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(texto)) {
        const [dia, mes, ano] = texto.split("/").map(Number);
        dataNasc = new Date(ano, mes - 1, dia);
    } else {
        dataNasc = new Date(texto);
    }

    return dataNasc && !isNaN(dataNasc.getTime()) ? dataNasc : null;
}

function calcularIdadeAtletaDVC(user = {}) {
    const dataNasc = obterDataNascimentoAtletaDVC(user);

    if (!dataNasc) return null;

    const hoje = new Date();
    let idade = hoje.getFullYear() - dataNasc.getFullYear();
    const mesAtual = hoje.getMonth();
    const diaAtual = hoje.getDate();
    const mesNasc = dataNasc.getMonth();
    const diaNasc = dataNasc.getDate();

    if (mesAtual < mesNasc || (mesAtual === mesNasc && diaAtual < diaNasc)) {
        idade--;
    }

    return Number.isFinite(idade) && idade >= 0 ? idade : null;
}

// 5. Badge Rendering functions
function renderBadgeIdadeAtletaDVC(user = {}) {
    const idade = calcularIdadeAtletaDVC(user);

    if (idade === null) {
        return `
            <span class="inline-flex items-center justify-center gap-1 whitespace-nowrap leading-none text-[8px] font-black uppercase px-2.5 py-1 rounded-full bg-gray-50 text-gray-400 border border-gray-100">
                Sem idade
            </span>
        `;
    }

    const adulto = idade >= 18;

    return `
        <span class="inline-flex items-center justify-center gap-1 whitespace-nowrap leading-none text-[8px] font-black uppercase px-2.5 py-1 rounded-full border ${
            adulto
                ? "bg-red-50 text-[#990000] border-red-100"
                : "bg-gray-100 text-gray-500 border-gray-200"
        }">
            ${idade} anos
        </span>
    `;
}

function renderBadgeDVC(texto, tipo = "neutro", extraClasses = "") {
    const estilos = {
        neutro: "bg-gray-50 text-gray-500 border-gray-100",
        vermelho: "bg-red-50 text-[#990000] border-red-100",
        verde: "bg-green-50 text-green-700 border-green-100",
        amarelo: "bg-yellow-50 text-yellow-800 border-yellow-100",
        azul: "bg-blue-50 text-blue-700 border-blue-100",
        rosa: "bg-pink-50 text-pink-700 border-pink-100",
        cinza: "bg-gray-100 text-gray-600 border-gray-200"
    };

    return `
        <span class="inline-flex items-center justify-center gap-1 whitespace-nowrap leading-none rounded-full px-2.5 py-1 text-[8px] font-black uppercase border ${estilos[tipo] || estilos.neutro} ${extraClasses}">
            ${escaparHtml(texto || "")}
        </span>
    `;
}

function renderBadgeGeneroDVC(user = {}) {
    const sexo = String(user.sexo || user.genero || user.gender || "").trim().toUpperCase();

    if (sexo === "M" || sexo === "MASCULINO" || sexo.includes("MASC")) {
        return renderBadgeDVC("Masculino", "azul");
    }

    if (sexo === "F" || sexo === "FEMININO" || sexo.includes("FEM")) {
        return renderBadgeDVC("Feminino", "rosa");
    }

    return renderBadgeDVC("Gênero não informado", "neutro");
}

function renderBadgeCategoriaEtariaDVC(user = {}) {
    const categoria = calcularCategoriaEtariaDVC(user);

    if (categoria === "Adulto") return renderBadgeDVC("Adulto", "vermelho");
    if (categoria === "Sub-17") return renderBadgeDVC("Sub-17", "cinza");

    return renderBadgeDVC("Sem categoria", "neutro");
}

function getNomeFuncaoVoleiDVC(funcaoId) {
    const item = FUNCOES_VOLEI_DVC.find(f => f.id === funcaoId);
    return item ? item.nome : "Em formação";
}

function renderBadgeFuncaoVoleiDVC(user = {}) {
    const funcao = user.funcaoVolei || user.posicaoVolei || user.posicao || "";
    const nomeFuncao = funcao
        ? getNomeFuncaoVoleiDVC(funcao)
        : "";

    return nomeFuncao ? renderBadgeDVC(nomeFuncao, "neutro") : "";
}

function renderBadgesAtletaDVC(user = {}, opcoes = {}) {
    const financeiro = opcoes.financeiro || "";
    const badges = [
        renderBadgeCategoriaEtariaDVC(user),
        renderBadgeGeneroDVC(user),
        renderBadgeIdadeAtletaDVC(user),
        renderBadgeFuncaoVoleiDVC(user)
    ];

    if (financeiro === "Justificado") badges.push(renderBadgeDVC("Justificado", "amarelo"));
    if (financeiro === STATUS_FINANCEIRO_CARENCIA) badges.push(renderBadgeDVC("Carência", "amarelo"));
    if (financeiro === "Inadimplente") badges.push(renderBadgeDVC("Inadimplente", "vermelho"));

    return `
        <div class="flex flex-wrap items-center gap-1 mt-1">
            ${badges.filter(Boolean).join("")}
        </div>
    `;
}

// 6. Skill and score normalization
function normalizarHabilidadesDVC(habilidades = {}) {
    const h = habilidades || {};

    return {
        // Técnicos
        recepcao: Number(h.recepcao ?? h.manchete ?? 3),
        levantamento: Number(h.levantamento ?? h.toque ?? 3),
        ataque: Number(h.ataque ?? 3),
        bloqueio: Number(h.bloqueio ?? 3),
        defesa: Number(h.defesa ?? 3),
        saque: Number(h.saque ?? 3),

        // Táticos
        antecipacao: Number(h.antecipacao ?? h.visaoJogo ?? 3),
        tomadaDecisao: Number(h.tomadaDecisao ?? h.visaoJogo ?? 3),
        leituraJogo: Number(h.leituraJogo ?? h.visaoJogo ?? 3),

        // Soft Skills
        resiliencia: Number(h.resiliencia ?? 3),
        comunicacaoQuadra: Number(h.comunicacaoQuadra ?? h.comunicacao ?? 3),
        trabalhoEquipe: Number(h.trabalhoEquipe ?? 3)
    };
}

function calcularCategoriaEtariaDVC(user = {}) {
    const valorNascimento = obterPrimeiroValorRankingDVC(user, [
        "nascimento",
        "dataNascimento",
        "dtNascimento",
        "data_nascimento",
        "birthDate",
        "nasc"
    ]);

    if (!valorNascimento) return "Sem categoria";

    let anoNascimento = 0;

    if (typeof valorNascimento?.toDate === "function") {
        anoNascimento = valorNascimento.toDate().getFullYear();
    } else if (valorNascimento instanceof Date) {
        anoNascimento = valorNascimento.getFullYear();
    } else {
        const texto = String(valorNascimento).trim();
        const partesIso = texto.match(/^(\d{4})-\d{1,2}-\d{1,2}/);
        const partesBr = texto.match(/^\d{1,2}\/\d{1,2}\/(\d{4})/);
        const apenasAno = texto.match(/^(\d{4})$/);

        if (partesIso) anoNascimento = Number(partesIso[1]);
        else if (partesBr) anoNascimento = Number(partesBr[1]);
        else if (apenasAno) anoNascimento = Number(apenasAno[1]);
        else {
            const data = new Date(texto);
            if (!Number.isNaN(data.getTime())) anoNascimento = data.getFullYear();
        }
    }

    const anoAtual = new Date().getFullYear();

    if (!anoNascimento || anoNascimento < 1900 || anoNascimento > anoAtual) {
        return "Sem categoria";
    }

    return (anoAtual - anoNascimento) >= 18 ? "Adulto" : "Sub-17";
}

function obterPrimeiroValorRankingDVC(user = {}, campos = []) {
    for (const campo of campos) {
        const valor = user?.[campo];
        if (valor !== undefined && valor !== null && valor !== "") {
            return valor;
        }
    }

    return "";
}

function getUnidadeRankingDVC(tipo = "tecnico") {
    if (tipo === "tecnico") return "score";
    if (tipo === "inteligencia") return "pts";
    if (tipo === "presenca") return "presenças";
    if (tipo === "evolucao") return "evolução";
    return "pts";
}

function getMensagemSemDadosRankingDVC(tipo = "tecnico") {
    if (tipo === "presenca") return "Sem dados de presença para este filtro.";
    if (tipo === "evolucao") return "Sem dados de evolução para este filtro.";
    if (tipo === "inteligencia") return "Sem dados de inteligência para este filtro.";
    return "Nenhum atleta avaliado encontrado neste filtro.";
}

function getStatusVisualJogoTreino(status) {
    const s = normalizarStatusJogoTreinoDVC(status);

    if (s === "concluido") {
        return {
            texto: "Concluído",
            classe: "bg-green-50 text-green-700 border-green-100"
        };
    }

    if (s === "cancelado") {
        return {
            texto: "Cancelado",
            classe: "bg-gray-100 text-gray-500 border-gray-200"
        };
    }

    if (s === "em andamento") {
        return {
            texto: "Em andamento",
            classe: "bg-yellow-50 text-yellow-700 border-yellow-100"
        };
    }

    return {
        texto: "Pendente",
        classe: "bg-red-50 text-[#990000] border-red-100"
    };
}

// Global window mappings for full compatibility
window.corrigirMojibakeDVC = corrigirMojibakeDVC;
window.escaparHtml = escaparHtml;
window.safeEditParam = safeEditParam;
window.normalizarEmailDVC = normalizarEmailDVC;
window.normalizarIdFinanceiro = normalizarIdFinanceiro;
window.normalizarBuscaDVC = normalizarBuscaDVC;
window.normalizarTextoFinanceiro = normalizarTextoFinanceiro;
window.normalizarFuncaoTecnica = normalizarFuncaoTecnica;
window.normalizarEmailIdDVC = normalizarEmailIdDVC;
window.normalizarEmailChamadaDVC = normalizarEmailChamadaDVC;
window.normalizarTextoRankingDVC = normalizarTextoRankingDVC;
window.normalizarSexoSorteioTreino = normalizarSexoSorteioTreino;
window.normalizarFuncaoVoleiSorteio = normalizarFuncaoVoleiSorteio;
window.normalizarStatusJogoTreinoDVC = normalizarStatusJogoTreinoDVC;
window.normalizarMesAnoParaValor = normalizarMesAnoParaValor;
window.formatarDataHoraFinanceira = formatarDataHoraFinanceira;
window.formatarÚltimoAcesso = formatarÚltimoAcesso;
window.formatarDataChaveFinanceira = formatarDataChaveFinanceira;
window.formatarDataCurtaFinanceira = formatarDataCurtaFinanceira;
window.obterDataSeguraDVC = obterDataSeguraDVC;
window.obterTimestampDataSeguraDVC = obterTimestampDataSeguraDVC;
window.formatarDataSeguraDVC = formatarDataSeguraDVC;
window.formatarPontuacaoRankingDVC = formatarPontuacaoRankingDVC;
window.formatarContatoFinanceiro = formatarContatoFinanceiro;
window.formatarPlacarTreino = formatarPlacarTreino;
window.getValorNumericoPlacarTreino = getValorNumericoPlacarTreino;
window.obterDataCadastroUsuario = obterDataCadastroUsuario;
window.obterFimCarenciaPorDataCadastro = obterFimCarenciaPorDataCadastro;
window.obterFimCarenciaManual = obterFimCarenciaManual;
window.normalizarDataFimCarencia = normalizarDataFimCarencia;
window.obterDadosCarenciaCadastro = obterDadosCarenciaCadastro;
window.obterDataNascimentoAtletaDVC = obterDataNascimentoAtletaDVC;
window.calcularIdadeAtletaDVC = calcularIdadeAtletaDVC;
window.renderBadgeIdadeAtletaDVC = renderBadgeIdadeAtletaDVC;
window.renderBadgeDVC = renderBadgeDVC;
window.renderBadgeGeneroDVC = renderBadgeGeneroDVC;
window.renderBadgeCategoriaEtariaDVC = renderBadgeCategoriaEtariaDVC;
window.renderBadgeFuncaoVoleiDVC = renderBadgeFuncaoVoleiDVC;
window.renderBadgesAtletaDVC = renderBadgesAtletaDVC;
window.normalizarHabilidadesDVC = normalizarHabilidadesDVC;
window.calcularCategoriaEtariaDVC = calcularCategoriaEtariaDVC;
window.obterPrimeiroValorRankingDVC = obterPrimeiroValorRankingDVC;
window.getUnidadeRankingDVC = getUnidadeRankingDVC;
window.getMensagemSemDadosRankingDVC = getMensagemSemDadosRankingDVC;
window.getStatusVisualJogoTreino = getStatusVisualJogoTreino;
window.getNomeFuncaoVoleiDVC = getNomeFuncaoVoleiDVC;
window.normalizarGeneroRankingDvc = normalizarGeneroRankingDvc;
window.normalizarGeneroRankingDVC = normalizarGeneroRankingDvc;
window.normalizarCategoriaRankingDvc = normalizarCategoriaRankingDvc;
window.normalizarCategoriaRankingDVC = normalizarCategoriaRankingDvc;
window.normalizarFuncaoVoleiRankingDvc = normalizarFuncaoVoleiRankingDvc;
window.normalizarFuncaoVoleiRankingDVC = normalizarFuncaoVoleiRankingDvc;

// Export listings
export {
    corrigirMojibakeDVC,
    escaparHtml,
    safeEditParam,
    normalizarEmailDVC,
    normalizarIdFinanceiro,
    normalizarBuscaDVC,
    normalizarTextoFinanceiro,
    normalizarFuncaoTecnica,
    normalizarEmailIdDVC,
    normalizarEmailChamadaDVC,
    normalizarTextoRankingDVC,
    normalizarSexoSorteioTreino,
    normalizarFuncaoVoleiSorteio,
    normalizarStatusJogoTreinoDVC,
    normalizarMesAnoParaValor,
    formatarDataHoraFinanceira,
    formatarÚltimoAcesso,
    formatarDataChaveFinanceira,
    formatarDataCurtaFinanceira,
    obterDataSeguraDVC,
    obterTimestampDataSeguraDVC,
    formatarDataSeguraDVC,
    formatarPontuacaoRankingDVC,
    formatarContatoFinanceiro,
    formatarPlacarTreino,
    getValorNumericoPlacarTreino,
    obterDataCadastroUsuario,
    obterFimCarenciaPorDataCadastro,
    obterFimCarenciaManual,
    normalizarDataFimCarencia,
    obterDadosCarenciaCadastro,
    obterDataNascimentoAtletaDVC,
    calcularIdadeAtletaDVC,
    renderBadgeIdadeAtletaDVC,
    renderBadgeDVC,
    renderBadgeGeneroDVC,
    renderBadgeCategoriaEtariaDVC,
    renderBadgeFuncaoVoleiDVC,
    renderBadgesAtletaDVC,
    normalizarHabilidadesDVC,
    calcularCategoriaEtariaDVC,
    obterPrimeiroValorRankingDVC,
    getUnidadeRankingDVC,
    getMensagemSemDadosRankingDVC,
    getStatusVisualJogoTreino,
    getNomeFuncaoVoleiDVC,
    normalizarGeneroRankingDvc,
    normalizarCategoriaRankingDvc,
    normalizarFuncaoVoleiRankingDvc
};
