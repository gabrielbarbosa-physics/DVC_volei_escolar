/**
 * ============================================================================
 * Módulo: NAVIGATION
 * ============================================================================
 * Responsabilidade: Gerencia funcionalidades relacionadas a navigation.
 * Este arquivo faz parte do sistema modular do DVC App.
 * Todos os códigos principais aqui agrupados seguem as diretrizes do projeto.
 * ============================================================================
 */

// NAVIGATION AND TAB CONTROL MODULE DVC APP

function changeTab(tab) {
    // BYPASS DE MODO DEBUG: Forçando acesso total a todas as abas
    // const usuarioEhADM = window.usuarioEhADM;
    // if ((tab === 'admin' || tab === 'dashboard') && typeof usuarioEhADM === 'function' && !usuarioEhADM()) {
    //     tab = 'mural';
    // }

    window.__abaAtualDVC = tab;
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('text-red-800', 'bg-red-50', 'dark:text-red-400', 'dark:bg-red-955/40', 'dark:bg-red-955', 'dark:bg-red-950/40', 'nav-active-dark');
        btn.classList.add('text-gray-400');
    });

    const btnId = tab === 'admin' || tab === 'dashboard' || tab === 'members'
        ? 'nav-more'
        : 'nav-' + tab;

    const targetBtn = document.getElementById(btnId);

    if (targetBtn) {
        targetBtn.classList.remove('text-gray-400');
        targetBtn.classList.add('text-red-800', 'bg-red-50', 'nav-active-dark');
    }

    const main = document.getElementById('main-content');
    if (main) {
        main.scrollTop = 0;
        main.innerHTML = `
            <div class="p-6 text-center">
                <i class="fa-solid fa-spinner fa-spin text-[#990000] text-2xl mb-3"></i>
                <p class="text-[10px] font-bold text-gray-400 uppercase">Carregando...</p>
            </div>
        `;
    }

    setTimeout(() => {
        if(tab === 'home' && typeof window.renderHome === 'function') window.renderHome();
        if(tab === 'calendar' && typeof window.renderCalendar === 'function') window.renderCalendar();
        if(tab === 'mural' && typeof window.renderMural === 'function') window.renderMural();
        if(tab === 'profile' && typeof window.renderProfile === 'function') window.renderProfile();
        if(tab === 'admin' && typeof window.renderAdmin === 'function') window.renderAdmin();
        if(tab === 'members' && typeof window.renderMembers === 'function') window.renderMembers();
        if(tab === 'finance' && typeof window.renderFinance === 'function') window.renderFinance();
        if(tab === 'ranking' && typeof window.renderRanking === 'function') window.renderRanking();
        if(tab === 'dashboard' && typeof window.renderDashboard === 'function') window.renderDashboard();
    }, 80);
}

function abrirMenuMais() {
    // BYPASS DE MODO DEBUG: Forçando permissões máximas localmente
    const isADM = true;
    const isEquipeTecnica = true;
    const currentUserData = window.currentUserData || { funcao: "Admin Debug" };

    // if (!isEquipeTecnica) {
    //     return;
    // }

    const modalExistente = document.getElementById('m-menu-mais');
    if (modalExistente) modalExistente.remove();

    const painelHtml = `
        <div id="m-menu-mais" class="fixed inset-0 bg-black/60 z-[100] flex items-end justify-center">
            <div class="bg-white dark:bg-gray-900 w-full max-w-md rounded-t-3xl p-5 shadow-2xl fade-in transition-colors duration-200">

                <div class="w-12 h-1 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-4"></div>

                <div class="flex items-center gap-3 mb-5">
                    <div class="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 flex items-center justify-center">
                        <i class="fa-solid fa-shield-halved text-[#990000] text-xl"></i>
                    </div>

                    <div>
                        <p class="text-sm font-black text-gray-800 dark:text-gray-200 uppercase">
                            Menu de Gestão
                        </p>
                        <p class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">
                            Acesso de ${currentUserData.funcao || 'Atleta'}
                        </p>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-3">

                    <button onclick="document.getElementById('m-menu-mais').remove(); changeTab('members');" class="bg-gray-50 dark:bg-gray-950 border dark:border-gray-850 rounded-2xl p-4 text-left shadow-sm">
                        <i class="fa-solid fa-users text-[#990000] text-xl mb-3"></i>
                        <p class="text-[10px] font-black uppercase text-gray-800 dark:text-gray-200">Atletas</p>
                        <p class="text-[8px] font-bold text-gray-400 dark:text-gray-500 uppercase mt-1">Lista e consulta</p>
                    </button>

                    ${isADM ? `
                    <!-- DVC GESTAO: substitui o atalho redundante da Agenda pelo acesso as respostas abertas. -->
                    <button onclick="if(typeof window.abrirRespostasAbertasPesquisaDVC === 'function') window.abrirRespostasAbertasPesquisaDVC();" class="bg-gray-50 dark:bg-gray-950 border dark:border-gray-850 rounded-2xl p-4 text-left shadow-sm">
                        <i class="fa-solid fa-comments text-[#990000] text-xl mb-3"></i>
                        <p class="text-[10px] font-black uppercase text-gray-800 dark:text-gray-200">Coment&aacute;rios</p>
                        <p class="text-[8px] font-bold text-gray-400 dark:text-gray-500 uppercase mt-1">Pesquisa trimestral</p>
                    </button>
                    ` : ''}

                    <button onclick="document.getElementById('m-menu-mais').remove(); if(typeof window.abrirPainelAutoAvaliacoesDVC === 'function') window.abrirPainelAutoAvaliacoesDVC();" class="bg-gray-50 dark:bg-gray-950 border dark:border-gray-850 rounded-2xl p-4 text-left shadow-sm">
                        <i class="fa-solid fa-clipboard-list text-[#990000] text-xl mb-3"></i>
                        <p class="text-[10px] font-black uppercase text-gray-800 dark:text-gray-200">Autoavaliações</p>
                        <p class="text-[8px] font-bold text-gray-400 dark:text-gray-500 uppercase mt-1">Analisar pendentes</p>
                    </button>

                    ${isADM ? `
                        <button onclick="document.getElementById('m-menu-mais').remove(); if(typeof window.abrirModoTesteAtleta === 'function') window.abrirModoTesteAtleta();" class="bg-gray-50 dark:bg-gray-950 border dark:border-gray-850 rounded-2xl p-4 text-left shadow-sm">
                            <i class="fa-solid fa-eye text-[#990000] text-xl mb-3"></i>
                            <p class="text-[10px] font-black uppercase text-gray-800 dark:text-gray-200">Modo Teste</p>
                            <p class="text-[8px] font-bold text-gray-400 dark:text-gray-500 uppercase mt-1">Ver perfil de atleta</p>
                        </button>
                    ` : ''}

                    ${isADM ? `
                    <button onclick="document.getElementById('m-menu-mais').remove(); changeTab('admin');" class="bg-gray-50 dark:bg-gray-950 border dark:border-gray-850 rounded-2xl p-4 text-left shadow-sm">
                        <i class="fa-solid fa-crown text-[#990000] text-xl mb-3"></i>
                        <p class="text-[10px] font-black uppercase text-gray-800 dark:text-gray-200">Gestão</p>
                        <p class="text-[8px] font-bold text-gray-400 dark:text-gray-500 uppercase mt-1">Financeiro e controle</p>
                    </button>
                    ` : ''}

                    ${isADM ? `
                        <button onclick="document.getElementById('m-menu-mais').remove(); changeTab('dashboard');" class="bg-gray-50 dark:bg-gray-950 border dark:border-gray-850 rounded-2xl p-4 text-left shadow-sm">
                            <i class="fa-solid fa-chart-pie text-[#990000] text-xl mb-3"></i>
                            <p class="text-[10px] font-black uppercase text-gray-800 dark:text-gray-200">Painel</p>
                            <p class="text-[8px] font-bold text-gray-400 dark:text-gray-500 uppercase mt-1">Gráficos e dados</p>
                        </button>
                    ` : ''}

                    <button onclick="document.getElementById('m-menu-mais').remove(); if(typeof window.logout === 'function') window.logout();" class="bg-gray-50 dark:bg-gray-950 border dark:border-gray-850 rounded-2xl p-4 text-left shadow-sm">
                        <i class="fa-solid fa-power-off text-red-600 dark:text-red-500 text-xl mb-3"></i>
                        <p class="text-[10px] font-black uppercase text-red-700 dark:text-red-400">Sair</p>
                        <p class="text-[8px] font-bold text-gray-400 dark:text-gray-500 uppercase mt-1">Encerrar sessão</p>
                    </button>

                </div>

                <button onclick="document.getElementById('m-menu-mais').remove()" class="w-full mt-4 py-3 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-[10px] font-black uppercase">
                    Fechar
                </button>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', painelHtml);
}

// Bind to window for legacy onclick attributes
window.changeTab = changeTab;
window.abrirMenuMais = abrirMenuMais;

export {
    changeTab,
    abrirMenuMais
};
