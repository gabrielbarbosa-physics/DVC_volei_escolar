// CONFIGURACAO GLOBAL E ESTADO COMPARTILHADO DVC

const PROJETO_ATUAL_DVC = {
    id: "dvc",
    nome: "DVC",
    selo: "DVC",
    logo: "Loki2.png",
    logoFundoEscuro: "Loki2.png",
    logoFundoClaro: "Loki1.png"
};

const COLECAO_CONTRIBUICOES_GLOBAIS = "contribuicoesGlobais";

const EMAILS_ADM_DVC = [
    "gabriel0barbosa0@gmail.com",
    "christianhpo@gmail.com"
];

const DIA_INICIO_CARENCIA_CADASTRO_FIM_MES = 25;
const DIA_LIMITE_FINANCEIRO_MENSAL = 10;
const STATUS_FINANCEIRO_CARENCIA = "Car\u00eancia";

const FUNCOES_VOLEI_DVC = [
    { id: "formacao", nome: "Em formação" },
    { id: "levantador", nome: "Levantador" },
    { id: "oposto", nome: "Oposto" },
    { id: "ponteiro", nome: "Ponteiro" },
    { id: "central", nome: "Central" },
    { id: "libero", nome: "Líbero" },
    { id: "universal", nome: "Universal" }
];

const PESOS_FUNCAO_VOLEI_DVC = {
    formacao: {},
    universal: {},

    levantador: {
        levantamento: 2.0,
        tomadaDecisao: 1.8,
        leituraJogo: 1.6,
        comunicacaoQuadra: 1.5,
        antecipacao: 1.3,
        defesa: 1.2,
        saque: 1.0
    },

    oposto: {
        ataque: 2.0,
        saque: 1.5,
        bloqueio: 1.4,
        tomadaDecisao: 1.3,
        resiliencia: 1.3,
        defesa: 1.0
    },

    ponteiro: {
        recepcao: 1.8,
        ataque: 1.8,
        defesa: 1.5,
        saque: 1.3,
        comunicacaoQuadra: 1.2,
        trabalhoEquipe: 1.2
    },

    central: {
        bloqueio: 2.0,
        ataque: 1.7,
        leituraJogo: 1.5,
        antecipacao: 1.4,
        saque: 1.0,
        comunicacaoQuadra: 1.0
    },

    libero: {
        recepcao: 2.0,
        defesa: 2.0,
        antecipacao: 1.6,
        comunicacaoQuadra: 1.5,
        resiliencia: 1.3,
        levantamento: 1.0
    }
};

// Mutable states
let currentUserData = null;
let editingEventId = null;
let modoTestePerfilEmail = null;
let modoTestePerfilNome = null;
let subAbaPerfilAtiva = 'habilidades';

// Initialize caches
window.DVC_CACHE = window.DVC_CACHE || {
    users: { dados: null, porEmail: null, atualizadoEm: 0, ttl: 5 * 60 * 1000 },
    events: { dados: null, porId: null, atualizadoEm: 0, ttl: 3 * 60 * 1000 },
    presencasPorEvento: {},
    convocadosPorEvento: {},
    historicoHabilidadesPorAtleta: {},
    contribuicoesPorAtleta: {},
    acessosPorAtleta: {},
    avaliacoesPares: {},
    autoAvaliacoes: {},
    avaliacoesEquipeTecnica: {}
};
const DVC_CACHE = window.DVC_CACHE;

const AppCache = {
    atletas: null,
    contribuicoes: null,
    eventos: null,
    ultimasAvaliacoes: null,
    avisos: null,
    avaliacoesEquipeTecnica: null
};
window.AppCache = AppCache;

// Setup getters and setters on window for seamless compatibility
Object.defineProperty(window, 'currentUserData', {
    get() { return currentUserData; },
    set(val) { currentUserData = val; },
    configurable: true
});

Object.defineProperty(window, 'editingEventId', {
    get() { return editingEventId; },
    set(val) { editingEventId = val; },
    configurable: true
});

Object.defineProperty(window, 'modoTestePerfilEmail', {
    get() { return modoTestePerfilEmail; },
    set(val) { modoTestePerfilEmail = val; },
    configurable: true
});

Object.defineProperty(window, 'modoTestePerfilNome', {
    get() { return modoTestePerfilNome; },
    set(val) { modoTestePerfilNome = val; },
    configurable: true
});

Object.defineProperty(window, 'subAbaPerfilAtiva', {
    get() { return subAbaPerfilAtiva; },
    set(val) { subAbaPerfilAtiva = val; },
    configurable: true
});

// Attach constants to window
window.PROJETO_ATUAL_DVC = PROJETO_ATUAL_DVC;
window.COLECAO_CONTRIBUICOES_GLOBAIS = COLECAO_CONTRIBUICOES_GLOBAIS;
window.EMAILS_ADM_DVC = EMAILS_ADM_DVC;
window.DIA_INICIO_CARENCIA_CADASTRO_FIM_MES = DIA_INICIO_CARENCIA_CADASTRO_FIM_MES;
window.DIA_LIMITE_FINANCEIRO_MENSAL = DIA_LIMITE_FINANCEIRO_MENSAL;
window.STATUS_FINANCEIRO_CARENCIA = STATUS_FINANCEIRO_CARENCIA;
window.FUNCOES_VOLEI_DVC = FUNCOES_VOLEI_DVC;
window.PESOS_FUNCAO_VOLEI_DVC = PESOS_FUNCAO_VOLEI_DVC;

// Export statements
export {
    PROJETO_ATUAL_DVC,
    COLECAO_CONTRIBUICOES_GLOBAIS,
    EMAILS_ADM_DVC,
    DIA_INICIO_CARENCIA_CADASTRO_FIM_MES,
    DIA_LIMITE_FINANCEIRO_MENSAL,
    STATUS_FINANCEIRO_CARENCIA,
    FUNCOES_VOLEI_DVC,
    PESOS_FUNCAO_VOLEI_DVC,
    DVC_CACHE,
    AppCache,
    currentUserData,
    editingEventId,
    modoTestePerfilEmail,
    modoTestePerfilNome,
    subAbaPerfilAtiva
};
