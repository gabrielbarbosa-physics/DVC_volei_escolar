/**
 * ============================================================================
 * Módulo: ADMIN
 * ============================================================================
 * Responsabilidade: Gerencia funcionalidades relacionadas a admin.
 * Este arquivo faz parte do sistema modular do DVC App.
 * Todos os códigos principais aqui agrupados seguem as diretrizes do projeto.
 * ============================================================================
 */

// js/admin.js
// Stage 10A: Admin/Dashboard base Modularization

import { db, doc, getDoc, updateDoc, deleteDoc, collection, getDocs, query, where } from "./firebase.js";
import { PROJETO_ATUAL_DVC, STATUS_FINANCEIRO_CARENCIA, FUNCOES_VOLEI_DVC } from "./state.js";

window.dashboardCharts = window.dashboardCharts || [];

// 1. destruirGraficosDashboard
function destruirGraficosDashboard() {
    if (window.dashboardCharts && window.dashboardCharts.length > 0) {
        window.dashboardCharts.forEach(chart => {
            if (chart) chart.destroy();
        });
    }
    window.dashboardCharts = [];
}

// 2. dashboardNomeMes
function dashboardNomeMes(dataTexto) {
    const meses = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    if (!dataTexto) return "Sem data";

    const data = new Date(dataTexto);

    if (isNaN(data.getTime())) {
        return "Sem data";
    }

    return `${meses[data.getMonth()]}/${data.getFullYear()}`;
}

// 3. dashboardOrdenarMeses
function dashboardOrdenarMeses(listaMeses) {
    const meses = {
        "Janeiro": 1,
        "Fevereiro": 2,
        "Março": 3,
        "Abril": 4,
        "Maio": 5,
        "Junho": 6,
        "Julho": 7,
        "Agosto": 8,
        "Setembro": 9,
        "Outubro": 10,
        "Novembro": 11,
        "Dezembro": 12
    };

    return listaMeses.sort((a, b) => {
        if (a === "Sem data") return 1;
        if (b === "Sem data") return -1;

        const [mesA, anoA] = a.split("/");
        const [mesB, anoB] = b.split("/");

        const valorA = Number(anoA) * 100 + meses[mesA];
        const valorB = Number(anoB) * 100 + meses[mesB];

        return valorA - valorB;
    });
}

// 4. atualizarResumoGestao
async function atualizarResumoGestao() {
    try {
        const snap = await window.carregarUsuariosCacheMockDVC();

        let ativos = 0;
        let novos = 0;
        let inadimplentes = 0;
        let justificados = 0;

        snap.forEach(docUsuario => {
            const user = docUsuario.data();

            if (window.ehResponsavelTecnico(user)) return;

            const financeiroEfetivo = window.obterStatusFinanceiroEfetivo(user);

            if (window.usuarioTemStatusConvocavel(user)) ativos++;
            if (user.cadastroStatus === "Novo") novos++;
            if (financeiroEfetivo === "Inadimplente") inadimplentes++;
            if (financeiroEfetivo === "Justificado") justificados++;
        });

        document.getElementById("gestao-count-ativos")?.replaceChildren(document.createTextNode(ativos));
        document.getElementById("gestao-count-novos")?.replaceChildren(document.createTextNode(novos));
        document.getElementById("gestao-count-inadimplentes")?.replaceChildren(document.createTextNode(inadimplentes));
        document.getElementById("gestao-count-justificados")?.replaceChildren(document.createTextNode(justificados));

    } catch (e) {
        console.warn("Erro ao atualizar resumo da gestão:", e);
    }
}

// 5. gerarOpcoesMesesGestao
function gerarOpcoesMesesGestao() {
    const nomesMeses = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    const inicio = new Date(2026, 3, 1);
    const hoje = new Date();
    const cursor = new Date(inicio);
    const opcoes = ['<option value="todos">Todos os registros financeiros</option>'];

    while (cursor <= hoje) {
        const mesAno = `${nomesMeses[cursor.getMonth()]}/${cursor.getFullYear()}`;
        opcoes.push(`<option value="${mesAno}">Registro: ${mesAno}</option>`);
        cursor.setMonth(cursor.getMonth() + 1);
    }

    return opcoes.join('');
}

// 6. irParaBlocoGestao
function irParaBlocoGestao(idBloco) {
    const bloco = document.getElementById(idBloco);
    const container = document.getElementById('main-content');
    if (!bloco || !container) return;
    container.scrollTo({
        top: bloco.offsetTop - 12,
        behavior: "smooth"
    });
}

function dashboardEscapeHtmlDVC(valor = "") {
    if (typeof window.escaparHtml === "function") return window.escaparHtml(valor);

    return String(valor)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function dashboardValorDVC(valor, fallback = "Não informado") {
    const texto = String(valor || "").trim();
    return texto || fallback;
}

function dashboardIdadeDVC(user = {}) {
    const nascimento = user.nascimento || user.dataNascimento || "";
    if (!nascimento) return null;

    const data = new Date(nascimento);
    if (Number.isNaN(data.getTime())) return null;

    const hoje = new Date();
    let idade = hoje.getFullYear() - data.getFullYear();
    const mes = hoje.getMonth() - data.getMonth();
    if (mes < 0 || (mes === 0 && hoje.getDate() < data.getDate())) idade--;

    return idade;
}

function dashboardEhSub17DVC(user = {}) {
    const categoria = String(user.categoria || user.categoriaEtaria || "").toLowerCase();
    if (categoria.includes("sub17") || categoria.includes("sub-17")) return true;

    const idade = dashboardIdadeDVC(user);
    return idade !== null && idade < 18;
}

function dashboardFaixaEtariaDVC(user = {}) {
    const idade = dashboardIdadeDVC(user);
    if (idade === null) return "Não informada";
    if (idade < 12) return "Até 11";
    if (idade <= 14) return "12 a 14";
    if (idade <= 17) return "15 a 17";
    if (idade <= 29) return "18 a 29";
    return "30+";
}

function dashboardGeneroDVC(user = {}) {
    const genero = String(user.genero || user.sexo || "").trim().toLowerCase();
    if (genero === "m" || genero.includes("masc")) return "Masculino";
    if (genero === "f" || genero.includes("fem")) return "Feminino";
    if (genero) return "Outro/Não binário";
    return "Não informado";
}

function dashboardVinculoDVC(user = {}) {
    const vinculo = String(user.vinculoDvc || "").trim();
    if (vinculo) return vinculo;
    if (window.ehResponsavelTecnico?.(user)) return "Voluntário";
    return "Atleta";
}

function dashboardIncrementarDVC(obj, chave, valor = 1) {
    const nome = dashboardValorDVC(chave);
    obj[nome] = (obj[nome] || 0) + valor;
}

function dashboardTopAgrupadoDVC(contagem = {}, limite = 8, rotuloOutros = "Outros", minimoIndividual = 1) {
    const entradas = Object.entries(contagem)
        .filter(([, total]) => Number(total) > 0)
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

    const principais = [];
    let outros = 0;

    entradas.forEach((item, index) => {
        const [, total] = item;
        if (index < limite && total >= minimoIndividual) {
            principais.push(item);
        } else {
            outros += total;
        }
    });

    if (outros > 0) principais.push([rotuloOutros, outros]);
    return principais;
}

function dashboardCardDVC(titulo, valor, apoio = "", cor = "text-[#990000]") {
    return `
        <div class="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-3 shadow-sm text-gray-900 dark:text-gray-100">
            <p class="text-[8px] font-black uppercase text-gray-400 dark:text-gray-500">${dashboardEscapeHtmlDVC(titulo)}</p>
            <p class="text-2xl font-black ${cor} leading-none mt-1">${dashboardEscapeHtmlDVC(valor)}</p>
            ${apoio ? `<p class="text-[9px] font-semibold text-gray-500 dark:text-gray-450 mt-1 leading-snug">${dashboardEscapeHtmlDVC(apoio)}</p>` : ""}
        </div>
    `;
}

function dashboardListaTopDVC(titulo, itens = []) {
    const lista = itens.length ? itens.map(([label, total], index) => `
        <div class="flex items-center justify-between gap-3 bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-xl p-2">
            <div class="min-w-0">
                <p class="text-[10px] font-black uppercase text-gray-700 dark:text-gray-300 truncate">${index + 1}. ${dashboardEscapeHtmlDVC(label)}</p>
            </div>
            <span class="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300 text-[9px] font-black px-2 py-1 rounded-full shrink-0">${total}</span>
        </div>
    `).join("") : `
        <div class="bg-gray-50 dark:bg-gray-950 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl p-3 text-center">
            <p class="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500">Sem dados suficientes.</p>
        </div>
    `;

    return `
        <div class="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm text-gray-900 dark:text-gray-100">
            <p class="text-[10px] font-black uppercase text-gray-800 dark:text-gray-200 mb-3">${dashboardEscapeHtmlDVC(titulo)}</p>
            <div class="space-y-2">${lista}</div>
        </div>
    `;
}

function dashboardCriarGraficoDVC(canvasId, tipo, labels = [], dados = [], label = "Total", cores = null) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || typeof Chart === "undefined") return null;

    const chart = new Chart(canvas, {
        type: tipo,
        data: {
            labels,
            datasets: [{
                label,
                data: dados,
                backgroundColor: cores || ['#990000', '#2563eb', '#16a34a', '#ca8a04', '#7c3aed', '#0891b2', '#db2777', '#64748b', '#ea580c'],
                borderColor: tipo === "line" ? "#990000" : undefined,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: ["doughnut", "pie"].includes(tipo),
                    position: "bottom",
                    labels: { boxWidth: 10, font: { size: 10 } }
                }
            },
            scales: ["bar", "line"].includes(tipo) ? {
                y: { beginAtZero: true, ticks: { precision: 0 } },
                x: { ticks: { font: { size: 9 } } }
            } : {}
        }
    });

    window.dashboardCharts.push(chart);
    return chart;
}

// 7. renderDashboard
async function renderDashboard() {
    const c = document.getElementById('main-content');

    if (!window.usuarioEhADM()) {
        c.innerHTML = `
            <div class="p-6 text-center bg-red-50 dark:bg-red-955 border border-red-200 dark:border-red-900/50 rounded-xl">
                <p class="text-red-700 dark:text-red-400 font-black text-xs uppercase">
                    Acesso restrito ao ADM.
                </p>
            </div>
        `;
        return;
    }

    destruirGraficosDashboard();

    c.innerHTML = `
        <h3 class="font-bold mb-4 uppercase text-gray-800 dark:text-gray-100">
            Painel Administrativo
        </h3>

        <div id="dashboard-cards" class="grid grid-cols-2 gap-2 mb-4">
            <div class="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm text-center">
                <p class="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase">Ativos</p>
                <p id="dash-ativos" class="text-2xl font-black text-green-600 dark:text-green-450">-</p>
            </div>

            <div class="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm text-center">
                <p class="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase">Inativos</p>
                <p id="dash-inativos" class="text-2xl font-black text-red-600 dark:text-red-450">-</p>
            </div>
            <div class="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm text-center">
                <p class="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase">Acessaram hoje</p>
                <p id="dash-acessos-hoje" class="text-2xl font-black text-indigo-600 dark:text-indigo-405">-</p>
            </div>

            <div class="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm text-center">
                <p class="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase">Sem acessar 7 dias</p>
                <p id="dash-sem-acesso" class="text-2xl font-black text-red-700 dark:text-red-455">-</p>
            </div>
            <div class="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm text-center">
                <p class="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase">Pagamentos</p>
                <p id="dash-pagos" class="text-2xl font-black text-blue-600 dark:text-blue-450">-</p>
            </div>

            <div class="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm text-center">
                <p class="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase">Justificativas</p>
                <p id="dash-justificados" class="text-2xl font-black text-yellow-600 dark:text-yellow-450">-</p>
            </div>

            <div class="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm text-center">
                <p class="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase">Avisos ativos</p>
                <p id="dash-avisos-ativos" class="text-2xl font-black text-[#990000] dark:text-red-450">-</p>
            </div>

            <div class="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm text-center">
                <p class="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase">Avaliações equipe</p>
                <p id="dash-avaliacoes-equipe" class="text-2xl font-black text-indigo-600 dark:text-indigo-405">-</p>
            </div>
        </div>

        <div class="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm mb-4">
            <p class="text-[10px] font-black text-gray-600 dark:text-gray-300 uppercase mb-3">
                Alunos ativos x inativos
            </p>
            <canvas id="chart-status-alunos" height="180"></canvas>
        </div>

        <div class="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm mb-4">
            <p class="text-[10px] font-black text-gray-600 dark:text-gray-300 uppercase mb-3">
                Presenças registradas por mês
            </p>
            <canvas id="chart-presencas-mes" height="220"></canvas>
        </div>

        <div class="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm mb-4">
            <p class="text-[10px] font-black text-gray-600 dark:text-gray-300 uppercase mb-3">
                Pagamentos x justificativas por mês
            </p>
            <canvas id="chart-financeiro-mes" height="220"></canvas>
        </div>

        <div class="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm mb-4">
            <p class="text-[10px] font-black text-gray-600 dark:text-gray-300 uppercase mb-3">
                Comparativo geral financeiro
            </p>
            <canvas id="chart-financeiro-geral" height="180"></canvas>
        </div>
    `;

    try {
        if (typeof Chart === "undefined") {
            c.innerHTML += `
                <div class="bg-red-50 dark:bg-red-955 border border-red-200 dark:border-red-900/50 rounded-xl p-4 text-center">
                    <p class="text-xs font-bold text-red-700 dark:text-red-400">
                        Biblioteca de gráficos não carregada. Verifique se o script do Chart.js foi adicionado no &lt;head&gt;.
                    </p>
                </div>
            `;
            return;
        }

        // 1. Buscar usuários
        const usuariosDashboard = await window.carregarAtletasCache();

        let alunos = [];

        usuariosDashboard.forEach(user => {
            // Considera aluno apenas quem nao e da equipe tecnica
            if (!window.ehResponsavelTecnico(user)) {
                alunos.push({
                    ...user,
                    email: user.email || ""
                });
            }
        });

        const ativos = alunos.filter(a => a.status === "Ativo").length;
        const inativos = alunos.filter(a => a.status !== "Ativo").length;
        const hojeId = new Date().toISOString().split("T")[0];

        const acessaramHoje = alunos.filter(a => {
            if (!a.uÚltimoAcesso) return false;
            return a.uÚltimoAcesso.startsWith(hojeId);
        }).length;

        const semAcesso7Dias = alunos.filter(a => {
            if (!a.uÚltimoAcesso) return true;

            const data = new Date(a.uÚltimoAcesso);
            if (isNaN(data.getTime())) return true;

            const diffDias = Math.floor((new Date() - data) / (1000 * 60 * 60 * 24));
            return diffDias >= 7;
        }).length;

        document.getElementById('dash-ativos').innerText = ativos;
        document.getElementById('dash-inativos').innerText = inativos;
        document.getElementById('dash-acessos-hoje').innerText = acessaramHoje;
        document.getElementById('dash-sem-acesso').innerText = semAcesso7Dias;

        try {
            const mesAvaliacaoEquipe = window.obterMesAtualAvaliacaoTecnicaDVC();
            const avisosDashResult = await Promise.allSettled([window.carregarAvisosDVCCache()]);

            if (avisosDashResult[0].status === "fulfilled") {
                const avisosAtivos = avisosDashResult[0].value.filter(window.avisoEstaAtivoDVC).length;
                document.getElementById('dash-avisos-ativos').innerText = avisosAtivos;
            }

            const avaliacoesCache = window.DVC_CACHE?.avaliacoesEquipeTecnica?.dados || [];
            const avaliacoesMes = avaliacoesCache.filter(av => av.mes === mesAvaliacaoEquipe).length;
            document.getElementById('dash-avaliacoes-equipe').innerText = avaliacoesMes;
        } catch (erroResumoComunicacaoDVC) {
            console.warn("Não foi possível carregar resumo de avisos/avaliações da equipe:", erroResumoComunicacaoDVC);
        }

        // 2. Buscar presenças por mês
        const presencasPorMes = {};

        const eventos = await window.carregarEventosCache();

        const presencasPromises = eventos.map(async ev => {
            const mesEvento = dashboardNomeMes(ev.data);
            const presencas = window.DVC_CACHE?.presencasPorEvento?.[ev.id]?.dados || [];

            presencasPorMes[mesEvento] = (presencasPorMes[mesEvento] || 0) + presencas.length;
        });

        await Promise.allSettled(presencasPromises);

        const pagosPorMes = {};
        const justificadosPorMes = {};

        let totalPagos = 0;
        let totalJustificados = 0;

        const mesAtualTexto = window.obterMesAtualTextoFinanceiro();

        const usuariosFinanceiroDashboard = await window.carregarAtletasCache();

        usuariosFinanceiroDashboard.forEach(user => {
            if (!window.usuarioEhAtletaAtivo(user)) return;

            if (window.usuarioEstaEmDia(user)) {
                totalPagos++;
                pagosPorMes[mesAtualTexto] = (pagosPorMes[mesAtualTexto] || 0) + 1;
            }

            if (window.usuarioEstaJustificado(user)) {
                totalJustificados++;
                justificadosPorMes[mesAtualTexto] = (justificadosPorMes[mesAtualTexto] || 0) + 1;
            }
        });

        document.getElementById('dash-pagos').innerText = totalPagos;
        document.getElementById('dash-justificados').innerText = totalJustificados;

        const mesesPresenca = dashboardOrdenarMeses(Object.keys(presencasPorMes));

        const mesesFinanceiro = dashboardOrdenarMeses([
            ...new Set([
                ...Object.keys(pagosPorMes),
                ...Object.keys(justificadosPorMes)
            ])
        ]);

        const chartStatus = new Chart(document.getElementById('chart-status-alunos'), {
            type: 'doughnut',
            data: {
                labels: ['Ativos', 'Inativos'],
                datasets: [{
                    data: [ativos, inativos],
                    backgroundColor: ['#22c55e', '#ef4444']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });

        const chartPresencas = new Chart(document.getElementById('chart-presencas-mes'), {
            type: 'bar',
            data: {
                labels: mesesPresenca,
                datasets: [{
                    label: 'Presenças',
                    data: mesesPresenca.map(mes => presencasPorMes[mes] || 0),
                    backgroundColor: '#990000'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        });

        const chartFinanceiroMes = new Chart(document.getElementById('chart-financeiro-mes'), {
            type: 'line',
            data: {
                labels: mesesFinanceiro,
                datasets: [
                    {
                        label: 'Contribuíram',
                        data: mesesFinanceiro.map(mes => pagosPorMes[mes] || 0),
                        borderColor: '#2563eb',
                        backgroundColor: '#2563eb',
                        tension: 0.3
                    },
                    {
                        label: 'Justificaram',
                        data: mesesFinanceiro.map(mes => justificadosPorMes[mes] || 0),
                        borderColor: '#ca8a04',
                        backgroundColor: '#ca8a04',
                        tension: 0.3
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        });

        const chartFinanceiroGeral = new Chart(document.getElementById('chart-financeiro-geral'), {
            type: 'pie',
            data: {
                labels: ['Contribuíram', 'Justificaram'],
                datasets: [{
                    data: [totalPagos, totalJustificados],
                    backgroundColor: ['#2563eb', '#ca8a04']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });

        window.dashboardCharts.push(chartStatus, chartPresencas, chartFinanceiroMes, chartFinanceiroGeral);

    } catch (e) {
        console.error("Erro ao carregar dashboard:", e);

        c.innerHTML += `
            <div class="bg-red-50 dark:bg-red-955 border border-red-200 dark:border-red-900/50 rounded-xl p-4 text-center">
                <p class="text-xs font-bold text-red-700 dark:text-red-400">
                    Não foi possível carregar o painel agora.
                </p>
            </div>
        `;
    }
}

async function carregarPesquisasTrimestraisCache(force = false, chaveTrimestreParametro = "") {
    if (typeof force === "string") {
        chaveTrimestreParametro = force;
        force = false;
    }

    const TTL = 2 * 60 * 1000; // 2 minutos de cache
    const cache = window.DVC_CACHE?.pesquisasTrimestrais;
    const temFiltroTrimestre = Boolean(chaveTrimestreParametro);

    if (!temFiltroTrimestre) {
        if (!force && cache?.dados && (Date.now() - cache.atualizadoEm < TTL)) {
            return cache.dados;
        }

        try {
            console.log("[DVC leitura] pesquisasTrimestrais");
            const snap = await getDocs(collection(db, "pesquisasTrimestrais"));

            const dados = snap.docs.map(docSnap => ({
                id: docSnap.id,
                ...docSnap.data()
            }));

            if (!window.DVC_CACHE) window.DVC_CACHE = {};
            window.DVC_CACHE.pesquisasTrimestrais = {
                dados: dados,
                atualizadoEm: Date.now()
            };

            return dados;
        } catch (e) {
            console.warn("Erro ao buscar pesquisas trimestrais:", e);
            return [];
        }
    }
    
    let chaveAtiva = chaveTrimestreParametro || "";
    if (typeof window.obterChavePesquisaAtivaDVC === "function") {
        const dataRef = window.obterDataAtualDVC ? window.obterDataAtualDVC() : new Date();
        chaveAtiva = chaveAtiva || window.obterChavePesquisaAtivaDVC(dataRef);
    }
    
    if (!chaveAtiva) return [];

    const cachePorTrimestre = window.DVC_CACHE?.pesquisasTrimestraisPorTrimestre?.[chaveAtiva];
    if (!force && cachePorTrimestre?.dados && (Date.now() - cachePorTrimestre.atualizadoEm < TTL)) {
        return cachePorTrimestre.dados;
    }

    if (!force && cache?.dados && cache.chaveTrimestre === chaveAtiva && (Date.now() - cache.atualizadoEm < TTL)) {
        return cache.dados;
    }
    
    try {
        console.log("[DVC leitura] pesquisasTrimestrais");
        const q = query(collection(db, "pesquisasTrimestrais"), where("chaveTrimestre", "==", chaveAtiva));
        const snap = await getDocs(q);
        
        const dados = snap.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data()
        }));
        
        if (!window.DVC_CACHE) window.DVC_CACHE = {};
        window.DVC_CACHE.pesquisasTrimestraisPorTrimestre = window.DVC_CACHE.pesquisasTrimestraisPorTrimestre || {};
        window.DVC_CACHE.pesquisasTrimestraisPorTrimestre[chaveAtiva] = {
            dados: dados,
            atualizadoEm: Date.now()
        };
        window.DVC_CACHE.pesquisasTrimestrais = {
            dados: dados,
            atualizadoEm: Date.now(),
            chaveTrimestre: chaveAtiva
        };
        
        return dados;
    } catch (e) {
        console.warn("Erro ao buscar pesquisas trimestrais:", e);
        return [];
    }
}
window.carregarPesquisasTrimestraisCache = carregarPesquisasTrimestraisCache;

const CAMPOS_RESPOSTAS_ABERTAS_PESQUISA_DVC = [
    "perguntaAbertaSub17",
    "perguntaAbertaAdulto",
    "perguntaAbertaSub17Curta",
    "perguntaAbertaAdultoCurta"
];

const estadoRespostasAbertasPesquisaDVC = {
    chaveTrimestre: "",
    pergunta: "",
    tipoRespondente: "todos",
    busca: "",
    mostrarVazias: false,
    modo: "pergunta",
    dados: [],
    carregando: false
};

function textoPesquisaDVC(valor = "") {
    const texto = String(valor || "");
    if (typeof window.corrigirMojibakeDVC === "function") {
        return window.corrigirMojibakeDVC(texto);
    }
    return texto;
}

function escaparHtmlPesquisaDVC(texto = "") {
    // DVC PESQUISA: escapa conteudo livre antes de renderizar.
    return dashboardEscapeHtmlDVC(textoPesquisaDVC(texto));
}

function obterRespostaAbertaPesquisaDVC(documento = {}, campo = "") {
    return (
        documento?.respostas?.[campo] ??
        documento?.[campo] ??
        ""
    );
}

function obterPerguntasAbertasAdminPesquisaDVC() {
    const perguntasWindow = typeof window.obterPerguntasAbertasPesquisaDVC === "function"
        ? window.obterPerguntasAbertasPesquisaDVC()
        : [];

    const porId = {};
    perguntasWindow.forEach(pergunta => {
        if (pergunta?.id && CAMPOS_RESPOSTAS_ABERTAS_PESQUISA_DVC.includes(pergunta.id)) {
            porId[pergunta.id] = pergunta.pergunta || pergunta.id;
        }
    });

    const fallback = {
        perguntaAbertaSub17: "Conte uma coisa que voce aprendeu, melhorou ou percebeu sobre voce neste trimestre.",
        perguntaAbertaAdulto: "Deixe uma sugestao, critica ou comentario sobre como o DVC pode melhorar nos proximos meses.",
        perguntaAbertaSub17Curta: "Conte em poucas palavras o que voce espera viver ou aprender no DVC.",
        perguntaAbertaAdultoCurta: "Deixe uma sugestao ou expectativa para sua participacao no DVC."
    };

    return CAMPOS_RESPOSTAS_ABERTAS_PESQUISA_DVC.map(id => ({
        id,
        pergunta: porId[id] || fallback[id] || id
    }));
}

function obterTrimestresComentariosPesquisaDVC() {
    return ["2026-T1", "2026-T2", "2026-T3"];
}

function formatarChaveTrimestrePesquisaDVC(chave = "") {
    const [ano, trimestre] = String(chave || "").split("-T");
    return `${ano || "2026"} - T${trimestre || ""}`.trim();
}

function obterChaveInicialComentariosPesquisaDVC() {
    const trimestres = obterTrimestresComentariosPesquisaDVC();
    const ativa = typeof window.obterChavePesquisaAtivaDVC === "function"
        ? window.obterChavePesquisaAtivaDVC(window.obterDataAtualDVC ? window.obterDataAtualDVC() : new Date())
        : "";

    if (trimestres.includes(ativa)) return ativa;
    return trimestres[trimestres.length - 1];
}

function formatarDataRespostaPesquisaDVC(valor) {
    if (!valor) return "Data nao registrada";

    const data = typeof valor.toDate === "function"
        ? valor.toDate()
        : valor.seconds
            ? new Date(valor.seconds * 1000)
            : new Date(valor);

    if (Number.isNaN(data.getTime())) return "Data nao registrada";

    return data.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
}

function obterDadosParticipantePesquisaDVC(documento = {}) {
    const nome = textoPesquisaDVC(documento.nome || documento.nomeCompleto || documento.email || "Participante DVC");
    const funcao = textoPesquisaDVC(documento.funcao || documento.tipoFuncao || "Atleta");
    const genero = textoPesquisaDVC(documento.genero || documento.sexo || "");
    const categoria = textoPesquisaDVC(
        documento.categoria ||
        documento.categoriaEtaria ||
        (documento.tipoRespondente === "sub17" ? "Sub-17" : documento.tipoRespondente === "adulto" ? "Adulto" : "")
    );
    const dataResposta = formatarDataRespostaPesquisaDVC(documento.respondidoEm || documento.criadoEm || documento.atualizadoEm);

    return {
        nome,
        funcao,
        genero,
        categoria,
        dataResposta,
        busca: window.normalizarBuscaDVC
            ? window.normalizarBuscaDVC([nome, funcao, genero, categoria, documento.email || ""].join(" "))
            : [nome, funcao, genero, categoria, documento.email || ""].join(" ").toLowerCase()
    };
}

function documentoPassaFiltrosPesquisaDVC(documento = {}) {
    const estado = estadoRespostasAbertasPesquisaDVC;

    if (estado.tipoRespondente !== "todos" && documento.tipoRespondente !== estado.tipoRespondente) {
        return false;
    }

    if (estado.busca) {
        const dados = obterDadosParticipantePesquisaDVC(documento);
        const busca = window.normalizarBuscaDVC ? window.normalizarBuscaDVC(estado.busca) : estado.busca.toLowerCase();
        if (!dados.busca.includes(busca)) return false;
    }

    return true;
}

function renderizarRespostaTextoPesquisaDVC(resposta = "") {
    const texto = textoPesquisaDVC(resposta).trim();

    if (!texto) {
        return `<p class="text-[10px] font-semibold italic text-gray-400 dark:text-gray-500">Nao respondida</p>`;
    }

    if (texto.length <= 220) {
        return `<p class="text-[11px] font-semibold leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-wrap">${escaparHtmlPesquisaDVC(texto)}</p>`;
    }

    const resumo = `${texto.slice(0, 220).trim()}...`;
    return `
        <p class="text-[11px] font-semibold leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-wrap">${escaparHtmlPesquisaDVC(resumo)}</p>
        <details class="mt-2">
            <summary class="cursor-pointer text-[9px] font-black uppercase text-red-800 dark:text-red-400">Ler resposta completa</summary>
            <p class="mt-2 text-[11px] font-semibold leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-wrap">${escaparHtmlPesquisaDVC(texto)}</p>
        </details>
    `;
}

function obterPerguntasSelecionadasPesquisaDVC() {
    const perguntas = obterPerguntasAbertasAdminPesquisaDVC();
    if (estadoRespostasAbertasPesquisaDVC.pergunta === "todas") return perguntas;
    return perguntas.filter(pergunta => pergunta.id === estadoRespostasAbertasPesquisaDVC.pergunta);
}

function renderizarCardRespostaPorPerguntaDVC(documento = {}, pergunta = {}) {
    const resposta = obterRespostaAbertaPesquisaDVC(documento, pergunta.id);
    if (!estadoRespostasAbertasPesquisaDVC.mostrarVazias && !textoPesquisaDVC(resposta).trim()) {
        return "";
    }

    const dados = obterDadosParticipantePesquisaDVC(documento);
    return `
        <article class="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm text-gray-900 dark:text-gray-100">
            <div class="rounded-xl border border-red-100 dark:border-red-950/40 bg-red-50 dark:bg-red-955/20 px-3 py-2">
                <p class="text-[8px] font-black uppercase text-red-800 dark:text-red-400">Pergunta visualizada</p>
                <p class="mt-1 text-[10px] font-black leading-snug text-gray-800 dark:text-gray-200">${escaparHtmlPesquisaDVC(pergunta.pergunta)}</p>
            </div>

            <div class="mt-3 flex items-start justify-between gap-3">
                <div class="min-w-0">
                    <p class="text-[11px] font-black uppercase text-gray-900 dark:text-gray-100">${escaparHtmlPesquisaDVC(dados.nome)}</p>
                    <p class="mt-1 text-[9px] font-bold uppercase text-gray-400 dark:text-gray-500">
                        ${escaparHtmlPesquisaDVC([dados.funcao, dados.genero, dados.categoria].filter(Boolean).join(" - "))}
                    </p>
                    <p class="mt-1 text-[9px] font-semibold text-gray-400 dark:text-gray-550">Respondido em ${escaparHtmlPesquisaDVC(dados.dataResposta)}</p>
                </div>
            </div>

            <div class="mt-3 border-t border-gray-100 dark:border-gray-800 pt-3">
                ${renderizarRespostaTextoPesquisaDVC(resposta)}
            </div>
        </article>
    `;
}

function renderizarListaPorPerguntaPesquisaDVC(dados = []) {
    const perguntas = obterPerguntasSelecionadasPesquisaDVC();
    const html = [];

    dados.forEach(documento => {
        perguntas.forEach(pergunta => {
            const card = renderizarCardRespostaPorPerguntaDVC(documento, pergunta);
            if (card) html.push(card);
        });
    });

    if (html.length === 0) {
        return `<div class="rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-955 p-5 text-center text-[10px] font-black uppercase text-gray-400 dark:text-gray-500">Nenhuma resposta aberta encontrada.</div>`;
    }

    return html.join("");
}

function renderizarCardParticipantePesquisaDVC(documento = {}) {
    const perguntas = obterPerguntasSelecionadasPesquisaDVC();
    const respostas = perguntas
        .map(pergunta => ({
            pergunta,
            resposta: obterRespostaAbertaPesquisaDVC(documento, pergunta.id)
        }))
        .filter(item => estadoRespostasAbertasPesquisaDVC.mostrarVazias || textoPesquisaDVC(item.resposta).trim());

    if (respostas.length === 0) return "";

    const dados = obterDadosParticipantePesquisaDVC(documento);

    return `
        <article class="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm text-gray-900 dark:text-gray-100">
            <p class="text-[11px] font-black uppercase text-gray-900 dark:text-gray-100">${escaparHtmlPesquisaDVC(dados.nome)}</p>
            <p class="mt-1 text-[9px] font-bold uppercase text-gray-400 dark:text-gray-500">
                ${escaparHtmlPesquisaDVC([dados.funcao, dados.genero, dados.categoria].filter(Boolean).join(" - "))}
            </p>
            <p class="mt-1 text-[9px] font-semibold text-gray-400 dark:text-gray-550">Respondido em ${escaparHtmlPesquisaDVC(dados.dataResposta)}</p>

            <div class="mt-3 space-y-3 border-t border-gray-100 dark:border-gray-800 pt-3">
                ${respostas.map((item, index) => `
                    <div>
                        <p class="text-[8px] font-black uppercase text-red-800 dark:text-red-400">Pergunta ${index + 1}</p>
                        <p class="mt-1 text-[10px] font-black leading-snug text-gray-800 dark:text-gray-200">${escaparHtmlPesquisaDVC(item.pergunta.pergunta)}</p>
                        <div class="mt-2">${renderizarRespostaTextoPesquisaDVC(item.resposta)}</div>
                    </div>
                `).join("")}
            </div>
        </article>
    `;
}

function renderizarListaPorParticipantePesquisaDVC(dados = []) {
    const html = dados
        .map(renderizarCardParticipantePesquisaDVC)
        .filter(Boolean);

    if (html.length === 0) {
        return `<div class="rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-955 p-5 text-center text-[10px] font-black uppercase text-gray-400 dark:text-gray-500">Nenhum participante encontrado.</div>`;
    }

    return html.join("");
}

function renderizarPainelRespostasAbertasPesquisaDVC() {
    const corpo = document.getElementById("comentarios-pesquisa-corpo-dvc");
    if (!corpo) return;

    const estado = estadoRespostasAbertasPesquisaDVC;
    const perguntas = obterPerguntasAbertasAdminPesquisaDVC();

    if (!estado.pergunta || !["todas", ...perguntas.map(pergunta => pergunta.id)].includes(estado.pergunta)) {
        estado.pergunta = perguntas[0]?.id || "todas";
    }

    const dadosFiltrados = estado.dados.filter(documentoPassaFiltrosPesquisaDVC);
    const listaHtml = estado.carregando
        ? `<div class="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 text-center shadow-sm text-gray-900 dark:text-gray-100"><p class="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500">Carregando coment&aacute;rios...</p></div>`
        : estado.modo === "participante"
            ? renderizarListaPorParticipantePesquisaDVC(dadosFiltrados)
            : renderizarListaPorPerguntaPesquisaDVC(dadosFiltrados);

    const perguntaOptions = [
        `<option value="todas" ${estado.pergunta === "todas" ? "selected" : ""}>Todas as perguntas abertas</option>`,
        ...perguntas.map(pergunta => `
            <option value="${escaparHtmlPesquisaDVC(pergunta.id)}" ${estado.pergunta === pergunta.id ? "selected" : ""}>
                ${escaparHtmlPesquisaDVC(pergunta.pergunta)}
            </option>
        `)
    ].join("");

    corpo.innerHTML = `
        <div class="bg-gradient-to-br from-gray-950 via-gray-900 to-[#990000] text-white p-5 rounded-3xl shadow-xl">
            <p class="text-[8px] font-black uppercase tracking-wider text-white/60">Coment&aacute;rios da pesquisa</p>
            <h3 class="mt-1 text-lg font-black uppercase leading-tight">Coment&aacute;rios da Pesquisa</h3>
            <p class="mt-1 text-[10px] font-semibold leading-relaxed text-white/70">Respostas abertas da avalia&ccedil;&atilde;o trimestral</p>
            <div class="mt-4 grid grid-cols-2 gap-2">
                <div class="rounded-2xl border border-white/10 bg-white/10 p-3">
                    <p class="text-[8px] font-black uppercase text-white/60">Per&iacute;odo</p>
                    <p class="mt-1 text-sm font-black uppercase">${escaparHtmlPesquisaDVC(formatarChaveTrimestrePesquisaDVC(estado.chaveTrimestre))}</p>
                </div>
                <div class="rounded-2xl border border-white/10 bg-white/10 p-3 text-right">
                    <p class="text-[8px] font-black uppercase text-white/60">Quantidade de respostas</p>
                    <p class="mt-1 text-sm font-black uppercase">${estado.dados.length}</p>
                </div>
            </div>
        </div>

        <div class="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm text-gray-900 dark:text-gray-100">
            <div class="grid grid-cols-1 gap-3">
                <label class="block">
                    <span class="text-[8px] font-black uppercase text-gray-400 dark:text-gray-500">Trimestre</span>
                    <select id="comentarios-pesquisa-trimestre-dvc" onchange="selecionarTrimestreComentariosPesquisaDVC(this.value)" class="mt-1 h-11 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 px-3 text-[11px] font-black text-gray-800 dark:text-gray-200 outline-none">
                        ${obterTrimestresComentariosPesquisaDVC().map(chave => `
                            <option value="${chave}" ${estado.chaveTrimestre === chave ? "selected" : ""}>${formatarChaveTrimestrePesquisaDVC(chave)}</option>
                        `).join("")}
                    </select>
                </label>

                <label class="block">
                    <span class="text-[8px] font-black uppercase text-gray-400 dark:text-gray-500">Pergunta</span>
                    <select id="comentarios-pesquisa-pergunta-dvc" onchange="atualizarFiltrosComentariosPesquisaDVC()" class="mt-1 h-11 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-955 px-3 text-[11px] font-black text-gray-800 dark:text-gray-200 outline-none">
                        ${perguntaOptions}
                    </select>
                </label>

                <div class="grid grid-cols-2 gap-2">
                    <label class="block">
                        <span class="text-[8px] font-black uppercase text-gray-400 dark:text-gray-500">Respondente</span>
                        <select id="comentarios-pesquisa-tipo-dvc" onchange="atualizarFiltrosComentariosPesquisaDVC()" class="mt-1 h-11 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-955 px-3 text-[11px] font-black text-gray-800 dark:text-gray-200 outline-none">
                            <option value="todos" ${estado.tipoRespondente === "todos" ? "selected" : ""}>Todos</option>
                            <option value="sub17" ${estado.tipoRespondente === "sub17" ? "selected" : ""}>Sub-17</option>
                            <option value="adulto" ${estado.tipoRespondente === "adulto" ? "selected" : ""}>Adulto</option>
                        </select>
                    </label>

                    <label class="block">
                        <span class="text-[8px] font-black uppercase text-gray-400 dark:text-gray-500">Busca por nome</span>
                        <input id="comentarios-pesquisa-busca-dvc" value="${escaparHtmlPesquisaDVC(estado.busca)}" oninput="atualizarFiltrosComentariosPesquisaDVC()" class="mt-1 h-11 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-955 px-3 text-[11px] font-semibold text-gray-800 dark:text-gray-200 outline-none" placeholder="Nome">
                    </label>
                </div>

                <label class="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-955 px-3 py-3">
                    <input id="comentarios-pesquisa-vazias-dvc" type="checkbox" onchange="atualizarFiltrosComentariosPesquisaDVC()" class="accent-[#990000]" ${estado.mostrarVazias ? "checked" : ""}>
                    <span class="text-[9px] font-black uppercase text-gray-600 dark:text-gray-400">Mostrar n&atilde;o respondidas</span>
                </label>

                <div class="grid grid-cols-2 gap-2">
                    <button type="button" onclick="alternarVisualizacaoComentariosPesquisaDVC('pergunta')" class="rounded-xl px-3 py-3 text-[9px] font-black uppercase ${estado.modo === "pergunta" ? "bg-[#990000] text-white" : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"}">Por pergunta</button>
                    <button type="button" onclick="alternarVisualizacaoComentariosPesquisaDVC('participante')" class="rounded-xl px-3 py-3 text-[9px] font-black uppercase ${estado.modo === "participante" ? "bg-[#990000] text-white" : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"}">Por participante</button>
                </div>
            </div>
        </div>

        <div class="space-y-3">
            ${listaHtml}
        </div>
    `;
}

async function carregarTrimestreComentariosPesquisaDVC(chaveTrimestre) {
    estadoRespostasAbertasPesquisaDVC.chaveTrimestre = chaveTrimestre;
    estadoRespostasAbertasPesquisaDVC.carregando = true;
    renderizarPainelRespostasAbertasPesquisaDVC();

    // DVC PESQUISA: mantem respostas e filtros isolados por trimestre.
    estadoRespostasAbertasPesquisaDVC.dados = await carregarPesquisasTrimestraisCache(false, chaveTrimestre);
    estadoRespostasAbertasPesquisaDVC.carregando = false;
    renderizarPainelRespostasAbertasPesquisaDVC();
}

function atualizarFiltrosComentariosPesquisaDVC() {
    estadoRespostasAbertasPesquisaDVC.pergunta = document.getElementById("comentarios-pesquisa-pergunta-dvc")?.value || estadoRespostasAbertasPesquisaDVC.pergunta;
    estadoRespostasAbertasPesquisaDVC.tipoRespondente = document.getElementById("comentarios-pesquisa-tipo-dvc")?.value || "todos";
    estadoRespostasAbertasPesquisaDVC.busca = document.getElementById("comentarios-pesquisa-busca-dvc")?.value || "";
    estadoRespostasAbertasPesquisaDVC.mostrarVazias = document.getElementById("comentarios-pesquisa-vazias-dvc")?.checked || false;
    renderizarPainelRespostasAbertasPesquisaDVC();
}

function alternarVisualizacaoComentariosPesquisaDVC(modo = "pergunta") {
    // DVC PESQUISA: alterna a visualizacao sem novas leituras.
    estadoRespostasAbertasPesquisaDVC.modo = modo === "participante" ? "participante" : "pergunta";
    atualizarFiltrosComentariosPesquisaDVC();
}

function selecionarTrimestreComentariosPesquisaDVC(chaveTrimestre = "") {
    const chave = obterTrimestresComentariosPesquisaDVC().includes(chaveTrimestre)
        ? chaveTrimestre
        : obterChaveInicialComentariosPesquisaDVC();
    carregarTrimestreComentariosPesquisaDVC(chave);
}

function fecharRespostasAbertasPesquisaDVC() {
    document.getElementById("m-comentarios-pesquisa-dvc")?.remove();
}

function abrirRespostasAbertasPesquisaDVC() {
    if (!window.usuarioEhADM?.()) {
        alert("Acesso permitido somente para administradores.");
        return;
    }

    const modalAnterior = document.getElementById("m-comentarios-pesquisa-dvc");
    if (modalAnterior) modalAnterior.remove();

    const chaveInicial = obterChaveInicialComentariosPesquisaDVC();
    const perguntas = obterPerguntasAbertasAdminPesquisaDVC();

    estadoRespostasAbertasPesquisaDVC.chaveTrimestre = chaveInicial;
    estadoRespostasAbertasPesquisaDVC.pergunta = perguntas[0]?.id || "todas";
    estadoRespostasAbertasPesquisaDVC.tipoRespondente = "todos";
    estadoRespostasAbertasPesquisaDVC.busca = "";
    estadoRespostasAbertasPesquisaDVC.mostrarVazias = false;
    estadoRespostasAbertasPesquisaDVC.modo = "pergunta";
    estadoRespostasAbertasPesquisaDVC.dados = [];
    estadoRespostasAbertasPesquisaDVC.carregando = true;

    // DVC PESQUISA: reutiliza o painel existente de comentarios quando disponivel.
    const modalHtml = `
        <div id="m-comentarios-pesquisa-dvc" class="fixed inset-0 bg-black/80 z-[130] p-4 flex items-center justify-center fade-in">
            <div class="bg-gray-50 dark:bg-gray-950 w-full max-w-md rounded-3xl shadow-2xl max-h-[92vh] overflow-hidden flex flex-col border border-gray-100 dark:border-gray-800">
                <div class="flex items-center justify-between gap-3 border-b border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-900 px-4 py-3">
                    <div>
                        <p class="text-[8px] font-black uppercase text-red-800 dark:text-red-450">Pesquisa trimestral</p>
                        <p class="text-[12px] font-black uppercase text-gray-900 dark:text-gray-150 font-bold">Coment&aacute;rios abertos</p>
                    </div>
                    <button type="button" onclick="fecharRespostasAbertasPesquisaDVC()" class="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-[9px] font-black uppercase text-gray-600 dark:text-gray-400">Fechar</button>
                </div>

                <div id="comentarios-pesquisa-corpo-dvc" class="flex-1 overflow-y-auto custom-scroll p-4 space-y-4"></div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHtml);
    carregarTrimestreComentariosPesquisaDVC(chaveInicial);
}

window.obterRespostaAbertaPesquisaDVC = obterRespostaAbertaPesquisaDVC;
window.abrirRespostasAbertasPesquisaDVC = abrirRespostasAbertasPesquisaDVC;
window.fecharRespostasAbertasPesquisaDVC = fecharRespostasAbertasPesquisaDVC;
window.selecionarTrimestreComentariosPesquisaDVC = selecionarTrimestreComentariosPesquisaDVC;
window.atualizarFiltrosComentariosPesquisaDVC = atualizarFiltrosComentariosPesquisaDVC;
window.alternarVisualizacaoComentariosPesquisaDVC = alternarVisualizacaoComentariosPesquisaDVC;

function renderizarSubAbaEspecifica(aba) {
    const c = document.getElementById('main-content');
    if (!c || typeof Chart === "undefined") return;

    const dados = window.dashboardDadosCalculados;
    if (!dados) return;

    const criarDeContagem = (canvasId, tipo, contagem, label = "Total") => {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return null;
        const entradas = Object.entries(contagem || {}).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
        return dashboardCriarGraficoDVC(canvasId, tipo, entradas.map(([k]) => k), entradas.map(([, v]) => v), label);
    };

    if (aba === "visao") {
        const canvasStatus = document.getElementById('chart-status-alunos');
        if (canvasStatus) {
            const chartStatus = new Chart(canvasStatus, {
                type: 'doughnut',
                data: {
                    labels: ['Ativos', 'Inativos'],
                    datasets: [{
                        data: [dados.ativos, dados.inativos],
                        backgroundColor: ['#22c55e', '#ef4444']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 9 } } } }
                }
            });
            window.dashboardCharts.push(chartStatus);
        }

        const canvasPres = document.getElementById('chart-presencas-mes');
        if (canvasPres) {
            const chartPresencas = new Chart(canvasPres, {
                type: 'bar',
                data: {
                    labels: dados.mesesPresenca,
                    datasets: [{
                        label: 'Presenças',
                        data: dados.mesesPresenca.map(mes => dados.presencasPorMes[mes] || 0),
                        backgroundColor: '#990000'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true, ticks: { precision: 0 } }, x: { ticks: { font: { size: 9 } } } }
                }
            });
            window.dashboardCharts.push(chartPresencas);
        }

        const canvasFinMes = document.getElementById('chart-financeiro-mes');
        if (canvasFinMes) {
            const chartFinanceiroMes = new Chart(canvasFinMes, {
                type: 'line',
                data: {
                    labels: dados.mesesFinanceiro,
                    datasets: [
                        {
                            label: 'Contribuíram',
                            data: dados.mesesFinanceiro.map(mes => dados.pagosPorMes[mes] || 0),
                            borderColor: '#2563eb',
                            backgroundColor: '#2563eb',
                            tension: 0.3
                        },
                        {
                            label: 'Justificaram',
                            data: dados.mesesFinanceiro.map(mes => dados.justificadosPorMes[mes] || 0),
                            borderColor: '#ca8a04',
                            backgroundColor: '#ca8a04',
                            tension: 0.3
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 9 } } } },
                    scales: { y: { beginAtZero: true, ticks: { precision: 0 } }, x: { ticks: { font: { size: 9 } } } }
                }
            });
            window.dashboardCharts.push(chartFinanceiroMes);
        }

        const canvasFinGer = document.getElementById('chart-financeiro-geral');
        if (canvasFinGer) {
            const chartFinanceiroGeral = new Chart(canvasFinGer, {
                type: 'pie',
                data: {
                    labels: ['Contribuíram', 'Justificaram'],
                    datasets: [{
                        data: [dados.totalPagos, dados.totalJustificados],
                        backgroundColor: ['#2563eb', '#ca8a04']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 9 } } } }
                }
            });
            window.dashboardCharts.push(chartFinanceiroGeral);
        }
    } else if (aba === "socio") {
        criarDeContagem("chart-dashboard-genero", "doughnut", dados.genero);
        criarDeContagem("chart-dashboard-faixa-etaria", "bar", dados.faixaEtaria);
        criarDeContagem("chart-dashboard-raca-cor", "bar", dados.racaCor);
        criarDeContagem("chart-dashboard-vinculo", "doughnut", dados.vinculo);
        dashboardCriarGraficoDVC("chart-dashboard-bairros", "bar", dados.topBairros.map(([k]) => k), dados.topBairros.map(([, v]) => v), "Participantes");
        dashboardCriarGraficoDVC("chart-dashboard-regionais", "bar", dados.topRegionais.map(([k]) => k), dados.topRegionais.map(([, v]) => v), "Participantes");
        criarDeContagem("chart-dashboard-renda", "bar", dados.renda);
        criarDeContagem("chart-dashboard-beneficio", "doughnut", dados.programaBeneficio);
        criarDeContagem("chart-dashboard-programa", "bar", dados.programaSocial);
        criarDeContagem("chart-dashboard-composicao", "bar", dados.composicaoCasa);
    } else if (aba === "survey") {
        const labelTempo = ["Menos de 3 meses", "3 a 6 meses", "6 meses a 1 ano", "Mais de 1 ano"];
        const dadosTempo = [
            dados.tempoDvcContagem["menos_3_meses"] || 0,
            dados.tempoDvcContagem["entre_3_6_meses"] || 0,
            dados.tempoDvcContagem["entre_6_meses_1_ano"] || 0,
            dados.tempoDvcContagem["mais_1_ano"] || 0
        ];
        dashboardCriarGraficoDVC("chart-dashboard-survey-tempo", "doughnut", labelTempo, dadosTempo, "Respondentes");
    } else if (aba === "app") {
        criarDeContagem("chart-dashboard-tipo-escola", "bar", dados.tipoEscola);
        criarDeContagem("chart-dashboard-ano-serie", "bar", dados.anoSerie);
        criarDeContagem("chart-dashboard-escolar-adulto", "bar", dados.situacaoEscolarAdulto);
        criarDeContagem("chart-dashboard-financeiro", "doughnut", dados.financeiroGeral);
        dashboardCriarGraficoDVC("chart-dashboard-presencas", "bar", dados.mesesPresenca, dados.mesesPresenca.map(mes => dados.presencasPorMes[mes] || 0), "Presenças");
    }
}
window.renderizarSubAbaEspecifica = renderizarSubAbaEspecifica;

function mudarSubAbaDashboard(aba) {
    window.subAbaDashboardAtiva = ["visao", "socio", "survey", "app"].includes(aba) ? aba : "visao";

    ["visao", "socio", "survey", "app"].forEach(nomeAba => {
        const secao = document.getElementById(`sub-secao-dash-${nomeAba}`);
        const botao = document.getElementById(`btn-subaba-dash-${nomeAba}`);

        if (secao) {
            secao.classList.toggle("hidden", nomeAba !== window.subAbaDashboardAtiva);
        }

        if (botao) {
            botao.className = `flex-1 px-1 py-2 rounded-xl text-[8px] font-black uppercase leading-tight transition ${
                window.subAbaDashboardAtiva === nomeAba
                    ? "bg-white dark:bg-gray-850 text-[#990000] dark:text-red-400 shadow-sm ring-1 ring-red-100 dark:ring-red-950/50"
                    : "text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`;
        }
    });

    destruirGraficosDashboard();
    renderizarSubAbaEspecifica(window.subAbaDashboardAtiva);
}
window.mudarSubAbaDashboard = mudarSubAbaDashboard;

function renderProgressoDVC(titulo, contagem, total, legendaMap) {
    let html = `
        <div class="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm text-left text-gray-900 dark:text-gray-100">
            <p class="text-[10px] font-black uppercase text-gray-800 dark:text-gray-200 mb-3">${titulo}</p>
            <div class="space-y-3">
    `;
    
    const codigos = ["A", "B", "C", "D", "E", "F"];
    let hasData = false;
    codigos.forEach(cod => {
        const desc = legendaMap[cod];
        if (!desc) return;
        
        const count = contagem[cod] || 0;
        const pct = total ? Math.round((count / total) * 100) : 0;
        if (count > 0) hasData = true;
        
        html += `
            <div>
                <div class="flex justify-between items-center text-[9px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                    <span class="truncate pr-2">${desc}</span>
                    <span>${count} (${pct}%)</span>
                </div>
                <div class="w-full bg-gray-100 dark:bg-gray-950 h-2 rounded-full overflow-hidden">
                    <div class="bg-[#990000] h-full rounded-full transition-all duration-500" style="width: ${pct}%"></div>
                </div>
            </div>
        `;
    });
    
    if (!hasData) {
        html += `
            <p class="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase text-center py-2">Sem respostas registradas.</p>
        `;
    }
    
    html += `
            </div>
        </div>
    `;
    return html;
}

async function renderDashboardEditaisDVC() {
    const c = document.getElementById('main-content');

    if (!window.usuarioEhADM()) {
        c.innerHTML = `
            <div class="p-6 text-center bg-red-50 border border-red-200 rounded-xl">
                <p class="text-red-700 font-black text-xs uppercase">Acesso restrito ao ADM.</p>
            </div>
        `;
        return;
    }

    destruirGraficosDashboard();
    c.innerHTML = `
        <div class="bg-white border border-gray-100 rounded-2xl p-5 text-center shadow-sm">
            <i class="fa-solid fa-circle-notch fa-spin text-[#990000]"></i>
            <p class="text-[10px] font-black uppercase text-gray-400 mt-2">Carregando indicadores do painel...</p>
        </div>
    `;

    try {
        const [usuariosDashboard, pesquisas] = await Promise.all([
            window.carregarAtletasCache(),
            carregarPesquisasTrimestraisCache()
        ]);

        const usuarios = Array.isArray(usuariosDashboard) ? usuariosDashboard : [];
        const comunidade = usuarios
            .map(user => ({ ...user, email: user.email || user.id || "" }))
            .filter(user => String(user.funcao || "").trim().toLowerCase() !== "adm");

        const totalParticipantes = comunidade.length;
        const ativos = comunidade.filter(a => a.status === "Ativo").length;
        const inativos = comunidade.filter(a => a.status !== "Ativo").length;

        const atletasAtivos = comunidade.filter(user => {
            if (typeof window.usuarioEhAtletaAtivo === "function") return window.usuarioEhAtletaAtivo(user);
            return String(user.status || "").trim() === "Ativo" && dashboardVinculoDVC(user) === "Atleta";
        });
        const totalAtletasAtivos = atletasAtivos.length;
        const totalSub17 = comunidade.filter(dashboardEhSub17DVC).length;
        const totalAdultos = comunidade.filter(user => {
            const idade = dashboardIdadeDVC(user);
            return idade !== null && idade >= 18;
        }).length;
        const totalVoluntarios = comunidade.filter(user => dashboardVinculoDVC(user) === "Voluntário").length;
        const totalExAlunos = comunidade.filter(user => dashboardVinculoDVC(user) === "Ex-aluno").length;
        const totalSocioAtualizados = comunidade.filter(user => user.socioeconomicoAtualizado === true && user.socioeconomicoVersao === "2026-06-editais-v1").length;
        const pendenciasSocio = Math.max(0, totalParticipantes - totalSocioAtualizados);
        const percentualSocio = totalParticipantes ? Math.round((totalSocioAtualizados / totalParticipantes) * 100) : 0;

        const hojeId = new Date().toISOString().split("T")[0];
        const acessaramHoje = comunidade.filter(user => {
            const ultimoAcesso = user.ultimoAcesso || user.uÃšltimoAcesso || user.últimoAcesso || user.uÚltimoAcesso || "";
            return String(ultimoAcesso).startsWith(hojeId);
        }).length;
        const semAcesso7Dias = comunidade.filter(user => {
            const ultimoAcesso = user.ultimoAcesso || user.uÃšltimoAcesso || user.últimoAcesso || user.uÚltimoAcesso || "";
            if (!ultimoAcesso) return true;
            const data = new Date(ultimoAcesso);
            if (isNaN(data.getTime())) return true;
            const diffDias = Math.floor((new Date() - data) / (1000 * 60 * 60 * 24));
            return diffDias >= 7;
        }).length;

        const genero = {};
        const faixaEtaria = {};
        const racaCor = {};
        const vinculo = {};
        const bairro = {};
        const bairroLabels = {};
        const regional = {};
        const tipoEscola = {};
        const anoSerie = {};
        const situacaoEscolarAdulto = {};
        const renda = {};
        const programaBeneficio = {};
        const programaSocial = {};
        const composicaoCasa = {};
        const financeiroGeral = {};

        let sub17NaoEstuda = 0;
        let scoreTecnicoTotal = 0;
        let scoreTecnicoQtd = 0;

        comunidade.forEach(user => {
            dashboardIncrementarDVC(genero, dashboardGeneroDVC(user));
            dashboardIncrementarDVC(faixaEtaria, dashboardFaixaEtariaDVC(user));
            dashboardIncrementarDVC(racaCor, user.racaCor);
            dashboardIncrementarDVC(vinculo, dashboardVinculoDVC(user));
            const bairroNormalizado = typeof window.normalizarBairroDVC === "function"
                ? window.normalizarBairroDVC(user.bairroNormalizado || user.bairro)
                : dashboardValorDVC(user.bairroNormalizado || user.bairro).toLowerCase();
            const bairroLabel = dashboardValorDVC(user.bairro || user.bairroNormalizado);
            if (!bairroLabels[bairroNormalizado]) bairroLabels[bairroNormalizado] = bairroLabel;
            dashboardIncrementarDVC(bairro, bairroNormalizado);
            dashboardIncrementarDVC(regional, user.regional);
            dashboardIncrementarDVC(renda, user.faixaRendaFamiliar);
            dashboardIncrementarDVC(programaBeneficio, user.beneficiarioProgramaSocial);
            dashboardIncrementarDVC(programaSocial, user.programaSocial);
            dashboardIncrementarDVC(composicaoCasa, user.quantidadePessoasCasa);

            const financeiroEfetivo = typeof window.obterStatusFinanceiroEfetivo === "function"
                ? window.obterStatusFinanceiroEfetivo(user)
                : (user.financeiro || "Não informado");
            dashboardIncrementarDVC(financeiroGeral, financeiroEfetivo);

            if (dashboardEhSub17DVC(user)) {
                dashboardIncrementarDVC(tipoEscola, user.tipoEscola);
                dashboardIncrementarDVC(anoSerie, user.anoSerie);
                if (String(user.tipoEscola || "").trim().toLowerCase() === "não estuda") sub17NaoEstuda++;
            } else {
                dashboardIncrementarDVC(situacaoEscolarAdulto, user.situacaoEscolarAdulto);
            }

            if (typeof window.calcularScoreGeralDVC === "function" &&
                typeof window.usuarioTemAvaliacaoTecnicaRealDVC === "function" &&
                window.usuarioTemAvaliacaoTecnicaRealDVC(user)) {
                const score = Number(window.calcularScoreGeralDVC(user.habilidades || {}));
                if (Number.isFinite(score) && score > 0) {
                    scoreTecnicoTotal += score;
                    scoreTecnicoQtd++;
                }
            }
        });

        const mediaScoreTecnico = scoreTecnicoQtd ? (scoreTecnicoTotal / scoreTecnicoQtd).toFixed(1) : "S/D";
        const bairrosAmigaveis = Object.fromEntries(Object.entries(bairro).map(([chave, total]) => [bairroLabels[chave] || chave, total]));
        const topBairros = dashboardTopAgrupadoDVC(bairrosAmigaveis, 8, "Outros / grupos menores", 3);
        const topRegionais = dashboardTopAgrupadoDVC(regional, 8, "Outras", 1);

        const presencasPorMes = {};
        let totalEventosRecentes = 0;
        let eventos = [];

        try {
            eventos = typeof window.carregarEventosCache === "function" ? await window.carregarEventosCache() : [];
        } catch (erroEventosDashboard) {
            console.warn("Não foi possível carregar eventos no painel:", erroEventosDashboard);
        }

        eventos.slice(-20).forEach(ev => {
            const mesEvento = dashboardNomeMes(ev.data);
            const presencas = window.DVC_CACHE?.presencasPorEvento?.[ev.id]?.dados || [];
            presencasPorMes[mesEvento] = (presencasPorMes[mesEvento] || 0) + presencas.length;
            totalEventosRecentes++;
        });

        const mesesPresenca = dashboardOrdenarMeses(Object.keys(presencasPorMes));
        const totalPresencasCache = Object.values(presencasPorMes).reduce((soma, total) => soma + total, 0);
        const taxaFrequenciaMedia = totalEventosRecentes && totalAtletasAtivos
            ? `${Math.round((totalPresencasCache / (totalEventosRecentes * totalAtletasAtivos)) * 100)}%`
            : "S/D";

        const pagosPorMes = {};
        const justificadosPorMes = {};
        const mesAtualTexto = typeof window.obterMesAtualTextoFinanceiro === "function"
            ? window.obterMesAtualTextoFinanceiro()
            : new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

        comunidade.forEach(user => {
            const statusFin = typeof window.obterStatusFinanceiroEfetivo === "function"
                ? window.obterStatusFinanceiroEfetivo(user)
                : (user.financeiro || "");
            
            if (statusFin === "Em dia") {
                pagosPorMes[mesAtualTexto] = (pagosPorMes[mesAtualTexto] || 0) + 1;
            } else if (statusFin === "Justificado") {
                justificadosPorMes[mesAtualTexto] = (justificadosPorMes[mesAtualTexto] || 0) + 1;
            }
        });

        const totalPagos = financeiroGeral["Em dia"] || 0;
        const totalJustificados = financeiroGeral["Justificado"] || 0;

        const mesesFinanceiro = dashboardOrdenarMeses([
            ...new Set([
                ...Object.keys(pagosPorMes),
                ...Object.keys(justificadosPorMes)
            ])
        ]);

        let avisosAtivos = 0;
        let avaliacoesMes = 0;
        try {
            const mesAvaliacaoEquipe = window.obterMesAtualAvaliacaoTecnicaDVC?.() || "";
            const avisosCache = window.DVC_CACHE?.avisos?.dados || [];
            avisosAtivos = avisosCache.filter(window.avisoEstaAtivoDVC).length;
            const avaliacoesCache = window.DVC_CACHE?.avaliacoesEquipeTecnica?.dados || [];
            avaliacoesMes = avaliacoesCache.filter(av => av.mes === mesAvaliacaoEquipe).length;
        } catch (e) {
            console.warn("Erro ao ler avisos/avaliações:", e);
        }

        // 2. Cálculos de "Pesquisa Trimestral" (Survey)
        const totalPesquisas = pesquisas.length;
        const totalImpacto = pesquisas.filter(p => p.pesquisaCompletaImpacto === true).length;
        const totalImpactoAdulto = pesquisas.filter(p => p.pesquisaCompletaImpacto === true && p.tipoRespondente === "adulto").length;
        const totalEntrada = pesquisas.filter(p => p.pesquisaCompletaImpacto === false).length;
        const percentualEntrada = totalPesquisas ? Math.round((totalEntrada / totalPesquisas) * 100) : 0;

        const tempoDvcContagem = {
            "menos_3_meses": 0,
            "entre_3_6_meses": 0,
            "entre_6_meses_1_ano": 0,
            "mais_1_ano": 0
        };
        pesquisas.forEach(p => {
            if (p.tempoDvc) {
                tempoDvcContagem[p.tempoDvc] = (tempoDvcContagem[p.tempoDvc] || 0) + 1;
            }
        });

        // Contagens de opções para respostas da pesquisa
        const contagemImpacto = {
            organizacao: {},
            pertencimento: {},
            convivencia: {},
            objetivo: {},
            treinos: {},
            evolucao: {}
        };

        const contagemEntrada = {
            motivos: {},
            expectativas: {},
            acolhimento: {}
        };

        pesquisas.forEach(p => {
            const resp = p.respostas || {};
            if (p.pesquisaCompletaImpacto) {
                // Organização
                const org = resp.organizacaoCompromisso || resp.organizacaoAdulto || "";
                if (org) contagemImpacto.organizacao[org] = (contagemImpacto.organizacao[org] || 0) + 1;

                // Pertencimento
                const pert = resp.espacoSeguroPertencimento || resp.convivenciaPertencimentoAdulto || "";
                if (pert) contagemImpacto.pertencimento[pert] = (contagemImpacto.pertencimento[pert] || 0) + 1;

                // Convivência
                const conv = resp.convivenciaOutro || resp.convivenciaPertencimentoAdulto || "";
                if (conv) contagemImpacto.convivencia[conv] = (contagemImpacto.convivencia[conv] || 0) + 1;

                // Objetivo
                const obj = resp.objetivoProjeto || resp.objetivoAdulto || "";
                if (obj) contagemImpacto.objetivo[obj] = (contagemImpacto.objetivo[obj] || 0) + 1;

                // Treinos
                const trn = resp.qualidadeTreinosAdulto || "";
                if (trn) contagemImpacto.treinos[trn] = (contagemImpacto.treinos[trn] || 0) + 1;

                // Evolução
                const evo = resp.percepcaoSi || resp.percepcaoPessoalAdulto || "";
                if (evo) contagemImpacto.evolucao[evo] = (contagemImpacto.evolucao[evo] || 0) + 1;
            } else {
                // Entrada
                const mot = resp.chegadaProjetoSub17Curta || resp.objetivoInicialAdultoCurta || "";
                if (mot) contagemEntrada.motivos[mot] = (contagemEntrada.motivos[mot] || 0) + 1;

                const exp = resp.expectativaSub17Curta || resp.expectativaAdultoCurta || "";
                if (exp) contagemEntrada.expectativas[exp] = (contagemEntrada.expectativas[exp] || 0) + 1;

                const aco = resp.primeiraPercepcaoSub17Curta || resp.primeiraImpressaoAdultoCurta || "";
                if (aco) contagemEntrada.acolhimento[aco] = (contagemEntrada.acolhimento[aco] || 0) + 1;
            }
        });

        // 3. Montagem do HTML com abas
        const headerHtml = `
            <div class="bg-gradient-to-br from-gray-950 via-gray-900 to-[#990000] text-white p-5 rounded-3xl mb-5 shadow-xl relative overflow-hidden">
                <img src="${PROJETO_ATUAL_DVC?.logoFundoEscuro || PROJETO_ATUAL_DVC?.logo || "assets/img/loki2.webp"}" class="absolute -right-10 -bottom-12 w-48 h-48 opacity-10 object-contain">
                <div class="relative z-10">
                    <p class="text-[8px] font-black uppercase text-white/60">Painel administrativo</p>
                    <h3 class="text-xl font-black uppercase tracking-wide leading-none mt-1">Indicadores DVC</h3>
                    <p class="text-[9px] font-bold text-white/60 mt-2 uppercase">Gestão, editais e prestação de contas coletiva</p>
                </div>
            </div>
            
            <div class="bg-gray-100 dark:bg-gray-950 border border-gray-200/50 dark:border-gray-850 rounded-2xl p-1 mb-4 flex gap-1 sticky top-[58px] z-20 backdrop-blur-md shadow-sm">
                <button id="btn-subaba-dash-visao" onclick="window.mudarSubAbaDashboard('visao')" class="flex-1 px-1 py-2 rounded-xl text-[8px] font-black uppercase leading-tight transition">
                    Visão Geral
                </button>
                <button id="btn-subaba-dash-socio" onclick="window.mudarSubAbaDashboard('socio')" class="flex-1 px-1 py-2 rounded-xl text-[8px] font-black uppercase leading-tight transition">
                    Socioeconômico
                </button>
                <button id="btn-subaba-dash-survey" onclick="window.mudarSubAbaDashboard('survey')" class="flex-1 px-1 py-2 rounded-xl text-[8px] font-black uppercase leading-tight transition">
                    Pesquisa Trimestral
                </button>
                <button id="btn-subaba-dash-app" onclick="window.mudarSubAbaDashboard('app')" class="flex-1 px-1 py-2 rounded-xl text-[8px] font-black uppercase leading-tight transition">
                    Indicadores do App
                </button>
            </div>
        `;

        const visaoHtml = `
            <div id="sub-secao-dash-visao" class="space-y-4">
                <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                    ${dashboardCardDVC("Alunos Ativos", ativos, "Elegíveis no projeto", "text-green-600")}
                    ${dashboardCardDVC("Alunos Inativos", inativos, "Afastados temporariamente", "text-red-600")}
                    ${dashboardCardDVC("Acessaram Hoje", acessaramHoje, "Usuários únicos", "text-indigo-600")}
                    ${dashboardCardDVC("Sem acesso 7 dias", semAcesso7Dias, "Precisam de contato", "text-red-700")}
                    ${dashboardCardDVC("Pagamentos", totalPagos, "Mês atual em dia", "text-blue-600")}
                    ${dashboardCardDVC("Justificados", totalJustificados, "Mês atual justificado", "text-yellow-600")}
                    ${dashboardCardDVC("Avisos ativos", avisosAtivos, "Mural ativo", "text-[#990000]")}
                    ${dashboardCardDVC("Avaliações equipe", avaliacoesMes, "Realizadas no mês", "text-indigo-600")}
                </div>

                <div class="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm text-gray-900 dark:text-gray-100">
                    <p class="text-[10px] font-black text-gray-600 dark:text-gray-300 uppercase mb-3">Alunos ativos x inativos</p>
                    <div class="h-48"><canvas id="chart-status-alunos"></canvas></div>
                </div>

                <div class="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm text-gray-900 dark:text-gray-100">
                    <p class="text-[10px] font-black text-gray-600 dark:text-gray-300 uppercase mb-3">Presenças registradas por mês</p>
                    <div class="h-56"><canvas id="chart-presencas-mes"></canvas></div>
                </div>

                <div class="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm text-gray-900 dark:text-gray-100">
                    <p class="text-[10px] font-black text-gray-600 dark:text-gray-300 uppercase mb-3">Pagamentos x justificativas por mês</p>
                    <div class="h-56"><canvas id="chart-financeiro-mes"></canvas></div>
                </div>

                <div class="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm text-gray-900 dark:text-gray-100">
                    <p class="text-[10px] font-black text-gray-600 dark:text-gray-300 uppercase mb-3">Comparativo geral financeiro</p>
                    <div class="h-48"><canvas id="chart-financeiro-geral"></canvas></div>
                </div>
            </div>
        `;

        const socioHtml = `
            <div id="sub-secao-dash-socio" class="space-y-4 hidden">
                <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                    ${dashboardCardDVC("Participantes", totalParticipantes, "Cadastros não ADM")}
                    ${dashboardCardDVC("Atletas ativos", totalAtletasAtivos, "Elegíveis no projeto", "text-green-700")}
                    ${dashboardCardDVC("Sub17", totalSub17, "Menores ou categoria Sub17", "text-indigo-700")}
                    ${dashboardCardDVC("Adultos", totalAdultos, "18 anos ou mais", "text-gray-800")}
                    ${dashboardCardDVC("Voluntários", totalVoluntarios, "Vínculo declarado", "text-blue-700")}
                    ${dashboardCardDVC("Ex-alunos", totalExAlunos, "Vínculo declarado", "text-purple-700")}
                    ${dashboardCardDVC("Dados updated", `${percentualSocio}%`, `${totalSocioAtualizados} pessoa(s)`, "text-green-700")}
                    ${dashboardCardDVC("Pendências", pendenciasSocio, "Atualização socioeconômica", pendenciasSocio ? "text-red-700" : "text-green-700")}
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div class="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm text-gray-900 dark:text-gray-100"><p class="text-[10px] font-black uppercase text-gray-800 dark:text-gray-200 mb-3">Distribuição por gênero</p><div class="h-56"><canvas id="chart-dashboard-genero"></canvas></div></div>
                    <div class="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm text-gray-900 dark:text-gray-100"><p class="text-[10px] font-black uppercase text-gray-800 dark:text-gray-200 mb-3">Faixa etária</p><div class="h-56"><canvas id="chart-dashboard-faixa-etaria"></canvas></div></div>
                    <div class="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm text-gray-900 dark:text-gray-100"><p class="text-[10px] font-black uppercase text-gray-800 dark:text-gray-200 mb-3">Raça/cor autodeclarada</p><div class="h-64"><canvas id="chart-dashboard-raca-cor"></canvas></div></div>
                    <div class="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm text-gray-900 dark:text-gray-100"><p class="text-[10px] font-black uppercase text-gray-800 dark:text-gray-200 mb-3">Vínculo com o DVC</p><div class="h-56"><canvas id="chart-dashboard-vinculo"></canvas></div></div>
                    <div class="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm text-gray-900 dark:text-gray-100"><p class="text-[10px] font-black uppercase text-gray-800 dark:text-gray-200 mb-3">Top bairros</p><div class="h-72"><canvas id="chart-dashboard-bairros"></canvas></div></div>
                    <div class="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm text-gray-900 dark:text-gray-100"><p class="text-[10px] font-black uppercase text-gray-800 dark:text-gray-200 mb-3">Regionais</p><div class="h-72"><canvas id="chart-dashboard-regionais"></canvas></div></div>
                    <div class="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm text-gray-900 dark:text-gray-100"><p class="text-[10px] font-black uppercase text-gray-800 dark:text-gray-200 mb-3">Faixa de renda familiar</p><div class="h-64"><canvas id="chart-dashboard-renda"></canvas></div></div>
                    <div class="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm text-gray-900 dark:text-gray-100"><p class="text-[10px] font-black uppercase text-gray-800 dark:text-gray-200 mb-3">Benefício social</p><div class="h-56"><canvas id="chart-dashboard-beneficio"></canvas></div></div>
                    <div class="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm text-gray-900 dark:text-gray-100"><p class="text-[10px] font-black uppercase text-gray-800 dark:text-gray-200 mb-3">Programa social declarado</p><div class="h-64"><canvas id="chart-dashboard-programa"></canvas></div></div>
                    <div class="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm text-gray-900 dark:text-gray-100"><p class="text-[10px] font-black uppercase text-gray-800 dark:text-gray-200 mb-3">Composição familiar</p><div class="h-56"><canvas id="chart-dashboard-composicao"></canvas></div></div>
                </div>
            </div>
        `;

        const legendaOrganizacao = {
            "A": "Muito boa / Comprometido",
            "B": "Boa, mas com melhorias / Tem melhorado",
            "C": "Regular, falta clareza / Tem dificuldade",
            "D": "Precisa melhorar / Não mudou"
        };
        const legendaPertencimento = {
            "A": "Sim, acolhido e pertencente",
            "B": "Sim, mas melhorar integração",
            "C": "Às vezes sim / às vezes distante",
            "D": "Não me sinto integrado"
        };
        const legendaConvivencia = {
            "A": "Melhorei muito em ouvir/respeitar",
            "B": "Tento conviver, mas perco paciência",
            "C": "Dificuldade / Tentando melhorar",
            "D": "Sem mudanças percebidas"
        };
        const legendaObjetivo = {
            "A": "Melhorar tecnicamente no vôlei",
            "B": "Fazer amigos / Rotina saudável",
            "C": "Participar de treinos/competições",
            "D": "Desenvolver-se / Ajudar projeto",
            "E": "Espaço seguro / Evolução integral"
        };
        const legendaTreinos = {
            "A": "Bem conduzidos e ajudam evolução",
            "B": "Bons, mas variar mais",
            "C": "Gosto, mas falta orientação técnica",
            "D": "Sem evolução percebida"
        };
        const legendaEvolucao = {
            "A": "Disciplina/Compromisso / Focado",
            "B": "Saúde física e mental / Melhorei",
            "C": "Amizades/Convivência / Dificuldade",
            "D": "Evolução técnica / Sem diferença",
            "E": "Pertencimento",
            "F": "Sem contribuição clara"
        };

        const legendaMotivos = {
            "A": "Melhorar/Aprender vôlei",
            "B": "Fazer amigos / Rotina saudável",
            "C": "Espaço seguro / Treinos e jogos",
            "D": "Participar de competições / Comunidade",
            "E": "Convidado / Contribuir com projeto"
        };
        const legendaExpectativas = {
            "A": "Evoluir no esporte / Organização",
            "B": "Me sentir parte de um grupo / Evolução",
            "C": "Melhorar disciplina / Convivência",
            "D": "Lazer e convivência / Oportunidades",
            "E": "Conhecendo o projeto"
        };
        const legendaAcolhimento = {
            "A": "Acolhido e animado / Muito positiva",
            "B": "Tímido, mas com vontade / Adaptando",
            "C": "Adaptando aos locais / Dúvidas",
            "D": "Não me sinto pertencente / Sem avaliação"
        };

        const surveyHtml = `
            <div id="sub-secao-dash-survey" class="space-y-4 hidden">
                <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                    ${dashboardCardDVC("Total Respostas", totalPesquisas, "No trimestre atual")}
                    ${dashboardCardDVC("Pesquisa Impacto", totalImpacto, "3 meses ou mais no DVC", "text-green-700")}
                    ${dashboardCardDVC("Pesquisa Entrada", totalEntrada, "Menos de 3 meses", "text-blue-700")}
                    ${dashboardCardDVC("Novos no trimestre", `${percentualEntrada}%`, "Entraram recentemente", "text-indigo-700")}
                </div>

                <div class="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 rounded-xl shadow-sm text-gray-900 dark:text-gray-100">
                    <p class="text-[10px] font-black text-gray-600 dark:text-gray-300 uppercase mb-3">Tempo de participação dos respondentes</p>
                    <div class="h-56"><canvas id="chart-dashboard-survey-tempo"></canvas></div>
                </div>

                <div class="pt-2">
                    <p class="text-[10px] font-black uppercase text-[#990000] dark:text-red-400 mb-1">Pesquisas Completas (Participação >= 3 meses)</p>
                    <p class="text-[9px] font-semibold text-gray-500 dark:text-gray-400 mb-3">Resultados agregados das respostas de impacto (Total: ${totalImpacto}).</p>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        ${renderProgressoDVC("Organização e compromisso", contagemImpacto.organizacao, totalImpacto, legendaOrganizacao)}
                        ${renderProgressoDVC("Pertencimento e segurança", contagemImpacto.pertencimento, totalImpacto, legendaPertencimento)}
                        ${renderProgressoDVC("Convivência com o group", contagemImpacto.convivencia, totalImpacto, legendaConvivencia)}
                        ${renderProgressoDVC("Principal objetivo no DVC", contagemImpacto.objetivo, totalImpacto, legendaObjetivo)}
                        ${renderProgressoDVC("Avaliação de treinos (Adultos)", contagemImpacto.treinos, totalImpactoAdulto, legendaTreinos)}
                        ${renderProgressoDVC("Percepção de evolução", contagemImpacto.evolucao, totalImpacto, legendaEvolucao)}
                    </div>
                </div>

                <div class="pt-4">
                    <p class="text-[10px] font-black uppercase text-[#990000] dark:text-red-400 mb-1">Pesquisas de Entrada (Participação < 3 meses)</p>
                    <p class="text-[9px] font-semibold text-gray-500 dark:text-gray-400 mb-3">Resultados agregados dos novos participantes (Total: ${totalEntrada}).</p>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        ${renderProgressoDVC("Motivo da chegada", contagemEntrada.motivos, totalEntrada, legendaMotivos)}
                        ${renderProgressoDVC("Expectativas para os próximos meses", contagemEntrada.expectativas, totalEntrada, legendaExpectativas)}
                        ${renderProgressoDVC("Primeiras impressões e acolhimento", contagemEntrada.acolhimento, totalEntrada, legendaAcolhimento)}
                    </div>
                </div>
            </div>
        `;

        const appHtml = `
            <div id="sub-secao-dash-app" class="space-y-4 hidden">
                <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                    ${dashboardCardDVC("Sub17 sem estudo", sub17NaoEstuda, "Declararam não estuda", sub17NaoEstuda ? "text-yellow-700" : "text-green-700")}
                    ${dashboardCardDVC("Score médio", mediaScoreTecnico, "Atletas com avaliação", "text-indigo-700")}
                    ${dashboardCardDVC("Frequência média", taxaFrequenciaMedia, "Com dados em cache", "text-blue-700")}
                    ${dashboardCardDVC("Acessaram hoje", acessaramHoje, `${semAcesso7Dias} sem acesso 7 dias`, "text-gray-800")}
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div class="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm text-gray-900 dark:text-gray-100"><p class="text-[10px] font-black uppercase text-gray-800 dark:text-gray-200 mb-3">Tipo de escola - Sub17</p><div class="h-64"><canvas id="chart-dashboard-tipo-escola"></canvas></div></div>
                    <div class="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm text-gray-900 dark:text-gray-100"><p class="text-[10px] font-black uppercase text-gray-800 dark:text-gray-200 mb-3">Ano/Série - Sub17</p><div class="h-64"><canvas id="chart-dashboard-ano-serie"></canvas></div></div>
                    <div class="md:col-span-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm text-gray-900 dark:text-gray-100"><p class="text-[10px] font-black uppercase text-gray-800 dark:text-gray-200 mb-3">Situação escolar - adultos</p><div class="h-64"><canvas id="chart-dashboard-escolar-adulto"></canvas></div></div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div class="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm text-gray-900 dark:text-gray-100"><p class="text-[10px] font-black uppercase text-gray-800 dark:text-gray-200 mb-3">Status financeiro geral</p><div class="h-56"><canvas id="chart-dashboard-financeiro"></canvas></div></div>
                    <div class="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm text-gray-900 dark:text-gray-100"><p class="text-[10px] font-black uppercase text-gray-800 dark:text-gray-200 mb-3">Presenças em cache por mês</p><div class="h-56"><canvas id="chart-dashboard-presencas"></canvas></div></div>
                </div>
            </div>
        `;

        c.innerHTML = headerHtml + visaoHtml + socioHtml + surveyHtml + appHtml;

        window.dashboardDadosCalculados = {
            ativos,
            inativos,
            mesesPresenca,
            presencasPorMes,
            mesesFinanceiro,
            pagosPorMes,
            justificadosPorMes,
            totalPagos,
            totalJustificados,
            genero,
            faixaEtaria,
            racaCor,
            vinculo,
            topBairros,
            topRegionais,
            renda,
            programaBeneficio,
            programaSocial,
            composicaoCasa,
            tempoDvcContagem,
            tipoEscola,
            anoSerie,
            situacaoEscolarAdulto,
            financeiroGeral
        };

        mudarSubAbaDashboard(window.subAbaDashboardAtiva || "visao");

    } catch (e) {
        console.error("Erro ao carregar dashboard:", e);
        c.innerHTML = `
            <div class="bg-red-50 dark:bg-red-955 border border-red-200 dark:border-red-900/50 rounded-xl p-4 text-center">
                <p class="text-xs font-bold text-red-700 dark:text-red-400">Não foi possível carregar o painel agora.</p>
            </div>
        `;
    }
}

// 8. renderAdmin
async function renderAdmin() {
    const c = document.getElementById('main-content');

    if (!window.usuarioEhADM()) {
        c.innerHTML = `
            <div class="p-6 text-center bg-red-50 dark:bg-red-955 border border-red-200 dark:border-red-900/50 rounded-xl">
                <p class="text-red-700 dark:text-red-400 font-black text-xs uppercase">
                    Acesso restrito ao ADM.
                </p>
            </div>
        `;
        return;
    }

    window.limparComprovantesAntigosPainel();
    window.verificarViradaDeMes(); 

    const projetoNomeGestao = PROJETO_ATUAL_DVC?.nome || "DVC";
    const projetoLogoGestao = PROJETO_ATUAL_DVC?.logo || "assets/img/loki2.webp";

    c.innerHTML = `
        <div class="bg-gradient-to-br from-gray-950 via-gray-900 to-[#990000] text-white p-5 rounded-3xl mb-5 shadow-xl relative overflow-hidden">
            <div class="absolute -right-10 -bottom-12 opacity-10">
                <img src="${projetoLogoGestao}" class="w-48 h-48 object-contain">
            </div>

            <div class="relative z-10">
                <div class="flex items-center gap-3 mb-4">
                    <div class="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center p-2">
                        <img src="${projetoLogoGestao}" class="w-full h-full object-contain">
                    </div>

                    <div class="flex-1">
                        <p class="text-[8px] font-black uppercase text-white/60">
                            Painel administrativo
                        </p>

                        <h3 class="text-xl font-black uppercase tracking-wide leading-none">
                            Gestão ${projetoNomeGestao}
                        </h3>

                        <p class="text-[9px] font-bold text-white/60 mt-1 uppercase">
                            Atletas, financeiro, avaliações e acompanhamento
                        </p>
                    </div>

                    <button onclick="forcarAtualizacaoDados('gestao')" class="w-9 h-9 rounded-xl bg-white/10 border border-white/20 text-white flex items-center justify-center shrink-0" title="Sincronizar">
                        <i class="fa-solid fa-rotate text-xs"></i>
                    </button>
                </div>

                <div class="grid grid-cols-3 gap-2 mt-4">
                    <button 
                        onclick="irParaBlocoGestao('box-novos-cadastros')" 
                        class="bg-white/10 border border-white/10 rounded-2xl p-2 text-center active:scale-95 transition">
                        <i class="fa-solid fa-user-plus text-white text-sm mb-1"></i>
                        <p class="text-[8px] font-black uppercase text-white/70">Novos</p>
                    </button>

                    <button 
                        onclick="abrirPendenciasFinanceiras()" 
                        class="bg-white/10 border border-white/10 rounded-2xl p-2 text-center active:scale-95 transition">
                        <i class="fa-solid fa-file-invoice-dollar text-white text-sm mb-1"></i>
                        <p class="text-[8px] font-black uppercase text-white/70">Pendências</p>
                    </button>

                    <button 
                        onclick="irParaBlocoGestao('admin-users-list')"
                        class="bg-white/10 border border-white/10 rounded-2xl p-2 text-center active:scale-95 transition">
                        <i class="fa-solid fa-users text-white text-sm mb-1"></i>
                        <p class="text-[8px] font-black uppercase text-white/70">Atletas</p>
                    </button>
                </div>
            </div>
        </div>

        <div id="gestao-resumo" class="grid grid-cols-2 gap-2 mb-5">
            <div class="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm text-center text-gray-900 dark:text-gray-100">
                <p class="text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase">
                    Ativos
                </p>
                <p id="gestao-count-ativos" class="text-2xl font-black text-green-600 dark:text-green-450">
                    -
                </p>
            </div>

            <div class="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm text-center text-gray-900 dark:text-gray-100">
                <p class="text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase">
                    Novos
                </p>
                <p id="gestao-count-novos" class="text-2xl font-black text-[#990000] dark:text-red-450">
                    -
                </p>
            </div>

            <div class="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm text-center text-gray-900 dark:text-gray-100">
                <p class="text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase">
                    Inadimplentes
                </p>
                <p id="gestao-count-inadimplentes" class="text-2xl font-black text-red-700 dark:text-red-450">
                    -
                </p>
            </div>

            <div class="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm text-center text-gray-900 dark:text-gray-100">
                <p class="text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase">
                    Justificados
                </p>
                <p id="gestao-count-justificados" class="text-2xl font-black text-blue-600 dark:text-blue-450">
                    -
                </p>
            </div>
        </div>

        <div id="box-novos-cadastros" class="mb-4"></div>
        <div id="box-autoavaliacoes-pendentes" class="mb-4"></div>
        <div id="box-gestao-avisos-dvc" class="mb-4"></div>
        <div id="box-avaliacoes-equipe-tecnica" class="mb-4"></div>

        <div class="grid grid-cols-2 gap-2 mb-5">
            <button 
                onclick="baixarRelatorioPresencasDVC(this)" 
                class="bg-blue-600 text-white px-3 py-3 rounded-2xl font-black text-[10px] uppercase shadow-sm">
                <i class="fa-solid fa-file-excel mr-1"></i> Presenças
            </button>

            <button 
                onclick="baixarRelatorioAtletasDVC(this)" 
                class="bg-green-600 text-white px-3 py-3 rounded-2xl font-black text-[10px] uppercase shadow-sm">
                <i class="fa-solid fa-users mr-1"></i> Atletas
            </button>
        </div>

        <div id="box-pendencias-financeiras" class="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm mb-5 text-gray-900 dark:text-gray-100">
            <div class="flex justify-between items-center mb-3 gap-3">
                <div>
                    <p class="text-[10px] font-black text-[#990000] dark:text-red-400 uppercase">
                        Pendências Financeiras
                    </p>
                    <p class="text-[8px] font-bold text-gray-400 dark:text-gray-500 uppercase">
                        Comprovantes, justificativas e carências aguardando análise
                    </p>
                </div>
                <button 
                    onclick="abrirPendenciasFinanceiras()" 
                    class="bg-[#990000] text-white px-3 py-2 rounded-xl text-[9px] font-black uppercase shrink-0">
                    Ver
                </button>
            </div>
            <div class="grid grid-cols-2 gap-2">
                <div class="bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30 rounded-xl p-3 text-center">
                    <p id="count-comprovantes-pendentes" class="text-2xl font-black text-green-700 dark:text-green-400">-</p>
                    <p class="text-[8px] font-bold text-green-800 dark:text-green-500 uppercase">
                        Comprovantes
                    </p>
                </div>

                <div class="bg-blue-50 dark:bg-blue-955/20 border border-blue-100 dark:border-blue-900/30 rounded-xl p-3 text-center">
                    <p id="count-justificativas-pendentes" class="text-2xl font-black text-blue-700 dark:text-blue-400">-</p>
                    <p class="text-[8px] font-bold text-blue-800 dark:text-blue-500 uppercase">
                        Justificativas
                    </p>
                </div>
            </div>
        </div>
        <div class="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm mb-5 text-gray-900 dark:text-gray-100">
            <div class="flex items-center gap-3 mb-4">
                <div class="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50 flex items-center justify-center">
                    <i class="fa-solid fa-filter text-[#990000] dark:text-red-400"></i>
                </div>

                <div>
                    <p class="text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase">
                        Filtros
                    </p>
                    <p class="text-xs font-black text-gray-800 dark:text-gray-250 uppercase">
                        Localizar atletas
                    </p>
                </div>
            </div>

            <div class="space-y-2">
                <input 
                    type="text" 
                    id="admin-search" 
                    oninput="buscarGestaoDVC()" 
                    placeholder="Pesquisar atleta..." 
                    class="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl text-xs outline-none bg-gray-50 dark:bg-gray-950 font-semibold text-gray-900 dark:text-gray-100">

                <div class="grid grid-cols-2 gap-2">
                    <select id="admin-filter-role" onchange="filterAdminList()" class="p-3 border border-gray-200 dark:border-gray-700 rounded-xl text-[10px] font-bold uppercase bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
                        <option value="todos">Cargos</option>
                        <option value="Membro">Membros</option>
                        <option value="Auxiliar">Auxiliares</option>
                        <option value="Treinador">Treinadores</option>
                        <option value="ADM">ADMs</option>
                    </select>

                    <select id="admin-filter-sex" onchange="filterAdminList()" class="p-3 border border-gray-200 dark:border-gray-700 rounded-xl text-[10px] font-bold uppercase bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
                        <option value="todos">Sexos</option>
                        <option value="M">Masc</option>
                        <option value="F">Fem</option>
                    </select>

                    <select id="admin-filter-status" onchange="filterAdminList()" class="p-3 border border-gray-200 dark:border-gray-700 rounded-xl text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400 bg-gray-50 dark:bg-gray-955">
                        <option value="todos">Status</option>
                        <option value="Ativo">Ativos</option>
                        <option value="Inativo">Inativos</option>
                    </select>

                    <select id="admin-filter-finance" onchange="filterAdminList()" class="p-3 border border-gray-200 dark:border-gray-700 rounded-xl text-[10px] font-bold uppercase text-green-600 dark:text-green-400 bg-gray-50 dark:bg-gray-955">
                        <option value="todos">Financ.</option>
                        <option value="Em dia">Em dia</option>
                        <option value="Inadimplente">Inadimpl.</option>
                        <option value="Justificado">Justificado</option>
                        <option value="${STATUS_FINANCEIRO_CARENCIA}">Carência</option>
                        <option value="Em carência">Em carência</option>
                    </select>

                    <select id="admin-filter-month" onchange="filterAdminList()" class="col-span-2 p-3 border border-gray-200 dark:border-gray-700 rounded-xl text-[10px] font-bold uppercase text-red-600 dark:text-red-400 bg-gray-50 dark:bg-gray-955">
                        ${gerarOpcoesMesesGestao()}
                    </select>
                </div>
            </div>
        </div>
        <div id="admin-users-list" class="space-y-3"></div>
    `;
    window.filterAdminList();
    window.carregarResumoPendenciasFinanceiras();

    setTimeout(() => {
        atualizarResumoGestao();
        window.carregarResumoNovosCadastros();
        window.renderAutoAvaliacoesPendentes();
        window.renderGestaoAvisosDVC();
        window.renderPainelAvaliacoesEquipeTecnica();
    }, 100);
}

// Bind all to window
window.destruirGraficosDashboard = destruirGraficosDashboard;
window.dashboardNomeMes = dashboardNomeMes;
window.dashboardOrdenarMeses = dashboardOrdenarMeses;
window.atualizarResumoGestao = atualizarResumoGestao;
window.gerarOpcoesMesesGestao = gerarOpcoesMesesGestao;
window.irParaBlocoGestao = irParaBlocoGestao;
window.renderDashboardEditaisDVC = renderDashboardEditaisDVC;
window.renderDashboard = renderDashboardEditaisDVC;
window.renderAdmin = renderAdmin;

// Stage 10B additions
function usuarioTemRegistroFinanceiroNoMes(user = {}, mes) {
    const comprovantes = Array.isArray(user.comprovantesEnviados) ? user.comprovantesEnviados : [];
    const justificativas = Array.isArray(user.justificativasEnviadas) ? user.justificativasEnviadas : [];
    return comprovantes.includes(mes) || justificativas.includes(mes);
}

let timeoutBuscaGestaoDVC = null;
function buscarGestaoDVC() {
    clearTimeout(timeoutBuscaGestaoDVC);
    timeoutBuscaGestaoDVC = setTimeout(() => {
        filterAdminList();
    }, 250);
}

function toggleAcoesGestao(advId) {
    const bloco = document.getElementById(`acoes-gestao-${advId}`);
    if (!bloco) return;
    bloco.classList.toggle("hidden");
}

async function filterAdminList() {
    const listDiv = document.getElementById('admin-users-list');
    if (!listDiv || window.__abaAtualDVC !== "admin") return;
    const search = window.normalizarBuscaDVC(document.getElementById('admin-search')?.value || "");
    const role = document.getElementById('admin-filter-role').value;
    const sex = document.getElementById('admin-filter-sex').value;
    const statusF = document.getElementById('admin-filter-status').value;
    const financeF = document.getElementById('admin-filter-finance').value;
    const monthF = document.getElementById('admin-filter-month').value;
    
    let baseUsers = window.AppCache?.atletas || window.DVC_CACHE?.users?.dados;
    if (!baseUsers || baseUsers.length === 0) {
        baseUsers = await window.carregarAtletasCache();
    }
    let users = [...baseUsers];
    if (!document.getElementById('admin-users-list') || window.__abaAtualDVC !== "admin") return;
    users.sort((a,b) => (a.nome || "").localeCompare(b.nome || ""));

    let htmlListaGestao = "";
    let totalGestaoRenderizados = 0;
    
    const isAuxiliar = window.currentUserData?.funcao === "Auxiliar";

    users.forEach(user => {
        if(user.email === "gabriel0barbosa0@gmail.com") return;
        
        const financeiroEfetivo = window.obterStatusFinanceiroEfetivo(user);
        const statusEfetivo = window.usuarioTemStatusConvocavel(user) ? "Ativo" : (user.status || "Sem status");
        const textoBusca = window.normalizarBuscaDVC([
            user.nome,
            user.email,
            user.telefone,
            user.tel,
            user.responsavelNome,
            user.responsavelTel,
            user.responsavelTelefone,
            user.respNome,
            user.respTel,
            user.funcao,
            financeiroEfetivo,
            statusEfetivo
        ].join(" "));
        const matchesSearch = !search || textoBusca.includes(search);
        const matchesRole = role === "todos" || window.normalizarFuncaoTecnica(user.funcao) === window.normalizarFuncaoTecnica(role);
        const matchesSex = sex === "todos" || user.sexo === sex;
        const matchesStatus = statusF === "todos" || window.normalizarBuscaDVC(statusEfetivo) === window.normalizarBuscaDVC(statusF);
        const matchesFinance = financeF === "todos" || window.normalizarBuscaDVC(financeiroEfetivo) === window.normalizarBuscaDVC(financeF);
        const matchesMonth = monthF === "todos" || usuarioTemRegistroFinanceiroNoMes(user, monthF);

        if(matchesSearch && matchesRole && matchesSex && matchesStatus && matchesFinance && matchesMonth) {

            // --- LÓGICA DAS CORES POR SEXO (INTEGRADO) ---
            let corDaFaixa = "border-gray-200"; 
            if (user.sexo === "F") corDaFaixa = "border-pink-500";
            else if (user.sexo === "M") corDaFaixa = "border-blue-500";
            if (financeiroEfetivo === "Justificado" || financeiroEfetivo === STATUS_FINANCEIRO_CARENCIA) corDaFaixa = "border-yellow-400";

            let advs = user.advertencias || [];
            let advCount = advs.length;
            let isSuspenso = advCount >= 3;
            let advId = user.email.replace(/[^a-zA-Z0-9]/g, ''); 
            
            let advIcons = "";
            for(let i=1; i<=3; i++) {
                advIcons += i <= advCount 
                    ? '<i class="fa-solid fa-square-xmark text-red-600 mr-1"></i>' 
                    : '<i class="fa-regular fa-square text-gray-300 mr-1"></i>';
            }

            window.habilidadesCache = window.habilidadesCache || {};
            window.habilidadesCache[user.email] = user.habilidades || {};
            const nomeSeguro = (user.nome || "Sem nome").replace(new RegExp("'", "g"), "");
            const emailSeguro = user.email || "";
            const funcaoVoleiAtual = user.funcaoVolei || "formacao";
            const nomeFuncaoQuadra = window.getNomeFuncaoVoleiDVC(funcaoVoleiAtual);

            const scoreGeralAdmin = window.calcularScoreGeralDVC(user.habilidades || {});
            const financeiroCor = financeiroEfetivo === "Em dia"
                ? "text-green-700 bg-green-50 border-green-100"
                : financeiroEfetivo === "Justificado"
                    ? "text-blue-700 bg-blue-50 border-blue-100"
                    : financeiroEfetivo === STATUS_FINANCEIRO_CARENCIA
                        ? "text-amber-700 bg-amber-50 border-amber-100"
                        : "text-red-700 bg-red-50 border-red-100";

            const statusCor = statusEfetivo === "Ativo"
                ? "text-green-700 bg-green-50 border-green-100"
                : "text-gray-600 bg-gray-50 border-gray-200";

            const sexoLabel = user.sexo === "F" ? "Feminino" : user.sexo === "M" ? "Masculino" : "Sexo não informado";
            const sexoCor = user.sexo === "F"
                ? "text-pink-700 bg-pink-50 border-pink-100"
                : user.sexo === "M"
                    ? "text-blue-700 bg-blue-50 border-blue-100"
                    : "text-gray-500 bg-gray-50 border-gray-200";

            const html = `
<div class="bg-white border border-gray-200 mb-4 rounded-2xl shadow-sm overflow-hidden border-l-4 ${corDaFaixa}">
    
    <div class="p-4">
        <div class="flex items-start justify-between gap-3 mb-3">
            <div class="min-w-0">
                <p class="text-sm font-black uppercase text-gray-900 truncate">
                    ${user.nome || "Sem nome"}
                </p>

                <p class="text-[9px] font-bold text-gray-400 uppercase mt-1">
                    ${user.funcao || "Membro"} • ${statusEfetivo}
                </p>

                <p class="text-[8px] text-gray-400 font-semibold mt-1 truncate">
                    ${emailSeguro}
                </p>
            </div>

            <div class="flex flex-col items-end gap-1 shrink-0">
                ${user.cadastroStatus === "Novo" ? `
                    <span class="bg-[#990000] text-white text-[8px] font-black px-2 py-1 rounded-full uppercase">
                        Novo
                    </span>
                ` : ""}

                <span class="${sexoCor} border text-[8px] font-black px-2 py-1 rounded-full uppercase">
                    ${sexoLabel}
                </span>
            </div>
        </div>

        <div class="grid grid-cols-2 gap-2 mb-3">
            <div class="${financeiroCor} border rounded-xl p-3">
                <p class="text-[8px] font-black uppercase opacity-70">
                    Financeiro
                </p>
                <p class="text-xs font-black uppercase mt-1">
                    ${financeiroEfetivo}
                </p>
            </div>

            <div class="${statusCor} border rounded-xl p-3">
                <p class="text-[8px] font-black uppercase opacity-70">
                    Status
                </p>
                <p class="text-xs font-black uppercase mt-1">
                    ${statusEfetivo}
                </p>
            </div>

            <div class="bg-gray-50 border border-gray-100 rounded-xl p-3">
                <p class="text-[8px] font-black text-gray-400 uppercase">
                    Score Geral
                </p>
                <p class="text-xs font-black text-[#990000] uppercase mt-1">
                    ${scoreGeralAdmin.toFixed(1)}
                </p>
            </div>

            <div class="bg-gray-50 border border-gray-100 rounded-xl p-3">
                <p class="text-[8px] font-black text-gray-400 uppercase">
                    Função em quadra
                </p>
                <p class="text-xs font-black text-gray-800 uppercase mt-1 truncate">
                    ${nomeFuncaoQuadra}
                </p>
            </div>
        </div>

        <div class="bg-gray-50 border border-gray-100 rounded-xl p-3 mb-3">
            <div class="flex items-center justify-between gap-2">
                <div>
                    <p class="text-[8px] font-black text-gray-400 uppercase">
                        ÚÚltimo acesso
                    </p>
                    <p class="text-[9px] font-bold text-gray-600 mt-1">
                        <i class="fa-regular fa-clock mr-1"></i>
                        ${window.formatarÚltimoAcesso(user.uÚltimoAcesso)}
                    </p>
                </div>

                <div class="text-right">
                    <p class="text-[8px] font-black text-gray-400 uppercase">
                        Penalidades
                    </p>
                    <p class="text-[12px] mt-1">
                        ${advIcons}
                    </p>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-2 gap-2">
            <button 
                onclick="abrirModalAvaliacao('${emailSeguro}', '${nomeSeguro}')"
                class="bg-[#990000] text-white py-3 rounded-xl font-black text-[9px] uppercase shadow-sm">
                <i class="fa-solid fa-chart-line mr-1"></i> Avaliar
            </button>

            <button 
                onclick="verDocs('${emailSeguro.trim()}', '${nomeSeguro}')"
                class="bg-gray-900 text-white py-3 rounded-xl font-black text-[9px] uppercase shadow-sm">
                <i class="fa-solid fa-file-invoice-dollar mr-1"></i> Contrib.
            </button>
        </div>

        <button 
            onclick="toggleAcoesGestao('${advId}')"
            class="w-full mt-2 bg-gray-100 text-gray-700 py-3 rounded-xl font-black text-[9px] uppercase border">
            <i class="fa-solid fa-sliders mr-1"></i> Mais ações
        </button>
    </div>

    <div id="acoes-gestao-${advId}" class="hidden bg-gray-50 border-t p-4">
        <p class="text-[9px] font-black text-gray-400 uppercase mb-3">
            Ações administrativas
        </p>

        <div class="grid grid-cols-2 gap-2">
            <div>
                <label class="text-[8px] font-black text-gray-400 uppercase">
                    Financeiro
                </label>
                <select 
                    onchange="atualizarFinanceiro('${emailSeguro}', this.value, this)" 
                    class="w-full mt-1 text-[10px] p-2 border rounded-xl bg-white font-bold">
                    <option value="Em dia" ${financeiroEfetivo === 'Em dia' ? 'selected' : ''}>Em dia</option>
                    <option value="Inadimplente" ${financeiroEfetivo === 'Inadimplente' ? 'selected' : ''}>Inadimplente</option>
                    <option value="Justificado" ${financeiroEfetivo === 'Justificado' ? 'selected' : ''}>Justificado</option>
                    <option value="${STATUS_FINANCEIRO_CARENCIA}" ${financeiroEfetivo === STATUS_FINANCEIRO_CARENCIA ? 'selected' : ''}>Carência</option>
                    <option value="Em carência" ${financeiroEfetivo === 'Em carência' ? 'selected' : ''}>Em carência</option>
                </select>
            </div>

            <div>
                <label class="text-[8px] font-black text-gray-400 uppercase">
                    Status
                </label>
                <select 
                    onchange="updateUser('${emailSeguro}', {status: this.value})" 
                    class="w-full mt-1 text-[10px] p-2 border rounded-xl bg-white font-bold">
                    <option value="Ativo" ${statusEfetivo === 'Ativo' ? 'selected' : ''}>Ativo</option>
                    <option value="Inativo" ${statusEfetivo === 'Inativo' ? 'selected' : ''}>Inativo</option>
                </select>
            </div>

            <div class="col-span-2">
                <label class="text-[8px] font-black text-gray-400 uppercase">
                    Cargo no aplicativo
                </label>
                <select 
                    onchange="updateUser('${emailSeguro}', {funcao: this.value})" 
                    class="w-full mt-1 text-[10px] p-2 border rounded-xl bg-white font-bold"
                    ${isAuxiliar ? "disabled" : ""}>
                    <option value="Membro" ${user.funcao === 'Membro' ? 'selected' : ''}>Membro</option>
                    <option value="Auxiliar" ${user.funcao === 'Auxiliar' ? 'selected' : ''}>Auxiliar</option>
                    <option value="Treinador" ${user.funcao === 'Treinador' ? 'selected' : ''}>Treinador</option>
                    <option value="ADM" ${user.funcao === 'ADM' ? 'selected' : ''}>ADM</option>
                </select>
            </div>

            <div class="col-span-2">
                <label class="text-[8px] font-black text-gray-400 uppercase">
                    Função em quadra
                </label>
                <select 
                    onchange="atualizarFuncaoVolei('${emailSeguro}', this.value, this)" 
                    class="w-full mt-1 text-[10px] p-2 border rounded-xl bg-white font-bold">
                    ${FUNCOES_VOLEI_DVC.map(funcao => `
                        <option value="${funcao.id}" ${funcaoVoleiAtual === funcao.id ? "selected" : ""}>
                            ${funcao.nome}
                        </option>
                    `).join('')}
                </select>
            </div>
        </div>

        <button 
            onclick="adicionarEstrela('${emailSeguro}', '${nomeSeguro}')"
            class="bg-yellow-500 text-white w-full py-3 mt-3 rounded-xl text-[9px] font-black uppercase shadow-sm">
            <i class="fa-solid fa-star mr-1"></i> Conceder Estrela
        </button>

        <div class="mt-4 pt-3 border-t border-gray-200">
            <div class="flex justify-between items-center mb-2">
                <span class="text-[9px] font-black uppercase text-red-800">
                    Penalidades
                </span>

                ${advCount > 0 ? `
                    <button 
                        onclick="zerarAdvertencias('${emailSeguro}')" 
                        class="text-[8px] bg-red-100 text-red-800 px-2 py-1 rounded-lg font-black uppercase">
                        Zerar
                    </button>
                ` : ''}
            </div>

            ${!isSuspenso ? `
                <div class="flex gap-2">
                    <select id="adv-select-${advId}" class="flex-1 text-[9px] p-2 border rounded-xl bg-white font-bold text-gray-700 outline-none">
                        <option value="">Aplicar infração</option>
                        <option value="Comportamento Inadequado">Comportamento Inadequado</option>
                        <option value="Atrapalhar o treino">Atrapalhar o treino</option>
                        <option value="Se recusar a participar do treino">Se recusar a participar do treino</option>
                        <option value="Desrespeito aos colegas ou treinadores">Desrespeito aos colegas ou treinadores</option>
                    </select>

                    <button 
                        onclick="aplicarAdvertencia('${emailSeguro}', '${advId}')" 
                        class="bg-[#990000] text-white px-4 rounded-xl text-[9px] font-black uppercase shadow-sm">
                        OK
                    </button>
                </div>
            ` : `
                <p class="text-[10px] font-black text-white bg-red-600 rounded-xl uppercase text-center w-full py-3 shadow-sm">
                    <i class="fa-solid fa-ban mr-1"></i> Atleta suspenso
                </p>
            `}
        </div>

        ${!isAuxiliar ? `
            <button 
                onclick="removerUsuario('${emailSeguro}')"
                class="w-full mt-3 text-[9px] py-2 text-red-500 font-black uppercase border border-red-100 rounded-xl bg-white">
                Excluir membro
            </button>
        ` : ''}
    </div>
</div>
`;
            htmlListaGestao += html;
            totalGestaoRenderizados++;
        }
    });

    listDiv.innerHTML = htmlListaGestao || `
        <div class="bg-white border border-dashed border-gray-200 rounded-2xl p-5 text-center">
            <p class="text-[10px] font-black uppercase text-gray-400">
                Nenhum atleta encontrado para os filtros atuais.
            </p>
        </div>
    `;
}

async function renderMembers() {
    const c = document.getElementById('main-content'); 
    
    // Ícone de "carregando" enquanto conta as presenças no banco
    c.innerHTML = `<h3 class="font-bold mb-4 uppercase text-gray-800 dark:text-gray-200 flex items-center">Atletas <i class="fa-solid fa-circle-notch fa-spin text-xs ml-2 text-gray-400 dark:text-gray-500" id="loading-atletas"></i></h3>`;
    
    // 1. Busca a lista de todos os usuários
    const snap = await window.carregarUsuariosCacheMockDVC(); 
    let uArr = []; 
    snap.forEach(u => uArr.push(u.data()));
    
    // 2. Busca todos os eventos para calcular as presenças
    let contagemPresencas = {}; 
    const eventsSnap = await window.carregarEventosCacheMockDVC();
    
    // Faz a leitura de todas as listas de chamada de todos os eventos (via cache)
    eventsSnap.docs.forEach(evDoc => {
        const presencas = window.DVC_CACHE?.presencasPorEvento?.[evDoc.id]?.dados || [];
        presencas.forEach(p => {
            const emailAtleta = p.id;
            contagemPresencas[emailAtleta] = (contagemPresencas[emailAtleta] || 0) + 1;
        });
    });

    // 3. Ordena os nomes em ordem alfabética
    uArr.sort((a,b) => a.nome.localeCompare(b.nome));
    
    // 4. Remove o ícone de carregando
    const loadingIcon = document.getElementById('loading-atletas');
    if (loadingIcon) loadingIcon.remove();
 
    // 5. Renderiza a lista na tela
    uArr.forEach(user => { 
        let corDaFaixa = "border-gray-200"; 
        const financeiroEfetivo = window.obterStatusFinanceiroEfetivo(user);
        
        if (user.sexo === "F") corDaFaixa = "border-pink-500";
        else if (user.sexo === "M") corDaFaixa = "border-blue-500";
        if (financeiroEfetivo === "Justificado" || financeiroEfetivo === STATUS_FINANCEIRO_CARENCIA) corDaFaixa = "border-yellow-400";
 
        // Pega o número de presenças calculado (ou 0 se não tiver nenhuma)
        const qtdPresencas = contagemPresencas[user.email] || 0;
 
        c.innerHTML += `
        <div class="p-3 border-b border-gray-100 dark:border-gray-800 flex justify-between bg-white dark:bg-gray-900 items-center mb-1 rounded shadow-sm text-gray-800 dark:text-gray-255 border-l-4 ${corDaFaixa}">
            <div class="flex flex-col">
                <span class="text-sm font-semibold">${user.nome}</span>
                <span class="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase">${user.funcao}</span>
            </div>
            
            <div class="bg-gray-50 dark:bg-gray-950 px-3 py-1 rounded-lg border border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center min-w-[50px]">
                <span class="text-[7px] text-gray-400 dark:text-gray-500 font-black uppercase mb-1">Presenças</span>
                <span class="text-sm font-black text-[#990000] dark:text-red-400 leading-none">${qtdPresencas}</span>
            </div>
        </div>`; 
    });
}

// Bind Stage 10B to window
window.usuarioTemRegistroFinanceiroNoMes = usuarioTemRegistroFinanceiroNoMes;
window.buscarGestaoDVC = buscarGestaoDVC;
window.toggleAcoesGestao = toggleAcoesGestao;
window.filterAdminList = filterAdminList;
window.renderMembers = renderMembers;

// Stage 10C: Administrative User Actions
async function adicionarEstrela(email) {
    const motivo = prompt("Por que este atleta merece uma estrela?");
    if(!motivo) return;

    try {
        const userRef = doc(db, "users", email);
        const snap = await getDoc(userRef);
        let estrelas = snap.data().estrelas || [];
        estrelas.push({ motivo: motivo, data: new Date().toLocaleDateString() });
        await updateDoc(userRef, { estrelas: estrelas });
        alert("Estrela concedida!");
    } catch (e) {
        console.error("Erro ao conceder estrela:", e);
        alert("Erro ao conceder estrela.");
    }
}

async function updateUser(email, data) {
    try {
        await updateDoc(doc(db, "users", email.trim()), data);
        if (typeof window.limparCacheDados === "function") {
            window.limparCacheDados("atletas");
        }
        renderAdmin();
    } catch (e) {
        console.error("Erro ao atualizar usuário:", e);
        alert("Erro ao atualizar usuário.");
    }
}

async function removerUsuario(target) {
    if(prompt("Senha:") === "remove01") {
        try {
            await deleteDoc(doc(db, "users", target.trim()));
            if (typeof window.limparCacheDados === "function") {
                window.limparCacheDados("atletas");
            }
            renderAdmin();
        } catch (e) {
            console.error("Erro ao remover usuário:", e);
            alert("Erro ao remover usuário.");
        }
    }
}

// Bind Stage 10C to window
window.adicionarEstrela = adicionarEstrela;
window.updateUser = updateUser;
window.removerUsuario = removerUsuario;

// Stage 10D: Documents and Warnings
async function aplicarAdvertencia(email, advId) {
    const select = document.getElementById(`adv-select-${advId}`);
    const motivo = select.value;
    if(!motivo) return alert("Selecione um motivo para a advertência.");

    try {
        const userRef = doc(db, "users", email);
        const snap = await getDoc(userRef);
        let advs = snap.data().advertencias || [];

        advs.push(motivo); // Adiciona a nova advertência à lista
        
        let updates = { advertencias: advs };
        
        // Se chegou a 3 advertências, avisa que foi suspenso
        if(advs.length >= 3) {
            alert(`Atenção: O atleta recebeu a 3ª advertência (${motivo}) e está SUSPENSO.`);
        } else {
            alert("Advertência aplicada com sucesso.");
        }

        await updateDoc(userRef, updates);
        if (typeof window.limparCacheDados === "function") {
            window.limparCacheDados("atletas");
        }
        renderAdmin(); // Recarrega a tela de gestão para atualizar as caixinhas
    } catch (e) {
        console.error("Erro ao aplicar advertência:", e);
        alert("Erro ao aplicar advertência.");
    }
}

async function zerarAdvertencias(email) {
    if(confirm("Tem certeza que deseja perdoar e zerar todas as advertências deste atleta?")) {
        try {
            await updateDoc(doc(db, "users", email), { advertencias: [] });
            if (typeof window.limparCacheDados === "function") {
                window.limparCacheDados("atletas");
            }
            alert("Advertências zeradas!");
            renderAdmin();
        } catch (e) {
            console.error("Erro ao zerar advertências:", e);
            alert("Erro ao zerar advertências.");
        }
    }
}

async function verDocs(email, nome) {
    try {
        if (typeof window.migrarContribuicoesLegadasDoAtleta === "function") {
            await window.migrarContribuicoesLegadasDoAtleta(email);
        }
        if (typeof window.limparCacheDados === "function") {
            window.limparCacheDados("financeiro");
        }
        if (typeof window.limparCacheContribuicoesAtleta === "function") {
            window.limparCacheContribuicoesAtleta();
        }
        
        let docsGlobais = [];
        if (typeof window.carregarContribuicoesCache === "function") {
            docsGlobais = await window.carregarContribuicoesCache();
        }
        
        const emailNormalizado = String(email || "").toLowerCase();
        const docsDoAtleta = docsGlobais.filter(d => String(d.email || "").toLowerCase() === emailNormalizado);

        if (docsDoAtleta.length === 0) {
            return alert("Sem comprovantes ou justificativas.");
        }

        let registros = [];

        docsDoAtleta.forEach(d => {
            const data = d;

            registros.push({
                id: d.id,
                mes: data.mes || "Sem mês",
                tipo: data.tipo || "Comprovante",
                status: data.status || "Pendente",
                resultadoFinanceiro: data.resultadoFinanceiro || "",
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

        registros.sort((a, b) => {
            const dataA = new Date(a.enviadoEm || 0);
            const dataB = new Date(b.enviadoEm || 0);
            return dataB - dataA;
        });

        const pagos = registros.filter(r => 
            r.status === "Validado" || r.resultadoFinanceiro === "Pago"
        ).length;

        const justificados = registros.filter(r => 
            r.status === "Justificado" || r.resultadoFinanceiro === "Justificado" || r.status === "Carência aceita"
        ).length;

        const pendentes = registros.filter(r => 
            r.status === "Pendente" || r.status === "Em análise"
        ).length;

        const ultimaRegularizacao = registros.find(r => 
            r.status === "Validado" || 
            r.resultadoFinanceiro === "Pago" || 
            r.status === "Justificado" || 
            r.resultadoFinanceiro === "Justificado"
        );

        let modal = `
            <div id="m-fin" class="fixed inset-0 bg-black/80 z-[100] p-4 flex items-center justify-center">
                <div class="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 w-full max-w-sm rounded-2xl p-6 max-h-[85vh] overflow-y-auto relative shadow-2xl text-gray-900 dark:text-gray-100">
                    <button 
                        onclick="document.getElementById('m-fin').remove()" 
                        class="absolute top-4 right-4 text-red-600 font-black text-xl">
                        &times;
                    </button>

                    <h2 class="font-bold text-xs uppercase mb-1 text-[#990000] dark:text-red-400">
                        Histórico Financeiro
                    </h2>

                    <p class="text-[10px] font-black text-gray-800 dark:text-gray-250 uppercase mb-4">
                        ${nome}
                    </p>

                    <div class="grid grid-cols-3 gap-2 mb-4">
                        <div class="bg-green-50 dark:bg-green-955/20 border border-green-100 dark:border-green-900/30 rounded-xl p-3 text-center">
                            <p class="text-xl font-black text-green-700 dark:text-green-400">
                                ${pagos}
                            </p>
                            <p class="text-[7px] font-bold text-green-800 dark:text-green-500 uppercase">
                                Pagos
                            </p>
                        </div>

                        <div class="bg-blue-50 dark:bg-blue-955/20 border border-blue-100 dark:border-blue-900/30 rounded-xl p-3 text-center">
                            <p class="text-xl font-black text-blue-700 dark:text-blue-400">
                                ${justificados}
                            </p>
                            <p class="text-[7px] font-bold text-blue-800 dark:text-blue-500 uppercase">
                                Justificados
                            </p>
                        </div>

                        <div class="bg-yellow-50 dark:bg-yellow-955/20 border border-yellow-100 dark:border-yellow-900/30 rounded-xl p-3 text-center">
                            <p class="text-xl font-black text-yellow-700 dark:text-yellow-400">
                                ${pendentes}
                            </p>
                            <p class="text-[7px] font-bold text-yellow-800 dark:text-yellow-500 uppercase">
                                Pendentes
                            </p>
                        </div>
                    </div>

                    <div class="bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-850 rounded-xl p-3 mb-5">
                        <p class="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase">
                            Última regularização
                        </p>

                        <p class="text-xs font-black text-gray-800 dark:text-gray-200 uppercase mt-1">
                            ${ultimaRegularizacao ? ultimaRegularizacao.mes : "Nenhuma regularização validada ainda"}
                        </p>
                    </div>

                    <p class="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase mb-2">
                        Registros enviados
                    </p>
        `;

        registros.forEach(item => {
            const isJustificativa = item.tipo === "Justificativa";
            const isCarenciaEspecial = item.tipo === "CarenciaEspecial";

            let corStatus = "bg-yellow-100 text-yellow-800 dark:bg-yellow-955/40 dark:text-yellow-400";
            let textoStatus = "Pendente";

            if (item.status === "Validado" || item.resultadoFinanceiro === "Pago") {
                corStatus = "bg-green-100 text-green-800 dark:bg-green-955/40 dark:text-green-400";
                textoStatus = "Validado";
            }

            if (item.status === "Justificado" || item.resultadoFinanceiro === "Justificado") {
                corStatus = "bg-blue-100 text-blue-800 dark:bg-blue-955/40 dark:text-blue-400";
                textoStatus = "Justificado";
            }

            if (item.status === "Em análise") {
                corStatus = "bg-red-100 text-red-800 dark:bg-red-955/40 dark:text-red-400";
                textoStatus = "Em análise";
            }

            if (item.status === "Carência recusada") {
                corStatus = "bg-red-100 text-red-800 dark:bg-red-955/40 dark:text-red-400";
                textoStatus = "Recusada";
            }

            if (isCarenciaEspecial) {
                modal += `
                    <div class="bg-red-50 dark:bg-red-955/20 p-4 rounded-xl mb-4 border border-red-200 dark:border-red-900/50">
                        <div class="flex justify-between items-center mb-2">
                            <p class="font-bold text-xs text-[#990000] dark:text-red-400">
                                ${item.mes}
                            </p>

                            <span class="${corStatus} text-[8px] font-black uppercase px-2 py-1 rounded-full">
                                ${textoStatus}
                            </span>
                        </div>

                        <p class="text-[9px] font-black text-[#990000] dark:text-red-400 uppercase mb-1">
                            Carência especial
                        </p>

                        <p class="text-[10px] text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-950 p-3 rounded-lg border border-gray-100 dark:border-gray-850 mb-3 leading-relaxed">
                            ${item.justificativa || "Sem justificativa original."}
                        </p>

                        <div class="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-850 rounded-lg p-3 mb-3 text-gray-900 dark:text-gray-100">
                            <p class="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase mb-1">1. Pode contribuir com algum valor?</p>
                            <p class="text-[10px] text-gray-700 dark:text-gray-300 leading-relaxed mb-3">${item.respostaPodeContribuir || "Sem resposta."}</p>

                            <p class="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase mb-1">2. Peso do projeto</p>
                            <p class="text-[10px] text-gray-700 dark:text-gray-300 leading-relaxed mb-3">${item.respostaImportanciaProjeto || "Sem resposta."}</p>

                            <p class="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase mb-1">3. Como poderá contribuir</p>
                            <p class="text-[10px] text-gray-700 dark:text-gray-300 leading-relaxed">${item.respostaContribuicaoProjeto || "Sem resposta."}</p>
                        </div>

                        ${window.montarRastroFinanceiro ? window.montarRastroFinanceiro(item) : ""}

                        ${(item.status === "Pendente" || item.status === "Em análise") ? `
                            <div class="grid grid-cols-2 gap-2">
                                <button onclick="aceitarCarenciaEspecial('${email}', '${item.id}', this)" class="bg-green-600 text-white py-2 rounded-lg font-bold text-[9px] uppercase">Aceitar</button>
                                <button onclick="recusarCarenciaEspecial('${email}', '${item.id}', this)" class="bg-red-600 text-white py-2 rounded-lg font-bold text-[9px] uppercase">Recusar</button>
                            </div>
                        ` : ''}
                    </div>
                `;
            } else if (isJustificativa) {
                modal += `
                    <div class="bg-blue-50 dark:bg-blue-955/20 p-4 rounded-xl mb-4 border border-blue-200 dark:border-blue-900/50">
                        <div class="flex justify-between items-center mb-2">
                            <p class="font-bold text-xs text-blue-800 dark:text-blue-400">
                                ${item.mes}
                            </p>

                            <span class="${corStatus} text-[8px] font-black uppercase px-2 py-1 rounded-full">
                                ${textoStatus}
                            </span>
                        </div>

                        <p class="text-[9px] font-black text-blue-800 dark:text-blue-400 uppercase mb-1">
                            Justificativa enviada:
                        </p>

                        <p class="text-[10px] text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-955 p-3 rounded-lg border border-gray-100 dark:border-gray-850 mb-3 leading-relaxed">
                            ${item.justificativa || "Sem texto informado."}
                        </p>

                        ${window.montarRastroFinanceiro ? window.montarRastroFinanceiro(item) : ""}

                        ${item.status === "Pendente" ? `
                            <button 
                                onclick="aprovarJustificativa('${email}', '${item.id}', this)" 
                                class="w-full bg-blue-600 text-white py-2 rounded-lg font-bold text-[9px] uppercase">
                                Justificado
                            </button>
                        ` : ''}
                    </div>
                `;
            } else {
                modal += `
                    <div class="bg-gray-50 dark:bg-gray-950/20 p-4 rounded-xl mb-4 border border-gray-200 dark:border-gray-850 text-gray-900 dark:text-gray-100">
                        <div class="flex justify-between items-center mb-2">
                            <p class="font-bold text-xs text-red-800 dark:text-red-400">
                                ${item.mes}
                            </p>

                            <span class="${corStatus} text-[8px] font-black uppercase px-2 py-1 rounded-full">
                                ${textoStatus}
                            </span>
                        </div>

                        ${window.montarRastroFinanceiro ? window.montarRastroFinanceiro(item) : ""}

                        <div class="flex gap-2">
                            <a 
                                href="${item.comprovante}" 
                                download="${nome}_${item.mes.replace('/','_')}.webp" 
                                class="flex-1 bg-blue-600 text-white text-center py-2 rounded-lg font-bold text-[9px] uppercase">
                                Baixar
                            </a>

                            ${item.status === "Pendente" ? `
                                <button 
                                    onclick="validarExpress('${email}', '${item.id}', this)" 
                                    class="flex-1 bg-green-600 text-white py-2 rounded-lg font-bold text-[9px] uppercase">
                                    Verificar
                                </button>
                            ` : ''}
                        </div>
                    </div>
                `;
            }
        });

        document.body.insertAdjacentHTML('beforeend', modal + `</div></div>`);
    } catch (e) {
        console.error("Erro ao carregar documentos:", e);
        alert("Erro ao carregar documentos.");
    }
}

// Bind Stage 10D to window
window.aplicarAdvertencia = aplicarAdvertencia;
window.zerarAdvertencias = zerarAdvertencias;
window.verDocs = verDocs;

// Stage 10E: XLS Exports
function exportarXLS() {
    alert("Exportando...");
}

function exportarAtletasXLS() {
    alert("Exportando...");
}

// Bind Stage 10E to window
window.exportarXLS = exportarXLS;
window.exportarAtletasXLS = exportarAtletasXLS;

// Stage 10F: Relatórios Word DVC
function formatarDataBR(dataTexto) {
    if (!dataTexto) return "Não informado";
    
    if (dataTexto && typeof dataTexto.toDate === "function") {
        dataTexto = dataTexto.toDate();
    }
    
    const data = new Date(dataTexto);
    if (isNaN(data.getTime())) return String(dataTexto);
    
    if (typeof dataTexto === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dataTexto)) {
        const [ano, mes, dia] = dataTexto.split("-").map(Number);
        return `${String(dia).padStart(2, "0")}/${String(mes).padStart(2, "0")}/${ano}`;
    }
    
    const dia = String(data.getDate()).padStart(2, "0");
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
}

function baixarDocumentoWordDVC(nomeArquivo, titulo, htmlConteudo) {
    const htmlCompleto = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset="UTF-8">
<title>${titulo}</title>
<style>
body { font-family: 'Arial', sans-serif; font-size: 11pt; color: #333; line-height: 1.4; }
h1 { color: #990000; font-size: 18pt; border-bottom: 2px solid #990000; padding-bottom: 5px; margin-top: 0; }
h2 { color: #990000; font-size: 14pt; margin-top: 20px; border-bottom: 1px solid #ddd; padding-bottom: 3px; }
table { border-collapse: collapse; width: 100%; margin-top: 10px; margin-bottom: 20px; }
th { background-color: #990000; color: #ffffff; font-weight: bold; padding: 6px 10px; text-align: left; border: 1px solid #cccccc; font-size: 9.5pt; }
td { padding: 6px 10px; border: 1px solid #cccccc; font-size: 9pt; }
tr:nth-child(even) { background-color: #f9f9f9; }
.card-resumo { background-color: #f7f7f7; border-left: 4px solid #990000; padding: 12px; margin-bottom: 15px; }
.card-resumo h2 { font-size: 12pt; margin-top: 0; border-bottom: none; }
.card-resumo table { margin-top: 5px; margin-bottom: 0; }
.card-resumo td { padding: 4px 6px; border: none; font-size: 9.5pt; }
.negrito { font-weight: bold; }
</style>
</head>
<body>
${htmlConteudo}
</body>
</html>`;

    const blob = new Blob(["\ufeff" + htmlCompleto], { type: "application/msword;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = nomeArquivo.endsWith(".doc") ? nomeArquivo : (nomeArquivo + ".doc");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

async function baixarRelatorioAtletasDVC(buttonElement) {
    let originalText = "";
    if (buttonElement) {
        originalText = buttonElement.innerHTML;
        buttonElement.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin mr-1"></i> Gerando relatório...`;
        buttonElement.disabled = true;
    }

    try {
        const eADM = window.usuarioEhADM?.() || false;
        const eEquipe = window.usuarioEhEquipeTecnica?.() || false;
        const funcao = window.currentUserData?.funcao;
        const temPermissao = eADM || eEquipe || ["ADM", "Treinador", "Auxiliar"].includes(funcao);

        if (!temPermissao) {
            alert("Você não tem permissão para gerar relatórios.");
            return;
        }

        const atletas = await window.carregarAtletasCache(true);
        if (!atletas || atletas.length === 0) {
            alert("Nenhum atleta cadastrado no sistema.");
            return;
        }

        let totalCount = 0;
        let ativosCount = 0;
        let inativosCount = 0;
        let emDiaCount = 0;
        let justificadosCount = 0;
        let inadimplentesCount = 0;
        let sub17Count = 0;
        let adultoCount = 0;
        let masculinoCount = 0;
        let femininoCount = 0;

        const atletasElegiveis = [];

        atletas.forEach(user => {
            const role = (user.funcao || "Membro").trim();
            const roleNorm = role.toLowerCase();
            const isAdmOrTreinador = roleNorm === "adm" || roleNorm === "treinador";
            const isAthleteExplicit = user.atleta === true || user.ehAtleta === true || user.escalavel === true || user.atleta === "Sim" || user.escalavel === "Sim";

            if (isAdmOrTreinador && !isAthleteExplicit) {
                return;
            }

            if (user.email === "gabriel0barbosa0@gmail.com") return;

            atletasElegiveis.push(user);

            totalCount++;
            
            const ehAtivo = window.usuarioTemStatusConvocavel?.(user) || false;
            if (ehAtivo) {
                ativosCount++;
            } else {
                inativosCount++;
            }

            const finStatus = window.obterStatusFinanceiroEfetivo?.(user);
            if (finStatus === "Em dia") emDiaCount++;
            else if (finStatus === "Justificado") justificadosCount++;
            else if (finStatus === "Inadimplente") inadimplentesCount++;

            const cat = window.calcularCategoriaEtariaDVC?.(user);
            if (cat === "Sub-17") sub17Count++;
            else if (cat === "Adulto") adultoCount++;

            if (user.sexo === "M") masculinoCount++;
            else if (user.sexo === "F") femininoCount++;
        });

        let cadastralRows = "";
        atletasElegiveis.forEach(user => {
            const nome = user.nome || "Não informado";
            const sexo = user.sexo === "M" ? "Masculino" : (user.sexo === "F" ? "Feminino" : "Não informado");
            const idadeVal = window.calcularIdadeAtletaDVC?.(user);
            const idade = idadeVal !== null && idadeVal !== undefined ? idadeVal : "Não informado";
            const cat = window.calcularCategoriaEtariaDVC?.(user);
            const categoria = cat !== "Sem categoria" ? cat : "Não informado";
            const funcVolei = user.funcaoVolei || "formacao";
            const funcaoQuadra = window.getNomeFuncaoVoleiDVC?.(funcVolei) || "Não informado";
            const status = window.usuarioTemStatusConvocavel?.(user) ? "Ativo" : (user.status || "Não informado");
            const financeiro = window.obterStatusFinanceiroEfetivo?.(user) || "Não informado";
            const telefone = user.telefone || user.tel || "Não informado";
            const responsavel = user.responsavelNome || user.respNome || "Não informado";
            const respTel = user.responsavelTelefone || user.respTel || "Não informado";
            const email = user.email || user.id || "Não informado";

            cadastralRows += `
                <tr>
                    <td>${nome}</td>
                    <td>${sexo}</td>
                    <td>${idade}</td>
                    <td>${categoria}</td>
                    <td>${funcaoQuadra}</td>
                    <td>${status}</td>
                    <td>${financeiro}</td>
                    <td>${telefone}</td>
                    <td>${responsavel}</td>
                    <td>${respTel}</td>
                    <td>${email}</td>
                </tr>
            `;
        });

        const colunasHabilidades = [
            { id: "recepcao", nomeCurto: "Rec." },
            { id: "levantamento", nomeCurto: "Lev." },
            { id: "ataque", nomeCurto: "Atq." },
            { id: "bloqueio", nomeCurto: "Bloq." },
            { id: "defesa", nomeCurto: "Def." },
            { id: "saque", nomeCurto: "Saq." },
            { id: "antecipacao", nomeCurto: "Ant." },
            { id: "tomadaDecisao", nomeCurto: "Tom. Dec." },
            { id: "leituraJogo", nomeCurto: "Leit. Jogo" },
            { id: "resiliencia", nomeCurto: "Resil." },
            { id: "comunicacaoQuadra", nomeCurto: "Comun." },
            { id: "trabalhoEquipe", nomeCurto: "Trab. Eq." }
        ];

        let technicalRows = "";
        atletasElegiveis.forEach(user => {
            const nome = user.nome || "Não informado";
            const cat = window.calcularCategoriaEtariaDVC?.(user);
            const categoria = cat !== "Sem categoria" ? cat : "Não informado";
            const funcVolei = user.funcaoVolei || "formacao";
            const funcaoQuadra = window.getNomeFuncaoVoleiDVC?.(funcVolei) || "Não informado";
            const scoreGeral = window.calcularScoreGeralDVC?.(user.habilidades || {});
            const scoreGeralTexto = scoreGeral > 0 ? scoreGeral.toFixed(1) : "Não informado";

            let habCellHtml = "";
            const h = user.habilidades || {};
            colunasHabilidades.forEach(col => {
                const nota = h[col.id] !== undefined && h[col.id] !== null && h[col.id] !== "" ? Number(h[col.id]).toFixed(1) : "Não informado";
                habCellHtml += `<td>${nota}</td>`;
            });

            technicalRows += `
                <tr>
                    <td>${nome}</td>
                    <td>${categoria}</td>
                    <td>${funcaoQuadra}</td>
                    <td class="negrito">${scoreGeralTexto}</td>
                    ${habCellHtml}
                </tr>
            `;
        });

        const htmlConteudo = `
            <h1>RELATÓRIO GERAL DE ATLETAS - DVC</h1>
            <p>Gerado em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}</p>
            
            <div class="card-resumo">
                <h2>Resumo Estatístico</h2>
                <table>
                    <tr>
                        <td class="negrito" style="width: 25%;">Atletas Ativos:</td>
                        <td style="width: 25%;">${ativosCount}</td>
                        <td class="negrito" style="width: 25%;">Atletas Inativos:</td>
                        <td style="width: 25%;">${inativosCount}</td>
                    </tr>
                    <tr>
                        <td class="negrito">Em Dia:</td>
                        <td>${emDiaCount}</td>
                        <td class="negrito">Justificados:</td>
                        <td>${justificadosCount}</td>
                    </tr>
                    <tr>
                        <td class="negrito">Inadimplentes:</td>
                        <td>${inadimplentesCount}</td>
                        <td class="negrito">Sub-17:</td>
                        <td>${sub17Count}</td>
                    </tr>
                    <tr>
                        <td class="negrito">Adulto:</td>
                        <td>${adultoCount}</td>
                        <td class="negrito">Masculino:</td>
                        <td>${masculinoCount}</td>
                    </tr>
                    <tr>
                        <td class="negrito">Feminino:</td>
                        <td>${femininoCount}</td>
                        <td class="negrito">Total Cadastrado:</td>
                        <td>${totalCount}</td>
                    </tr>
                </table>
            </div>

            <h2>1. Dados Cadastrais e de Contato</h2>
            <table>
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Sexo</th>
                        <th>Idade</th>
                        <th>Categoria</th>
                        <th>Função</th>
                        <th>Status</th>
                        <th>Financeiro</th>
                        <th>Telefone</th>
                        <th>Responsável</th>
                        <th>Tel. Resp.</th>
                        <th>E-mail</th>
                    </tr>
                </thead>
                <tbody>
                    ${cadastralRows}
                </tbody>
            </table>

            <h2>2. Dados Técnicos e Habilidades</h2>
            <table>
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Cat.</th>
                        <th>Função</th>
                        <th>Score</th>
                        ${colunasHabilidades.map(col => "<th>" + col.nomeCurto + "</th>").join("")}
                    </tr>
                </thead>
                <tbody>
                    ${technicalRows}
                </tbody>
            </table>
        `;

        const hoje = new Date();
        const dataString = hoje.toISOString().split("T")[0];
        const nomeArquivo = `relatorio-atletas-dvc-${dataString}.doc`;

        window.baixarDocumentoWordDVC(nomeArquivo, "Relatório Geral de Atletas DVC", htmlConteudo);

    } catch (e) {
        console.error("Erro ao gerar relatório de atletas:", e);
        alert("Não foi possível gerar o relatório de atletas.");
    } finally {
        if (buttonElement) {
            buttonElement.innerHTML = originalText;
            buttonElement.disabled = false;
        }
    }
}

async function baixarRelatorioPresencasDVC(buttonElement) {
    let originalText = "";
    if (buttonElement) {
        originalText = buttonElement.innerHTML;
        buttonElement.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin mr-1"></i> Gerando relatório...`;
        buttonElement.disabled = true;
    }

    try {
        const eADM = window.usuarioEhADM?.() || false;
        const eEquipe = window.usuarioEhEquipeTecnica?.() || false;
        const funcao = window.currentUserData?.funcao;
        const temPermissao = eADM || eEquipe || ["ADM", "Treinador", "Auxiliar"].includes(funcao);

        if (!temPermissao) {
            alert("Você não tem permissão para gerar relatórios.");
            return;
        }

        const atletas = await window.carregarAtletasCache(true);
        if (!atletas || atletas.length === 0) {
            alert("Nenhum atleta cadastrado.");
            return;
        }

        const atletasElegiveis = atletas.filter(user => {
            const role = (user.funcao || "Membro").trim();
            const roleNorm = role.toLowerCase();
            const isAdmOrTreinador = roleNorm === "adm" || roleNorm === "treinador";
            const isAthleteExplicit = user.atleta === true || user.ehAtleta === true || user.escalavel === true || user.atleta === "Sim" || user.escalavel === "Sim";

            if (isAdmOrTreinador && !isAthleteExplicit) {
                return false;
            }
            if (user.email === "gabriel0barbosa0@gmail.com") return false;
            return true;
        });

        const eventos = await window.carregarEventosCache(true);
        if (!eventos || eventos.length === 0) {
            alert("Nenhum evento cadastrado.");
            return;
        }

        const promises = eventos.map(async (ev) => {
            const presencas = await window.carregarPresencasEventoDVC(ev.id);
            const convocados = typeof window.carregarConvocadosEventoDVC === "function" 
                ? await window.carregarConvocadosEventoDVC(ev.id) 
                : [];
            return { ev, presencas, convocados };
        });

        const resultados = await Promise.all(promises);

        const eventosAnalisados = resultados.filter(({ ev, presencas }) => {
            const status = String(ev.status || ev.statusTreino || "").toLowerCase().trim();
            if (status.includes("cancel")) return false;

            if (!presencas || presencas.length === 0) return false;

            return true;
        });

        const totalEventos = eventosAnalisados.length;
        if (totalEventos === 0) {
            alert("Nenhum evento com chamada/checklist realizada foi encontrado.");
            return;
        }

        const presencasPorAtleta = {};
        atletasElegiveis.forEach(atleta => {
            presencasPorAtleta[atleta.email] = {
                atleta,
                count: 0
            };
        });

        eventosAnalisados.forEach(({ presencas }) => {
            presencas.forEach(p => {
                const email = String(p.email || p.id).toLowerCase().trim();
                if (presencasPorAtleta[email]) {
                    presencasPorAtleta[email].count++;
                }
            });
        });

        let somaPercentuais = 0;
        let maxPresencas = -1;
        let minPresencas = 999999;
        
        const listaAtletasPresencas = atletasElegiveis.map(atleta => {
            const count = presencasPorAtleta[atleta.email]?.count || 0;
            const taxa = totalEventos > 0 ? (count / totalEventos) * 100 : 0;
            somaPercentuais += taxa;

            if (count > maxPresencas) maxPresencas = count;
            if (count < minPresencas) minPresencas = count;

            return {
                nome: atleta.nome || "Não informado",
                count,
                taxa
            };
        });

        const mediaGeralTaxa = atletasElegiveis.length > 0 ? (somaPercentuais / atletasElegiveis.length) : 0;

        let melhoresAtletas = [];
        let pioresAtletas = [];
        if (atletasElegiveis.length > 0) {
            listaAtletasPresencas.forEach(ap => {
                if (ap.count === maxPresencas) melhoresAtletas.push(ap.nome);
                if (ap.count === minPresencas) pioresAtletas.push(ap.nome);
            });
        }

        const melhorFrequencia = melhoresAtletas.length > 0 ? melhoresAtletas.join(", ") : "Nenhum";
        const piorFrequencia = pioresAtletas.length > 0 ? pioresAtletas.join(", ") : "Nenhum";

        listaAtletasPresencas.sort((a, b) => b.count - a.count || a.nome.localeCompare(b.nome));
        let rowsAtletas = "";
        listaAtletasPresencas.forEach(ap => {
            rowsAtletas += `
                <tr>
                    <td>${ap.nome}</td>
                    <td>${ap.count}</td>
                    <td>${totalEventos}</td>
                    <td class="negrito">${ap.taxa.toFixed(1)}%</td>
                </tr>
            `;
        });

        let rowsEventos = "";
        eventosAnalisados.forEach(({ ev, presencas, convocados }) => {
            const titulo = ev.titulo || ev.title || "Treino DVC";
            const tipo = String(ev.tipo || "treino").toLowerCase().trim() === "jogo" ? "Jogo / Amistoso" : "Treino";
            const dataFmt = formatarDataBR(ev.data);
            const totalPres = presencas.length;
            const totalConv = convocados.length > 0 ? Math.max(convocados.length, totalPres) : atletasElegiveis.length;
            const taxa = totalConv > 0 ? (totalPres / totalConv) * 100 : 0;

            rowsEventos += `
                <tr>
                    <td>${titulo}</td>
                    <td>${tipo}</td>
                    <td>${dataFmt}</td>
                    <td>${totalPres}</td>
                    <td>${totalConv}</td>
                    <td class="negrito">${taxa.toFixed(1)}%</td>
                </tr>
            `;
        });

        const htmlConteudo = `
            <h1>RELATÓRIO GERAL DE PRESENÇAS - DVC</h1>
            <p>Gerado em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}</p>
            
            <div class="card-resumo">
                <h2>Resumo de Frequência</h2>
                <table>
                    <tr>
                        <td class="negrito" style="width: 30%;">Total de Eventos Analisados:</td>
                        <td style="width: 70%;">${totalEventos}</td>
                    </tr>
                    <tr>
                        <td class="negrito">Total de Atletas Analisados:</td>
                        <td>${atletasElegiveis.length} Atleta(s)</td>
                    </tr>
                    <tr>
                        <td class="negrito">Média Geral de Presença:</td>
                        <td class="negrito" style="color: #990000;">${mediaGeralTaxa.toFixed(1)}%</td>
                    </tr>
                    <tr>
                        <td class="negrito">Melhor(es) Frequência(s):</td>
                        <td>${melhorFrequencia} (${maxPresencas} presença(s))</td>
                    </tr>
                    <tr>
                        <td class="negrito">Pior(es) Frequência(s):</td>
                        <td>${piorFrequencia} (${minPresencas} presença(s))</td>
                    </tr>
                </table>
            </div>

            <h2>1. Frequência Individual por Atleta</h2>
            <table>
                <thead>
                    <tr>
                        <th>Nome do Atleta</th>
                        <th>Presenças Confirmadas</th>
                        <th>Total de Eventos</th>
                        <th>Taxa de Presença (%)</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsAtletas}
                </tbody>
            </table>

            <h2>2. Histórico de Presenças por Evento/Treino</h2>
            <table>
                <thead>
                    <tr>
                        <th>Título do Evento</th>
                        <th>Tipo</th>
                        <th>Data</th>
                        <th>Presenças Confirmadas</th>
                        <th>Total Convocados/Elegíveis</th>
                        <th>Taxa (%)</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsEventos}
                </tbody>
            </table>
        `;

        const hoje = new Date();
        const dataString = hoje.toISOString().split("T")[0];
        const nomeArquivo = `relatorio-presencas-dvc-${dataString}.doc`;

        window.baixarDocumentoWordDVC(nomeArquivo, "Relatório Geral de Presenças DVC", htmlConteudo);

    } catch (e) {
        console.error("Erro ao gerar relatório de presenças:", e);
        alert("Não foi possível gerar o relatório de presenças.");
    } finally {
        if (buttonElement) {
            buttonElement.innerHTML = originalText;
            buttonElement.disabled = false;
        }
    }
}

// Bind Stage 10F to window
window.baixarDocumentoWordDVC = baixarDocumentoWordDVC;
window.baixarRelatorioAtletasDVC = baixarRelatorioAtletasDVC;
window.baixarRelatorioPresencasDVC = baixarRelatorioPresencasDVC;

// Stage 10G: Novos Cadastros / Triagem de Cadastros
async function carregarResumoNovosCadastros() {
    try {
        const box = document.getElementById('box-novos-cadastros');
        if (!box) return;

        const usersSnap = await window.carregarUsuariosCacheMockDVC();

        let novos = [];

        usersSnap.forEach(docUsuario => {
            const user = docUsuario.data();
            const email = user.email || docUsuario.id;

            if (window.ehResponsavelTecnico(user)) return;

            if (user.cadastroStatus === "Novo") {
                novos.push({
                    email,
                    nome: user.nome || email,
                    telefone: user.telefone || user.tel || "",
                    responsavelNome: user.responsavelNome || user.respNome || "",
                    responsavelTelefone: user.responsavelTelefone || user.respTel || "",
                    criadoEm: user.criadoEm || ""
                });
            }
        });

        novos.sort((a, b) => {
            const dataA = new Date(a.criadoEm || 0);
            const dataB = new Date(b.criadoEm || 0);
            return dataB - dataA;
        });

        if (novos.length === 0) {
            box.innerHTML = `
                <div class="bg-white border rounded-xl p-4 shadow-sm">
                    <div class="flex justify-between items-center">
                        <div>
                            <p class="text-[10px] font-black text-[#990000] uppercase">
                                Novos Cadastros
                            </p>
                            <p class="text-[8px] font-bold text-gray-400 uppercase">
                                Nenhum cadastro novo no momento
                            </p>
                        </div>

                        <span class="bg-gray-100 text-gray-500 text-[10px] font-black px-3 py-2 rounded-full">
                            0
                        </span>
                    </div>
                </div>
            `;
            return;
        }

        box.innerHTML = `
            <div class="bg-white border rounded-xl p-4 shadow-sm">
                <div class="flex justify-between items-center mb-3">
                    <div>
                        <p class="text-[10px] font-black text-[#990000] uppercase">
                            Novos Cadastros
                        </p>
                        <p class="text-[8px] font-bold text-gray-400 uppercase">
                            Atletas aguardando conferência
                        </p>
                    </div>

                    <span class="bg-[#990000] text-white text-[10px] font-black px-3 py-2 rounded-full">
                        ${novos.length}
                    </span>
                </div>

                <button 
                    onclick="abrirNovosCadastros()" 
                    class="w-full bg-[#990000] text-white py-2 rounded-lg text-[9px] font-black uppercase">
                    Ver novos cadastros
                </button>
            </div>
        `;

    } catch (e) {
        console.error("Erro ao carregar novos cadastros:", e);
    }
}

async function abrirNovosCadastros() {
    try {
        const usersSnap = await window.carregarUsuariosCacheMockDVC();

        let novos = [];

        usersSnap.forEach(docUsuario => {
            const user = docUsuario.data();
            const email = user.email || docUsuario.id;

            if (window.ehResponsavelTecnico(user)) return;

            if (user.cadastroStatus === "Novo") {
                novos.push({
                    email,
                    nome: user.nome || email,
                    telefone: user.telefone || user.tel || "",
                    responsavelNome: user.responsavelNome || user.respNome || "",
                    responsavelTelefone: user.responsavelTelefone || user.respTel || "",
                    status: window.usuarioTemStatusConvocavel(user) ? "Ativo" : (user.status || ""),
                    financeiro: window.obterStatusFinanceiroEfetivo(user),
                    criadoEm: user.criadoEm || ""
                });
            }
        });

        novos.sort((a, b) => {
            const dataA = new Date(a.criadoEm || 0);
            const dataB = new Date(b.criadoEm || 0);
            return dataB - dataA;
        });

        const listaHtml = novos.length > 0 ? novos.map(item => `
            <div class="bg-red-50 border border-red-100 rounded-xl p-4 mb-3">
                <div class="flex justify-between items-start gap-2 mb-2">
                    <div>
                        <p class="text-xs font-black text-gray-800 uppercase">
                            ${item.nome}
                        </p>

                        <p class="text-[9px] font-bold text-gray-500">
                            ${item.email}
                        </p>
                    </div>

                    <span class="bg-[#990000] text-white text-[8px] font-black px-2 py-1 rounded-full uppercase">
                        Novo
                    </span>
                </div>

                <div class="bg-white border rounded-lg p-3 mb-3">
                    <p class="text-[9px] font-black text-gray-400 uppercase mb-1">
                        Contato do atleta
                    </p>
                    <p class="text-[10px] font-bold text-gray-700">
                        ${item.telefone || "Não informado"}
                    </p>
                </div>

                <div class="bg-white border rounded-lg p-3 mb-3">
                    <p class="text-[9px] font-black text-gray-400 uppercase mb-1">
                        Responsável
                    </p>
                    <p class="text-[10px] font-bold text-gray-700">
                        ${item.responsavelNome || "Não informado"}
                    </p>
                    <p class="text-[10px] font-bold text-gray-700 mt-1">
                        WhatsApp: ${item.responsavelTelefone || "Não informado"}
                    </p>
                </div>

                <div class="grid grid-cols-2 gap-2 mb-3">
                    <div class="bg-white border rounded-lg p-2 text-center">
                        <p class="text-[8px] font-black text-gray-400 uppercase">
                            Status
                        </p>
                        <p class="text-[10px] font-black text-gray-700 uppercase">
                            ${item.status || "Sem status"}
                        </p>
                    </div>

                    <div class="bg-white border rounded-lg p-2 text-center">
                        <p class="text-[8px] font-black text-gray-400 uppercase">
                            Financeiro
                        </p>
                        <p class="text-[10px] font-black text-gray-700 uppercase">
                            ${item.financeiro || "Sem info"}
                        </p>
                    </div>
                </div>

                <button 
                    onclick="marcarCadastroComoVisto('${item.email}', this)" 
                    class="w-full bg-gray-900 text-white py-2 rounded-lg text-[9px] font-black uppercase">
                    Marcar como visto
                </button>
            </div>
        `).join('') : `
            <div class="bg-gray-50 border border-dashed rounded-xl p-4 text-center">
                <p class="text-[10px] text-gray-400 font-bold uppercase">
                    Nenhum novo cadastro no momento.
                </p>
            </div>
        `;

        const modal = `
            <div id="m-novos-cadastros" class="fixed inset-0 bg-black/80 z-[100] p-4 flex items-center justify-center">
                <div class="bg-white w-full max-w-sm rounded-2xl p-5 max-h-[85vh] overflow-y-auto relative shadow-2xl">
                    <button 
                        onclick="document.getElementById('m-novos-cadastros').remove()" 
                        class="absolute top-4 right-4 text-red-600 font-black text-xl">
                        &times;
                    </button>

                    <h2 class="font-bold text-xs uppercase mb-1 text-[#990000]">
                        Novos Cadastros
                    </h2>

                    <p class="text-[9px] text-gray-400 font-bold uppercase mb-4">
                        Atletas aguardando conferência
                    </p>

                    ${listaHtml}
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modal);

    } catch (e) {
        console.error("Erro ao abrir novos cadastros:", e);
        alert("Não foi possível carregar os novos cadastros.");
    }
}

async function marcarCadastroComoVisto(email, btn) {
    try {
        if (!confirm("Marcar este cadastro como visto?")) {
            return;
        }

        await updateDoc(doc(db, "users", email), {
            cadastroStatus: "Visto",
            cadastroVistoEm: new Date().toISOString(),
            cadastroVistoPor: window.currentUserData?.nome || window.auth?.currentUser?.email || "ADM"
        });

        if (btn) {
            btn.innerText = "Marcado como visto";
            btn.disabled = true;
            btn.classList.remove("bg-gray-900");
            btn.classList.add("bg-green-700");
        }

        window.carregarResumoNovosCadastros();
        window.filterAdminList();

    } catch (e) {
        console.error("Erro ao marcar cadastro como visto:", e);
        alert("Não foi possível marcar como visto.");
    }
}

// Bind Stage 10G to window
window.carregarResumoNovosCadastros = carregarResumoNovosCadastros;
window.abrirNovosCadastros = abrirNovosCadastros;
window.marcarCadastroComoVisto = marcarCadastroComoVisto;
