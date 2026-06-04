/**
 * ============================================================================
 * Módulo: QUARTERLY-SURVEY
 * ============================================================================
 * Responsabilidade: Gerencia funcionalidades relacionadas a quarterly-survey.
 * Este arquivo faz parte do sistema modular do DVC App.
 * Todos os códigos principais aqui agrupados seguem as diretrizes do projeto.
 * ============================================================================
 */

// js/quarterly-survey.js
// Pesquisa Trimestral DVC - Acompanhamento do impacto social do projeto

import {
    auth,
    db,
    doc,
    setDoc,
    updateDoc,
    serverTimestamp
} from "./firebase.js";

const SURVEY_VERSION_DVC = "2026-06-trimestral-v1";

let etapaPesquisaDVC = 0; // 0 = Intro, 1 = P1, 2 = P2, 3 = P3, 4 = P4
let respostasRascunhoDVC = {};
let pesquisaTrimestralVeioDoBloqueio = false;

const PERGUNTAS_SUB17 = [
    {
        id: "tempoVinculo",
        pergunta: "Há quanto tempo você participa do DVC?",
        opcoes: [
            { valor: "A", texto: "Menos de 3 meses." },
            { valor: "B", texto: "Entre 3 e 6 meses." },
            { valor: "C", texto: "Entre 6 meses e 1 ano." },
            { valor: "D", texto: "Mais de 1 ano." }
        ]
    },
    {
        id: "objetivoProjeto",
        pergunta: "Qual é o seu principal objetivo no DVC neste momento?",
        opcoes: [
            { valor: "A", texto: "Aprender e melhorar no vôlei." },
            { valor: "B", texto: "Fazer parte de um grupo e fazer amizades." },
            { valor: "C", texto: "Participar de treinos, jogos e competições." },
            { valor: "D", texto: "Me desenvolver como pessoa." },
            { valor: "E", texto: "Ter um espaço seguro para estar e conviver." }
        ]
    },
    {
        id: "percepcaoSi",
        pergunta: "Comparando com o início do trimestre, como você percebe sua evolução pessoal?",
        opcoes: [
            { valor: "A", texto: "Estou mais responsável, focado e confiante." },
            { valor: "B", texto: "Melhorei em algumas coisas, mas ainda preciso evoluir." },
            { valor: "C", texto: "Ainda tenho dificuldade de perceber mudanças em mim." },
            { valor: "D", texto: "Não senti muita diferença neste trimestre." }
        ]
    },
    {
        id: "convivenciaOutro",
        pergunta: "Nas atividades do DVC, como você avalia sua convivência com os colegas?",
        opcoes: [
            { valor: "A", texto: "Melhorei muito em ouvir, respeitar e trabalhar em equipe." },
            { valor: "B", texto: "Tento conviver bem, mas às vezes ainda perco a paciência." },
            { valor: "C", texto: "Tenho dificuldade com algumas pessoas, mas estou tentando melhorar." },
            { valor: "D", texto: "Não percebi mudança na minha convivência." }
        ]
    },
    {
        id: "organizacaoCompromisso",
        pergunta: "Como você avalia sua responsabilidade com horários, presença, combinados e regras do projeto?",
        opcoes: [
            { valor: "A", texto: "Estou mais comprometido e responsável." },
            { valor: "B", texto: "Tenho melhorado, mas ainda falho em alguns combinados." },
            { valor: "C", texto: "Tenho dificuldade em manter compromisso." },
            { valor: "D", texto: "Não mudei muito nesse aspecto." }
        ]
    },
    {
        id: "usoTempoTelas",
        pergunta: "Participar do DVC ajudou você a equilibrar melhor seu tempo com celular, redes sociais ou jogos digitais?",
        opcoes: [
            { valor: "A", texto: "Sim, percebo que fico menos tempo nas telas." },
            { valor: "B", texto: "Um pouco, mas ainda passo muito tempo conectado." },
            { valor: "C", texto: "Não mudou meu tempo de tela." },
            { valor: "D", texto: "Não sei avaliar." }
        ]
    },
    {
        id: "espacoSeguroPertencimento",
        pergunta: "Você sente que o DVC é um espaço seguro para conviver, aprender, errar e crescer?",
        opcoes: [
            { valor: "A", texto: "Sim, me sinto acolhido e pertencente." },
            { valor: "B", texto: "Sim, mas acho que ainda podemos melhorar a integração." },
            { valor: "C", texto: "Às vezes me sinto à vontade, às vezes não." },
            { valor: "D", texto: "Não me sinto muito pertencente." }
        ]
    },
    {
        id: "perguntaAbertaSub17",
        pergunta: "Conte uma coisa que você aprendeu, melhorou ou percebeu sobre você neste trimestre.",
        tipo: "textarea"
    }
];

const PERGUNTAS_ADULTOS = [
    {
        id: "tempoVinculoAdulto",
        pergunta: "Há quanto tempo você participa do DVC?",
        opcoes: [
            { valor: "A", texto: "Menos de 3 meses." },
            { valor: "B", texto: "Entre 3 e 6 meses." },
            { valor: "C", texto: "Entre 6 meses e 1 ano." },
            { valor: "D", texto: "Mais de 1 ano." }
        ]
    },
    {
        id: "objetivoAdulto",
        pergunta: "Qual é o seu principal objetivo ao participar do DVC neste momento?",
        opcoes: [
            { valor: "A", texto: "Melhorar tecnicamente no vôlei." },
            { valor: "B", texto: "Manter uma rotina saudável de esporte e convivência." },
            { valor: "C", texto: "Participar de jogos, treinos e competições." },
            { valor: "D", texto: "Ajudar o projeto e fortalecer a comunidade." },
            { valor: "E", texto: "Me desenvolver como pessoa, atleta ou liderança." }
        ]
    },
    {
        id: "organizacaoAdulto",
        pergunta: "Como você avalia a organização do DVC neste trimestre?",
        opcoes: [
            { valor: "A", texto: "Muito boa: as informações, treinos e combinados estão claros." },
            { valor: "B", texto: "Boa, mas ainda existem pontos que podem melhorar." },
            { valor: "C", texto: "Regular: às vezes falta clareza sobre horários, regras ou decisões." },
            { valor: "D", texto: "Precisa melhorar bastante." }
        ]
    },
    {
        id: "qualidadeTreinosAdulto",
        pergunta: "Como você avalia os treinos e atividades oferecidos pelo DVC?",
        opcoes: [
            { valor: "A", texto: "São bem conduzidos e ajudam minha evolução." },
            { valor: "B", texto: "São bons, mas poderiam ter mais organização ou variação." },
            { valor: "C", texto: "Gosto de participar, mas sinto falta de mais orientação técnica." },
            { valor: "D", texto: "Ainda não percebo muita evolução com os treinos." }
        ]
    },
    {
        id: "convivenciaPertencimentoAdulto",
        pergunta: "Como você se sente em relação ao grupo e à convivência no DVC?",
        opcoes: [
            { valor: "A", texto: "Me sinto pertencente, respeitado e parte da comunidade." },
            { valor: "B", texto: "Tenho boa convivência, mas ainda posso me aproximar mais do grupo." },
            { valor: "C", texto: "Participo, mas às vezes me sinto distante." },
            { valor: "D", texto: "Tenho dificuldade de me sentir integrado ao grupo." }
        ]
    },
    {
        id: "responsabilidadeColetivaAdulto",
        pergunta: "Como você avalia sua participação na organização e fortalecimento do projeto?",
        opcoes: [
            { valor: "A", texto: "Participo ativamente e tento contribuir além dos treinos." },
            { valor: "B", texto: "Ajudo quando sou chamado ou quando percebo necessidade." },
            { valor: "C", texto: "Participo mais como jogador, mas posso contribuir mais." },
            { valor: "D", texto: "Ainda não tenho muita participação na organização coletiva." }
        ]
    },
    {
        id: "percepcaoPessoalAdulto",
        pergunta: "Neste trimestre, o que o DVC mais contribuiu para você?",
        opcoes: [
            { valor: "A", texto: "Disciplina e compromisso." },
            { valor: "B", texto: "Saúde física e mental." },
            { valor: "C", texto: "Amizades e convivência." },
            { valor: "D", texto: "Evolução técnica no esporte." },
            { valor: "E", texto: "Sentimento de pertencimento." },
            { valor: "F", texto: "Ainda não percebi uma contribuição clara." }
        ]
    },
    {
        id: "perguntaAbertaAdulto",
        pergunta: "Deixe uma sugestão, crítica ou comentário sobre como o DVC pode melhorar nos próximos meses.",
        tipo: "textarea"
    }
];

const PERGUNTAS_SUB17_CURTA = [
    {
        id: "tempoVinculo",
        pergunta: "Há quanto tempo você participa do DVC?",
        opcoes: [
            { valor: "A", texto: "Menos de 3 meses." },
            { valor: "B", texto: "Entre 3 e 6 meses." },
            { valor: "C", texto: "Entre 6 meses e 1 ano." },
            { valor: "D", texto: "Mais de 1 ano." }
        ]
    },
    {
        id: "chegadaProjetoSub17Curta",
        pergunta: "O que mais te motivou a entrar no DVC?",
        opcoes: [
            { valor: "A", texto: "Aprender ou melhorar no vôlei." },
            { valor: "B", texto: "Fazer amigos e participar de um grupo." },
            { valor: "C", texto: "Ter um espaço seguro para treinar e conviver." },
            { valor: "D", texto: "Participar de jogos e competições." },
            { valor: "E", texto: "Fui convidado por amigos, familiares ou pela escola." }
        ]
    },
    {
        id: "expectativaSub17Curta",
        pergunta: "O que você espera encontrar no DVC nos próximos meses?",
        opcoes: [
            { valor: "A", texto: "Evoluir no esporte." },
            { valor: "B", texto: "Me sentir parte de um grupo." },
            { valor: "C", texto: "Melhorar minha disciplina e responsabilidade." },
            { valor: "D", texto: "Ter momentos de lazer e convivência." },
            { valor: "E", texto: "Ainda estou conhecendo o projeto." }
        ]
    },
    {
        id: "primeiraPercepcaoSub17Curta",
        pergunta: "Nesse início, como você se sente no DVC?",
        opcoes: [
            { valor: "A", texto: "Acolhido e animado para continuar." },
            { valor: "B", texto: "Ainda tímido, mas com vontade de participar." },
            { valor: "C", texto: "Estou me adaptando aos poucos." },
            { valor: "D", texto: "Ainda não sei se me sinto pertencente." }
        ]
    },
    {
        id: "perguntaAbertaSub17Curta",
        pergunta: "Conte em poucas palavras o que você espera viver ou aprender no DVC.",
        tipo: "textarea"
    }
];

const PERGUNTAS_ADULTOS_CURTA = [
    {
        id: "tempoVinculoAdulto",
        pergunta: "Há quanto tempo você participa do DVC?",
        opcoes: [
            { valor: "A", texto: "Menos de 3 meses." },
            { valor: "B", texto: "Entre 3 e 6 meses." },
            { valor: "C", texto: "Entre 6 meses e 1 ano." },
            { valor: "D", texto: "Mais de 1 ano." }
        ]
    },
    {
        id: "objetivoInicialAdultoCurta",
        pergunta: "O que te motivou a participar do DVC?",
        opcoes: [
            { valor: "A", texto: "Melhorar tecnicamente no vôlei." },
            { valor: "B", texto: "Ter uma rotina saudável de esporte." },
            { valor: "C", texto: "Participar de jogos e treinos." },
            { valor: "D", texto: "Fazer parte de uma comunidade." },
            { valor: "E", texto: "Contribuir com o projeto." }
        ]
    },
    {
        id: "expectativaAdultoCurta",
        pergunta: "O que você espera do DVC nos próximos meses?",
        opcoes: [
            { valor: "A", texto: "Organização e continuidade nos treinos." },
            { valor: "B", texto: "Evolução técnica." },
            { valor: "C", texto: "Boa convivência e pertencimento." },
            { valor: "D", texto: "Mais oportunidades de participação." },
            { valor: "E", texto: "Ainda estou conhecendo o projeto." }
        ]
    },
    {
        id: "primeiraImpressaoAdultoCurta",
        pergunta: "Como você avalia sua chegada ao DVC até agora?",
        opcoes: [
            { valor: "A", texto: "Muito positiva, me senti acolhido." },
            { valor: "B", texto: "Boa, mas ainda estou me adaptando." },
            { valor: "C", texto: "Ainda tenho dúvidas sobre funcionamento e organização." },
            { valor: "D", texto: "Ainda não consigo avaliar." }
        ]
    },
    {
        id: "perguntaAbertaAdultoCurta",
        pergunta: "Deixe uma sugestão ou expectativa para sua participação no DVC.",
        tipo: "textarea"
    }
];

function obterPerguntasAtivasDVC() {
    const user = window.currentUserData;
    const isSub17 = usuarioEhSub17DVC(user);
    const primeiraPerguntaId = isSub17 ? "tempoVinculo" : "tempoVinculoAdulto";
    const respostaTempo = respostasRascunhoDVC[primeiraPerguntaId];
    
    if (respostaTempo === "A") {
        return isSub17 ? PERGUNTAS_SUB17_CURTA : PERGUNTAS_ADULTOS_CURTA;
    }
    return isSub17 ? PERGUNTAS_SUB17 : PERGUNTAS_ADULTOS;
}

function obterDataAtualDVC() {
    const isLocal = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1' || 
                    window.location.protocol === 'file:';
    const isTesting = isLocal || 
                      (window.currentUserData && window.currentUserData.funcao === 'ADM') ||
                      (typeof window.usuarioEhADM === "function" && window.usuarioEhADM(window.currentUserData)) ||
                      window.modoTestePerfilEmail;

    if (isTesting) {
        const urlParams = new URLSearchParams(window.location.search);
        const param = urlParams.get('data_teste');
        if (param) {
            const d = new Date(param + 'T12:00:00');
            if (!isNaN(d.getTime())) {
                return d;
            }
        }
    }
    return new Date();
}

function obterChaveTrimestreDVC(dataRef = obterDataAtualDVC()) {
    const ano = dataRef.getFullYear();
    const mes = dataRef.getMonth() + 1; // 1-12
    const trimestre = Math.floor((mes - 1) / 3) + 1; // 1-4
    return `${ano}-T${trimestre}`;
}

function obterChavePesquisaAtivaDVC(dataRef = obterDataAtualDVC()) {
    const ano = dataRef.getFullYear();
    const mes = dataRef.getMonth() + 1; // 1-12
    const dia = dataRef.getDate();
    const trimestre = Math.floor((mes - 1) / 3) + 1;
    const mesPesquisa = trimestre * 3; // Março (3), Junho (6), Setembro (9), Dezembro (12)

    // Se estiver no mês de pesquisa e dia >= 5, a pesquisa ativa é a do trimestre atual
    if (mes === mesPesquisa && dia >= 5) {
        return `${ano}-T${trimestre}`;
    }

    // Caso contrário, a pesquisa ativa obrigatória é a do trimestre anterior
    if (trimestre === 1) {
        return `${ano - 1}-T4`;
    } else {
        return `${ano}-T${trimestre - 1}`;
    }
}

function compararChavesTrimestres(c1, c2) {
    if (!c1 || !c2) return 0;
    const [a1, t1] = c1.split("-T").map(Number);
    const [a2, t2] = c2.split("-T").map(Number);
    if (a1 !== a2) return a1 - a2;
    return t1 - t2;
}

function obterIdadeUsuario(user) {
    const nascimento = user?.nascimento || user?.dataNascimento || "";
    if (!nascimento) return null;

    const data = new Date(nascimento);
    if (isNaN(data.getTime())) return null;

    const hoje = new Date();
    let idade = hoje.getFullYear() - data.getFullYear();
    const mes = hoje.getMonth() - data.getMonth();
    if (mes < 0 || (mes === 0 && hoje.getDate() < data.getDate())) {
        idade--;
    }
    return idade;
}

function usuarioEhSub17DVC(user = window.currentUserData) {
    if (!user) return false;
    
    const categoria = String(user.categoria || user.categoriaEtaria || "").toLowerCase();
    if (categoria.includes("sub17") || categoria.includes("sub-17")) {
        return true;
    }

    const idade = obterIdadeUsuario(user);
    return idade !== null && idade < 18;
}

function normalizarEmailParaIdDVC(email) {
    return String(email || "")
        .trim()
        .toLowerCase()
        .replace(/[@.]/g, "_");
}

function usuarioPrecisaPesquisaTrimestralDVC(user = window.currentUserData, dataRef = obterDataAtualDVC()) {
    if (!user) return false;
    const ehADM = (user && user.funcao === "ADM") || (typeof window.usuarioEhADM === "function" && window.usuarioEhADM(user));
    if (ehADM) return false;

    const chaveAtiva = obterChavePesquisaAtivaDVC(dataRef);
    if (user.ultimaPesquisaTrimestralChave === chaveAtiva) {
        return false;
    }

    // Verificar se o usuário é novo (criado após o início da pesquisa ativa)
    const dataCriacao = user.criadoEm ? new Date(user.criadoEm) : null;
    if (dataCriacao && !isNaN(dataCriacao.getTime())) {
        const chaveCriacao = obterChaveTrimestreDVC(dataCriacao);
        if (compararChavesTrimestres(chaveAtiva, chaveCriacao) < 0) {
            return false;
        }
    }

    return true;
}

function usuarioEstaPendentePesquisaTrimestralDVC(user = window.currentUserData, dataRef = obterDataAtualDVC()) {
    if (!user) return false;
    const ehADM = (user && user.funcao === "ADM") || (typeof window.usuarioEhADM === "function" && window.usuarioEhADM(user));
    if (ehADM) return false;

    const chaveAtiva = obterChavePesquisaAtivaDVC(dataRef);
    if (user.ultimaPesquisaTrimestralChave === chaveAtiva) {
        return false;
    }

    // Verificar se o usuário é novo
    const dataCriacao = user.criadoEm ? new Date(user.criadoEm) : null;
    if (dataCriacao && !isNaN(dataCriacao.getTime())) {
        const chaveCriacao = obterChaveTrimestreDVC(dataCriacao);
        if (compararChavesTrimestres(chaveAtiva, chaveCriacao) < 0) {
            return false;
        }
    }

    const [anoAtiva, trimAtiva] = chaveAtiva.split("-T").map(Number);
    const mesBloqueio = trimAtiva * 3; // Mês da pesquisa (3, 6, 9, 12)
    
    const anoAtual = dataRef.getFullYear();
    const mesAtual = dataRef.getMonth() + 1;
    const diaAtual = dataRef.getDate();

    if (anoAtual > anoAtiva) return true;
    if (anoAtual === anoAtiva) {
        if (mesAtual > mesBloqueio) return true;
        if (mesAtual === mesBloqueio && diaAtual > 15) return true;
    }

    return false;
}

async function garantirPendenciaBloqueioPesquisa(user, chaveAtiva) {
    if (!user) return;
    const ehADM = (user && user.funcao === "ADM") || (typeof window.usuarioEhADM === "function" && window.usuarioEhADM(user));
    if (ehADM) return;

    const email = user.email || auth.currentUser?.email;
    if (!email) return;
    const emailCanonico = String(email).trim().toLowerCase();
    const userDocId = user.documentIdDVC || emailCanonico;

    if (user.pesquisaTrimestralPendente !== true || user.bloqueioTemporarioPesquisa !== true || user.pesquisaTrimestralChavePendente !== chaveAtiva) {
        try {
            const updates = {
                pesquisaTrimestralPendente: true,
                bloqueioTemporarioPesquisa: true,
                pesquisaTrimestralChavePendente: chaveAtiva
            };
            await updateDoc(doc(db, "users", userDocId), updates);
            window.currentUserData = {
                ...window.currentUserData,
                ...updates
            };
            
            const statusDot = document.getElementById('status-dot');
            if (statusDot) {
                statusDot.className = "w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_red]";
            }
        } catch (e) {
            console.error("Erro ao atualizar pendência da pesquisa trimestral:", e);
        }
    }

    abrirBloqueioPesquisaTrimestralDVC(chaveAtiva);
}

async function limparFlagsBloqueioPesquisa(user) {
    if (!user) return;
    const email = user.email || auth.currentUser?.email;
    if (!email) return;
    const emailCanonico = String(email).trim().toLowerCase();
    const userDocId = user.documentIdDVC || emailCanonico;

    if (user.pesquisaTrimestralPendente === true || user.bloqueioTemporarioPesquisa === true) {
        try {
            const updates = {
                pesquisaTrimestralPendente: false,
                bloqueioTemporarioPesquisa: false
            };
            await updateDoc(doc(db, "users", userDocId), updates);
            window.currentUserData = {
                ...window.currentUserData,
                ...updates
            };
        } catch (e) {
            console.error("Erro ao limpar pendência da pesquisa trimestral:", e);
        }
    }
    document.getElementById("m-bloqueio-pesquisa-trimestral-dvc")?.remove();
    document.getElementById("m-pesquisa-trimestral-dvc")?.remove();
}

function abrirBloqueioPesquisaTrimestralDVC(chaveAtiva) {
    if (document.getElementById("m-bloqueio-pesquisa-trimestral-dvc")) return;
    if (document.getElementById("m-pesquisa-trimestral-dvc")) return;

    const modalHtml = `
        <div id="m-bloqueio-pesquisa-trimestral-dvc" class="fixed inset-0 bg-black/80 backdrop-blur-sm z-[130] p-4 flex items-center justify-center fade-in">
            <div class="bg-white w-full max-w-sm rounded-3xl p-6 relative shadow-2xl text-center border border-gray-100 flex flex-col gap-4">
                <div class="w-16 h-16 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-2">
                    <i class="fa-solid fa-clipboard-question text-red-600 text-3xl"></i>
                </div>

                <h2 class="font-black text-lg text-gray-800 uppercase leading-tight">
                    Pesquisa Trimestral Pendente
                </h2>

                <p class="text-xs text-gray-500 font-semibold leading-relaxed">
                    Você possui uma pesquisa trimestral pendente (${chaveAtiva}). Responda para regularizar seu acesso ao app.
                </p>

                <p class="text-[10px] text-gray-400 font-medium">
                    Suas respostas ajudam o DVC a buscar parcerias, prestar contas e melhorar nosso projeto social.
                </p>

                <button 
                    onclick="window.abrirPesquisaTrimestralDVC(true)" 
                    class="w-full bg-[#990000] text-white py-3.5 rounded-2xl font-black text-xs uppercase shadow-md hover:bg-[#7a0000] transition-colors mt-2">
                    Responder pesquisa
                </button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function abrirPesquisaTrimestralDVC(veioDoBloqueio = false) {
    pesquisaTrimestralVeioDoBloqueio = veioDoBloqueio;
    etapaPesquisaDVC = 0;
    respostasRascunhoDVC = {};

    document.getElementById("m-pesquisa-trimestral-dvc")?.remove();
    document.getElementById("m-bloqueio-pesquisa-trimestral-dvc")?.remove();

    const modalHtml = `
        <div id="m-pesquisa-trimestral-dvc" class="fixed inset-0 bg-black/80 backdrop-blur-sm z-[140] p-4 flex items-center justify-center fade-in">
            <div class="bg-white w-full max-w-md rounded-3xl shadow-2xl max-h-[92vh] overflow-hidden flex flex-col border border-gray-100">
                <!-- Cabeçalho -->
                <div class="bg-gradient-to-r from-gray-950 via-[#4b0d0d] to-[#990000] text-white p-5 flex flex-col gap-1.5">
                    <p id="survey-progresso-dvc" class="text-[8px] font-black uppercase text-white/60 tracking-wider">Apresentação</p>
                    <h2 class="text-sm font-black uppercase tracking-wide">Pesquisa Trimestral DVC</h2>
                    <p class="text-[9px] font-semibold text-white/70">
                        Acompanhamento de bem-estar e desenvolvimento humano.
                    </p>
                </div>

                <!-- Conteúdo -->
                <div id="survey-etapa-conteudo-dvc" class="p-5 overflow-y-auto custom-scroll flex-1">
                </div>

                <!-- Rodapé -->
                <div class="p-4 border-t bg-gray-50 flex gap-2">
                    <button id="btn-survey-voltar-dvc" onclick="window.voltarEtapaPesquisaTrimestralDVC()" class="hidden flex-1 bg-white border border-gray-200 text-gray-600 py-3 rounded-2xl text-[10px] font-black uppercase transition-colors hover:bg-gray-100">
                        Voltar
                    </button>
                    <button id="btn-survey-continuar-dvc" onclick="window.avancarEtapaPesquisaTrimestralDVC()" class="flex-1 bg-[#990000] text-white py-3 rounded-2xl text-[10px] font-black uppercase shadow-sm transition-colors hover:bg-[#7a0000]">
                        Continuar
                    </button>
                    <button id="btn-survey-salvar-dvc" onclick="window.salvarPesquisaTrimestralDVC()" class="hidden flex-1 bg-green-600 text-white py-3 rounded-2xl text-[10px] font-black uppercase shadow-sm transition-colors hover:bg-green-700">
                        Enviar pesquisa
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHtml);
    atualizarModalPesquisaTrimestralDVC();
}

function atualizarModalPesquisaTrimestralDVC() {
    const user = window.currentUserData;
    const isSub17 = usuarioEhSub17DVC(user);
    const perguntas = obterPerguntasAtivasDVC();

    const conteudoEl = document.getElementById("survey-etapa-conteudo-dvc");
    const progressoEl = document.getElementById("survey-progresso-dvc");
    const voltarBtn = document.getElementById("btn-survey-voltar-dvc");
    const continuarBtn = document.getElementById("btn-survey-continuar-dvc");
    const salvarBtn = document.getElementById("btn-survey-salvar-dvc");

    if (!conteudoEl) return;

    if (etapaPesquisaDVC === 0) {
        progressoEl.textContent = "Apresentação";
        voltarBtn.classList.add("hidden");
        continuarBtn.classList.remove("hidden");
        salvarBtn.classList.add("hidden");

        conteudoEl.innerHTML = `
            <div class="bg-red-50 border border-red-100 rounded-2xl p-4 text-left mb-4">
                <h3 class="text-[10px] font-black uppercase text-[#990000] mb-2">
                    Acompanhamento do Impacto Social
                </h3>
                <div class="space-y-3 text-[11px] font-medium leading-relaxed text-gray-700">
                    <p class="font-bold text-gray-800">Pesquisa Trimestral DVC</p>
                    <p>O DVC quer acompanhar não apenas o desempenho dentro da quadra, mas também o desenvolvimento humano, a convivência, o bem-estar e o impacto do projeto na vida de cada participante.</p>
                    <p>Esta pesquisa acontece a cada trimestre e nos ajuda a entender como o projeto tem contribuído para o foco, a responsabilidade, o uso saudável do tempo, a convivência em grupo e o direito ao esporte, à cultura e ao lazer seguro.</p>
                    <p>As respostas serão utilizadas de forma responsável para melhorar nossas actions, organizar relatórios, prestar contas e buscar parcerias e editais que fortaleçam o DVC. Sempre que possível, os dados serão analisados de forma coletiva, sem exposição individual.</p>
                    <p class="font-semibold text-gray-800">Responda com sinceridade. Não existe resposta certa ou errada. O mais importante é compreendermos como o projeto está chegando até você e como podemos melhorar juntos.</p>
                </div>
            </div>
        `;
    } else {
        progressoEl.textContent = `Etapa ${etapaPesquisaDVC} de ${perguntas.length}`;
        voltarBtn.classList.remove("hidden");

        if (etapaPesquisaDVC === perguntas.length) {
            continuarBtn.classList.add("hidden");
            salvarBtn.classList.remove("hidden");
        } else {
            continuarBtn.classList.remove("hidden");
            salvarBtn.classList.add("hidden");
        }

        const pergunta = perguntas[etapaPesquisaDVC - 1];
        const selecionada = respostasRascunhoDVC[pergunta.id] || "";

        let htmlOpcoes = "";
        const minLen = perguntas.length === 5 ? 5 : 10;

        if (pergunta.tipo === "textarea") {
            htmlOpcoes = `
                <div class="mt-4">
                    <label class="block text-[10px] font-black uppercase text-gray-500 mb-2">Sua Resposta</label>
                    <textarea 
                        id="survey-textarea-resposta" 
                        oninput="window.digitarRespostaAbertaPesquisaTrimestralDVC(this)"
                        placeholder="Relate com pelo menos ${minLen} caracteres..." 
                        class="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-xs font-bold text-gray-700 outline-none focus:border-[#990000] min-h-[120px] custom-scroll resize-none"
                    >${selecionada}</textarea>
                    <p id="survey-textarea-counter" class="text-[9px] text-gray-400 font-bold mt-1 text-right">
                        ${selecionada.length}/${minLen} caracteres mínimos
                    </p>
                </div>
            `;
        } else {
            htmlOpcoes = `
                <div class="flex flex-col gap-3 mt-4">
                    ${pergunta.opcoes.map(opcao => {
                        const ehSelecionada = selecionada === opcao.valor;
                        return `
                            <button 
                                onclick="window.selecionarRespostaPesquisaTrimestralDVC('${pergunta.id}', '${opcao.valor}')"
                                class="w-full text-left p-3.5 border rounded-2xl flex items-center justify-between text-xs font-bold transition-all duration-200 cursor-pointer ${
                                    ehSelecionada 
                                        ? "bg-red-50 border-[#990000] text-red-950 shadow-sm" 
                                        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                                }"
                            >
                                <span class="pr-2 leading-relaxed">${opcao.texto}</span>
                                <div class="w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                    ehSelecionada 
                                        ? "border-[#990000] bg-[#990000] text-white" 
                                        : "border-gray-300 bg-white text-transparent"
                                }">
                                    <i class="fa-solid fa-check text-[8px]"></i>
                                </div>
                            </button>
                        `;
                    }).join("")}
                </div>
            `;
        }

        conteudoEl.innerHTML = `
            <div class="space-y-4">
                <div class="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                    <span class="inline-block px-2.5 py-0.5 rounded-full bg-red-100 text-[#990000] text-[8px] font-black uppercase tracking-wider mb-2">
                        Questão ${etapaPesquisaDVC}
                    </span>
                    <h3 class="text-xs font-black text-gray-800 leading-relaxed uppercase">
                        ${pergunta.pergunta}
                    </h3>
                </div>
                ${htmlOpcoes}
            </div>
        `;
    }
}

function selecionarRespostaPesquisaTrimestralDVC(perguntaId, valorOpcao) {
    respostasRascunhoDVC[perguntaId] = valorOpcao;
    atualizarModalPesquisaTrimestralDVC();
}

function digitarRespostaAbertaPesquisaTrimestralDVC(textarea) {
    const perguntas = obterPerguntasAtivasDVC();
    const pergunta = perguntas[etapaPesquisaDVC - 1];

    const val = textarea.value;
    respostasRascunhoDVC[pergunta.id] = val;

    const minLen = perguntas.length === 5 ? 5 : 10;
    const counter = document.getElementById("survey-textarea-counter");
    if (counter) {
        counter.textContent = `${val.length}/${minLen} caracteres mínimos`;
        if (val.length >= minLen) {
            counter.className = "text-[9px] text-green-600 font-bold mt-1 text-right";
        } else {
            counter.className = "text-[9px] text-gray-400 font-bold mt-1 text-right";
        }
    }
}

function avancarEtapaPesquisaTrimestralDVC() {
    const user = window.currentUserData;
    const perguntas = obterPerguntasAtivasDVC();

    if (etapaPesquisaDVC === 0) {
        etapaPesquisaDVC = 1;
        atualizarModalPesquisaTrimestralDVC();
        return;
    }

    const pergunta = perguntas[etapaPesquisaDVC - 1];
    const resposta = respostasRascunhoDVC[pergunta.id] || "";

    if (!resposta.trim()) {
        alert("Por favor, selecione uma resposta antes de continuar.");
        return;
    }

    const minLen = perguntas.length === 5 ? 5 : 10;
    if (pergunta.tipo === "textarea" && resposta.trim().length < minLen) {
        alert(`Por favor, relate com pelo menos ${minLen} caracteres.`);
        return;
    }

    if (etapaPesquisaDVC < perguntas.length) {
        etapaPesquisaDVC++;
        atualizarModalPesquisaTrimestralDVC();
    }
}

function voltarEtapaPesquisaTrimestralDVC() {
    if (etapaPesquisaDVC > 0) {
        etapaPesquisaDVC--;
        atualizarModalPesquisaTrimestralDVC();
    }
}

async function salvarPesquisaTrimestralDVC() {
    const user = window.currentUserData;
    const isSub17 = usuarioEhSub17DVC(user);
    const perguntas = obterPerguntasAtivasDVC();

    const pergunta = perguntas[perguntas.length - 1]; // última pergunta
    const resposta = respostasRascunhoDVC[pergunta.id] || "";

    if (!resposta.trim()) {
        alert("Por favor, preencha a resposta antes de enviar.");
        return;
    }

    const minLen = perguntas.length === 5 ? 5 : 10;
    if (pergunta.tipo === "textarea" && resposta.trim().length < minLen) {
        alert(`Por favor, relate com pelo menos ${minLen} caracteres.`);
        return;
    }

    const email = user.email || auth.currentUser?.email;
    if (!email) {
        alert("Não foi possível identificar o seu e-mail.");
        return;
    }

    const emailCanonico = String(email).trim().toLowerCase();
    const emailNormalizado = normalizarEmailParaIdDVC(emailCanonico);
    const dataRef = obterDataAtualDVC();
    const chaveAtiva = obterChavePesquisaAtivaDVC(dataRef);
    const ano = dataRef.getFullYear();
    const mes = dataRef.getMonth() + 1;
    const trimestre = Math.floor((mes - 1) / 3) + 1;

    const docId = `${chaveAtiva}_${emailNormalizado}`;

    const botao = document.getElementById("btn-survey-salvar-dvc");
    if (botao) {
        botao.disabled = true;
        botao.textContent = "Enviando...";
    }

    const primeiraPerguntaId = isSub17 ? "tempoVinculo" : "tempoVinculoAdulto";
    const tempoDvcValor = respostasRascunhoDVC[primeiraPerguntaId] || "";

    let tempoDvcAmigavel = "";
    if (tempoDvcValor === "A") tempoDvcAmigavel = "menos_3_meses";
    else if (tempoDvcValor === "B") tempoDvcAmigavel = "entre_3_6_meses";
    else if (tempoDvcValor === "C") tempoDvcAmigavel = "entre_6_meses_1_ano";
    else if (tempoDvcValor === "D") tempoDvcAmigavel = "mais_1_ano";

    const ehEntrada = tempoDvcValor === "A";
    const tipoPesquisaAplicada = ehEntrada ? "entrada" : "impacto_trimestral";
    const pesquisaCompletaImpacto = !ehEntrada;

    // Limpar respostas órfãs: manter apenas respostas do questionário ativo
    const respostasFinal = {};
    perguntas.forEach(p => {
        if (respostasRascunhoDVC[p.id] !== undefined) {
            respostasFinal[p.id] = respostasRascunhoDVC[p.id];
        }
    });

    const responseDoc = {
        email: emailCanonico,
        nome: user.nome || "Atleta DVC",
        userId: auth.currentUser?.uid || user.uid || "",
        ano: ano,
        trimestre: trimestre,
        chaveTrimestre: chaveAtiva,
        tipoRespondente: isSub17 ? "sub17" : "adulto",
        respondidoEm: serverTimestamp(),
        respostas: respostasFinal,
        versaoPesquisa: SURVEY_VERSION_DVC,
        tempoDvc: tempoDvcAmigavel,
        tipoPesquisaAplicada: tipoPesquisaAplicada,
        pesquisaCompletaImpacto: pesquisaCompletaImpacto
    };

    try {
        // Grava no Firestore na coleção pesquisasTrimestrais
        await setDoc(doc(db, "pesquisasTrimestrais", docId), responseDoc);

        // Atualiza o documento users/{email}
        const userUpdates = {
            ultimaPesquisaTrimestralChave: chaveAtiva,
            ultimaPesquisaTrimestralRespondidaEm: serverTimestamp(),
            pesquisaTrimestralPendente: false,
            bloqueioTemporarioPesquisa: false,
            pesquisaTrimestralChavePendente: null
        };
        const userDocId = user.documentIdDVC || emailCanonico;
        await updateDoc(doc(db, "users", userDocId), userUpdates);

        // Atualiza localmente o window.currentUserData
        window.currentUserData = {
            ...window.currentUserData,
            ...userUpdates,
            documentIdDVC: userDocId,
            ultimaPesquisaTrimestralRespondidaEm: new Date().toISOString()
        };

        // Limpa as telas da pesquisa
        document.getElementById("m-pesquisa-trimestral-dvc")?.remove();
        document.getElementById("m-bloqueio-pesquisa-trimestral-dvc")?.remove();

        // Restaura status dot se aplicável
        const statusDot = document.getElementById('status-dot');
        if (statusDot) {
            const corFinanceiroUsuario = window.obterStatusFinanceiroEfetivo(window.currentUserData) === window.STATUS_FINANCEIRO_CARENCIA
                ? 'bg-yellow-400'
                : window.usuarioPodeSerConvocadoPorFinanceiro(window.currentUserData)
                    ? 'bg-green-500'
                    : 'bg-red-500';
            statusDot.className = `w-3 h-3 rounded-full ${window.usuarioPodeAprovarAvaliacoes() ? 'bg-blue-500 shadow-[0_0_8px_blue]' : corFinanceiroUsuario}`;
        }

        alert("Pesquisa trimestral enviada com sucesso! Obrigado por colaborar com o DVC.");
    } catch (e) {
        console.error("Erro ao salvar respostas:", e);
        alert("Não foi possível salvar suas respostas. Por favor, tente novamente.");
        if (botao) {
            botao.disabled = false;
            botao.textContent = "Enviar pesquisa";
        }
    }
}

function verificarFluxoPesquisaTrimestralDVC() {
    const user = window.currentUserData;
    if (!user) return;
    const ehADM = (user && user.funcao === "ADM") || (typeof window.usuarioEhADM === "function" && window.usuarioEhADM(user));
    if (ehADM) return;

    if (typeof window.usuarioPrecisaAtualizacaoSocioeconomicaDVC === "function" &&
        window.usuarioPrecisaAtualizacaoSocioeconomicaDVC(user)) {
        return; // Prioriza o questionário socioeconômico
    }

    const dataRef = obterDataAtualDVC();
    const chaveAtiva = obterChavePesquisaAtivaDVC(dataRef);

    if (user.ultimaPesquisaTrimestralChave === chaveAtiva) {
        if (user.pesquisaTrimestralPendente === true || user.bloqueioTemporarioPesquisa === true) {
            limparFlagsBloqueioPesquisa(user);
        }
        return;
    }

    // Verificar se o usuário é novo
    const dataCriacao = user.criadoEm ? new Date(user.criadoEm) : null;
    if (dataCriacao && !isNaN(dataCriacao.getTime())) {
        const chaveCriacao = obterChaveTrimestreDVC(dataCriacao);
        if (compararChavesTrimestres(chaveAtiva, chaveCriacao) < 0) {
            return;
        }
    }

    const anoRef = dataRef.getFullYear();
    const mesRef = dataRef.getMonth() + 1;
    const diaRef = dataRef.getDate();
    
    const trimestreRef = Math.floor((mesRef - 1) / 3) + 1;
    const mesAbertura = trimestreRef * 3; 

    const estaNoMesAbertura = (mesRef === mesAbertura);
    const estaAberto = estaNoMesAbertura && (diaRef >= 5);
    const eTrimestreAnterior = (chaveAtiva !== `${anoRef}-T${trimestreRef}`);

    if (estaAberto || eTrimestreAnterior) {
        const ehBloqueio = eTrimestreAnterior || (estaNoMesAbertura && diaRef > 15);

        if (ehBloqueio) {
            garantirPendenciaBloqueioPesquisa(user, chaveAtiva);
        } else {
            abrirPesquisaTrimestralDVC(false);
        }
    }
}

// Expor funções públicas no objeto window
window.obterDataAtualDVC = obterDataAtualDVC;
window.obterChaveTrimestreDVC = obterChaveTrimestreDVC;
window.obterChavePesquisaAtivaDVC = obterChavePesquisaAtivaDVC;
window.compararChavesTrimestres = compararChavesTrimestres;
window.usuarioEhSub17DVC = usuarioEhSub17DVC;
window.usuarioPrecisaPesquisaTrimestralDVC = usuarioPrecisaPesquisaTrimestralDVC;
window.usuarioEstaPendentePesquisaTrimestralDVC = usuarioEstaPendentePesquisaTrimestralDVC;
window.abrirBloqueioPesquisaTrimestralDVC = abrirBloqueioPesquisaTrimestralDVC;
window.abrirPesquisaTrimestralDVC = abrirPesquisaTrimestralDVC;
window.atualizarModalPesquisaTrimestralDVC = atualizarModalPesquisaTrimestralDVC;
window.selecionarRespostaPesquisaTrimestralDVC = selecionarRespostaPesquisaTrimestralDVC;
window.digitarRespostaAbertaPesquisaTrimestralDVC = digitarRespostaAbertaPesquisaTrimestralDVC;
window.avancarEtapaPesquisaTrimestralDVC = avancarEtapaPesquisaTrimestralDVC;
window.voltarEtapaPesquisaTrimestralDVC = voltarEtapaPesquisaTrimestralDVC;
window.salvarPesquisaTrimestralDVC = salvarPesquisaTrimestralDVC;
window.verificarFluxoPesquisaTrimestralDVC = verificarFluxoPesquisaTrimestralDVC;
