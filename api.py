from passlib.hash import sha256_crypt
from flask import Flask, jsonify, render_template, request, session, flash, redirect, url_for
import psycopg2

app = Flask(__name__)
app.config['SECRET_KEY'] = '5fd5f4df5e8f12sf1dv1d5vf'

##############CONFERIR SENHA

# dados de conexão no banco local dev
DB_HOST = "localhost"
DB_NAME = "volei"
DB_USER = "postgres"
DB_PASSWORD = "1728"
DB_PORT = 5432

# função que cria uma instância de conexão no banco; retorna
# o objeto "connection"
def get_db_connection():
    conn = psycopg2.connect(
        host=DB_HOST,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        port=DB_PORT
    )
    return conn

# carrega a página principal do web app, verificar se o usuario está logado
@app.route('/')
def index():
    if 'usuario' in session:
        return render_template('index.html', usuario_logado = session['usuario'])
    return render_template('index.html', usuario_logado = None)

@app.route('/login', methods=['GET','POST'])
def login():
    # Se for GET, apenas renderiza a página
    if request.method == 'GET':
        # Se já estiver logado, redireciona para o index
        if 'usuario' in session:
            return redirect(url_for('index'))
        return render_template('index.html') # Assumindo que o login está no index

    # Se for POST, processa o login
    conn = None
    try:
        usuario = request.form.get('usuario')
        senha = request.form.get('senha')

        if not usuario or not senha:
             return jsonify({'sucesso': False, 'erro': 'Usuário e senha são obrigatórios.'})
        
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT senha_hash FROM atletas WHERE usuario = %s;", (usuario,))
            atleta_senha_hash = cursor.fetchone()
            
            if atleta_senha_hash:
                # Ordem correta do verify (senha_plana, hash_do_banco)
                if sha256_crypt.verify(senha, atleta_senha_hash[0]):
                    session['usuario'] = usuario
                    # 3. MUDANÇA (Importante): Retorna JSON para o JavaScript lidar com o redirecionamento
                    return jsonify({'sucesso': True, 'redirect_url': url_for('index')})
                else:
                    return jsonify({'sucesso': False, 'erro': 'Senha incorreta.'})
            else:  
                return jsonify({'sucesso': False, 'erro': 'Não foi encontrado tal usuário.'})
                
    except Exception as e:
        # Em caso de erro de DB, etc.
        return jsonify({'sucesso': False, 'erro': f'Ocorreu um erro interno: {e}'})
    
    finally:
        if conn:
            conn.close()

@app.route('/register', methods=['GET','POST'])
# função que registra o usuário após clicar em "registrar"
def register():
    if request.method == 'GET':
        return render_template('index.html') # Assumindo que o registro está no index
    
    conn = None
    try:
        # 1. CORREÇÃO: Chamada correta da função
        conn = get_db_connection()
        with conn.cursor() as cursor:
            usuario = request.form.get('usuario')
            senha = request.form.get('senha')

            if not usuario or not senha:
                return jsonify({'sucesso': False, 'erro': 'Usuário e senha são obrigatórios.'})

            cursor.execute("SELECT usuario FROM atletas WHERE usuario=%s;", (usuario,))
            user_db = cursor.fetchone()
            
            if not user_db:  
                senha_hash = sha256_crypt.encrypt(senha)
                cursor.execute("INSERT INTO atletas(usuario,senha_hash) VALUES (%s,%s);", (usuario, senha_hash))
                conn.commit()
                return jsonify({'sucesso': True, 'mensagem': 'Registrado com sucesso!'})
            else:
                return jsonify({'sucesso': False, 'erro': 'Usuário já existente.'})
                
    except Exception as e:
        return jsonify({'sucesso': False, 'erro': f'Ocorreu um erro interno: {e}'})
        
    finally:
        # 2. CORREÇÃO (Crítica): Remover redirect e fechar conexão
        if conn:
            conn.close()
        # O 'return redirect' aqui estava quebrando tudo, pois ele
        # executa SEMPRE, sobrescrevendo seu 'return jsonify'.

@app.route('/logout')
def logout():
    session.pop('usuario', None)
    return redirect(url_for('index'))

if __name__ == "__main__":
    app.debug = True
    app.run(host='0.0.0.0', port=8000)
