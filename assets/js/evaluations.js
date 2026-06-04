/**
 * ============================================================================
 * Módulo: EVALUATIONS
 * ============================================================================
 * Responsabilidade: Gerencia funcionalidades relacionadas a evaluations.
 * Este arquivo faz parte do sistema modular do DVC App.
 * Todos os códigos principais aqui agrupados seguem as diretrizes do projeto.
 * ============================================================================
 */

// EVALUATIONS MODULE DVC APP

import { auth, db, collection, doc, getDoc, getDocs, setDoc, updateDoc, addDoc } from "./firebase.js";
import {
    escaparHtml,
    normalizarEmailDVC,
    normalizarEmailIdDVC,
    normalizarFuncaoTecnica,
    normalizarHabilidadesDVC,
    renderBadgeDVC
} from "./utils.js";

function ehResponsavelTecnico(user = {}) {
    return typeof window.ehResponsavelTecnico === "function"
        ? window.ehResponsavelTecnico(user)
        : false;
}

function usuarioEhADM(user) {
    return typeof window.usuarioEhADM === "function"
        ? window.usuarioEhADM(user)
        : (user ? user.funcao === "ADM" : false);
}

function usuarioEhEquipeTecnica() {
    return typeof window.usuarioEhEquipeTecnica === "function"
        ? window.usuarioEhEquipeTecnica()
        : false;
}

async function carregarAtletasCache(forcar = false) {
    return typeof window.carregarAtletasCache === "function"
        ? window.carregarAtletasCache(forcar)
        : [];
}

function limparCacheDados(tipo = "todos") {
    if (typeof window.limparCacheDados === "function") {
        return window.limparCacheDados(tipo);
    }
}

async function carregarHistoricoHabilidadesAtletaDVC(email, force = false) {
    return typeof window.carregarHistoricoHabilidadesAtletaDVC === "function"
        ? window.carregarHistoricoHabilidadesAtletaDVC(email, force)
        : [];
}

function limparCacheHistoricoHabilidades(email = null) {
    if (typeof window.limparCacheHistoricoHabilidades === "function") {
        return window.limparCacheHistoricoHabilidades(email);
    }
}

async function registrarHistoricoHabilidade(...args) {
    if (typeof window.registrarHistoricoHabilidade === "function") {
        return window.registrarHistoricoHabilidade(...args);
    }
}

function renderHome() {
    if (typeof window.renderHome === "function") {
        return window.renderHome();
    }
}

function renderProfile() {
    if (typeof window.renderProfile === "function") {
        return window.renderProfile();
    }
}

function snapshotToArray(snapshot) {
    if (Array.isArray(snapshot)) return snapshot;
    return snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
    }));
}

async function carregarAvaliacoesParesDVC(force = false) {
  const cache = window.DVC_CACHE.avaliacoesPares;
  if (!force && Array.isArray(cache.dados) && Date.now() - cache.atualizadoEm < 2 * 60 * 1000) return cache.dados;
  console.log("[DVC leitura] avaliacoesPares (Global)");
  const snap = await getDocs(collection(db, "avaliacoesPares"));
  const dados = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  window.DVC_CACHE.avaliacoesPares = { dados, atualizadoEm: Date.now() };
  return dados;
}

async function carregarAutoAvaliacoesDVC(force = false) {
  const cache = window.DVC_CACHE.autoAvaliacoes;
  if (!force && Array.isArray(cache.dados) && Date.now() - cache.atualizadoEm < 2 * 60 * 1000) return cache.dados;
  console.log("[DVC leitura] autoAvaliacoesHabilidades (Global)");
  const snap = await getDocs(collection(db, "autoAvaliacoesHabilidades"));
  const dados = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  window.DVC_CACHE.autoAvaliacoes = { dados, atualizadoEm: Date.now() };
  return dados;
}

async function carregarAvaliacoesEquipeTecnicaDVC(force = false) {
  const cache = window.DVC_CACHE.avaliacoesEquipeTecnica;
  if (!force && Array.isArray(cache.dados) && Date.now() - cache.atualizadoEm < 2 * 60 * 1000) return cache.dados;
  console.log("[DVC leitura] avaliacoesEquipeTecnica (Global)");
  const snap = await getDocs(collection(db, "avaliacoesEquipeTecnica"));
  const dados = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  window.DVC_CACHE.avaliacoesEquipeTecnica = { dados, atualizadoEm: Date.now() };
  return dados;
}

function limparCacheAvaliacoesPares() { window.DVC_CACHE.avaliacoesPares = {}; }

function limparCacheAutoAvaliacoes() { window.DVC_CACHE.autoAvaliacoes = {}; }

function limparCacheAvaliacoesEquipeTecnica() { window.DVC_CACHE.avaliacoesEquipeTecnica = {}; }

// ============================================================================
// SECAO 03 - AVALIACOES, HABILIDADES E CALCULOS TECNICOS
// ============================================================================
// Responsabilidade: criterios tecnicos, avaliacoes, medias e calculos usados em perfil, ranking e gestao.
// --- FUNÇÕES DE AVALIAÇÃO DE HABILIDADES ---
const CRITERIOS_AVALIACAO_DVC = [
    {
        parte: "Habilidades Tecnicas",
        itens: [
            { id: "recepcao", icone: "", habilidade: "Recepcao / Passe", descricoes: { 1: "Muita dificuldade em controlar a manchete; quebra muitos passes e ainda nao consegue direcionar a bola com seguranca.", 2: "Consegue receber bolas mais lentas, mas ainda se perde na movimentacao, no posicionamento e no tempo de contato com a bola.", 3: "Passe regular. Consegue colocar a bola proxima ao levantador quando o saque vem mais simples ou reto, mas sofre com saques fortes, flutuantes ou bem direcionados.", 4: "Bom controle de manchete e toque. Consegue amortecer saques taticos, ajustar o corpo e direcionar bem a bola na maioria das situacoes.", 5: "Recepcao excelente e precisa. Consegue colocar a bola em condicao ideal de levantamento mesmo sob pressao de saque forte ou em momentos decisivos." } },
            { id: "levantamento", icone: "", habilidade: "Levantamento", descricoes: { 1: "Nao domina a tecnica do toque ou da manchete para levantar; a bola sai sem controle, baixa, carregada ou com dois toques.", 2: "Consegue empurrar a bola alta para as pontas, mas ainda sem precisao, regularidade ou variacao de distancia.", 3: "Distribuicao regular. Consegue levantar bolas altas para as pontas com seguranca, mas falha em bolas rapidas, bolas de meio ou quando o passe vem quebrado.", 4: "Boa visao e precisao. Ajusta a bola mesmo vindo de um passe ruim, consegue variar opcoes e acelerar o jogo em alguns momentos.", 5: "Controle avancado do jogo. Esconde a jogada, faz inversoes, varia velocidade e coloca os atacantes frequentemente em situacao favoravel contra o bloqueio." } },
            { id: "ataque", icone: "", habilidade: "Ataque", descricoes: { 1: "Tem muita dificuldade em coordenar corrida, impulsao e batida na bola; geralmente apenas passa a bola para o outro lado.", 2: "Consegue atacar bolas simples, mas com pouca forca, direcao ou controle; erra bastante o tempo de bola.", 3: "Ataque regular. Consegue atacar bolas altas com alguma seguranca, mas ainda tem dificuldade contra bloqueio ou bolas fora da zona ideal.", 4: "Bom ataque. Consegue variar direcao, forca e explorar bloqueio em algumas situacoes.", 5: "Ataque muito eficiente. Decide pontos com frequencia, varia golpes, explora bloqueio e mantem bom rendimento mesmo sob pressao." } },
            { id: "bloqueio", icone: "", habilidade: "Bloqueio", descricoes: { 1: "Ainda nao entende bem o tempo de salto, posicionamento das maos ou leitura do atacante.", 2: "Consegue saltar junto ao atacante, mas chega atrasado ou mal posicionado com frequencia.", 3: "Bloqueio regular. Consegue fechar espaco em bolas previsiveis, mas ainda tem dificuldade com bolas rapidas ou variacoes.", 4: "Bom bloqueio. Le bem o atacante, fecha diagonal ou paralela e toca em muitas bolas.", 5: "Bloqueio dominante. Antecipa jogadas, organiza a marcacao e influencia diretamente as decisoes do ataque adversario." } },
            { id: "defesa", icone: "", habilidade: "Defesa", descricoes: { 1: "Tem dificuldade em se posicionar, reagir e manter a bola em jogo apos ataques adversarios.", 2: "Defende bolas mais faceis, mas ainda se desequilibra ou foge da trajetoria da bola em ataques fortes.", 3: "Defesa regular. Consegue defender bolas previsiveis, mas sofre com largadas, desvios e ataques mais potentes.", 4: "Boa defesa. Le bem o ataque, ocupa espaco corretamente e mantem muitas bolas vivas.", 5: "Defesa excelente. Tem leitura rapida, coragem, posicionamento e consegue transformar defesas dificeis em contra-ataque." } },
            { id: "saque", icone: "", habilidade: "Saque", descricoes: { 1: "Tem dificuldade em colocar a bola em jogo com regularidade.", 2: "Consegue sacar por baixo ou com pouca forca, mas ainda erra bastante direcao e distancia.", 3: "Saque regular. Coloca a bola em jogo com frequencia, mas ainda pressiona pouco a recepcao adversaria.", 4: "Bom saque. Consegue direcionar, variar forca e buscar zonas de dificuldade do adversario.", 5: "Saque muito eficiente. Pressiona constantemente, quebra a recepcao adversaria e consegue sacar bem mesmo em momentos decisivos." } }
        ]
    },
    {
        parte: "Habilidades Taticas",
        itens: [
            { id: "antecipacao", icone: "", habilidade: "Antecipacao", descricoes: { 1: "Reage tarde as jogadas e geralmente espera a bola chegar para decidir.", 2: "Comeca a perceber algumas situacoes, mas ainda demora a se ajustar.", 3: "Consegue antecipar jogadas simples, principalmente quando o adversario e previsivel.", 4: "Le bem o jogo e se posiciona antes da bola chegar em varias situacoes.", 5: "Antecipa com excelencia. Percebe padroes, preve acoes adversarias e se coloca em vantagem antes da jogada acontecer." } },
            { id: "tomadaDecisao", icone: "", habilidade: "Tomada de Decisao", descricoes: { 1: "Toma decisoes sem observar o contexto da jogada, muitas vezes escolhendo a opcao mais dificil ou arriscada.", 2: "Consegue tomar decisoes simples, mas se precipita quando esta sob pressao.", 3: "Decide de forma regular. Escolhe boas opcoes em situacoes faceis, mas ainda oscila em jogadas rapidas.", 4: "Toma boas decisoes na maioria das situacoes, adaptando sua acao ao posicionamento da equipe e do adversario.", 5: "Decide com inteligencia e rapidez. Escolhe a melhor opcao mesmo sob pressao e melhora o desempenho coletivo." } },
            { id: "leituraJogo", icone: "", habilidade: "Leitura de Jogo", descricoes: { 1: "Tem dificuldade em entender o posicionamento da propria equipe e do adversario.", 2: "Percebe algumas movimentacoes, mas ainda se perde nas rotacoes, coberturas e espacos vazios.", 3: "Entende o basico do jogo e consegue acompanhar a maioria das jogadas, mas ainda precisa de orientacao.", 4: "Le bem os espacos, identifica falhas adversarias e ajusta seu posicionamento durante o jogo.", 5: "Leitura avancada. Entende padroes, orienta colegas e usa a leitura para tomar decisoes estrategicas." } }
        ]
    },
    {
        parte: "Habilidades Socioemocionais",
        itens: [
            { id: "resiliencia", icone: "", habilidade: "Resiliencia", descricoes: { 1: "Desanima facilmente apos erros, criticas ou momentos dificeis.", 2: "Tenta continuar, mas ainda se abala bastante quando erra ou quando o time esta perdendo.", 3: "Consegue se recuperar de alguns erros, mas ainda oscila emocionalmente durante o jogo.", 4: "Mantem boa postura apos erros, aceita correcoes e continua contribuindo com o time.", 5: "Demonstra grande maturidade. Transforma erros em aprendizado, apoia colegas e mantem o foco em momentos decisivos." } },
            { id: "comunicacaoQuadra", icone: "", habilidade: "Comunicacao em Quadra", descricoes: { 1: "Quase nao se comunica ou fala em momentos inadequados, dificultando a organizacao da equipe.", 2: "Comunica algumas bolas, mas ainda com pouca clareza, volume ou frequencia.", 3: "Comunicacao regular. Chama bolas e orienta em algumas situacoes, mas ainda pode ser mais constante.", 4: "Boa comunicacao. Ajuda na organizacao, chama jogadas, orienta colegas e melhora a dinamica do time.", 5: "Comunicacao excelente. Lidera verbalmente, organiza a equipe, transmite seguranca e melhora o desempenho coletivo." } },
            { id: "trabalhoEquipe", icone: "", habilidade: "Trabalho em Equipe", descricoes: { 1: "Tem dificuldade em colaborar, ouvir colegas ou respeitar decisoes coletivas.", 2: "Participa do grupo, mas ainda precisa melhorar cooperacao, escuta e responsabilidade coletiva.", 3: "Trabalha bem em equipe na maior parte do tempo, mas ainda oscila em situacoes de pressao.", 4: "Coopera, apoia colegas, respeita funcoes e contribui para um ambiente positivo.", 5: "E referencia coletiva. Ajuda, orienta, incentiva, respeita e fortalece o grupo dentro e fora da quadra." } }
        ]
    }
];

function renderInfoCriteriosAvaliacaoDVC() {
  try {
    const grupos = Array.isArray(CRITERIOS_AVALIACAO_DVC)
      ? CRITERIOS_AVALIACAO_DVC
      : [];

    const gruposHtml = grupos.map(grupo => {
      const itens = Array.isArray(grupo.itens) ? grupo.itens : [];

      const itensHtml = itens.map(item => {
        const notasHtml = [1, 2, 3, 4, 5].map(nota => {
          const descricao = item.descricoes?.[nota] || "";

          return `
            <p class="text-[9px] leading-relaxed text-gray-600">
              <span class="font-black text-[#990000]">${nota}:</span>
              ${descricao}
            </p>
          `;
        }).join("");

        return `
          <details class="bg-white border border-gray-100 rounded-xl p-3">
            <summary class="cursor-pointer list-none text-[10px] font-black uppercase text-gray-800">
              <span class="mr-1"></span> 
            </summary>
            <div class="mt-2 space-y-2">
              
            </div>
          </details>
        `;
      }).join("");

      return `
        <div class="bg-gray-50 border border-gray-100 rounded-2xl p-3">
          <p class="text-[9px] font-black uppercase text-gray-500 mb-2"></p>
          <div class="space-y-2">
            
          </div>
        </div>
      `;
    }).join("");

    return `
      <details class="bg-white border border-red-100 rounded-2xl p-3 mb-4 shadow-sm">
        <summary class="cursor-pointer list-none flex items-center justify-between gap-3">
          <span class="text-[10px] font-black uppercase text-[#990000]">
            <i class="fa-solid fa-circle-info mr-1"></i>
            Entenda os critérios de avaliação
          </span>
          <span class="text-[8px] font-black uppercase text-gray-400">Abrir</span>
        </summary>

        <div class="mt-3 max-h-72 overflow-y-auto custom-scroll pr-1 space-y-3">
          ${gruposHtml}
        </div>
      </details>
    `;
  } catch (error) {
    console.warn("Erro ao renderizar critérios de avaliação:", error);
    return "";
  }
}

function usuarioTemHabilidadesReaisDVC(user = {}) {
    const habilidades = user?.habilidades || {};
    const chaves = typeof TODAS_HABILIDADES_DVC !== "undefined"
        ? TODAS_HABILIDADES_DVC.map(skill => skill.id)
        : Object.keys(habilidades);

    if (!habilidades || Object.keys(habilidades).length === 0) return false;

    return chaves.some(chave => {
        if (habilidades[chave] === undefined || habilidades[chave] === null || habilidades[chave] === "") return false;
        return Number(habilidades[chave]) !== 3;
    });
}

function usuarioTemAvaliacaoTecnicaRealDVC(user = {}) {
    return user?.habilidadesAvaliadasPorEquipe === true ||
        user?.habilidadesStatus === "Aprovada" ||
        !!user?.avaliadoEm ||
        !!user?.avaliadoPor ||
        usuarioTemHabilidadesReaisDVC(user);
}
window.usuarioTemAvaliacaoTecnicaRealDVC = usuarioTemAvaliacaoTecnicaRealDVC;

function usuarioPrecisaAutoAvaliacao(user = {}) {
    if (ehResponsavelTecnico(user)) return false;
    if (usuarioTemAvaliacaoTecnicaRealDVC(user)) return false;

    const status = String(user?.habilidadesStatus || "").trim().toLowerCase();
    if (status === "autoavaliacao pendente" || status === "autoavaliação pendente" || status === "pendente") return false;

    return true;
}

window.renderInfoCriteriosAvaliacaoDVC = renderInfoCriteriosAvaliacaoDVC;
window.usuarioPrecisaAutoAvaliacao = usuarioPrecisaAutoAvaliacao;

window.abrirModalAvaliacao = async (email, nome, habilidadesString = "") => {
    let h = {};

    try {
        // Busca sempre as habilidades mais atuais salvas no Firebase
        const userSnap = await getDoc(doc(db, "users", email));

        if (userSnap.exists()) {
            const dadosAvaliado = userSnap.data(); // NOME ALTERADO AQUI
            h = normalizarHabilidadesDVC(dadosAvaliado.habilidades || {}); // NOME ALTERADO AQUI TAMBÉM
        } else if (habilidadesString) {
            h = JSON.parse(habilidadesString);
        }
    } catch (e) {
        console.warn("Não foi possível carregar habilidades atuais. Usando dados locais:", e);

        try {
            h = habilidadesString ? JSON.parse(habilidadesString) : {};
        } catch (erroParse) {
            h = {};
        }
    }

    h = normalizarHabilidadesDVC(h);

const habilidadesLista = TODAS_HABILIDADES_DVC;

    let modal = `
    <div id="m-avalia" class="fixed inset-0 bg-black/80 z-[100] p-4 flex items-center justify-center">
        <div class="bg-white w-full max-w-sm rounded-2xl p-6 relative shadow-2xl max-h-[88vh] overflow-y-auto">
            <button onclick="document.getElementById('m-avalia').remove()" class="absolute top-4 right-4 text-gray-400 font-black text-xl">&times;</button>

            <h2 class="font-bold text-xs uppercase mb-2 border-b pb-2 text-[#990000]">
                Avaliar: ${nome}
            </h2>

            <p class="text-[9px] text-gray-400 font-bold uppercase mb-4">
                As notas atuais foram carregadas automaticamente.
            </p>

            ${renderInfoCriteriosAvaliacaoDVC()}

            <div class="space-y-4">
                ${habilidadesLista.map(skill => {
const notaAtual = Number(h[skill.id] ?? 3);

                    return `
                        <div class="flex justify-between items-center">
                            <label class="text-[10px] font-bold uppercase text-gray-600">
                                ${skill.nome}
                            </label>

                            <select id="sk-${skill.id}" class="p-2 border rounded text-xs font-bold w-20">
                                ${[1,2,3,4,5].map(n => `
                                    <option value="${n}" ${notaAtual === n ? 'selected' : ''}>
                                        ${n}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                    `;
                }).join('')}
            </div>

            <button onclick="salvarAvaliacao('${email}')" class="w-full bg-[#990000] text-white py-3 rounded-lg font-bold text-xs uppercase mt-6 shadow-md">
                Salvar Avaliação
            </button>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modal);
};

window.salvarAvaliacao = async (email) => {
    try {
        const listaHabilidades = typeof TODAS_HABILIDADES_DVC !== "undefined"
            ? TODAS_HABILIDADES_DVC
            : [
                { id: "recepcao", nome: "Recepção" },
                { id: "levantamento", nome: "Levantamento" },
                { id: "ataque", nome: "Ataque" },
                { id: "bloqueio", nome: "Bloqueio" },
                { id: "defesa", nome: "Defesa" },
                { id: "saque", nome: "Saque" },
                { id: "antecipacao", nome: "Antecipação" },
                { id: "tomadaDecisao", nome: "Tomada de Decisão" },
                { id: "leituraJogo", nome: "Leitura de Jogo" },
                { id: "resiliencia", nome: "Resiliência" },
                { id: "comunicacaoQuadra", nome: "Comunicação em Quadra" },
                { id: "trabalhoEquipe", nome: "Trabalho em Equipe" }
            ];

        const userRef = doc(db, "users", email);
        const userSnap = await getDoc(userRef);

        const habilidadesAnteriores = userSnap.exists()
            ? normalizarHabilidadesDVC(userSnap.data().habilidades || {})
            : normalizarHabilidadesDVC({});

        let habilidades = {};

        listaHabilidades.forEach(skill => {
            const campo = document.getElementById(`sk-${skill.id}`);
            habilidades[skill.id] = Number(campo?.value || 3);
        });

        const avaliadorNome = window.currentUserData?.nome || auth.currentUser?.email || "Equipe tecnica";

        await updateDoc(userRef, { 
            habilidades: habilidades,
            habilidadesAvaliadasPorEquipe: true,
            habilidadesStatus: "Aprovada",
            avaliadoEm: new Date().toISOString(),
            avaliadoPor: avaliadorNome,
            avaliadoPorEmail: auth.currentUser?.email || ""
        });

        try {
        for (const skill of listaHabilidades) {
            await registrarHistoricoHabilidade(
                email,
                skill.id,
                habilidadesAnteriores[skill.id],
                habilidades[skill.id],
                "Avaliação manual",
                `Atualização feita por ${window.currentUserData?.nome || "treinador"}`
            );
        }

        alert("Avaliação salva com sucesso!");

        } catch (erroHistoricoAvaliacaoManual) {
            console.warn("Historico da avaliacao manual nao foi registrado:", erroHistoricoAvaliacaoManual);
            alert("Avaliação salva com sucesso!");
        }

        limparCacheDados("atletas");
        limparCacheDados("avaliacoes");

        document.getElementById('m-avalia')?.remove();

        if (typeof window.filterAdminList === "function") {
            window.filterAdminList();
        }

    } catch (e) {
        console.error("Erro ao salvar avaliação:", e);
        alert("Não foi possível salvar a avaliação.");
    }
};
    async function carregarHistoricoHabilidadeHtml(emailAluno, criterio) {
    try {
        if (!emailAluno || !criterio) return "";

        const registrosDVC = await carregarHistoricoHabilidadesAtletaDVC(emailAluno);

        let registros = [];

        registrosDVC.forEach(item => {
            if (item.criterio !== criterio) return;

            registros.push({
                id: item.id,
                ...item
            });
        });

        registros.sort((a, b) => {
            const dataA = new Date(a.registradoEm || 0);
            const dataB = new Date(b.registradoEm || 0);
            return dataB - dataA;
        });

        registros = registros.slice(0, 3);

        if (registros.length === 0) {
            return `
                <div class="mt-3 bg-white border border-dashed rounded-lg p-2">
                    <p class="text-[8px] text-gray-400 font-bold uppercase">
                        Ainda não há histórico registrado para esta habilidade.
                    </p>
                </div>
            `;
        }

        return `
            <div class="mt-3 bg-white border rounded-lg p-2">
                <p class="text-[8px] text-gray-400 font-black uppercase mb-2">
                    Histórico recente
                </p>

                <div class="space-y-2">
                    ${registros.map(reg => {
                        const diff = Number(reg.diferenca || 0);
                        const sinal = diff > 0 ? "+" : "";
                        const cor = diff >= 0 ? "text-green-700" : "text-red-700";

                        return `
                            <div class="flex justify-between items-start gap-2 border-b last:border-0 pb-1">
                                <div>
                                    <p class="text-[9px] font-bold text-gray-700">
                                        ${reg.origem || "Atualização"}
                                    </p>
                                    <p class="text-[8px] text-gray-400 font-semibold">
                                        ${reg.registradoEm ? new Date(reg.registradoEm).toLocaleDateString("pt-BR") : ""}
                                    </p>
                                </div>

                                <span class="${cor} text-[9px] font-black">
                                    ${sinal}${diff.toFixed(1)}
                                </span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;

    } catch (e) {
        console.warn("Erro ao carregar histórico da habilidade:", e);

        return `
            <div class="mt-3 bg-white border border-dashed rounded-lg p-2">
                <p class="text-[8px] text-gray-400 font-bold uppercase">
                    Não foi possível carregar o histórico agora.
                </p>
            </div>
        `;
    }
}
const GRUPOS_HABILIDADES_DVC = {
    tecnicos: {
        nome: "Critérios Técnicos",
        cor: "#990000",
        habilidades: [
            { id: "recepcao", nome: "Recepção" },
            { id: "levantamento", nome: "Levantamento" },
            { id: "ataque", nome: "Ataque" },
            { id: "bloqueio", nome: "Bloqueio" },
            { id: "defesa", nome: "Defesa" },
            { id: "saque", nome: "Saque" }
        ]
    },

    taticos: {
        nome: "Critérios Táticos",
        cor: "#1d4ed8",
        habilidades: [
            { id: "antecipacao", nome: "Antecipação" },
            { id: "tomadaDecisao", nome: "Tomada de Decisão" },
            { id: "leituraJogo", nome: "Leitura de Jogo" }
        ]
    },

    socioemocionais: {
        nome: "Soft Skills",
        cor: "#7c2d12",
        habilidades: [
            { id: "resiliencia", nome: "Resiliência" },
            { id: "comunicacaoQuadra", nome: "Comunicação em Quadra" },
            { id: "trabalhoEquipe", nome: "Trabalho em Equipe" }
        ]
    }
};

const TODAS_HABILIDADES_DVC = [
    ...GRUPOS_HABILIDADES_DVC.tecnicos.habilidades,
    ...GRUPOS_HABILIDADES_DVC.taticos.habilidades,
    ...GRUPOS_HABILIDADES_DVC.socioemocionais.habilidades
];


function calcularScoreFuncaoDVC(habilidades = {}, funcaoId = "formacao") {
    const h = normalizarHabilidadesDVC(habilidades || {});
    const pesos = window.PESOS_FUNCAO_VOLEI_DVC[funcaoId] || {};

    // Se não houver função específica, usa o Score Geral
    if (!pesos || Object.keys(pesos).length === 0) {
        return calcularScoreGeralDVC(h);
    }

    let somaNotas = 0;
    let somaPesos = 0;

    TODAS_HABILIDADES_DVC.forEach(skill => {
        const peso = Number(pesos[skill.id] || 1);
        const nota = Number(h[skill.id] || 3);

        somaNotas += nota * peso;
        somaPesos += peso;
    });

    if (somaPesos === 0) return calcularScoreGeralDVC(h);

    return Number((somaNotas / somaPesos).toFixed(1));
}
function calcularScoreGeralDVC(habilidades = {}) {
    const h = normalizarHabilidadesDVC(habilidades);

    const valores = TODAS_HABILIDADES_DVC
        .map(skill => Number(h[skill.id] || 0))
        .filter(v => !isNaN(v) && v > 0);

    if (valores.length === 0) return 0;

    return Number((valores.reduce((a, b) => a + b, 0) / valores.length).toFixed(1));
}
window.calcularScoreGeralDVC = calcularScoreGeralDVC;
function getMesAtualAvaliacao() {
    const hoje = new Date();
    return hoje.getFullYear() + "-" + String(hoje.getMonth() + 1).padStart(2, "0");
}
window.abrirAvaliacaoColegas = async () => {
    try {
        const usuarios = await carregarAtletasCache();

        let atletas = [];

        usuarios.forEach(user => {
            const email = user.email || user.id || "";

            if (email === auth.currentUser.email) return;
            if (ehResponsavelTecnico(user)) return;
            if (user.status !== "Ativo") return;

            atletas.push({
                email,
                nome: user.nome || email
            });
        });

        atletas.sort((a, b) => a.nome.localeCompare(b.nome));

        if (atletas.length === 0) {
            alert("Nenhum colega disponível para avaliação.");
            return;
        }

        const options = atletas.map(a => `
            <option value="${a.email}">
                ${a.nome}
            </option>
        `).join('');

        const modal = `
            <div id="m-avaliacao-colegas" class="fixed inset-0 bg-black/80 z-[100] p-4 flex items-center justify-center">
                <div class="bg-white w-full max-w-sm rounded-2xl p-6 relative shadow-2xl max-h-[85vh] overflow-y-auto">
                    <button 
                        onclick="document.getElementById('m-avaliacao-colegas').remove()" 
                        class="absolute top-4 right-4 text-gray-400 font-black text-xl">
                        &times;
                    </button>

                    <h2 class="font-bold text-xs uppercase mb-4 border-b pb-2 text-[#990000]">
                        Avaliação entre colegas
                    </h2>

                    <p class="text-[10px] text-gray-500 font-semibold mb-4 leading-relaxed">
                        Escolha um colega e avalie de 1 a 5. Essa avaliação será combinada com a nota do treinador.
                    </p>

                    <label class="text-[9px] font-black text-gray-400 uppercase">
                        Colega avaliado
                    </label>

                    <select id="peer-email" onchange="atualizarBotaoAvaliacaoColegaDVC()" class="w-full p-2 border rounded text-xs font-bold mb-4 bg-gray-50">
                        <option value="">Selecione um colega</option>
                        ${options}
                    </select>

                    <div class="space-y-4">
                        ${[
                            { id: 'resiliencia', nome: 'Resiliência' },
                            { id: 'comunicacaoQuadra', nome: 'Comunicação em Quadra' },
                            { id: 'trabalhoEquipe', nome: 'Trabalho em Equipe' }
                             ].map(item => `
                            <div class="flex justify-between items-center">
                                <label class="text-[10px] font-bold uppercase text-gray-600">
                                    ${item.nome}
                                </label>

                                <select id="peer-${item.id}" class="p-2 border rounded text-xs font-bold w-20">
                                    ${[1,2,3,4,5].map(n => `<option value="${n}">${n}</option>`).join('')}
                                </select>
                            </div>
                        `).join('')}
                    </div>

                    <button
                        id="btn-salvar-avaliacao-colega"
                        onclick="salvarAvaliacaoColega()"
                        disabled
                        class="hidden w-full bg-indigo-700 text-white py-3 rounded-lg font-bold text-xs uppercase mt-6 shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
                        Enviar avaliação
                    </button>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modal);

    } catch (e) {
        console.error("Erro ao abrir avaliação entre colegas:", e);
        alert("Não foi possível abrir a avaliação entre colegas.");
    }
};

function atualizarBotaoAvaliacaoColegaDVC() {
    const select = document.getElementById("peer-email");
    const botao = document.getElementById("btn-salvar-avaliacao-colega");
    if (!select || !botao) return;

    const temColegaSelecionado = String(select.value || "").trim() !== "";
    botao.disabled = !temColegaSelecionado;
    botao.classList.toggle("hidden", !temColegaSelecionado);
}

window.atualizarBotaoAvaliacaoColegaDVC = atualizarBotaoAvaliacaoColegaDVC;

window.salvarAvaliacaoColega = async () => {
    try {
        const avaliadoEmail = document.getElementById('peer-email').value;

        if (!avaliadoEmail) {
            return alert("Selecione um colega para avaliar.");
        }

        if (avaliadoEmail === auth.currentUser.email) {
            return alert("Você não pode avaliar a si mesmo.");
        }

        const mes = getMesAtualAvaliacao();
        const avaliadorEmail = auth.currentUser.email;

        const idAvaliado = avaliadoEmail.replace(/[^a-zA-Z0-9]/g, "_");
        const idAvaliador = avaliadorEmail.replace(/[^a-zA-Z0-9]/g, "_");

        const docId = `${mes}_${idAvaliado}_${idAvaliador}`;

        const avaliacaoRef = doc(db, "avaliacoesPares", docId);
        const avaliacaoSnap = await getDoc(avaliacaoRef);

        if (avaliacaoSnap.exists()) {
            return alert("Você já avaliou este colega neste mês.");
        }

        const resiliencia = Number(document.getElementById('peer-resiliencia').value);
const comunicacaoQuadra = Number(document.getElementById('peer-comunicacaoQuadra').value);
const trabalhoEquipe = Number(document.getElementById('peer-trabalhoEquipe').value);

        await setDoc(avaliacaoRef, {
            avaliadorEmail: avaliadorEmail,
            avaliadorNome: window.currentUserData.nome || "",
            avaliadoEmail: avaliadoEmail,
            mes: mes,
            resiliencia: resiliencia,
            comunicacaoQuadra: comunicacaoQuadra,
            trabalhoEquipe: trabalhoEquipe,
            criadoEm: new Date().toISOString()
        });

        limparCacheDados("avaliacoes");
        limparCacheAvaliacoesPares();
        alert("Avaliação enviada com sucesso!");

        document.getElementById('m-avaliacao-colegas')?.remove();

        if (window.__abaAtualDVC === "home") renderHome();
        if (window.__abaAtualDVC === "profile") renderProfile();

    } catch (e) {
        console.error("Erro ao salvar avaliação entre colegas:", e);
        alert("Não foi possível salvar a avaliação agora. Verifique as permissões do Firebase.");
    }
};

async function usuarioTemAvaliacaoColegaPendenteDVC() {
    if (!auth.currentUser?.email) return false;
    if (typeof window.usuarioPodeAprovarAvaliacoes === "function" && window.usuarioPodeAprovarAvaliacoes()) {
        return false;
    }
    if (typeof window.usuarioEhEquipeTecnica === "function" && window.usuarioEhEquipeTecnica()) {
        return false;
    }
    try {
        const mes = getMesAtualAvaliacao();
        const emailAvaliador = String(auth.currentUser.email).trim().toLowerCase();
        
        // Uses DVC_CACHE if available and fresh (TTL 2m)
        const avaliacoes = await carregarAvaliacoesParesDVC(false);
        const jaAvaliou = avaliacoes.some(av => 
            String(av.mes || "").trim() === mes && 
            String(av.avaliadorEmail || "").trim().toLowerCase() === emailAvaliador
        );
        return !jaAvaliou;
    } catch (e) {
        console.warn("Erro ao verificar pendência de avaliação de colega:", e);
        return false;
    }
}
window.usuarioTemAvaliacaoColegaPendenteDVC = usuarioTemAvaliacaoColegaPendenteDVC;

async function calcularMediaAvaliacoesPares(emailAvaliado, snapExistente = null) {
    try {
        const mes = getMesAtualAvaliacao();
        let docs = [];

        if (snapExistente && typeof snapExistente.forEach === 'function') {
            snapExistente.forEach(docAvaliacao => docs.push(docAvaliacao.data()));
        } else {
            docs = await carregarAvaliacoesParesDVC();
        }

        let soma = {
            resiliencia: 0,
            comunicacaoQuadra: 0,
            trabalhoEquipe: 0
        };

        let total = 0;

        docs.forEach(av => {
            if (av.mes !== mes) return;
            if (av.avaliadoEmail !== emailAvaliado) return;

            soma.resiliencia += Number(av.resiliencia || 0);
            soma.comunicacaoQuadra += Number(av.comunicacaoQuadra || 0);
            soma.trabalhoEquipe += Number(av.trabalhoEquipe || 0);

            total++;
        });

        if (total === 0) {
            return null;
        }

       return {
                total,
                resiliencia: Number((soma.resiliencia / total).toFixed(1)),
                comunicacaoQuadra: Number((soma.comunicacaoQuadra / total).toFixed(1)),
                trabalhoEquipe: Number((soma.trabalhoEquipe / total).toFixed(1))
                 };

    } catch (e) {
        console.error("Erro ao calcular média de pares:", e);
        return null;
    }
}

const CRITERIOS_AVALIACAO_EQUIPE_DVC = [
    {
        id: "clarezaOrientacoes",
        titulo: "Clareza nas orientações",
        apoio: "O treinador explica exercícios, posicionamentos e correções de forma compreensívelá"
    },
    {
        id: "organizacaoTreino",
        titulo: "Organização do treino",
        apoio: "O treino tem sequência, aproveita bem o tempo e evita desorganização?"
    },
    {
        id: "respeitoAcolhimento",
        titulo: "Respeito e acolhimento",
        apoio: "O treinador trata os atletas com respeito, escuta e postura adequada?"
    },
    {
        id: "correcoesTecnicas",
        titulo: "Correções técnicas",
        apoio: "O treinador ajuda o atleta a melhorar, explicando o que precisa corrigir?"
    },
    {
        id: "comunicacaoQuadra",
        titulo: "Comunicação em quadra",
        apoio: "O treinador se comunica bem durante treinos, jogos e momentos de pressão?"
    },
    {
        id: "justicaEquilibrio",
        titulo: "Justiça e equilábrio",
        apoio: "O treinador dá oportunidades, evita favoritismo e conduz escolhas com clareza?"
    },
    {
        id: "motivacaoConfianca",
        titulo: "Motivação e confiança",
        apoio: "O treinador incentiva o grupo e ajuda os atletas a continuarem evoluindo?"
    },
    {
        id: "segurancaCuidado",
        titulo: "Segurança e cuidado",
        apoio: "O treinador se preocupa com limites físicos, lesões e ambiente saudávelá"
    },
    {
        id: "compromissoProjeto",
        titulo: "Compromisso com o projeto",
        apoio: "O treinador demonstra presença, responsabilidade e compromisso com o DVC?"
    },
    {
        id: "notaGeral",
        titulo: "Nota geral do mês",
        apoio: "Como você avalia a atuação geral desta pessoa neste mês?"
    }
];

        // [CATEGORIAS_AVISOS_DVC and PRIORIDADES_AVISOS_DVC extracted to js/mural.js]



function obterMesAtualAvaliacaoTecnicaDVC(data = new Date()) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    return `${ano}-${mes}`;
}

window.obterMesAtualAvaliacaoTecnicaDVC = obterMesAtualAvaliacaoTecnicaDVC;

function getIdAvaliacaoEquipeTecnicaDVC(mes, avaliadorEmail, avaliadoEmail) {
    return `${mes}_${normalizarEmailIdDVC(avaliadorEmail)}_${normalizarEmailIdDVC(avaliadoEmail)}`;
}

function usuarioPodeAvaliarEquipeTecnicaDVC(user = window.currentUserData) {
    if (!auth.currentUser?.email) return false;

    const funcao = normalizarFuncaoTecnica(user?.funcao);
    if (funcao === "adm" || funcao === "treinador") return false;

    return true;
}

async function carregarAvaliacoesEquipeTecnicaCache(forcar = false) {
    if (!usuarioEhADM()) return [];
    if (!forcar && window.AppCache.avaliacoesEquipeTecnica) return window.AppCache.avaliacoesEquipeTecnica;

    const snap = await getDocs(collection(db, "avaliacoesEquipeTecnica"));
    window.AppCache.avaliacoesEquipeTecnica = snapshotToArray(snap);
    return window.AppCache.avaliacoesEquipeTecnica;
}

async function usuarioTemAvaliacoesEquipePendentesDVC() {
    if (!usuarioPodeAvaliarEquipeTecnicaDVC()) return false;

    try {
        const mes = obterMesAtualAvaliacaoTecnicaDVC();
        const emailAtual = String(auth.currentUser?.email || "").trim().toLowerCase();
        const usuarios = await carregarAtletasCache();
        const equipe = usuarios.filter(user => {
            const email = String(user.email || user.id || "").trim().toLowerCase();
            return ehResponsavelTecnico(user) && email && email !== emailAtual;
        });

        if (!equipe.length) return false;

        const verificacoes = await Promise.allSettled(equipe.map(user => {
            const emailAvaliado = String(user.email || user.id || "").trim().toLowerCase();
            const id = getIdAvaliacaoEquipeTecnicaDVC(mes, emailAtual, emailAvaliado);
            return getDoc(doc(db, "avaliacoesEquipeTecnica", id));
        }));

        return verificacoes.some(resultado => resultado.status === "fulfilled" && !resultado.value.exists());
    } catch (erro) {
        console.warn("Não foi possível verificar avaliação mensal pendente:", erro);
        return false;
    }
}

async function renderAvaliacaoMensalEquipeDVC(contexto = "home", pendenciaConhecida = null) {
    if (usuarioEhADM()) {
        if (contexto !== "perfil") return "";

        return `
            <section class="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                <div class="flex items-start gap-3">
                    <div class="w-11 h-11 rounded-2xl bg-gray-950 text-white flex items-center justify-center shrink-0">
                        <i class="fa-solid fa-chart-line"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-[10px] font-black uppercase text-[#990000]">Avaliações da equipe técnica</p>
                        <h3 class="text-sm font-black uppercase text-gray-900 leading-tight mt-1">Resultados no Painel Administrativo</h3>
                        <p class="text-[10px] font-semibold text-gray-500 leading-relaxed mt-1">
                            As médias e comentários ficam restritos ao ADM para acompanhamento cuidadoso do projeto.
                        </p>
                        <button onclick="changeTab('admin')" class="mt-3 w-full bg-gray-950 text-white rounded-2xl py-3 text-[10px] font-black uppercase shadow-sm">
                            Ver painel
                        </button>
                    </div>
                </div>
            </section>
        `;
    }

    if (!usuarioPodeAvaliarEquipeTecnicaDVC()) return "";

    const temPendencia = pendenciaConhecida === null
        ? await usuarioTemAvaliacoesEquipePendentesDVC()
        : pendenciaConhecida;

    if (!temPendencia) return "";

    const compacto = contexto === "home";

    return `
        <section class="bg-white border ${temPendencia ? "border-red-100" : "border-green-100"} rounded-2xl p-4 shadow-sm ${compacto ? "" : "mb-4"}">
            <div class="flex items-start gap-3">
                <div class="w-11 h-11 rounded-2xl ${temPendencia ? "bg-red-50 border-red-100" : "bg-green-50 border-green-100"} border flex items-center justify-center shrink-0">
                    <i class="fa-solid ${temPendencia ? "fa-comments" : "fa-circle-check"} ${temPendencia ? "text-[#990000]" : "text-green-700"}"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-[10px] font-black uppercase text-[#990000]">Avaliação mensal disponível</p>
                    <h3 class="text-sm font-black uppercase text-gray-900 leading-tight mt-1">Avaliar equipe técnica</h3>
                    <p class="text-[10px] font-semibold text-gray-500 leading-relaxed mt-1">
                        Sua opinião ajuda a melhorar nossos treinos, a comunicação e o cuidado com o grupo.
                    </p>
                    <button onclick="abrirModalAvaliacaoEquipeTecnica()" class="mt-3 w-full bg-[#990000] text-white rounded-2xl py-3 text-[10px] font-black uppercase shadow-sm">
                        Avaliar equipe técnica
                    </button>
                </div>
            </div>
        </section>
    `;
}

window.renderAvaliacaoMensalEquipeDVC = renderAvaliacaoMensalEquipeDVC;

function renderBotoesNotaAvaliacaoEquipeDVC(emailSeguro, criterioId) {
    return `
        <input type="hidden" id="avtec-${emailSeguro}-${criterioId}" value="">
        <div class="grid grid-cols-5 gap-1 mt-2">
            ${[1, 2, 3, 4, 5].map(nota => `
                <button type="button"
                    data-grupo-nota="${emailSeguro}-${criterioId}"
                    onclick="selecionarNotaAvaliacaoEquipeTecnica(this, '${emailSeguro}', '${criterioId}', ${nota})"
                    class="rounded-xl border border-gray-200 bg-white text-gray-500 py-2 text-[10px] font-black active:scale-95 transition">
                    ${nota}
                </button>
            `).join("")}
        </div>
    `;
}

window.selecionarNotaAvaliacaoEquipeTecnica = (botao, emailSeguro, criterioId, nota) => {
    const input = document.getElementById(`avtec-${emailSeguro}-${criterioId}`);
    if (input) input.value = String(nota);

    document.querySelectorAll(`[data-grupo-nota="${emailSeguro}-${criterioId}"]`).forEach(item => {
        item.classList.remove("bg-[#990000]", "text-white", "border-[#990000]", "shadow-sm");
        item.classList.add("bg-white", "text-gray-500", "border-gray-200");
    });

    if (botao) {
        botao.classList.remove("bg-white", "text-gray-500", "border-gray-200");
        botao.classList.add("bg-[#990000]", "text-white", "border-[#990000]", "shadow-sm");
    }

    atualizarBotaoAvaliacaoEquipeTecnicaDVC(emailSeguro);
};

function atualizarBotaoAvaliacaoEquipeTecnicaDVC(emailSeguro) {
    const botao = document.getElementById(`btn-enviar-avtec-${emailSeguro}`);
    if (!botao) return;

    const todosCriteriosSelecionados = CRITERIOS_AVALIACAO_EQUIPE_DVC.every(criterio => {
        const valor = Number(document.getElementById(`avtec-${emailSeguro}-${criterio.id}`)?.value || 0);
        return Number.isFinite(valor) && valor >= 1 && valor <= 5;
    });

    botao.disabled = !todosCriteriosSelecionados;
    botao.classList.toggle("hidden", !todosCriteriosSelecionados);
}

window.atualizarBotaoAvaliacaoEquipeTecnicaDVC = atualizarBotaoAvaliacaoEquipeTecnicaDVC;

window.abrirModalAvaliacaoEquipeTecnica = async () => {
    if (!usuarioPodeAvaliarEquipeTecnicaDVC()) {
        return alert("Esta avaliação é destinada aos atletas do projeto.");
    }

    try {
        const emailAtual = String(auth.currentUser?.email || "").trim().toLowerCase();
        const mes = obterMesAtualAvaliacaoTecnicaDVC();
        const usuarios = await carregarAtletasCache();
        const equipe = usuarios
            .filter(user => {
                const email = String(user.email || user.id || "").trim().toLowerCase();
                return ehResponsavelTecnico(user) && email && email !== emailAtual;
            })
            .sort((a, b) => String(a.nome || "").localeCompare(String(b.nome || "")));

        if (!equipe.length) {
            return alert("Nenhum responsável técnico encontrado para avaliação.");
        }

        const statusAvaliacoes = await Promise.allSettled(equipe.map(async user => {
            const email = String(user.email || user.id || "").trim().toLowerCase();
            const id = getIdAvaliacaoEquipeTecnicaDVC(mes, emailAtual, email);
            const snap = await getDoc(doc(db, "avaliacoesEquipeTecnica", id));
            return { email, enviada: snap.exists() };
        }));

        const enviados = new Map();
        statusAvaliacoes.forEach(resultado => {
            if (resultado.status === "fulfilled") {
                enviados.set(resultado.value.email, resultado.value.enviada);
            }
        });

        document.getElementById("m-avaliacao-equipe-tecnica")?.remove();

        const modal = `
            <div id="m-avaliacao-equipe-tecnica" class="fixed inset-0 bg-black/80 z-[110] p-4 flex items-center justify-center">
                <div class="bg-white w-full max-w-sm rounded-3xl shadow-2xl max-h-[88vh] overflow-y-auto">
                    <div class="sticky top-0 z-10 bg-gradient-to-r from-gray-950 via-[#4b0d0d] to-[#990000] text-white p-4 flex items-start justify-between gap-3">
                        <div>
                            <p class="text-[8px] font-black uppercase text-white/60">Avaliação mensal ${escaparHtml(mes)}</p>
                            <h3 class="text-sm font-black uppercase">Equipe técnica DVC</h3>
                            <p class="text-[9px] font-semibold text-white/70 mt-1">
                                Escreva com respeito. A avaliação serve para melhorar o projeto.
                            </p>
                        </div>
                        <button onclick="document.getElementById('m-avaliacao-equipe-tecnica')?.remove()" class="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                            <i class="fa-solid fa-xmark text-xs"></i>
                        </button>
                    </div>

                    <div class="p-4 space-y-3">
                        ${equipe.map(user => {
                            const email = String(user.email || user.id || "").trim().toLowerCase();
                            const emailSeguro = normalizarEmailIdDVC(email);
                            const enviada = enviados.get(email) === true;

                            return `
                                <details class="bg-white border border-gray-100 rounded-2xl p-3 shadow-sm" ${!enviada ? "" : ""}>
                                    <summary class="cursor-pointer list-none flex items-center justify-between gap-3">
                                        <div class="min-w-0">
                                            <p class="text-xs font-black uppercase text-gray-900 truncate">${escaparHtml(user.nome || email)}</p>
                                            <p class="text-[8px] font-bold uppercase text-gray-400">${escaparHtml(user.funcao || "Equipe técnica")}</p>
                                        </div>
                                        ${enviada ? renderBadgeDVC("Avaliação enviada", "verde") : renderBadgeDVC("Avaliar", "vermelho")}
                                    </summary>

                                    ${enviada ? `
                                        <div class="mt-3 bg-green-50 border border-green-100 rounded-xl p-3">
                                            <p class="text-[10px] font-bold text-green-700 uppercase">
                                                Você já enviou esta avaliação neste mês.
                                            </p>
                                        </div>
                                    ` : `
                                        <div class="mt-3 space-y-3">
                                            ${CRITERIOS_AVALIACAO_EQUIPE_DVC.map(criterio => `
                                                <div class="bg-gray-50 border border-gray-100 rounded-2xl p-3">
                                                    <p class="text-[10px] font-black uppercase text-gray-900">${escaparHtml(criterio.titulo)}</p>
                                                    <p class="text-[9px] font-semibold text-gray-500 leading-relaxed mt-1">${escaparHtml(criterio.apoio)}</p>
                                                    ${renderBotoesNotaAvaliacaoEquipeDVC(emailSeguro, criterio.id)}
                                                </div>
                                            `).join("")}

                                            <div class="bg-red-50 border border-red-100 rounded-2xl p-3">
                                                <p class="text-[9px] font-black uppercase text-[#990000] mb-2">Comentário opcional</p>
                                                <textarea id="avtec-pos-${emailSeguro}" class="w-full min-h-[76px] border border-red-100 bg-white rounded-xl p-3 text-xs font-semibold outline-none mb-2" maxlength="500" placeholder="O que essa pessoa fez bem neste mês?"></textarea>
                                                <textarea id="avtec-mel-${emailSeguro}" class="w-full min-h-[76px] border border-red-100 bg-white rounded-xl p-3 text-xs font-semibold outline-none" maxlength="500" placeholder="O que poderia melhorar?"></textarea>
                                            </div>

                                            <button id="btn-enviar-avtec-${emailSeguro}" onclick="enviarAvaliacaoEquipeTecnica('${email}')" disabled class="hidden w-full bg-[#990000] text-white py-3 rounded-2xl text-[10px] font-black uppercase shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                                                Enviar avaliação
                                            </button>
                                        </div>
                                    `}
                                </details>
                            `;
                        }).join("")}
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML("beforeend", modal);
    } catch (erro) {
        console.error("Erro ao abrir avaliação mensal da equipe técnica:", erro);
        alert("Não foi possível abrir a avaliação mensal agora.");
    }
};

window.enviarAvaliacaoEquipeTecnica = async (avaliadoEmail) => {
    if (!usuarioPodeAvaliarEquipeTecnicaDVC()) {
        return alert("Esta avaliação é destinada aos atletas do projeto.");
    }

    try {
        const emailAvaliado = String(avaliadoEmail || "").trim().toLowerCase();
        const emailAvaliador = String(auth.currentUser?.email || "").trim().toLowerCase();

        if (!emailAvaliado || !emailAvaliador) return alert("Não foi possível identificar os e-mails da avaliação.");
        if (emailAvaliado === emailAvaliador) return alert("Não é permitido avaliar a si mesmo.");

        const mes = obterMesAtualAvaliacaoTecnicaDVC();
        const docId = getIdAvaliacaoEquipeTecnicaDVC(mes, emailAvaliador, emailAvaliado);
        const refAvaliacao = doc(db, "avaliacoesEquipeTecnica", docId);
        const existente = await getDoc(refAvaliacao);

        if (existente.exists()) {
            return alert("Você já avaliou esta pessoa neste mês.");
        }

        const emailSeguro = normalizarEmailIdDVC(emailAvaliado);
        const notas = {};

        for (const criterio of CRITERIOS_AVALIACAO_EQUIPE_DVC) {
            const valor = Number(document.getElementById(`avtec-${emailSeguro}-${criterio.id}`)?.value || 0);
            if (!Number.isFinite(valor) || valor < 1 || valor > 5) {
                return alert(`Selecione uma nota de 1 a 5 para: ${criterio.titulo}`);
            }
            notas[criterio.id] = valor;
        }

        const usuarios = await carregarAtletasCache();
        const avaliado = usuarios.find(user => String(user.email || user.id || "").trim().toLowerCase() === emailAvaliado) || {};

        await setDoc(refAvaliacao, {
            mes,
            avaliadorEmail: emailAvaliador,
            avaliadorNome: window.currentUserData?.nome || auth.currentUser?.displayName || emailAvaliador,
            avaliadoEmail: emailAvaliado,
            avaliadoNome: avaliado.nome || emailAvaliado,
            avaliadoFuncao: avaliado.funcao || "Equipe técnica",
            ...notas,
            pontoPositivo: String(document.getElementById(`avtec-pos-${emailSeguro}`)?.value || "").trim(),
            pontoMelhoria: String(document.getElementById(`avtec-mel-${emailSeguro}`)?.value || "").trim(),
            criadoEm: new Date().toISOString(),
            atualizadoEm: new Date().toISOString()
        });

        limparCacheDados("avaliacoesEquipeTecnica");
        limparCacheAvaliacoesEquipeTecnica();
        alert("Avaliação enviada. Obrigado por ajudar a melhorar o projeto.");
        await abrirModalAvaliacaoEquipeTecnica();

        if (window.__abaAtualDVC === "home") renderHome();
        if (window.__abaAtualDVC === "profile") renderProfile();
    } catch (erro) {
        console.error("Erro ao enviar avaliação mensal da equipe técnica:", erro);
        alert("Não foi possível enviar a avaliação. Se você já avaliou esta pessoa no mês, a duplicidade foi bloqueada.");
    }
};

function mediaNumericaDVC(lista = []) {
    const valores = lista.map(Number).filter(valor => Number.isFinite(valor));
    if (!valores.length) return 0;
    return valores.reduce((total, valor) => total + valor, 0) / valores.length;
}

window.renderPainelAvaliacoesEquipeTecnica = async () => {
    const alvo = document.getElementById("box-avaliacoes-equipe-tecnica");
    if (!alvo || !usuarioEhADM()) return "";

    try {
        const mesAtual = obterMesAtualAvaliacaoTecnicaDVC();
        const mesSelecionado = document.getElementById("filtro-mes-avaliacao-equipe-dvc")?.value || mesAtual;
        const avaliacoes = (await carregarAvaliacoesEquipeTecnicaCache()).filter(av => av.mes === mesSelecionado);
        const grupos = new Map();

        avaliacoes.forEach(av => {
            const email = String(av.avaliadoEmail || "").trim().toLowerCase();
            if (!email) return;
            if (!grupos.has(email)) grupos.set(email, []);
            grupos.get(email).push(av);
        });
        
        const cards = Array.from(grupos.entries())
            .sort((a, b) => String(a[1][0]?.avaliadoNome || "").localeCompare(String(b[1][0]?.avaliadoNome || "")))
            .map(([email, lista]) => {
                const base = lista[0] || {};
                const mediaGeral = mediaNumericaDVC(lista.map(item => item.notaGeral));
                const positivos = lista.map(item => String(item.pontoPositivo || "").trim()).filter(Boolean);
                const melhorias = lista.map(item => String(item.pontoMelhoria || "").trim()).filter(Boolean);

                return `
                    <article class="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                        <div class="flex items-start justify-between gap-3 mb-3">
                            <div class="min-w-0">
                                <p class="text-xs font-black uppercase text-gray-900 truncate">${escaparHtml(base.avaliadoNome || email)}</p>
                                <p class="text-[8px] font-bold uppercase text-gray-400">${escaparHtml(base.avaliadoFuncao || "Equipe técnica")}</p>
                            </div>
                            <div class="text-right shrink-0">
                                <p class="text-2xl font-black text-[#990000]">${mediaGeral.toFixed(1)}</p>
                                <p class="text-[8px] font-black uppercase text-gray-400">${lista.length} resposta(s)</p>
                            </div>
                        </div>

                        ${lista.length < 3 ? `
                            <div class="bg-yellow-50 border border-yellow-100 text-yellow-800 rounded-xl p-3 mb-3">
                                <p class="text-[9px] font-black uppercase">Poucas respostas para análise segura.</p>
                            </div>
                        ` : ""}

                        <div class="space-y-2">
                            ${CRITERIOS_AVALIACAO_EQUIPE_DVC.map(criterio => {
                                const media = mediaNumericaDVC(lista.map(item => item[criterio.id]));
                                return `
                                    <div>
                                        <div class="flex justify-between gap-2 mb-1">
                                            <span class="text-[8px] font-black uppercase text-gray-500">${escaparHtml(criterio.titulo)}</span>
                                            <span class="text-[8px] font-black text-[#990000]">${media.toFixed(1)}</span>
                                        </div>
                                        <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div class="h-full bg-[#990000]" style="width:${Math.max(0, Math.min(100, (media / 5) * 100))}%"></div>
                                        </div>
                                    </div>
                                `;
                            }).join("")}
                        </div>
                        <details class="mt-3 bg-gray-50 border border-gray-100 rounded-xl p-3">
                            <summary class="cursor-pointer text-[9px] font-black uppercase text-gray-700">Comentários enviados</summary>
                            <div class="mt-3 space-y-3">
                                <div>
                                    <p class="text-[8px] font-black uppercase text-green-700 mb-1">Pontos positivos</p>
                                    ${positivos.length ? positivos.map(texto => `<p class="text-[10px] font-semibold text-gray-600 leading-relaxed bg-white border border-gray-100 rounded-xl p-2">${texto}</p>`).join("") : `<p class="text-[9px] font-bold text-gray-400 uppercase">Sem comentários.</p>`}
                                </div>
                                <div>
                                    <p class="text-[8px] font-black uppercase text-[#990000] mb-1">Pontos de melhoria</p>
                                    ${melhorias.length ? melhorias.map(texto => `<p class="text-[10px] font-semibold text-gray-600 leading-relaxed bg-white border border-gray-100 rounded-xl p-2">${texto}</p>`).join("") : `<p class="text-[9px] font-bold text-gray-400 uppercase">Sem comentários.</p>`}
                                </div>
                            </div>
                        </details>
                    </article>
                `;
            });

        alvo.innerHTML = `
            <section class="bg-white border border-gray-100 rounded-3xl p-4 shadow-sm mb-5">
                <label class="block text-[8px] font-black uppercase text-gray-400 mb-1">Mês</label>
                <input id="filtro-mes-avaliacao-equipe-dvc" type="month" value="${escaparHtml(mesSelecionado)}" onchange="renderPainelAvaliacoesEquipeTecnica()" class="w-full border rounded-2xl p-3 text-xs font-black uppercase bg-gray-50 mb-3">
                ${cards.join("") || `
                    <div class="bg-gray-50 border border-dashed rounded-2xl p-4 text-center">
                        <p class="text-[10px] font-bold text-gray-400 uppercase">Nenhuma avaliação recebida neste mês.</p>
                    </div>
                `}
            </section>
        `;

        return alvo.innerHTML;
    } catch (err) {
        console.error("Erro ao renderizar painel de avaliações da equipe técnica:", err);
        alvo.innerHTML = `<p class="text-xs text-red-500 font-semibold p-4 text-center border border-red-100 rounded-2xl bg-red-50">Erro ao carregar avaliações.</p>`;
        return alvo.innerHTML;
    }
};

function getAutoAvaliacaoDocIdDVC(email = "") {
    return String(email || "").trim().toLowerCase().replace(/[\/\\#?\[\]]/g, "_");
}

async function usuarioTemHistoricoHabilidadesDVC(email = "") {
    try {
        const emailLimpo = String(email || "").trim().toLowerCase();
        if (!emailLimpo) return false;

        const registros = await carregarHistoricoHabilidadesAtletaDVC(emailLimpo);
        return registros.length > 0;
    } catch (e) {
        console.warn("Nao foi possivel verificar historico de habilidades:", e);
        return false;
    }
}

async function registrarHistoricoHabilidadeSeguroDVC(emailAluno, criterio, valorAnterior, valorNovo, origem = "Avaliacao", detalhes = "") {
    try {
        const anterior = Number(valorAnterior || 0);
        const novo = Number(valorNovo || 0);

        if (anterior === novo) return;

        await addDoc(collection(db, "users", emailAluno, "historicoHabilidades"), {
            criterio,
            valorAnterior: anterior,
            valorNovo: novo,
            diferenca: Number((novo - anterior).toFixed(1)),
            origem,
            detalhes,
            registradoEm: new Date().toISOString(),
            registradoPor: window.currentUserData?.nome || auth.currentUser?.email || "Sistema",
            registradoPorEmail: auth.currentUser?.email || ""
        });
        limparCacheHistoricoHabilidades(emailAluno);
    } catch (e) {
        console.warn("Nao foi possivel registrar historico de habilidade:", e);
    }
}

async function usuarioPrecisaAutoAvaliacaoComHistoricoDVC(user = {}, email = "") {
    if (!usuarioPrecisaAutoAvaliacao(user)) return false;
    if (await usuarioTemHistoricoHabilidadesDVC(email || user.email || "")) return false;

    try {
        const docId = getAutoAvaliacaoDocIdDVC(email || user.email || "");
        if (!docId) return true;

        const autoSnap = await getDoc(doc(db, "autoAvaliacoesHabilidades", docId));
        if (!autoSnap.exists()) return true;

        const status = String(autoSnap.data().status || "").trim();
        return status === "Recusada";
    } catch (e) {
        console.warn("Nao foi possivel verificar autoavaliacao pendente:", e);
        return true;
    }
}

function coletarHabilidadesAutoAvaliacaoDVC() {
    const habilidades = {};

    TODAS_HABILIDADES_DVC.forEach(skill => {
        const campo = document.getElementById(`autoav-${skill.id}`);
        habilidades[skill.id] = Number(campo?.value || 3);
    });

    return habilidades;
}

function renderCamposAvaliacaoHabilidadesDVC(prefixoId = "autoav", valores = {}) {
    const normalizadas = normalizarHabilidadesDVC(valores || {});

    return TODAS_HABILIDADES_DVC.map(skill => `
        <div class="flex justify-between items-center border-b border-gray-100 py-2">
            <label class="text-[10px] font-black uppercase text-gray-600">${skill.nome}</label>
            <select id="${prefixoId}-${skill.id}" class="p-2 border rounded-lg text-xs font-black bg-gray-50 w-20 text-center">
                ${[1, 2, 3, 4, 5].map(n => `
                    <option value="${n}" ${Number(normalizadas[skill.id] || 3) === n ? "selected" : ""}>${n}</option>
                `).join("")}
            </select>
        </div>
    `).join("");
}

window.abrirModalAutoAvaliacaoObrigatoria = async () => {
    if (document.getElementById("m-autoavaliacao-obrigatoria")) return;

    const email = String(auth.currentUser?.email || "").trim().toLowerCase();
    const docId = getAutoAvaliacaoDocIdDVC(email);
    let autoData = null;

    try {
        const autoSnap = await getDoc(doc(db, "autoAvaliacoesHabilidades", docId));
        autoData = autoSnap.exists() ? autoSnap.data() : null;
    } catch (e) {
        console.warn("Nao foi possivel carregar autoavaliacao existente:", e);
    }

    const status = String(autoData?.status || "").trim();
    const pendente = status === "Pendente";
    const valores = autoData?.habilidadesPropostas || {};

    const conteudo = pendente ? `
        <div class="bg-yellow-50 border border-yellow-100 rounded-2xl p-4 text-center">
            <i class="fa-solid fa-hourglass-half text-yellow-700 text-xl mb-2"></i>
            <p class="text-xs font-black uppercase text-yellow-800">Autoavaliacao em analise</p>
            <p class="text-[10px] font-semibold text-yellow-700 mt-2 leading-relaxed">
                Sua autoavaliacao ja foi enviada e esta aguardando a equipe tecnica.
            </p>
        </div>
    ` : `
        ${status === "Recusada" ? `
            <div class="bg-red-50 border border-red-100 rounded-2xl p-3 mb-3">
                <p class="text-[9px] font-black uppercase text-red-700">Autoavaliacao recusada. Ajuste suas notas e envie novamente.</p>
                ${autoData?.observacaoAnalise ? `<p class="text-[9px] text-red-700 font-semibold mt-1">${escaparHtml(autoData.observacaoAnalise)}</p>` : ""}
            </div>
        ` : ""}
        ${renderInfoCriteriosAvaliacaoDVC()}
        <div class="space-y-1">
            ${renderCamposAvaliacaoHabilidadesDVC("autoav", valores)}
        </div>
        <button onclick="enviarAutoAvaliacaoHabilidades()" class="w-full bg-[#990000] text-white py-3 rounded-xl text-[10px] font-black uppercase shadow-sm mt-4">
            Enviar autoavaliacao
        </button>
    `;

    const modal = `
        <div id="m-autoavaliacao-obrigatoria" class="fixed inset-0 bg-black/85 z-[120] p-4 flex items-center justify-center">
            <div class="bg-white w-full max-w-sm rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
                <div class="bg-gradient-to-r from-gray-950 via-[#4b0d0d] to-[#990000] text-white p-4">
                    <p class="text-[8px] font-black uppercase text-white/60">Primeira avaliacao tecnica</p>
                    <h2 class="text-sm font-black uppercase">Autoavaliacao obrigatoria</h2>
                    <p class="text-[9px] font-semibold text-white/70 mt-2 leading-relaxed">
                        Ela sera analisada pela equipe tecnica antes de entrar no seu perfil.
                    </p>
                </div>
                <div class="p-4">
                    ${conteudo}
                    <button onclick="logout()" class="w-full bg-white border border-gray-200 text-gray-500 py-3 rounded-xl text-[10px] font-black uppercase mt-3">
                        Sair da conta
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modal);
};

window.enviarAutoAvaliacaoHabilidades = async () => {
    try {
        const email = String(auth.currentUser?.email || "").trim().toLowerCase();
        const docId = getAutoAvaliacaoDocIdDVC(email);
        if (!email || !docId) {
            return alert("Nao foi possivel identificar seu e-mail.");
        }

        const habilidadesPropostas = coletarHabilidadesAutoAvaliacaoDVC();

        await setDoc(doc(db, "autoAvaliacoesHabilidades", docId), {
            email,
            nome: window.currentUserData?.nome || "",
            habilidadesPropostas,
            status: "Pendente",
            criadoEm: new Date().toISOString(),
            atualizadoEm: new Date().toISOString(),
            analisadoEm: "",
            analisadoPor: "",
            analisadoPorEmail: "",
            observacaoAnalise: ""
        }, { merge: true });

        await updateDoc(doc(db, "users", email), {
            habilidadesStatus: "Autoavaliacao pendente",
            autoAvaliacaoHabilidadesEnviadaEm: new Date().toISOString()
        });

        window.currentUserData = {
            ...window.currentUserData,
            habilidadesStatus: "Autoavaliacao pendente"
        };

        limparCacheDados("atletas");
        document.getElementById("m-autoavaliacao-obrigatoria")?.remove();
        limparCacheAutoAvaliacoes();
        alert("Autoavaliacao enviada para analise da equipe tecnica.");
        renderProfile();

    } catch (e) {
        console.error("Erro ao enviar autoavaliacao:", e);
        alert("Nao foi possivel enviar sua autoavaliacao agora.");
    }
};

function calcularScorePropostoAutoAvaliacao(habilidades = {}) {
    return calcularScoreGeralDVC(habilidades || {});
}

function renderNotasAutoAvaliacaoHtml(habilidades = {}) {
    const h = normalizarHabilidadesDVC(habilidades || {});

    return `
        <div class="grid grid-cols-2 gap-2">
            ${TODAS_HABILIDADES_DVC.map(skill => `
                <div class="bg-gray-50 border border-gray-100 rounded-xl p-2">
                    <p class="text-[8px] font-black uppercase text-gray-400 truncate">${skill.nome}</p>
                    <p class="text-sm font-black text-[#990000]">${Number(h[skill.id] || 0).toFixed(1)}</p>
                </div>
            `).join("")}
        </div>
    `;
}

window.verAutoAvaliacaoPendente = async (docId) => {
    try {
        const snap = await getDoc(doc(db, "autoAvaliacoesHabilidades", docId));
        if (!snap.exists()) return alert("Autoavaliacao nao encontrada.");

        const av = snap.data();
        document.getElementById("m-ver-autoavaliacao")?.remove();

        const modal = `
            <div id="m-ver-autoavaliacao" class="fixed inset-0 bg-black/75 z-[120] p-4 flex items-center justify-center">
                <div class="bg-white w-full max-w-sm rounded-3xl shadow-2xl max-h-[88vh] overflow-y-auto">
                    <div class="bg-gradient-to-r from-gray-950 via-[#4b0d0d] to-[#990000] text-white p-4 flex justify-between gap-3">
                        <div>
                            <p class="text-[8px] font-black uppercase text-white/60">Autoavaliacao</p>
                            <h3 class="text-sm font-black uppercase">${(av.nome || av.email || "Atleta")}</h3>
                            <p class="text-[9px] font-bold text-white/70 mt-1">${(av.email || "")}</p>
                        </div>
                        <button onclick="document.getElementById('m-ver-autoavaliacao')?.remove()" class="w-9 h-9 rounded-full bg-white/10 border border-white/20">
                            <i class="fa-solid fa-xmark text-xs"></i>
                        </button>
                    </div>
                    <div class="p-4">
                        <div class="bg-red-50 border border-red-100 rounded-2xl p-3 mb-3 text-center">
                            <p class="text-[8px] font-black uppercase text-[#990000]">Score medio proposto</p>
                            <p class="text-2xl font-black text-[#990000]">${calcularScorePropostoAutoAvaliacao(av.habilidadesPropostas).toFixed(1)}</p>
                        </div>
                        ${renderNotasAutoAvaliacaoHtml(av.habilidadesPropostas)}
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML("beforeend", modal);
    } catch (e) {
        console.error("Erro ao abrir autoavaliacao:", e);
        alert("Nao foi possivel abrir a autoavaliacao.");
    }
};

window.aprovarAutoAvaliacao = async (docId) => {
    if (!usuarioEhEquipeTecnica()) {
        return alert("Apenas equipe tecnica pode aprovar autoavaliacoes.");
    }

    try {
        const autoRef = doc(db, "autoAvaliacoesHabilidades", docId);
        const autoSnap = await getDoc(autoRef);

        if (!autoSnap.exists()) {
            return alert("Autoavaliacao nao encontrada.");
        }

        const av = autoSnap.data();
        const email = String(av.email || "").trim().toLowerCase();
        const habilidadesPropostas = normalizarHabilidadesDVC(av.habilidadesPropostas || {});

        if (!email) return alert("E-mail do atleta nao encontrado.");

        const userRef = doc(db, "users", email);
        const userSnap = await getDoc(userRef);
        const anteriores = userSnap.exists()
            ? normalizarHabilidadesDVC(userSnap.data().habilidades || {})
            : normalizarHabilidadesDVC({});

        const analisadorNome = window.currentUserData?.nome || auth.currentUser?.email || "Equipe tecnica";

        await updateDoc(userRef, {
            habilidades: habilidadesPropostas,
            habilidadesAvaliadasPorEquipe: true,
            habilidadesStatus: "Aprovada",
            avaliadoEm: new Date().toISOString(),
            avaliadoPor: analisadorNome,
            avaliadoPorEmail: auth.currentUser?.email || ""
        });

        await updateDoc(autoRef, {
            status: "Aprovada",
            atualizadoEm: new Date().toISOString(),
            analisadoEm: new Date().toISOString(),
            analisadoPor: analisadorNome,
            analisadoPorEmail: auth.currentUser?.email || "",
            observacaoAnalise: ""
        });

        const historicos = TODAS_HABILIDADES_DVC.map(skill => registrarHistoricoHabilidadeSeguroDVC(
            email,
            skill.id,
            anteriores[skill.id],
            habilidadesPropostas[skill.id],
            "Autoavaliacao aprovada",
            `Aprovada por ${analisadorNome}`
        ));

        await Promise.allSettled(historicos);

        limparCacheDados("atletas");
        limparCacheDados("avaliacoes");
        limparCacheAutoAvaliacoes();
        limparCacheHistoricoHabilidades(email);
        alert("Autoavaliação aprovada e aplicada ao perfil do atleta.");
        await renderAutoAvaliacoesPendentes();
    } catch (e) {
        console.error("Erro ao aprovar autoavaliacao:", e);
        alert("Nao foi possivel aprovar a autoavaliacao.");
    }
};

window.recusarAutoAvaliacao = async (docId) => {
    if (!usuarioEhEquipeTecnica()) {
        return alert("Apenas equipe tecnica pode recusar autoavaliacoes.");
    }

    try {
        const observacao = prompt("Observacao opcional para o atleta:") || "";
        const autoRef = doc(db, "autoAvaliacoesHabilidades", docId);
        const autoSnap = await getDoc(autoRef);

        if (!autoSnap.exists()) {
            return alert("Autoavaliacao nao encontrada.");
        }

        const av = autoSnap.data();
        const email = String(av.email || "").trim().toLowerCase();
        const analisadorNome = window.currentUserData?.nome || auth.currentUser?.email || "Equipe tecnica";

        await updateDoc(autoRef, {
            status: "Recusada",
            atualizadoEm: new Date().toISOString(),
            analisadoEm: new Date().toISOString(),
            analisadoPor: analisadorNome,
            analisadoPorEmail: auth.currentUser?.email || "",
            observacaoAnalise: observacao
        });

        if (email) {
            await updateDoc(doc(db, "users", email), {
                habilidadesStatus: "Autoavaliacao recusada"
            });
        }

        limparCacheDados("atletas");
        alert("Autoavaliacao recusada. O atleta podera reenviar.");
        await renderAutoAvaliacoesPendentes();
    } catch (e) {
        console.error("Erro ao recusar autoavaliacao:", e);
        alert("Nao foi possivel recusar a autoavaliacao.");
    }
};

window.renderAutoAvaliacoesPendentes = async () => {
    try {
        if (!usuarioEhEquipeTecnica()) return "";

        const snap = await getDocs(collection(db, "autoAvaliacoesHabilidades"));
        let pendentes = [];

        snap.forEach(docAuto => {
            const data = docAuto.data();
            if (data.status !== "Pendente") return;
            pendentes.push({
                id: docAuto.id,
                ...data
            });
        });

        pendentes.sort((a, b) => new Date(b.criadoEm || 0) - new Date(a.criadoEm || 0));

        const html = `
            <div class="bg-white border rounded-2xl p-4 shadow-sm mb-5">
                <div class="flex items-start justify-between gap-3 mb-3">
                    <div>
                        <p class="text-[10px] font-black text-[#990000] uppercase">
                            <i class="fa-solid fa-clipboard-list mr-1"></i> Autoavaliacoes pendentes
                        </p>
                        <p class="text-[8px] font-bold text-gray-400 uppercase mt-1">
                            Revisao tecnica das primeiras avaliacoes
                        </p>
                    </div>
                    <span class="bg-red-50 text-[#990000] border border-red-100 text-[9px] font-black px-3 py-1 rounded-full">${pendentes.length}</span>
                </div>

                ${pendentes.length === 0 ? `
                    <div class="bg-gray-50 border border-dashed rounded-xl p-4 text-center">
                        <p class="text-[10px] text-gray-400 font-bold uppercase">Nenhuma autoavaliacao pendente.</p>
                    </div>
                ` : `
                    <div class="space-y-3">
                        ${pendentes.map(av => `
                            <div class="bg-gray-50 border border-gray-100 rounded-2xl p-3">
                                <div class="flex justify-between gap-3 mb-3">
                                    <div class="min-w-0">
                                        <p class="text-xs font-black uppercase text-gray-900 truncate">${av.nome || av.email || "Atleta"}</p>
                                        <p class="text-[8px] font-bold text-gray-400 truncate">${av.email || ""}</p>
                                        <p class="text-[8px] font-bold text-gray-400 uppercase mt-1">${av.criadoEm ? new Date(av.criadoEm).toLocaleString("pt-BR") : ""}</p>
                                    </div>
                                    <div class="text-right shrink-0">
                                        <p class="text-[8px] font-black uppercase text-gray-400">Score</p>
                                        <p class="text-lg font-black text-[#990000]">${calcularScorePropostoAutoAvaliacao(av.habilidadesPropostas).toFixed(1)}</p>
                                    </div>
                                </div>
                                <div class="grid grid-cols-3 gap-2">
                                    <button onclick="verAutoAvaliacaoPendente('${av.id}')" class="bg-gray-900 text-white py-2 rounded-xl text-[8px] font-black uppercase">Ver</button>
                                    <button onclick="aprovarAutoAvaliacao('${av.id}')" class="bg-green-700 text-white py-2 rounded-xl text-[8px] font-black uppercase">Aprovar</button>
                                    <button onclick="recusarAutoAvaliacao('${av.id}')" class="bg-white border border-red-200 text-red-700 py-2 rounded-xl text-[8px] font-black uppercase">Recusar</button>
                                </div>
                            </div>
                        `).join("")}
                    </div>
                `}
            </div>
        `;

        document.querySelectorAll("#box-autoavaliacoes-pendentes").forEach(el => {
            el.innerHTML = html;
        });

        return html;
    } catch (e) {
        console.error("Erro ao carregar autoavaliacoes pendentes:", e);
        return "";
    }
};

window.abrirPainelAutoAvaliacoesDVC = async () => {
    if (!usuarioEhEquipeTecnica()) {
        return alert("Apenas equipe tecnica pode analisar autoavaliacoes.");
    }

    document.getElementById("m-painel-autoavaliacoes")?.remove();

    const modal = `
        <div id="m-painel-autoavaliacoes" class="fixed inset-0 bg-black/75 z-[110] p-4 flex items-center justify-center">
            <div class="bg-white w-full max-w-sm rounded-3xl shadow-2xl max-h-[88vh] overflow-y-auto">
                <div class="bg-gradient-to-r from-gray-950 via-[#4b0d0d] to-[#990000] text-white p-4 flex justify-between gap-3">
                    <div>
                        <p class="text-[8px] font-black uppercase text-white/60">Equipe tecnica</p>
                        <h3 class="text-sm font-black uppercase">Autoavaliacoes pendentes</h3>
                    </div>
                    <button onclick="document.getElementById('m-painel-autoavaliacoes')?.remove()" class="w-9 h-9 rounded-full bg-white/10 border border-white/20">
                        <i class="fa-solid fa-xmark text-xs"></i>
                    </button>
                </div>
                <div id="box-autoavaliacoes-pendentes" class="p-4">
                    <p class="text-[10px] font-bold text-gray-400 uppercase text-center">Carregando...</p>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modal);
    await renderAutoAvaliacoesPendentes();
};

window.CRITERIOS_AVALIACAO_DVC = CRITERIOS_AVALIACAO_DVC;
window.GRUPOS_HABILIDADES_DVC = GRUPOS_HABILIDADES_DVC;
window.TODAS_HABILIDADES_DVC = TODAS_HABILIDADES_DVC;
window.CRITERIOS_AVALIACAO_EQUIPE_DVC = CRITERIOS_AVALIACAO_EQUIPE_DVC;
window.renderInfoCriteriosAvaliacaoDVC = renderInfoCriteriosAvaliacaoDVC;
window.usuarioTemHabilidadesReaisDVC = usuarioTemHabilidadesReaisDVC;
window.usuarioTemAvaliacaoTecnicaRealDVC = usuarioTemAvaliacaoTecnicaRealDVC;
window.usuarioPrecisaAutoAvaliacao = usuarioPrecisaAutoAvaliacao;
window.carregarHistoricoHabilidadeHtml = carregarHistoricoHabilidadeHtml;
window.calcularScoreFuncaoDVC = calcularScoreFuncaoDVC;
window.calcularScoreGeralDVC = calcularScoreGeralDVC;
window.getMesAtualAvaliacao = getMesAtualAvaliacao;
window.calcularMediaAvaliacoesPares = calcularMediaAvaliacoesPares;
window.carregarAvaliacoesParesDVC = carregarAvaliacoesParesDVC;
window.carregarAutoAvaliacoesDVC = carregarAutoAvaliacoesDVC;
window.carregarAvaliacoesEquipeTecnicaDVC = carregarAvaliacoesEquipeTecnicaDVC;
window.limparCacheAvaliacoesPares = limparCacheAvaliacoesPares;
window.limparCacheAutoAvaliacoes = limparCacheAutoAvaliacoes;
window.limparCacheAvaliacoesEquipeTecnica = limparCacheAvaliacoesEquipeTecnica;
window.obterMesAtualAvaliacaoTecnicaDVC = obterMesAtualAvaliacaoTecnicaDVC;
window.getIdAvaliacaoEquipeTecnicaDVC = getIdAvaliacaoEquipeTecnicaDVC;
window.usuarioPodeAvaliarEquipeTecnicaDVC = usuarioPodeAvaliarEquipeTecnicaDVC;
window.carregarAvaliacoesEquipeTecnicaCache = carregarAvaliacoesEquipeTecnicaCache;
window.usuarioTemAvaliacoesEquipePendentesDVC = usuarioTemAvaliacoesEquipePendentesDVC;
window.renderAvaliacaoMensalEquipeDVC = renderAvaliacaoMensalEquipeDVC;
window.renderBotoesNotaAvaliacaoEquipeDVC = renderBotoesNotaAvaliacaoEquipeDVC;
window.mediaNumericaDVC = mediaNumericaDVC;
window.getAutoAvaliacaoDocIdDVC = getAutoAvaliacaoDocIdDVC;
window.usuarioTemHistoricoHabilidadesDVC = usuarioTemHistoricoHabilidadesDVC;
window.registrarHistoricoHabilidadeSeguroDVC = registrarHistoricoHabilidadeSeguroDVC;
window.usuarioPrecisaAutoAvaliacaoComHistoricoDVC = usuarioPrecisaAutoAvaliacaoComHistoricoDVC;
window.coletarHabilidadesAutoAvaliacaoDVC = coletarHabilidadesAutoAvaliacaoDVC;
window.renderCamposAvaliacaoHabilidadesDVC = renderCamposAvaliacaoHabilidadesDVC;
window.calcularScorePropostoAutoAvaliacao = calcularScorePropostoAutoAvaliacao;
window.renderNotasAutoAvaliacaoHtml = renderNotasAutoAvaliacaoHtml;

const abrirModalAvaliacao = window.abrirModalAvaliacao;
const salvarAvaliacao = window.salvarAvaliacao;
const abrirAvaliacaoColegas = window.abrirAvaliacaoColegas;
const salvarAvaliacaoColega = window.salvarAvaliacaoColega;
const selecionarNotaAvaliacaoEquipeTecnica = window.selecionarNotaAvaliacaoEquipeTecnica;
const abrirModalAvaliacaoEquipeTecnica = window.abrirModalAvaliacaoEquipeTecnica;
const enviarAvaliacaoEquipeTecnica = window.enviarAvaliacaoEquipeTecnica;
const renderPainelAvaliacoesEquipeTecnica = window.renderPainelAvaliacoesEquipeTecnica;
const abrirModalAutoAvaliacaoObrigatoria = window.abrirModalAutoAvaliacaoObrigatoria;
const enviarAutoAvaliacaoHabilidades = window.enviarAutoAvaliacaoHabilidades;
const verAutoAvaliacaoPendente = window.verAutoAvaliacaoPendente;
const aprovarAutoAvaliacao = window.aprovarAutoAvaliacao;
const recusarAutoAvaliacao = window.recusarAutoAvaliacao;
const renderAutoAvaliacoesPendentes = window.renderAutoAvaliacoesPendentes;
const abrirPainelAutoAvaliacoesDVC = window.abrirPainelAutoAvaliacoesDVC;

export {
    CRITERIOS_AVALIACAO_DVC,
    GRUPOS_HABILIDADES_DVC,
    TODAS_HABILIDADES_DVC,
    CRITERIOS_AVALIACAO_EQUIPE_DVC,
    renderInfoCriteriosAvaliacaoDVC,
    usuarioTemHabilidadesReaisDVC,
    usuarioTemAvaliacaoTecnicaRealDVC,
    usuarioPrecisaAutoAvaliacao,
    abrirModalAvaliacao,
    salvarAvaliacao,
    carregarHistoricoHabilidadeHtml,
    calcularScoreFuncaoDVC,
    calcularScoreGeralDVC,
    getMesAtualAvaliacao,
    abrirAvaliacaoColegas,
    salvarAvaliacaoColega,
    calcularMediaAvaliacoesPares,
    carregarAvaliacoesParesDVC,
    carregarAutoAvaliacoesDVC,
    carregarAvaliacoesEquipeTecnicaDVC,
    limparCacheAvaliacoesPares,
    limparCacheAutoAvaliacoes,
    limparCacheAvaliacoesEquipeTecnica,
    obterMesAtualAvaliacaoTecnicaDVC,
    getIdAvaliacaoEquipeTecnicaDVC,
    usuarioPodeAvaliarEquipeTecnicaDVC,
    carregarAvaliacoesEquipeTecnicaCache,
    usuarioTemAvaliacoesEquipePendentesDVC,
    renderAvaliacaoMensalEquipeDVC,
    renderBotoesNotaAvaliacaoEquipeDVC,
    selecionarNotaAvaliacaoEquipeTecnica,
    abrirModalAvaliacaoEquipeTecnica,
    enviarAvaliacaoEquipeTecnica,
    mediaNumericaDVC,
    renderPainelAvaliacoesEquipeTecnica,
    getAutoAvaliacaoDocIdDVC,
    usuarioTemHistoricoHabilidadesDVC,
    registrarHistoricoHabilidadeSeguroDVC,
    usuarioPrecisaAutoAvaliacaoComHistoricoDVC,
    coletarHabilidadesAutoAvaliacaoDVC,
    renderCamposAvaliacaoHabilidadesDVC,
    abrirModalAutoAvaliacaoObrigatoria,
    enviarAutoAvaliacaoHabilidades,
    calcularScorePropostoAutoAvaliacao,
    renderNotasAutoAvaliacaoHtml,
    verAutoAvaliacaoPendente,
    aprovarAutoAvaliacao,
    recusarAutoAvaliacao,
    renderAutoAvaliacoesPendentes,
    abrirPainelAutoAvaliacoesDVC,
    usuarioTemAvaliacaoColegaPendenteDVC
};
