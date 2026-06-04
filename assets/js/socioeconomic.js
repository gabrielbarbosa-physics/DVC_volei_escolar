/**
 * ============================================================================
 * Módulo: SOCIOECONOMIC
 * ============================================================================
 * Responsabilidade: Gerencia funcionalidades relacionadas a socioeconomic.
 * Este arquivo faz parte do sistema modular do DVC App.
 * Todos os códigos principais aqui agrupados seguem as diretrizes do projeto.
 * ============================================================================
 */

// js/socioeconomic.js
// Atualizacao obrigatoria de dados socioeconomicos DVC

import {
    auth,
    db,
    doc,
    updateDoc,
    serverTimestamp
} from "./firebase.js";

const SOCIOECONOMICO_VERSAO_DVC = "2026-06-editais-v1";

let etapaSocioeconomicaDVC = 1;
let dadosSocioeconomicosRascunhoDVC = {};

const OPCOES_SOCIOECONOMICAS_DVC = {
    racaCor: ["Preta", "Parda", "Branca", "Amarela", "Indígena", "Outra", "Prefiro não informar"],
    bairro: [
        "Barreiro",
        "Santa Efigênia",
        "Floresta",
        "Centro",
        "Horto",
        "Santa Tereza",
        "Sagrada Família",
        "União",
        "Cidade Nova",
        "São Gabriel",
        "Venda Nova",
        "Pampulha",
        "Contagem",
        "Betim",
        "Ribeirão das Neves",
        "Ibirité",
        "Sabará",
        "Outro bairro / Outra cidade",
        "Prefiro não informar"
    ],
    regional: [
        "Barreiro",
        "Centro-Sul",
        "Leste",
        "Nordeste",
        "Noroeste",
        "Norte",
        "Oeste",
        "Pampulha",
        "Venda Nova",
        "Outra cidade / Região metropolitana",
        "Prefiro não informar"
    ],
    vinculoDvc: ["Atleta", "Ex-aluno", "Voluntário"],
    faixaRendaFamiliar: [
        "Até 1 salário mínimo",
        "De 1 a 2 salários mínimos",
        "De 2 a 3 salários mínimos",
        "Acima de 3 salários mínimos",
        "Sem renda fixa",
        "Prefiro não informar"
    ],
    beneficiarioProgramaSocial: ["Sim", "Não", "Não sei informar", "Prefiro não informar"],
    programaSocial: ["Bolsa Família", "BPC/LOAS", "Auxílio municipal/estadual", "Outro", "Não se aplica"],
    quantidadePessoasCasa: ["1", "2", "3", "4", "5 ou mais", "Prefiro não informar"],
    tipoEscola: [
        "Pública Estadual",
        "Pública Municipal",
        "Particular com bolsa",
        "Particular sem bolsa",
        "Não estuda",
        "Prefiro não informar"
    ],
    situacaoEscolarAdulto: [
        "Estuda atualmente",
        "Não estuda",
        "Ensino Médio concluído",
        "Cursa Ensino Técnico",
        "Cursa Ensino Superior",
        "Prefiro não informar"
    ]
};

function escaparSocioDVC(valor = "") {
    if (typeof window.escaparHtml === "function") {
        return window.escaparHtml(valor);
    }

    return String(valor)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function usuarioPrecisaAtualizacaoSocioeconomicaDVC(user = window.currentUserData) {
    if (!user) return false;

    return user.socioeconomicoAtualizado !== true ||
        user.socioeconomicoVersao !== SOCIOECONOMICO_VERSAO_DVC;
}

function obterIdadeSocioeconomicaDVC(user = window.currentUserData) {
    const nascimento = user?.nascimento || user?.dataNascimento || "";
    if (!nascimento) return null;

    const data = new Date(nascimento);
    if (Number.isNaN(data.getTime())) return null;

    const hoje = new Date();
    let idade = hoje.getFullYear() - data.getFullYear();
    const mes = hoje.getMonth() - data.getMonth();
    if (mes < 0 || (mes === 0 && hoje.getDate() < data.getDate())) idade--;

    return idade;
}

function usuarioEhSub17OuMenorDVC(user = window.currentUserData) {
    const categoria = String(user?.categoria || user?.categoriaEtaria || "").toLowerCase();
    if (categoria.includes("sub17") || categoria.includes("sub-17")) return true;

    const idade = obterIdadeSocioeconomicaDVC(user);
    return idade !== null && idade < 18;
}

function normalizarBairroDVC(valor = "") {
    const texto = String(valor || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[.,/]/g, " ")
        .replace(/\s+/g, " ");

    if (!texto) return "";

    const aliases = {
        "b barreiro": "barreiro",
        "bairro barreiro": "barreiro",
        "sta efigenia": "santa efigenia",
        "sta efig": "santa efigenia",
        "s efigenia": "santa efigenia",
        "santa efigenia": "santa efigenia",
        "sta tereza": "santa tereza",
        "s tereza": "santa tereza",
        "santa teresa": "santa tereza",
        "sagrada familia": "sagrada familia",
        "sao gabriel": "sao gabriel",
        "ribeirao das neves": "ribeirao das neves",
        "ibirite": "ibirite",
        "sabara": "sabara",
        "prefiro nao informar": "prefiro nao informar",
        "outro bairro outra cidade": "outro bairro outra cidade"
    };

    return aliases[texto] || texto;
}

function obterBairroPadronizadoDVC(valor = "") {
    const normalizado = normalizarBairroDVC(valor);
    const encontrado = OPCOES_SOCIOECONOMICAS_DVC.bairro.find(opcao => normalizarBairroDVC(opcao) === normalizado);
    return encontrado || String(valor || "").trim();
}

function valorCampoSocioDVC(id) {
    return String(document.getElementById(id)?.value || "").trim();
}

function valorRascunhoSocioDVC(chave) {
    const valorRascunho = dadosSocioeconomicosRascunhoDVC[chave];
    if (valorRascunho !== undefined && valorRascunho !== null) return String(valorRascunho);

    const valorUsuario = window.currentUserData?.[chave];
    return valorUsuario !== undefined && valorUsuario !== null ? String(valorUsuario) : "";
}

function atualizarRascunhoSocioeconomicoDVC() {
    const mapaCampos = {
        racaCor: "socio-racaCor",
        bairro: "socio-bairro",
        bairroOutro: "socio-bairro-outro",
        regional: "socio-regional",
        vinculoDvc: "socio-vinculoDvc",
        tipoEscola: "socio-tipoEscola",
        nomeEscola: "socio-nomeEscola",
        anoSerie: "socio-anoSerie",
        situacaoEscolarAdulto: "socio-situacaoEscolarAdulto",
        faixaRendaFamiliar: "socio-faixaRendaFamiliar",
        beneficiarioProgramaSocial: "socio-beneficiarioProgramaSocial",
        programaSocial: "socio-programaSocial",
        quantidadePessoasCasa: "socio-quantidadePessoasCasa"
    };

    Object.entries(mapaCampos).forEach(([chave, id]) => {
        const campo = document.getElementById(id);
        if (campo) dadosSocioeconomicosRascunhoDVC[chave] = String(campo.value || "").trim();
    });
}

function getEstadoBairroSocioDVC() {
    const bairroAtual = valorRascunhoSocioDVC("bairro");
    const bairroOutroAtual = valorRascunhoSocioDVC("bairroOutro");
    const normalizadoAtual = normalizarBairroDVC(bairroAtual);
    const opcaoExistente = OPCOES_SOCIOECONOMICAS_DVC.bairro.find(opcao => normalizarBairroDVC(opcao) === normalizadoAtual);

    if (opcaoExistente) {
        return {
            selecionado: opcaoExistente,
            outro: bairroOutroAtual
        };
    }

    if (bairroAtual) {
        return {
            selecionado: "Outro bairro / Outra cidade",
            outro: bairroOutroAtual || bairroAtual
        };
    }

    return {
        selecionado: "",
        outro: bairroOutroAtual
    };
}

function renderSelectSocioDVC(id, label, opcoes, valor = "") {
    return `
        <label class="block">
            <span class="block text-[9px] font-black uppercase text-gray-500 mb-1.5">${escaparSocioDVC(label)}</span>
            <select id="${escaparSocioDVC(id)}" class="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-xs font-bold text-gray-700 outline-none focus:border-[#990000]">
                <option value="">Selecione</option>
                ${opcoes.map(opcao => `
                    <option value="${escaparSocioDVC(opcao)}" ${valor === opcao ? "selected" : ""}>
                        ${escaparSocioDVC(opcao)}
                    </option>
                `).join("")}
            </select>
        </label>
    `;
}

function renderInputSocioDVC(id, label, valor = "", placeholder = "") {
    return `
        <label class="block">
            <span class="block text-[9px] font-black uppercase text-gray-500 mb-1.5">${escaparSocioDVC(label)}</span>
            <input id="${escaparSocioDVC(id)}" value="${escaparSocioDVC(valor)}" placeholder="${escaparSocioDVC(placeholder)}" class="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-xs font-bold text-gray-700 outline-none focus:border-[#990000]">
        </label>
    `;
}

function renderBairroSocioDVC() {
    const estado = getEstadoBairroSocioDVC();
    const mostrarOutro = estado.selecionado === "Outro bairro / Outra cidade";

    return `
        <div class="space-y-2">
            <label class="block">
                <span class="block text-[9px] font-black uppercase text-gray-500 mb-1.5">Bairro de residência</span>
                <select id="socio-bairro" onchange="atualizarCampoBairroOutroDVC()" class="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-xs font-bold text-gray-700 outline-none focus:border-[#990000]">
                    <option value="">Selecione</option>
                    ${OPCOES_SOCIOECONOMICAS_DVC.bairro.map(opcao => `
                        <option value="${escaparSocioDVC(opcao)}" ${estado.selecionado === opcao ? "selected" : ""}>
                            ${escaparSocioDVC(opcao)}
                        </option>
                    `).join("")}
                </select>
            </label>
            <label id="box-socio-bairro-outro" class="${mostrarOutro ? "block" : "hidden"}">
                <span class="block text-[9px] font-black uppercase text-gray-500 mb-1.5">Informe o bairro ou cidade</span>
                <input id="socio-bairro-outro" value="${escaparSocioDVC(estado.outro)}" placeholder="Ex.: Santa Efigênia, Contagem" class="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-xs font-bold text-gray-700 outline-none focus:border-[#990000]">
            </label>
        </div>
    `;
}

function atualizarCampoBairroOutroDVC() {
    const select = document.getElementById("socio-bairro");
    const boxOutro = document.getElementById("box-socio-bairro-outro");
    const inputOutro = document.getElementById("socio-bairro-outro");
    const mostrarOutro = select?.value === "Outro bairro / Outra cidade";

    if (boxOutro) boxOutro.classList.toggle("hidden", !mostrarOutro);
    if (boxOutro) boxOutro.classList.toggle("block", mostrarOutro);
    if (!mostrarOutro && inputOutro) inputOutro.value = "";
}

function renderIntroSocioDVC() {
    return `
        <div class="bg-red-50 border border-red-100 rounded-2xl p-3 text-left mb-4">
            <p class="text-[10px] font-black uppercase text-[#990000] mb-2">
                Queremos conhecer melhor a nossa comunidade
            </p>
            <div class="space-y-2 text-[10px] font-semibold leading-relaxed text-gray-600">
                <p>O DVC é mais do que um projeto esportivo. Nosso trabalho também busca ampliar oportunidades, fortalecer vínculos, apoiar trajetórias escolares e valorizar o protagonismo de cada participante.</p>
                <p>Estamos atualizando algumas informações sociais, educacionais e territoriais para compreender melhor quem faz parte do projeto e buscar editais, parcerias e apoios que fortaleçam o DVC.</p>
                <p>As informações serão usadas de forma responsável, para organização interna, acompanhamento, prestação de contas e relatórios. Sempre que possível, os dados serão apresentados de forma coletiva.</p>
                <p>Algumas perguntas são pessoais. Você poderá escolher “Prefiro não informar” quando não se sentir confortável.</p>
            </div>
        </div>
    `;
}

function renderEtapaSocioeconomicaDVC(etapa) {
    const user = window.currentUserData || {};
    const menor = usuarioEhSub17OuMenorDVC(user);

    if (etapa === 1) {
        return `
            ${renderIntroSocioDVC()}
            <div class="space-y-3">
                ${renderSelectSocioDVC("socio-racaCor", "Raça/Cor - autodeclaração", OPCOES_SOCIOECONOMICAS_DVC.racaCor, valorRascunhoSocioDVC("racaCor"))}
                ${renderBairroSocioDVC()}
                ${renderSelectSocioDVC("socio-regional", "Regional de residência", OPCOES_SOCIOECONOMICAS_DVC.regional, valorRascunhoSocioDVC("regional"))}
            </div>
        `;
    }

    if (etapa === 2) {
        const escolarHtml = menor ? `
            ${renderSelectSocioDVC("socio-tipoEscola", "Tipo de escola", OPCOES_SOCIOECONOMICAS_DVC.tipoEscola, valorRascunhoSocioDVC("tipoEscola"))}
            ${renderInputSocioDVC("socio-nomeEscola", "Nome da escola", valorRascunhoSocioDVC("nomeEscola"), "Nome da instituição")}
            ${renderInputSocioDVC("socio-anoSerie", "Ano/Série atual", valorRascunhoSocioDVC("anoSerie"), "Ex.: 8º ano, 1º ano EM")}
        ` : `
            ${renderSelectSocioDVC("socio-situacaoEscolarAdulto", "Situação escolar atual", OPCOES_SOCIOECONOMICAS_DVC.situacaoEscolarAdulto, valorRascunhoSocioDVC("situacaoEscolarAdulto"))}
        `;

        return `
            <div class="bg-gray-50 border border-gray-100 rounded-2xl p-3 mb-4">
                <p class="text-[10px] font-bold text-gray-500 leading-relaxed">
                    Essas informações ajudam o DVC a acompanhar trajetórias escolares e construir parcerias mais conectadas com a realidade do grupo.
                </p>
            </div>
            <div class="space-y-3">
                ${renderSelectSocioDVC("socio-vinculoDvc", "Vínculo com o DVC", OPCOES_SOCIOECONOMICAS_DVC.vinculoDvc, valorRascunhoSocioDVC("vinculoDvc"))}
                ${escolarHtml}
            </div>
        `;
    }

    return `
        <div class="bg-gray-50 border border-gray-100 rounded-2xl p-3 mb-4">
            <p class="text-[10px] font-bold text-gray-500 leading-relaxed">
                Responda no seu ritmo. “Prefiro não informar” é uma resposta válida para campos sensíveis.
            </p>
        </div>
        <div class="space-y-3">
            ${renderSelectSocioDVC("socio-faixaRendaFamiliar", "Faixa de renda familiar estimada", OPCOES_SOCIOECONOMICAS_DVC.faixaRendaFamiliar, valorRascunhoSocioDVC("faixaRendaFamiliar"))}
            ${renderSelectSocioDVC("socio-beneficiarioProgramaSocial", "Beneficiário de programa social", OPCOES_SOCIOECONOMICAS_DVC.beneficiarioProgramaSocial, valorRascunhoSocioDVC("beneficiarioProgramaSocial"))}
            ${renderSelectSocioDVC("socio-programaSocial", "Qual programa social, se houver", OPCOES_SOCIOECONOMICAS_DVC.programaSocial, valorRascunhoSocioDVC("programaSocial"))}
            ${renderSelectSocioDVC("socio-quantidadePessoasCasa", "Com quantas pessoas você mora?", OPCOES_SOCIOECONOMICAS_DVC.quantidadePessoasCasa, valorRascunhoSocioDVC("quantidadePessoasCasa"))}
        </div>
    `;
}

function atualizarModalSocioeconomicoDVC() {
    const etapaEl = document.getElementById("socio-etapa-conteudo-dvc");
    const progressoEl = document.getElementById("socio-progresso-dvc");
    const voltarBtn = document.getElementById("btn-socio-voltar-dvc");
    const continuarBtn = document.getElementById("btn-socio-continuar-dvc");
    const salvarBtn = document.getElementById("btn-socio-salvar-dvc");

    if (etapaEl) etapaEl.innerHTML = renderEtapaSocioeconomicaDVC(etapaSocioeconomicaDVC);
    if (progressoEl) progressoEl.textContent = `Etapa ${etapaSocioeconomicaDVC} de 3`;
    if (voltarBtn) voltarBtn.classList.toggle("hidden", etapaSocioeconomicaDVC === 1);
    if (continuarBtn) continuarBtn.classList.toggle("hidden", etapaSocioeconomicaDVC === 3);
    if (salvarBtn) salvarBtn.classList.toggle("hidden", etapaSocioeconomicaDVC !== 3);
}

function validarEtapaSocioeconomicaDVC(etapa) {
    const menor = usuarioEhSub17OuMenorDVC();
    const camposPorEtapa = {
        1: ["socio-racaCor", "socio-bairro", "socio-regional"],
        2: menor
            ? ["socio-vinculoDvc", "socio-tipoEscola", "socio-nomeEscola", "socio-anoSerie"]
            : ["socio-vinculoDvc", "socio-situacaoEscolarAdulto"],
        3: [
            "socio-faixaRendaFamiliar",
            "socio-beneficiarioProgramaSocial",
            "socio-programaSocial",
            "socio-quantidadePessoasCasa"
        ]
    };

    const faltante = (camposPorEtapa[etapa] || []).find(id => !valorCampoSocioDVC(id));
    if (faltante) {
        alert("Preencha os campos desta etapa antes de continuar. Você pode escolher “Prefiro não informar” quando disponível.");
        document.getElementById(faltante)?.focus();
        return false;
    }

    if (etapa === 1 && valorCampoSocioDVC("socio-bairro") === "Outro bairro / Outra cidade" && !valorCampoSocioDVC("socio-bairro-outro")) {
        alert("Informe o bairro ou cidade para continuar.");
        document.getElementById("socio-bairro-outro")?.focus();
        return false;
    }

    return true;
}

function abrirAtualizacaoSocioeconomicaDVC(forcar = false) {
    if (!forcar && !usuarioPrecisaAtualizacaoSocioeconomicaDVC()) return;

    etapaSocioeconomicaDVC = 1;
    dadosSocioeconomicosRascunhoDVC = {};
    document.getElementById("m-atualizacao-socioeconomica-dvc")?.remove();

    const modal = `
        <div id="m-atualizacao-socioeconomica-dvc" class="fixed inset-0 bg-black/80 z-[140] p-4 flex items-center justify-center">
            <div class="bg-white w-full max-w-md rounded-3xl shadow-2xl max-h-[92vh] overflow-hidden flex flex-col">
                <div class="bg-gradient-to-r from-gray-950 via-[#4b0d0d] to-[#990000] text-white p-4">
                    <p id="socio-progresso-dvc" class="text-[8px] font-black uppercase text-white/60">Etapa 1 de 3</p>
                    <h2 class="text-sm font-black uppercase mt-1">Atualização de Dados DVC</h2>
                    <p class="text-[9px] font-semibold text-white/70 mt-1">
                        Informações para editais, parcerias e prestação de contas.
                    </p>
                </div>

                <div id="socio-etapa-conteudo-dvc" class="p-4 overflow-y-auto custom-scroll"></div>

                <div class="p-4 border-t bg-white flex gap-2">
                    <button id="btn-socio-voltar-dvc" onclick="voltarEtapaSocioeconomicaDVC()" class="hidden flex-1 bg-gray-100 text-gray-600 py-3 rounded-2xl text-[10px] font-black uppercase">
                        Voltar
                    </button>
                    <button id="btn-socio-continuar-dvc" onclick="avancarEtapaSocioeconomicaDVC()" class="flex-1 bg-[#990000] text-white py-3 rounded-2xl text-[10px] font-black uppercase shadow-sm">
                        Continuar
                    </button>
                    <button id="btn-socio-salvar-dvc" onclick="salvarAtualizacaoSocioeconomicaDVC()" class="hidden flex-1 bg-[#990000] text-white py-3 rounded-2xl text-[10px] font-black uppercase shadow-sm">
                        Salvar e concluir
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modal);
    atualizarModalSocioeconomicoDVC();
}

function fecharAtualizacaoSocioeconomicaDVC() {
    if (usuarioPrecisaAtualizacaoSocioeconomicaDVC() && !window.usuarioEhADM?.()) {
        return alert("Conclua a atualização para continuar usando o app.");
    }

    document.getElementById("m-atualizacao-socioeconomica-dvc")?.remove();
}

function avancarEtapaSocioeconomicaDVC() {
    if (!validarEtapaSocioeconomicaDVC(etapaSocioeconomicaDVC)) return;
    atualizarRascunhoSocioeconomicoDVC();
    etapaSocioeconomicaDVC = Math.min(3, etapaSocioeconomicaDVC + 1);
    atualizarModalSocioeconomicoDVC();
}

function voltarEtapaSocioeconomicaDVC() {
    atualizarRascunhoSocioeconomicoDVC();
    etapaSocioeconomicaDVC = Math.max(1, etapaSocioeconomicaDVC - 1);
    atualizarModalSocioeconomicoDVC();
}

async function salvarAtualizacaoSocioeconomicaDVC() {
    if (!validarEtapaSocioeconomicaDVC(3)) return;
    atualizarRascunhoSocioeconomicoDVC();

    const menor = usuarioEhSub17OuMenorDVC();
    const email = String(window.currentUserData?.email || auth.currentUser?.email || "").trim().toLowerCase();
    if (!email) return alert("Não foi possível identificar seu cadastro.");

    const bairroSelecionado = dadosSocioeconomicosRascunhoDVC.bairro || "";
    const bairroOutro = dadosSocioeconomicosRascunhoDVC.bairroOutro || "";
    const bairroFinal = bairroSelecionado === "Outro bairro / Outra cidade"
        ? bairroOutro
        : obterBairroPadronizadoDVC(bairroSelecionado);
    const bairroOutroFinal = bairroSelecionado === "Outro bairro / Outra cidade" ? bairroOutro : "";

    const dados = {
        socioeconomicoAtualizado: true,
        socioeconomicoVersao: SOCIOECONOMICO_VERSAO_DVC,
        socioeconomicoAtualizadoEm: serverTimestamp(),
        racaCor: dadosSocioeconomicosRascunhoDVC.racaCor || "",
        bairro: bairroFinal,
        bairroNormalizado: normalizarBairroDVC(bairroFinal),
        bairroOutro: bairroOutroFinal,
        regional: dadosSocioeconomicosRascunhoDVC.regional || "",
        vinculoDvc: dadosSocioeconomicosRascunhoDVC.vinculoDvc || "",
        faixaRendaFamiliar: dadosSocioeconomicosRascunhoDVC.faixaRendaFamiliar || "",
        beneficiarioProgramaSocial: dadosSocioeconomicosRascunhoDVC.beneficiarioProgramaSocial || "",
        programaSocial: dadosSocioeconomicosRascunhoDVC.programaSocial || "",
        quantidadePessoasCasa: dadosSocioeconomicosRascunhoDVC.quantidadePessoasCasa || "",
        tipoEscola: menor ? (dadosSocioeconomicosRascunhoDVC.tipoEscola || "") : "",
        nomeEscola: menor ? (dadosSocioeconomicosRascunhoDVC.nomeEscola || "") : "",
        anoSerie: menor ? (dadosSocioeconomicosRascunhoDVC.anoSerie || "") : "",
        situacaoEscolarAdulto: menor ? "" : (dadosSocioeconomicosRascunhoDVC.situacaoEscolarAdulto || "")
    };

    const botao = document.getElementById("btn-socio-salvar-dvc");
    if (botao) {
        botao.disabled = true;
        botao.textContent = "Salvando...";
    }

    try {
        await updateDoc(doc(db, "users", email), dados);
        window.currentUserData = {
            ...window.currentUserData,
            ...dados,
            socioeconomicoAtualizadoEm: new Date().toISOString()
        };

        document.getElementById("m-atualizacao-socioeconomica-dvc")?.remove();
        alert("Atualização concluída. Obrigado por fortalecer o DVC.");

        if (typeof window.verificarFluxoPesquisaTrimestralDVC === "function") {
            window.verificarFluxoPesquisaTrimestralDVC();
        }
    } catch (erroSalvarSocioeconomico) {
        console.error("Erro ao salvar atualização socioeconômica:", erroSalvarSocioeconomico);
        alert("Não foi possível salvar agora. Verifique sua conexão e tente novamente.");
        if (botao) {
            botao.disabled = false;
            botao.textContent = "Salvar e concluir";
        }
    }
}

window.SOCIOECONOMICO_VERSAO_DVC = SOCIOECONOMICO_VERSAO_DVC;
window.normalizarBairroDVC = normalizarBairroDVC;
window.atualizarCampoBairroOutroDVC = atualizarCampoBairroOutroDVC;
window.usuarioPrecisaAtualizacaoSocioeconomicaDVC = usuarioPrecisaAtualizacaoSocioeconomicaDVC;
window.abrirAtualizacaoSocioeconomicaDVC = abrirAtualizacaoSocioeconomicaDVC;
window.fecharAtualizacaoSocioeconomicaDVC = fecharAtualizacaoSocioeconomicaDVC;
window.avancarEtapaSocioeconomicaDVC = avancarEtapaSocioeconomicaDVC;
window.voltarEtapaSocioeconomicaDVC = voltarEtapaSocioeconomicaDVC;
window.salvarAtualizacaoSocioeconomicaDVC = salvarAtualizacaoSocioeconomicaDVC;

export {
    SOCIOECONOMICO_VERSAO_DVC,
    normalizarBairroDVC,
    usuarioPrecisaAtualizacaoSocioeconomicaDVC,
    abrirAtualizacaoSocioeconomicaDVC,
    fecharAtualizacaoSocioeconomicaDVC,
    avancarEtapaSocioeconomicaDVC,
    voltarEtapaSocioeconomicaDVC,
    salvarAtualizacaoSocioeconomicaDVC
};
