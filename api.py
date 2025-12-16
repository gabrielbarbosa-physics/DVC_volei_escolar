# RESOLVER PROBLEMAS DE UPLOADS E CRIAR PÁGINA DASHBOARD (USER E SUDO).

import email
import os

from passlib.hash import sha256_crypt
from flask import Flask, jsonify, render_template, request, session, flash, redirect, url_for
from werkzeug.utils import secure_filename
import psycopg2

# Inicializa o flask e atribui uma chave secreta.
app = Flask(__name__)
app.config['SECRET_KEY'] = '5fd5f4df5e8f12sf1dv1d5vf'

# Pasta que guarda as imagens dos alunos.
UPLOAD_FOLDER = '/static/uploads'
ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1] in ALLOWED_EXTENSIONS

@app.route('/upload_photo', methods=['GET', 'POST'])
def upload_photo():
    if request.method == 'POST':
        # Se o arquivo não tiver sido enviado, envie uma resposta com o erro.
        if 'file' not in request.files:
            return jsonify({'sucesso': 'False', 'erro': 'Nenhum arquivo enviado.'})
        file = request.files['file']
        if file.filename == '':
            return jsonify({'sucesso': 'False', 'erro': 'Nenhum arquivo encontrado.'})
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            # Salva a imagem no diretório escolhido.
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            return jsonify({'sucesso': 'True', 'mensagem': 'Arquivo enviado com sucesso!' })


# Dados de conexão no banco local postgres (atual).
DB_HOST = "localhost"
DB_NAME = "volei"
DB_USER = "postgres"
DB_PASSWORD = "+1Gabriel@1911"
DB_PORT = 5432


# Função que cria uma instância de conexão no banco e retorna o objeto.
def get_db_connection():
    conn = psycopg2.connect(
        host=DB_HOST,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        port=DB_PORT
    )
    return conn


# Carrega a página principal do web app, verificar se o usuario está logado.
@app.route('/')
def index():
    if 'usuario' in session:
        return render_template('dashboard.html', usuario_logado=session['usuario'])
    return render_template('register.html', usuario_logado=None)


# Se o usuário recarregar a página dashboard sem estar logado, ele retorna para a página index.
@app.route('/dashboard')
def dashboard():
    if 'usuario' in session:
        return render_template('dashboard.html', usuario_logado=session['usuario'])
    return render_template('register.html', usuario_logado=None)


# Método de login.
@app.route('/login', methods=['GET', 'POST'])
def login():
    # Se for GET, apenas renderiza a página.
    if request.method == 'GET':
        # Se já estiver logado, redireciona para o index.
        if 'usuario' in session:
            return redirect(url_for('dashboard'))
        return render_template('register.html')

        # Se for POST, processa o login.
    conn = None
    # Cria um objeto request que recebe um JSON enviado para o servidor.
    try:
        data_json = request.json
        email = data_json.get('email')
        password = data_json.get('password')
        # Se o usuário tentar enviar uma requisição com faltas, o servidor responde sem sucesso.
        if not email or not password:
            return jsonify({'sucesso': False, 'erro': 'Usuário e senha são obrigatórios.'})
        # Cria uma conexão com o banco.
        conn = get_db_connection()

        with conn.cursor() as cursor:
            # Busca via (SQL query) os dados de login do usuário a partir do email;
            # caso não encontre nenhum, devolve um erro.
            cursor.execute("SELECT senha_hash FROM atletas WHERE email = %s", (email,))
            resultado_query = cursor.fetchone()
            if resultado_query:
                usuario = email
                atleta_senha_hash_memory_view = resultado_query[0]
                atleta_senha_hash = atleta_senha_hash_memory_view.tobytes()
                # Compara o hash da senha com o hash do banco.
                if sha256_crypt.verify(password, atleta_senha_hash):
                    session['usuario'] = usuario
                    # Retorna bool(sucesso) como um JSON para o usuário.
                    return jsonify({'sucesso': True, 'redirect_url': url_for('dashboard')})
                else:
                    return jsonify({'sucesso': False, 'erro': 'Senha incorreta.'})
            else:
                return jsonify({'sucesso': False, 'erro': 'Não foi encontrado tal usuário.'})

    except Exception as e:
        # Em caso de erro de DB, etc.
        return jsonify({'sucesso': False, 'erro': f'Ocorreu um erro interno: {e}'})

    finally:
        # Encerra a conexão com o banco.
        if conn:
            conn.close()


@app.route('/register', methods=['GET', 'POST'])
# Função que registra o usuário no banco de dados.
def register():
    if request.method == 'GET':
        return render_template('register.html')

    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            data_json = request.json
            nome = data_json.get('nome')
            email_reg = data_json.get('email_reg')
            tel = data_json.get('tel')
            nome_res = data_json.get('nome_res')
            email_res = data_json.get('email_res')
            tel_res = data_json.get('tel_res')
            vinculo = data_json.get('vinculo')
            modalidade = data_json.get('modalidade')
            password = data_json.get('pass')

            cursor.execute("SELECT email FROM atletas WHERE email=%s;", (email_reg,))
            user_db = cursor.fetchone()

            if not user_db:
                senha_hash = sha256_crypt.hash(password)
                cursor.execute(
                    "INSERT INTO atletas(nome,email,senha_hash,vinculo,modalidade,data_registro) "
                    "VALUES (%s,%s,%s,%s,%s,CURRENT_DATE);",
                    (nome,email_reg,senha_hash,vinculo,modalidade))
                conn.commit()
                cursor.execute("INSERT INTO emails(detentor,end_email,id_atleta) "
                               "VALUES (%s,%s,(SELECT id FROM atletas "
                               "WHERE email=%s))",(nome_res,email_res,email_reg))
                conn.commit()
                cursor.execute("INSERT INTO telefones(detentor,num_telefone,id_atleta) "
                               "VALUES (%s,%s,(SELECT id FROM atletas "
                               "WHERE email=%s))", (nome_res, tel_res, email_reg))
                conn.commit()
                cursor.execute("INSERT INTO telefones(detentor,num_telefone,id_atleta) "
                               "VALUES (%s,%s,(SELECT id FROM atletas "
                               "WHERE email=%s))", (nome, tel, email_reg))
                conn.commit()
                return jsonify({'sucesso': True, 'mensagem': 'Registrado com sucesso!'})
            else:
                return jsonify({'sucesso': False, 'erro': 'Email já cadastrado.'})

    except Exception as e:
        return jsonify({'sucesso': False, 'erro': f'Ocorreu um erro interno: {e}'})

    finally:
        if conn:
            conn.close()


@app.route('/logout')
def logout():
    session.pop('usuario', None)
    return redirect(url_for('index'))


if __name__ == "__main__":
    app.debug = True
    app.run(host='0.0.0.0', port=5000)
