-- Estrutura do banco de dados do volei;
-- criação do banco de dados + 
-- (?)sugestões de queries(?)
-- estratégicas baseadas nas demandas do web app;
----------------------------------------------------
-- CRIAÇÃO DA CARTEIRINHA
----------------------------------------------------
CREATE TABLE atletas(
id INT PRIMARY KEY generated always as identity,
  nome VARCHAR(50) NOT NULL,
  usuario VARCHAR(20) NOT NULL,
  senha_hash BYTEA NOT NULL,
  endereço VARCHAR(100),
  vinculo VARCHAR(20) NOT NULL CHECK(vinculo in ('atleta aluno','atleta','tecnico','auxiliar','gerencia')),
  modalidade VARCHAR(20),
  foto_path VARCHAR(100),
  status VARCHAR(20) CHECK (modalidade in ('em dia','em atraso','suspenso')),
  data_registro timestamp
  );
----------------------------------------------------
-- CRIAÇÃO DO VÍNCULO ENTRE ATLETA E ESPORTE;
----------------------------------------------------
-- um atleta pode ter > 1 vínculo, a tabela separada
-- garante um escalonamento indefinido de
-- modalidades sem alterar a tabela principal 
----------------------------------------------------
CREATE TABLE inscriçoes(
  id_inscriçao INTEGER PRIMARY KEY generated always as identity,
  esporte VARCHAR(20) CHECK (esporte in ('vôlei','basquete')),
  id_atleta INTEGER,
  FOREIGN KEY (id_atleta) REFERENCES atletas(id)
  );
----------------------------------------------------
-- CRIAÇÃO DAS TABELAS (INDEPENDENTES) DE 
-- CONTATOS;
----------------------------------------------------
CREATE TABLE telefones(
  id_telefone INTEGER generated always as identity,
  detentor VARCHAR(50),
  num_telefone VARCHAR(20), 
  id_atleta INTEGER,
  FOREIGN KEY (id_atleta) REFERENCES atletas(id)
  );

CREATE TABLE emails(
  id_email INTEGER generated always as identity,
  detentor VARCHAR(50),
  end_email VARCHAR(50), 
  id_atleta INTEGER,
  FOREIGN KEY (id_atleta) REFERENCES atletas(id)
  );



