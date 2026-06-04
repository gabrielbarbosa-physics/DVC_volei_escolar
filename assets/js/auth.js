/**
 * ============================================================================
 * Módulo: AUTH
 * ============================================================================
 * Responsabilidade: Gerencia funcionalidades relacionadas a auth.
 * Este arquivo faz parte do sistema modular do DVC App.
 * Todos os códigos principais aqui agrupados seguem as diretrizes do projeto.
 * ============================================================================
 */

// js/auth.js
// Stage 11C: onAuthStateChanged / inicialização do app

import { 
    auth, 
    provider, 
    setPersistence, 
    browserLocalPersistence, 
    signInWithPopup, 
    signOut,
    db,
    doc,
    setDoc,
    onAuthStateChanged,
    getDoc,
    updateDoc,
    increment
} from "./firebase.js";

import { 
    STATUS_FINANCEIRO_CARENCIA, 
    PROJETO_ATUAL_DVC,
    EMAILS_ADM_DVC
} from "./state.js";

const LINK_GRUPO_WHATSAPP = "https://chat.whatsapp.com/DKmFWDonyCt94LxvDN9iZf";

if (typeof window.obterStatusFinanceiroEfetivo !== "function") {
    window.obterStatusFinanceiroEfetivo = function obterStatusFinanceiroEfetivoDVC(user = {}) {
        return (
            user.statusFinanceiroEfetivo ||
            user.statusFinanceiro ||
            user.statusPagamento ||
            user.status ||
            "Pendente"
        );
    };
}

async function loginGoogle() {
    const statusEl = document.getElementById('auth-status');
    if (statusEl) {
        statusEl.innerText = "Conectando...";
    }

    try {
        await setPersistence(auth, browserLocalPersistence);
        await signInWithPopup(auth, provider);
    } catch (e) {
        alert("Erro: " + e.message);
    }
}

function logout() {
    return signOut(auth).then(() => location.reload());
}

function obterDadosFinanceiroInicialCadastro(criadoEm) {
    const dataCadastro = window.obterDataCadastroUsuario({ criadoEm });
    const fimCarencia = window.obterFimCarenciaPorDataCadastro(dataCadastro);

    if (!fimCarencia) {
        return { financeiro: "Inadimplente" };
    }

    return {
        financeiro: STATUS_FINANCEIRO_CARENCIA,
        carenciaCadastro: true,
        carenciaCadastroAte: window.formatarDataChaveFinanceira(fimCarencia),
        carenciaCadastroMotivo: "Cadastro no fim do mes"
    };
}

function mostrarConviteGrupoWhatsApp(nome) {
    const modal = `
        <div id="m-grupo-whatsapp" class="fixed inset-0 bg-black/80 z-[100] p-4 flex items-center justify-center">
            <div class="bg-white w-full max-w-sm rounded-2xl p-6 relative shadow-2xl text-center">
                
                <h2 class="font-black text-lg text-[#990000] uppercase mb-2">
                    Cadastro concluído!
                </h2>

                <p class="text-xs text-gray-600 font-semibold leading-relaxed mb-4">
                    ${nome}, seu cadastro foi realizado com sucesso. 
                    Agora entre no grupo do WhatsApp para ser recebido pelos treinadores e acompanhar os avisos do DVC.
                </p>

                <div class="bg-green-50 border border-green-200 p-4 rounded-xl mb-4">
                    <p class="text-[10px] font-black text-green-800 uppercase mb-2">
                        Grupo oficial do projeto
                    </p>

                    <a 
                        href="${LINK_GRUPO_WHATSAPP}" 
                        target="_blank"
                        class="block w-full bg-green-600 text-white py-3 rounded-lg font-black text-xs uppercase shadow-md">
                        Entrar no grupo do WhatsApp
                    </a>
                </div>

                <p class="text-[10px] text-gray-400 font-semibold mb-4">
                    Depois de entrar no grupo, envie uma mensagem se apresentando para que os treinadores possam te receber.
                </p>

                <button 
                    onclick="location.reload()" 
                    class="w-full bg-gray-800 text-white py-3 rounded-lg font-bold text-xs uppercase">
                    Continuar para o app
                </button>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modal);
}

async function salvarCadastro() {
    const nome = document.getElementById('reg-nome').value;
    const nascimento = document.getElementById('reg-nascimento').value;
    const sexo = document.getElementById('reg-sexo').value;
    const telefone = document.getElementById('reg-tel').value;
    const responsavelNome = document.getElementById('reg-resp-nome').value;
    const responsavelTel = document.getElementById('reg-resp-tel').value;

    if (!nome || !nascimento || !sexo || !telefone) {
        return alert("ERRO: Nome, Nascimento, Sexo e Telefone são obrigatórios!");
    }

    const hoje = new Date();
    const dataNasc = new Date(nascimento);
    let idade = hoje.getFullYear() - dataNasc.getFullYear();
    const m = hoje.getMonth() - dataNasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < dataNasc.getDate())) {
        idade--;
    }

    if (idade < 18) {
        if (!responsavelNome || !responsavelTel) {
            return alert("Atleta menor de idade: Nome e WhatsApp do responsável são obrigatórios!");
        }
    }

    try {
        const agoraCadastro = new Date().toISOString();
        const dadosFinanceiroCadastro = obterDadosFinanceiroInicialCadastro(agoraCadastro);

        await setDoc(doc(db, "users", auth.currentUser.email), { 
            nome: nome, 
            nascimento: nascimento, 
            sexo: sexo, 
            telefone: telefone, 
            responsavelNome: responsavelNome || "N/A", 
            responsavelTel: responsavelTel || "N/A",
            responsavelTelefone: responsavelTel || "N/A",
            funcao: "Membro", 
            funcaoVolei: "formacao",
            projetoId: PROJETO_ATUAL_DVC.id,
            projetoNome: PROJETO_ATUAL_DVC.nome,
            projetoSelo: PROJETO_ATUAL_DVC.selo,
            projetoLogo: PROJETO_ATUAL_DVC.logo,
            status: "Ativo", 
            ...dadosFinanceiroCadastro,
            email: auth.currentUser.email,

            cadastroStatus: "Novo",
            criadoEm: agoraCadastro,

            comprovantesEnviados: [] 
        });

        window.currentUserData = {
            nome: nome,
            nascimento: nascimento,
            sexo: sexo,
            telefone: telefone,
            responsavelNome: responsavelNome || "N/A",
            responsavelTel: responsavelTel || "N/A",
            responsavelTelefone: responsavelTel || "N/A",
            funcao: "Membro",
            funcaoVolei: "formacao",
            projetoId: PROJETO_ATUAL_DVC.id,
            projetoNome: PROJETO_ATUAL_DVC.nome,
            projetoSelo: PROJETO_ATUAL_DVC.selo,
            projetoLogo: PROJETO_ATUAL_DVC.logo,
            status: "Ativo",
            ...dadosFinanceiroCadastro,
            email: auth.currentUser.email,
            documentIdDVC: auth.currentUser.email,

            cadastroStatus: "Novo",
            criadoEm: agoraCadastro,

            comprovantesEnviados: []    
        };

        mostrarConviteGrupoWhatsApp(nome);
    } catch (e) {
        console.error("Erro ao salvar:", e);
        alert("Erro ao realizar cadastro.");
    }
}

async function registrarAcessoDiario() {
    try {
        if (!auth.currentUser || !window.currentUserData) return;

        const email = auth.currentUser.email;
        const hoje = new Date();
        const dataId = hoje.toISOString().split("T")[0];
        const userRef = doc(db, "users", email);
        const acessoDiaRef = doc(db, "users", email, "acessos", dataId);

        await updateDoc(userRef, {
            uÚltimoAcesso: hoje.toISOString(),
            totalAcessos: increment(1)
        });

        await setDoc(acessoDiaRef, {
            data: dataId,
            quantidade: increment(1),
            uÚltimoAcesso: hoje.toISOString()
        }, { merge: true });
    } catch (e) {
        console.warn("Nao foi possivel registrar o acesso diario:", e);
    }
}

function showAppUI() {
    document.getElementById('login-screen').classList.add('hidden-screen');
    document.getElementById('register-screen').classList.add('hidden-screen');
    document.getElementById('header-app').classList.remove('hidden-screen');
    document.getElementById('nav-bar').classList.remove('hidden-screen');
    document.getElementById('main-content').classList.remove('hidden-screen');
    document.getElementById('user-photo').style.backgroundImage = `url('${auth.currentUser.photoURL || 'assets/img/logo.webp'}')`;
    document.getElementById('user-display-name').innerText = window.currentUserData.nome;
    document.getElementById('user-display-info').innerText = `${window.currentUserData.funcao} • ${window.currentUserData.status}`;

    const dot = document.getElementById('status-dot');
    const corFinanceiroUsuario = window.obterStatusFinanceiroEfetivo(window.currentUserData) === STATUS_FINANCEIRO_CARENCIA
        ? 'bg-yellow-400'
        : window.usuarioPodeSerConvocadoPorFinanceiro(window.currentUserData)
            ? 'bg-green-500'
            : 'bg-red-500';
    dot.className = `w-3 h-3 rounded-full ${window.usuarioPodeAprovarAvaliacoes() ? 'bg-blue-500 shadow-[0_0_8px_blue]' : corFinanceiroUsuario}`;

    if (window.usuarioEhEquipeTecnica()) {
        document.getElementById('nav-more')?.classList.remove('hidden');
    }

    window.changeTab('home');
    registrarAcessoDiario();

    if (typeof window.verificarFluxoPactoDVC === "function" &&
        !window.verificarFluxoPactoDVC(window.currentUserData)) {
        // Fluxo do pacto abriu o modal. Ele chamará a próxima etapa após o aceite.
    } else if (typeof window.usuarioPrecisaAtualizacaoSocioeconomicaDVC === "function" &&
        window.usuarioPrecisaAtualizacaoSocioeconomicaDVC(window.currentUserData)) {
        setTimeout(() => {
            window.abrirAtualizacaoSocioeconomicaDVC?.();
        }, 150);
    } else if (typeof window.verificarFluxoPesquisaTrimestralDVC === "function") {
        const user = window.currentUserData;
        const ehADM = (user && user.funcao === "ADM") || (typeof window.usuarioEhADM === "function" && window.usuarioEhADM(user));
        if (!ehADM) {
            setTimeout(() => {
                window.verificarFluxoPesquisaTrimestralDVC();
            }, 150);
        }
    }
}

// Global Auth state change listener
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const emailLogin = String(user.email || "").trim().toLowerCase();
        const deveSerADM = EMAILS_ADM_DVC.includes(emailLogin);
        const userRefCanonico = doc(db, "users", emailLogin);
        const userRefAuth = doc(db, "users", user.email);
        let userRef = userRefCanonico;
        let snap = await getDoc(userRef);
        let dadosCadastroEncontrado = null;

        if (!snap.exists() && user.email !== emailLogin) {
            const snapAuth = await getDoc(userRefAuth);
            if (snapAuth.exists() && !deveSerADM) {
                userRef = userRefAuth;
                snap = snapAuth;
            } else if (snapAuth.exists()) {
                dadosCadastroEncontrado = snapAuth.data();
            }
        }

        if (!snap.exists()) {
            try {
                let cadastroExistente = null;

                if (!dadosCadastroEncontrado) {
                    const usersSnap = await window.carregarUsuariosCacheMockDVC();
                    cadastroExistente = usersSnap.docs.find(docUsuario => {
                        const dados = docUsuario.data();
                        const emailDoc = String(dados.email || docUsuario.id || "").trim().toLowerCase();
                        return emailDoc === emailLogin;
                    });
                }

                if (cadastroExistente || dadosCadastroEncontrado) {
                    dadosCadastroEncontrado = dadosCadastroEncontrado || cadastroExistente.data();

                    if (deveSerADM) {
                        const dadosAdmCanonico = {
                            ...dadosCadastroEncontrado,
                            nome: dadosCadastroEncontrado.nome || user.displayName || user.email,
                            email: emailLogin,
                            funcao: "ADM",
                            status: dadosCadastroEncontrado.status || "Ativo",
                            financeiro: dadosCadastroEncontrado.financeiro || "Em dia"
                        };

                        try {
                            await setDoc(userRefCanonico, dadosAdmCanonico, { merge: true });
                            snap = await getDoc(userRefCanonico);
                            userRef = userRefCanonico;
                        } catch (erroCanonicoAdm) {
                            console.warn("Não foi possível criar o cadastro ADM canônico:", erroCanonicoAdm);
                            if (cadastroExistente) {
                                userRef = doc(db, "users", cadastroExistente.id);
                                snap = await getDoc(userRef);
                            }
                        }
                    } else {
                        userRef = doc(db, "users", cadastroExistente.id);
                        snap = await getDoc(userRef);
                    }
                }
            } catch (erroBuscaCadastro) {
                console.warn("Não foi possível procurar cadastro existente por e-mail:", erroBuscaCadastro);
            }
        }

        if (snap.exists()) {
            // Carrega os dados reais do usuario antes de liberar as telas.
            window.currentUserData = {
                ...snap.data(),
                documentIdDVC: snap.id
            };
            if (deveSerADM && window.currentUserData.funcao !== "ADM") {
                try {
                    await updateDoc(userRef, {
                        funcao: "ADM",
                        status: window.currentUserData.status || "Ativo",
                        financeiro: window.currentUserData.financeiro || "Em dia"
                    });
                } catch (erroPromocaoAdm) {
                    console.warn("Não foi possível atualizar o cargo ADM automaticamente:", erroPromocaoAdm);
                }

                window.currentUserData = {
                    ...window.currentUserData,
                    funcao: "ADM",
                    status: window.currentUserData.status || "Ativo",
                    financeiro: window.currentUserData.financeiro || "Em dia"
                };
                window.limparCacheDados("atletas");
            }

            if (!deveSerADM) {
                try {
                    window.currentUserData = await window.sincronizarCarenciaCadastroUsuarioAtual(userRef, window.currentUserData);
                } catch (erroCarenciaCadastro) {
                    console.warn("Não foi possível sincronizar a carência de cadastro:", erroCarenciaCadastro);
                }
            }

            showAppUI();
        } else if (deveSerADM) {
            // Cria o administrador master quando o e-mail principal ainda nao existe no banco.
            const adminData = {
                nome: user.displayName || user.email,
                funcao: "ADM",
                status: "Ativo",
                financeiro: "Em dia",
                email: emailLogin,
                documentIdDVC: emailLogin
            };

            try {
                await setDoc(userRefCanonico, adminData, { merge: true });
            } catch (erroCriacaoAdm) {
                console.warn("Não foi possível criar o cadastro ADM automaticamente:", erroCriacaoAdm);
            }

            window.currentUserData = adminData;
            showAppUI();
        } else {
            // Novo usuario segue para a tela de cadastro.
            document.getElementById('login-screen').classList.add('hidden-screen');
            document.getElementById('register-screen').classList.remove('hidden-screen');
        }
    } else {
        document.getElementById('login-screen').classList.remove('hidden-screen');
        document.getElementById('header-app').classList.add('hidden-screen');
        document.getElementById('nav-bar').classList.add('hidden-screen');
    }
});

// Bind to window for global exposure
window.loginGoogle = loginGoogle;
window.logout = logout;
window.obterDadosFinanceiroInicialCadastro = obterDadosFinanceiroInicialCadastro;
window.mostrarConviteGrupoWhatsApp = mostrarConviteGrupoWhatsApp;
window.salvarCadastro = salvarCadastro;

export {
    loginGoogle,
    logout,
    obterDadosFinanceiroInicialCadastro,
    mostrarConviteGrupoWhatsApp,
    salvarCadastro
};
