// HOME TAB RENDER MODULE DVC APP

import { PROJETO_ATUAL_DVC } from "./state.js";

const MIDIAS_HOME_DVC = [
    { src: "127-IMG_1749.jpg", titulo: "Juventude e pertencimento", categoria: "vinculo", tipo: "imagem", proporcao: "hero", position: "center center", alt: "Atletas do DVC em momento de integração" },
    { src: "20260224_102424.jpg", titulo: "Identidade em quadra", categoria: "identidade", tipo: "imagem", proporcao: "grupo", position: "center center", alt: "Equipe DVC reunida em quadra" },
    { src: "20260403_185449.jpg", titulo: "Camisa, bandeira e presença", categoria: "identidade", tipo: "imagem", proporcao: "grupo", position: "center center", alt: "Atletas do DVC com identidade do projeto" },
    { src: "campeaodjanira.jpg", titulo: "Experiência competitiva", categoria: "conquista", tipo: "imagem", proporcao: "trofeu", position: "center center", alt: "Equipe DVC em registro de conquista" },
    { src: "formandos.jpg", titulo: "Além da quadra", categoria: "impacto", tipo: "imagem", proporcao: "grupo", position: "center center", alt: "Registro institucional de trajetória além da quadra" },
    { src: "IMG_3101.JPG", titulo: "Concentração", categoria: "processo", tipo: "imagem", proporcao: "portrait", position: "center 30%", alt: "Atleta do DVC em momento de concentração" },
    { src: "IMG_3162.JPG", titulo: "União", categoria: "vinculo", tipo: "imagem", proporcao: "grupo", position: "center center", alt: "Equipe DVC em roda de união" },
    { src: "treinoserginho.jpg", titulo: "Fundamento técnico", categoria: "processo", tipo: "imagem", proporcao: "portrait", position: "center center", alt: "Registro do DVC em treino técnico" },
    { src: "treinoserinho2.MOV", titulo: "Treino em movimento", categoria: "processo", tipo: "video", proporcao: "video", position: "center center", alt: "Vídeo de treino do DVC" },
    { src: "123dvc.MOV", titulo: "DVC em movimento", categoria: "vinculo", tipo: "video", proporcao: "video", position: "center center", alt: "Vídeo institucional do DVC" },
    { src: "22-IMG_1226.jpg", titulo: "Orientação", categoria: "processo", tipo: "imagem", proporcao: "grupo", position: "center center", alt: "Atletas do DVC em roda de orientação" },
    { src: "107-IMG_1672.jpg", titulo: "Treino orientado", categoria: "processo", tipo: "imagem", proporcao: "wide", position: "center center", alt: "Registro do DVC em orientação de treino" },
    { src: "111-IMG_1703.jpg", titulo: "Conversa de equipe", categoria: "processo", tipo: "imagem", proporcao: "grupo", position: "center center", alt: "Equipe DVC em conversa de treino" },
    { src: "7-IMG_0969.jpg", titulo: "Movimento", categoria: "processo", tipo: "imagem", proporcao: "portrait", position: "center center", alt: "Atleta do DVC em ação esportiva" },
    { src: "5-IMG_0946.jpg", titulo: "Protagonismo", categoria: "processo", tipo: "imagem", proporcao: "portrait", position: "center center", alt: "Atleta do DVC em momento de protagonismo" },
    { src: "1-IMG_0907.jpg", titulo: "Pertencimento", categoria: "vinculo", tipo: "imagem", proporcao: "portrait", position: "center center", alt: "Registro de pertencimento do DVC" },
    { src: "123-_MG_0342.jpg", titulo: "Coletivo", categoria: "vinculo", tipo: "imagem", proporcao: "wide", position: "center center", alt: "Atletas do DVC em momento coletivo" },
    { src: "131-IMG_1773.jpg", titulo: "Comunidade", categoria: "comunidade", tipo: "imagem", proporcao: "grupo", position: "center center", alt: "Atletas do DVC em momento de comunidade" },
    { src: "interno.jpg", titulo: "Integração", categoria: "comunidade", tipo: "imagem", proporcao: "grupo", position: "center center", alt: "Atletas do DVC em momento de integração" },
    { src: "jebh2024.jpg", titulo: "JEBH 2024", categoria: "trajetoria", tipo: "imagem", proporcao: "grupo", position: "center center", alt: "Equipe DVC no campeonato JEBH 2024" },
    { src: "metro1.jpg", titulo: "Metropolitano 2025", categoria: "trajetoria", tipo: "imagem", proporcao: "trofeu", position: "center center", alt: "Equipe DVC no Campeonato Metropolitano 2025" },
    { src: "metro2.jpg", titulo: "Metropolitano 2025", categoria: "trajetoria", tipo: "imagem", proporcao: "trofeu", position: "center center", alt: "Conquista no Campeonato Metropolitano 2025" },
    { src: "metro3.jpg", titulo: "Metropolitano 2025", categoria: "trajetoria", tipo: "imagem", proporcao: "grupo", position: "center center", alt: "Vice-campeonato no Campeonato Metropolitano 2025" },
    { src: "estadual.jpg", titulo: "Estadual Sub-18", categoria: "trajetoria", tipo: "imagem", proporcao: "grupo", position: "center center", alt: "Equipe DVC na seletiva estadual escolar sub-18" }
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
        <div class="bg-white border border-gray-100 rounded-3xl p-4 shadow-sm flex gap-3">
            <div class="w-10 h-10 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                <i class="fa-solid ${icone} text-[#990000] text-sm"></i>
            </div>
            <div>
                <h3 class="text-xs font-black uppercase text-gray-800 leading-none">${titulo}</h3>
                <p class="text-[10px] text-gray-500 font-semibold leading-relaxed mt-2">${texto}</p>
            </div>
        </div>
    `;
}

function renderCardTrajetoriaDVC(item) {
    return `
        <article class="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm flex flex-col">
            <div class="h-48 bg-gray-100">
                ${renderImagemHomeDVC(item, "w-full h-full object-cover")}
            </div>
            <div class="p-4 flex-1 flex flex-col justify-between">
                <div>
                    <div class="flex items-center justify-between gap-2 mb-2">
                        <span class="bg-[#990000] text-white text-[8px] font-black px-2 py-0.5 rounded uppercase">
                            ${item.ano}
                        </span>
                        <span class="bg-gray-100 text-gray-500 text-[7px] font-black px-2 py-0.5 rounded uppercase">
                            ${item.selo}
                        </span>
                    </div>
                    <h3 class="text-xs font-black uppercase text-gray-800 leading-tight">
                        ${item.tituloCard || item.titulo}
                    </h3>
                    <p class="text-[10px] text-gray-500 font-semibold leading-relaxed mt-2">
                        ${item.texto}
                    </p>
                </div>
            </div>
        </article>
    `;
}

function renderCardProcessoDVC(item) {
    return `
        <div class="snap-center shrink-0 w-[200px] bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm flex flex-col">
            <div class="h-32 bg-gray-100">
                ${renderImagemHomeDVC(item, "w-full h-full object-cover")}
            </div>
            <div class="p-3 flex-1 flex flex-col justify-between">
                <div>
                    <p class="text-[8px] font-bold text-gray-400 uppercase truncate">
                        ${item.titulo}
                    </p>
                    <p class="text-[9px] font-semibold text-gray-600 leading-snug mt-1 h-7 overflow-hidden line-clamp-2">
                        ${item.legenda}
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
            <div class="flex gap-3 overflow-x-auto custom-scroll snap-x snap-mandatory pb-2 -mx-1 px-1">
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

function renderAcessoRapidoHomeDVC() {
    const atalhos = [
        { tab: "mural", label: "Mural", icone: "fa-bullhorn" },
        { tab: "calendar", label: "Agenda", icone: "fa-calendar-days" },
        { tab: "profile", label: "Perfil", icone: "fa-user" }
    ];

    return `
        <section class="bg-white border border-gray-100 rounded-3xl p-4 shadow-sm">
            <div class="flex items-center justify-between gap-3 mb-3">
                <div>
                    <p class="text-[10px] font-black uppercase text-[#990000]">Acesso rápido</p>
                    <p class="text-[9px] font-semibold text-gray-400 uppercase">Para o uso diário do app</p>
                </div>
                <i class="fa-solid fa-bolt text-[#990000]"></i>
            </div>
            <div class="grid grid-cols-3 gap-2">
                ${atalhos.map(item => `
                    <button onclick="marcarHomeDVCVista(); if(typeof window.changeTab === 'function') window.changeTab('${item.tab}')" class="bg-gray-50 text-[#990000] rounded-2xl py-3 px-2 text-[9px] font-black uppercase shadow-sm border border-gray-100 active:scale-95 transition">
                        <i class="fa-solid ${item.icone} block text-base mb-1"></i>
                        ${item.label}
                    </button>
                `).join("")}
            </div>
        </section>
    `;
}

function renderVideoHomeDVC({ src, poster = "", titulo = "", texto = "", etiqueta = "DVC em movimento" } = {}) {
    if (!src) return "";
    const posterAttr = poster ? `poster="${arquivoMidiaDVC(poster)}"` : "";

    return `
        <article class="bg-white border border-gray-100 rounded-3xl p-4 shadow-sm">
            <div class="relative rounded-2xl overflow-hidden bg-black mb-3">
                <video controls muted playsinline preload="metadata" ${posterAttr} class="w-full max-h-[280px] object-contain bg-black">
                    <source src="${arquivoMidiaDVC(src)}" type="video/quicktime">
                    Seu navegador não conseguiu carregar este vídeo.
                </video>
            </div>
            <p class="text-[9px] font-black uppercase text-[#990000] mb-1">${etiqueta}</p>
            <h3 class="text-sm font-black text-gray-900 uppercase leading-tight">${titulo}</h3>
            <p class="text-[10px] text-gray-500 font-semibold leading-relaxed mt-2">${texto}</p>
            <p class="text-[8px] text-gray-400 font-bold uppercase mt-3">Vídeo disponível no acervo do projeto.</p>
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
                    src: "treinoserinho2.MOV",
                    poster: "treinoserginho.jpg",
                    titulo: "Treino especial com Serginho",
                    texto: "Uma vivência com Sérgio Luiz, conhecido como Serginho, ex-voleibolista brasileiro, que compartilhou experiências de alto rendimento com nossos atletas. Atividade realizada graças ao apoio do Instituto Educa Cidades."
                })}
                ${renderVideoHomeDVC({
                    src: "123dvc.MOV",
                    poster: "127-IMG_1749.jpg",
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

    const logoDVC = PROJETO_ATUAL_DVC?.logoFundoEscuro || PROJETO_ATUAL_DVC?.logo || 'Loki2.png';
    let jaViuHomeDVC = false;

    try {
        jaViuHomeDVC = localStorage.getItem("dvc_home_historia_vista") === "sim";
    } catch (erro) {
        jaViuHomeDVC = true;
    }

    const avisosHomeHtml = window.renderAvisosHomeDVC ? await window.renderAvisosHomeDVC() : "";
    const avaliacaoMensalEquipeHtml = window.renderAvaliacaoMensalEquipeDVC ? await window.renderAvaliacaoMensalEquipeDVC("home") : "";

    const pilares = [
        ["fa-arrow-trend-up", "Desenvolvimento", "Evolução técnica, disciplina, responsabilidade e confiança para crescer dentro e fora da quadra."],
        ["fa-handshake-angle", "Vínculo", "Relações de cuidado, pertencimento e apoio que fortalecem o grupo."],
        ["fa-people-group", "Comunidade", "Um projeto construído com presença, corresponsabilidade e compromisso coletivo."]
    ];

    const trajetoria = [
        buscarMidiaHomeDVC("jebh2024.jpg", {
            ano: "2024",
            tituloCard: "JEBH",
            texto: "Primeiro campeonato do projeto e marco inicial da caminhada competitiva.",
            selo: "Estreia"
        }),
        buscarMidiaHomeDVC("metro3.jpg", {
            ano: "2025",
            tituloCard: "Campeonato Metropolitano de Escolas Públicas",
            texto: "2º lugar no Feminino e 3º lugar no Masculino.",
            selo: "Conquista"
        }),
        buscarMidiaHomeDVC("estadual.jpg", {
            ano: "2026",
            tituloCard: "Seletiva Estadual Escolar Sub-18",
            texto: "2º lugar em uma disputa de alto nível, consolidando a evolução esportiva do projeto.",
            selo: "Evolução"
        }),
        buscarMidiaHomeDVC("campeaodjanira.jpg", {
            ano: "DVC",
            tituloCard: "Experiências que formam",
            texto: "Cada competição amplia repertórios, fortalece vínculos e transforma esforço em experiência.",
            selo: "Vivência"
        })
    ];

    const processo = [
        buscarMidiaHomeDVC("22-IMG_1226.jpg", { legenda: "Escuta e orientação" }),
        buscarMidiaHomeDVC("107-IMG_1672.jpg", { titulo: "Treino", legenda: "Rotina e fundamento" }),
        buscarMidiaHomeDVC("111-IMG_1703.jpg", { legenda: "Organização coletiva" }),
        buscarMidiaHomeDVC("IMG_3162.JPG", { titulo: "Vínculo", legenda: "União antes do jogo" }),
        buscarMidiaHomeDVC("treinoserginho.jpg", { titulo: "Fundamento", legenda: "Desenvolvimento técnico" }),
        buscarMidiaHomeDVC("IMG_3101.JPG", { legenda: "Foco e presença" })
    ];

    const memorias = [
        buscarMidiaHomeDVC("20260403_185449.jpg", { titulo: "Identidade" }),
        buscarMidiaHomeDVC("131-IMG_1773.jpg"),
        buscarMidiaHomeDVC("campeaodjanira.jpg", { titulo: "Conquista" }),
        buscarMidiaHomeDVC("treinoserginho.jpg"),
        buscarMidiaHomeDVC("22-IMG_1226.jpg", { titulo: "Orientação" }),
        buscarMidiaHomeDVC("123-_MG_0342.jpg"),
        buscarMidiaHomeDVC("formandos.jpg"),
        buscarMidiaHomeDVC("5-IMG_0946.jpg"),
        buscarMidiaHomeDVC("7-IMG_0969.jpg"),
        buscarMidiaHomeDVC("metro2.jpg", { titulo: "Resultado" })
    ];

    const hero = buscarMidiaHomeDVC("127-IMG_1749.jpg");
    const identidadePrincipal = buscarMidiaHomeDVC("20260224_102424.jpg");
    const identidadeSecundaria = buscarMidiaHomeDVC("20260403_185449.jpg");
    const alemDaQuadra = buscarMidiaHomeDVC("formandos.jpg");
    const resultadoFundo = buscarMidiaHomeDVC("campeaodjanira.jpg");

    c.innerHTML = `
        <div class="space-y-4 pb-6 fade-in">
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
                    <button onclick="marcarHomeDVCVista(); if(typeof window.changeTab === 'function') window.changeTab('mural')" class="mt-4 inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-3 text-[10px] font-black uppercase text-[#990000] shadow-lg active:scale-95 transition">
                        <i class="fa-solid fa-arrow-right"></i>
                        Acessar o app
                    </button>
                </div>
            </section>

            ${renderAcessoRapidoHomeDVC()}

            ${avisosHomeHtml}
            ${avaliacaoMensalEquipeHtml}

            <section class="space-y-3">
                <div>
                    <p class="text-[10px] font-black uppercase text-[#990000]">O que significa DVC?</p>
                    <h2 class="text-lg font-black text-gray-900 uppercase leading-tight">Três pilares, uma comunidade</h2>
                </div>
                <div class="grid grid-cols-1 gap-3">
                    ${pilares.map(pilar => renderCardPilarDVC(...pilar)).join("")}
                </div>
            </section>

            <section class="bg-white border border-gray-100 rounded-3xl p-4 shadow-sm">
                <div class="flex items-center justify-between gap-3">
                    <div>
                        <p class="text-[10px] font-black uppercase text-[#990000]">História do projeto</p>
                        <p id="texto-toggle-historia-home-dvc" class="text-[9px] font-semibold text-gray-500 leading-relaxed">
                            ${jaViuHomeDVC ? "A história completa fica recolhida para o uso diário ficar rápido." : "Toque para conhecer a trajetória, os processos e as memórias do DVC."}
                        </p>
                    </div>
                    <button id="btn-toggle-historia-home-dvc" onclick="toggleHistoriaHomeDVC()" class="shrink-0 rounded-full bg-[#990000] text-white px-4 py-3 text-[9px] font-black uppercase shadow-sm">
                        <i class="fa-solid fa-chevron-down mr-2"></i> Conhecer nossa história
                    </button>
                </div>

                <div id="historia-home-dvc" class="hidden mt-5 space-y-5">
                    <section class="space-y-3">
                        <div>
                            <p class="text-[10px] font-black uppercase text-[#990000]">Identidade DVC</p>
                            <h2 class="text-lg font-black text-gray-900 uppercase leading-tight">Vestir a camisa, ocupar a quadra, construir história</h2>
                        </div>
                        <article class="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                            <div class="h-56 bg-gray-100">
                                ${renderImagemHomeDVC(identidadePrincipal, "w-full h-full object-cover")}
                            </div>
                            <div class="p-5">
                                <p class="text-xs font-semibold text-gray-600 leading-relaxed">
                                    A identidade do DVC nasce da presença: jovens que ocupam a quadra, vestem a camisa and constroem juntos uma história coletiva.
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

                    <section class="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                        <div class="h-52 bg-gray-100">
                            ${renderImagemHomeDVC(buscarMidiaHomeDVC("interno.jpg"), "w-full h-full object-cover")}
                        </div>
                        <div class="p-5">
                            <p class="text-[10px] font-black uppercase text-[#990000]">Mais que um time</p>
                            <h2 class="text-lg font-black uppercase text-gray-900 leading-tight mt-1">Mais que treino. Uma rede de apoio.</h2>
                            <p class="text-xs font-semibold text-gray-600 leading-relaxed mt-3">
                                Cada encontro é também um espaço de convivência, escuta, responsabilidade e construção coletiva. O DVC fortalece vínculos enquanto desenvolve atletas e pessoas.
                            </p>
                        </div>
                    </section>

                    <section class="space-y-3">
                        <div>
                            <p class="text-[10px] font-black uppercase text-[#990000]">Nossa trajetória</p>
                            <h2 class="text-lg font-black text-gray-900 uppercase leading-tight">Resultados que nasceram do processo</h2>
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

                    <section class="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                        <div class="h-56 bg-gray-100">
                            ${renderImagemHomeDVC(alemDaQuadra, "w-full h-full object-cover")}
                        </div>
                        <div class="p-5">
                            <p class="text-[10px] font-black uppercase text-[#990000]">Além da quadra</p>
                            <h2 class="text-lg font-black uppercase text-gray-900 leading-tight mt-1">Desenvolvimento humano também é vitória.</h2>
                            <p class="text-xs font-semibold text-gray-600 leading-relaxed mt-3">
                                O DVC também acompanha sonhos que ultrapassam a quadra. Quando um jovem segue estudando, celebrando conquistas e fortalecendo sua trajetória, o projeto também cumpre seu papel.
                            </p>
                        </div>
                    </section>

                    <section class="relative overflow-hidden rounded-3xl min-h-[205px] bg-gray-950 text-white shadow-xl">
                        ${renderImagemHomeDVC(resultadoFundo, "absolute inset-0 w-full h-full object-cover opacity-45")}
                        <div class="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-[#990000]/70"></div>
                        <div class="relative z-10 p-5 min-h-[205px] flex flex-col justify-end">
                            <p class="text-[10px] font-black uppercase text-white/65">Mais que resultado</p>
                            <p class="text-sm font-bold text-white leading-relaxed mt-3">
                                As medalhas e troféus contam parte da história. O que sustenta o DVC é o caminho: treinar, aprender, errar, voltar, cuidar do outro e crescer como grupo.
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
                        Cada presença fortalece o projeto. Cada treino constrói uma história. Cada atleta faz parte dessa comunidade.
                    </p>
                    <div class="flex flex-col sm:flex-row gap-2 mt-5">
                        <button onclick="marcarHomeDVCVista(); if(typeof window.changeTab === 'function') window.changeTab('mural')" class="w-full rounded-full bg-white text-[#990000] py-3 text-[10px] font-black uppercase shadow-lg">
                            Ver Mural
                        </button>
                        <button onclick="marcarHomeDVCVista(); if(typeof window.changeTab === 'function') window.changeTab('calendar')" class="w-full rounded-full bg-[#990000] text-white py-3 text-[10px] font-black uppercase border border-white/10">
                            Ver Agenda
                        </button>
                    </div>
                </div>
            </section>
        </div>
    `;
}

// Bind to window for legacy onclick compatibility
window.marcarHomeDVCVista = marcarHomeDVCVista;
window.toggleHistoriaHomeDVC = toggleHistoriaHomeDVC;
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
    renderAcessoRapidoHomeDVC,
    renderVideoHomeDVC,
    renderSecaoDvcEmMovimento,
    renderHome
};
