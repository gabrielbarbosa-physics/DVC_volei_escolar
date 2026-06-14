/**
 * ============================================================================
 * Módulo: QUIZ
 * ============================================================================
 * Responsabilidade: Gerencia funcionalidades relacionadas a quiz.
 * Este arquivo faz parte do sistema modular do DVC App.
 * Todos os códigos principais aqui agrupados seguem as diretrizes do projeto.
 * ============================================================================
 */

// js/quiz.js
// Desafio Semanal de InteligÃªncia de Quadra DVC

import { auth, db, doc, getDoc, updateDoc, setDoc, serverTimestamp, writeBatch, collection, query, where, orderBy, limit, getDocs } from "./firebase.js";
import { QUESTOES_INTELIGENCIA_QUADRA_DVC } from "./quiz-bank.js";

let quizEstadoAtual = {
    questoes: [],
    indiceAtual: 0,
    acertos: 0,
    erros: 0,
    pontuacao: 0,
    respostas: [], // guarda o hit/miss e opcao escolhida
    semanaChave: "",
    respondido: false,
    streakAtual: 0,
    streakMaximo: 0,
    pontosPorNivel: { "visao_jogo": 0, "pensamento_levantador": 0, "voz_ativa": 0 },
    timerId: null,
    tempoRestante: 15
};

// FunÃƒÂ§ÃƒÂµes utilitÃƒÂ¡rias
function obterDataAtualDVC() {
    return new Date(); // Pode ser mockado se necessÃƒÂ¡rio
}

function normalizarEmail(email) {
    return String(email || "").trim().toLowerCase().replace(/[@.]/g, "_");
}

function corrigirTextoVisivelQuizDVC(texto) {
    let valor = typeof window.corrigirMojibakeDVC === "function"
        ? window.corrigirMojibakeDVC(texto)
        : String(texto || "");

    const mapa = {
        "VisÃƒÂ£o 360": "Visão 360",
        "VisÃ£o 360": "Visão 360",
        "SÃºmula": "Súmula",
        "VocÃª": "Você",
        "prÃ³xima": "próxima",
        "SequÃªncia": "Sequência",
        "InteligÃªncia": "Inteligência",
        "comunicaÃ§Ã£o": "comunicação",
        "ComunicaÃ§Ã£o": "Comunicação",
        "decisÃ£o": "decisão",
        "DecisÃ£o": "Decisão",
        "EvoluÃ§Ã£o": "Evolução",
        "VitÃ³ria": "Vitória",
        "tÃ©cnico": "técnico",
        "pressÃ£o": "pressão",
        "situaÃ§Ãµes": "situações",
        "sÃ£o": "são",
        "Ãšltimo": "Último",
        "ÃšLTIMO": "ÚLTIMO"
    };

    Object.entries(mapa).forEach(([origem, destino]) => {
        valor = valor.split(origem).join(destino);
    });

    return valor;
}

function obterChaveSemana(data = new Date()) {
    const dataRef = new Date(data.getTime());
    // Ajustar para que a semana comece na segunda-feira
    const dia = dataRef.getDay();
    const diff = dataRef.getDate() - dia + (dia === 0 ? -6 : 1); // 0 = Domingo
    dataRef.setDate(diff);
    dataRef.setHours(0, 0, 0, 0);
    
    // Obter nÃƒÂºmero da semana no ano
    const inicioAno = new Date(dataRef.getFullYear(), 0, 1);
    const dias = Math.floor((dataRef - inicioAno) / (24 * 60 * 60 * 1000));
    const semanaDoAno = Math.ceil((dataRef.getDay() + 1 + dias) / 7);
    
    return `${dataRef.getFullYear()}-W${String(semanaDoAno).padStart(2, '0')}`;
}

function sortearQuestoes(banco, qtd) {
    const embaralhado = [...banco].sort(() => 0.5 - Math.random());
    return embaralhado.slice(0, qtd);
}

function prepararQuestoesSemana() {
    // ValidaÃƒÂ§ÃƒÂ£o de cenÃƒÂ¡rio
    const questoesValidas = QUESTOES_INTELIGENCIA_QUADRA_DVC.filter(q => {
        if (!q.cenario || q.cenario.trim() === "") {
            console.warn(`[QUIZ] QuestÃƒÂ£o ${q.id} ignorada: sem cenÃƒÂ¡rio.`);
            return false;
        }
        if (!q.pergunta || q.pergunta.trim() === "") {
            console.warn(`[QUIZ] QuestÃƒÂ£o ${q.id} ignorada: sem pergunta separada.`);
            return false;
        }
        if (!q.alternativas || q.alternativas.length < 3) return false;
        if (q.correta === undefined || q.correta < 0 || q.correta >= q.alternativas.length) return false;
        if (!q.explicacaoCorreta || !q.feedbackErro) return false;
        return true;
    });

    const visao = questoesValidas.filter(q => q.nivel === "visao_jogo");
    const pensamento = questoesValidas.filter(q => q.nivel === "pensamento_levantador");
    const voz = questoesValidas.filter(q => q.nivel === "voz_ativa");

    const selecionadasVisao = sortearQuestoes(visao, 4);
    const selecionadasPensamento = sortearQuestoes(pensamento, 3);
    const selecionadasVoz = sortearQuestoes(voz, 3);

    // Retorna ordenado exatamente para bater com as Fases 1, 2 e 3
    return [...selecionadasVisao, ...selecionadasPensamento, ...selecionadasVoz];
}

function renderProfile() {
    if (typeof window.renderProfile === "function") {
        return window.renderProfile();
    }
}

// -------------------------------------------------------------
// RENDERIZAÃƒâ€¡ÃƒÆ’O DO CARD NO PERFIL
// -------------------------------------------------------------
function renderQuizPerfilHtmlDVC(userData = {}) {
    const chaveSemanaAtual = obterChaveSemana(obterDataAtualDVC());
    const respondeuEstaSemana = userData.ultimaSemanaQuizInteligencia === chaveSemanaAtual;
    const temHistorico = !!userData.ultimaSemanaQuizInteligencia;

    const emailParaHistorico = window.auth?.currentUser?.email || userData.email || "";
    const emailNormalizado = normalizarEmail(emailParaHistorico);

    if (!temHistorico) {
        return corrigirTextoVisivelQuizDVC(`
            <div class="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 mb-4 shadow-sm text-left relative overflow-hidden">
                <div class="flex items-center gap-2 mb-1">
                    <i class="fa-solid fa-brain text-indigo-600 text-lg"></i>
                    <h3 class="text-xs font-black text-indigo-900 dark:text-gray-100 uppercase tracking-wide">Inteligência de Quadra</h3>
                </div>
                <p class="text-[9px] font-bold text-gray-400 uppercase mb-4">Leitura de jogo, comunicação e tomada de decisão.</p>
                
                <div class="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-xl p-4 text-center">
                    <p class="text-[10px] text-indigo-800 dark:text-indigo-300 font-semibold">Você ainda não concluiu nenhum Set Mental. Acesse o Mural para entrar no desafio da semana e fortalecer sua inteligência de jogo.</p>
                </div>
            </div>
        `);
    }

    const ultimaSemana = userData.ultimaSemanaQuizInteligencia;
    const pontuacao = userData.ultimaPontuacaoQuizInteligencia || 0;
    const melhorStreak = userData.melhorStreakQuiz || 0;
    const ultimaBadge = userData.ultimaBadgeQuizRecebida || "";
    const ultimaBadgeVisivel = corrigirTextoVisivelQuizDVC(ultimaBadge);

    const botaoAcaoHtml = respondeuEstaSemana 
        ? `<button onclick="window.iniciarQuizVolei()" class="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 py-3 rounded-xl font-black text-[10px] uppercase shadow-sm transition-colors hover:bg-gray-200 dark:hover:bg-gray-750 text-center">Ver resultado da semana</button>`
        : ``;

    let badgeHtml = "";
    if (ultimaBadge) {
        let iconeBadge = "fa-star";
        let corBadge = "bg-indigo-100 text-indigo-800 border-indigo-200";
        if (ultimaBadgeVisivel === "Visão 360") { iconeBadge = "fa-eye"; corBadge = "bg-blue-100 text-blue-800 border-blue-200"; }
        if (ultimaBadge === "Estrategista") { iconeBadge = "fa-chess-knight"; corBadge = "bg-purple-100 text-purple-800 border-purple-200"; }
        if (ultimaBadge === "Voz Ativa") { iconeBadge = "fa-bullhorn"; corBadge = "bg-orange-100 text-orange-800 border-orange-200"; }
        if (ultimaBadge === "On Fire") { iconeBadge = "fa-fire"; corBadge = "bg-red-100 text-red-800 border-red-200"; }
        if (ultimaBadge === "Mestre da Semana") { iconeBadge = "fa-trophy"; corBadge = "bg-yellow-100 text-yellow-800 border-yellow-200"; }

        badgeHtml = `<span class="inline-flex items-center gap-1 text-[8px] font-black uppercase px-2 py-0.5 rounded border ${corBadge}"><i class="fa-solid ${iconeBadge}"></i> ${ultimaBadgeVisivel}</span>`;
    }

    const partesSemana = ultimaSemana.split("-");
    const semanaAmigavel = partesSemana.length === 2 ? `Semana ${partesSemana[1]} - ${partesSemana[0]}` : ultimaSemana;

    return corrigirTextoVisivelQuizDVC(`
        <div class="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 mb-4 shadow-sm text-left relative overflow-hidden">
            <div class="flex items-center gap-2 mb-1">
                <i class="fa-solid fa-brain text-indigo-600 text-lg"></i>
                <h3 class="text-xs font-black text-indigo-900 dark:text-gray-100 uppercase tracking-wide">Inteligência de Quadra</h3>
            </div>
            <p class="text-[9px] font-bold text-gray-400 uppercase mb-4">Leitura de jogo, comunicação e tomada de decisão.</p>
            
            <div class="bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-850 rounded-xl p-3 mb-4">
                <p class="text-[9px] font-black text-gray-500 dark:text-gray-100 uppercase mb-2">Último Set Mental</p>
                <div class="flex justify-between items-center mb-2">
                    <span class="text-[10px] font-bold text-gray-600 dark:text-gray-300"><span class="font-black text-gray-800 dark:text-gray-100">${semanaAmigavel}</span></span>
                    <span class="text-[10px] font-bold text-gray-600 dark:text-gray-300">Placar Oficial: <span class="font-black text-green-700 dark:text-green-400">+${pontuacao} pts</span></span>
                </div>
                ${melhorStreak > 0 ? `<div class="flex justify-between items-center mb-2"><span class="text-[10px] font-bold text-gray-600 dark:text-gray-300">Maior Sequência: <span class="font-black text-orange-600 dark:text-orange-400">${melhorStreak} acertos</span></span></div>` : ''}
                ${badgeHtml ? `<div class="mt-2">${badgeHtml}</div>` : ''}
            </div>

            ${botaoAcaoHtml ? `
            <div class="flex gap-2 w-full mt-2">
                ${botaoAcaoHtml}
            </div>
            ` : ''}
            <div class="w-full mt-2">
                <button onclick="window.abrirHistoricoQuizPerfilDVC('${emailNormalizado}', '${emailParaHistorico}')" class="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 px-3 py-3 rounded-xl font-black text-[10px] uppercase shadow-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-900">
                    Ver mais desafios
                </button>
            </div>
        </div>
    `);
}

window.abrirHistoricoQuizPerfilDVC = async (emailNormalizado, emailOriginal) => {
    const modalId = "m-historico-quiz-perfil";
    if (document.getElementById(modalId)) document.getElementById(modalId).remove();

    const loadingHtml = corrigirTextoVisivelQuizDVC(`
        <div id="${modalId}" class="fixed inset-0 bg-black/80 backdrop-blur-sm z-[150] p-4 flex items-center justify-center fade-in">
            <div class="bg-white w-full max-w-sm rounded-3xl p-6 relative shadow-2xl flex flex-col max-h-[90vh]">
                <button onclick="document.getElementById('${modalId}').remove()" class="absolute top-4 right-4 text-gray-400 font-black text-xl hover:text-gray-600">
                    &times;
                </button>
                <h3 class="font-black text-sm text-indigo-900 uppercase mb-4"><i class="fa-solid fa-list mr-1"></i> Histórico do Set Mental</h3>
                <div class="flex-1 overflow-y-auto custom-scroll" id="${modalId}-content">
                    <p class="text-center text-[10px] text-gray-500 font-bold uppercase"><i class="fa-solid fa-circle-notch fa-spin mr-1"></i> Carregando súmulas...</p>
                </div>
            </div>
        </div>
    `);
    document.body.insertAdjacentHTML('beforeend', loadingHtml);

    try {
        const quizRef = collection(db, "quizInteligenciaSemanal");
        
        // Regra do Firestore: allow read if request.auth != null && resource.data.email == request.auth.token.email;
        // EntÃƒÂ£o devemos buscar usando where("email", "==", emailOriginal)
        const emailAutenticado = window.auth?.currentUser?.email || emailOriginal;
        
        const q = query(quizRef, where("email", "==", emailAutenticado), orderBy("respondidoEm", "desc"), limit(10));
        const snap = await window.getDocsDVC(q, { cacheKey: `historico_quiz_${emailAutenticado}`, ttl: 10 * 60 * 1000 });

        const container = document.getElementById(`${modalId}-content`);
        if (!container) return;

        if (snap.empty) {
            container.innerHTML = corrigirTextoVisivelQuizDVC(`<p class="text-center text-[10px] text-gray-500 font-bold uppercase mt-4">Nenhum histórico encontrado.</p>`);
            return;
        }

        let htmlLista = '<div class="space-y-3">';
        snap.forEach(doc => {
            const data = doc.data();
            const acertos = data.acertos || 0;
            const erros = data.erros !== undefined ? data.erros : (10 - acertos);
            const pontos = data.pontuacao || 0;
            const semana = data.quizSemanaChave || "Desconhecida";
            const adv = data.adversarioSimb || "Adversário";
            
            let resultadoBadge = "";
            if (acertos >= 7) resultadoBadge = `<span class="bg-green-100 text-green-800 text-[8px] font-black uppercase px-2 py-0.5 rounded">Vitória DVC</span>`;
            else if (acertos >= 5) resultadoBadge = `<span class="bg-yellow-100 text-yellow-800 text-[8px] font-black uppercase px-2 py-0.5 rounded">Empate</span>`;
            else resultadoBadge = `<span class="bg-red-100 text-red-800 text-[8px] font-black uppercase px-2 py-0.5 rounded">Evolução</span>`;

            htmlLista += `
                <div class="bg-gray-50 border border-gray-100 rounded-xl p-3 relative text-left">
                    <div class="flex justify-between items-start mb-2">
                        <span class="text-[10px] font-black text-gray-800 uppercase">${semana}</span>
                        ${resultadoBadge}
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-[9px] font-bold text-gray-500">Placar: <span class="text-indigo-700 font-black">DVC ${acertos} X ${erros} ${adv}</span></span>
                        <span class="text-[9px] font-bold text-green-700">+${pontos} pts</span>
                    </div>
                </div>
            `;
        });
        htmlLista += '</div>';
        container.innerHTML = corrigirTextoVisivelQuizDVC(htmlLista);

    } catch (e) {
        console.error("Erro ao carregar historico:", e);
        const container = document.getElementById(`${modalId}-content`);
        if (container) {
            container.innerHTML = corrigirTextoVisivelQuizDVC(`<p class="text-center text-[10px] text-red-500 font-bold mt-4">Erro de Permissão (Firestore) ao ler histórico.<br><span class="opacity-70 text-[8px]">Verifique se a conta autenticada tem permissão em quizInteligenciaSemanal para o e-mail solicitado.</span></p>`);
        }
    }
};

window.renderQuizPerfilHtmlDVC = renderQuizPerfilHtmlDVC;

// -------------------------------------------------------------
// LÃƒâ€œGICA DO QUIZ SEMANAL
// -------------------------------------------------------------
window.iniciarQuizVolei = async () => {
    try {
        if (!auth.currentUser) return;
        
        const userRef = doc(db, "users", auth.currentUser.email);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            alert("Seu cadastro não foi encontrado.");
            return;
        }

        const userData = userSnap.data() || {};
        const chaveSemanaAtual = obterChaveSemana(obterDataAtualDVC());

        if (userData.ultimaSemanaQuizInteligencia === chaveSemanaAtual) {
            // Já respondeu nesta semana
            mostrarTelaFinalQuiz({
                semana: chaveSemanaAtual,
                acertos: userData.quizInteligenciaUltimosAcertos || 0,
                pontuacao: userData.quizInteligenciaUltimosPontos || 0,
                jaRespondidoAntes: true
            });
            return;
        }

        abrirApresentacaoQuizDVC();

    } catch (e) {
        console.error("Erro ao iniciar quiz:", e);
        alert("Não foi possível carregar o quiz. Tente novamente.");
    }
};

function abrirApresentacaoQuizDVC() {
    if (document.getElementById("m-quiz-semanal")) document.getElementById("m-quiz-semanal").remove();

    const modal = corrigirTextoVisivelQuizDVC(`
        <div id="m-quiz-semanal" class="fixed inset-0 bg-black/90 backdrop-blur-sm z-[150] p-4 flex items-center justify-center fade-in">
            <div class="bg-white w-full max-w-sm rounded-3xl p-6 relative shadow-2xl flex flex-col items-center text-center border border-gray-100">
                <button onclick="document.getElementById('m-quiz-semanal').remove()" class="absolute top-4 right-4 text-gray-400 font-black text-xl hover:text-gray-600 transition-colors">
                    &times;
                </button>
                
                <div class="w-16 h-16 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-4">
                    <i class="fa-solid fa-lightbulb text-indigo-600 text-3xl"></i>
                </div>
                
                <h2 class="font-black text-lg text-indigo-900 uppercase leading-tight">Set Mental da Semana</h2>
                <p class="text-[9px] text-indigo-500 font-black uppercase mt-1 mb-3">Cada decisão é um rally. Leia a quadra, comunique e pontue para o DVC.</p>
                
                <p class="text-[11px] text-gray-600 font-medium leading-relaxed mb-6">
                    Todo jogo começa antes da bola chegar. Ler a quadra, comunicar, decidir e apoiar o time também são habilidades de atleta. Responda aos cenários da semana e fortaleça sua inteligência de jogo.
                </p>
                
                <button onclick="window.iniciarRodadaQuizDVC()" class="w-full bg-indigo-700 text-white py-3.5 rounded-2xl font-black text-xs uppercase shadow-md transition-all duration-300 hover:bg-indigo-800">
                    Entrar em Quadra
                </button>
            </div>
        </div>
    `);
    document.body.insertAdjacentHTML('beforeend', modal);
}

window.iniciarRodadaQuizDVC = () => {
    const adversarios = ["Saque Pressão", "Bloqueio Alto", "Defesa Fechada", "Time Silencioso", "Jogo Decisivo"];
    const advEscolhido = adversarios[Math.floor(Math.random() * adversarios.length)];

    quizEstadoAtual = {
        questoes: prepararQuestoesSemana(),
        adversarioSimb: advEscolhido,
        indiceAtual: 0,
        acertos: 0,
        erros: 0,
        pontuacao: 0,
        respostas: [],
        semanaChave: obterChaveSemana(obterDataAtualDVC()),
        respondido: false,
        streakAtual: 0,
        streakMaximo: 0,
        pontosPorNivel: { "visao_jogo": 0, "pensamento_levantador": 0, "voz_ativa": 0 },
        timerId: null,
        tempoRestante: 15
    };
    renderizarQuestaoAtual();
};

function renderizarQuestaoAtual() {
    if (quizEstadoAtual.indiceAtual >= quizEstadoAtual.questoes.length) {
        salvarEFinalizarQuizSemanal();
        return;
    }

    const questao = quizEstadoAtual.questoes[quizEstadoAtual.indiceAtual];
    const total = quizEstadoAtual.questoes.length;
    const num = quizEstadoAtual.indiceAtual + 1;
    
    const modalAntigo = document.getElementById("m-quiz-semanal");
    if (modalAntigo) modalAntigo.remove();

    const nivelCores = {
        "visao_jogo": "bg-blue-50 text-blue-800 border-blue-200",
        "pensamento_levantador": "bg-purple-50 text-purple-800 border-purple-200",
        "voz_ativa": "bg-orange-50 text-orange-800 border-orange-200"
    };
    const corBadge = nivelCores[questao.nivel] || "bg-gray-100 text-gray-800 border-gray-200";

    // Fases lÃƒÂ³gicas
    let faseInfo = "";
    if (num === 1) faseInfo = `<div class="bg-blue-100 border border-blue-200 text-blue-800 px-3 py-2 rounded-xl text-[10px] font-black uppercase text-center mb-1 animate-fade-in-up">Fase 1 iniciada: Visão de Jogo<br><span class="font-medium normal-case text-[9px] opacity-80">Observe o cenário e encontre os espaços.</span></div>`;
    else if (num === 5) faseInfo = `<div class="bg-purple-100 border border-purple-200 text-purple-800 px-3 py-2 rounded-xl text-[10px] font-black uppercase text-center mb-1 animate-fade-in-up">Fase 2 desbloqueada: Pensamento do Levantador<br><span class="font-medium normal-case text-[9px] opacity-80">Agora é hora de ler o bloqueio e tomar decisões mais difíceis.</span></div>`;
    else if (num === 8) faseInfo = `<div class="bg-orange-100 border border-orange-200 text-orange-800 px-3 py-2 rounded-xl text-[10px] font-black uppercase text-center mb-1 animate-fade-in-up">Fase 3 desbloqueada: Voz Ativa<br><span class="font-medium normal-case text-[9px] opacity-80">Comunique e lidere o time em quadra.</span></div>`;

    // Timer serÃƒÂ¡ apenas visual nesta etapa para nÃƒÂ£o quebrar fluxo, sem puniÃƒÂ§ÃƒÂ£o
    // Limpar timer anterior se existir
    if (quizEstadoAtual.timerId) clearInterval(quizEstadoAtual.timerId);
    quizEstadoAtual.tempoRestante = 15;

    let streakText = "";
    if (quizEstadoAtual.streakAtual === 2) streakText = "Entrando no ritmo";
    else if (quizEstadoAtual.streakAtual === 3 || quizEstadoAtual.streakAtual === 4) streakText = "On Fire";
    else if (quizEstadoAtual.streakAtual >= 5) streakText = "Leitura de Quadra ativada";

    const streakBadge = quizEstadoAtual.streakAtual >= 2 ? `
        <span class="text-[9px] font-black bg-orange-100 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-full uppercase animate-pulse flex items-center">
            <i class="fa-solid fa-fire mr-1"></i> ${streakText}
        </span>
    ` : '';

    const placarSimb = `<span class="text-xs font-black text-indigo-700">DVC ${quizEstadoAtual.acertos}</span> <span class="text-xs font-black text-gray-400 mx-1">X</span> <span class="text-xs font-black text-red-600">${quizEstadoAtual.erros} ${quizEstadoAtual.adversarioSimb || 'Adversário'}</span>`;

    const modal = corrigirTextoVisivelQuizDVC(`
        <div id="m-quiz-semanal" class="fixed inset-0 bg-black/90 backdrop-blur-sm z-[150] flex flex-col p-4 fade-in items-center justify-center">
            <div class="bg-white w-full max-w-lg rounded-3xl relative shadow-2xl flex flex-col overflow-hidden h-[90vh]">
                
                <!-- Progresso e Header Gamificado -->
                <div class="p-4 border-b bg-gray-50 shrink-0">
                    <div class="flex justify-between items-center mb-2">
                        <div class="flex flex-col">
                            <span class="text-[10px] font-black text-gray-500 uppercase tracking-wider">Rally ${num}/${total}</span>
                            <div class="mt-0.5">${placarSimb}</div>
                        </div>
                        <div class="flex flex-col items-end gap-1">
                            <span class="text-[9px] font-black border ${corBadge} px-2 py-1 rounded-full uppercase">${questao.nivelNome}</span>
                            ${streakBadge}
                        </div>
                    </div>
                    <!-- Barra visual de progresso -->
                    <div class="w-full bg-gray-200 rounded-full h-1.5">
                        <div class="bg-indigo-600 h-1.5 rounded-full transition-all duration-500" style="width: ${(num / total) * 100}%"></div>
                    </div>
                </div>

                <!-- ConteÃƒÂºdo (ScrolÃƒÂ¡vel) -->
                <div class="p-5 flex-1 overflow-y-auto custom-scroll flex flex-col gap-4" id="quiz-question-container">
                    
                    ${faseInfo}

                    <!-- Timer Visual -->
                    <div id="quiz-timer-container" class="w-full flex justify-center">
                        <div class="bg-gray-100 px-3 py-1.5 rounded-full flex items-center gap-2 border border-gray-200 shadow-inner">
                            <i class="fa-solid fa-stopwatch text-gray-500"></i>
                            <span class="text-[10px] font-bold text-gray-600 uppercase">Tempo de decisão: <span id="quiz-timer-sec" class="text-indigo-600 font-black text-xs">15</span>s</span>
                        </div>
                    </div>

                    <!-- CenÃƒÂ¡rio -->
                    <div class="bg-indigo-50 border border-indigo-100 text-indigo-900 p-4 rounded-xl shadow-sm mb-3">
                        <p class="text-[9px] font-black uppercase text-indigo-500 mb-1">Cenário</p>
                        <p class="text-[11px] font-medium leading-relaxed">${questao.cenario}</p>
                    </div>

                    <!-- Pergunta -->
                    <p class="text-xs font-bold text-gray-800 px-1 leading-tight">${questao.pergunta}</p>
                    
                    <!-- Alternativas -->
                    <div class="space-y-2 mt-2" id="quiz-alternativas-container">
                        ${questao.alternativas.map((alt, idx) => `
                            <button onclick="window.responderQuestaoQuizDVC(${idx})" class="w-full bg-white border border-gray-200 p-3 rounded-xl text-left text-xs font-medium text-gray-700 transition-all hover:bg-indigo-50 hover:border-indigo-200 active:scale-[0.98] shadow-sm flex items-start gap-3">
                                <div class="w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center shrink-0 mt-0 text-[10px] font-black text-gray-400 bg-gray-50">${String.fromCharCode(65 + idx)}</div>
                                <span class="leading-relaxed flex-1">${alt}</span>
                            </button>
                        `).join("")}
                    </div>

                    <!-- Feedback Box (Oculto inicialmente) -->
                    <div id="quiz-feedback-box" class="hidden rounded-2xl p-4 mt-2 mb-4 animate-fade-in-up"></div>

                </div>

                <!-- Footer com PrÃƒÂ³xima (Oculto) -->
                <div id="quiz-footer" class="p-4 border-t bg-white shrink-0 hidden">
                    <button onclick="window.proximaQuestaoQuizDVC()" class="w-full bg-indigo-700 text-white py-3.5 rounded-2xl font-black text-xs uppercase shadow-md transition-colors hover:bg-indigo-800">
                        ${num === total ? "Fechar desafio da semana" : "Próximo rally"}
                    </button>
                </div>
                
            </div>
        </div>
    `);

    document.body.insertAdjacentHTML('beforeend', modal);

    // Iniciar timer visual
    quizEstadoAtual.timerId = setInterval(() => {
        quizEstadoAtual.tempoRestante--;
        const elTimer = document.getElementById('quiz-timer-sec');
        if (quizEstadoAtual.tempoRestante >= 0 && elTimer) {
            elTimer.innerText = quizEstadoAtual.tempoRestante;
            if (quizEstadoAtual.tempoRestante <= 5) elTimer.classList.add("text-red-600");
        } else if (quizEstadoAtual.tempoRestante < 0) {
            clearInterval(quizEstadoAtual.timerId);
            const containerTimer = document.getElementById('quiz-timer-container');
            if (containerTimer) {
                containerTimer.innerHTML = corrigirTextoVisivelQuizDVC(`
                    <div class="bg-yellow-50 text-yellow-800 p-2 rounded-xl text-[10px] font-bold border border-yellow-200 text-center flex items-center justify-center gap-2">
                        <i class="fa-solid fa-clock"></i> O tempo de decisão acabou. No jogo, ler rápido também faz parte. Escolha com calma para aprender.
                    </div>
                `);
            }
        }
    }, 1000);
}

window.responderQuestaoQuizDVC = (respostaIdx) => {
    // Desabilitar botÃƒÂµes
    const container = document.getElementById("quiz-alternativas-container");
    if (!container) return;
    
    const botoes = container.querySelectorAll("button");
    botoes.forEach(b => {
        b.disabled = true;
        b.classList.add("opacity-60", "cursor-not-allowed");
    });

    // Parar o timer
    if (quizEstadoAtual.timerId) clearInterval(quizEstadoAtual.timerId);

    const questao = quizEstadoAtual.questoes[quizEstadoAtual.indiceAtual];
    const acertou = respostaIdx === questao.correta;
    
    if (acertou) {
        quizEstadoAtual.acertos++;
        quizEstadoAtual.pontuacao += 10;
        quizEstadoAtual.streakAtual++;
        quizEstadoAtual.pontosPorNivel[questao.nivel] = (quizEstadoAtual.pontosPorNivel[questao.nivel] || 0) + 1;
        if (quizEstadoAtual.streakAtual > quizEstadoAtual.streakMaximo) {
            quizEstadoAtual.streakMaximo = quizEstadoAtual.streakAtual;
        }
        // Destacar o botÃƒÂ£o escolhido como certo
        botoes[respostaIdx].classList.remove("opacity-60", "bg-white", "border-gray-200");
        botoes[respostaIdx].classList.add("bg-green-100", "border-green-400", "opacity-100");
    } else {
        quizEstadoAtual.erros++;
        quizEstadoAtual.streakAtual = 0;
        // Destacar o errado de vermelho e o certo de verde
        botoes[respostaIdx].classList.remove("opacity-60", "bg-white", "border-gray-200");
        botoes[respostaIdx].classList.add("bg-red-100", "border-red-400", "opacity-100");
        
        botoes[questao.correta].classList.remove("opacity-60", "bg-white", "border-gray-200");
        botoes[questao.correta].classList.add("bg-green-100", "border-green-400", "opacity-100");
    }

    quizEstadoAtual.respostas.push({
        questaoId: questao.id,
        resposta: respostaIdx,
        acertou: acertou
    });

    // Mostrar feedback
    const feedbackBox = document.getElementById("quiz-feedback-box");
    const footer = document.getElementById("quiz-footer");
    
    const tagsVisuais = ["Leitura de jogo", "Comunicação", "Decisão coletiva", "Tática inteligente", "Cobertura", "Resiliência"];
    const randomTag = tagsVisuais[Math.floor(Math.random() * tagsVisuais.length)];
    const tagHtml = `<span class="inline-block mt-2 bg-white/50 border border-gray-200 text-gray-600 text-[8px] font-black uppercase px-2 py-0.5 rounded-full"><i class="fa-solid fa-tag mr-1"></i>${randomTag}</span>`;

    const feedbackIcon = acertou 
        ? `<i class="fa-solid fa-check-circle text-green-600 text-xl"></i>`
        : `<i class="fa-solid fa-xmark-circle text-red-600 text-xl"></i>`;
    
    const feedbackTitle = acertou 
        ? `<span class="text-green-800 font-black uppercase text-xs">Replay do lance - Ponto DVC!</span>`
        : `<span class="text-red-800 font-black uppercase text-xs">Replay do lance - A bola caiu, mas o aprendizado continua.</span>`;
        
    const feedbackText = acertou ? questao.explicacaoCorreta : questao.feedbackErro;
    const bgColor = acertou ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200";

    feedbackBox.innerHTML = corrigirTextoVisivelQuizDVC(`
        <div class="flex items-center gap-2 mb-2">
            ${feedbackIcon} ${feedbackTitle}
        </div>
        <p class="text-[11px] text-gray-700 font-medium leading-relaxed">
            ${feedbackText}
        </p>
        ${tagHtml}
    `);
    
    feedbackBox.className = `${bgColor} border rounded-2xl p-4 mt-2 mb-4 animate-fade-in-up block`;
    
    if (footer) footer.classList.remove("hidden");
    
    // Rolar para o final para ver o botÃƒÂ£o avanÃƒÂ§ar e o feedback
    setTimeout(() => {
        const scrollContainer = document.getElementById("quiz-question-container");
        if(scrollContainer) scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }, 100);
};

window.proximaQuestaoQuizDVC = () => {
    quizEstadoAtual.indiceAtual++;
    renderizarQuestaoAtual();
};

async function salvarEFinalizarQuizSemanal() {
    // Tela de loading ou desabilitar botÃƒÂµes seria bom
    const modalAntigo = document.getElementById("m-quiz-semanal");
    if (modalAntigo) modalAntigo.innerHTML = corrigirTextoVisivelQuizDVC(`
        <div class="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl flex flex-col items-center justify-center h-64 border border-gray-100">
            <i class="fa-solid fa-spinner fa-spin text-3xl text-indigo-600 mb-4"></i>
            <p class="text-xs font-black uppercase text-gray-500">Salvando resultados...</p>
        </div>
    `);

    try {
        const userUid = auth.currentUser?.uid;
        const userEmail = auth.currentUser?.email;
        if (!userEmail || !userUid) throw new Error("UsuÃƒÂ¡rio nÃƒÂ£o logado ou sem UID/Email.");
        
        const userRef = doc(db, "users", userEmail);
        
        // Regra anti-duplicaÃƒÂ§ÃƒÂ£o e ID seguro: usar UID
        const docQuizId = `${quizEstadoAtual.semanaChave}_${userUid}`;
        const quizRef = doc(db, "quizInteligenciaSemanal", docQuizId);
        
        let quizSnap;
        try {
            quizSnap = await getDoc(quizRef);
        } catch (e) {
            console.error("[QUIZ ERROR] Falha na leitura de quizInteligenciaSemanal:", e);
            throw new Error("Falha na leitura do resultado semanal. Verifique permissÃƒÂµes.");
        }
        
        if (quizSnap.exists()) {
            mostrarTelaFinalQuiz({
                semana: quizEstadoAtual.semanaChave,
                acertos: quizEstadoAtual.acertos,
                pontuacao: quizEstadoAtual.pontuacao,
                jaRespondidoAntes: true
            });
            return;
        }
        
        const questoesSelecionadasIds = quizEstadoAtual.questoes.map(q => q.id);

        const dadosQuiz = {
            uid: userUid,
            email: userEmail,
            nome: window.currentUserData?.nome || window.currentUserData?.displayName || "Atleta",
            quizSemanaChave: quizEstadoAtual.semanaChave,
            respondidoEm: serverTimestamp(),
            totalQuestoes: quizEstadoAtual.questoes.length,
            acertos: quizEstadoAtual.acertos,
            erros: quizEstadoAtual.erros,
            pontuacao: quizEstadoAtual.pontuacao,
            respostas: quizEstadoAtual.respostas,
            questoesSelecionadas: questoesSelecionadasIds,
            versaoQuiz: "2026-06-quiz-semanal-v2"
        };

        let userSnapAtual;
        try {
            userSnapAtual = await getDoc(userRef);
        } catch (e) {
            console.error("[QUIZ ERROR] Falha na leitura de users/{email}:", e);
            throw new Error("Falha ao ler o documento de usuÃƒÂ¡rio.");
        }

        const userDataAtual = userSnapAtual.data() || {};
        const scoreAntigo = Number(userDataAtual.inteligenciaJogo || 0);
        const novoScore = scoreAntigo + quizEstadoAtual.pontuacao;
        
        const melhorPontuacaoAntiga = Number(userDataAtual.melhorPontuacaoQuizInteligencia || 0);
        const melhorPontuacaoNova = quizEstadoAtual.pontuacao > melhorPontuacaoAntiga ? quizEstadoAtual.pontuacao : melhorPontuacaoAntiga;

        // Calcular badges e conquistas
        const badgesAtuais = userDataAtual.badgesQuizInteligencia || {};
        const novosBadges = { ...badgesAtuais };

        const p = quizEstadoAtual.pontosPorNivel || {};
        const maxPts = Math.max(p.visao_jogo || 0, p.pensamento_levantador || 0, p.voz_ativa || 0);
        
        let ultimaBadgeLocal = "";

        if (maxPts > 0) {
            if (p.visao_jogo === maxPts) { novosBadges.visao360 = true; ultimaBadgeLocal = "VisÃƒÂ£o 360"; }
            if (p.pensamento_levantador === maxPts) { novosBadges.estrategista = true; ultimaBadgeLocal = "Estrategista"; }
            if (p.voz_ativa === maxPts) { novosBadges.vozAtiva = true; ultimaBadgeLocal = "Voz Ativa"; }
        }

        if (quizEstadoAtual.streakMaximo >= 5) {
            novosBadges.onFire = true;
            ultimaBadgeLocal = "On Fire";
        }
        if (quizEstadoAtual.acertos >= 8) {
            novosBadges.mestreDaSemana = true;
            ultimaBadgeLocal = "Mestre da Semana";
        }

        const melhorStreakAntigo = Number(userDataAtual.melhorStreakQuiz || 0);
        const melhorStreakNovo = quizEstadoAtual.streakMaximo > melhorStreakAntigo ? quizEstadoAtual.streakMaximo : melhorStreakAntigo;
        const totalDesafiosConcluidos = Number(userDataAtual.totalDesafiosQuizConcluidos || 0) + 1;

        const updatesUser = {
            ultimaSemanaQuizInteligencia: quizEstadoAtual.semanaChave,
            ultimaPontuacaoQuizInteligencia: quizEstadoAtual.pontuacao,
            inteligenciaJogo: novoScore,
            melhorPontuacaoQuizInteligencia: melhorPontuacaoNova,
            quizInteligenciaAtualizadoEm: serverTimestamp(),
            badgesQuizInteligencia: novosBadges,
            totalDesafiosQuizConcluidos: totalDesafiosConcluidos,
            melhorStreakQuiz: melhorStreakNovo,
            ultimaBadgeQuizRecebida: ultimaBadgeLocal || (userDataAtual.ultimaBadgeQuizRecebida || "")
        };

        // Usar writeBatch para garantir operaÃƒÂ§ÃƒÂ£o atÃƒÂ´mica
        try {
            const batch = writeBatch(db);
            batch.set(quizRef, dadosQuiz);
            batch.update(userRef, updatesUser);
            await batch.commit();
        } catch (e) {
            console.error("[QUIZ ERROR] Falha na gravaÃƒÂ§ÃƒÂ£o atÃƒÂ´mica (Batch):", e);
            throw new Error("Falha ao gravar o resultado no banco. Verifique permissÃƒÂµes.");
        }

        // Atualiza cache local
        window.currentUserData = {
            ...window.currentUserData,
            ...updatesUser
        };

        mostrarTelaFinalQuiz({
            semana: quizEstadoAtual.semanaChave,
            acertos: quizEstadoAtual.acertos,
            erros: quizEstadoAtual.erros,
            pontuacao: quizEstadoAtual.pontuacao,
            streakMaximo: quizEstadoAtual.streakMaximo,
            pontosPorNivel: quizEstadoAtual.pontosPorNivel,
            adversarioSimb: quizEstadoAtual.adversarioSimb,
            jaRespondidoAntes: false
        });

    } catch (e) {
        console.error("Erro ao salvar resultado final do quiz:", e);
        
        // Capturar o erro específico de permissão conforme solicitado
        if (e.message && e.message.includes("Missing or insufficient permissions")) {
            alert("Erro de Permissão (Firestore):\nFalha ao tentar gravar/atualizar o resultado. Verifique as regras do Firestore para a coleção 'quizInteligenciaSemanal' ou 'users'.");
        } else {
            alert("Ocorreu um erro ao salvar o resultado. Os dados podem não ter sido gravados.");
        }
        
        if (document.getElementById("m-quiz-semanal")) document.getElementById("m-quiz-semanal").remove();
        renderProfile();
    }
}

function mostrarTelaFinalQuiz(dados = {}) {
    if (document.getElementById("m-quiz-semanal")) document.getElementById("m-quiz-semanal").remove();

    const advFinal = dados.adversarioSimb || "Adversário";
    const erroFinal = dados.erros !== undefined ? dados.erros : (10 - (dados.acertos||0));
    
    let titulo = "Súmula do Set Mental";
    let subtitulo = "Desafio da semana finalizado.";
    let resultadoFinal = "";

    if (dados.jaRespondidoAntes) {
        subtitulo = "Você já disputou o set desta semana. Volte na próxima semana para mais um desafio.";
    } else {
        const ac = dados.acertos || 0;
        if (ac >= 7) {
            resultadoFinal = `<div class="bg-green-100 text-green-800 border border-green-200 px-3 py-1.5 rounded-xl font-black uppercase text-[10px] mb-2 animate-bounce">Vitória DVC!</div>`;
            subtitulo = "Você leu bem a quadra e tomou boas decisões nos momentos importantes.";
        } else if (ac >= 5) {
            resultadoFinal = `<div class="bg-yellow-100 text-yellow-800 border border-yellow-200 px-3 py-1.5 rounded-xl font-black uppercase text-[10px] mb-2">Empate técnico</div>`;
            subtitulo = "Você teve bons momentos, mas ainda pode melhorar a leitura em situações de pressão.";
        } else {
            resultadoFinal = `<div class="bg-red-100 text-red-800 border border-red-200 px-3 py-1.5 rounded-xl font-black uppercase text-[10px] mb-2">Desafio de evolução</div>`;
            subtitulo = "A derrota também ensina: volte aos treinos atento à comunicação e à tomada de decisão.";
        }
    }

    const acertosTexto = dados.acertos !== undefined ? `${dados.acertos}` : "--";
    const pontosTexto = dados.pontuacao !== undefined ? `+${dados.pontuacao}` : "--";
    const streakTexto = dados.streakMaximo !== undefined ? `${dados.streakMaximo}` : "--";

    // Calcular melhor categoria
    let melhorCategoriaNome = "";
    let medalhaNome = "";
    let iconeMedalha = "";
    if (dados.pontosPorNivel) {
        const p = dados.pontosPorNivel;
        const niveisStr = {
            "visao_jogo": { nome: "Visão de Jogo", medalha: "Visão 360", icone: "fa-eye" },
            "pensamento_levantador": { nome: "Pensamento do Levantador", medalha: "Estrategista", icone: "fa-chess-knight" },
            "voz_ativa": { nome: "Voz Ativa", medalha: "Voz Ativa", icone: "fa-bullhorn" }
        };
        const maxPts = Math.max(p.visao_jogo || 0, p.pensamento_levantador || 0, p.voz_ativa || 0);
        if (maxPts > 0) {
            let melhorKey = Object.keys(p).find(k => p[k] === maxPts);
            melhorCategoriaNome = niveisStr[melhorKey].nome;
            medalhaNome = niveisStr[melhorKey].medalha;
            iconeMedalha = niveisStr[melhorKey].icone;
        }
    }

    // Badge de On Fire
    const badgeOnFire = (dados.streakMaximo >= 5) ? `
        <div class="flex items-center gap-1.5 bg-orange-100 text-orange-700 px-3 py-1.5 rounded-xl border border-orange-200">
            <i class="fa-solid fa-fire text-lg"></i>
            <span class="text-[10px] font-black uppercase">On Fire</span>
        </div>
    ` : "";

    const badgeCategoria = melhorCategoriaNome ? `
        <div class="flex flex-col items-center gap-1 bg-indigo-50 text-indigo-700 px-3 py-2 rounded-xl border border-indigo-100 flex-1">
            <i class="fa-solid ${iconeMedalha} text-xl"></i>
            <span class="text-[9px] font-black uppercase text-center">${medalhaNome}</span>
        </div>
    ` : "";

    const medalhasArea = (!dados.jaRespondidoAntes && (badgeOnFire || badgeCategoria)) ? `
        <div class="w-full mt-2 mb-6 flex gap-2 justify-center">
            ${badgeCategoria}
            ${badgeOnFire}
        </div>
    ` : "";

    const cardErrosSequencia = (!dados.jaRespondidoAntes) ? `
        <div class="flex gap-4 w-full mb-4">
            <div class="flex-1 bg-green-50 border border-green-100 p-3 rounded-2xl flex flex-col items-center justify-center">
                <span class="text-[9px] font-black uppercase text-green-600 mb-1 text-center">Placar Oficial</span>
                <span class="text-2xl font-black text-green-800">${pontosTexto} <span class="text-[10px]">pts</span></span>
            </div>
            <div class="flex-1 bg-orange-50 border border-orange-100 p-3 rounded-2xl flex flex-col items-center justify-center">
                <span class="text-[9px] font-black uppercase text-orange-600 mb-1 text-center">Maior Sequência</span>
                <span class="text-2xl font-black text-orange-800">${streakTexto}</span>
            </div>
        </div>
    ` : "";

    const modal = corrigirTextoVisivelQuizDVC(`
        <div id="m-quiz-semanal-fim" class="fixed inset-0 bg-black/90 backdrop-blur-sm z-[150] p-4 flex items-center justify-center fade-in">
            <div class="bg-white w-full max-w-sm rounded-3xl p-6 relative shadow-2xl flex flex-col items-center text-center border border-gray-100 max-h-[90vh] overflow-y-auto custom-scroll">
                <div class="w-16 h-16 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-3 shrink-0">
                    <i class="fa-solid fa-clipboard-list text-indigo-600 text-3xl"></i>
                </div>
                
                <h2 class="font-black text-lg text-gray-900 uppercase leading-tight">${titulo}</h2>
                <div class="mt-2 flex flex-col items-center">
                    ${resultadoFinal}
                </div>
                <p class="text-[11px] text-gray-500 font-semibold mt-2 mb-5 px-2 leading-relaxed">
                    ${subtitulo}
                </p>

                <!-- Placar SimbÃƒÂ³lico DVC X AdversÃƒÂ¡rio -->
                ${!dados.jaRespondidoAntes ? `
                <div class="flex items-center justify-center w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 mb-4">
                    <div class="text-right flex-1">
                        <span class="block text-[9px] font-black uppercase text-indigo-500 truncate max-w-[80px]">DVC</span>
                        <span class="text-2xl font-black text-indigo-900 leading-none">${acertosTexto}</span>
                    </div>
                    <span class="text-gray-300 font-black px-4">X</span>
                    <div class="text-left flex-1">
                        <span class="block text-[9px] font-black uppercase text-red-500 truncate max-w-[80px]">${advFinal}</span>
                        <span class="text-2xl font-black text-red-900 leading-none">${erroFinal}</span>
                    </div>
                </div>
                ` : ""}

                ${cardErrosSequencia}
                ${medalhasArea}

                <p class="text-[10px] font-bold text-gray-400 uppercase mb-4 tracking-wider">
                    Semana Chave: ${dados.semana || 'Atual'}
                </p>
                
                <button onclick="window.fecharTelaFinalQuizDVC()" class="w-full bg-gray-900 text-white py-3.5 rounded-2xl font-black text-xs uppercase shadow-md transition-colors hover:bg-black shrink-0">
                    Sair da Quadra
                </button>
            </div>
        </div>
    `);
    
    document.body.insertAdjacentHTML('beforeend', modal);
}

window.fecharTelaFinalQuizDVC = () => {
    if (document.getElementById("m-quiz-semanal-fim")) document.getElementById("m-quiz-semanal-fim").remove();
    renderProfile();
};

const iniciarQuizVolei = window.iniciarQuizVolei;

export {
    renderQuizPerfilHtmlDVC,
    iniciarQuizVolei
};


