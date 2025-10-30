-- Estrutura do banco de dados do volei;
-- criação do banco de dados + sugestões de queries
-- estratégicas baseadas nas demandas do web app;
----------------------------------------------------
-- CRIAÇÃO DA CARTEIRINHA
----------------------------------------------------
CREATE TABLE atletas(
id INT PRIMARY KEY generated always as identity,
  nome VARCHAR(50) NOT NULL,
  senha_hash BYTEA NOT NULL,
  endereço VARCHAR(100),
  vinculo VARCHAR(20) NOT NULL CHECK(vinculo in ('atleta aluno','atleta','tecnico','auxiliar','gerencia')),
  modalidade VARCHAR(20) CHECK(modalidade in ('masculino','feminino')),
  foto_path VARCHAR(100),
  status VARCHAR(20) CHECK (modalidade in ('em dia','em atraso','suspenso'))
  );
----------------------------------------------------
-- Por padrão, incluímos a DATA COMPLETA de registro 
-- do atleta no banco de dados
----------------------------------------------------
ALTER TABLE atletas
ADD data_registro timestamp;
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
FOREIGN KEY (id_atleta) REFERENCES atletas(id));
----------------------------------------------------


