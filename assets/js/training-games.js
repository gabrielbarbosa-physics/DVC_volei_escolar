/**
 * ============================================================================
 * Módulo: TRAINING-GAMES
 * ============================================================================
 * Responsabilidade: Gerencia funcionalidades relacionadas a training-games.
 * Este arquivo faz parte do sistema modular do DVC App.
 * Todos os códigos principais aqui agrupados seguem as diretrizes do projeto.
 * ============================================================================
 */

﻿// TRAINING GAMES MODULE DVC APP

import { auth, db, doc, getDoc, updateDoc, collection, getDocs, setDoc, serverTimestamp } from "./firebase.js";
import { currentUserData } from "./state.js";

import {
    escaparHtml,
    safeEditParam,
    normalizarStatusJogoTreinoDVC,
    getValorNumericoPlacarTreino,
    formatarPlacarTreino,
    getStatusVisualJogoTreino,
    renderBadgeDVC,
    renderBadgesAtletaDVC,
    normalizarHabilidadesDVC,
    normalizarSexoSorteioTreino,
    normalizarFuncaoVoleiSorteio,
    getNomeFuncaoVoleiDVC,
    corrigirMojibakeDVC
} from "./utils.js";

const TODAS_HABILIDADES_DVC = window.TODAS_HABILIDADES_DVC || [];

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

async function carregarEventosCacheMockDVC(force = false) {
    if (typeof window.carregarEventosCacheMockDVC === "function") {
        return window.carregarEventosCacheMockDVC(force);
    }

    return { forEach() {} };
}

async function carregarEventosCacheDVC(force = false) {
    if (typeof window.carregarEventosCacheDVC === "function") {
        return window.carregarEventosCacheDVC(force);
    }

    if (typeof window.carregarEventosCache === "function") {
        return window.carregarEventosCache(force);
    }

    return [];
}

async function carregarEventosCache(forcar = false) {
    if (typeof window.carregarEventosCache === "function") {
        return window.carregarEventosCache(forcar);
    }

    return [];
}

async function carregarPresencasEventoDVC(eventId, force = false) {
    return typeof window.carregarPresencasEventoDVC === "function"
        ? window.carregarPresencasEventoDVC(eventId, force)
        : [];
}

async function carregarConvocadosEventoDVC(eventId, force = false) {
    return typeof window.carregarConvocadosEventoDVC === "function"
        ? window.carregarConvocadosEventoDVC(eventId, force)
        : [];
}

async function obterUsuarioCacheDVC(email, force = false) {
    return typeof window.obterUsuarioCacheDVC === "function"
        ? window.obterUsuarioCacheDVC(email, force)
        : null;
}

function usuarioPodeSerEscaladoComoAtleta(user = {}) {
    return typeof window.usuarioPodeSerEscaladoComoAtleta === "function"
        ? window.usuarioPodeSerEscaladoComoAtleta(user)
        : true;
}

function usuarioTemStatusConvocavel(user = {}) {
    return typeof window.usuarioTemStatusConvocavel === "function"
        ? window.usuarioTemStatusConvocavel(user)
        : true;
}

function usuarioPodeSerConvocadoPorFinanceiro(user = {}) {
    return typeof window.usuarioPodeSerConvocadoPorFinanceiro === "function"
        ? window.usuarioPodeSerConvocadoPorFinanceiro(user)
        : true;
}

function limparCacheDados(tipo = "todos") {
    if (typeof window.limparCacheDados === "function") {
        return window.limparCacheDados(tipo);
    }
}

function chamadaTemAlteracoesPendentes(evId) {
    if (typeof window.chamadaTemAlteracoesPendentes === "function") {
        return window.chamadaTemAlteracoesPendentes(evId);
    }

    const temp = window.chamadaTempDVC?.[evId];
    const salva = window.chamadaSalvaDVC?.[evId];
    if (!temp || !salva) return false;
    if (temp.size !== salva.size) return true;
    for (const email of temp) {
        if (!salva.has(email)) return true;
    }
    return false;
}

function presencaEhPresenteTreinoDVC(presenca = {}) {
    return presenca.presente === true || presenca.presente === undefined;
}

function presencaParticipaDoSorteioTreinoDVC(presenca = {}) {
    return presencaEhPresenteTreinoDVC(presenca) &&
        presenca.ativoNoTreino !== false &&
        presenca.saiuMaisCedo !== true;
}

function getResumoPresencasSorteioTreinoDVC(presencas = []) {
    const presentes = presencas.filter(presencaEhPresenteTreinoDVC);
    const ativos = presentes.filter(presencaParticipaDoSorteioTreinoDVC);

    return {
        presentes: presentes.length,
        ativos: ativos.length,
        foraSorteio: presentes.length - ativos.length
    };
}

function getTextoForaSorteioTreinoDVC(qtd = 0) {
    if (qtd <= 0) return "";
    return `${qtd} atleta${qtd === 1 ? "" : "s"} presente${qtd === 1 ? "" : "s"} ${qtd === 1 ? "está" : "estão"} fora do sorteio porque ${qtd === 1 ? "saiu" : "saíram"} antes do fim.`;
}

function renderMural() {
    if (typeof window.renderMural === "function") {
        return window.renderMural();
    }
}

function renderCalendar() {
    if (typeof window.renderCalendar === "function") {
        return window.renderCalendar();
    }
}

function limparCacheDVC(chave = null) {
    if (typeof window.limparCacheDVC === "function") {
        return window.limparCacheDVC(chave);
    }
}


async function abrirAvaliacaoAtletasDoTreino(eventId) {
    if (typeof window.abrirAvaliacaoAtletasDoTreino === "function") {
        return window.abrirAvaliacaoAtletasDoTreino(eventId);
    }
}

window.graficosTimesTreino = window.graficosTimesTreino || {};

// ============================================================================
// SECAO 09A - JOGOS/TREINOS DO MURAL: RENDERIZACAO E LEITURA
// ============================================================================
function jogoTreinoEncerradoDVC(rodada = {}) {
    const status = normalizarStatusJogoTreinoDVC(rodada.status);
    return status === "concluido" || status === "finalizado" || status === "cancelado";
}

function jogoTreinoConcluidoDVC(rodada = {}) {
    return normalizarStatusJogoTreinoDVC(rodada.status) === "concluido";
}

function treinoEstaFinalizadoDVC(evento = {}) {
  const status = String(evento.statusTreino || evento.status || "").trim().toLowerCase();

  if (evento.finalizadoEm) return true;

  if (
    status === "finalizado" ||
    status === "concluido" ||
    status === "concluído"
  ) {
    return true;
  }

  return false;
}

function eventoTreinoSorteioFinalizadoDVC(evento = {}, rodadasTreino = []) {
    if (rodadasTreino && rodadasTreino.length > 0 && !evento.rodadasTreino) {
        evento.rodadasTreino = rodadasTreino;
    }
    return treinoEstaFinalizadoDVC(evento);
}
window.treinoEstaFinalizadoDVC = treinoEstaFinalizadoDVC;

function obterTimePorIdSorteio(times = [], timeId = "") {
    return times.find(time => time.id === timeId) || null;
}

function getProximoJogoPendenteTreino(rodadasTreino = []) {
    return [...rodadasTreino]
        .filter(r => !jogoTreinoEncerradoDVC(r))
        .sort((a, b) => Number(a.ordem || 0) - Number(b.ordem || 0))[0] || null;
}

function calcularMediaHabilidadesTime(atletas = []) {
    const atletasValidos = Array.isArray(atletas) ? atletas : [];
    const totais = {};

    TODAS_HABILIDADES_DVC.forEach(skill => {
        totais[skill.id] = 0;
    });

    if (atletasValidos.length === 0) {
        const mediaVazia = {};

        TODAS_HABILIDADES_DVC.forEach(skill => {
            mediaVazia[skill.id] = 0;
        });

        return {
            mediaHabilidades: mediaVazia,
            scoreMedio: 0
        };
    }

    atletasValidos.forEach(atleta => {
        const habilidades = normalizarHabilidadesDVC(atleta.habilidades || {});

        TODAS_HABILIDADES_DVC.forEach(skill => {
            totais[skill.id] += Number(habilidades[skill.id] || 0);
        });
    });

    const mediaHabilidades = {};

    TODAS_HABILIDADES_DVC.forEach(skill => {
        mediaHabilidades[skill.id] = Number((totais[skill.id] / atletasValidos.length).toFixed(1));
    });

    const somaScores = atletasValidos.reduce((total, atleta) => {
        const score = Number(atleta.scoreGeral);
        return total + (Number.isFinite(score) ? score : calcularScoreGeralDVC(atleta.habilidades || {}));
    }, 0);

    return {
        mediaHabilidades,
        scoreMedio: Number((somaScores / atletasValidos.length).toFixed(1))
    };
}

window.calcularMediaHabilidadesTime = calcularMediaHabilidadesTime;

function renderizarRadarComparativoTimes(timeA, timeB, canvasId) {
    if (typeof Chart === "undefined") {
        console.warn("Chart.js nao carregado para o radar de times.");
        return;
    }

    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    window.graficosTimesTreino = window.graficosTimesTreino || {};

    if (window.graficosTimesTreino[canvasId]) {
        window.graficosTimesTreino[canvasId].destroy();
        delete window.graficosTimesTreino[canvasId];
    }

    const labels = TODAS_HABILIDADES_DVC.map(skill => skill.nome || skill.id);
    const dadosA = TODAS_HABILIDADES_DVC.map(skill => Number(timeA?.mediaHabilidades?.[skill.id] || 0));
    const dadosB = TODAS_HABILIDADES_DVC.map(skill => Number(timeB?.mediaHabilidades?.[skill.id] || 0));

    window.graficosTimesTreino[canvasId] = new Chart(canvas, {
        type: "radar",
        data: {
            labels,
            datasets: [
                {
                    label: timeA?.nome || "Time A",
                    data: dadosA,
                    backgroundColor: "rgba(153,0,0,0.14)",
                    borderColor: "#990000",
                    borderWidth: 2,
                    pointBackgroundColor: "#990000"
                },
                {
                    label: timeB?.nome || "Time B",
                    data: dadosB,
                    backgroundColor: "rgba(17,24,39,0.12)",
                    borderColor: "#111827",
                    borderWidth: 2,
                    pointBackgroundColor: "#111827"
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        font: {
                            size: 9,
                            weight: "bold"
                        }
                    }
                }
            },
            scales: {
                r: {
                    min: 0,
                    max: 5,
                    ticks: {
                        stepSize: 1,
                        font: {
                            size: 8
                        }
                    },
                    pointLabels: {
                        font: {
                            size: 8,
                            weight: "bold"
                        }
                    }
                }
            }
        }
    });
}

window.renderizarRadarComparativoTimes = renderizarRadarComparativoTimes;

function calcularClassificacaoTreino(timesSorteados = [], rodadasTreino = []) {
    const tabela = {};

    timesSorteados.forEach(time => {
        tabela[time.id] = {
            timeId: time.id,
            nome: time.nome || time.id,
            jogos: 0,
            vitorias: 0,
            derrotas: 0,
            pontosFeitos: 0,
            pontosSofridos: 0,
            saldo: 0,
            aproveitamento: 0
        };
    });

    rodadasTreino.forEach(rodada => {
        if (!jogoTreinoConcluidoDVC(rodada)) return;

        const pontosA = getValorNumericoPlacarTreino(rodada.pontosA);
        const pontosB = getValorNumericoPlacarTreino(rodada.pontosB);

        if (pontosA === null || pontosB === null) return;
        if (!tabela[rodada.timeAId] || !tabela[rodada.timeBId]) return;

        const timeA = tabela[rodada.timeAId];
        const timeB = tabela[rodada.timeBId];

        timeA.jogos += 1;
        timeB.jogos += 1;

        timeA.pontosFeitos += pontosA;
        timeA.pontosSofridos += pontosB;
        timeB.pontosFeitos += pontosB;
        timeB.pontosSofridos += pontosA;

        const vencedorId = rodada.vencedorId || (pontosA > pontosB ? rodada.timeAId : rodada.timeBId);

        if (vencedorId === rodada.timeAId) {
            timeA.vitorias += 1;
            timeB.derrotas += 1;
        } else if (vencedorId === rodada.timeBId) {
            timeB.vitorias += 1;
            timeA.derrotas += 1;
        }
    });

    Object.values(tabela).forEach(item => {
        item.saldo = item.pontosFeitos - item.pontosSofridos;
        item.aproveitamento = item.jogos > 0
            ? Number(((item.vitorias / item.jogos) * 100).toFixed(1))
            : 0;
    });

    return Object.values(tabela).sort((a, b) => {
        if (b.vitorias !== a.vitorias) return b.vitorias - a.vitorias;
        if (b.saldo !== a.saldo) return b.saldo - a.saldo;
        if (b.pontosFeitos !== a.pontosFeitos) return b.pontosFeitos - a.pontosFeitos;
        if (a.pontosSofridos !== b.pontosSofridos) return a.pontosSofridos - b.pontosSofridos;
        return a.nome.localeCompare(b.nome);
    });
}

window.calcularClassificacaoTreino = calcularClassificacaoTreino;

window.toggleTeamList = function (listId, iconId) {
    const listEl = document.getElementById(listId);
    const iconEl = document.getElementById(iconId);
    if (listEl) {
        listEl.classList.toggle('hidden');
        listEl.classList.toggle('flex');
    }
    if (iconEl) {
        iconEl.classList.toggle('rotate-180');
    }
};

function renderizarClassificacaoTreinoHtml(classificacao = [], finalizado = false, eventId = null, times = []) {
    if (!classificacao.length) {
        return `
            <div class="bg-white border border-dashed rounded-2xl p-3 text-center">
                <p class="text-[9px] font-black text-gray-400 uppercase">Classificacao ainda sem jogos.</p>
            </div>
        `;
    }

    return `
        <div class="space-y-2">
            ${classificacao.map((item, index) => {
                const time = times && Array.isArray(times) ? times.find(t => t.id === item.id) : null;
                const temAtletas = time && Array.isArray(time.atletas) && time.atletas.length > 0;

                const cardClass = `${index === 0 && finalizado ? 'bg-red-50 border-red-100' : 'bg-white border-gray-100'} border rounded-2xl p-3 shadow-sm block transition`;
                const clickHandler = temAtletas
                    ? `onclick="toggleTeamList('lista-time-main-${index}', 'icon-time-main-${index}')" class="${cardClass} cursor-pointer"`
                    : (eventId && item.id ? `onclick="abrirModalTimeIndividualTreino('${safeEditParam(eventId)}', '${safeEditParam(item.id)}')" class="${cardClass} cursor-pointer"` : `class="${cardClass}"`);

                const tag = (eventId && item.id && !temAtletas) ? 'button' : 'div';

                return `
                <${tag} ${clickHandler}>
                    <div class="flex items-center justify-between gap-3">
                        <div class="flex items-center gap-3 min-w-0">
                            <div class="${index === 0 ? 'bg-[#990000] text-white' : 'bg-gray-100 text-gray-600'} w-9 h-9 rounded-xl flex items-center justify-center text-[10px] font-black shrink-0">
                                ${index + 1}
                            </div>
                            <div class="min-w-0">
                                <p class="text-xs font-black uppercase text-gray-900 truncate">${item.nome}</p>
                                <p class="text-[8px] font-bold uppercase text-gray-400">
                                    ${item.vitorias}V ${item.derrotas}D - Saldo ${item.saldo}
                                </p>
                            </div>
                        </div>
                        <div class="text-right shrink-0 flex items-center gap-2">
                            <div>
                                <p class="text-xs font-black text-[#990000]">${item.aproveitamento}%</p>
                                <p class="text-[8px] font-black uppercase text-gray-400">${item.pontosFeitos}/${item.pontosSofridos}</p>
                            </div>
                            ${temAtletas ? `<i id="icon-time-main-${index}" class="fa-solid fa-chevron-down text-xs text-gray-400 transition-transform duration-300 ml-1"></i>` : ''}
                        </div>
                    </div>
                    ${temAtletas ? `
                    <div id="lista-time-main-${index}" onclick="event.stopPropagation()" class="hidden flex-col gap-1 mt-3 pt-3 border-t border-gray-100">
                        ${time.atletas.map(atleta => {
                            const nomeCompleto = atleta.nome || atleta.email || "Atleta";
                            const partes = nomeCompleto.trim().split(" ");
                            const nomeFormatado = partes.length > 1 ? partes[0] + " " + partes[partes.length - 1] : partes[0];
                            const isVisitante = atleta.tipoParticipante === 'visitante';
                            return '<p class="text-[10px] text-gray-500 font-medium">' + nomeFormatado + ' ' + (isVisitante ? '<span class="text-yellow-500 font-bold">(V)</span>' : '') + '</p>';
                        }).join("")}
                    </div>
                    ` : ''}
                </${tag}>
                `;
            }).join("")}
        </div>
    `;
}

function renderizarCardJogoTreinoMural(evento, jogo, proximoPendente) {
    const status = getStatusVisualJogoTreino(jogo.status);
    const destaqueProximo = proximoPendente && proximoPendente.id === jogo.id;
    const bloqueado = normalizarStatusJogoTreinoDVC(jogo.status) === "pendente" && proximoPendente && proximoPendente.id !== jogo.id;
    const placar = formatarPlacarTreino(jogo);

    return `
        <button onclick="abrirModalJogoTreino('${safeEditParam(evento.id)}', '${safeEditParam(jogo.id)}')" class="w-full text-left ${destaqueProximo ? 'bg-gray-950 text-white border-[#990000] shadow-lg' : 'bg-white text-gray-900 border-gray-100'} ${bloqueado ? 'opacity-70' : ''} border rounded-2xl p-3 shadow-sm active:scale-[0.99] transition">
            <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                    <p class="text-[8px] font-black uppercase ${destaqueProximo ? 'text-red-100' : 'text-[#990000]'}">Rodada ${jogo.rodada} - Jogo ${jogo.ordem}</p>
                    <p class="text-xs font-black uppercase truncate mt-1">${escaparHtml(jogo.timeANome)} x ${escaparHtml(jogo.timeBNome)}</p>
                </div>
                <span class="inline-flex items-center justify-center shrink-0 whitespace-nowrap leading-none text-[8px] font-black uppercase border px-2.5 py-1 rounded-full ${destaqueProximo ? 'bg-white text-[#990000] border-white' : status.classe}">
                    ${destaqueProximo ? 'Proximo' : status.texto}
                </span>
            </div>
            <div class="grid grid-cols-2 gap-2 mt-3">
                <div class="${destaqueProximo ? 'bg-white/10 border-white/10' : 'bg-gray-50 border-gray-100'} border rounded-xl p-2 text-center">
                    <p class="text-[8px] font-black uppercase ${destaqueProximo ? 'text-white/55' : 'text-gray-400'}">Placar</p>
                    <p class="text-sm font-black">${placar}</p>
                </div>
                <div class="${destaqueProximo ? 'bg-white/10 border-white/10' : 'bg-gray-50 border-gray-100'} border rounded-xl p-2 text-center">
                    <p class="text-[8px] font-black uppercase ${destaqueProximo ? 'text-white/55' : 'text-gray-400'}">Status</p>
                    <p class="text-[9px] font-black uppercase">${status.texto}</p>
                </div>
            </div>
        </button>
    `;
}

window.mostrarHistoricoCompletoTreinosDVC = window.mostrarHistoricoCompletoTreinosDVC || false;
window.toggleHistoricoTreinosDVC = () => {
    window.mostrarHistoricoCompletoTreinosDVC = !window.mostrarHistoricoCompletoTreinosDVC;
    if (window.__abaAtualDVC === "calendar") {
        renderCalendar();
    } else {
        renderMural();
    }
};

function getStatusAvaliacaoTreinoDVC(evento = {}) {
    const status = String(evento.avaliacaoTecnicaStatus || "").trim();
    const normalizado = status
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

    if (normalizado === "aprovada" || normalizado === "realizada" || normalizado === "concluida" || normalizado === "concluido") {
        return { texto: "Avaliação realizada", tipo: "verde" };
    }

    if (normalizado === "pendente" || normalizado === "aberta") {
        return { texto: "Avaliação pendente", tipo: "amarelo" };
    }

    if (normalizado === "rejeitada" || normalizado === "recusada") {
        return { texto: "Avaliação recusada", tipo: "amarelo" };
    }

    return { texto: "Avaliação pendente", tipo: "amarelo" };
}

function renderizarEventoJogosTreinoMural(evento, finalizado = false) {
    const podeGerenciar = usuarioEhEquipeTecnica();
    const times = Array.isArray(evento.timesSorteados) ? evento.timesSorteados : [];
    const rodadas = Array.isArray(evento.rodadasTreino) ? [...evento.rodadasTreino] : [];
    rodadas.sort((a, b) => Number(a.ordem || 0) - Number(b.ordem || 0));

    const classificacao = Array.isArray(evento.classificacaoTreino) && evento.classificacaoTreino.length
        ? evento.classificacaoTreino
        : calcularClassificacaoTreino(times, rodadas);
    const proximo = finalizado ? null : getProximoJogoPendenteTreino(rodadas);
    const campeao = finalizado ? classificacao[0] : null;
    const statusAvaliacao = getStatusAvaliacaoTreinoDVC(evento);
    const acaoPartidasTreino = proximo
        ? `<button onclick="abrirModalJogoTreino('${safeEditParam(evento.id)}', '${safeEditParam(proximo.id)}')" class="w-full bg-gray-900 text-white py-2.5 rounded-2xl text-[9px] font-black uppercase shadow-sm"><i class="fa-solid fa-forward-step mr-1"></i> Próximo jogo</button>`
        : `<button onclick="abrirModalTimesTreino('${safeEditParam(evento.id)}')" class="w-full bg-gray-900 text-white py-2.5 rounded-2xl text-[9px] font-black uppercase shadow-sm"><i class="fa-solid fa-list-check mr-1"></i> Ver partidas</button>`;

    return `
        <div class="bg-white border border-gray-100 rounded-3xl p-4 shadow-sm overflow-hidden">
            <div class="flex items-start justify-between gap-3 mb-3">
                <div class="min-w-0">
                    <p class="text-[8px] font-black uppercase text-gray-400">${finalizado ? 'Classificação final' : 'Classificação parcial'}</p>
                    <h4 class="text-sm font-black uppercase text-gray-900 truncate">${escaparHtml(evento.titulo || "Treino DVC")}</h4>
                    <p class="text-[9px] font-bold text-gray-400 uppercase mt-1">
                        ${evento.data ? new Date(evento.data).toLocaleString("pt-BR") : "Data não informada"}
                    </p>
                </div>
                <div class="shrink-0 flex flex-col items-end gap-1">
                    ${renderBadgeDVC(finalizado ? "Finalizado" : "Em andamento", finalizado ? "verde" : "vermelho")}
                    ${finalizado ? renderBadgeDVC(statusAvaliacao.texto, statusAvaliacao.tipo) : ""}
                </div>
            </div>

            <div class="grid grid-cols-2 gap-2 mb-3">
                <button onclick="abrirModalTimesTreino('${safeEditParam(evento.id)}')" class="bg-gray-950 text-white py-2.5 rounded-2xl text-[9px] font-black uppercase shadow-sm">
                    <i class="fa-solid fa-people-group mr-1"></i> Ver times
                </button>
                ${finalizado && podeGerenciar ? `
                    <button onclick="abrirAvaliacaoAtletasDoTreino('${safeEditParam(evento.id)}')" class="bg-[#990000] text-white py-2.5 rounded-2xl text-[9px] font-black uppercase shadow-sm">
                        <i class="fa-solid fa-clipboard-check mr-1"></i> Avaliar atletas
                    </button>
                ` : `
                    <button onclick="abrirModalTimesTreino('${safeEditParam(evento.id)}')" class="bg-red-50 text-[#990000] border border-red-100 py-2.5 rounded-2xl text-[9px] font-black uppercase">
                        Times sorteados
                    </button>
                `}
            </div>

            ${campeao ? `
                <div class="bg-[#990000] text-white rounded-2xl p-3 mb-3 flex items-center justify-between gap-3">
                    <div>
                        <p class="text-[8px] font-black uppercase text-white/60">Campeão do treino</p>
                        <p class="text-xs font-black uppercase">${escaparHtml(campeao.nome)}</p>
                    </div>
                    <i class="fa-solid fa-trophy text-lg text-red-100"></i>
                </div>
            ` : ''}

            <div class="mb-3">
                ${renderizarClassificacaoTreinoHtml(classificacao, finalizado, evento.id, times)}
            </div>

            <details class="bg-gray-50 border border-gray-100 rounded-2xl shadow-sm overflow-hidden mb-3">
                <summary class="cursor-pointer list-none p-3 flex items-center justify-between">
                    <div>
                        <p class="text-[10px] font-black uppercase text-[#990000]">Jogos do treino</p>
                        <p class="text-[9px] font-bold text-gray-400 uppercase">Toque para ver partidas e placares</p>
                    </div>
                    <i class="fa-solid fa-chevron-down text-gray-400"></i>
                </summary>
                <div class="px-3 pb-3 space-y-2">
                    ${rodadas.map(jogo => renderizarCardJogoTreinoMural(evento, jogo, proximo)).join("")}
                </div>
            </details>

            ${!finalizado ? `
                <div class="${podeGerenciar ? 'grid grid-cols-2' : 'grid grid-cols-1'} gap-2 mt-3">
                    ${acaoPartidasTreino}
                    ${podeGerenciar ? `
                        <button onclick="abrirModalConfigSorteioTreino('${safeEditParam(evento.id)}')" class="w-full bg-[#990000] text-white py-2.5 rounded-2xl text-[9px] font-black uppercase shadow-sm">
                            <i class="fa-solid fa-shuffle mr-1"></i> Sortear novamente com presentes
                        </button>
                    ` : ''}
                </div>
            ` : ''}
        </div>
    `;
}

function avaliacaoTreinoPendenteDVC(evento = {}) {
    const statusAvaliacao = getStatusAvaliacaoTreinoDVC(evento);
    return corrigirMojibakeDVC(statusAvaliacao.texto)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .includes("pendente");
}

function renderizarCardTreinoFinalizadoCompactoDVC(evento = {}) {
    const podeGerenciar = usuarioEhEquipeTecnica();
    const statusAvaliacao = getStatusAvaliacaoTreinoDVC(evento);
    const avaliacaoPendente = avaliacaoTreinoPendenteDVC(evento);
    const dataFormatada = evento.data
        ? new Date(evento.data).toLocaleString("pt-BR")
        : "Data não informada";

    return `
        <article class="bg-gray-50 border border-gray-100 rounded-2xl p-3">
            <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                    <h4 class="text-xs font-black uppercase text-gray-900 truncate">${escaparHtml(evento.titulo || "Treino DVC")}</h4>
                    <p class="text-[9px] font-bold text-gray-400 uppercase mt-1">${dataFormatada}</p>
                    <div class="flex flex-wrap gap-1 mt-2">
                        ${renderBadgeDVC("Finalizado", "verde")}
                        ${renderBadgeDVC(statusAvaliacao.texto, statusAvaliacao.tipo)}
                    </div>
                </div>
                <i class="fa-solid fa-check-circle text-green-500 text-lg shrink-0 mt-1"></i>
            </div>

            <div class="grid grid-cols-2 gap-2 mt-3">
                <button onclick="abrirResumoTreinoFinalizadoDVC('${safeEditParam(evento.id)}')" class="bg-white border border-gray-200 text-gray-700 py-2.5 rounded-xl text-[8px] font-black uppercase shadow-sm">
                    Ver resumo
                </button>
                ${podeGerenciar && avaliacaoPendente ? `
                    <button onclick="abrirAvaliacaoAtletasDoTreino('${safeEditParam(evento.id)}')" class="bg-[#990000] text-white py-2.5 rounded-xl text-[8px] font-black uppercase shadow-sm">
                        Avaliar atletas
                    </button>
                ` : `
                    <button onclick="abrirModalTimesTreino('${safeEditParam(evento.id)}')" class="bg-red-50 text-[#990000] border border-red-100 py-2.5 rounded-xl text-[8px] font-black uppercase">
                        Ver times
                    </button>
                `}
            </div>
        </article>
    `;
}

async function carregarJogosTreinoNoMural() {
    try {
        const el = document.getElementById("mural-sequencia-jogos");
        if (!el) return;

        el.classList.add("hidden");
        el.innerHTML = "";

        const eventosSnap = await carregarEventosCacheMockDVC();
        const eventosComJogos = [];

        eventosSnap.forEach(eventoDoc => {
            const ev = eventoDoc.data();
            const rodadas = Array.isArray(ev.rodadasTreino) ? ev.rodadasTreino : [];

            if (ev.sorteioTimesAtivo === true || ev.sorteioTimesFinalizado === true || rodadas.length > 0) {
                eventosComJogos.push({
                    id: eventoDoc.id,
                    ...ev,
                    rodadasTreino: rodadas
                });
            }
        });

        eventosComJogos.sort((a, b) => {
            const dataA = new Date(a.sorteioTimesCriadoEm || a.data || 0);
            const dataB = new Date(b.sorteioTimesCriadoEm || b.data || 0);
            return dataB - dataA;
        });

        if (eventosComJogos.length === 0) {
            return;
        }

        el.classList.remove("hidden");
        const eventosNormalizados = eventosComJogos.map(evento => {
            const rodadas = Array.isArray(evento.rodadasTreino) ? [...evento.rodadasTreino] : [];
            rodadas.sort((a, b) => Number(a.ordem || 0) - Number(b.ordem || 0));

            return {
                ...evento,
                rodadasTreino: rodadas,
                finalizadoTreinoDVC: eventoTreinoSorteioFinalizadoDVC(evento, rodadas)
            };
        });

        const eventosAtivos = eventosNormalizados.filter(evento => !evento.finalizadoTreinoDVC);

        const btnBanner = document.getElementById("banner-dynamic-sequencia");
        if (btnBanner) {
            if (eventosAtivos.length > 0) {
                btnBanner.classList.remove("hidden");
                btnBanner.innerHTML = `
                    <button onclick="window.verSequenciaJogosBanner()" class="w-full bg-white text-[#990000] border border-white shadow-xl py-3 rounded-2xl flex items-center justify-center gap-2 font-black uppercase text-[10px] active:scale-95 transition mt-3">
                        <i class="fa-solid fa-play"></i> Acompanhar Jogos em Andamento
                    </button>
                `;
            } else {
                btnBanner.classList.add("hidden");
                btnBanner.innerHTML = "";
            }
        }

        if (eventosAtivos.length === 0) {
            el.classList.add("hidden");
            el.innerHTML = "";
            return;
        }

        el.classList.remove("hidden");
        el.innerHTML = `
            <p class="text-[10px] font-black text-[#990000] uppercase mb-2">
                <i class="fa-solid fa-list-ol mr-1"></i> Jogos do Treino
            </p>

            <div class="space-y-4">
                ${eventosAtivos.map(evento => renderizarEventoJogosTreinoMural(evento, false)).join("")}
            </div>
        `;

    } catch (e) {
        console.error("Erro ao carregar jogos do treino no muralá", e);
    }
}

window.carregarJogosTreinoNoMural = carregarJogosTreinoNoMural;

function renderizarListaAtletasTimeTreino(time) {
    const atletas = Array.isArray(time?.atletas) ? time.atletas : [];

    if (!atletas.length) {
        return `<p class="text-[9px] font-bold text-gray-400 uppercase">Nenhum atleta neste time.</p>`;
    }

    return atletas.map((atleta, index) => `
        <div class="flex items-start justify-between gap-2 border-b border-gray-100 last:border-b-0 py-2">
            <div class="min-w-0">
                <p class="text-[10px] font-bold text-gray-800 truncate ${atleta.tipoParticipante !== 'visitante' ? 'cursor-pointer' : ''}" ${atleta.tipoParticipante !== 'visitante' ? `onclick="if(typeof abrirPerfil === 'function') abrirPerfil('${atleta.email}')"` : ''}>
                    ${index + 1}. ${atleta.nome || atleta.email}
                    ${atleta.tipoParticipante === 'visitante' ? `<span class="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[8px] font-black uppercase text-amber-800 ml-1">VISITANTE</span>` : ''}
                </p>
                ${atleta.tipoParticipante === 'visitante'
                    ? `<p class="text-[8px] font-bold text-gray-400 uppercase mt-0.5">${atleta.categoria || 'NÃO INFORMADO'} &middot; ${atleta.nivelEstimado || 'MÉDIA'}</p>`
                    : renderBadgesAtletaDVC(atleta)}
            </div>
            ${atleta.tipoParticipante !== 'visitante' ? `<span class="inline-flex items-center justify-center whitespace-nowrap leading-none text-[9px] font-black text-[#990000] shrink-0">${Number(atleta.scoreGeral || atleta.score || 0).toFixed(1)}</span>` : ''}
        </div>
    `).join("");
}

function renderizarListaAtletasTimeConfronto(time) {
    const atletas = Array.isArray(time?.atletas) ? time.atletas : [];

    if (!atletas.length) {
        return `<p class="text-[9px] font-bold text-gray-400 uppercase">Nenhum atleta neste time.</p>`;
    }

    return atletas.map((atleta, index) => {
        const nomeCompleto = atleta.nome || atleta.email || "Atleta";
        const partes = nomeCompleto.trim().split(" ");
        const nomeFormatado = partes.length > 1 ? partes[0] + " " + partes[partes.length - 1] : partes[0];
        const isVisitante = atleta.tipoParticipante === 'visitante';
        const badgeVisitante = isVisitante ? '<span class="text-yellow-500 font-bold ml-1">(V)</span>' : '';
        const scoreVal = Number(atleta.scoreGeral || atleta.score || 0).toFixed(1);

        return `
            <div class="flex items-center justify-between gap-2 border-b border-gray-100 last:border-b-0 py-1 text-[10px]">
                <div class="min-w-0 flex items-center gap-1">
                    <span class="text-gray-400 font-medium">${index + 1}.</span>
                    <p class="font-medium text-gray-700 truncate">${nomeFormatado}${badgeVisitante}</p>
                </div>
                <span class="font-black text-[#990000] shrink-0">${scoreVal}</span>
            </div>
        `;
    }).join("");
}



// ============================================================================
// SECAO 09C - SORTEIO DE TIMES, FINALIZACAO E SEQUENCIA DE JOGOS
// ============================================================================
async function carregarSequenciaJogosMural() {
    try {
        const el = document.getElementById('mural-sequencia-jogos');
        if (!el) return;
        el.classList.add("hidden");
        el.innerHTML = "";
        const eventsSnap = await carregarEventosCacheMockDVC();

        let eventosComSequencia = [];

        eventsSnap.forEach(eventoDoc => {
            const ev = eventoDoc.data();

            if (ev.sequenciaJogosAtiva === true && ev.sequenciaJogosFinalizada !== true) {
                eventosComSequencia.push({
                    id: eventoDoc.id,
                    ...ev
                });
            }
        });

        eventosComSequencia.sort((a, b) => {
            const dataA = new Date(a.sequenciaJogosCriadaEm || a.data || 0);
            const dataB = new Date(b.sequenciaJogosCriadaEm || b.data || 0);
            return dataB - dataA;
        });

                    if (eventosComSequencia.length === 0) {
                        el.classList.add("hidden");
                        el.innerHTML = "";
                        return;
            }

        const evento = eventosComSequencia[0];
        const rodadas = evento.sequenciaJogosRodadas || [];
        const proxima = rodadas.find(r => r.status !== "Concluido");

        const pendentes = rodadas.filter(r => r.status !== "Concluido");
        const concluidas = rodadas.filter(r => r.status === "Concluido");

        const podeGerenciar = usuarioEhEquipeTecnica();

        if (!proxima) {
            el.classList.remove("hidden");
            el.innerHTML = `
                <p class="text-[10px] font-black text-[#990000] uppercase mb-2">
                    <i class="fa-solid fa-list-ol mr-1"></i> Sequência de jogos do treino
                </p>

                <div class="bg-white border border-green-100 rounded-3xl p-4 text-center shadow-sm">
                    <div class="mx-auto w-11 h-11 rounded-full bg-green-50 text-green-700 flex items-center justify-center mb-3">
                        <i class="fa-solid fa-check text-sm"></i>
                    </div>

                    <p class="text-xs font-black text-green-800 uppercase">
                        Todos os jogos foram concluídos.
                    </p>

                    ${podeGerenciar ? `
                        <button
                            onclick="carregarJogosTreinoNoMural()"
                            class="mt-3 w-full bg-green-700 text-white py-2.5 rounded-2xl text-[9px] font-black uppercase shadow-sm active:scale-[0.99] transition">
                            Ver partidas
                        </button>
                    ` : ''}
                </div>
            `;
            return;
        }
        const proximosHtml = pendentes.slice(1, 4).map(jogo => `
            <div class="bg-white border border-gray-100 rounded-2xl p-3 flex justify-between items-center shadow-sm">
                <div class="min-w-0">
                    <p class="text-[9px] font-black text-[#990000] uppercase">
                        Jogo ${jogo.ordem}
                    </p>
                    <p class="text-xs font-black text-gray-900 uppercase truncate">
                        ${jogo.timeA} x ${jogo.timeB}
                    </p>
                </div>

                <span class="shrink-0 text-[8px] font-black text-gray-700 bg-gray-50 border border-gray-100 px-2 py-1 rounded-full uppercase">
                    Aguardando
                </span>
            </div>
        `).join('');
            el.classList.remove("hidden");
            el.innerHTML = `
                <p class="text-[10px] font-black text-[#990000] uppercase mb-2">
                    <i class="fa-solid fa-list-ol mr-1"></i> Sequência de jogos do treino
                </p>

            <div class="bg-gray-950 text-white rounded-3xl p-4 shadow-lg mb-3 border border-red-900/30 relative overflow-hidden">
                <div class="absolute inset-0 bg-[linear-gradient(135deg,rgba(153,0,0,0.22),transparent_45%)] pointer-events-none"></div>
                <span class="absolute top-3 right-3 bg-[#990000] border border-red-300/20 text-white text-[8px] font-black px-2.5 py-1 rounded-full uppercase shadow-sm">
                    Rodada ${proxima.ciclo || 1}
                </span>

                <div class="relative z-10">
                    <p class="text-[9px] font-black uppercase text-red-100/80">
                        Próximo jogo
                    </p>

                    <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-3 mt-4">
                        <div class="bg-white/5 border border-white/10 rounded-2xl p-3 text-center min-w-0">
                            <p class="text-[10px] font-black uppercase text-white truncate">${proxima.timeA}</p>
                        </div>

                        <div class="text-center">
                            <p class="text-2xl font-black text-red-200 leading-none">VS</p>
                            <p class="text-[8px] font-black uppercase text-white/50 mt-1">Jogo ${proxima.ordem}</p>
                        </div>

                        <div class="bg-white/5 border border-white/10 rounded-2xl p-3 text-center min-w-0">
                            <p class="text-[10px] font-black uppercase text-white truncate">${proxima.timeB}</p>
                        </div>
                    </div>

                    <p class="text-[9px] font-bold text-white/70 mt-3 truncate">
                        ${evento.titulo || "Treino DVC"}
                    </p>

                    <div class="grid grid-cols-2 gap-2 mt-4">
                    <div class="bg-white/10 border border-white/10 rounded-2xl p-2 text-center">
                        <p class="text-[8px] font-black uppercase text-white/60">
                            Concluídos
                        </p>
                        <p class="text-lg font-black">
                            ${concluidas.length}
                        </p>
                    </div>

                    <div class="bg-white/10 border border-white/10 rounded-2xl p-2 text-center">
                        <p class="text-[8px] font-black uppercase text-white/60">
                            Restantes
                        </p>
                        <p class="text-lg font-black">
                            ${pendentes.length}
                        </p>
                    </div>
                </div>

                ${podeGerenciar ? `
                    <button
                        onclick="marcarJogoSequenciaConcluido('${evento.id}', '${proxima.id}')"
                        class="mt-4 w-full bg-white text-[#990000] py-2.5 rounded-2xl text-[9px] font-black uppercase shadow-sm active:scale-[0.99] transition">
                        Marcar jogo realizado
                    </button>
                ` : ''}
                </div>
            </div>

            ${proximosHtml ? `
                <p class="text-[9px] font-black text-gray-400 uppercase mb-2">
                    Próximos jogos
                </p>

                <div class="space-y-2 mb-3">
                    ${proximosHtml}
                </div>
            ` : ''}

            ${podeGerenciar ? `
                <button
                    onclick="carregarJogosTreinoNoMural()"
                    class="w-full bg-gray-900 text-white py-2.5 rounded-2xl text-[9px] font-black uppercase shadow-sm active:scale-[0.99] transition">
                    Ver partidas
                </button>
            ` : ''}
        `;

    } catch (e) {
        console.error("Erro ao carregar sequência de jogos no mural", e);
    }
}

async function marcarJogoSequenciaConcluido(evId, rodadaId) {
    try {
        const eventoRef = doc(db, "events", evId);
        const eventoSnap = await getDoc(eventoRef);

        if (!eventoSnap.exists()) {
            return alert("Evento não encontrado.");
        }

        const evento = eventoSnap.data();
        const rodadas = evento.sequenciaJogosRodadas || [];

        const novasRodadas = rodadas.map(r => {
            if (r.id === rodadaId) {
                return {
                    ...r,
                    status: "Concluido",
                    concluidoEm: new Date().toISOString(),
                    concluidoPor: currentUserData?.nome || auth.currentUser.email
                };
            }

            return r;
        });

        const aindaTemPendentes = novasRodadas.some(r => r.status !== "Concluido");

        await updateDoc(eventoRef, {
            sequenciaJogosRodadas: novasRodadas,
            sequenciaJogosAtiva: aindaTemPendentes,
            sequenciaJogosFinalizada: !aindaTemPendentes
        });

        await carregarSequenciaJogosMural();

    } catch (e) {
        console.error("Erro ao marcar jogo como realizado:", e);
        alert("Não foi possível marcar o jogo como realizado.");
    }
}

async function finalizarSequenciaJogos(evId) {
    try {
        if (!confirm("Cancelar as rodadas restantes dos jogos internos?")) {
            return;
        }

        const eventoRef = doc(db, "events", evId);
        const eventoSnap = await getDoc(eventoRef);

        if (!eventoSnap.exists()) {
            return alert("Evento não encontrado.");
        }

        const evento = eventoSnap.data();
        const rodadas = evento.sequenciaJogosRodadas || [];

        const novasRodadas = rodadas.map(r => {
            if (r.status === "Concluido") return r;

            return {
                ...r,
                status: "Cancelado",
                canceladoEm: new Date().toISOString()
            };
        });

        await updateDoc(eventoRef, {
            sequenciaJogosRodadas: novasRodadas,
            sequenciaJogosAtiva: false,
            sequenciaJogosFinalizada: true,
            sequenciaJogosFinalizadaEm: new Date().toISOString(),
            sequenciaJogosFinalizadaPor: currentUserData?.nome || auth.currentUser.email
        });

        await carregarSequenciaJogosMural();

    } catch (e) {
        console.error("Erro ao finalizar sequência de jogos:", e);
        alert("Não foi possível encerrar a sequência de jogos.");
    }
}

async function sortearTimesEquilibradosLegadoDVC(evId) {
    try {
        const resultadoDiv = document.getElementById(`times-sorteados-${evId}`);

        if (!resultadoDiv) {
            alert("Área de sorteio não encontrada.");
            return;
        }

        const selectQtd = document.getElementById(`qtd-times-${evId}`);
        const qtdTimes = Math.min(5, Math.max(2, Number(selectQtd?.value || 2)));

        resultadoDiv.innerHTML = `
            <p class="text-[10px] text-gray-400 font-bold text-center">
                Sorteando ${qtdTimes} times...
            </p>
        `;

        // 1. Usa somente quem segue ativo na chamada do treino
        const presencasTodas = await carregarPresencasEventoDVC(evId);
        const resumoPresencasSorteio = getResumoPresencasSorteioTreinoDVC(presencasTodas);
        const presencas = presencasTodas.filter(presencaParticipaDoSorteioTreinoDVC);

        if (presencas.length === 0) {
            resultadoDiv.innerHTML = `
                <p class="text-[10px] text-red-600 font-bold text-center">
                    Nenhum atleta ativo marcado na chamada para o sorteio.
                </p>
            `;
            return;
        }

        // 2. Função para calcular o score técnico
        const calcularScoreTecnicoLocal = (habilidades) => {
                    return calcularScoreGeralDVC(habilidades || {});
                };
                const BONUS_EQUILIBRIO_MASCULINO = 0.4;
                const normalizarSexoAtleta = (sexo) => {
                    const s = String(sexo || "").toUpperCase();

                    if (s === "M" || s.includes("MASC")) return "M";
                    if (s === "F" || s.includes("FEM")) return "F";

                    return "N/I";
                };
                const calcularScoreEquilibrio = (scoreTecnico, sexo) => {
                    const score = Number(scoreTecnico || 0);
                    const sexoNormalizado = normalizarSexoAtleta(sexo);

                    if (sexoNormalizado === "M") {
                        return Number((score + BONUS_EQUILIBRIO_MASCULINO).toFixed(1));
                    }

                    return score;
                };
        // 3. Busca os dados completos dos atletas presentes

        let atletasPresentes = [];

        const buscasUsuarios = presencas.map(async presDoc => {
            const emailAtleta = presDoc.id;
            const userDataCache = await obterUsuarioCacheDVC(emailAtleta);
            const userSnap = userDataCache ? { exists: () => true, data: () => userDataCache } : await getDoc(doc(db, "users", emailAtleta));

            if (userSnap.exists()) {
                const dadosAtleta = userSnap.data(); // NOME ALTERADO AQUI
                const sexoAtleta = normalizarSexoAtleta(dadosAtleta.sexo || "-"); // ALTERADO AQUI
                const scoreTecnico = calcularScoreTecnicoLocal(dadosAtleta.habilidades || {}); // ALTERADO AQUI
                const scoreEquilibrio = calcularScoreEquilibrio(scoreTecnico, sexoAtleta);

                atletasPresentes.push({
                    email: emailAtleta,
                    nome: dadosAtleta.nome || presDoc.data().nome || emailAtleta, // ALTERADO AQUI
                    sexo: sexoAtleta,
                    score: scoreTecnico,
                    scoreEquilibrio: scoreEquilibrio
                });
            } else {
                atletasPresentes.push({
                email: emailAtleta,
                nome: presDoc.data().nome || emailAtleta,
                sexo: "N/I",
                score: 0,
                scoreEquilibrio: 0
                });
            }
        });

        await Promise.allSettled(buscasUsuarios);

        if (atletasPresentes.length < qtdTimes) {
            resultadoDiv.innerHTML = `
                <p class="text-[10px] text-red-600 font-bold text-center">
                    Há ${atletasPresentes.length} atleta(s) presente(s). Para sortear ${qtdTimes} times, é necessário pelo menos ${qtdTimes} atletas.
                </p>
            `;
            return;
        }

        // 4. Ordena do maior score para o menor
        atletasPresentes.sort((a, b) => b.scoreEquilibrio - a.scoreEquilibrio);

        // 5. Cria os times dinamicamente
        const calcularLimitesPorGrupo = (total, qtdTimes) => {
        const base = Math.floor(total / qtdTimes);
        const sobra = total % qtdTimes;

            return Array.from({ length: qtdTimes }, (_, index) => {
                return base + (index < sobra ? 1 : 0);
            });
        };

        const totalMeninos = atletasPresentes.filter(a => a.sexo === "M").length;
        const totalMeninas = atletasPresentes.filter(a => a.sexo === "F").length;

        const limitesMeninos = calcularLimitesPorGrupo(totalMeninos, qtdTimes);
        const limitesMeninas = calcularLimitesPorGrupo(totalMeninas, qtdTimes);

        let times = Array.from({ length: qtdTimes }, (_, index) => ({
            nome: `Time ${index + 1}`,
            atletas: [],
            soma: 0,
            somaEquilibrio: 0,
            limite: 0,
            sexoContagem: {
                M: 0,
                F: 0,
                "N/I": 0
            },
            limiteSexo: {
                M: limitesMeninos[index] || 0,
                F: limitesMeninas[index] || 0
            }
        }));

        // 6. Define quantos atletas cada time deve ter
        const base = Math.floor(atletasPresentes.length / qtdTimes);
        const sobra = atletasPresentes.length % qtdTimes;

        times = times.map((time, index) => ({
            ...time,
            limite: base + (index < sobra ? 1 : 0)
        }));

        // 7. Distribui tentando equilibrar a soma dos scores
        atletasPresentes.forEach(atleta => {
            let timesComVaga = times.filter(time => time.atletas.length < time.limite);

            let timesComVagaSexoIdeal = timesComVaga.filter(time => {
                if (atleta.sexo === "M" || atleta.sexo === "F") {
                    return time.sexoContagem[atleta.sexo] < time.limiteSexo[atleta.sexo];
                }

                return true;
            });

            const candidatos = timesComVagaSexoIdeal.length > 0
                ? timesComVagaSexoIdeal
                : timesComVaga;

            candidatos.sort((a, b) => {
                if (a.somaEquilibrio !== b.somaEquilibrio) {
                    return a.somaEquilibrio - b.somaEquilibrio;
                }

                const sexoA = a.sexoContagem[atleta.sexo] || 0;
                const sexoB = b.sexoContagem[atleta.sexo] || 0;

                if (sexoA !== sexoB) {
                    return sexoA - sexoB;
                }

                return a.atletas.length - b.atletas.length;
            });

            const timeEscolhido = candidatos[0];

            timeEscolhido.atletas.push(atleta);
            timeEscolhido.soma += atleta.score;
            timeEscolhido.somaEquilibrio += atleta.scoreEquilibrio;
            timeEscolhido.sexoContagem[atleta.sexo] = (timeEscolhido.sexoContagem[atleta.sexo] || 0) + 1;
        });

        // 8. Calcula médias gerais
        const medias = times.map(time => {
            return time.atletas.length > 0
                ? Number((time.somaEquilibrio / time.atletas.length).toFixed(1))
                : 0;
        });

        const maiorMedia = Math.max(...medias);
        const menorMedia = Math.min(...medias);
        const diferencaMedias = Number((maiorMedia - menorMedia).toFixed(1));

        let nivelEquilibrio = "Equilibrado";
        let corEquilibrio = "text-green-700 bg-green-100 border-green-200";

        if (diferencaMedias >= 1) {
            nivelEquilibrio = "Desequilibrado";
            corEquilibrio = "text-red-700 bg-red-100 border-red-200";
        } else if (diferencaMedias >= 0.5) {
            nivelEquilibrio = "Atenção";
            corEquilibrio = "text-yellow-700 bg-yellow-100 border-yellow-200";
        }

        const coresTimes = [
            "text-blue-700",
            "text-red-700",
            "text-green-700",
            "text-purple-700",
            "text-yellow-700"
        ];

        const renderTime = (time, index) => {
            const media = time.atletas.length > 0
                        ? (time.somaEquilibrio / time.atletas.length).toFixed(1)
                        : "0.0";

            return `
                <div class="bg-white border rounded-xl p-3 shadow-sm">
                    <div class="flex justify-between items-center mb-2 border-b pb-2">
                        <p class="text-[10px] font-black uppercase ${coresTimes[index] || 'text-gray-700'}">
                            Time ${index + 1}
                        </p>

                        <span class="text-[9px] font-black text-gray-500">
                            Média ${media}
                        </span>
                    </div>

                    <div class="space-y-1">
                        ${time.atletas.map((atleta, i) => `
                    <div class="flex justify-between items-center text-[10px] border-b py-1 gap-2">
                        <div class="min-w-0">
                            <p class="font-semibold text-gray-700 truncate ${atleta.tipoParticipante !== 'visitante' ? 'cursor-pointer' : ''}" ${atleta.tipoParticipante !== 'visitante' ? `onclick="if(typeof abrirPerfil === 'function') abrirPerfil('${atleta.email}')"` : ''}>
                                ${i + 1}. ${atleta.nome}
                                ${atleta.tipoParticipante === 'visitante' ? `<span class="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[8px] font-black uppercase text-amber-800 ml-1">VISITANTE</span>` : ''}
                            </p>

                            <p class="text-[8px] font-bold text-gray-400 uppercase">
                                ${atleta.tipoParticipante === 'visitante'
                                    ? `${atleta.categoria || 'NÃO INFORMADO'} &middot; ${atleta.nivelEstimado || 'MÉDIA'}`
                                    : (atleta.sexo === "M" ? "Masculino" : atleta.sexo === "F" ? "Feminino" : "Não informado")}
                            </p>
                        </div>

                        ${atleta.tipoParticipante !== 'visitante' ? `
                        <span class="font-black text-gray-500">
                            ${atleta.score}
                        </span>` : ''}
                    </div>
                `).join('')}
                    </div>
                    <div class="flex gap-2 mt-2">
                    <span class="bg-blue-50 text-blue-700 border border-blue-100 text-[8px] font-black px-2 py-1 rounded-full uppercase">
                        M: ${time.sexoContagem.M || 0}
                    </span>

                    <span class="bg-pink-50 text-pink-700 border border-pink-100 text-[8px] font-black px-2 py-1 rounded-full uppercase">
                        F: ${time.sexoContagem.F || 0}
                    </span>
                </div>
                    <p class="text-[8px] text-gray-400 font-bold uppercase mt-2">
                        Score: ${time.soma.toFixed(1)} • Equilíbrio: ${time.somaEquilibrio.toFixed(1)}
                    </p>
                </div>
            `;
        };
        await salvarSequenciaJogosEvento(evId, times);
        resultadoDiv.innerHTML = `
            <div class="mt-3 space-y-3">
                <div class="bg-purple-50 border border-purple-200 p-3 rounded-xl text-center shadow-sm">
                    <p class="text-[10px] font-black text-purple-800 uppercase">
                        Times equilibrados
                    </p>

                    <p class="text-[9px] text-purple-700 font-semibold mt-1">
                        Times sorteados apenas com atletas ativos no treino.
                    </p>
                    ${resumoPresencasSorteio.foraSorteio > 0 ? `
                        <p class="mt-2 text-[8px] font-bold uppercase text-amber-800 bg-amber-50 border border-amber-100 rounded-lg p-2">
                            ${getTextoForaSorteioTreinoDVC(resumoPresencasSorteio.foraSorteio)}
                        </p>
                    ` : ''}

                    <div class="grid grid-cols-3 gap-2 mt-3">
                        <div class="bg-white rounded-lg p-2 border">
                            <p class="text-[8px] font-black text-gray-400 uppercase">Presentes</p>
                            <p class="text-sm font-black text-gray-800">${atletasPresentes.length}</p>
                        </div>

                        <div class="bg-white rounded-lg p-2 border">
                            <p class="text-[8px] font-black text-gray-400 uppercase">Diferença</p>
                            <p class="text-sm font-black text-gray-800">${diferencaMedias}</p>
                        </div>

                        <div class="bg-white rounded-lg p-2 border ${corEquilibrio}">
                            <p class="text-[8px] font-black uppercase">Nível</p>
                            <p class="text-[10px] font-black uppercase">${nivelEquilibrio}</p>
                        </div>
                    </div>

                    <p class="text-[8px] text-purple-700 font-bold uppercase mt-3">
                        ${atletasPresentes.length} atletas divididos em ${qtdTimes} times
                    </p>
                </div>

                ${times.map((time, index) => renderTime(time, index)).join('')}
            </div>
        `;

    } catch (e) {
        console.error("Erro ao sortear times:", e);
        alert("Não foi possível sortear os times agora.");
    }
}

        function gerarSequenciaJogos(times) {
    const listaTimes = times.map((time, index) => ({
        id: `time_${index + 1}`,
        nome: `Time ${index + 1}`,
        atletas: time.atletas || [],
        soma: Number(time.soma || 0),
        media: time.atletas && time.atletas.length > 0
            ? Number((time.soma / time.atletas.length).toFixed(1))
            : 0
    }));

    let pares = [];

    for (let i = 0; i < listaTimes.length; i++) {
        for (let j = i + 1; j < listaTimes.length; j++) {
            pares.push({
                timeAId: listaTimes[i].id,
                timeBId: listaTimes[j].id,
                timeA: listaTimes[i].nome,
                timeB: listaTimes[j].nome
            });
        }
    }

    let ultimaRodada = {};
    let jogosRealizados = {};
    let rodadas = [];
    let contadorRodada = 0;

    listaTimes.forEach(time => {
        ultimaRodada[time.id] = -999;
        jogosRealizados[time.id] = 0;
    });

    while (pares.length > 0) {
        pares.sort((a, b) => {
            const esperaA = Math.min(
                contadorRodada - ultimaRodada[a.timeAId],
                contadorRodada - ultimaRodada[a.timeBId]
            );

            const esperaB = Math.min(
                contadorRodada - ultimaRodada[b.timeAId],
                contadorRodada - ultimaRodada[b.timeBId]
            );

            if (esperaA !== esperaB) return esperaB - esperaA;

            const jogosA = jogosRealizados[a.timeAId] + jogosRealizados[a.timeBId];
            const jogosB = jogosRealizados[b.timeAId] + jogosRealizados[b.timeBId];

            return jogosA - jogosB;
        });

        const jogo = pares.shift();

        rodadas.push({
            id: `jogo_${contadorRodada + 1}`,
            ordem: contadorRodada + 1,
            timeAId: jogo.timeAId,
            timeBId: jogo.timeBId,
            timeA: jogo.timeA,
            timeB: jogo.timeB,
            status: "Pendente"
        });

        ultimaRodada[jogo.timeAId] = contadorRodada;
        ultimaRodada[jogo.timeBId] = contadorRodada;

        jogosRealizados[jogo.timeAId]++;
        jogosRealizados[jogo.timeBId]++;

        contadorRodada++;
    }

    return {
        times: listaTimes,
        rodadas
    };
}
async function salvarSequenciaJogosEvento(evId, times) {
    try {
        const sequencia = gerarSequenciaJogos(times);

        if (!sequencia.rodadas || sequencia.rodadas.length === 0) {
            return;
        }

        await updateDoc(doc(db, "events", evId), {
            sequenciaJogosAtiva: true,
            sequenciaJogosFinalizada: false,
            sequenciaJogosCriadaEm: new Date().toISOString(),
            sequenciaJogosCriadaPor: currentUserData?.nome || auth.currentUser.email,
            sequenciaJogosTimes: sequencia.times,
            sequenciaJogosRodadas: sequencia.rodadas
        });

    } catch (e) {
        console.error("Erro ao salvar sequência de jogos:", e);
        alert("Os times foram sorteados, mas não foi possível enviar a sequência para o mural.");
    }
}
window.salvarSequenciaJogosEvento = salvarSequenciaJogosEvento;

function calcularLimitesDistribuicaoTreino(total, grupos) {
    const base = Math.floor(total / grupos);
    const sobra = total % grupos;

    return Array.from({ length: grupos }, (_, index) => base + (index < sobra ? 1 : 0));
}

function montarTimesEquilibradosTreino(atletas = [], atletasPorTime = 6) {
    const totalAtletas = atletas.length;
    const tamanhoBase = Math.max(2, Number(atletasPorTime || 6));
    const qtdTimes = Math.min(totalAtletas, Math.max(2, Math.ceil(totalAtletas / tamanhoBase)));
    const limites = calcularLimitesDistribuicaoTreino(totalAtletas, qtdTimes);
    const cores = ["vermelho", "preto", "branco", "azul", "verde", "amarelo", "cinza", "roxo"];

    const totaisSexo = atletas.reduce((acc, atleta) => {
        acc[atleta.sexo] = (acc[atleta.sexo] || 0) + 1;
        return acc;
    }, {});

    const totaisFuncao = atletas.reduce((acc, atleta) => {
        acc[atleta.funcaoVolei] = (acc[atleta.funcaoVolei] || 0) + 1;
        return acc;
    }, {});

    const alvosSexo = {};
    const alvosFuncao = {};

    Object.keys(totaisSexo).forEach(sexo => {
        alvosSexo[sexo] = calcularLimitesDistribuicaoTreino(totaisSexo[sexo], qtdTimes);
    });

    Object.keys(totaisFuncao).forEach(funcao => {
        alvosFuncao[funcao] = calcularLimitesDistribuicaoTreino(totaisFuncao[funcao], qtdTimes);
    });

    const times = Array.from({ length: qtdTimes }, (_, index) => ({
        id: `time_${index + 1}`,
        nome: `Time ${index + 1}`,
        cor: cores[index] || "cinza",
        atletas: [],
        somaScore: 0,
        limite: limites[index],
        sexoContagem: {},
        funcaoContagem: {}
    }));

    const ordenados = [...atletas].sort((a, b) => {
        const scoreA = window.obterScoreParticipanteSorteioDVC(a);
        const scoreB = window.obterScoreParticipanteSorteioDVC(b);
        if (scoreB !== scoreA) return scoreB - scoreA;
        return a.nome.localeCompare(b.nome);
    });

    ordenados.forEach(atleta => {
        const candidatos = times.filter(time => time.atletas.length < time.limite);

        candidatos.sort((a, b) => {
            const indexA = Number(a.id.replace("time_", "")) - 1;
            const indexB = Number(b.id.replace("time_", "")) - 1;
            const sexoA = a.sexoContagem[atleta.sexo] || 0;
            const sexoB = b.sexoContagem[atleta.sexo] || 0;
            const alvoSexoA = alvosSexo[atleta.sexo]?.[indexA] || 0;
            const alvoSexoB = alvosSexo[atleta.sexo]?.[indexB] || 0;

            const funcaoA = a.funcaoContagem[atleta.funcaoVolei] || 0;
            const funcaoB = b.funcaoContagem[atleta.funcaoVolei] || 0;
            const alvoFuncaoA = alvosFuncao[atleta.funcaoVolei]?.[indexA] || 0;
            const alvoFuncaoB = alvosFuncao[atleta.funcaoVolei]?.[indexB] || 0;

            const estourouSexoA = sexoA >= alvoSexoA ? 1 : 0;
            const estourouSexoB = sexoB >= alvoSexoB ? 1 : 0;
            if (estourouSexoA !== estourouSexoB) return estourouSexoA - estourouSexoB;

            const estourouFuncaoA = funcaoA >= alvoFuncaoA ? 1 : 0;
            const estourouFuncaoB = funcaoB >= alvoFuncaoB ? 1 : 0;
            if (estourouFuncaoA !== estourouFuncaoB) return estourouFuncaoA - estourouFuncaoB;

            const mediaA = a.atletas.length > 0 ? a.somaScore / a.atletas.length : 0;
            const mediaB = b.atletas.length > 0 ? b.somaScore / b.atletas.length : 0;
            if (mediaA !== mediaB) return mediaA - mediaB;

            if (a.somaScore !== b.somaScore) return a.somaScore - b.somaScore;

            return a.atletas.length - b.atletas.length;
        });

        const escolhido = candidatos[0];
        escolhido.atletas.push(atleta);
        escolhido.somaScore += window.obterScoreParticipanteSorteioDVC(atleta);
        escolhido.sexoContagem[atleta.sexo] = (escolhido.sexoContagem[atleta.sexo] || 0) + 1;
        escolhido.funcaoContagem[atleta.funcaoVolei] = (escolhido.funcaoContagem[atleta.funcaoVolei] || 0) + 1;
    });

    return times.map(time => {
        const media = calcularMediaHabilidadesTime(time.atletas);

        return {
            id: time.id,
            nome: time.nome,
            cor: time.cor,
            atletas: time.atletas.map(window.normalizarParticipanteJogoTreinoDVC),
            mediaHabilidades: media.mediaHabilidades,
            scoreMedio: media.scoreMedio
        };
    });
}

function ordenarParesRodadasTreino(pares = [], times = []) {
    const ultimaRodada = {};
    const jogosRealizados = {};
    const ordenados = [];
    let contador = 0;

    times.forEach(time => {
        ultimaRodada[time.id] = -999;
        jogosRealizados[time.id] = 0;
    });

    const fila = [...pares];

    while (fila.length > 0) {
        fila.sort((a, b) => {
            const esperaA = Math.min(contador - ultimaRodada[a.timeAId], contador - ultimaRodada[a.timeBId]);
            const esperaB = Math.min(contador - ultimaRodada[b.timeAId], contador - ultimaRodada[b.timeBId]);

            if (esperaA !== esperaB) return esperaB - esperaA;

            const jogosA = jogosRealizados[a.timeAId] + jogosRealizados[a.timeBId];
            const jogosB = jogosRealizados[b.timeAId] + jogosRealizados[b.timeBId];

            return jogosA - jogosB;
        });

        const jogo = fila.shift();
        ordenados.push(jogo);
        ultimaRodada[jogo.timeAId] = contador;
        ultimaRodada[jogo.timeBId] = contador;
        jogosRealizados[jogo.timeAId] += 1;
        jogosRealizados[jogo.timeBId] += 1;
        contador += 1;
    }

    return ordenados;
}

function gerarParesTodosContraTodosTreino(times = []) {
    const pares = [];

    for (let i = 0; i < times.length; i++) {
        for (let j = i + 1; j < times.length; j++) {
            pares.push({
                rodada: 0,
                timeAId: times[i].id,
                timeBId: times[j].id,
                timeANome: times[i].nome,
                timeBNome: times[j].nome
            });
        }
    }

    return ordenarParesRodadasTreino(pares, times).map((par, index) => ({
        ...par,
        rodada: index + 1,
        jogoNaRodada: 1
    }));
}

function gerarParesRodadasSimplesTreino(times = [], limiteRodadas = 2) {
    const participantes = [...times];
    const pares = [];

    if (participantes.length % 2 !== 0) {
        participantes.push({ id: "folga", nome: "Folga" });
    }

    const totalRodadas = Math.min(Math.max(1, limiteRodadas), participantes.length - 1);
    let rodadaAtual = [...participantes];

    for (let rodada = 1; rodada <= totalRodadas; rodada++) {
        let jogoNaRodada = 1;

        for (let i = 0; i < rodadaAtual.length / 2; i++) {
            const timeA = rodadaAtual[i];
            const timeB = rodadaAtual[rodadaAtual.length - 1 - i];

            if (timeA.id !== "folga" && timeB.id !== "folga") {
                pares.push({
                    rodada,
                    jogoNaRodada,
                    timeAId: timeA.id,
                    timeBId: timeB.id,
                    timeANome: timeA.nome,
                    timeBNome: timeB.nome
                });
                jogoNaRodada += 1;
            }
        }

        const fixo = rodadaAtual[0];
        const rotacionados = rodadaAtual.slice(1);
        rotacionados.unshift(rotacionados.pop());
        rodadaAtual = [fixo, ...rotacionados];
    }

    return pares;
}

function gerarRodadasTreino(timesSorteados = [], todosContraTodos = true) {
    const usarTodosContraTodos = timesSorteados.length <= 5 || todosContraTodos === true;
    const pares = usarTodosContraTodos
        ? gerarParesTodosContraTodosTreino(timesSorteados)
        : gerarParesRodadasSimplesTreino(timesSorteados, 2);

    return pares.map((par, index) => ({
        id: `rodada_${par.rodada}_jogo_${par.jogoNaRodada || index + 1}`,
        rodada: par.rodada,
        ordem: index + 1,
        timeAId: par.timeAId,
        timeBId: par.timeBId,
        timeANome: par.timeANome,
        timeBNome: par.timeBNome,
        pontosA: null,
        pontosB: null,
        vencedorId: "",
        status: "Pendente",
        iniciadoEm: "",
        concluidoEm: "",
        concluidoPor: ""
    }));
}

async function buscarAtletasParticipantesTreino(eventId, evento = {}) {
    const fontesPorEmail = new Map();

    const adicionarFonte = (email, dados = {}) => {
        const emailLimpo = String(email || dados.email || "").trim().toLowerCase();
        if (!emailLimpo) return;

        if (!fontesPorEmail.has(emailLimpo)) {
            fontesPorEmail.set(emailLimpo, {
                email: emailLimpo,
                nome: dados.nome || emailLimpo
            });
        }
    };

    const presencasCache = await carregarPresencasEventoDVC(eventId);
    const resumoPresencasSorteio = getResumoPresencasSorteioTreinoDVC(presencasCache);
    const presencasAtivasSorteio = presencasCache.filter(presencaParticipaDoSorteioTreinoDVC);
    window.resumoUltimoSorteioTreinoDVC = window.resumoUltimoSorteioTreinoDVC || {};
    window.resumoUltimoSorteioTreinoDVC[eventId] = resumoPresencasSorteio;
    presencasAtivasSorteio.forEach(presenca => adicionarFonte(presenca.id, presenca));

    const participantes = [];
    const buscas = Array.from(fontesPorEmail.values()).map(async fonte => {
        const userDataCache = await obterUsuarioCacheDVC(fonte.email);
        const userSnap = userDataCache ? { exists: () => true, data: () => userDataCache } : await getDoc(doc(db, "users", fonte.email));

        if (!userSnap.exists()) return;

        // NOME ALTERADO: de userData para dadosAtleta para evitar conflito global
        const dadosAtleta = userSnap.data();
        const email = String(dadosAtleta.email || fonte.email).trim().toLowerCase();

        // ATUALIZAÇÕES PARA LER A VARIÁVEL CORRETA
        if (dadosAtleta.status !== "Ativo") return;
        // if (typeof usuarioPodeSerConvocadoPorFinanceiro === "function" && !usuarioPodeSerConvocadoPorFinanceiro(dadosAtleta)) return;

        const habilidades = normalizarHabilidadesDVC(dadosAtleta.habilidades || {});
        const funcaoVolei = normalizarFuncaoVoleiSorteio(
            dadosAtleta.funcaoVolei || dadosAtleta.posicaoVolei || dadosAtleta.posicao || dadosAtleta.funcaoVoleiDVC || ""
        );
        const scoreGeral = calcularScoreGeralDVC(habilidades);

        participantes.push({
            email,
            nome: String(dadosAtleta.nome || fonte.nome || email).trim(),
            sexo: normalizarSexoSorteioTreino(dadosAtleta.sexo || ""),
            funcaoVolei,
            funcaoVoleiNome: getNomeFuncaoVoleiDVC(funcaoVolei),
            habilidades,
            scoreGeral
        });
    });
    await Promise.allSettled(buscas);

    return participantes.sort((a, b) => a.nome.localeCompare(b.nome));
}

async function atualizarTelasDepoisSorteioTreino(preferirMural = false) {
    limparCacheDados("eventos");
    await carregarEventosCache(true);

    if (preferirMural || window.__abaAtualDVC === "mural") {
        await renderMural();
        return;
    }

    if (window.__abaAtualDVC === "calendar") {
        await renderCalendar();
        return;
    }

    await carregarJogosTreinoNoMural();
}
window.atualizarTelasDepoisSorteioTreino = atualizarTelasDepoisSorteioTreino;

async function carregarVisitantesTreino(eventId) {
    const cacheKey = `visitantes_treino_${eventId}`;
    const cached = obterCacheDVC(cacheKey);
    if (cached) return cached;

    const snapshot = await getDocs(collection(db, "events", eventId, "visitantesTreino"));
    const visitantes = [];
    snapshot.forEach(doc => visitantes.push(doc.data()));

    salvarCacheDVC(cacheKey, visitantes);
    return visitantes;
}

// DVC VISITANTES — REVISÃO ETAPA 2: mantém a função oficial de atletas isolada do sorteio.
// DVC VISITANTES — REVISÃO ETAPA 2: usa score temporário na escala oficial de 1 a 5.
// DVC VISITANTES — REVISÃO ETAPA 2: centraliza o acesso ao score do participante.
// DVC VISITANTES — REVISÃO ETAPA 2: não renderiza handler de perfil para visitante.
// DVC VISITANTES — REVISÃO ETAPA 2: impede visitantes em avaliações e presença oficial.

window.visitantePodeParticiparSorteioDVC = function(visitante = {}) {
    return (
        visitante.ativo !== false &&
        visitante.ativoNoSorteio !== false
    );
};

// DVC VISITANTES — ETAPA 3: usa participanteId sem exigir e-mail.
window.participanteEhVisitanteDVC = function(participante = {}) {
    return String(
        participante.tipoParticipante || ""
    ).trim().toLowerCase() === "visitante";
};

// DVC VISITANTES — ETAPA 3: salva snapshot para preservar o histórico da partida.
window.normalizarParticipanteJogoTreinoDVC = function(participante = {}) {
    const isVisitante = window.participanteEhVisitanteDVC(participante);

    if (isVisitante) {
        return {
            participanteId:
                participante.participanteId ||
                `visitante:${participante.visitanteId || participante.id}`,
            tipoParticipante: "visitante",
            visitanteId:
                participante.visitanteId ||
                participante.id ||
                "",
            nome:
                participante.nome ||
                "Visitante",
            categoria:
                participante.categoria ||
                "NAO_INFORMADO",
            genero:
                participante.genero ||
                "NAO_INFORMADO",
            nivelEstimado:
                participante.nivelEstimado ||
                "MEDIA",
            posicao:
                participante.posicao ||
                "UNIVERSAL",
            scoreSorteio:
                Number(participante.scoreSorteio || 3)
        };
    }

    return {
        ...participante,
        tipoParticipante: "atleta"
    };
};

window.obterChaveParticipanteTreinoDVC = function(participante = {}) {
    const tipo = String(
        participante.tipoParticipante ||
        participante.tipo ||
        "atleta"
    ).trim().toLowerCase();

    if (tipo === "visitante") {
        const id = String(
            participante.id ||
            participante.visitanteId ||
            participante.participanteId ||
            ""
        ).trim();

        if (!id) return "";

        return id.startsWith("visitante:")
            ? id
            : `visitante:${id}`;
    }

    const email = String(
        participante.email ||
        participante.usuarioEmail ||
        participante.atletaEmail ||
        ""
    ).trim().toLowerCase();

    if (email) {
        return `atleta:${email}`;
    }

    const uid = String(
        participante.uid ||
        participante.userId ||
        ""
    ).trim();

    return uid ? `atleta_uid:${uid}` : "";
};

const SCORE_VISITANTE_DVC = Object.freeze({
    INICIANTE: 2,
    INTERMEDIARIO: 3,
    AVANCADO: 4
});

window.obterScoreParticipanteSorteioDVC = function(participante = {}) {
    if (String(participante.tipoParticipante || "").toLowerCase() === "visitante") {
        const scoreVisitante = Number(participante.scoreSorteio);
        return Number.isFinite(scoreVisitante) ? Math.max(1, Math.min(5, scoreVisitante)) : 3;
    }

    const scoreAtleta = Number(
        participante.scoreGeral ??
        participante.scoreTecnico ??
        participante.score ??
        0
    );

    return Number.isFinite(scoreAtleta) ? Math.max(1, Math.min(5, scoreAtleta)) : 0;
};

window.calcularScoreVisitanteTreinoDVC = function(visitante = {}, atletasPresentes = []) {
    const nivel = typeof normalizarTextoDVC === 'function'
        ? normalizarTextoDVC(visitante.nivelEstimado || "")
        : String(visitante.nivelEstimado || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();

    if (nivel === "INICIANTE") return 2;
    if (nivel === "INTERMEDIARIO") return 3;
    if (nivel === "AVANCADO") return 4;

    const scoresValidos = atletasPresentes
        .map(window.obterScoreParticipanteSorteioDVC)
        .filter(score => Number.isFinite(score) && score >= 1 && score <= 5);

    if (!scoresValidos.length) {
        return 3;
    }

    const media = scoresValidos.reduce((total, score) => total + score, 0) / scoresValidos.length;
    return Math.max(1, Math.min(5, media));
};

window.normalizarAtletaParaSorteioDVC = function(atleta = {}) {
    return {
        ...atleta,
        tipoParticipante: "atleta",
        participanteId: window.obterChaveParticipanteTreinoDVC(atleta)
    };
};

window.normalizarVisitanteParaSorteioDVC = function(visitante = {}, atletasPresentes = []) {
    return {
        ...visitante,
        tipoParticipante: "visitante",
        participanteId: window.obterChaveParticipanteTreinoDVC(visitante),
        nome: String(visitante.nome || "Visitante").trim(),
        categoria: visitante.categoria || "NAO_INFORMADO",
        genero: visitante.genero || "NAO_INFORMADO",
        posicao: visitante.posicao || "UNIVERSAL",
        funcaoVolei: visitante.posicao || "UNIVERSAL",
        scoreSorteio: window.calcularScoreVisitanteTreinoDVC(visitante, atletasPresentes)
    };
};

window.deduplicarParticipantesSorteioDVC = function(participantes = []) {
    const mapa = new Map();

    participantes.forEach(participante => {
        const chave = window.obterChaveParticipanteTreinoDVC(participante);
        if (!chave) {
            if (window.DVC_DEBUG_VISITANTES) {
                console.warn("[DVC Visitantes] Participante sem chave:", participante);
            }
            return;
        }

        if (!mapa.has(chave)) {
            mapa.set(chave, participante);
        }
    });

    return [...mapa.values()];
};

window.buscarParticipantesSorteioTreinoDVC = async function(eventId) {
    const atletasPresentes = await buscarAtletasParticipantesTreino(eventId);
    const visitantes = await carregarVisitantesTreino(eventId);

    const atletasNormalizados = atletasPresentes.map(window.normalizarAtletaParaSorteioDVC);

    const visitantesNormalizados = visitantes
        .filter(window.visitantePodeParticiparSorteioDVC)
        .map(visitante => window.normalizarVisitanteParaSorteioDVC(visitante, atletasNormalizados));

    return window.deduplicarParticipantesSorteioDVC([...atletasNormalizados, ...visitantesNormalizados]);
};

window.alternarVisitanteNoSorteioDVC = async function(eventId, visitanteId, novoValor) {
    if (typeof window.usuarioEhEquipeTecnica !== "function" || !window.usuarioEhEquipeTecnica()) {
        alert("Acesso permitido somente para a equipe técnica.");
        return;
    }

    try {
        await updateDoc(doc(db, "events", eventId, "visitantesTreino", visitanteId), {
            ativoNoSorteio: novoValor,
            atualizadoEm: serverTimestamp()
        });
        invalidarCacheDVC(`visitantes_treino_${eventId}`);
        renderizarListaVisitantesTreino(eventId);
    } catch (e) {
        console.error("Erro ao alternar visitante no sorteio:", e);
        alert("Erro ao alterar o status do visitante.");
    }
};

window.renderizarListaVisitantesTreino = async (eventId) => {
    const container = document.getElementById("lista-visitantes-treino");

    try {
        const visitantes = await carregarVisitantesTreino(eventId);
        const ativos = visitantes.filter(v => v.ativo !== false);

        if (ativos.length === 0) {
            container.innerHTML = '<p class="text-[8px] font-bold text-gray-400 uppercase text-center py-2">Nenhum visitante adicionado</p>';
            return;
        }

        container.innerHTML = ativos.map(v => `
            <div class="flex flex-col bg-white border border-gray-100 p-2 rounded-xl gap-2">
                <div class="flex items-center justify-between">
                    <div class="min-w-0 pr-2">
                        <p class="text-[10px] font-black text-gray-800 uppercase truncate">${escaparHtml(v.nome)}</p>
                        <p class="text-[8px] font-bold text-gray-400 uppercase truncate">VISITANTE &middot; ${escaparHtml(v.categoria)} &middot; ${escaparHtml(v.nivelEstimado)}</p>
                    </div>
                    <div class="flex gap-1 shrink-0">
                        <button onclick="abrirModalAddVisitanteTreino('${safeEditParam(eventId)}', '${safeEditParam(v.id)}')" class="bg-gray-100 text-gray-600 px-2 py-1 rounded text-[8px] font-black uppercase">Editar</button>
                        <button onclick="inativarVisitanteTreino('${safeEditParam(eventId)}', '${safeEditParam(v.id)}')" class="bg-red-50 text-red-600 px-2 py-1 rounded text-[8px] font-black uppercase">Remover</button>
                    </div>
                </div>
                <div class="flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-100">
                    <span class="text-[8px] font-black uppercase ${v.ativoNoSorteio !== false ? 'text-green-700' : 'text-gray-500'}">
                        ${v.ativoNoSorteio !== false ? 'INCLUÍDO NO SORTEIO' : 'FORA DO SORTEIO'}
                    </span>
                    <button onclick="alternarVisitanteNoSorteioDVC('${safeEditParam(eventId)}', '${safeEditParam(v.id)}', ${v.ativoNoSorteio === false ? 'true' : 'false'})"
                            class="px-2 py-1 rounded text-[8px] font-black uppercase border ${v.ativoNoSorteio !== false ? 'bg-white border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors' : 'bg-[#990000] border-[#990000] text-white hover:bg-[#7a0000] transition-colors'}">
                        ${v.ativoNoSorteio !== false ? 'Retirar' : 'Incluir'}
                    </button>
                </div>
            </div>
        `).join('');
    } catch (e) {
        container.innerHTML = '<p class="text-[8px] font-bold text-red-400 uppercase text-center py-2">Erro ao carregar visitantes</p>';
    }
};

window.abrirModalAddVisitanteTreino = async (eventId, visitanteId = null) => {
    // DVC VISITANTES — ETAPA 1: valida permissão também dentro das ações.
    if (typeof window.usuarioEhEquipeTecnica !== "function" || !window.usuarioEhEquipeTecnica()) {
        alert("Acesso permitido somente para a equipe técnica.");
        return;
    }

    const visitantes = await carregarVisitantesTreino(eventId);
    const ativos = visitantes.filter(v => v.ativo !== false);

    let visitante = null;
    if (visitanteId) {
        visitante = visitantes.find(v => v.id === visitanteId);
    } else if (ativos.length >= 5) {
        return alert("Este treino ja possui o limite de 5 visitantes temporarios.");
    }

    const id = visitante ? visitante.id : (crypto.randomUUID ? crypto.randomUUID() : 'v_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9));

    const modalId = 'modal-add-visitante';
    document.getElementById(modalId)?.remove();

    const formHtml = `
        <div id="${modalId}" class="fixed inset-0 z-[110] bg-black/80 p-4 flex items-center justify-center">
            <div class="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden">
                <div class="bg-gradient-to-r from-gray-950 via-[#4b0d0d] to-[#990000] text-white p-4 flex items-center justify-between gap-3">
                    <div>
                        <p class="text-[8px] font-black uppercase text-white/60">Treino DVC</p>
                        <h3 class="text-sm font-black uppercase">${visitante ? 'Editar' : 'Adicionar'} Visitante</h3>
                    </div>
                    <button onclick="document.getElementById('${modalId}').remove()" class="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                        <i class="fa-solid fa-xmark text-xs"></i>
                    </button>
                </div>
                <div class="p-4 space-y-3">
                    <div>
                        <label class="text-[8px] font-black text-gray-400 uppercase block mb-1">Nome completo (obrigatorio)</label>
                        <input id="vis-nome" type="text" class="w-full p-3 rounded-2xl border border-gray-200 text-sm font-black bg-gray-50 outline-none uppercase" value="${escaparHtml(visitante?.nome || '')}" placeholder="NOME DO VISITANTE">
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="text-[8px] font-black text-gray-400 uppercase block mb-1">Categoria</label>
                            <select id="vis-categoria" class="w-full p-3 rounded-2xl border border-gray-200 text-[10px] font-black bg-gray-50 outline-none uppercase">
                                <option value="ADULTO" ${visitante?.categoria === 'ADULTO' ? 'selected' : ''}>Adulto</option>
                                <option value="SUB-17" ${visitante?.categoria === 'SUB-17' ? 'selected' : ''}>Sub-17</option>
                                <option value="NAO_INFORMADO" ${visitante?.categoria === 'NAO_INFORMADO' ? 'selected' : (!visitante ? 'selected' : '')}>Nao informado</option>
                            </select>
                        </div>
                        <div>
                            <label class="text-[8px] font-black text-gray-400 uppercase block mb-1">Genero</label>
                            <select id="vis-genero" class="w-full p-3 rounded-2xl border border-gray-200 text-[10px] font-black bg-gray-50 outline-none uppercase">
                                <option value="MASCULINO" ${visitante?.genero === 'MASCULINO' ? 'selected' : ''}>Masculino</option>
                                <option value="FEMININO" ${visitante?.genero === 'FEMININO' ? 'selected' : ''}>Feminino</option>
                                <option value="NAO_INFORMADO" ${visitante?.genero === 'NAO_INFORMADO' ? 'selected' : (!visitante ? 'selected' : '')}>Nao informado</option>
                            </select>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="text-[8px] font-black text-gray-400 uppercase block mb-1">Nivel Estimado</label>
                            <select id="vis-nivel" class="w-full p-3 rounded-2xl border border-gray-200 text-[10px] font-black bg-gray-50 outline-none uppercase">
                                <option value="MEDIA_DO_GRUPO" ${visitante?.nivelEstimado === 'MEDIA_DO_GRUPO' ? 'selected' : (!visitante ? 'selected' : '')}>Media do grupo</option>
                                <option value="INICIANTE" ${visitante?.nivelEstimado === 'INICIANTE' ? 'selected' : ''}>Iniciante</option>
                                <option value="INTERMEDIARIO" ${visitante?.nivelEstimado === 'INTERMEDIARIO' ? 'selected' : ''}>Intermediario</option>
                                <option value="AVANCADO" ${visitante?.nivelEstimado === 'AVANCADO' ? 'selected' : ''}>Avancado</option>
                            </select>
                        </div>
                        <div>
                            <label class="text-[8px] font-black text-gray-400 uppercase block mb-1">Posicao</label>
                            <select id="vis-posicao" class="w-full p-3 rounded-2xl border border-gray-200 text-[10px] font-black bg-gray-50 outline-none uppercase">
                                <option value="UNIVERSAL" ${visitante?.posicao === 'UNIVERSAL' ? 'selected' : (!visitante ? 'selected' : '')}>Universal</option>
                                <option value="LEVANTADOR" ${visitante?.posicao === 'LEVANTADOR' ? 'selected' : ''}>Levantador</option>
                                <option value="OPOSTO" ${visitante?.posicao === 'OPOSTO' ? 'selected' : ''}>Oposto</option>
                                <option value="PONTEIRO" ${visitante?.posicao === 'PONTEIRO' ? 'selected' : ''}>Ponteiro</option>
                                <option value="CENTRAL" ${visitante?.posicao === 'CENTRAL' ? 'selected' : ''}>Central</option>
                                <option value="LIBERO" ${visitante?.posicao === 'LIBERO' ? 'selected' : ''}>Libero</option>
                                <option value="NAO_INFORMADO" ${visitante?.posicao === 'NAO_INFORMADO' ? 'selected' : ''}>Nao informado</option>
                            </select>
                        </div>
                    </div>
                    <!-- DVC VISITANTES — ETAPA 1: checkbox ativoNoSorteio removido temporariamente da interface. -->                    <div class="grid grid-cols-2 gap-2 pt-2">
                        <button onclick="document.getElementById('${modalId}').remove()" class="bg-white border border-gray-200 text-gray-500 py-3 rounded-xl text-[9px] font-black uppercase">Cancelar</button>
                        <button onclick="salvarVisitanteTreino('${safeEditParam(eventId)}', '${id}', ${!!visitante})" class="bg-[#990000] text-white py-3 rounded-xl text-[9px] font-black uppercase shadow-sm">Salvar Visitante</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', formHtml);
};

window.salvarVisitanteTreino = async (eventId, visitanteId, isEdit) => {
    // DVC VISITANTES — ETAPA 1: valida permissão também dentro das ações.
    if (typeof window.usuarioEhEquipeTecnica !== "function" || !window.usuarioEhEquipeTecnica()) {
        alert("Acesso permitido somente para a equipe técnica.");
        return;
    }

    const nome = document.getElementById('vis-nome').value.trim();
    if (!nome) return alert("O nome do visitante e obrigatorio.");

    const visitantes = await carregarVisitantesTreino(eventId);
    if (!isEdit && visitantes.some(v => v.ativo !== false && v.nome.toUpperCase() === nome.toUpperCase())) {
        if (!confirm("Ja existe um visitante ativo com este nome. Deseja continuar mesmo assim?")) return;
    }

    // DVC VISITANTES — ETAPA 1: separa os dados editáveis dos metadados de criação.
    const dadosEditaveis = {
        nome: nome,
        categoria: document.getElementById('vis-categoria').value,
        genero: document.getElementById('vis-genero').value,
        nivelEstimado: document.getElementById('vis-nivel').value,
        posicao: document.getElementById('vis-posicao').value,
        atualizadoEm: serverTimestamp()
    };

    try {
        const btn = event.currentTarget;
        const oldText = btn.innerText;
        btn.innerText = "Salvando...";
        btn.disabled = true;

        const docRef = doc(db, "events", eventId, "visitantesTreino", visitanteId);

        if (isEdit) {
            // DVC VISITANTES — ETAPA 1: não altera ativoNoSorteio durante a edição.
            await updateDoc(docRef, dadosEditaveis);
        } else {
            const novoVisitante = {
                ...dadosEditaveis,
                id: visitanteId,
                tipoParticipante: "visitante",
                ativo: true,
                ativoNoSorteio: true,
                criadoEm: serverTimestamp(),
                criadoPorEmail: auth.currentUser?.email || "",
                criadoPorNome: currentUserData?.nome || auth.currentUser?.email || "Equipe tecnica"
            };
            await setDoc(docRef, novoVisitante);
        }

        // DVC VISITANTES — ETAPA 1: invalida apenas o cache dos visitantes deste evento.
        invalidarCacheDVC(`visitantes_treino_${eventId}`);

        document.getElementById('modal-add-visitante')?.remove();
        renderizarListaVisitantesTreino(eventId);
    } catch (e) {
        console.error("Erro ao salvar visitante:", e);
        alert("Erro ao salvar visitante.");
        if (event && event.currentTarget) {
            event.currentTarget.disabled = false;
            event.currentTarget.innerText = "Salvar Visitante";
        }
    }
};

window.inativarVisitanteTreino = async (eventId, visitanteId) => {
    // DVC VISITANTES — ETAPA 1: valida permissão também dentro das ações.
    if (typeof window.usuarioEhEquipeTecnica !== "function" || !window.usuarioEhEquipeTecnica()) {
        alert("Acesso permitido somente para a equipe técnica.");
        return;
    }

    if (!confirm("Tem certeza que deseja remover este visitante do treino?")) return;

    try {
        // DVC VISITANTES — ETAPA 1: preserva o documento ao inativar.
        await updateDoc(doc(db, "events", eventId, "visitantesTreino", visitanteId), {
            ativo: false,
            atualizadoEm: serverTimestamp()
        });

        invalidarCacheDVC(`visitantes_treino_${eventId}`);
        renderizarListaVisitantesTreino(eventId);
    } catch (e) {
        console.error("Erro ao remover visitante:", e);
        alert("Erro ao remover visitante.");
    }
};

// DVC CHAMADA — PARTE 1.2: impede sorteio com alterações ainda não persistidas.
window.salvarESortearDVC = async (eventId) => {
    const btn = document.getElementById('btn-salvar-sortear');
    if (btn) {
        btn.innerText = "SALVANDO...";
        btn.disabled = true;
    }

    // DVC CHAMADA — PARTE 1.2: continua somente após o salvamento bem-sucedido.
    if (typeof window.salvarChamadaEvento === "function") {
        await window.salvarChamadaEvento(eventId);
    }

    // DVC CHAMADA — PARTE 1.2: atualiza a réplica salva apenas após sucesso.
    // DVC CHAMADA — PARTE 1.2: mantém alterações pendentes quando a gravação falha.
    if (!chamadaTemAlteracoesPendentes(eventId)) {
        document.getElementById('modal-pendentes-sorteio')?.remove();
        window.abrirModalConfigSorteioTreino(eventId);
    } else {
        if (btn) {
            btn.innerText = "SALVAR E SORTEAR";
            btn.disabled = false;
        }
    }
};

window.abrirModalConfigSorteioTreino = async (eventId) => {
    if (!usuarioEhEquipeTecnica()) {
        return alert("Apenas ADM, Treinador ou Auxiliar podem gerar sorteio.");
    }

    if (chamadaTemAlteracoesPendentes(eventId)) {
        document.getElementById("modal-config-sorteio-treino")?.remove();

        const modalHtml = `
            <div id="modal-pendentes-sorteio" class="fixed inset-0 z-[100] bg-black/75 p-4 flex items-center justify-center">
                <div class="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-full">
                    <div class="bg-amber-50 p-4 border-b border-amber-100 flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                            <i class="fa-solid fa-triangle-exclamation text-amber-600 text-lg"></i>
                        </div>
                        <div>
                            <h3 class="text-xs font-black uppercase text-amber-900 leading-tight">Alterações Pendentes</h3>
                            <p class="text-[9px] font-bold uppercase text-amber-700 mt-0.5">A chamada foi modificada e ainda não foi salva</p>
                        </div>
                    </div>
                    <div class="p-5 text-xs font-bold text-gray-700 bg-white">
                        <p>Salve antes de montar os times para que somente os atletas ativos sejam considerados.</p>
                    </div>
                    <div class="p-4 bg-gray-50 flex gap-2 justify-end border-t border-gray-100">
                        <button onclick="document.getElementById('modal-pendentes-sorteio').remove()" class="px-4 py-3 rounded-xl text-[9px] font-black uppercase text-gray-600 bg-white border border-gray-200 flex-1 hover:bg-gray-50 transition-colors">Voltar à chamada</button>
                        <button id="btn-salvar-sortear" onclick="window.salvarESortearDVC('${eventId}')" class="px-4 py-3 rounded-xl text-[9px] font-black uppercase text-white bg-amber-600 shadow-sm flex-1 hover:bg-amber-700 transition-colors">Salvar e Sortear</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        return;
    }

    document.getElementById("modal-config-sorteio-treino")?.remove();
    const presencasCacheModal = window.DVC_CACHE?.presencasPorEvento?.[eventId]?.dados || [];
    const resumoPresencasModal = getResumoPresencasSorteioTreinoDVC(presencasCacheModal);
    const avisoForaSorteioModal = getTextoForaSorteioTreinoDVC(resumoPresencasModal.foraSorteio);

    const modal = `
        <div id="modal-config-sorteio-treino" class="fixed inset-0 z-[100] bg-black/75 p-4 flex items-center justify-center">
            <div class="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden">
                <div class="bg-gradient-to-r from-gray-950 via-[#4b0d0d] to-[#990000] text-white p-4 flex items-center justify-between gap-3">
                    <div>
                        <p class="text-[8px] font-black uppercase text-white/60">Treino DVC</p>
                        <h3 class="text-sm font-black uppercase">Sortear Times</h3>
                    </div>
                    <button onclick="document.getElementById('modal-config-sorteio-treino')?.remove()" class="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                        <i class="fa-solid fa-xmark text-xs"></i>
                    </button>
                </div>

                <div class="p-4 space-y-3">
                    <div class="bg-gray-50 border border-gray-100 rounded-2xl p-3">
                        <div class="flex items-center justify-between mb-2">
                            <p class="text-[9px] font-black uppercase text-gray-700">Visitantes do Treino</p>
                            <button onclick="abrirModalAddVisitanteTreino('${safeEditParam(eventId)}')" class="bg-white border border-gray-200 px-2 py-1 rounded text-[8px] font-bold text-[#990000] shadow-sm uppercase">+ Adicionar</button>
                        </div>
                        <div id="lista-visitantes-treino" class="space-y-2">
                            <p class="text-[8px] font-bold text-gray-400 uppercase text-center py-2">Carregando visitantes...</p>
                        </div>
                    </div>

                    <div class="bg-amber-50 border border-amber-100 rounded-2xl p-3">
                        <p class="text-[9px] font-black uppercase text-amber-900">Times sorteados apenas com atletas ativos no treino e visitantes incluídos.</p>
                        ${avisoForaSorteioModal ? `<p class="text-[8px] font-bold uppercase text-amber-700 mt-1">${avisoForaSorteioModal}</p>` : ''}

                        <div class="mt-2 pt-2 border-t border-amber-200/50">
                            <p class="text-[8px] font-bold text-amber-700 uppercase">Atletas presentes: <span id="contador-atletas-presentes">${resumoPresencasModal.ativos || 0}</span></p>
                            <p class="text-[8px] font-bold text-amber-700 uppercase">Visitantes incluídos: <span id="contador-visitantes-incluidos">...</span></p>
                            <p class="text-[9px] font-black text-amber-900 mt-1">Total para o sorteio: <span id="contador-total-sorteio">...</span></p>
                        </div>
                    </div>

                    <div>
                        <label class="text-[8px] font-black text-gray-400 uppercase block mb-1">Atletas por time</label>
                        <input id="sorteio-atletas-por-time" type="number" min="2" max="12" value="6" class="w-full p-3 rounded-2xl border border-gray-200 text-sm font-black bg-gray-50 outline-none">
                    </div>

                    <label class="flex items-center justify-between gap-3 bg-gray-50 border border-gray-100 rounded-2xl p-3">
                        <span>
                            <span class="block text-[9px] font-black uppercase text-gray-700">Todos contra todos</span>
                            <span class="block text-[8px] font-bold uppercase text-gray-400 mt-0.5">Ate 5 times e sempre usado automaticamente</span>
                        </span>
                        <input id="sorteio-todos-contra-todos" type="checkbox" checked class="w-5 h-5 accent-[#990000]">
                    </label>

                    <div class="grid grid-cols-2 gap-2 pt-2">
                        <button onclick="document.getElementById('modal-config-sorteio-treino')?.remove()" class="bg-white border border-gray-200 text-gray-500 py-3 rounded-xl text-[9px] font-black uppercase">
                            Cancelar
                        </button>
                        <button onclick="gerarSorteioTimesTreino('${safeEditParam(eventId)}')" class="bg-[#990000] text-white py-3 rounded-xl text-[9px] font-black uppercase shadow-sm">
                            Sortear com presentes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modal);

    // Update the visitor counts async
    carregarVisitantesTreino(eventId).then(visitantes => {
        const inclusos = visitantes.filter(visitantePodeParticiparSorteioDVC).length;
        const presentes = resumoPresencasModal.ativos || 0;

        const elVisitantes = document.getElementById('contador-visitantes-incluidos');
        const elTotal = document.getElementById('contador-total-sorteio');

        if (elVisitantes) elVisitantes.innerText = inclusos;
        if (elTotal) elTotal.innerText = presentes + inclusos;
    }).catch(err => console.error("Erro ao atualizar contadores", err));

    renderizarListaVisitantesTreino(eventId);
};

        // [Autoavaliacoes module code extracted to js/evaluations.js]

window.gerarSorteioTimesTreino = async (eventId, config = {}) => {
    if (!usuarioEhEquipeTecnica()) {
        return alert("Apenas ADM, Treinador ou Auxiliar podem gerar sorteio.");
    }

    try {
        const eventoRef = doc(db, "events", eventId);
        const eventoSnap = await getDoc(eventoRef);

        if (!eventoSnap.exists()) {
            return alert("Evento nao encontrado.");
        }

        const evento = eventoSnap.data();

        if ((evento.sorteioTimesAtivo || Array.isArray(evento.timesSorteados) || Array.isArray(evento.rodadasTreino)) && !config.substituirConfirmado) {
            const confirmar = confirm("Este treino ja possui sorteio ou rodadas salvas. Deseja substituir o sorteio anterior?");
            if (!confirmar) return;
        }

        const inputAtletasPorTime = document.getElementById("sorteio-atletas-por-time");
        const checkTodosContraTodos = document.getElementById("sorteio-todos-contra-todos");
        const atletasPorTime = Math.max(2, Number(config.atletasPorTime || inputAtletasPorTime?.value || 6));
        const todosContraTodos = config.todosContraTodos !== undefined
            ? config.todosContraTodos
            : (checkTodosContraTodos ? checkTodosContraTodos.checked : true);

        const participantes = await window.buscarParticipantesSorteioTreinoDVC(eventId);
        const resumoPresencasSorteio = window.resumoUltimoSorteioTreinoDVC?.[eventId] || {};
        const avisoForaSorteio = getTextoForaSorteioTreinoDVC(Number(resumoPresencasSorteio.foraSorteio || 0));

        if (participantes.length < 2) {
            return alert("Marque pelo menos 2 atletas presentes e ativos na chamada para gerar o sorteio.");
        }

        const timesSorteados = montarTimesEquilibradosTreino(participantes, atletasPorTime);
        const rodadasTreino = gerarRodadasTreino(timesSorteados, todosContraTodos);

        if (rodadasTreino.length === 0) {
            return alert("Nao foi possivel gerar rodadas para os times sorteados.");
        }

        const classificacaoTreino = calcularClassificacaoTreino(timesSorteados, rodadasTreino);

        const atualizacaoSorteio = {
            sorteioTimesAtivo: true,
            sorteioTimesFinalizado: false,
            sorteioTimesCriadoEm: new Date().toISOString(),
            sorteioTimesCriadoPor: currentUserData?.nome || auth.currentUser?.email || "Equipe tecnica",
            sorteioTimesAtletasPorTime: atletasPorTime,
            sorteioTimesTodosContraTodos: timesSorteados.length <= 5 || todosContraTodos === true,
            timesSorteados,
            rodadasTreino,
            classificacaoTreino,
            sequenciaJogosAtiva: false,
            sequenciaJogosFinalizada: true
        };

        if (!treinoEstaFinalizadoDVC(evento)) {
            atualizacaoSorteio.finalizadoEm = "";
            atualizacaoSorteio.statusTreino = "Em andamento";
            atualizacaoSorteio.status = "ativo";
        }

        await updateDoc(eventoRef, atualizacaoSorteio);

        document.getElementById("modal-config-sorteio-treino")?.remove();

        alert(`Sorteio gerado com ${timesSorteados.length} times e ${rodadasTreino.length} jogo(s).${avisoForaSorteio ? `\n${avisoForaSorteio}` : ""}`);
        await atualizarTelasDepoisSorteioTreino(window.__abaAtualDVC === "mural");

    } catch (e) {
        console.error("Erro ao gerar sorteio de times:", e);
        alert("Nao foi possivel gerar o sorteio dos times agora.");
    }
};

// Jogos/Treinos do Mural - renderizacao/listagem extraida para js/training-games.js


// Jogos/Treinos do Mural - modais, placar e resumo extraidos para js/training-games.js


window.finalizarTreinoSorteio = async (eventId) => {
    if (!usuarioEhEquipeTecnica()) {
        return alert("Apenas ADM, Treinador ou Auxiliar podem gerenciar jogos do treino.");
    }

    if (!confirm("Cancelar jogos pendentes deste sorteio? A conclusão oficial do treino continua na Agenda.")) {
        return;
    }

    try {
        const eventoRef = doc(db, "events", eventId);
        const eventoSnap = await getDoc(eventoRef);

        if (!eventoSnap.exists()) {
            return alert("Evento nao encontrado.");
        }

        const evento = eventoSnap.data();
        const times = Array.isArray(evento.timesSorteados) ? evento.timesSorteados : [];
        const rodadas = Array.isArray(evento.rodadasTreino) ? evento.rodadasTreino : [];

        const novasRodadas = rodadas.map(r => {
            if (jogoTreinoConcluidoDVC(r)) return r;

            return {
                ...r,
                status: "Cancelado",
                canceladoEm: new Date().toISOString(),
                canceladoPor: currentUserData?.nome || auth.currentUser?.email || "Equipe tecnica"
            };
        });

        await updateDoc(eventoRef, {
            rodadasTreino: novasRodadas,
            classificacaoTreino: calcularClassificacaoTreino(times, novasRodadas),
            sorteioTimesFinalizado: true,
            sorteioTimesAtivo: false,
            jogosTreinoFinalizadosEm: new Date().toISOString(),
            jogosTreinoFinalizadosPor: currentUserData?.nome || auth.currentUser?.email || "Equipe tecnica"
        });

        await atualizarTelasDepoisSorteioTreino(window.__abaAtualDVC === "mural");
        alert("Jogos internos encerrados. Para concluir oficialmente o treino, use Concluir na Agenda.");

    } catch (e) {
        console.error("Erro ao encerrar jogos do treino:", e);
        alert("Nao foi possivel encerrar os jogos do treino.");
    }
};

window.carregarSequenciaJogosMural = carregarSequenciaJogosMural;
window.marcarJogoSequenciaConcluido = marcarJogoSequenciaConcluido;
window.finalizarSequenciaJogos = finalizarSequenciaJogos;
window.sortearTimesEquilibrados = async (evId) => window.abrirModalConfigSorteioTreino(evId);
// ============================================================================
// SECAO 09B - MODAIS, PLACAR E RESUMO DE TREINO
// ============================================================================
function getIdsModalJogoTreino(eventId, rodadaId) {
    const base = `${eventId}-${rodadaId}`.replace(/[^a-zA-Z0-9_-]/g, "_");

    return {
        modalId: `modal-jogo-treino-${base}`,
        canvasId: `radar-times-treino-${base}`,
        pontosAId: `placar-time-a-${base}`,
        pontosBId: `placar-time-b-${base}`
    };
}

window.abrirModalTimeIndividualTreino = async (eventId, timeId) => {
    try {
        const eventoSnap = await getDoc(doc(db, "events", eventId));
        if (!eventoSnap.exists()) return alert("Evento não encontrado.");

        const evento = eventoSnap.data();
        const times = Array.isArray(evento.timesSorteados) ? evento.timesSorteados : [];
        const time = times.find(t => t.id === timeId);

        if (!time) return alert("Time não encontrado.");

        document.getElementById("m-time-individual-treino-dvc")?.remove();

        const modal = `
            <div id="m-time-individual-treino-dvc" class="fixed inset-0 z-[120] bg-black/80 p-4 flex items-center justify-center backdrop-blur-sm">
                <div class="bg-white w-full max-w-sm rounded-3xl shadow-2xl max-h-[88vh] flex flex-col overflow-hidden animate-slide-up">
                    <div class="bg-gradient-to-r from-gray-950 to-[#990000] text-white p-4 flex items-center justify-between gap-3 shrink-0">
                        <div class="min-w-0">
                            <p class="text-[8px] font-black uppercase text-white/60">Elenco do Time</p>
                            <h3 class="text-sm font-black uppercase truncate">${escaparHtml(time.nome || "Time")}</h3>
                        </div>
                        <button onclick="document.getElementById('m-time-individual-treino-dvc')?.remove()" class="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                            <i class="fa-solid fa-xmark text-sm"></i>
                        </button>
                    </div>

                    <div class="p-4 overflow-y-auto">
                        <div class="flex items-center justify-between mb-4">
                            <p class="text-[10px] font-black text-gray-500 uppercase">${(time.atletas || []).length} ATLETA(S)</p>
                            ${renderBadgeDVC(`Score ${Number(time.scoreMedio || 0).toFixed(1)}`, "vermelho")}
                        </div>
                        <div class="bg-gray-50 border border-gray-100 rounded-xl p-2">
                            ${renderizarListaAtletasTimeTreino(time)}
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modal);
    } catch (error) {
        console.error("Erro ao abrir time individual:", error);
        alert("Erro ao carregar os dados do time.");
    }
};

window.abrirModalTimesTreino = async (eventId) => {
    try {
        const eventoSnap = await getDoc(doc(db, "events", eventId));

        if (!eventoSnap.exists()) {
            return alert("Evento não encontrado.");
        }

        const evento = eventoSnap.data();
        const times = Array.isArray(evento.timesSorteados) ? evento.timesSorteados : [];
        const rodadas = Array.isArray(evento.rodadasTreino) ? [...evento.rodadasTreino] : [];
        rodadas.sort((a, b) => Number(a.ordem || 0) - Number(b.ordem || 0));

        if (!times.length) {
            return alert("Este treino ainda não tem times sorteados.");
        }

        const finalizado = eventoTreinoSorteioFinalizadoDVC(evento, rodadas);
        const classificacao = Array.isArray(evento.classificacaoTreino) && evento.classificacaoTreino.length
            ? evento.classificacaoTreino
            : calcularClassificacaoTreino(times, rodadas);
        const statusAvaliacao = getStatusAvaliacaoTreinoDVC(evento);
        const campeaoTreino = finalizado && classificacao.length ? classificacao[0] : null;

        // DVC VISITANTES — PARTE 4.3: separa visitantes sem alterar métricas oficiais.
        const participantesTimes = times.flatMap(time => Array.isArray(time?.atletas) ? time.atletas : []);
        function obterChaveContagemParticipanteDVC(participante = {}, indice = 0) {
            const chaveOficial = typeof window.obterChaveParticipanteTreinoDVC === "function"
                ? window.obterChaveParticipanteTreinoDVC(participante)
                : "";

            if (chaveOficial) {
                return chaveOficial;
            }

            const participanteId = String(participante.participanteId || "").trim();
            if (participanteId) return `participante:${participanteId}`;

            const email = String(participante.email || participante.usuarioEmail || participante.atletaEmail || "").trim().toLowerCase();
            if (email) return `atleta:${email}`;

            const uid = String(participante.uid || participante.userId || "").trim();
            if (uid) return `atleta_uid:${uid}`;

            const visitanteId = String(participante.visitanteId || participante.id || "").trim();
            if (visitanteId) return `registro:${visitanteId}`;

            const nome = String(participante.nome || participante.name || "").trim().toLowerCase().replace(/\s+/g, " ");
            const nascimento = String(participante.dataNascimento || participante.nascimento || participante.birthDate || "").trim();
            const telefone = String(participante.telefone || participante.phone || "").replace(/\D/g, "");

            if (nome && (nascimento || telefone)) return `legado:${nome}|${nascimento}|${telefone}`;

            const posicao = String(participante.posicao || participante.funcaoVolei || "").trim().toLowerCase();
            const genero = String(participante.genero || participante.sexo || "").trim().toLowerCase();

            if (nome) return `legado:${nome}|${posicao}|${genero}`;

            return `registro_sem_identificacao:${indice}`;
        }

        const mapaParticipantes = new Map();

        participantesTimes.forEach((participante, indice) => {
            if (!participante || typeof participante !== "object") return;
            const chave = obterChaveContagemParticipanteDVC(participante, indice);
            if (!mapaParticipantes.has(chave)) {
                mapaParticipantes.set(chave, participante);
            }
        });

        const participantesUnicos = [...mapaParticipantes.values()];

        // DVC VISITANTES — PARTE 4.3: mantém registros antigos classificados como atletas.
        function participanteEhVisitanteContagemDVC(participante = {}) {
            if (typeof window.participanteEhVisitanteDVC === "function") {
                return window.participanteEhVisitanteDVC(participante);
            }
            return String(participante.tipoParticipante || participante.tipo || "atleta").trim().toLowerCase() === "visitante";
        }

        // DVC VISITANTES — PARTE 4.3: calcula os totais apenas com os integrantes já sorteados.
        const totalVisitantes = participantesUnicos.filter(participanteEhVisitanteContagemDVC).length;
        const totalParticipantes = participantesUnicos.length;
        const totalAtletasOficiais = Math.max(0, totalParticipantes - totalVisitantes);

        document.getElementById("m-times-treino-dvc")?.remove();

        const modal = `
            <div id="m-times-treino-dvc" class="fixed inset-0 z-[100] bg-black/80 p-4 flex items-center justify-center">
                <div class="bg-white w-full max-w-sm rounded-3xl shadow-2xl max-h-[88vh] overflow-y-auto">
                    <div class="sticky top-0 z-10 bg-gradient-to-r from-gray-950 via-[#4b0d0d] to-[#990000] text-white p-4 flex items-start justify-between gap-3">
                        <div class="min-w-0">
                            <p class="text-[8px] font-black uppercase text-white/60">Times sorteados</p>
                            <h3 class="text-sm font-black uppercase truncate">${escaparHtml(evento.titulo || "Treino DVC")}</h3>
                            <div class="flex flex-wrap gap-1 mt-2">
                                ${renderBadgeDVC(finalizado ? "Finalizado" : "Em andamento", finalizado ? "verde" : "vermelho")}
                                ${finalizado ? renderBadgeDVC(statusAvaliacao.texto, statusAvaliacao.tipo) : ""}
                            </div>
                        </div>
                        <button onclick="document.getElementById('m-times-treino-dvc')?.remove()" class="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                            <i class="fa-solid fa-xmark text-xs"></i>
                        </button>
                    </div>

                    <div class="p-4 space-y-4">
                        <div class="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                            <p class="text-[9px] font-black uppercase tracking-wider text-slate-400">
                                Participantes do treino
                            </p>

                            <div class="mt-3 grid grid-cols-3 gap-2">
                                <div class="rounded-xl border border-slate-200 bg-white px-2 py-3 text-center" title="Atletas oficiais">
                                    <p class="text-lg font-black text-slate-950">
                                        ${totalAtletasOficiais}
                                    </p>

                                    <p class="mt-1 text-[8px] font-black uppercase leading-tight text-slate-500">
                                        Atletas
                                    </p>
                                </div>

                                <div class="rounded-xl border border-amber-200 bg-amber-50 px-2 py-3 text-center" title="Visitantes temporários">
                                    <p class="text-lg font-black text-amber-900">
                                        ${totalVisitantes}
                                    </p>

                                    <p class="mt-1 text-[8px] font-black uppercase leading-tight text-amber-800">
                                        Visitantes
                                    </p>
                                </div>

                                <div class="rounded-xl border border-red-200 bg-red-50 px-2 py-3 text-center" title="Total de presentes">
                                    <p class="text-lg font-black text-red-900">
                                        ${totalParticipantes}
                                    </p>

                                    <p class="mt-1 text-[8px] font-black uppercase leading-tight text-red-800">
                                        Total
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-2">
                            <div class="bg-gray-50 border border-gray-100 rounded-2xl p-3 text-center">
                                <p class="text-[8px] font-black uppercase text-gray-400">Times</p>
                                <p class="text-lg font-black text-[#990000]">${times.length}</p>
                            </div>
                            <div class="bg-gray-50 border border-gray-100 rounded-2xl p-3 text-center">
                                <p class="text-[8px] font-black uppercase text-gray-400">Jogos</p>
                                <p class="text-lg font-black text-[#990000]">${rodadas.length}</p>
                            </div>
                        </div>

                        ${campeaoTreino ? `
                            <div class="bg-[#990000] text-white rounded-2xl p-3 flex items-center justify-between gap-3">
                                <div>
                                    <p class="text-[8px] font-black uppercase text-white/60">Campeão do treino</p>
                                    <p class="text-sm font-black uppercase">${escaparHtml(campeaoTreino.nome || "Time DVC")}</p>
                                </div>
                                <i class="fa-solid fa-trophy text-xl text-red-100"></i>
                            </div>
                        ` : ""}

                        <div class="space-y-3">
                            ${times.map((time, idx) => {
                                const palette = [
                                    { bg: "bg-red-50", border: "border-red-200", text: "text-red-900", left: "border-red-500", icon: "text-red-400", badge: "vermelho" },
                                    { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-900", left: "border-blue-500", icon: "text-blue-400", badge: "azul" },
                                    { bg: "bg-green-50", border: "border-green-200", text: "text-green-900", left: "border-green-500", icon: "text-green-400", badge: "verde" },
                                    { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-900", left: "border-amber-500", icon: "text-amber-400", badge: "amarelo" },
                                    { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-900", left: "border-purple-500", icon: "text-purple-400", badge: "roxo" },
                                    { bg: "bg-cyan-50", border: "border-cyan-200", text: "text-cyan-900", left: "border-cyan-500", icon: "text-cyan-400", badge: "azul" }
                                ];
                                const cor = palette[idx % palette.length];

                                return `
                                <article class="bg-white border ${cor.border} rounded-2xl shadow-sm overflow-hidden border-l-4 ${cor.left}">
                                    <button onclick="document.getElementById('atletas-time-${idx}').classList.toggle('hidden'); document.getElementById('icon-time-${idx}').classList.toggle('rotate-180')" class="w-full text-left p-3 flex items-center justify-between gap-3 ${cor.bg} transition-colors focus:outline-none">
                                        <div class="min-w-0">
                                            <p class="text-xs font-black uppercase ${cor.text} truncate">${escaparHtml(time.nome || "Time")}</p>
                                            <p class="text-[8px] font-bold uppercase opacity-70 ${cor.text} mt-0.5">${(time.atletas || []).length} atleta(s)</p>
                                        </div>
                                        <div class="flex items-center gap-3 shrink-0">
                                            ${renderBadgeDVC(`Score ${Number(time.scoreMedio || 0).toFixed(1)}`, cor.badge)}
                                            <i id="icon-time-${idx}" class="fa-solid fa-chevron-down text-xs ${cor.icon} transition-transform duration-300"></i>
                                        </div>
                                    </button>
                                    <div id="atletas-time-${idx}" class="hidden p-2 bg-white border-t ${cor.border}">
                                        ${renderizarListaAtletasTimeTreino(time)}
                                    </div>
                                </article>
                                `;
                            }).join("")}
                        </div>

                        ${finalizado && usuarioEhEquipeTecnica() ? `
                            <button onclick="document.getElementById('m-times-treino-dvc')?.remove(); abrirAvaliacaoAtletasDoTreino('${safeEditParam(eventId)}')" class="w-full bg-[#990000] text-white py-3 rounded-2xl text-[9px] font-black uppercase shadow-sm">
                                <i class="fa-solid fa-clipboard-check mr-1"></i> Avaliar atletas do treino
                            </button>
                        ` : ""}
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML("beforeend", modal);
    } catch (e) {
        console.error("Erro ao abrir times do treino:", e);
        alert("Não foi possível abrir os times deste treino.");
    }
};

window.abrirResumoTreinoFinalizadoDVC = async (eventId) => {
    try {
        const eventos = await carregarEventosCacheDVC();
        const eventoDoc = eventos.find(d => d.id === eventId);
        if (!eventoDoc) return alert("Treino não encontrado no histórico.");

        const evento = { ...eventoDoc };
        const rodadas = Array.isArray(evento.rodadasTreino) ? [...evento.rodadasTreino] : [];
        rodadas.sort((a, b) => Number(a.ordem || 0) - Number(b.ordem || 0));

        const times = Array.isArray(evento.timesSorteados) ? evento.timesSorteados : [];
        const classificacao = Array.isArray(evento.classificacaoTreino) && evento.classificacaoTreino.length
            ? evento.classificacaoTreino
            : calcularClassificacaoTreino(times, rodadas);

        const campeao = classificacao[0];
        const statusAvaliacao = getStatusAvaliacaoTreinoDVC(evento);
        const podeGerenciar = usuarioEhEquipeTecnica();
        const avaliacaoPendente = avaliacaoTreinoPendenteDVC(evento);
        const dataFormatada = evento.data ? new Date(evento.data).toLocaleString("pt-BR") : "Data não informada";

        const modalId = `modal-resumo-treino-${eventId}`;
        document.getElementById(modalId)?.remove();

        const htmlModal = `
            <div id="${modalId}" class="fixed inset-0 bg-gray-950/60 z-[100] flex flex-col justify-end sm:justify-center sm:p-4 animate-fade-in" onclick="if(event.target===this) this.remove()">
                <div class="bg-gray-50 w-full sm:max-w-md sm:mx-auto rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl animate-slide-up sm:animate-fade-in">

                    <div class="p-4 bg-white rounded-t-3xl border-b border-gray-100 flex items-center justify-between sticky top-0 z-10">
                        <div class="min-w-0">
                            <p class="text-[10px] font-black uppercase text-[#990000]">Resumo do Treino</p>
                            <h3 class="text-sm font-black uppercase text-gray-900 truncate">${evento.titulo || "Treino DVC"}</h3>
                        </div>
                        <button onclick="document.getElementById('${modalId}').remove()" class="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-gray-400">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>

                    <div class="p-4 overflow-y-auto overflow-x-hidden pb-safe space-y-4">
                        <div class="flex flex-wrap gap-1 mb-2">
                            ${renderBadgeDVC("Finalizado", "verde")}
                            ${renderBadgeDVC(statusAvaliacao.texto, statusAvaliacao.tipo)}
                            <span class="bg-gray-100 text-gray-500 border border-gray-200 px-2 py-1 rounded-md text-[8px] font-black uppercase">${dataFormatada}</span>
                        </div>

                        ${campeao ? `
                            <div class="bg-[#990000] text-white rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm">
                                <div>
                                    <p class="text-[9px] font-black uppercase text-white/60">Campeão do treino</p>
                                    <p class="text-sm font-black uppercase">${campeao.nome}</p>
                                </div>
                                <i class="fa-solid fa-trophy text-2xl text-red-100"></i>
                            </div>
                        ` : ''}

                        <div>
                            <p class="text-[10px] font-black uppercase text-gray-500 mb-2">Classificação Final</p>
                            ${typeof renderizarClassificacaoTreinoHtml === 'function' ? renderizarClassificacaoTreinoHtml(classificacao, true, eventId, times) : ''}
                        </div>

                        <div>
                            <p class="text-[10px] font-black uppercase text-gray-500 mb-2">Jogos Realizados</p>
                            <div class="space-y-2">
                                ${rodadas.map(jogo => typeof renderizarCardJogoTreinoMural === 'function' ? renderizarCardJogoTreinoMural(evento, jogo, null) : '').join("")}
                            </div>
                        </div>

                        <div class="pt-2 flex gap-2">
                            <button onclick="abrirModalTimesTreino('${evento.id}')" class="flex-1 bg-white border border-gray-200 text-gray-700 py-3 rounded-2xl text-[9px] font-black uppercase shadow-sm">
                                Ver Times
                            </button>
                            ${podeGerenciar && avaliacaoPendente ? `
                                <button onclick="abrirAvaliacaoAtletasDoTreino('${evento.id}'); document.getElementById('${modalId}').remove();" class="flex-1 bg-[#990000] text-white py-3 rounded-2xl text-[9px] font-black uppercase shadow-sm">
                                    Avaliar Atletas
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', htmlModal);
    } catch (err) { console.error(err); }
};

window.fecharModalJogoTreino = (modalId, canvasId) => {
    if (canvasId && window.graficosTimesTreino?.[canvasId]) {
        window.graficosTimesTreino[canvasId].destroy();
        delete window.graficosTimesTreino[canvasId];
    }

    document.getElementById(modalId)?.remove();
};

window.abrirModalJogoTreino = async (eventId, rodadaId) => {
    try {
        const eventoSnap = await getDoc(doc(db, "events", eventId));

        if (!eventoSnap.exists()) {
            return alert("Evento nao encontrado.");
        }

        const evento = eventoSnap.data();
        const times = Array.isArray(evento.timesSorteados) ? evento.timesSorteados : [];
        const rodadas = Array.isArray(evento.rodadasTreino) ? [...evento.rodadasTreino] : [];
        const rodada = rodadas.find(r => r.id === rodadaId);

        if (!rodada) {
            return alert("Jogo nao encontrado neste treino.");
        }

        const timeA = obterTimePorIdSorteio(times, rodada.timeAId) || { nome: rodada.timeANome, atletas: [], mediaHabilidades: {}, scoreMedio: 0 };
        const timeB = obterTimePorIdSorteio(times, rodada.timeBId) || { nome: rodada.timeBNome, atletas: [], mediaHabilidades: {}, scoreMedio: 0 };
        const proximo = getProximoJogoPendenteTreino(rodadas);
        const podeGerenciar = usuarioEhEquipeTecnica();
        const jogoJaConcluido = jogoTreinoConcluidoDVC(rodada);
        const jogoDisponivel = jogoJaConcluido || !proximo || proximo.id === rodada.id || rodada.status === "Em andamento";
        const podeEditar = podeGerenciar && rodada.status !== "Cancelado" && jogoDisponivel;
        const ids = getIdsModalJogoTreino(eventId, rodadaId);

        window.fecharModalJogoTreino(ids.modalId, ids.canvasId);

        const modal = `
            <div id="${ids.modalId}" data-modal-jogo-treino="${safeEditParam(rodadaId)}" class="fixed inset-0 z-[100] bg-black/80 p-4 flex items-center justify-center">
                <div class="bg-white w-full max-w-sm rounded-3xl shadow-2xl max-h-[88vh] overflow-y-auto">
                    <div class="sticky top-0 z-10 bg-gradient-to-r from-gray-950 via-[#4b0d0d] to-[#990000] text-white p-4 flex items-start justify-between gap-3">
                        <div class="min-w-0">
                            <p class="text-[8px] font-black uppercase text-white/60">${escaparHtml(evento.titulo || "Treino DVC")}</p>
                            <h3 class="text-sm font-black uppercase truncate">Rodada ${rodada.rodada}</h3>
                            <p class="text-[9px] font-bold text-white/70 uppercase mt-1">Jogo ${rodada.ordem} - ${getStatusVisualJogoTreino(rodada.status).texto}</p>
                        </div>
                        <button onclick="fecharModalJogoTreino('${ids.modalId}', '${ids.canvasId}')" class="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                            <i class="fa-solid fa-xmark text-xs"></i>
                        </button>
                    </div>

                    <div class="p-4 space-y-4">
                        ${!jogoDisponivel ? `
                            <div class="bg-yellow-50 border border-yellow-100 text-yellow-800 rounded-2xl p-3">
                                <p class="text-[9px] font-black uppercase">Este jogo ainda aguarda a conclusao da rodada anterior.</p>
                            </div>
                        ` : ''}

                        <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-3 bg-gray-50 border border-gray-100 rounded-2xl p-3">
                            <div class="text-center min-w-0">
                                <p class="text-xs font-black uppercase text-gray-900 truncate">${escaparHtml(timeA.nome)}</p>
                                <p class="text-[8px] font-bold uppercase text-gray-400">Score ${Number(timeA.scoreMedio || 0).toFixed(1)}</p>
                            </div>
                            <div class="w-10 h-10 rounded-full bg-gray-950 text-white flex items-center justify-center">
                                <span class="text-[10px] font-black">VS</span>
                            </div>
                            <div class="text-center min-w-0">
                                <p class="text-xs font-black uppercase text-gray-900 truncate">${escaparHtml(timeB.nome)}</p>
                                <p class="text-[8px] font-bold uppercase text-gray-400">Score ${Number(timeB.scoreMedio || 0).toFixed(1)}</p>
                            </div>
                        </div>

                        <!-- BLOCO TRANSACIONAL: PLACAR E AÇÕES NO TOPO -->
                        <div class="bg-white border border-gray-100 rounded-2xl p-3 space-y-3 shadow-sm">
                            <div>
                                <p class="text-[9px] font-black uppercase text-gray-500 mb-2">Placar</p>
                                <div class="grid grid-cols-2 gap-2">
                                    <div>
                                        <label class="text-[8px] font-black text-gray-400 uppercase block mb-1">${escaparHtml(timeA.nome)}</label>
                                        <input id="${ids.pontosAId}" type="number" min="0" value="${rodada.pontosA ?? ''}" ${podeEditar ? '' : 'disabled'} class="w-full p-3 rounded-xl border border-gray-200 text-center text-lg font-black bg-gray-50 outline-none">
                                    </div>
                                    <div>
                                        <label class="text-[8px] font-black text-gray-400 uppercase block mb-1">${escaparHtml(timeB.nome)}</label>
                                        <input id="${ids.pontosBId}" type="number" min="0" value="${rodada.pontosB ?? ''}" ${podeEditar ? '' : 'disabled'} class="w-full p-3 rounded-xl border border-gray-200 text-center text-lg font-black bg-gray-50 outline-none">
                                    </div>
                                </div>
                            </div>

                            <div class="grid ${podeEditar ? 'grid-cols-3' : 'grid-cols-1'} gap-2">
                                ${podeEditar ? `
                                    <button onclick="salvarPlacarJogoTreino('${safeEditParam(eventId)}', '${safeEditParam(rodadaId)}')" class="bg-[#990000] text-white py-3 rounded-xl text-[9px] font-black uppercase shadow-sm">
                                        Salvar placar
                                    </button>
                                    <button onclick="salvarPlacarJogoTreino('${safeEditParam(eventId)}', '${safeEditParam(rodadaId)}', true)" class="bg-green-700 text-white py-3 rounded-xl text-[9px] font-black uppercase shadow-sm">
                                        Concluir jogo
                                    </button>
                                ` : ''}
                                <button onclick="fecharModalJogoTreino('${ids.modalId}', '${ids.canvasId}')" class="bg-white border border-gray-200 text-gray-500 py-3 rounded-xl text-[9px] font-black uppercase">
                                    Fechar
                                </button>
                            </div>
                        </div>

                        <!-- DETALHES COMPLEMENTARES ABAIXO -->
                        <div class="grid grid-cols-2 gap-3">
                            <div class="bg-white border border-gray-100 rounded-2xl p-3">
                                <p class="text-[9px] font-black uppercase text-[#990000] mb-2">${escaparHtml(timeA.nome)}</p>
                                ${renderizarListaAtletasTimeConfronto(timeA)}
                            </div>
                            <div class="bg-white border border-gray-100 rounded-2xl p-3">
                                <p class="text-[9px] font-black uppercase text-gray-900 mb-2">${escaparHtml(timeB.nome)}</p>
                                ${renderizarListaAtletasTimeConfronto(timeB)}
                            </div>
                        </div>

                        <div class="bg-gray-50 border border-gray-100 rounded-2xl p-3">
                            <p class="text-[9px] font-black uppercase text-gray-500 mb-2">Radar medio dos times</p>
                            <div class="h-64">
                                <canvas id="${ids.canvasId}"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML("beforeend", modal);

        setTimeout(() => {
            renderizarRadarComparativoTimes(timeA, timeB, ids.canvasId);
        }, 80);

    } catch (e) {
        console.error("Erro ao abrir jogo do treino:", e);
        alert("Nao foi possivel abrir este jogo.");
    }
};

window.salvarPlacarJogoTreino = async (eventId, rodadaId, somenteConcluir = false) => {
    if (!usuarioEhEquipeTecnica()) {
        return alert("Apenas ADM, Treinador ou Auxiliar podem salvar placar.");
    }

    try {
        const eventoRef = doc(db, "events", eventId);
        const eventoSnap = await getDoc(eventoRef);

        if (!eventoSnap.exists()) {
            return alert("Evento nao encontrado.");
        }

        const evento = eventoSnap.data();
        const times = Array.isArray(evento.timesSorteados) ? evento.timesSorteados : [];
        const rodadas = Array.isArray(evento.rodadasTreino) ? evento.rodadasTreino : [];
        const rodadaAtual = rodadas.find(r => r.id === rodadaId);

        if (!rodadaAtual) {
            return alert("Jogo nao encontrado.");
        }

        const ids = getIdsModalJogoTreino(eventId, rodadaId);
        const inputA = document.getElementById(ids.pontosAId);
        const inputB = document.getElementById(ids.pontosBId);
        const pontosA = getValorNumericoPlacarTreino(inputA?.value ?? rodadaAtual.pontosA);
        const pontosB = getValorNumericoPlacarTreino(inputB?.value ?? rodadaAtual.pontosB);

        if (pontosA === null || pontosB === null) {
            return alert("Informe os pontos dos dois times.");
        }

        if (pontosA === pontosB) {
            return alert("Informe um desempate antes de concluir o jogo.");
        }

        const vencedorId = pontosA > pontosB ? rodadaAtual.timeAId : rodadaAtual.timeBId;

        const novasRodadas = rodadas.map(r => {
            if (r.id !== rodadaId) return r;

            return {
                ...r,
                pontosA,
                pontosB,
                vencedorId,
                status: "Concluido",
                iniciadoEm: r.iniciadoEm || new Date().toISOString(),
                concluidoEm: new Date().toISOString(),
                concluidoPor: currentUserData?.nome || auth.currentUser?.email || "Equipe tecnica"
            };
        });

        const classificacaoTreino = calcularClassificacaoTreino(times, novasRodadas);
        const todosEncerrados = novasRodadas.length > 0 && novasRodadas.every(jogoTreinoEncerradoDVC);
        const updates = {
            rodadasTreino: novasRodadas,
            classificacaoTreino,
            sorteioTimesAtualizadoEm: new Date().toISOString()
        };

        if (todosEncerrados) {
            updates.sorteioTimesFinalizado = true;
            updates.sorteioTimesAtivo = false;
            updates.jogosTreinoFinalizadosEm = new Date().toISOString();
            updates.jogosTreinoFinalizadosPor = currentUserData?.nome || auth.currentUser?.email || "Equipe tecnica";
        }

        await updateDoc(eventoRef, updates);
        limparCacheDVC("events");

        window.fecharModalJogoTreino(ids.modalId, ids.canvasId);
        await atualizarTelasDepoisSorteioTreino(window.__abaAtualDVC === "mural");

        if (todosEncerrados) {
            alert("Todos os jogos internos foram concluídos. Para finalizar oficialmente o treino, use Concluir na Agenda.");
            return;
        }

        alert(somenteConcluir ? "Jogo concluído." : "Placar salvo.");

    } catch (e) {
        console.error("Erro ao salvar placar do jogo:", e);
        alert("Nao foi possivel salvar o placar.");
    }
};

window.jogoTreinoEncerradoDVC = jogoTreinoEncerradoDVC;
window.jogoTreinoConcluidoDVC = jogoTreinoConcluidoDVC;
window.eventoTreinoSorteioFinalizadoDVC = eventoTreinoSorteioFinalizadoDVC;
window.obterTimePorIdSorteio = obterTimePorIdSorteio;
window.getProximoJogoPendenteTreino = getProximoJogoPendenteTreino;
window.getStatusAvaliacaoTreinoDVC = getStatusAvaliacaoTreinoDVC;
window.avaliacaoTreinoPendenteDVC = avaliacaoTreinoPendenteDVC;
window.renderizarClassificacaoTreinoHtml = renderizarClassificacaoTreinoHtml;
window.renderizarCardJogoTreinoMural = renderizarCardJogoTreinoMural;
window.renderizarEventoJogosTreinoMural = renderizarEventoJogosTreinoMural;
window.renderizarCardTreinoFinalizadoCompactoDVC = renderizarCardTreinoFinalizadoCompactoDVC;
window.renderizarListaAtletasTimeTreino = renderizarListaAtletasTimeTreino;

