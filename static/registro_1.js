document.addEventListener('DOMContentLoaded', function() {

    // Criação dos objetos Forms e Btns.
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');

    // Funções que mostram as abas de teste.
    function showLogin() {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');

        loginBtn.classList.add('active');
        registerBtn.classList.remove('active');
    }

    function showRegister() {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');

        loginBtn.classList.remove('active');
        registerBtn.classList.add('active');
    }

    // Mostra os Forms quando clicamos nos botões.
    loginBtn.addEventListener('click', showLogin);
    registerBtn.addEventListener('click', showRegister);

    // Cuida do envio do loginForm.
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        console.log("Login form submitted");
        const loginData = {
            email: document.getElementById("loginEmail").value,
            senha: document.getElementById("loginPassword").value
            try: {
                // Envia os dados em formato JSON para o servidor e cria um objeto com o retorno JSON.
                const response = fetch('/login',{
                    method: 'POST',
                    headers: {
                        'Content-Type':'application/json'
                    },
                    body: JSON.stringify(loginData)
                });
                // Erro caso a requisição/resposta não tenha se consolidado.
                if (!response.ok){
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const responseData = await response.json();
                // Se "sucesso" for True, encaminha para a url definida pelo servidor.
                if(responseData.sucesso){
                    window.location.href = responseData.redirect_url;
                } else {
                    alert('Erro: ' + responseData.erro);
                }
            } catch(error) {
                console.error('Error during fetch: ',error);
                alert('Ocorreu um erro de rede. Tente novamente ou contate o servidor.');
            }
        };
    });

    // Cuida do envio do registerForm.
    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        console.log("Register form submitted");
        // Lógica fetch api em construção.
    });
});
