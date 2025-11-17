document.addEventListener('DOMContentLoaded', function() {
    const loginToggle = document.getElementById('login-toggle');
    const registerToggle = document.getElementById('register-toggle');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const formTitle = document.getElementById('form-title');

    function showForm(formToShow, title) {
        // Remove 'active' de todos os botões de toggle
        document.querySelectorAll('.toggle-btn').forEach(btn => btn.classList.remove('active'));
        // Adiciona 'active' ao botão correspondente
        if (formToShow === loginForm) {
            loginToggle.classList.add('active');
        } else {
            registerToggle.classList.add('active');
        }

        // Esconde todos os formulários
        document.querySelectorAll('.form').forEach(form => form.classList.remove('active'));
        // Mostra o formulário desejado
        formToShow.classList.add('active');
        // Atualiza o título
        formTitle.textContent = title;
    }

    // Inicializa com o formulário de login ativo
    showForm(loginForm, 'Login');

    // Event Listeners para os botões de toggle
    loginToggle.addEventListener('click', function() {
        showForm(loginForm, 'Login');
    });

    registerToggle.addEventListener('click', function() {
        showForm(registerForm, 'Registro');
    });

    // Opcional: Adicionar tratamento de submissão de formulário

    registerForm.addEventListener('submit', async(event) =>  {
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;

        if (password !== confirmPassword) {
            event.preventDefault(); // Impede o envio padrão do formulário
	    alert('As senhas não coincidem!');
            return;
        }
    
	const register_form = document.getElementById('register-form');
	event.preventDefault();
    	    const registerData_response = {
            usuario: document.getElementById('register-usuario').value,
            senha: document.getElementById('register-password').value,
	    nome: document.getElementById('register-name').value,
            vinculo: document.getElementById('role').value
	    };	
	    try{
		const response = await fetch('/register', {
                        method: 'POST',
                        headers: {
                                'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(registerData_response)
                        });
		if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
		const responseData = await response.json();
		if (responseData.sucesso) {
                    // 5. Sucesso!
                    // O seu endpoint de registro retorna 'mensagem' (e não 'redirect_url')
                    alert(responseData.mensagem);
                    register_form.reset(); // Limpa o formulário após o sucesso
                } else {
                    alert('Erro: ' + responseData.erro);
                }

	} catch (error) {
                console.error('Error during fetch', error);
                alert('Ocorreu um erro de rede. Tente novamente');
        }
    });

    
    const login_form = document.getElementById('login-form');
    login_form.addEventListener('submit', async(event) => {
		event.preventDefault();
	    	const loginData_response = {
		   	usuario: document.getElementById('login-usuario').value,
			senha: document.getElementById('login-password').value
		};
	    	try {
			const response = await fetch('/login', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(loginData_response) 
			});
			if (!response.ok){
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			const responseData = await response.json();
			if(responseData.sucesso) {
				window.location.href = responseData.redirect_url;

			} else {
				alert('Erro:' + responseData.erro);
			}
		} catch(error){
			console.error('Error during fetch', error);
			alert('Ocorreu um erro de rede. Tente novamente');
		}
    });
	
});
