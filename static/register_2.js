//Listener para o "DOM" ser carregado.
document.addEventListener('DOMContentLoaded', (e) => {

// Passo do formulário de registro.
let currentStep = 1;
const totalSteps = 4;

// Telas, formulários e botões.
const screens = {
    login: document.getElementById('login-screen'),
    register: document.getElementById('register-screen'),
    success: document.getElementById('success-screen')
};

const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

const btnToRegister = document.getElementById('btn-to-register');
const btnBackWizard = document.getElementById('btn-back-wizard');
const btnNext = document.getElementById('btn-next');
const btnSubmit = document.getElementById('btn-submit');
const btnBackSuccess = document.getElementById('btn-back-success');

// Subir imagens.
const inputProfilePic = document.getElementById('input-profile-pic');
const inputDocFront = document.getElementById('input-doc-front');
const inputDocBack = document.getElementById('input-doc-back');

// Função que apresenta uma tela e oculta as outras.
function showScreen(screenName) {
    Object.values(screens).forEach(el => el.classList.add('hidden-screen'));
    screens[screenName].classList.remove('hidden-screen');

    // Resetar o estado de registro para o primeiro passo.
    if (screenName === 'register') {
        currentStep = 1;
        updateWizardUI();
    }
}

// Clicar no botão de uma tela y ativa a função showScreen(y).
btnToRegister.addEventListener('click', () => showScreen('register'));
btnBackSuccess.addEventListener('click', () => showScreen('login'));
btnBackWizard.addEventListener('click', (e) => {
    e.preventDefault();
    // O botão de voltar pode ativar o step-down até chegar na tela de login.
    if (currentStep > 1) {
        currentStep--;
        updateWizardUI();
    } else {
        showScreen('login');
    }
});

btnNext.addEventListener('click', (e) => {
    e.preventDefault();
    if (validateCurrentStep()) {
        if (currentStep < totalSteps) {
            currentStep++;
            updateWizardUI();
        }
    } else {
        alert("Por favor, preencha todos os campos obrigatórios.");
    }
});

// Função que olha todos os steps possíveis, mostra a tela do step atual e oculta as outras.
function updateWizardUI() {
    for (let i = 1; i <= totalSteps; i++) {
        const stepEl = document.getElementById(`step-${i}`);
        if (i === currentStep) {
            stepEl.classList.remove('hidden-screen');
        } else {
            stepEl.classList.add('hidden-screen');
        }
    }
    // Mostra x barras quando o usuário está no step x.
    for (let i = 1; i <= totalSteps; i++) {
        const bar = document.getElementById(`bar-${i}`);
        if (i <= currentStep) {
            bar.classList.remove('bg-gray-200');
            bar.classList.add('bg-[#990000]');
        } else {
            bar.classList.add('bg-gray-200');
            bar.classList.remove('bg-[#990000]');
        }
    }
    // Se o usuário estiver no final, ele pode submeter;
    // caso contrário, o botão de submissão ainda não aparece.
    // Nesse caso o usuário ainda pode avançar pelo botão próximo.
    if (currentStep === totalSteps) {
        btnNext.classList.add('hidden-screen');
        btnSubmit.classList.remove('hidden-screen');
    } else {
        btnNext.classList.remove('hidden-screen');
        btnSubmit.classList.add('hidden-screen');
    }
}

// Função que valida de os campos com a tag "required" foram preenchidos antes de avançar
// para o próximo step.
function validateCurrentStep() {
    const stepEl = document.getElementById(`step-${currentStep}`);
    const inputs = stepEl.querySelectorAll('input[required], select[required]');
    let isValid = true;

    inputs.forEach(input => {
        if (!input.value) {
            isValid = false;
            input.classList.add('border-red-500', 'border');
        } else {
            input.classList.remove('border-red-500', 'border');
        }
    });

    return isValid;
}


// Função que lê a imagem de perfil enviada; Assim que termina o envio,
//  ela apresenta a imagem para o usuário de forma assíncrona (reader.onload).
function previewImage(input, previewId) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const container = document.getElementById(previewId);
            container.innerHTML = `<img src="${e.target.result}" class="w-full h-full object-cover">`;
        }
        reader.readAsDataURL(input.files[0]);
    }
}

// Quando o usuário envia a imagem da identidade,
// é adicionado um elemento com o texto "Selecionado".
function updateFileUI(input, textId) {
    if (input.files && input.files[0]) {
        const textContainer = document.getElementById(textId);
        textContainer.innerHTML = `
            <div class="flex items-center text-green-600 gap-2 font-semibold">
                 <i class="fa-solid fa-check-circle"></i> <span>Selecionado</span>
            </div>
        `;
    }
}

// Quando há mudanças no DOM.input de um determinado ID,
// o JS chama a respectiva função que altera o innerHTML do respectivo ID.
// Ex.: Mostrar a imagem ou mostrar o o texto "Selecionado" quando o "load" for finalizado.
if(inputProfilePic) inputProfilePic.addEventListener('change', function() { previewImage(this, 'profile-preview'); });
if(inputDocFront) inputDocFront.addEventListener('change', function() { updateFileUI(this, 'text-front'); });
if(inputDocBack) inputDocBack.addEventListener('change', function() { updateFileUI(this, 'text-back'); });


// Tratamento do formulário de Login.
loginForm.addEventListener('submit', async(e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const data = {
        email: email,
        password: password
    };
    // Envia os dados para o servidor; O servidor tenta guardar no banco SQL,
    // e envia uma resposta para o usuário.
    try {
        const responseFromAPI = await fetch('/login',{
            method: 'POST',
            headers: {
                'Content-Type':'application/json'
            },
            body: JSON.stringify(data)
        });
        if (!responseFromAPI.ok){
            throw new Error(`HTTP error! status: ${responseFromAPI.status}`);
        }
        const responseFromAPIreturn = await responseFromAPI.json();
        // Se "sucesso" for True na resposta da API, o usuário é redirecionado
        // para a url enviada pelo servidor.
        if(responseFromAPIreturn.sucesso) {
            window.location.href = responseFromAPIreturn.redirect_url;
        } else {
            alert('Erro: ' + responseFromAPIreturn.erro);
        }
    } catch(error) {
        console.error('Error during fetch',error);
        alert('Ocorreu um erro de rede. Tente novamente');
    }
});

// Tratamento do formulário de Registro. Semelhante ao de usuário.
registerForm.addEventListener('submit', async(e) => {
    e.preventDefault();
    if (!validateCurrentStep()) {
        alert("Por favor, preencha os dados finais.");
        return;
    }

    const pass = document.getElementById('pass').value;
    //const pass_conf = document.getElementById('pass_conf').value;

    // Cria um vetor com os esportes selecionados.
    /* const sports = [];
    document.querySelectorAll('input[name="sports"]:checked').forEach(cb => {
        sports.push(cb.value);
    });
    // Cria os dados de registro finais e adiciona uma chave
    // "sports" com valor "[esporte1,esporte2,...]"
    const finalData = Object.fromEntries(formData.entries());
    finalData.sports = sports; */

    const nome = document.getElementById('nome').value;
    const email_reg = document.getElementById('email_reg').value;
    const tel = document.getElementById('tel').value;
    const nome_res = document.getElementById('nome_res').value;
    const email_res = document.getElementById('email_res').value;
    const tel_res = document.getElementById('tel_res').value;
    const vinculo = document.getElementById('vinculo').value;
    const modalidade = document.getElementById('modalidade').value;

    const data_reg = {
        pass: pass,
        nome: nome,
        email_reg: email_reg,
        tel: tel,
        nome_res: nome_res,
        email_res: email_res,
        tel_res: tel_res,
        vinculo: vinculo,
        modalidade: modalidade
    };

    try {
        const responseFromAPI_reg = await fetch('/register',{
            method: 'POST',
            headers: {
                'Content-Type':'application/json'
            },
            body: JSON.stringify(data_reg)
        });
        if (!responseFromAPI_reg.ok){
            throw new Error(`HTTP error! status: ${responseFromAPI_reg.status}`);
        }
        const responseFromAPIreturn_reg = await responseFromAPI_reg.json();
        // Se "sucesso" for True na resposta da API, o usuário é redirecionado
        // para a url enviada pelo servidor.
        if(responseFromAPIreturn_reg.sucesso) {
            showScreen('success');
            window.location.href = responseFromAPIreturn_reg.redirect_url;
        } else {
            alert('Erro: ' + responseFromAPIreturn_reg.erro);
        }
    } catch(error) {
        console.error('Error during fetch',error);
        alert('Ocorreu um erro de rede. Tente novamente');
    }

});
// Fecha o "listener" do "DOM".
});
