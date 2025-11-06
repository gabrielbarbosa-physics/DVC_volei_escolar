from passlib.hash import sha256_crypt
from flask import Flask, jsonify, render_template, request, session
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
    if request.method == 'GET':
        return render_template('index.html')

    conn=None
    try:
        usuario = request.form.get('usuario')
        senha = request.form.get('senha')
        
#a obrigação de fornecer a senha será colocada ná pagina

        conn = get.db.connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT senha_hash FROM atletas WHERE usuario = %s;", (usuario,))
            atleta_senha = cursor.fetchone()
             
            if atleta_senha:
                if sha256_crypt.verify(atleta_senha[0],senha):
                    session['usuario'] = usuario
                    return redirect(url_for(''))
            else: 
               return jsonify({'erro':'não foi encontrado tal usuario'})
                
   
    except Exception as e:
        flash(f'Ocorreu um erro: {e}', 'danger')
        return redirect(url_for('login'))
    
@app.route('/register', methods=['GET','POST'])
# função que registra o usuário após clicar em "registrar"
def register():
    if request.method == 'GET':
        return render_template('index.html')
    
    conn=None
    try:
        conn = get.db.connection()
        with conn.cursor() as cursor:
            usuario = request.form.get('usuario')
            senha = request.form.get('senha')
            cursor.execute("SELECT usuario FROM atletas WHERE usuario=%s;",(usuario,))
            user_db = cursor.fetchone()
            if not user_db: 
                senha_hash = sha256_crypt.encrypt(senha)
                cursor.execute("INSERT INTO atletas(usuario,senha_hash) VALUES (%s,%s);",(usuario,senha_hash))
                conn.commit()
                return jsonify({'sucesso':'registrado'})
            else:
                return jsonify({'erro':'usuario existente'})
            
    except Exception as e:
        flash(f'Ocorreu um erro: {e}', 'danger')
        return redirect(url_for('login'))
    
    finally:
        return redirect(url_for('login'))

if __name__ == "__main__":
    app.debug = True
    app.run(host='0.0.0.0', port=8000)
