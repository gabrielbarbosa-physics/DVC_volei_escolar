# DVC Voleibol Escolar

Sistema de gerenciamento web para o **Drummond Voleibol Clube**.


## Sobre o Projeto

Este repositório contém o código-fonte do web app do DVC. O projeto consiste em uma API RESTful desenvolvida em Flask que se comunica com um banco de dados PostgreSQL.

O foco atual é fornecer uma estrutura de backend sólida que entrega respostas JSON, permitindo que o frontend seja substituido/integrado.

---

## Avisos Importantes

Os critérios de segurança e autenticação **ainda não foram auditados**. O código atual requer uma análise exaustiva antes de ser considerado para ambiente de produção.

Os diretórios `/static` e `/template` contêm uma interface de teste (HTML/CSS/JS). Eles servem apenas para validar os endpoints da API.

## Estrutura e Arquivos

### `api.py`
Contém a lógica central da aplicação.
* Define as regras de interação entre frontend e backend.
* Gerencia conexões com o banco de dados.
* Rotas e endpoints da API.

### `db_modelo_físico`
Implementação **parcial** do banco de dados.

## Requerimentos

No arquivo "requirements.txt" se encontram as bibliotecas python necessárias para a instalação.
---
