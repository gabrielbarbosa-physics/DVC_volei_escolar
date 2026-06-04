/**
 * ============================================================================
 * Módulo: FINANCE
 * ============================================================================
 * Responsabilidade: Gerencia funcionalidades relacionadas a finance.
 * Este arquivo faz parte do sistema modular do DVC App.
 * Todos os códigos principais aqui agrupados seguem as diretrizes do projeto.
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
const get_PROJETO_ATUAL_DVC = () => window.PROJETO_ATUAL_DVC;
const get_DIA_INICIO_CARENCIA_CADASTRO_FIM_MES = () => window.DIA_INICIO_CARENCIA_CADASTRO_FIM_MES;
const get_DIA_LIMITE_FINANCEIRO_MENSAL = () => window.DIA_LIMITE_FINANCEIRO_MENSAL;
const get_STATUS_FINANCEIRO_CARENCIA = () => window.STATUS_FINANCEIRO_CARENCIA;
const get_AppCache = () => window.AppCache;

// Inner helper functions for renderFinanceiro
function valorMesAno(textoMesAno) {
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
    const [nomeMes, ano] = textoMesAno.split("/");
    return Number(ano) * 100 + mapaMeses[nomeMes];
}

function obterMesInicialContribuicao() {
    const criadoEm = get_currentUserData()?.criadoEm;

    // Usuários antigos sem data de cadastro continuam vendo desde Abril/2026
    if (!criadoEm) {
        return valorMesAno("Abril/2026");
    }

    const dataCadastro = new Date(criadoEm);

    if (isNaN(dataCadastro.getTime())) {
        return valorMesAno("Abril/2026");
    }

    let mesCadastro = dataCadastro.getMonth();
    let anoCadastro = dataCadastro.getFullYear();

    // Se cadastrou nos últimos dias do mês, começa no mês seguinte
    if (dataCadastro.getDate() >= get_DIA_INICIO_CARENCIA_CADASTRO_FIM_MES()) {
        mesCadastro++;

        if (mesCadastro > 11) {
            mesCadastro = 0;
            anoCadastro++;
        }
    }

    return anoCadastro * 100 + mesCadastro;
}

// 1. renderFinanceiro
async function renderFinanceiro() {
    const c = document.getElementById('main-content');

    if (get_currentUserData()?.funcao === "Auxiliar") {
        c.innerHTML = `
            <div class="relative overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-[#990000] text-white rounded-3xl p-5 mb-4 shadow-xl">
                <div class="absolute -right-8 -bottom-10 opacity-10">
                    <i class="fa-solid fa-hands-helping text-9xl"></i>
                </div>
                <div class="relative z-10">
                    <div class="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mb-4">
                        <i class="fa-solid fa-shield-heart text-white text-lg"></i>
                    </div>
                    <p class="text-[9px] font-black uppercase text-white/60 mb-1">Contribuição DVC</p>
                    <h3 class="text-xl font-black uppercase leading-tight">Isenção de Auxiliar Técnica</h3>
                    <p class="text-xs font-semibold text-white/75 leading-relaxed mt-3">Você está isento de contribuições mensais pelo seu apoio ao DVC.</p>
                </div>
            </div>
            <div class="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                <p class="text-[10px] font-bold text-gray-500 leading-relaxed">Obrigado por contribuir na organização dos treinos, chamadas e avaliações técnicas do clube.</p>
            </div>
        `;
        return;
    }

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

    let optionsHtml = mesesPermitidos.length > 0
        ? mesesPermitidos.map(m => `<option value="${m}">${m}</option>`).join('')
        : `<option value="">Nenhum mês disponível ainda</option>`;

    const dadosCarenciaCadastro = window.obterDadosCarenciaCadastro(get_currentUserData(), hoje);
    const avisoCarenciaCadastroHtml = dadosCarenciaCadastro.ativa ? `
        <div class="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5 fade-in">
            <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
                    <i class="fa-solid fa-hourglass-half text-amber-700"></i>
                </div>

                <div>
                    <p class="text-[8px] font-black text-amber-700 uppercase mb-1">
                        Carência de cadastro ativa
                    </p>
                    <p class="text-[10px] text-amber-900 font-semibold leading-relaxed">
                        Como seu cadastro foi feito no fim do mês, você pode participar normalmente até ${dadosCarenciaCadastro.label}. O envio da contribuição abre no próximo mês e segue o prazo mensal.
                    </p>
                </div>
            </div>
        </div>
    ` : "";

    c.innerHTML = `
        <div class="bg-gradient-to-br from-gray-950 via-gray-900 to-[#990000] text-white p-5 rounded-3xl mb-5 shadow-xl relative overflow-hidden">
            <div class="absolute -right-10 -bottom-12 opacity-10">
                <img src="${get_PROJETO_ATUAL_DVC()?.logo || 'assets/img/loki2.webp'}" class="w-48 h-48 object-contain">
            </div>

            <div class="relative z-10">
                <div class="flex items-center gap-3 mb-4">
                    <div class="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center p-2">
                        <img src="${get_PROJETO_ATUAL_DVC()?.logo || 'assets/img/loki2.webp'}" class="w-full h-full object-contain">
                    </div>

                    <div class="flex-1">
                        <p class="text-[8px] font-black uppercase text-white/60">
                            Corresponsabilidade
                        </p>

                        <h3 class="text-xl font-black uppercase tracking-wide leading-none">
                            Contribuição DVC
                        </h3>

                        <p class="text-[9px] font-bold text-white/60 mt-1 uppercase">
                            Apoio mínimo sugerido: R$10,00
                        </p>
                    </div>

                    <button onclick="forcarAtualizacaoDados('financeiro')" class="w-9 h-9 rounded-xl bg-white/10 border border-white/20 text-white flex items-center justify-center shrink-0" title="Sincronizar">
                        <i class="fa-solid fa-rotate text-xs"></i>
                    </button>
                </div>

                <div class="bg-white/10 border border-white/10 rounded-2xl p-3">
                    <p class="text-[10px] font-semibold text-white/80 leading-relaxed">
                        Sua contribuição ajuda a manter o projeto ativo, organizado e acessível para todos os atletas.
                    </p>
                </div>

                <div class="grid grid-cols-3 gap-2 mt-4">
                    <div class="bg-white/10 border border-white/10 rounded-2xl p-2 text-center">
                        <i class="fa-solid fa-volleyball text-white text-sm mb-1"></i>
                        <p class="text-[8px] font-black uppercase text-white/70">Treinos</p>
                    </div>

                    <div class="bg-white/10 border border-white/10 rounded-2xl p-2 text-center">
                        <i class="fa-solid fa-people-group text-white text-sm mb-1"></i>
                        <p class="text-[8px] font-black uppercase text-white/70">Projeto</p>
                    </div>

                    <div class="bg-white/10 border border-white/10 rounded-2xl p-2 text-center">
                        <i class="fa-solid fa-hand-holding-heart text-white text-sm mb-1"></i>
                        <p class="text-[8px] font-black uppercase text-white/70">Apoio</p>
                    </div>
                </div>
            </div>
        </div>

        <div class="bg-white p-5 rounded-2xl border shadow-sm mb-5 fade-in">
            <div class="flex items-center justify-between mb-4">
                <div>
                    <p class="text-[8px] font-black text-gray-400 uppercase">
                        Contribuição mínima
                    </p>
                    <p class="text-3xl font-black text-[#990000] leading-none">
                        R$10
                    </p>
                </div>

                <div class="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center">
                    <i class="fa-solid fa-heart text-[#990000] text-xl"></i>
                </div>
            </div>

            <p class="text-[10px] text-gray-500 font-semibold leading-relaxed mb-4">
                A contribuição é uma forma de corresponsabilidade. Ela ajuda o DVC a continuar oferecendo treinos, organização, acompanhamento e oportunidades para mais jovens.
            </p>

            <div class="bg-red-50 border border-red-100 rounded-xl p-3">
                <p class="text-[9px] font-black text-[#990000] uppercase mb-1">
                    Importante
                </p>
                <p class="text-[10px] text-gray-600 font-semibold leading-relaxed">
                    Caso não seja possível contribuir no mês, você pode enviar uma justificativa para análise.
                </p>
            </div>
        </div>

        ${avisoCarenciaCadastroHtml}

        <div class="bg-white p-5 rounded-2xl border shadow-sm mb-6 fade-in">
            <div class="flex items-center gap-3 mb-4">
                <div class="w-10 h-10 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center">
                    <i class="fa-solid fa-receipt text-green-700"></i>
                </div>

                <div>
                    <p class="text-[8px] font-black text-gray-400 uppercase">
                        Comprovante
                    </p>
                    <p class="text-xs font-black text-gray-800 uppercase">
                        Enviar contribuição
                    </p>
                </div>
            </div>

            <div class="space-y-4">
                <select id="f-mes" class="w-full p-3 border rounded-xl text-xs font-bold bg-gray-50">
                    ${optionsHtml}
                </select>

                <div class="bg-gray-50 border border-dashed rounded-xl p-3">
                    <p class="text-[9px] font-black text-gray-400 uppercase mb-2">
                        Anexar comprovante
                    </p>
                    <input type="file" id="f-file" accept="image/*" class="text-[10px] w-full">
                </div>

                <button onclick="enviarComprovante()" class="w-full bg-green-600 text-white py-3 rounded-xl font-black text-[10px] uppercase shadow-md">
                    <i class="fa-solid fa-paper-plane mr-1"></i> Enviar comprovante
                </button>
            </div>
        </div>

        <p class="text-[9px] font-black text-gray-400 uppercase mb-2">Seus Envios</p>
        <div id="finance-status-list" class="mb-6 space-y-2"></div>

        <div class="bg-gray-950 p-5 rounded-2xl shadow-lg fade-in text-white">
            <div class="flex items-center gap-3 mb-4">
                <div class="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center">
                    <i class="fa-solid fa-comment-dots text-white"></i>
                </div>

                <div>
                    <p class="text-[8px] font-black text-white/50 uppercase">
                        Justificativa
                    </p>
                    <p class="text-xs font-black text-white uppercase">
                        Solicitar análise
                    </p>
                </div>
            </div>

            <p class="text-white/60 text-[9px] mb-3 font-semibold leading-relaxed">
                Use este espaço apenas quando não for possível contribuir no mês selecionado.
            </p>

            <textarea id="f-just-texto" placeholder="Descreva aqui o motivo..." class="w-full p-3 border-none rounded-xl text-xs mb-3 h-24 outline-none text-gray-800"></textarea>

            <button onclick="enviarJustificativa()" class="w-full bg-white text-gray-900 py-3 rounded-xl font-black text-[10px] uppercase shadow-md">
                <i class="fa-solid fa-envelope-open-text mr-1"></i> Enviar justificativa
            </button>
        </div>
    `;

    if (!get_AppCache().contribuicoes && auth.currentUser?.email) {
        await migrarContribuicoesLegadasDoAtleta(auth.currentUser.email);
    }
    const contribuicoesFinanceiras = await window.carregarContribuicoesCache();
    if (window.__abaAtualDVC !== "finance") return;
    const listDiv = document.getElementById('finance-status-list');
    if (!listDiv) return;

    let envios = [];

    contribuicoesFinanceiras
        .filter(docContrib => String(docContrib.email || "").toLowerCase() === String(auth.currentUser.email || "").toLowerCase())
        .forEach(docContrib => {
            const data = docContrib;

            envios.push({
                id: docContrib.id,
                mes: data.mes || "Sem mês",
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

    if (envios.length === 0) {
        listDiv.innerHTML = `
            <div class="bg-white p-4 border border-dashed rounded-xl text-center">
                <p class="text-[10px] text-gray-400 font-bold uppercase">
                    Nenhum envio registrado ainda.
                </p>
            </div>
        `;
    } else {
        listDiv.innerHTML = envios.map(item => {
            const isJustificativa = item.tipo === "Justificativa";
            const isCarenciaEspecial = item.tipo === "CarenciaEspecial";

            let corStatus = "bg-yellow-100 text-yellow-800 border-yellow-200";
            let textoStatus = "Pendente";

            if (item.status === "Validado" || item.resultadoFinanceiro === "Pago") {
                corStatus = "bg-green-100 text-green-800 border-green-200";
                textoStatus = "Validado";
            }

            if (item.status === "Justificado" || item.resultadoFinanceiro === "Justificado" || item.status === "Carência aceita") {
                corStatus = "bg-blue-100 text-blue-800 border-blue-200";
                textoStatus = item.status === "Carência aceita" ? "Carência aceita" : "Justificado";
            }

            if (item.status === "Em análise") {
                corStatus = "bg-red-100 text-red-800 border-red-200";
                textoStatus = "Em análise";
            }

            if (item.status === "Carência recusada") {
                corStatus = "bg-red-100 text-red-800 border-red-200";
                textoStatus = "Recusada";
            }

            return `
                <div class="bg-white p-3 border rounded-xl flex justify-between items-center shadow-sm">
                    <div>
                        <p class="text-xs font-black uppercase text-gray-800">
                            ${item.mes}
                        </p>

                        <p class="text-[9px] font-bold ${isCarenciaEspecial ? 'text-red-700' : isJustificativa ? 'text-blue-600' : 'text-green-600'} uppercase mt-1">
                            ${isCarenciaEspecial ? 'Carência especial' : isJustificativa ? 'Justificativa' : 'Comprovante'}
                        </p>
                    </div>

                    <span class="${corStatus} border text-[8px] font-black px-2 py-1 rounded-full uppercase">
                        ${textoStatus}
                    </span>
                </div>
            `;
        }).join('');
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
                <p class="text-xs font-black uppercase text-red-700">Financeiro indisponível agora.</p>
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
                        &times;
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
        alert("Não foi possível abrir o modo teste.");
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
        return alert("Nenhum mês disponível para envio no momento.");
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
    const file = document.getElementById('f-file')?.files?.[0];
    const mes = document.getElementById('f-mes')?.value;

    if (!mes) {
        const dadosCarencia = window.obterDadosCarenciaCadastro(get_currentUserData());

        if (dadosCarencia.ativa) {
            return alert(`Você está em carência de cadastro até ${dadosCarencia.label}. O envio da contribuição abre no próximo mês.`);
        }

        return alert("Nenhum mês disponível para envio no momento.");
    }

    if (!file) {
        return alert("Selecione o arquivo.");
    }

    if (file.size > 800000) {
        return alert("Arquivo muito grande! No plano gratuito, tire um print da tela do comprovante para diminuir o tamanho antes de enviar (máx: 800KB).");
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
            renderFinance();
        } catch (err) {
            console.error("Erro ao enviar comprovante:", err);
            alert("Não foi possível enviar o comprovante.");
        }
    };

    reader.onerror = () => {
        alert("Não foi possível ler o arquivo selecionado.");
    };

    reader.readAsDataURL(file);
}

// 8. enviarJustificativa
async function enviarJustificativa() {
    const texto = document.getElementById('f-just-texto').value.trim();
    const mes = document.getElementById('f-mes').value;

    if (!texto) {
        return alert("Descreva o motivo da justificativa.");
    }

    if (!mes) {
        const dadosCarencia = window.obterDadosCarenciaCadastro(get_currentUserData());

        if (dadosCarencia.ativa) {
            return alert(`Você está em carência de cadastro até ${dadosCarencia.label}. A justificativa mensal será necessária apenas quando houver mês disponível.`);
        }

        return alert("Selecione o mês da justificativa.");
    }
    const consecutivos = await contarJustificativasConsecutivas(auth.currentUser.email, mes);
    if (consecutivos >= 3) {
        window.abrirModalCarenciaEspecial(mes, texto);
        return;
    }
    try {
        // Cria um ID próprio para justificativa, sem apagar possível comprovante do mesmo mês
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
            `Mês: ${mes}\n\n` +
            `Justificativa:\n${texto}\n\n` +
            `Observação: esta justificativa também foi registrada no sistema DVC para análise.`
        );

        alert("Justificativa salva no sistema. Agora o e-mail será aberto para envio.");

        window.location.href = `mailto:${destinatarios}?subject=${assunto}&body=${corpo}`;

        renderFinance();

    } catch (e) {
        console.error("Erro ao enviar justificativa:", e);
        alert("Não foi possível salvar a justificativa. Tente novamente.");
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
        console.error("Erro ao carregar resumo de pendências:", e);

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
                mes: data.mes || "Sem mês",
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
                                    ? 'Carência especial' 
                                    : isJustificativa 
                                        ? 'Justificativa' 
                                        : 'Comprovante'
                            }
                        </span>
                    </div>

                    <p class="text-[10px] font-bold text-gray-700 mb-2">
                        Mês: ${item.mes}
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
                                1. Tem certeza que não pode contribuir com nenhum valor?
                            </p>
                            <p class="text-[10px] text-gray-700 leading-relaxed mb-3">
                                ${item.respostaPodeContribuir || "Sem resposta."}
                            </p>

                            <p class="text-[9px] font-black text-gray-500 uppercase mb-1">
                                2. Qual a importância do projeto?
                            </p>
                            <p class="text-[10px] text-gray-700 leading-relaxed mb-3">
                                ${item.respostaImportanciaProjeto || "Sem resposta."}
                            </p>

                            <p class="text-[9px] font-black text-gray-500 uppercase mb-1">
                                3. Qual será sua contribuição com o projeto?
                            </p>
                            <p class="text-[10px] text-gray-700 leading-relaxed">
                                ${item.respostaContribuicaoProjeto || "Sem resposta."}
                            </p>
                        </div>

                        <div class="grid grid-cols-2 gap-2">
                            <button 
                                onclick="aceitarCarenciaEspecial('${item.email}', '${item.docId}', this)" 
                                class="bg-green-600 text-white py-2 rounded-lg font-bold text-[9px] uppercase">
                                Aceitar carência
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
                    Nenhuma pendência financeira no momento.
                </p>
            </div>
        `;

        const modal = `
            <div id="m-pendencias-financeiras" class="fixed inset-0 bg-black/80 z-[100] p-4 flex items-center justify-center">
                <div class="bg-white w-full max-w-sm rounded-2xl p-5 max-h-[85vh] overflow-y-auto relative shadow-2xl">
                    <button 
                        onclick="document.getElementById('m-pendencias-financeiras').remove()" 
                        class="absolute top-4 right-4 text-red-600 font-black text-xl">
                        &times;
                    </button>

                    <h2 class="font-bold text-xs uppercase mb-1 text-[#990000]">
                        Pendências Financeiras
                    </h2>

                    <p class="text-[9px] text-gray-400 font-bold uppercase mb-4">
                        Comprovantes, justificativas e carências aguardando análise
                    </p>

                    ${listaHtml}
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modal);

    } catch (e) {
        console.error("Erro ao abrir pendências financeiras:", e);
        alert("Não foi possível carregar as pendências financeiras.");
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
            alert("E-mail do atleta não encontrado.");
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
        alert("Não foi possível atualizar o financeiro do atleta.");
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
            if (user.status === "Excluído") return;
            if (window.usuarioEstaEmCarenciaCadastro(user)) return;

            const uÚltimoMesRegular = user.mesFinanceiro || "";
            const mesesSemContribuicao = diferencaMeses(uÚltimoMesRegular, mesAtual);
            if (!uÚltimoMesRegular) {
                return;
            }
            const estaRegularNoMes = 
                (window.usuarioEstaEmDia(user) || window.usuarioEstaJustificado(user)) &&
                uÚltimoMesRegular === mesAtual;

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
            alert("Nenhum atleta atingiu o prazo de inativação ou exclusão neste mês.");
            return;
        }

        const corpoEmail = `
RELATÓRIO DE CONTROLE FINANCEIRO DVC
Mês de referência: ${mesAtual}

ATLETAS QUE SERÃO INATIVADOS - 3 MESES SEM CONTRIBUIÇÃO
Total: ${paraInativar.length}

${paraInativar.length > 0 
    ? paraInativar.map(window.formatarContatoFinanceiro).join("\n\n")
    : "Nenhum atleta nesta situação."}

------------------------------------------------------------

ATLETAS QUE SERÃO MARCADOS COMO EXCLUÍDOS - 4 MESES OU MAIS SEM CONTRIBUIÇÃO
Total: ${paraExcluir.length}

${paraExcluir.length > 0 
    ? paraExcluir.map(window.formatarContatoFinanceiro).join("\n\n")
    : "Nenhum atleta nesta situação."}

------------------------------------------------------------

Observação:
Este relatório foi gerado automaticamente pelo sistema DVC antes da aplicação das mudanças de status.
`;

        const destinatarios = "tainaradornas1@gmail.com,gabriel0barbosa0@gmail.com,drummondvoleibol@gmail.com";
        const assunto = encodeURIComponent(`DVC - Inativações e Exclusões Financeiras - ${mesAtual}`);
        const corpo = encodeURIComponent(corpoEmail);

        window.location.href = `mailto:${destinatarios}?subject=${assunto}&body=${corpo}`;

        setTimeout(async () => {
            const confirmar = confirm(
                `O e-mail de relatório foi aberto.\n\n` +
                `Após revisar/enviar o e-mail, deseja aplicar as mudanças agora?\n\n` +
                `Inativar: ${paraInativar.length}\n` +
                `Marcar como excluído: ${paraExcluir.length}`
            );

            if (!confirmar) return;

            for (const atleta of paraInativar) {
                await updateDoc(doc(db, "users", atleta.email), {
                    status: "Inativo",
                    financeiro: "Inadimplente",
                    inativadoEm: new Date().toISOString(),
                    motivoInativacao: "3 meses seguidos sem contribuição"
                });
            }

            for (const atleta of paraExcluir) {
                await updateDoc(doc(db, "users", atleta.email), {
                    status: "Excluído",
                    financeiro: "Inadimplente",
                    excluidoEm: new Date().toISOString(),
                    motivoExclusao: "4 meses ou mais sem contribuição"
                });
            }

            alert(
                `Controle aplicado com sucesso!\n\n` +
                `Inativados: ${paraInativar.length}\n` +
                `Marcados como excluídos: ${paraExcluir.length}`
            );

            window.limparCacheDados("atletas");
            window.renderAdmin();

        }, 1000);

    } catch (e) {
        console.error("Erro ao verificar inadimplência prolongada:", e);
        alert("Não foi possível verificar a inadimplência prolongada agora.");
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
                status === "Em análise" ||
                status === "Carência aceita"
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
                    &times;
                </button>

                <div class="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mb-4">
                    <i class="fa-solid fa-hand-holding-heart text-[#990000] text-xl"></i>
                </div>

                <h2 class="text-sm font-black text-[#990000] uppercase mb-2">
                    Carência Especial
                </h2>

                <p class="text-[10px] text-gray-600 font-semibold leading-relaxed mb-4">
                    Você está chegando a 3 meses consecutivos sem contribuir. 
                    O tempo máximo de carência automática é de 3 meses consecutivos.
                </p>

                <div class="bg-red-50 border border-red-100 rounded-2xl p-3 mb-4">
                    <p class="text-[9px] font-black text-[#990000] uppercase mb-1">
                        Antes de enviar, reflita:
                    </p>
                    <p class="text-[10px] text-gray-600 font-semibold leading-relaxed">
                        O projeto busca acolher quem precisa, mas também depende da corresponsabilidade de todos para continuar existindo.
                    </p>
                </div>

                <label class="text-[9px] font-black text-gray-400 uppercase">
                    Você realmente não pode realizar uma contribuição neste mês?
                </label>
                <textarea id="carencia-resposta-1" class="w-full p-3 border rounded-xl text-xs mb-3 h-20 outline-none" placeholder="Explique sua situação..."></textarea>

                <label class="text-[9px] font-black text-gray-400 uppercase">
                    Qual o peso do projeto para você
                </label>
                <textarea id="carencia-resposta-2" class="w-full p-3 border rounded-xl text-xs mb-3 h-20 outline-none" placeholder="Conte o que o projeto representa..."></textarea>

                <label class="text-[9px] font-black text-gray-400 uppercase">
                    De que forma você poderá contribuir com o projeto?
                </label>
                <textarea id="carencia-resposta-3" class="w-full p-3 border rounded-xl text-xs mb-4 h-20 outline-none" placeholder="Ex: ajudar na organização, pontualidade, apoio nos treinos, divulgação..."></textarea>

                <button 
                    onclick="enviarCarenciaEspecial('${mes}', \`${textoJustificativa.replace(/`/g, "'")}\`)" 
                    class="w-full bg-[#990000] text-white py-3 rounded-xl font-black text-[10px] uppercase shadow-md">
                    Enviar para análise
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
            return alert("Responda às três perguntas antes de enviar.");
        }

        const docId = "carencia_especial_" + mes.replace("/", "_");
        const enviadoEm = new Date().toISOString();
        const enviadoPor = get_currentUserData()?.nome || auth.currentUser.email;

        const dadosCarencia = {
            mes: mes,
            tipo: "CarenciaEspecial",
            status: "Em análise",
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
            carenciaEspecialSolicitada: true,
            ultimaCarenciaEspecial: new Date().toISOString()
        });

        window.limparCacheDados("financeiro"); window.limparCacheContribuicoesAtleta();
        window.limparCacheDados("atletas");

        document.getElementById("m-carencia-especial")?.remove();

        alert("Solicitação de carência especial enviada para análise.");

        renderFinance();

    } catch (e) {
        console.error("Erro ao enviar carência especial", e);
        alert("Não foi possível enviar a solicitação de carência especial.");
    }
}

// 18. aceitarCarenciaEspecial
async function aceitarCarenciaEspecial(email, docId, btn) {
    try {
        const analisadoEm = new Date().toISOString();
        const analisadoPor = get_currentUserData()?.nome || auth.currentUser?.email || "Gestao";

        await atualizarContribuicaoGlobalComEspelho(email, docId, {
            status: "Carência aceita",
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
            status: "Ativo",
            financeiro: "Justificado",
            mesFinanceiro: mesFinanceiroCarencia
        });

        window.limparCacheDados("financeiro"); window.limparCacheContribuicoesAtleta();
        window.limparCacheDados("atletas");

        if (btn) {
            btn.innerText = "Aceita";
            btn.disabled = true;
        }

        alert("Carência especial aceita.");

        document.getElementById("m-pendencias-financeiras")?.remove();
        abrirPendenciasFinanceiras();

    } catch (e) {
        console.error("Erro ao aceitar carência especial:", e);
        alert("Não foi possível aceitar a carência.");
    }
}

// 19. recusarCarenciaEspecial
async function recusarCarenciaEspecial(email, docId, btn) {
    try {
        const analisadoEm = new Date().toISOString();
        const analisadoPor = get_currentUserData()?.nome || auth.currentUser?.email || "Gestao";

        await atualizarContribuicaoGlobalComEspelho(email, docId, {
            status: "Carência recusada",
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
            financeiro: "Inadimplente"
        });

        window.limparCacheDados("financeiro"); window.limparCacheContribuicoesAtleta();
        window.limparCacheDados("atletas");

        if (btn) {
            btn.innerText = "Recusada";
            btn.disabled = true;
        }

        alert("Carência especial recusada.");

        document.getElementById("m-pendencias-financeiras")?.remove();
        abrirPendenciasFinanceiras();

    } catch (e) {
        console.error("Erro ao recusar carência especial", e);
        alert("Não foi possível recusar a carência.");
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
            alert("Registro não encontrado.");
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
        alert("Não foi possível validar o comprovante.");
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
            alert("Justificativa não encontrada.");
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
        alert("Não foi possível aprovar a justificativa.");
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
