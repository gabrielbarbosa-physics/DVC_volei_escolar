from passlib.hash import sha256_crypt
from flask import Flask, jsonify, render_template, request, session, flash, redirect, url_for
import psycopg2
from functools import wraps

app = Flask(__name__)
app.config['SECRET_KEY'] = '5fd5f4df5e8f12sf1dv1d5vf'

##############CONFERIR SENHA



# função para conferir se o usuario esta logado para acessar a dashboard

#def login_required(f):
#    """
#    Um decorator para garantir que um usuário esteja logado
#    antes de acessar uma página.
#    """
#    @wraps(f)
#    def decorated_function(*args, **kwargs):
#        # Verifica se 'usuario' NÃO está na sessão
#        if 'usuario' not in session:
#            # Se não estiver, redireciona para a página de login (index)
#            return redirect(url_for('index')) # Assumindo que 'index' é sua rota de login
#
#        # Se ESTIVER na sessão, execute a função original (o dashboard)
#        return f(*args, **kwargs)
#    return decorated_function


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
        return render_template('dashboard.html', usuario_logado = session['usuario'])
    return render_template('index.html', usuario_logado = None)

@app.route('/dashboard')
def dashboard():
    if 'usuario' in session:
        return render_template('dashboard.html', usuario_logado = session['usuario'])
    return render_template('index.html', usuario_logado= None)

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
        data_json = request.json
        usuario = data_json.get('usuario')
        senha = data_json.get('senha')

        if not usuario or not senha:
             return jsonify({'sucesso': False, 'erro': 'Usuário e senha são obrigatórios.'})
        
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT senha_hash FROM atletas WHERE usuario = %s;", (usuario,))
            resultado_query=cursor.fetchone()
            if resultado_query:
                atleta_senha_hash_memory_view = resultado_query[0]
                atleta_senha_hash = atleta_senha_hash_memory_view.tobytes()
            
                if sha256_crypt.verify(senha, atleta_senha_hash):
                    session['usuario'] = usuario
                    # 3. MUDANÇA (Importante): Retorna JSON para o JavaScript lidar com o redirecionamento
                    return jsonify({'sucesso': True, 'redirect_url': url_for('dashboard')})
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
        conn = get_db_connection()
        with conn.cursor() as cursor:
            data_json = request.json
            usuario = data_json.get('usuario')
            senha = data_json.get('senha')
            nome = data_json.get('nome')
            vinculo = data_json.get('vinculo')

            #if not usuario or not senha:
            #    return jsonify({'sucesso': False, 'erro': 'Usuário e senha são obrigatórios.'})

            cursor.execute("SELECT usuario FROM atletas WHERE usuario=%s;", (usuario,))
            user_db = cursor.fetchone()
            
            if not user_db:  
                senha_hash = sha256_crypt.hash(senha)
                cursor.execute("INSERT INTO atletas(usuario,senha_hash,nome,vinculo,data_registro) VALUES (%s,%s,%s,%s,CURRENT_DATE);", (usuario, senha_hash,nome,vinculo,))
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
