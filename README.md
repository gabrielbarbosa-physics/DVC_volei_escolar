# DVC App - Desenvolvimento, Vínculo e Comunidade

O **DVC App** é uma aplicação web progressiva (PWA) desenvolvida para a gestão completa de equipes e projetos de voleibol. Ele integra a gestão administrativa, técnica, financeira e comunicacional em uma única plataforma, focando no desenvolvimento individual do atleta e no fortalecimento do vínculo da equipe.

---

## Principais Recursos e Funcionalidades

### 1. Autenticação e Cadastro
* **Login Social**: Autenticação rápida e segura integrada com o Google (Firebase Auth).
* **Gestão de Perfil**: Cadastro de dados pessoais (Nome, Nascimento, Sexo, Telefone).
* **Controle de Menores**: Campos específicos para contato de responsáveis caso o atleta seja menor de idade.

### 2. Dashboard Inicial (Home)
* **Visão Geral**: Resumo rápido das presenças, próximos eventos e status do atleta.
* **Avisos Importantes**: Destaque para comunicações urgentes e alertas financeiros (ex: pendências, carências).
* **Ações Rápidas**: Atalhos inteligentes dependendo do nível de permissão do usuário (Atleta vs. Equipe Técnica).

### 3. Agenda e Gestão de Eventos
* **Múltiplos Tipos de Eventos**: Treinos, Jogos/Amistosos, Preparação Física, Fisioterapia e Reuniões.
* **Lista de Presença Inteligente**: Registro de presença em tempo real.
* **Sistema de Convocação**: Ferramenta exclusiva para jogos e campeonatos, separando convocados da torcida.
* **Sorteador de Times**: Algoritmo integrado para divisão justa de times em treinos (baseado em posições e pontuação no ranking - _Snake Draft_).
* **Classificação de Treinos**: Acompanhamento de vitórias, empates e pontos disputados durante os treinos coletivos.

### 4. Perfil Analítico do Atleta
* **Radar de Habilidades**: Gráfico interativo (Chart.js) detalhando atributos:
  * **Técnicos**: Recepção, Levantamento, Ataque, Bloqueio, Defesa, Saque.
  * **Táticos**: Antecipação, Tomada de Decisão, Leitura de Jogo.
  * **Socioemocionais**: Resiliência, Comunicação em Quadra, Trabalho em Equipe.
* **Score Geral e Específico**: Nota global e nota ponderada focada na função do atleta (Levantador, Central, Ponta, Oposto, Líbero).
* **Gráfico de Evolução Histórica**: Linha do tempo mostrando o progresso técnico do atleta.
* **Plano de Evolução Individual (PEI)**: Geração automatizada de pontos fortes, pontos a desenvolver e metas de curto/médio prazo.

### 5. Sistema de Avaliação 360º
* **Avaliação da Equipe Técnica**: Notas oficiais que definem o nível e categoria do atleta.
* **Avaliação por Pares (Colegas)**: Feedback anônimo e construtivo entre os próprios jogadores.
* **Autoavaliação**: Ferramenta de reflexão onde o atleta avalia seu próprio desempenho mensalmente.

### 6. Rankings e Gamificação
* **Filtros Dinâmicos**: Segmentação do ranking por Gênero, Categoria (Iniciante, Intermediário, Avançado) e Função Tática.
* **Top 3 e Destaques**: Visualização em formato de pódio para os melhores ranqueados.
* **Múltiplos Critérios**: Ranking Geral, Presença Absoluta, Habilidades Específicas e Aproveitamento em Treinos.

### 7. Quiz de Inteligência de Jogo
* **Testes Teóricos**: Avaliação do conhecimento das regras e táticas do voleibol.
* **Fases de Dificuldade**: Níveis Básico e Avançado liberados mensalmente.
* **Impacto no Ranking**: O resultado do Quiz converte-se em bônus no Score Geral do atleta.

### 8. Controle Financeiro (Contribuições)
* **Gestão de Mensalidades/Contribuições**: Envio de comprovantes de pagamento via upload de imagens.
* **Justificativas de Isenção**: Sistema para envio de justificativas caso o atleta não possa contribuir no mês.
* **Auditoria Visual**: Indicadores de cores (Pendente, Validado, Justificado) e alertas de suspensão para inadimplentes prolongados.
* **Carência para Novatos**: Isenção automática do controle financeiro no mês de ingresso.

### 9. Mural de Comunicação
* **Feed de Notícias**: Espaço para publicação de comunicados oficiais do projeto.
* **Privilégios de Postagem**: Restrito à equipe administrativa para manter a organização e importância da via de comunicação.

### 10. Painel Administrativo (Equipe Técnica)
* **Gestão de Usuários**: Aprovação de cadastros, edição de papéis, suspensões e inativações.
* **Validação de Avaliações**: Moderação das avaliações entre pares e autoavaliações antes de integrarem os cálculos oficiais.
* **Validação Financeira**: Aprovação de comprovantes enviados e controle da tesouraria do projeto.
* **Configuração de Parâmetros**: Ajuste dinâmico das notas médias exigidas por cada categoria (radar comparativo).
* **Advertências**: Aplicação de registros disciplinares com impacto no status do atleta.

---

## Stack Tecnológica
* **Frontend**: HTML5, Vanilla JavaScript, Tailwind CSS.
* **Gráficos**: Chart.js.
* **Ícones**: FontAwesome.
* **Manipulação de Dados**: SheetJS (XLSX) para exportação de relatórios.
* **Backend & Banco de Dados**: Firebase (Authentication, Firestore, Storage).
* **Hospedagem**: Firebase Hosting.
