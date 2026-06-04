/**
 * ============================================================================
 * Módulo: PACTO
 * ============================================================================
 * Responsabilidade: Gerencia funcionalidades relacionadas a pacto.
 * Este arquivo faz parte do sistema modular do DVC App.
 * Todos os códigos principais aqui agrupados seguem as diretrizes do projeto.
 * ============================================================================
 */

// js/pacto.js
// Implementação do Pacto de Convivência DVC

import { db, doc, updateDoc, serverTimestamp } from "./firebase.js";

const PACTO_VERSAO_ATUAL = "2026-06-pacto-v1";

function usuarioPrecisaAceitarPactoDVC(user) {
    if (!user) return false;
    return user.pactoDvcAceito !== true || user.pactoDvcVersao !== PACTO_VERSAO_ATUAL;
}

function verificarFluxoPactoDVC(user = window.currentUserData) {
    if (usuarioPrecisaAceitarPactoDVC(user)) {
        abrirPactoDVC();
        return false;
    }
    return true;
}

function abrirPactoDVC() {
    if (document.getElementById("m-pacto-dvc")) return;

    const modalHtml = `
        <div id="m-pacto-dvc" class="fixed inset-0 bg-black/90 backdrop-blur-sm z-[150] p-4 flex items-center justify-center fade-in">
            <div class="bg-white w-full max-w-lg h-[85vh] rounded-3xl shadow-2xl relative flex flex-col overflow-hidden border border-gray-100">
                
                <!-- Cabeçalho Fixo -->
                <div class="bg-gradient-to-r from-gray-950 via-[#4b0d0d] to-[#990000] text-white p-5 shrink-0 shadow-md z-10">
                    <p class="text-[8px] font-black uppercase text-white/60 tracking-wider mb-1">Nosso Pacto DVC</p>
                    <h2 class="text-sm font-black uppercase tracking-wide">Um compromisso para construir um ambiente seguro</h2>
                    <p class="text-[9px] font-semibold text-white/80 mt-1">
                        O DVC é mais do que um espaço de treino. É uma comunidade de aprendizagem, convivência, respeito e desenvolvimento humano.
                    </p>
                </div>

                <!-- Conteúdo Rolável -->
                <div id="pacto-dvc-content" class="flex-1 overflow-y-auto p-5 space-y-4 custom-scroll" onscroll="window.checarRolagemPactoDVC()">
                    
                    <div class="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                        <p class="text-[11px] text-gray-700 font-semibold leading-relaxed">
                            Ao participar do projeto, cada pessoa assume o compromisso de ajudar a construir um ambiente seguro, acolhedor e responsável, onde todos possam aprender, errar, melhorar, conviver e crescer.
                        </p>
                        <p class="text-[11px] text-gray-700 font-semibold leading-relaxed mt-2">
                            Aqui, vencer não é apenas ganhar jogos. Vencer também é aprender a respeitar, cuidar, escutar, colaborar e ocupar o próprio espaço no mundo.
                        </p>
                    </div>

                    <!-- Tópico 1 -->
                    <div class="bg-white border border-gray-100 shadow-sm rounded-2xl p-4">
                        <div class="flex items-center gap-3 mb-2">
                            <div class="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                                <i class="fa-solid fa-handshake-angle text-[#990000] text-sm"></i>
                            </div>
                            <h3 class="text-xs font-black text-gray-800 uppercase leading-tight">1. Respeito à diversidade e espaço seguro</h3>
                        </div>
                        <p class="text-[11px] text-gray-600 font-medium leading-relaxed pl-11">
                            Aqui jogamos juntos. Não toleramos nenhuma forma de discriminação, racismo, machismo, homofobia, bullying, humilhação ou exclusão. O DVC é um território de acolhimento. Cada pessoa deve ser respeitada em sua história, identidade, corpo, ritmo de aprendizagem e forma de participar.
                        </p>
                    </div>

                    <!-- Tópico 2 -->
                    <div class="bg-white border border-gray-100 shadow-sm rounded-2xl p-4">
                        <div class="flex items-center gap-3 mb-2">
                            <div class="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                                <i class="fa-solid fa-mobile-screen-button text-blue-600 text-sm"></i>
                            </div>
                            <h3 class="text-xs font-black text-gray-800 uppercase leading-tight">2. Presença real e equilíbrio digital</h3>
                        </div>
                        <p class="text-[11px] text-gray-600 font-medium leading-relaxed pl-11">
                            Conexão na quadra, celular na mochila. Durante treinos, atividades, rodas de conversa e momentos coletivos, buscamos viver o presente com atenção. As telas devem ficar guardadas para que possamos fortalecer vínculos reais, escutar melhor e participar de verdade. O DVC acredita que o esporte também ajuda a equilibrar o uso do tempo e a criar relações mais saudáveis fora das telas.
                        </p>
                    </div>

                    <!-- Tópico 3 -->
                    <div class="bg-white border border-gray-100 shadow-sm rounded-2xl p-4">
                        <div class="flex items-center gap-3 mb-2">
                            <div class="w-8 h-8 rounded-full bg-yellow-50 flex items-center justify-center shrink-0">
                                <i class="fa-solid fa-comments text-yellow-600 text-sm"></i>
                            </div>
                            <h3 class="text-xs font-black text-gray-800 uppercase leading-tight">3. Inteligência emocional e resolução de conflitos</h3>
                        </div>
                        <p class="text-[11px] text-gray-600 font-medium leading-relaxed pl-11">
                            Erros fazem parte do jogo e da vida. No DVC, aprendemos a lidar com frustrações, diferenças e conflitos por meio do diálogo, da escuta, da empatia e do respeito. A violência física, verbal ou emocional não faz parte do nosso time. Quando houver conflito, buscamos conversar, reparar e reconstruir.
                        </p>
                    </div>

                    <!-- Tópico 4 -->
                    <div class="bg-white border border-gray-100 shadow-sm rounded-2xl p-4">
                        <div class="flex items-center gap-3 mb-2">
                            <div class="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                                <i class="fa-solid fa-broom text-green-600 text-sm"></i>
                            </div>
                            <h3 class="text-xs font-black text-gray-800 uppercase leading-tight">4. Cuidado com o bem comum</h3>
                        </div>
                        <p class="text-[11px] text-gray-600 font-medium leading-relaxed pl-11">
                            O DVC é nosso. Zelar pelos materiais, bolas, uniformes, espaços de treino e equipamentos é responsabilidade de todos. Tudo o que o projeto conquista deve ser cuidado com compromisso, gratidão e corresponsabilidade. Cuidar do que é coletivo também é uma forma de mostrar respeito por quem veio antes, por quem está junto e por quem ainda vai chegar.
                        </p>
                    </div>

                    <!-- Tópico 5 -->
                    <div class="bg-white border border-gray-100 shadow-sm rounded-2xl p-4">
                        <div class="flex items-center gap-3 mb-2">
                            <div class="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                                <i class="fa-solid fa-stopwatch text-purple-600 text-sm"></i>
                            </div>
                            <h3 class="text-xs font-black text-gray-800 uppercase leading-tight">5. Compromisso com presença, combinados e evolução</h3>
                        </div>
                        <p class="text-[11px] text-gray-600 font-medium leading-relaxed pl-11">
                            Participar do DVC exige compromisso. Cada treino, encontro ou atividade é uma oportunidade de aprender e contribuir. Cumprir horários, justificar ausências, respeitar combinados e participar com responsabilidade fortalece o projeto e ajuda cada pessoa a evoluir.
                        </p>
                    </div>

                    <!-- Tópico 6 -->
                    <div class="bg-white border border-gray-100 shadow-sm rounded-2xl p-4">
                        <div class="flex items-center gap-3 mb-2">
                            <div class="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                                <i class="fa-solid fa-users text-orange-600 text-sm"></i>
                            </div>
                            <h3 class="text-xs font-black text-gray-800 uppercase leading-tight">6. Protagonismo e comunidade</h3>
                        </div>
                        <p class="text-[11px] text-gray-600 font-medium leading-relaxed pl-11">
                            No DVC, cada participante é protagonista. Isso significa assumir responsabilidades, apoiar colegas, aprender com os erros, participar das decisões possíveis e ajudar a construir uma comunidade mais forte. O projeto cresce quando cada pessoa entende que faz parte da solução.
                        </p>
                    </div>
                    
                    <div class="h-4"></div> <!-- Espaçador para o final -->
                </div>

                <!-- Rodapé Fixo -->
                <div class="p-4 border-t bg-gray-50 flex flex-col gap-2 shrink-0 z-10">
                    <p class="text-[10px] text-gray-500 font-semibold text-center mb-1">
                        Ao continuar, declaro que li o Pacto de Convivência do DVC e me comprometo a ajudar a construir um ambiente seguro, respeitoso, acolhedor e responsável.
                    </p>
                    <p id="pacto-dvc-aviso-rolagem" class="text-[9px] text-[#990000] font-black uppercase text-center mb-2 animate-pulse">
                        Role até o final para liberar o aceite
                    </p>
                    <button 
                        id="btn-aceitar-pacto-dvc" 
                        onclick="window.aceitarPactoDVC()" 
                        disabled
                        class="w-full bg-gray-300 text-gray-500 py-3.5 rounded-2xl text-[11px] font-black uppercase shadow-sm transition-all duration-300"
                    >
                        Li e concordo em construir um ambiente seguro
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHtml);
    
    // Fallback: se o conteúdo for curto e já couber na tela sem rolar
    setTimeout(() => {
        checarRolagemPactoDVC();
    }, 100);
}

function checarRolagemPactoDVC() {
    const content = document.getElementById("pacto-dvc-content");
    const btn = document.getElementById("btn-aceitar-pacto-dvc");
    const aviso = document.getElementById("pacto-dvc-aviso-rolagem");

    if (!content || !btn) return;

    // Se o scroll estiver a 20px ou menos do fundo, consideramos que o usuário leu tudo
    const estaNoFundo = Math.abs(content.scrollHeight - content.clientHeight - content.scrollTop) <= 20;
    
    // Ou se não tiver scroll (conteúdo cabe na tela)
    const naoTemScroll = content.scrollHeight <= content.clientHeight;

    if (estaNoFundo || naoTemScroll) {
        btn.disabled = false;
        btn.classList.remove("bg-gray-300", "text-gray-500");
        btn.classList.add("bg-[#990000]", "text-white", "hover:bg-[#7a0000]", "shadow-md");
        if (aviso) aviso.classList.add("hidden");
    }
}

async function aceitarPactoDVC() {
    const user = window.currentUserData;
    if (!user) return;
    
    const emailCanonico = String(user.email || user.documentIdDVC).trim().toLowerCase();

    const btn = document.getElementById("btn-aceitar-pacto-dvc");
    if (btn) {
        btn.disabled = true;
        btn.textContent = "Salvando...";
    }

    const updates = {
        pactoDvcAceito: true,
        pactoDvcVersao: PACTO_VERSAO_ATUAL,
        pactoDvcAceitoEm: serverTimestamp(),
        pactoDvcAceiteTexto: "Li e concordo em construir um ambiente seguro"
    };

    try {
        await updateDoc(doc(db, "users", emailCanonico), updates);
        
        // Atualiza o cache local
        window.currentUserData = {
            ...window.currentUserData,
            ...updates,
            pactoDvcAceitoEm: new Date().toISOString()
        };

        const modal = document.getElementById("m-pacto-dvc");
        if (modal) modal.remove();

        // Continuar fluxo: Atualização socioeconômica, depois Pesquisa trimestral
        if (typeof window.usuarioPrecisaAtualizacaoSocioeconomicaDVC === "function" &&
            window.usuarioPrecisaAtualizacaoSocioeconomicaDVC(window.currentUserData)) {
            setTimeout(() => {
                window.abrirAtualizacaoSocioeconomicaDVC?.();
            }, 150);
        } else if (typeof window.verificarFluxoPesquisaTrimestralDVC === "function") {
            const ehADM = (window.currentUserData && window.currentUserData.funcao === "ADM") || 
                          (typeof window.usuarioEhADM === "function" && window.usuarioEhADM(window.currentUserData));
            if (!ehADM) {
                setTimeout(() => {
                    window.verificarFluxoPesquisaTrimestralDVC();
                }, 150);
            }
        }

    } catch (e) {
        console.error("Erro ao salvar aceite do Pacto DVC:", e);
        alert("Ocorreu um erro ao registrar o aceite. Tente novamente.");
        if (btn) {
            btn.disabled = false;
            btn.textContent = "Li e concordo em construir um ambiente seguro";
        }
    }
}

window.usuarioPrecisaAceitarPactoDVC = usuarioPrecisaAceitarPactoDVC;
window.verificarFluxoPactoDVC = verificarFluxoPactoDVC;
window.abrirPactoDVC = abrirPactoDVC;
window.aceitarPactoDVC = aceitarPactoDVC;
window.checarRolagemPactoDVC = checarRolagemPactoDVC;

export {
    usuarioPrecisaAceitarPactoDVC,
    verificarFluxoPactoDVC,
    abrirPactoDVC,
    aceitarPactoDVC
};
