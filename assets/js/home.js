/**
 * ============================================================================
 * Módulo: HOME
 * ============================================================================
 * Responsabilidade: Gerencia funcionalidades relacionadas a home.
 * Este arquivo faz parte do sistema modular do DVC App.
 * Todos os códigos principais aqui agrupados seguem as diretrizes do projeto.
 * ============================================================================
 */

// HOME TAB RENDER MODULE DVC APP

import { PROJETO_ATUAL_DVC } from "./state.js";

const MIDIAS_HOME_DVC = [
    { src: "assets/img/127-IMG_1749.webp", titulo: "Juventude e pertencimento", categoria: "vinculo", tipo: "imagem", proporcao: "hero", position: "center center", alt: "Atletas do DVC em momento de integração" },
    { src: "assets/img/20260224_102424.webp", titulo: "Identidade em quadra", categoria: "identidade", tipo: "imagem", proporcao: "grupo", position: "center center", alt: "Equipe DVC reunida em quadra" },
    { src: "assets/img/20260403_185449.webp", titulo: "Camisa, bandeira e presença", categoria: "identidade", tipo: "imagem", proporcao: "grupo", position: "center center", alt: "Atletas do DVC com identidade do projeto" },
    { src: "assets/img/campeaodjanira.webp", titulo: "Experiência competitiva", categoria: "conquista", tipo: "imagem", proporcao: "trofeu", position: "center center", alt: "Equipe DVC em registro de conquista" },
    { src: "assets/img/formandos.webp", titulo: "Além da quadra", categoria: "impacto", tipo: "imagem", proporcao: "grupo", position: "center center", alt: "Registro institucional de trajetória além da quadra" },
    { src: "assets/img/IMG_3101.webp", titulo: "Concentração", categoria: "processo", tipo: "imagem", proporcao: "portrait", position: "center 30%", alt: "Atleta do DVC em momento de concentração" },
    { src: "assets/img/IMG_3162.webp", titulo: "União", categoria: "vinculo", tipo: "imagem", proporcao: "grupo", position: "center center", alt: "Equipe DVC em roda de união" },
    { src: "assets/img/treinoserginho.webp", titulo: "Fundamento técnico", categoria: "processo", tipo: "imagem", proporcao: "portrait", position: "center center", alt: "Registro do DVC em treino técnico" },
    { src: "treinoserinho2.mp4", titulo: "Treino em movimento", categoria: "processo", tipo: "video", proporcao: "video", position: "center center", alt: "Vídeo de treino do DVC" },
    { src: "123dvc.mp4", titulo: "DVC em movimento", categoria: "vinculo", tipo: "video", proporcao: "video", position: "center center", alt: "Vídeo institucional do DVC" },
    { src: "assets/img/22-IMG_1226.webp", titulo: "Orientação", categoria: "processo", tipo: "imagem", proporcao: "grupo", position: "center center", alt: "Atletas do DVC em roda de orientação" },
    { src: "assets/img/107-IMG_1672.webp", titulo: "Treino orientado", categoria: "processo", tipo: "imagem", proporcao: "wide", position: "center center", alt: "Registro do DVC em orientação de treino" },
    { src: "assets/img/111-IMG_1703.webp", titulo: "Conversa de equipe", categoria: "processo", tipo: "imagem", proporcao: "grupo", position: "center center", alt: "Equipe DVC em conversa de treino" },
    { src: "assets/img/7-IMG_0969.webp", titulo: "Movimento", categoria: "processo", tipo: "imagem", proporcao: "portrait", position: "center center", alt: "Atleta do DVC em ação esportiva" },
    { src: "assets/img/5-IMG_0946.webp", titulo: "Protagonismo", categoria: "processo", tipo: "imagem", proporcao: "portrait", position: "center center", alt: "Atleta do DVC em momento de protagonismo" },
    { src: "assets/img/1-IMG_0907.webp", titulo: "Pertencimento", categoria: "vinculo", tipo: "imagem", proporcao: "portrait", position: "center center", alt: "Registro de pertencimento do DVC" },
    { src: "assets/img/123-_MG_0342.webp", titulo: "Coletivo", categoria: "vinculo", tipo: "imagem", proporcao: "wide", position: "center center", alt: "Atletas do DVC em momento coletivo" },
    { src: "assets/img/131-IMG_1773.webp", titulo: "Comunidade", categoria: "comunidade", tipo: "imagem", proporcao: "grupo", position: "center center", alt: "Atletas do DVC em momento de comunidade" },
    { src: "assets/img/interno.webp", titulo: "Integração", categoria: "comunidade", tipo: "imagem", proporcao: "grupo", position: "center center", alt: "Atletas do DVC em momento de integração" },
    { src: "assets/img/jebh2024.webp", titulo: "JEBH 2024", categoria: "trajetoria", tipo: "imagem", proporcao: "grupo", position: "center center", alt: "Equipe DVC no campeonato JEBH 2024" },
    { src: "assets/img/metro1.webp", titulo: "Metropolitano 2025", categoria: "trajetoria", tipo: "imagem", proporcao: "trofeu", position: "center center", alt: "Equipe DVC no Campeonato Metropolitano 2025" },
    { src: "assets/img/metro2.webp", titulo: "Metropolitano 2025", categoria: "trajetoria", tipo: "imagem", proporcao: "trofeu", position: "center center", alt: "Conquista no Campeonato Metropolitano 2025" },
    { src: "assets/img/metro3.webp", titulo: "Metropolitano 2025", categoria: "trajetoria", tipo: "imagem", proporcao: "grupo", position: "center center", alt: "Vice-campeonato no Campeonato Metropolitano 2025" },
    { src: "assets/img/estadual.webp", titulo: "Estadual Sub-18", categoria: "trajetoria", tipo: "imagem", proporcao: "grupo", position: "center center", alt: "Equipe DVC na seletiva estadual escolar sub-18" }
];

function arquivoMidiaDVC(src) {
    return src || "";
}

function buscarMidiaHomeDVC(src, extras = {}) {
    const item = MIDIAS_HOME_DVC.find(midia => midia.src === src) || {
        src,
        titulo: "Registro DVC",
        categoria: "memoria",
        tipo: "imagem",
        proporcao: "wide",
        position: "center center",
        alt: "Registro institucional do DVC"
    };

    return { ...item, ...extras };
}

function classeImagemHomeDVC(tipo = "wide") {
    if (tipo === "hero") return "w-full h-full object-cover";
    if (tipo === "portrait") return "w-full h-[280px] object-cover";
    if (tipo === "grupo") return "w-full h-56 object-cover";
    if (tipo === "trofeu") return "w-full h-48 object-cover";
    return "w-full h-48 object-cover";
}

function renderImagemHomeDVC(item, classes = "", loading = "lazy") {
    const midia = typeof item === "string" ? buscarMidiaHomeDVC(item) : item;
    const classeFinal = classes || classeImagemHomeDVC(midia.proporcao);
    return `
        <img src="${arquivoMidiaDVC(midia.src)}" 
             class="${classeFinal}" 
             alt="${midia.alt || 'Imagem DVC'}" 
             loading="${loading}" 
             style="object-position: ${midia.position || 'center center'};">
    `;
}

function renderCardPilarDVC(icone, titulo, texto) {
    return `
        <div class="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-4 shadow-sm flex gap-3 transition-colors duration-200">
            <div class="w-10 h-10 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 flex items-center justify-center shrink-0">
                <i class="fa-solid ${icone} text-[#990000] text-sm"></i>
            </div>
            <div>
                <h3 class="text-xs font-black uppercase text-gray-800 dark:text-gray-200 leading-none">${titulo}</h3>
                <p class="text-[10px] text-gray-500 dark:text-gray-400 font-semibold leading-relaxed mt-2">${texto}</p>
            </div>
        </div>
    `;
}

function renderCardTrajetoriaDVC(item) {
    return `
        <article class="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm flex flex-col transition-colors duration-200">
            <div class="h-48 bg-gray-100 dark:bg-gray-950">
                ${renderImagemHomeDVC(item, "w-full h-full object-cover")}
            </div>
            <div class="p-4 flex-1 flex flex-col justify-between">
                <div>
                    <div class="flex items-center justify-between gap-2 mb-2">
                        <span class="bg-[#990000] text-white text-[8px] font-black px-2 py-0.5 rounded uppercase">
                            ${item.ano}
                        </span>
                        <span class="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-[7px] font-black px-2 py-0.5 rounded uppercase">
                            ${item.selo}
                        </span>
                    </div>
                    <h3 class="text-xs font-black uppercase text-gray-800 dark:text-gray-200 leading-tight">
                        ${item.tituloCard || item.titulo}
                    </h3>
                    <p class="text-[10px] text-gray-500 dark:text-gray-400 font-semibold leading-relaxed mt-2">
                        ${item.texto}
                    </p>
                </div>
            </div>
        </article>
    `;
}

function getLegendaMemoriaHomeDVC(titulo = "", legenda = "") {
    const legendaSegura = String(legenda ?? "").trim();
    if (legendaSegura) return legendaSegura;

    const tituloNormalizado = String(titulo || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    const legendasPorTitulo = {
        identidade: "Nosso orgulho estampado no peito.",
        comunidade: "Apoio que ultrapassa as linhas do jogo.",
        vinculo: "Laços que fortalecem dentro e fora da quadra.",
        protagonismo: "Cada jovem como autor da própria caminhada.",
        "formacao humana": "Aprender, amadurecer e ocupar o próprio lugar no mundo.",
        "fundamento tecnico": "A evolução que nasce da repetição.",
        orientacao: "Escuta atenta e direção para a vida."
    };

    return legendasPorTitulo[tituloNormalizado] || "Memória viva do projeto DVC.";
}

function renderCardProcessoDVC(item) {
    const tituloSeguro = String(item?.titulo || "Registro DVC").trim();
    const legendaSegura = getLegendaMemoriaHomeDVC(tituloSeguro, item?.legenda);

    return `
        <div class="snap-center shrink-0 w-[200px] bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm flex flex-col transition-colors duration-200">
            <div class="h-32 bg-gray-100 dark:bg-gray-950">
                ${renderImagemHomeDVC(item, "w-full h-full object-cover")}
            </div>
            <div class="p-3 flex-1 flex flex-col justify-between">
                <div>
                    <p class="text-[8px] font-bold text-gray-400 dark:text-gray-500 uppercase truncate">
                        ${tituloSeguro}
                    </p>
                    <p class="text-[9px] font-semibold text-gray-600 dark:text-gray-300 leading-snug mt-1 h-7 overflow-hidden line-clamp-2">
                        ${legendaSegura}
                    </p>
                </div>
            </div>
        </div>
    `;
}

function renderCarrosselMidiasDVC(titulo, subtitulo, midias = []) {
    return `
        <section class="space-y-3">
            <div>
                <p class="text-[10px] font-black uppercase text-[#990000]">${titulo}</p>
                <p class="text-[10px] font-semibold text-gray-500 leading-relaxed">${subtitulo}</p>
            </div>
            <div class="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-1 px-1">
                ${midias.map(item => renderCardProcessoDVC(item)).join("")}
            </div>
        </section>
    `;
}

function marcarHomeDVCVista() {
    try {
        localStorage.setItem("dvc_home_historia_vista", "sim");
    } catch (erro) {
        console.warn("Nao foi possivel salvar preferencia da Home DVC:", erro);
    }
}

function toggleHistoriaHomeDVC(forcarAberto = null) {
    const bloco = document.getElementById("historia-home-dvc");
    const btn = document.getElementById("btn-toggle-historia-home-dvc");
    const subtitulo = document.getElementById("texto-toggle-historia-home-dvc");
    if (!bloco) return;

    const deveAbrir = forcarAberto === null
        ? bloco.classList.contains("hidden")
        : !!forcarAberto;

    bloco.classList.toggle("hidden", !deveAbrir);

    if (btn) {
        btn.innerHTML = deveAbrir
            ? '<i class="fa-solid fa-chevron-up mr-2"></i> Recolher história'
            : '<i class="fa-solid fa-chevron-down mr-2"></i> Conhecer nossa história';
    }

    if (subtitulo) {
        subtitulo.textContent = deveAbrir
            ? "História completa aberta. Você pode recolher quando quiser."
            : "A história completa fica recolhida para o uso diário ficar rápido.";
    }

    if (deveAbrir) marcarHomeDVCVista();
}

function toggleSecaoHomeDVC(idElemento) {
    const el = document.getElementById(idElemento);
    const chevron = document.getElementById(`chevron-${idElemento}`);
    if (!el) return;
    const isHidden = el.classList.contains("hidden");
    el.classList.toggle("hidden", !isHidden);
    if (chevron) {
        chevron.style.transform = isHidden ? "rotate(180deg)" : "rotate(0deg)";
    }
}

function scrollParaSecaoHomeDVC(secaoId, conteudoId = null) {
    const el = document.getElementById(secaoId);
    const container = document.getElementById('main-content');
    if (el && container) {
        if (conteudoId) {
            const conteudoEl = document.getElementById(conteudoId);
            if (conteudoEl && conteudoEl.classList.contains("hidden")) {
                toggleSecaoHomeDVC(conteudoId);
            }
        }
        setTimeout(() => {
            container.scrollTo({ top: el.offsetTop - 20, behavior: 'smooth' });
        }, 50);
    }
}

function renderSobreAppHomeDVC() {
    return `
        <section id="sobre-app-home-dvc" class="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-4 shadow-sm transition-colors duration-200">
            <button onclick="window.toggleSecaoHomeDVC('conteudo-sobre-app-home-dvc')" class="w-full flex items-center justify-between text-left outline-none cursor-pointer">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center shrink-0">
                        <i class="fa-solid fa-mobile-screen text-indigo-700 dark:text-indigo-400 text-sm"></i>
                    </div>
                    <div>
                        <p class="text-[10px] font-black uppercase text-[#990000]">Como o app ajuda no DVC?</p>
                        <h2 class="text-xs font-black text-gray-900 dark:text-gray-200 uppercase leading-tight mt-0.5">Organização, participação e evolução em um só lugar.</h2>
                    </div>
                </div>
                <i id="chevron-conteudo-sobre-app-home-dvc" class="fa-solid fa-chevron-down text-gray-400 dark:text-gray-500 transition-transform duration-300"></i>
            </button>
            <div id="conteudo-sobre-app-home-dvc" class="hidden mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 space-y-3">
                <p class="text-[10px] font-semibold text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
                    O app do DVC organiza a vida do projeto: avisos, agenda, presença, perfil, evolução, contribuições, avaliações e desafios de inteligência de quadra. Mais do que uma ferramenta de controle, ele ajuda cada participante a acompanhar sua trajetória e fortalecer o coletivo.
                </p>
                <div class="grid grid-cols-1 gap-2">
                    ${renderCardPilarDVC("fa-bullhorn", "Acompanhar", "Avisos, agenda, convocações e informações importantes.")}
                    ${renderCardPilarDVC("fa-calendar-check", "Participar", "Presenças, treinos, jogos, chamadas e atividades do projeto.")}
                    ${renderCardPilarDVC("fa-chart-line", "Evoluir", "Perfil, avaliações, conquistas e desafios de inteligência de quadra.")}
                    ${renderCardPilarDVC("fa-hand-holding-heart", "Cuidar do coletivo", "Dados atualizados, pesquisas respondidas e corresponsabilidade com o DVC.")}
                </div>
            </div>
        </section>
    `;
}

function renderSobreProjetoHomeDVC(pilares) {
    const pilaresRenderizados = pilares.map((pilar, index) => {
        const [icone, titulo, texto] = pilar;
        const conteudoId = `conteudo-pilar-${index}`;
        return `
            <div class="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm transition-colors duration-200">
                <button onclick="window.toggleSecaoHomeDVC('${conteudoId}')" class="w-full flex items-center justify-between p-4 text-left outline-none cursor-pointer">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 flex items-center justify-center shrink-0">
                            <i class="fa-solid ${icone} text-[#990000] text-xs"></i>
                        </div>
                        <h3 class="text-xs font-black uppercase text-gray-800 dark:text-gray-200 leading-none">${titulo}</h3>
                    </div>
                    <i id="chevron-${conteudoId}" class="fa-solid fa-chevron-down text-gray-400 dark:text-gray-500 text-xs transition-transform duration-300"></i>
                </button>
                <div id="${conteudoId}" class="hidden px-4 pb-4 pt-1">
                    <p class="text-[10px] text-gray-500 dark:text-gray-400 font-semibold leading-relaxed">${texto}</p>
                </div>
            </div>
        `;
    }).join("");

    return `
        <section id="sobre-projeto-home-dvc" class="space-y-3 pt-2">
            <div>
                <p class="text-[10px] font-black uppercase text-[#990000]">O que é o DVC?</p>
                <p class="text-[10px] font-semibold text-gray-500 leading-relaxed">
                    O DVC usa o esporte como ponto de partida para desenvolver vínculos, responsabilidade, convivência, protagonismo juvenil e comunidade.
                </p>
            </div>
            <div class="grid grid-cols-1 gap-2">
                ${pilaresRenderizados}
            </div>
        </section>
    `;
}

function renderVideoHomeDVC({ src, poster = "", titulo = "", texto = "", etiqueta = "DVC em movimento" } = {}) {
    if (!src) return "";
    const posterAttr = poster ? `poster="${arquivoMidiaDVC(poster)}"` : "";

    return `
        <article class="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-4 shadow-sm transition-colors duration-200">
            <div class="relative rounded-2xl overflow-hidden bg-black mb-3">
                <video controls muted playsinline preload="metadata" ${posterAttr} class="w-full max-h-[280px] object-contain bg-black">
                    <source src="${arquivoMidiaDVC(src)}" type="video/quicktime">
                    Seu navegador não conseguiu carregar este vídeo.
                </video>
            </div>
            <p class="text-[9px] font-black uppercase text-[#990000] mb-1">${etiqueta}</p>
            <h3 class="text-sm font-black text-gray-900 dark:text-gray-200 uppercase leading-tight">${titulo}</h3>
            <p class="text-[10px] text-gray-500 dark:text-gray-400 font-semibold leading-relaxed mt-2">${texto}</p>
            <p class="text-[8px] text-gray-400 dark:text-gray-500 font-bold uppercase mt-3">Vídeo disponível no acervo do projeto.</p>
        </article>
    `;
}

function renderSecaoDvcEmMovimento() {
    return `
        <section class="space-y-3">
            <div>
                <p class="text-[10px] font-black uppercase text-[#990000]">DVC em movimento</p>
                <p class="text-[10px] font-semibold text-gray-500 leading-relaxed">
                    Vivências, treinos e momentos que mostram o projeto acontecendo na prática.
                </p>
            </div>
            <div class="space-y-3">
                ${renderVideoHomeDVC({
                    src: "treinoserinho2.mp4",
                    poster: "assets/img/treinoserginho.webp",
                    titulo: "Treino especial com Serginho",
                    texto: "Uma vivência com Sérgio Luiz, conhecido como Serginho, ex-voleibolista brasileiro, que compartilhou experiências de alto rendimento com nossos atletas. Atividade realizada graças ao apoio do Instituto Educa Cidades."
                })}
                ${renderVideoHomeDVC({
                    src: "123dvc.mp4",
                    poster: "assets/img/127-IMG_1749.webp",
                    titulo: "DVC em movimento",
                    texto: "Registros que mostram a energia dos treinos, a convivência e o cotidiano do projeto."
                })}
            </div>
        </section>
    `;
}

async function renderHome() {
    const c = document.getElementById('main-content');
    if (!c) return;

    const logoDVC = PROJETO_ATUAL_DVC?.logoFundoEscuro || PROJETO_ATUAL_DVC?.logo || 'assets/img/loki2.webp';
    let jaViuHomeDVC = false;

    try {
        jaViuHomeDVC = localStorage.getItem("dvc_home_historia_vista") === "sim";
    } catch (erro) {
        jaViuHomeDVC = true;
    }

    const avaliacaoMensalEquipeHtml = window.renderAvaliacaoMensalEquipeDVC ? await window.renderAvaliacaoMensalEquipeDVC("home") : "";

    const pilares = [
        ["fa-arrow-trend-up", "Desenvolvimento", "Evolução técnica, disciplina, responsabilidade e confiança para crescer dentro e fora da quadra."],
        ["fa-handshake-angle", "Vínculo", "Relações de cuidado, pertencimento e apoio que fortalecem o grupo."],
        ["fa-people-group", "Comunidade", "Um projeto construído com presença, corresponsabilidade e compromisso coletivo."]
    ];

    const trajetoria = [
        buscarMidiaHomeDVC("assets/img/jebh2024.webp", {
            ano: "2024",
            tituloCard: "JEBH",
            texto: "Primeiro campeonato do projeto e marco inicial da caminhada competitiva.",
            selo: "Estreia"
        }),
        buscarMidiaHomeDVC("assets/img/metro3.webp", {
            ano: "2025",
            tituloCard: "Campeonato Metropolitano de Escolas Públicas",
            texto: "2º lugar no Feminino e 3º lugar no Masculino.",
            selo: "Conquista"
        }),
        buscarMidiaHomeDVC("assets/img/estadual.webp", {
            ano: "2026",
            tituloCard: "Seletiva Estadual Escolar Sub-18",
            texto: "2º lugar em uma disputa de alto nível, consolidando a evolução esportiva do projeto.",
            selo: "Evolução"
        }),
        buscarMidiaHomeDVC("assets/img/campeaodjanira.webp", {
            ano: "DVC",
            tituloCard: "Experiências que formam",
            texto: "Cada competição amplia repertórios, fortalece vínculos e transforma esforço em experiência.",
            selo: "Vivência"
        })
    ];

    const processo = [
        buscarMidiaHomeDVC("assets/img/22-IMG_1226.webp", { legenda: "Escuta e orientação" }),
        buscarMidiaHomeDVC("assets/img/107-IMG_1672.webp", { titulo: "Treino", legenda: "Rotina e fundamento" }),
        buscarMidiaHomeDVC("assets/img/111-IMG_1703.webp", { legenda: "Organização coletiva" }),
        buscarMidiaHomeDVC("assets/img/IMG_3162.webp", { titulo: "Vínculo", legenda: "União antes do jogo" }),
        buscarMidiaHomeDVC("assets/img/treinoserginho.webp", { titulo: "Fundamento", legenda: "Desenvolvimento técnico" }),
        buscarMidiaHomeDVC("assets/img/IMG_3101.webp", { legenda: "Foco e presença" })
    ];

    const memorias = [
        buscarMidiaHomeDVC("assets/img/20260403_185449.webp", { titulo: "Identidade" }),
        buscarMidiaHomeDVC("assets/img/131-IMG_1773.webp"),
        buscarMidiaHomeDVC("assets/img/campeaodjanira.webp", { titulo: "Protagonismo" }),
        buscarMidiaHomeDVC("assets/img/treinoserginho.webp", { titulo: "Fundamento Técnico" }),
        buscarMidiaHomeDVC("assets/img/22-IMG_1226.webp", { titulo: "Orientação" }),
        buscarMidiaHomeDVC("assets/img/123-_MG_0342.webp", { titulo: "Vínculo" }),
        buscarMidiaHomeDVC("assets/img/formandos.webp", { titulo: "Formação Humana" }),
        buscarMidiaHomeDVC("assets/img/5-IMG_0946.webp"),
        buscarMidiaHomeDVC("assets/img/7-IMG_0969.webp", { titulo: "Protagonismo" }),
        buscarMidiaHomeDVC("assets/img/metro2.webp", { titulo: "Comunidade" })
    ];

    const hero = buscarMidiaHomeDVC("assets/img/127-IMG_1749.webp");
    const identidadePrincipal = buscarMidiaHomeDVC("assets/img/20260224_102424.webp");
    const identidadeSecundaria = buscarMidiaHomeDVC("assets/img/20260403_185449.webp");
    const alemDaQuadra = buscarMidiaHomeDVC("assets/img/formandos.webp");
    const resultadoFundo = buscarMidiaHomeDVC("assets/img/campeaodjanira.webp");

    c.innerHTML = `
        <div class="space-y-4 pb-24 fade-in">
            <section class="relative overflow-hidden rounded-3xl min-h-[235px] bg-gray-950 text-white shadow-xl">
                ${renderImagemHomeDVC(hero, "absolute inset-0 w-full h-full object-cover opacity-70", "eager")}
                <div class="absolute inset-0 bg-gradient-to-t from-black via-black/65 to-black/15"></div>
                <div class="absolute inset-0 bg-[#990000]/20"></div>
                <img src="${logoDVC}" alt="Loki DVC" class="absolute -right-8 -bottom-10 w-36 h-36 object-contain opacity-15" onerror="this.style.display='none'">

                <div class="relative z-10 min-h-[235px] p-5 flex flex-col justify-end">
                    <div class="mb-2 flex flex-wrap gap-1.5">
                        ${["Projeto Social", "Voleibol", "Juventude", "Comunidade"].map(chip => `
                            <span class="inline-flex items-center rounded-full bg-white/10 border border-white/20 px-2.5 py-1 text-[7px] font-black uppercase text-white/85 backdrop-blur">${chip}</span>
                        `).join("")}
                    </div>
                    <p class="text-[11px] font-black uppercase tracking-[0.18em] text-white/70">DVC</p>
                    <h1 class="text-3xl font-black leading-none uppercase mt-1">DVC</h1>
                    <h2 class="text-base font-black uppercase leading-tight text-white/95 mt-1">Desenvolvimento, Vínculo e Comunidade</h2>
                    <p class="text-[11px] font-semibold text-white/80 leading-relaxed mt-2 max-w-sm">
                        O voleibol como ponto de partida para formar, aproximar e transformar.
                    </p>
                    <div class="flex gap-2 mt-4">
                        <button onclick="window.scrollParaSecaoHomeDVC('sobre-projeto-home-dvc')" class="w-full inline-flex justify-center items-center gap-2 rounded-full bg-white px-5 py-3 text-[10px] font-black uppercase text-[#990000] shadow-lg active:scale-95 transition">
                            <i class="fa-solid fa-arrow-down"></i>
                            Sobre o Projeto
                        </button>
                        <button onclick="window.scrollParaSecaoHomeDVC('sobre-app-home-dvc', 'conteudo-sobre-app-home-dvc')" class="w-full inline-flex justify-center items-center gap-2 rounded-full bg-[#990000] px-5 py-3 text-[10px] font-black uppercase text-white shadow-lg active:scale-95 transition border border-white/10">
                            <i class="fa-solid fa-mobile-screen"></i>
                            Sobre o App
                        </button>
                    </div>
                </div>
            </section>



            ${avaliacaoMensalEquipeHtml}

            ${renderSobreAppHomeDVC()}
            ${renderSobreProjetoHomeDVC(pilares)}

            <section class="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-4 shadow-sm transition-colors duration-200">
                <div class="flex items-center justify-between gap-3">
                    <div>
                        <p class="text-[10px] font-black uppercase text-[#990000]">História do projeto</p>
                        <p id="texto-toggle-historia-home-dvc" class="text-[9px] font-semibold text-gray-500 dark:text-gray-400 leading-relaxed">
                            ${jaViuHomeDVC ? "A história completa fica recolhida para o uso diário ficar rápido." : "Toque para conhecer a trajetória, os processos e as memórias do DVC."}
                        </p>
                    </div>
                    <button id="btn-toggle-historia-home-dvc" onclick="toggleHistoriaHomeDVC()" class="shrink-0 rounded-full bg-[#990000] text-white px-4 py-3 text-[9px] font-black uppercase shadow-sm cursor-pointer">
                        <i class="fa-solid fa-chevron-down mr-2"></i> Conhecer nossa história
                    </button>
                </div>

                <div id="historia-home-dvc" class="hidden mt-5 space-y-5">
                    <section class="space-y-3">
                        <div>
                            <p class="text-[10px] font-black uppercase text-[#990000]">Identidade DVC</p>
                            <h2 class="text-lg font-black text-gray-900 dark:text-gray-200 uppercase leading-tight">Vestir a camisa, ocupar a quadra, construir história</h2>
                        </div>
                        <article class="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm transition-colors duration-200">
                            <div class="h-56 bg-gray-100 dark:bg-gray-950">
                                ${renderImagemHomeDVC(identidadePrincipal, "w-full h-full object-cover")}
                            </div>
                            <div class="p-5">
                                <p class="text-xs font-semibold text-gray-600 dark:text-gray-400 leading-relaxed">
                                    A identidade do DVC nasce da presença: jovens que ocupam a quadra, vestem a camisa e constroem juntos uma história coletiva.
                                </p>
                            </div>
                        </article>
                        <article class="relative overflow-hidden rounded-2xl min-h-[180px] bg-gray-950 text-white shadow-sm">
                            ${renderImagemHomeDVC(identidadeSecundaria, "absolute inset-0 w-full h-full object-cover opacity-65")}
                            <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent"></div>
                            <div class="relative z-10 min-h-[180px] p-4 flex flex-col justify-end">
                                <p class="text-[9px] font-black uppercase text-white/60">Presença e pertencimento</p>
                                <p class="text-xs font-black uppercase leading-snug mt-1">A bandeira, a camisa e o grupo viram linguagem de comunidade.</p>
                            </div>
                        </article>
                    </section>

                    <section class="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm transition-colors duration-200">
                        <div class="h-52 bg-gray-100 dark:bg-gray-950">
                            ${renderImagemHomeDVC(buscarMidiaHomeDVC("assets/img/interno.webp"), "w-full h-full object-cover")}
                        </div>
                        <div class="p-5">
                            <p class="text-[10px] font-black uppercase text-[#990000]">Mais que um time</p>
                            <h2 class="text-lg font-black uppercase text-gray-900 dark:text-gray-200 leading-tight mt-1">Mais que treino. Uma rede de apoio.</h2>
                            <p class="text-xs font-semibold text-gray-600 dark:text-gray-400 leading-relaxed mt-3">
                                Cada encontro é também um espaço de convivência, escuta, responsabilidade e construção coletiva. O DVC fortalece vínculos enquanto desenvolve atletas e pessoas.
                            </p>
                        </div>
                    </section>

                    <section class="space-y-3">
                        <div>
                            <p class="text-[10px] font-black uppercase text-[#990000]">Nossa trajetória</p>
                            <h2 class="text-lg font-black text-gray-900 dark:text-gray-200 uppercase leading-tight">Resultados que nasceram do processo</h2>
                        </div>
                        <div class="grid grid-cols-1 gap-3">
                            ${trajetoria.map(item => renderCardTrajetoriaDVC(item)).join("")}
                        </div>
                    </section>

                    ${renderCarrosselMidiasDVC(
                        "O processo também é conquista",
                        "Antes dos resultados, existe rotina: treino, conversa, presença, responsabilidade e vontade de evoluir junto.",
                        processo
                    )}

                    ${renderSecaoDvcEmMovimento()}

                    <section class="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm transition-colors duration-200">
                        <div class="h-56 bg-gray-100 dark:bg-gray-950">
                            ${renderImagemHomeDVC(alemDaQuadra, "w-full h-full object-cover")}
                        </div>
                        <div class="p-5">
                            <p class="text-[10px] font-black uppercase text-[#990000]">Além da quadra</p>
                            <h2 class="text-lg font-black uppercase text-gray-900 dark:text-gray-200 leading-tight mt-1">Desenvolvimento humano também é vitória.</h2>
                            <p class="text-xs font-semibold text-gray-600 dark:text-gray-400 leading-relaxed mt-3">
                                Nossa maior conquista acontece quando você ocupa o seu espaço no mundo. A quadra é apenas o ensaio para as grandes vitórias da sua vida, dos seus estudos e do seu futuro. O DVC caminha ao seu lado em cada passo.
                            </p>
                        </div>
                    </section>

                    <section class="relative overflow-hidden rounded-3xl min-h-[205px] bg-gray-950 text-white shadow-xl">
                        ${renderImagemHomeDVC(resultadoFundo, "absolute inset-0 w-full h-full object-cover opacity-45")}
                        <div class="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-[#990000]/70"></div>
                        <div class="relative z-10 p-5 min-h-[205px] flex flex-col justify-end">
                            <p class="text-[10px] font-black uppercase text-white/65">O QUE NOS SUSTENTA</p>
                            <p class="text-sm font-bold text-white leading-relaxed mt-3">
                                As medalhas e troféus contam parte da história. O que sustenta o DVC é o caminho: treinar, aprender, errar, tentar de novo, cuidar do outro e crescer coletivamente.
                            </p>
                        </div>
                    </section>

                    ${renderCarrosselMidiasDVC(
                        "Memórias DVC",
                        "Registros coletivos que guardam identidade, treino, vínculo, protagonismo e comunidade.",
                        memorias
                    )}
                </div>
            </section>

            <section class="relative overflow-hidden rounded-3xl bg-gray-950 p-5 text-white shadow-xl">
                <img src="${logoDVC}" alt="Loki DVC" class="absolute -right-6 -bottom-8 w-32 h-32 object-contain opacity-10" onerror="this.style.display='none'">
                <div class="relative z-10">
                    <p class="text-[10px] font-black uppercase text-white/60">Coletivo DVC</p>
                    <h2 class="text-xl font-black uppercase leading-tight mt-1">O DVC é feito por quem acredita no coletivo.</h2>
                    <p class="text-xs font-semibold text-white/70 leading-relaxed mt-3">
                        Sua presença não é apenas um número na chamada; é o que mantém nossa comunidade viva. Cada treino é uma oportunidade de amadurecer, assumir responsabilidades e construir uma história coletiva da qual você é o verdadeiro protagonista.
                    </p>
                    <div class="flex flex-col sm:flex-row gap-2 mt-5">
                    </div>
                </div>
            </section>
        </div>
    `;
}

// Bind to window for legacy onclick compatibility
window.marcarHomeDVCVista = marcarHomeDVCVista;
window.toggleHistoriaHomeDVC = toggleHistoriaHomeDVC;
window.scrollParaSecaoHomeDVC = scrollParaSecaoHomeDVC;
window.toggleSecaoHomeDVC = toggleSecaoHomeDVC;
window.renderHome = renderHome;

export {
    MIDIAS_HOME_DVC,
    arquivoMidiaDVC,
    buscarMidiaHomeDVC,
    classeImagemHomeDVC,
    renderImagemHomeDVC,
    renderCardPilarDVC,
    renderCardTrajetoriaDVC,
    renderCardProcessoDVC,
    renderCarrosselMidiasDVC,
    marcarHomeDVCVista,
    toggleHistoriaHomeDVC,
    scrollParaSecaoHomeDVC,
    toggleSecaoHomeDVC,
    renderSobreAppHomeDVC,
    renderSobreProjetoHomeDVC,
    renderVideoHomeDVC,
    renderSecaoDvcEmMovimento,
    renderHome
};
