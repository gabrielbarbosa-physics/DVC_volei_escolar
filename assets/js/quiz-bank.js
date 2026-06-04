/**
 * ============================================================================
 * Módulo: QUIZ-BANK
 * ============================================================================
 * Responsabilidade: Gerencia funcionalidades relacionadas a quiz-bank.
 * Este arquivo faz parte do sistema modular do DVC App.
 * Todos os códigos principais aqui agrupados seguem as diretrizes do projeto.
 * ============================================================================
 */

// js/quiz-bank.js
// Banco de Questões - Desafio Semanal de Inteligência de Quadra DVC (Revisado com Distratores Plausíveis)

export const QUESTOES_INTELIGENCIA_QUADRA_DVC = [
    // --- VISÃO DE JOGO (17 questões) ---
    {
        id: "visao-001",
        nivel: "visao_jogo",
        nivelNome: "Visão de Jogo",
        tema: "Recepção e comunicação",
        cenario: "O saque adversário viaja flutuando no meio da quadra, caindo na zona de conflito entre você (ponteiro passador) e o líbero. Ambos estão em posição de passe.",
        pergunta: "Qual é a decisão técnica e tática mais adequada nesta situação?",
        alternativas: [
            "Deixar a bola com o líbero, pois ele é o especialista em passe da equipe e sempre tem a preferência na cobertura do meio.",
            "Avançar e dar um toque por cima para garantir que a bola não caia rápida, antecipando a ação do líbero.",
            "Gritar 'MINHA!' alto e claro, assumindo o passe caso o líbero não tenha se manifestado primeiro, para evitar hesitação mútua.",
            "Tentar passar a bola de manchete com um braço só para não se chocar caso o líbero venha na mesma bola."
        ],
        correta: 2,
        explicacaoCorreta: "No vôlei, a comunicação tem preferência sobre a função. Mesmo que o líbero seja o especialista, se a bola está na zona de conflito, quem falar primeiro assume a responsabilidade, evitando choques e a queda da bola.",
        feedbackErro: "Ponto de atenção: A especialidade do líbero não isenta os outros jogadores de comunicar. A bola de conflito cai quando ambos esperam que o outro tome a iniciativa. Comunique firme ou respeite o comando."
    },
    {
        id: "visao-002",
        nivel: "visao_jogo",
        nivelNome: "Visão de Jogo",
        tema: "Cobertura de ataque",
        cenario: "O levantador armou uma bola muito colada na rede para o seu oposto. O bloqueio adversário montou duplo perfeito. Você é o ponteiro de fundo (posição 6).",
        pergunta: "Como você deve se posicionar para a cobertura (apoio)?",
        alternativas: [
            "Permanecer no centro da quadra, preparado para defender um possível contra-ataque caso a bola passe pelo bloqueio.",
            "Aproximar-se rapidamente nas costas do atacante, abaixando o centro de gravidade para defender um 'toco' direto e rápido para baixo.",
            "Recuar para a linha dos três metros e cobrir uma largada longa que o bloqueio adversário possa desviar.",
            "Saltar na linha de ataque simultaneamente para fingir que você vai atacar do fundo e confundir o adversário."
        ],
        correta: 1,
        explicacaoCorreta: "Bola colada na rede com bloqueio montado gera rebote (toco) muito rápido e angulado para baixo. A cobertura precisa estar próxima, em postura baixa, para amortecer essa bola.",
        feedbackErro: "Ponto de atenção: Se a bola está grudada, o rebote do bloqueio não vai longe, ele cai reto e rápido. Ficar plantado no fundo esperando o contra-ataque expõe a equipe ao 'toco' direto."
    },
    {
        id: "visao-003",
        nivel: "visao_jogo",
        nivelNome: "Visão de Jogo",
        tema: "Posicionamento defensivo",
        cenario: "O central adversário está prestes a atacar uma bola rápida (tempo) pelo meio. Você é o defensor da posição 5 (fundo esquerda).",
        pergunta: "Qual deve ser sua postura defensiva imediata?",
        alternativas: [
            "Avançar para o centro da quadra (posição 6) para cobrir largadas atrás do bloqueio.",
            "Ficar atrás do seu bloqueador central para garantir que as bolas amortecidas pelo bloqueio subam.",
            "Manter-se no corredor e esperar a definição, pois centrais raramente atacam cruzado longo.",
            "Posicionar-se fora da 'sombra' do seu bloqueio, buscando a linha de visão direta do braço do central adversário."
        ],
        correta: 3,
        explicacaoCorreta: "Se você não vê o atacante, ele não te vê e a bola também não chega em você. O defensor precisa se posicionar onde o bloqueio deixou aberto (fora da sombra).",
        feedbackErro: "Ponto de atenção: Esconder-se atrás do próprio bloqueio (sombra) inutiliza o defensor na pancada. O posicionamento exige enxergar o atacante e proteger o setor desprotegido pela rede."
    },
    {
        id: "visao-004",
        nivel: "visao_jogo",
        nivelNome: "Visão de Jogo",
        tema: "Transição Defesa-Ataque",
        cenario: "A equipe adversária larga uma bola curta na posição 3. Seu levantador teve que mergulhar para defendê-la.",
        pergunta: "Qual é a reação tática correta do sistema ofensivo?",
        alternativas: [
            "O central se aproxima para tentar levantar, enquanto os ponteiros abrem para atacar.",
            "O líbero (ou um não-atacante previamente definido) entra para realizar o segundo toque, enquanto os atacantes disponíveis abrem imediatamente para a chamada.",
            "O levantador levanta do chão rapidamente e tenta dar um toque por cima para o oposto.",
            "O atacante mais próximo da bola assume o levantamento de costas, mesmo que isso desconfigure as opções da rede."
        ],
        correta: 1,
        explicacaoCorreta: "A transição exige um 'levantador de emergência' designado (frequentemente o líbero ou oposto). Se um atacante levantar de forma improvisada, a equipe perde poder de fogo.",
        feedbackErro: "Ponto de atenção: Quando o levantador defende, a organização deve ser automática. Deixar o mais próximo levantar muitas vezes elimina um atacante crucial e gera levantamentos ruins."
    },
    {
        id: "visao-005",
        nivel: "visao_jogo",
        nivelNome: "Visão de Jogo",
        tema: "Leitura de Saque",
        cenario: "O sacador adversário faz o lançamento (toss) muito à frente do corpo em um saque viagem.",
        pergunta: "O que a linha de passe deve antecipar instintivamente?",
        alternativas: [
            "Um saque longo no final da quadra, exigindo um passo para trás de toda a linha.",
            "Um saque chapado na fita da rede, portanto a linha deve manter a posição inicial estática.",
            "Um saque forte e que tende a cair curto (mergulhar) devido ao contato mais baixo do braço do sacador.",
            "Um saque flutuante sem peso, permitindo que a linha de passe receba de toque."
        ],
        correta: 2,
        explicacaoCorreta: "Um toss (lançamento) adiantado obriga o sacador a golpear a bola com o braço não totalmente estendido, mudando a parábola e forçando a bola a cair mais rápida e curta.",
        feedbackErro: "Ponto de atenção: O saque viagem com bola à frente não ganha profundidade, ele 'morre' rápido e mergulha. Recuar esperando uma pancada longa é uma falha de leitura visual."
    },
    {
        id: "visao-006",
        nivel: "visao_jogo",
        nivelNome: "Visão de Jogo",
        tema: "Manchete de emergência",
        cenario: "A recepção explodiu no peito do líbero e a bola voou lateralmente para fora da quadra, perto do banco de reservas.",
        pergunta: "Como o jogador mais próximo deve executar o levantamento de recuperação?",
        alternativas: [
            "Correr e dar um toque para trás por cima da cabeça, buscando o centro da quadra.",
            "Entrar embaixo da bola e levantar de manchete o mais alto possível para a antena, exigindo precisão.",
            "Ajeitar o corpo para ficar de frente (ou levemente de lado) para a quadra e executar uma manchete muito alta para o centro da zona de três metros.",
            "Tentar atacar a bola do lado de fora direto para a quadra adversária para não perder a oportunidade."
        ],
        correta: 2,
        explicacaoCorreta: "Em bolas mortas fora de quadra, o objetivo é sobrevivência. Uma manchete alta para o centro seguro da quadra dá tempo para qualquer atacante ajeitar e passar a bola de volta.",
        feedbackErro: "Ponto de atenção: Bolas de emergência não são para armar jogadas precisas. Tentar levantar rápido ou na antena aumenta a chance de erro. Priorize o passe balão seguro no meio da quadra."
    },
    {
        id: "visao-007",
        nivel: "visao_jogo",
        nivelNome: "Visão de Jogo",
        tema: "Posicionamento do Bloqueio",
        cenario: "O levantador adversário armou uma bola 'C' (estourada e alta) para a ponta. O atacante está a três metros de distância e o bloqueio já se formou.",
        pergunta: "Como os bloqueadores devem conduzir o tempo do salto?",
        alternativas: [
            "Pular no exato momento em que o atacante adversário iniciar a passada de ataque.",
            "Aguardar, acompanhar a parábola da bola e saltar uma fração de segundo após o atacante adversário saltar, lendo a distância.",
            "Saltar cedo e pressionar as mãos por cima da fita o máximo possível para fechar completamente a passagem visual.",
            "Recuar as mãos e tentar apenas amortecer a bola (soft block), já que ataques do fundo são mais lentos."
        ],
        correta: 1,
        explicacaoCorreta: "Bolas altas (chutões) demoram a cair. O atacante salta tarde e alcança a bola depois. Se o bloqueio saltar antes ou junto com o passo do atacante, estará caindo quando a bola passar.",
        feedbackErro: "Ponto de atenção: A impaciência destrói o bloqueio de bolas altas. Saltar na passada do atacante faz com que você atinja o ápice do salto antes de a bola ser golpeada. Atraso intencional é a chave."
    },
    {
        id: "visao-008",
        nivel: "visao_jogo",
        nivelNome: "Visão de Jogo",
        tema: "Bola de xeque",
        cenario: "O saque do seu time foi muito agressivo, a recepção adversária falhou e a bola volta livre, de manchete, bem alta na sua posição 4.",
        pergunta: "Qual é a conduta tática correta se você está na zona de ataque?",
        alternativas: [
            "Saltar imediatamente e cravar a bola no chão de primeira para evitar que a defesa adversária se arrume.",
            "Acompanhar a bola e dar um passe de toque perfeito na mão do levantador para construir uma jogada com todos os atacantes disponíveis.",
            "Largar a bola de primeira, explorando a desorganização do fundo de quadra adversário.",
            "Passar a bola de manchete com força para o fundo, visando o erro de comunicação deles."
        ],
        correta: 1,
        explicacaoCorreta: "Bolas de graça e altas não devem ser tratadas com afobação. Construir o contra-ataque organizando o passe para o levantador gera uma oportunidade limpa de ponto, sem o risco de errar o tempo da bola.",
        feedbackErro: "Ponto de atenção: Tentar atacar bolas de graça de primeira é tentador, mas o índice de erro (rede, fora ou bloqueio inesperado) é alto. Paciência para organizar a jogada é a assinatura de um time inteligente."
    },
    {
        id: "visao-009",
        nivel: "visao_jogo",
        nivelNome: "Visão de Jogo",
        tema: "Largadinha adversária",
        cenario: "O ponteiro adversário salta fora de tempo, com a bola muito baixa em relação à cabeça dele.",
        pergunta: "O que o sistema defensivo (fundo) deve ler e executar instintivamente?",
        alternativas: [
            "O jogador de posição 6 deve recuar bastante para esperar uma pancada espirrada no bloqueio.",
            "As defesas de posições 1 e 5 devem alinhar na diagonal curta, pois ele cruzará a bola.",
            "Os defensores devem projetar o corpo à frente, pois um ataque de bola baixa na mão quase sempre resulta em uma largada ou pingada curta.",
            "Todos devem ficar parados e confiar que o bloqueio resolverá."
        ],
        correta: 2,
        explicacaoCorreta: "Uma bola muito baixa impossibilita a alavanca do braço para um ataque potente. A biomecânica dita que o atacante terá que 'empurrar' ou largar a bola, acionando o gatilho da defesa para aproximar.",
        feedbackErro: "Ponto de atenção: A leitura de jogo envolve prever o limite físico do adversário. Bola abaixo do queixo dele no ar significa largada na certa. Atrasar o mergulho à frente é perder a jogada."
    },
    {
        id: "visao-010",
        nivel: "visao_jogo",
        nivelNome: "Visão de Jogo",
        tema: "Saque tático",
        cenario: "Fim do set. O levantador adversário é baixo e eles têm dois atacantes excelentes na frente (posições 4 e 3). O oposto deles está escondido no fundo.",
        pergunta: "Qual é a estratégia de saque mais inteligente?",
        alternativas: [
            "Sacar forte e profundo na posição 5 para isolar o ponteiro da jogada.",
            "Sacar curto na posição 2 (saída de rede) para obrigar o levantador a se deslocar para frente ou para envolver o atacante na recepção curta.",
            "Sacar viagem com força total no líbero para tentar um ace direto.",
            "Sacar no central, porque ele é o atacante principal da rede."
        ],
        correta: 1,
        explicacaoCorreta: "Sacar curto na posição 2 (onde o levantador entra) quebra a passada do levantador para organizar o meio de rede e tira opções ofensivas rápidas, facilitando a montagem do seu bloqueio.",
        feedbackErro: "Ponto de atenção: Saques profundos não quebram o tempo do levantador. Um saque tático curto na zona do levantador o força a improvisar o segundo toque ou bater cabeça com o atacante de saída."
    },
    {
        id: "visao-011",
        nivel: "visao_jogo",
        nivelNome: "Visão de Jogo",
        tema: "Infiltração defensiva",
        cenario: "O passe adversário foi colado na rede (B+) e o levantador adversário (alto) salta para ajeitar a bola.",
        pergunta: "Qual deve ser a prioridade da sua primeira linha de defesa (bloqueadores)?",
        alternativas: [
            "Os centrais devem recuar para tentar defender uma possível bola de segunda curta.",
            "O bloqueador da posição que está de frente para o levantador deve armar o salto, acompanhando as mãos do levantador caso ele ataque de segunda, sem abandonar o central adversário.",
            "Todos os bloqueadores devem afastar da rede para não fazer falta.",
            "Saltar antecipadamente para evitar qualquer tipo de passe limpo para a saída."
        ],
        correta: 1,
        explicacaoCorreta: "Com um passe colado, a ameaça imediata é a bola de segunda. O bloqueador em frente ao levantador deve segurar a posição e estar pronto para bloquear o ataque dele, mantendo visão no atacante de meio.",
        feedbackErro: "Ponto de atenção: Recuar a linha de bloqueio em passe colado é entregar o ponto de graça (deixando o levantador ou o central adversário atacarem no mano a mano). Pressione o levantador na rede."
    },
    {
        id: "visao-012",
        nivel: "visao_jogo",
        nivelNome: "Visão de Jogo",
        tema: "Ataque sem bloqueio",
        cenario: "Seu levantador acelera a bola na ponta e o bloqueio adversário chega completamente quebrado. Você está sem marcação dupla.",
        pergunta: "O que você, atacante, NÃO deve fazer?",
        alternativas: [
            "Atacar cruzado longo, visando o fundo da quadra.",
            "Girar o tronco no ar para bater na paralela em segurança.",
            "Focar em bater a bola reta para baixo, o mais forte possível, no meio da zona de 3 metros.",
            "Explorar a manchete do defensor de fundo com uma pancada solta."
        ],
        correta: 2,
        explicacaoCorreta: "Atacar forte 'para baixo' na linha dos 3 metros sem bloqueio é perigoso porque diminui a margem de erro. A bola frequentemente para na fita da rede ou espirra fora por excesso de força e pouco ângulo limpo.",
        feedbackErro: "Ponto de atenção: O excesso de vontade de fazer o 'ponto bonito' (para baixo) gera muitos erros na rede. O atacante de elite aproveita a ausência de bloqueio para alongar a batida forte e garantir o ponto."
    },
    {
        id: "visao-013",
        nivel: "visao_jogo",
        nivelNome: "Visão de Jogo",
        tema: "Fuga do Bloqueio",
        cenario: "Você saltou atrasado, a bola perdeu altura e você se depara com um bloqueio fechado à sua frente. A defesa deles está esperando a pancada.",
        pergunta: "Como solucionar esse problema biomecânico e tático no ar?",
        alternativas: [
            "Forçar a batida de qualquer maneira na paralela, correndo o risco do toco.",
            "Parar o braço e tentar uma 'largadinha de peito' contra as mãos do bloqueador.",
            "Acionar o golpe de punho (soft) mirando intencionalmente nos dedos/punhos da lateral do bloqueio para provocar um touch-out (block out).",
            "Dar um toque espalmado por cima do bloqueio visando a posição 6."
        ],
        correta: 2,
        explicacaoCorreta: "Diante de um bloqueio bem postado e com a bola baixa, a solução técnica mais inteligente é jogar a bola propositalmente na extremidade do bloqueio para fora (explorar o braço do bloqueador lateral).",
        feedbackErro: "Ponto de atenção: Dar um toque espalmado ou tentar atacar de qualquer jeito em bola baixa é arriscar punição por condução ou tomar um bloqueio fácil. Explorar os dedos do bloqueio exige inteligência espacial."
    },
    {
        id: "visao-014",
        nivel: "visao_jogo",
        nivelNome: "Visão de Jogo",
        tema: "Passe flutuante",
        cenario: "O saque flutuante adversário vem em direção ao seu ombro direito e 'dança' no ar.",
        pergunta: "Qual o ajuste corporal fundamental que o passador deve fazer nos milésimos de segundo antes do contato?",
        alternativas: [
            "Firmar os pés no chão, unir os braços precocemente e balançar o corpo para compensar a parábola.",
            "Deslocar lateralmente com os pés para alinhar a bola ao eixo central do corpo e oferecer os braços firmes, sem 'dar a manchete' de baixo para cima.",
            "Fletir exageradamente os joelhos e esperar a bola descer para o nível do peito.",
            "Mudar imediatamente a decisão para receber de toque, mesmo que a bola esteja baixa."
        ],
        correta: 1,
        explicacaoCorreta: "A bola flutuante oscila. O segredo é mover as pernas intensamente para colocar o corpo atrás da bola e criar uma plataforma (braços) rígida, que serve apenas de anteparo (sem golpear a bola).",
        feedbackErro: "Ponto de atenção: O maior erro na manchete contra saque flutuante é ficar com o pé plantado e tentar alcançar a bola balançando os braços. A movimentação lateral rápida das pernas define a precisão."
    },
    {
        id: "visao-015",
        nivel: "visao_jogo",
        nivelNome: "Visão de Jogo",
        tema: "Cobertura de Bloqueio",
        cenario: "O atacante da sua equipe foi bloqueado de forma sólida (toco reto). O líbero não estava posicionado na sombra e a bola caiu limpa.",
        pergunta: "O que faltou na coordenação defensiva?",
        alternativas: [
            "Faltou o levantador abandonar a rede e se jogar para defender.",
            "Faltou o ponteiro gritar avisando o bloqueio adversário.",
            "O sistema de apoio (cobertura) não acompanhou a corrida do ataque, criando um vácuo no raio de 2 a 3 metros atrás do atacante.",
            "Faltou o atacante observar o bloqueio no ar e decidir não atacar."
        ],
        correta: 2,
        explicacaoCorreta: "A cobertura do próprio ataque exige que 2 a 3 jogadores circundem o atacante na hora do golpe. Se a bola caiu, é porque o 'copo' (formato semicircular da cobertura de apoio) não foi formado a tempo.",
        feedbackErro: "Ponto de atenção: Todo ataque enfrenta risco de bloqueio. Culpar o atacante não salva o ponto. A equipe que não caminha junto para formar o apoio no momento do salto adversário perde bolas de graça."
    },
    {
        id: "visao-016",
        nivel: "visao_jogo",
        nivelNome: "Visão de Jogo",
        tema: "Decisão no limite",
        cenario: "A bola de ataque passou do eixo do seu corpo. Você não consegue aplicar potência.",
        pergunta: "Qual recurso é o mais eficiente para não devolver a bola de graça?",
        alternativas: [
            "Arquear o corpo para trás e atacar com força apenas usando o ombro.",
            "Usar uma passada rápida de manchete ofensiva (bottom-up) visando o buraco no fundo da quadra.",
            "Largar (pingar) a bola nas pontas dos dedos buscando as diagonais curtas ou extremidades do bloqueio.",
            "Cair da rede e empurrar a bola com as duas mãos."
        ],
        correta: 2,
        explicacaoCorreta: "Se a bola ficou para trás do eixo do corpo, não há potência viável. A largada colocada (usando as pontas dos dedos) com giro de pulso para áreas vazias mantém a pressão sobre o adversário.",
        feedbackErro: "Ponto de atenção: Forçar um ataque quando se perdeu o tempo de bola (bola atrás da cabeça) geralmente gera dores no ombro e ataques na rede. Aceite a limitação e faça uma largada técnica irritante para a defesa deles."
    },
    {
        id: "visao-017",
        nivel: "visao_jogo",
        nivelNome: "Visão de Jogo",
        tema: "Toque na rede",
        cenario: "Você sobe no bloqueio isolado e sua mão resvala na fita. O juiz não viu e a bola continuou viva no rali.",
        pergunta: "Como um atleta do DVC deve agir neste cenário ético?",
        alternativas: [
            "Focar na defesa da bola primeiro e acusar a rede apenas se o ponto for favorável ao adversário no final.",
            "Continuar o rali silenciosamente, pois o erro de arbitragem faz parte do jogo e deve ser explorado.",
            "Levantar imediatamente o braço e acusar 'Dei rede!', parando a jogada a favor da ética e do respeito pelo jogo.",
            "Sinalizar para o seu banco que o juiz errou e continuar jogando com vantagem moral."
        ],
        correta: 2,
        explicacaoCorreta: "No voleibol formativo e em ambientes de respeito, a auto-arbitragem (Fair Play) é inegociável. Interromper o jogo assumindo a falta demonstra caráter superior à vitória circunstancial.",
        feedbackErro: "Ponto de atenção: A ética não tem botão de pausa durante o rali. Fingir que não tocou porque a bola continuou viva corrompe os valores da equipe. O Fair Play é imediato."
    },

    // --- PENSAMENTO DO LEVANTADOR (17 questões) ---
    {
        id: "pensamento-001",
        nivel: "pensamento_levantador",
        nivelNome: "Pensamento do Levantador",
        tema: "Distribuição tática",
        cenario: "Você está no sistema 5x1 (rede de dois). O central adversário é extremamente lento e costuma ficar posicionado aguardando na posição 3. A recepção da sua equipe chega perfeita.",
        pergunta: "Como castigar esse central taticamente?",
        alternativas: [
            "Levantar bolas rápidas e coladas pelo meio (tempo) exaustivamente para vencê-lo pela força no alto.",
            "Trabalhar com bolas altas e lentas nas pontas para dar tempo de seus atacantes estudarem o posicionamento dele.",
            "Utilizar jogadas aceleradas e chutes longos para as extremidades da rede, forçando o central a deslocar horizontalmente e chegar quebrado.",
            "Atacar a segunda bola todas as vezes que estiver na rede para desmoralizá-lo."
        ],
        correta: 2,
        explicacaoCorreta: "Contra centrais pesados e estáticos, o melhor é esticar o jogo. Jogadas rápidas nas pontas (chutes e meios-tempos afastados) exigem muita movimentação lateral, deixando o bloqueio furado.",
        feedbackErro: "Ponto de atenção: Tentar disputar força pelo meio com um gigante lento é um risco inútil. Movimentá-lo de ponta a ponta quebra o tempo de salto dele e abre a rede."
    },
    {
        id: "pensamento-002",
        nivel: "pensamento_levantador",
        nivelNome: "Pensamento do Levantador",
        tema: "Bola de segurança",
        cenario: "O jogo está 24x23 contra seu time. O passe explodiu para cima, quebrado, na linha dos 3 metros. Você chega na bola desequilibrado.",
        pergunta: "O que NÃO fazer nesta situação de pressão?",
        alternativas: [
            "Levantar alto na ponta de entrada de rede (posição 4), que é a jogada de conforto padrão.",
            "Levantar para o fundo (posição 6) se o atacante estiver livre e pedindo.",
            "Tentar forçar uma bola rápida de meio por pura precipitação e surpresa.",
            "Fazer um toque alto e seguro de manchete para o oposto (posição 2) assumir a responsabilidade."
        ],
        correta: 2,
        explicacaoCorreta: "Forçar jogada rápida de meio com o passe quebrado e corpo desequilibrado tem altíssima taxa de erro no momento decisivo. A bola de segurança alta é obrigatória.",
        feedbackErro: "Ponto de atenção: Pressão exige escolhas limpas. O passe estourou? Esqueça as jogadas rápidas (chute e tempo). Levante a bola limpa nas extremidades e passe a pressão para o atacante."
    },
    {
        id: "pensamento-003",
        nivel: "pensamento_levantador",
        nivelNome: "Pensamento do Levantador",
        tema: "Infiltração e Postura",
        cenario: "A equipe adversária sacou. Você infiltra da posição 1. O passe vem um pouco deslocado para a posição 2.5.",
        pergunta: "Para onde devem apontar seus ombros antes do contato para esconder a jogada e garantir eficiência técnica?",
        alternativas: [
            "Para onde a bola está vindo, para acompanhá-la com o corpo todo e evitar erros de trajetória.",
            "Para o fundo da quadra, mantendo as costas viradas para a rede até o último segundo.",
            "Para a antena externa (posição 4) da sua equipe, mantendo a bola na frente da linha dos ombros.",
            "Sempre apontados diretamente para o centro da quadra adversária para observar a marcação."
        ],
        correta: 2,
        explicacaoCorreta: "A neutralidade corporal é a essência do levantador. Manter os ombros perpendiculares à rede, de frente para a posição 4, esconde se a bola será empurrada para frente ou lançada para trás (costas).",
        feedbackErro: "Ponto de atenção: Virar o corpo inteiro para a direção da bola quebra a simetria e revela ao bloqueio adversário a limitação das suas opções de levantamento. Mantenha os ombros alinhados com as antenas."
    },
    {
        id: "pensamento-004",
        nivel: "pensamento_levantador",
        nivelNome: "Pensamento do Levantador",
        tema: "Bola de segunda",
        cenario: "Você está na rede e o passe chega perfeito (A). O bloqueio de meio deles recuou achando que você não atacaria.",
        pergunta: "Ao optar por um ataque de segunda, qual é a execução que aumenta o sucesso e evita violações?",
        alternativas: [
            "Saltar, parar no ar olhando para a marcação e empurrar a bola lentamente.",
            "Atacar a bola no ponto mais alto com uma das mãos de forma firme, aproveitando o tempo do salto do seu próprio levantamento.",
            "Esperar a bola descer para a altura do queixo e fazer o movimento clássico de toque guiando a bola para a quadra deles.",
            "Tentar atacar a bola com as duas mãos, empurrando-a com força de cima para baixo."
        ],
        correta: 1,
        explicacaoCorreta: "O ataque de segunda só surpreende se feito na mesma altura e postura de um levantamento rápido (saltando). Bater de primeira mão (como uma pequena cortada ou pingo) evita marcações de dois toques/condução.",
        feedbackErro: "Ponto de atenção: A condução em ataques de segunda com as duas mãos é uma das infrações mais comuns. Agressividade de segunda exige ação rápida com uma mão só no ponto máximo do salto."
    },
    {
        id: "pensamento-005",
        nivel: "pensamento_levantador",
        nivelNome: "Pensamento do Levantador",
        tema: "Gestão Emocional do Atacante",
        cenario: "Seu ponteiro foi bloqueado três vezes seguidas e está visivelmente abalado. No rally atual, a bola subiu alta e segura.",
        pergunta: "Como o levantador age taticamente no aspecto mental?",
        alternativas: [
            "Deixa de levantar para ele até que ele mude a atitude e recupere a coragem.",
            "Tenta forçar uma bola extremamente acelerada para ele bater sem pensar e surpreender.",
            "Ajusta e fornece uma bola limpa (alta e destacada da rede) para outro companheiro até o ponteiro recuperar a respiração e a confiança situacional.",
            "Continua mandando bolas para ele insistindo que uma hora a bola passa, sem realizar nenhum ajuste tático na distribuição."
        ],
        correta: 2,
        explicacaoCorreta: "A inteligência emocional do time passa pelas mãos do distribuidor. Se o atacante sentiu a pressão e os bloqueios em sequência, o levantador deve aliviar o peso distribuindo o jogo e aguardando o momento para recuperá-lo com segurança.",
        feedbackErro: "Ponto de atenção: Insistir no atacante abatido sem pensar é cruel taticamente. Distribua o jogo, confunda o bloqueio adversário e só então devolva uma bola excelente para o ponteiro 'voltar' para o jogo."
    },
    {
        id: "pensamento-006",
        nivel: "pensamento_levantador",
        nivelNome: "Pensamento do Levantador",
        tema: "Enganar o Bloqueio",
        cenario: "Você quer forçar o bloqueio central adversário a saltar para abrir as pontas, mas a recepção está um pouco distante da rede.",
        pergunta: "Qual artifício corporal ajuda a criar a 'finta' do passe do central, mesmo de longe?",
        alternativas: [
            "Dar as costas para o central e focar apenas nos ponteiros.",
            "Olhar para o central no ar e manter as mãos baixas, forçando um toque rápido que o bloqueio perceberá e pulará.",
            "Saltar, estabilizar o olhar fixo no meio e iniciar o movimento para o centro antes de soltar rapidamente a bola para as extremidades (finta de olho e pulso).",
            "Avisar em voz alta: 'Vai ponta!', para que o central saia de perto."
        ],
        correta: 2,
        explicacaoCorreta: "A visão e a preparação corporal (mesmo longe da rede) chamam o instinto de perseguição do central. Ao olhar e ameaçar no centro, o bloqueio congela por décimos vitais, liberando as pontas.",
        feedbackErro: "Ponto de atenção: Você mente com os olhos e a intenção, não com palavras. Se o levantador já olha direto para a ponta, o central acompanha sem hesitar. Prenda a atenção dele e inverta."
    },
    {
        id: "pensamento-007",
        nivel: "pensamento_levantador",
        nivelNome: "Pensamento do Levantador",
        tema: "Ajuste em Passe 'B'",
        cenario: "A bola da recepção vem com muita força e em uma trajetória reta para os seus braços (sem a parábola ideal).",
        pergunta: "Como o levantador experiente amortece e controla essa bola?",
        alternativas: [
            "Fecha imediatamente a posição de manchete, já que a bola veio reta e não dá para tocar.",
            "Endurece os pulsos para rebater a bola como se fosse um passe de resposta.",
            "Entra embaixo rápido, acompanha o movimento cedendo com as pernas e pulsos, criando um efeito de mola amortecedora antes de estender.",
            "Deixa a bola bater no peito para amortecer e levanta depois."
        ],
        correta: 2,
        explicacaoCorreta: "Bolas sem parábola (passes tensos/retos) estouram nos dedos se os pulsos estiverem rígidos. O efeito mola (amortecimento de corpo e mãos) conserta o passe ruim.",
        feedbackErro: "Ponto de atenção: Rebater bola tensa com dedos duros causa dois toques (condução irregular). Você deve 'receber' a bola macia e depois impulsionar."
    },
    {
        id: "pensamento-008",
        nivel: "pensamento_levantador",
        nivelNome: "Pensamento do Levantador",
        tema: "Visão Periférica na Transição",
        cenario: "Seu time acabou de defender. A bola viaja na direção da posição 3. Você (levantador) inicia a corrida.",
        pergunta: "Onde deve estar seu foco visual durante essa breve corrida?",
        alternativas: [
            "Totalmente cravado na trajetória da bola para não perder o ponto de encontro.",
            "Varrendo a postura do bloqueio adversário e o posicionamento dos seus próprios atacantes, enquanto a bola (vista de relance) entra no cone de visão.",
            "Nos pés para evitar tropeçar.",
            "No juiz de cadeira para ver se houve infração na defesa."
        ],
        correta: 1,
        explicacaoCorreta: "O diferencial do levantador de alto nível é processar a configuração adversária enquanto se move. A bola segue a física, mas o bloqueio muda a cada segundo. Visão panorâmica é o nome do jogo.",
        feedbackErro: "Ponto de atenção: Correr olhando fixamente para a bola transforma você em um distribuidor cego. Olhe ao redor! Quem fechou? Quem está atrasado? Essa leitura ocorre antes de tocar na bola."
    },
    {
        id: "pensamento-009",
        nivel: "pensamento_levantador",
        nivelNome: "Pensamento do Levantador",
        tema: "Hot hand (Mão quente)",
        cenario: "O ponteiro está destruindo o jogo (12 de 14 ataques convertidos). O set chegou aos pontos finais (20+). O bloqueio duplo advesário começa a fechar em cima dele fixamente.",
        pergunta: "Qual o erro fatal de distribuição que um levantador mediano cometeria?",
        alternativas: [
            "Mudar radicalmente e levantar só para o central rápido para explorar o erro.",
            "Distribuir o jogo alternadamente, mantendo o bloqueio em dúvida enquanto não afoga o melhor atacante.",
            "Ignorar que o bloqueio mudou e insistir repetidamente em bolas lentas para a 'mão quente' até que ele seja marcado três vezes seguidas.",
            "Fazer uma largadinha de segunda toda vez para ele."
        ],
        correta: 2,
        explicacaoCorreta: "A 'hot hand' funciona até o adversário ajustar. Se o bloqueio começou a colar e antecipar o salto no seu melhor atacante, continuar forçando é taticamente pobre. Use-o como isca e ative outros.",
        feedbackErro: "Ponto de atenção: Você não pode queimar sua melhor peça. Se o bloqueio do outro lado começou a ignorar os outros para cercá-lo, libere as opções secundárias que agora estão livres."
    },
    {
        id: "pensamento-010",
        nivel: "pensamento_levantador",
        nivelNome: "Pensamento do Levantador",
        tema: "Toque duplo irregular",
        cenario: "Na ânsia de acelerar o jogo (fazer uma 'chutada' na ponta), o levantador perde a simetria das mãos e a bola sai do toque gerando rotação excessiva.",
        pergunta: "Qual falha biomecânica causa esse giro e consequentemente a infração técnica?",
        alternativas: [
            "Ambas as mãos empurraram a bola simultaneamente, mas os braços abriram muito lateralmente.",
            "As mãos encontraram a bola em tempos diferentes, empurrando o objeto de forma assimétrica e criando o 'spin' (giro espiral).",
            "A bola foi recebida com os braços rígidos desde o início.",
            "O levantador não saltou o suficiente para absorver a bola."
        ],
        correta: 1,
        explicacaoCorreta: "A rotação suja num levantamento rápido acontece quando uma mão bate frações de segundo antes da outra ou com forças distintas, causando torque na bola e configurando toque duplo.",
        feedbackErro: "Ponto de atenção: Para acelerar a bola, a estabilidade das mãos (moldando a bola simetricamente) é pré-requisito. Velocidade sem alinhamento simétrico das mãos causa erro."
    },
    {
        id: "pensamento-011",
        nivel: "pensamento_levantador",
        nivelNome: "Pensamento do Levantador",
        tema: "Contra-ataque Confuso",
        cenario: "Uma bola defensiva difícil voa alta e cheia de giro no centro da quadra, caindo entre você (levantador) e o central que está correndo de costas.",
        pergunta: "Qual atitude salva o time de um choque e garante a reconstrução da jogada?",
        alternativas: [
            "Ficar em silêncio e esperar o central, pois quem está correndo de costas tem a preferência na bola.",
            "Gritar 'MINHA!' assertivamente logo no início da trajetória, assumir a posição e forçar o central a abrir para atacar ou se proteger.",
            "Correr para a bola de lado e dar um toque rápido antes dele chegar perto.",
            "Avisar o líbero para vir cobrir a falha e realizar o passe."
        ],
        correta: 1,
        explicacaoCorreta: "Bolas indefinidas pedem voz de comando e hierarquia. A segunda bola é do levantador. Assumi-la vocalmente de imediato corta a hesitação e evita lesões e passes errados.",
        feedbackErro: "Ponto de atenção: A inércia da dúvida causa trombadas. O levantador é o dono da segunda bola. Ao gritar 'MINHA', os demais sabem que devem mudar o foco para ataque ou cobertura instantaneamente."
    },
    {
        id: "pensamento-012",
        nivel: "pensamento_levantador",
        nivelNome: "Pensamento do Levantador",
        tema: "Recuperação no Passe Estourado",
        cenario: "O passe estourou totalmente em direção à arquibancada direita (fora da quadra). Você precisa recuperar a bola correndo a toda velocidade.",
        pergunta: "Ao chegar na bola, qual deve ser a sua preocupação principal de execução?",
        alternativas: [
            "Manter as costas voltadas para a quadra para imprimir força na batida e jogar a bola para o outro lado da rede.",
            "Virar o corpo de lado e tentar levantar com um toque preciso para o oposto que está na mesma linha que você.",
            "Conseguir virar os ombros de frente para o meio da quadra (posição 6/3) e executar uma manchete de balão altíssima e segura.",
            "Pular e bater na bola no desespero para não deixar cair e torcer para alguém pegar."
        ],
        correta: 2,
        explicacaoCorreta: "Em recuperações fora da quadra, orientar os ombros de volta para o retângulo de jogo é essencial. Manchetes longas e extremamente altas são a única forma de dar tempo de o atacante consertar o erro.",
        feedbackErro: "Ponto de atenção: Dar as costas para a quadra e jogar a bola para trás é erro de técnica de salvação. Plante-se ou gire, alinhe para o meio do campo e levante alto para o céu."
    },
    {
        id: "pensamento-013",
        nivel: "pensamento_levantador",
        nivelNome: "Pensamento do Levantador",
        tema: "Controle do Ritmo",
        cenario: "Sua equipe errou três recepções seguidas. O time está desorganizado, o ginásio está gritando, e o sacador deles já está com a bola na mão.",
        pergunta: "Como o levantador atua como maestro emocional nesse intervalo?",
        alternativas: [
            "Acelera o jogo, pedindo bola na mão e jogada super rápida de meio para não deixar o bloqueio respirar.",
            "Ignora a pressão e apenas pede desculpas ao sacador adversário.",
            "Grita com os passadores para acordarem, exigindo foco rígido no passe.",
            "Caminha devagar até o meio, fala com calma, ajusta cadarços ou limpa a sola para desacelerar o ímpeto adversário e dar respiro mental aos passadores."
        ],
        correta: 3,
        explicacaoCorreta: "O 'Momentum' no vôlei é brutal. Quando o adversário entra em frenesi de pontos em sequência, o líder tem que quebrar o ritmo, arrastar os segundos antes do saque e trazer a calma de volta.",
        feedbackErro: "Ponto de atenção: Tentar acelerar no meio do caos gera mais caos e falhas técnicas. O antídoto para a euforia adversária é a lentidão processual. Pare, respire e acalme seus passadores."
    },
    {
        id: "pensamento-014",
        nivel: "pensamento_levantador",
        nivelNome: "Pensamento do Levantador",
        tema: "Ajuste Pós-Recepção no Central",
        cenario: "A equipe adversária sacou bem na região do central de frente (posição 3), forçando-o a fazer a manchete do passe.",
        pergunta: "Qual é o impacto imediato na distribuição?",
        alternativas: [
            "O central não poderá atacar de primeira, pois não terá tempo para concluir a passada rápida, eliminando o meio de rede da opção ofensiva.",
            "Nenhum, o central deve passar e armar a corrida rápida normalmente.",
            "O levantador perde a função na jogada e precisa trocar de lugar com o líbero.",
            "A jogada obrigatoriamente terá que ser definida por um atacante de meio reserva."
        ],
        correta: 0,
        explicacaoCorreta: "Se o central (que deveria fazer a bola rápida) recebe o saque, seu tempo de ataque se perde na recuperação do corpo. O levantador precisa ter a leitura imediata de distribuir o jogo pelas extremidades (posições 4 e 2/1).",
        feedbackErro: "Ponto de atenção: O central que passa perdeu o timing da bola de primeiro tempo. Tentar armar o meio nessa situação quase sempre resulta em um ataque fraco. Ative suas pontas com segurança."
    },
    {
        id: "pensamento-015",
        nivel: "pensamento_levantador",
        nivelNome: "Pensamento do Levantador",
        tema: "Segunda de Emergência",
        cenario: "O passe está excelente (A) ou (B+), mas durante o deslocamento o levantador escorrega e se joga ao chão para não deixar a bola cair.",
        pergunta: "Quem assume a liderança momentânea da reconstrução?",
        alternativas: [
            "O levantador que escorregou e fará o passe no chão com uma manchete curta e baixa.",
            "O ponteiro de entrada, que deve cruzar a quadra inteira para levantar na ponta oposta.",
            "O jogador pré-determinado para o segundo passe de emergência (geralmente o líbero ou o oposto), que entrará comunicando 'EU!' de forma agressiva.",
            "O árbitro, parando o jogo por segurança devido à queda na quadra."
        ],
        correta: 2,
        explicacaoCorreta: "O plano B exige que líberos e opostos estejam sincronizados. Quando o levantador está incapacitado de tocar (defendendo ou caído), o jogador de emergência assume a armação comunicando rapidamente sua entrada.",
        feedbackErro: "Ponto de atenção: Se o levantador está no chão lutando com a bola, esperar que ele construa algo produtivo é perda de tempo. O time preparado ouve a voz do substituto de emergência imediatamente."
    },
    {
        id: "pensamento-016",
        nivel: "pensamento_levantador",
        nivelNome: "Pensamento do Levantador",
        tema: "Toque invertido (Costas)",
        cenario: "Você vai realizar um levantamento de costas (invertido) para o seu oposto (posição 2) estando na linha da rede. O bloqueio central deles está perto.",
        pergunta: "Para não dar dicas corporais da inversão precoce, como manter a postura?",
        alternativas: [
            "Inclinar exageradamente a coluna para trás logo após ver que o passe está subindo.",
            "Manter a mesma aproximação neutra sob a bola que se usa para levantar para a frente e, apenas no ponto final do contato com os dedos, estender braços, costas e pescoço para a saída.",
            "Realizar um giro rápido do tronco de 90 graus no último segundo, batendo na bola de lado.",
            "Olhar intensamente para trás antes do toque."
        ],
        correta: 1,
        explicacaoCorreta: "A biomecânica da finta exige padronização. A entrada sob a bola no toque de frente e no invertido tem que ser exatamente igual aos olhos do central até o microsegundo final do arqueamento dos dedos para trás.",
        feedbackErro: "Ponto de atenção: Você acusa a inversão quando começa a 'cair para trás' muito cedo. Entre reto e perpendicular debaixo da bola. O arqueamento é rápido e no ato final de impulsionar."
    },
    {
        id: "pensamento-017",
        nivel: "pensamento_levantador",
        nivelNome: "Pensamento do Levantador",
        tema: "Ajuste Fino na Largada de Segunda",
        cenario: "O central deles é muito astuto e começa a saltar levemente com você toda vez que a recepção está limpa (A), esperando um ataque de segunda.",
        pergunta: "Como o levantador reverte isso de forma letal?",
        alternativas: [
            "Ataca de segunda com ainda mais agressividade e velocidade na intenção de bater no rosto ou mão dele.",
            "Deixa de atacar de segunda pelo resto do jogo para não correr o risco de bloqueio individual.",
            "Realiza a movimentação ameaçadora idêntica ao ataque, faz a suspensão do tempo do central, e no último frame ajusta os pulsos soltando uma bola rápida livre para as pontas.",
            "Começa a tentar dar cortadas de costas da linha de três."
        ],
        correta: 2,
        explicacaoCorreta: "Se a sua ameaça de segunda atrai a marcação, você venceu o jogo tático. Use a sua intenção agressiva de braço alto para engolir o central no ar e, no mesmo salto, transforme a suspensão num passe para o ponteiro sem bloqueio.",
        feedbackErro: "Ponto de atenção: Atrair o bloqueio central é o sonho de todo armador. Se ele pulou em você no falso ataque, suas pontas estão vazias. É só girar o punho."
    },

    // --- VOZ ATIVA (16 questões) ---
    {
        id: "voz-001",
        nivel: "voz_ativa",
        nivelNome: "Voz Ativa",
        tema: "Comunicação no passe curto",
        cenario: "O sacador manda uma bola extremamente curta (pingo). Você, como ponteiro e o líbero vão ambos instintivamente na direção.",
        pergunta: "Qual é o fluxo ideal de comunicação e execução na zona de conflito curta?",
        alternativas: [
            "O líbero grita 'DEIXA!' e joga-se de peixinho, cortando a ação do ponteiro.",
            "Quem estiver na trajetória angular mais favorável grita 'MINHA!' e o outro jogador automaticamente recolhe os braços, assumindo a cobertura próxima ou transição.",
            "Ambos recuam e observam, confiando que a bola foi longa.",
            "O levantador grita de longe ordenando quem deve pegar, definindo a responsabilidade da recepção com atraso."
        ],
        correta: 1,
        explicacaoCorreta: "As bolas curtas e curtas-conflituosas exigem micro-decisões. Aquele que tem o corpo mais alinhado e solta a voz firme assume, enquanto o parceiro cede instantaneamente espaço, abrindo para atuar (ataque ou cobertura).",
        feedbackErro: "Ponto de atenção: Em zona de sobreposição de passe curto, esperar ordens é ponto garantido deles. Avaliação corporal instintiva combinada com 'Grito + Arrecadação' é a técnica limpa."
    },
    {
        id: "voz-002",
        nivel: "voz_ativa",
        nivelNome: "Voz Ativa",
        tema: "Reorganização de Setor Defensivo",
        cenario: "O ataque adversário sistematicamente quebra sua paralela. O bloqueador não fecha, e você (fundo direita) toma os ataques de frente.",
        pergunta: "Como o defensor intervém para sanar o erro sem minar a moral do bloqueador?",
        alternativas: [
            "Exige substituição urgente no próximo pedido de tempo.",
            "Sai intencionalmente da paralela para forçar o ataque no erro e responsabilizar o companheiro publicamente.",
            "Aproxima-se na transição rápida, aponta o posicionamento e diz: 'Cola no poste um passo, eles estão usando meu corredor livre. Fecha lá que o meio eu busco!'",
            "Muda seu posicionamento para dentro da quadra e grita orientações vagamente."
        ],
        correta: 2,
        explicacaoCorreta: "O fundo da quadra enxerga a burla da tática que quem está grudado na rede não vê. O ajuste deve ser franco, técnico ('cola no poste') e tranquilizador ('o meio eu busco'), retirando a carga de pressão individual do bloqueador.",
        feedbackErro: "Ponto de atenção: Você não aponta o erro sem prover a solução da outra metade da jogada. Liderar de trás significa ditar o arranjo e oferecer as costas largas ('eu pego a parte dura, me protege no simples')."
    },
    {
        id: "voz-003",
        nivel: "voz_ativa",
        nivelNome: "Voz Ativa",
        tema: "Aviso de Largada ('Pingou')",
        cenario: "Bloqueio armado. O atacante entra forte na passada, mas no cume do salto quebra a velocidade do cotovelo. Você (central) capta no reflexo.",
        pergunta: "Qual ação comunicativa vocal é imperativa?",
        alternativas: [
            "Suspender os braços, desviar o olhar do atacante e gritar no meio da quadra.",
            "Recolher as mãos o mais rápido possível e apenas gritar após voltar ao chão.",
            "No próprio momento da queda do salto do bloqueio, berrar instintivamente 'LAAARGA!' ou 'PINGO!' para desencadear a reação reativa das coberturas traseiras.",
            "Tentar, a partir da queda do salto, dar um passo de ajuste e defender sozinho."
        ],
        correta: 2,
        explicacaoCorreta: "A visão do bloqueador é antecipada. A comunicação no ar funciona como o gatilho neuromotor que faz as defesas baixas ativarem o mergulho. Se avisar depois que caiu, a bola já tocou o piso.",
        feedbackErro: "Ponto de atenção: O cérebro do defensor no fundo recebe o seu grito 'PINGO' antes do olho dele registrar o alívio na pancada. Sua voz acelera a reação dele na bola curta."
    },
    {
        id: "voz-004",
        nivel: "voz_ativa",
        nivelNome: "Voz Ativa",
        tema: "Sinalização tática silenciosa",
        cenario: "O central sinaliza nas costas (dedos) que marcará fixo o atacante de meio e abandonará as pontas (bloqueios simples). O líbero não percebeu o sinal e ficou no fundo da quadra na posição de defesa paralela curta.",
        pergunta: "Por que essa falha de leitura entre comunicação tátil (dedos) e fundo compromete o sistema?",
        alternativas: [
            "Porque bloqueio simples em ataques de ponta não exige defesas laterais recuadas e sim avançadas para pancadas de meio.",
            "Se o central abandonou as pontas, as paralelas estão desprotegidas e as diagonais mais frouxas, exigindo que o líbero cubra a diagonal curta agressiva (espaço do meio solto).",
            "Porque os dedos traseiros apenas servem para o sacador do próprio time saber onde focar o saque.",
            "Porque o erro está em abandonar a ponta para fechar o meio, violando táticas fixas."
        ],
        correta: 1,
        explicacaoCorreta: "O sistema tático de vôlei é interdependente. O sinal dos bloqueadores nas costas é também um comando visual de realocação para as defesas traseiras. Se o central solta a ponta, a cobertura dessa fresta da marcação cruzada cai sobre o líbero e os extremos.",
        feedbackErro: "Ponto de atenção: Ler o sinal do dedo de bloqueio nas costas não é apenas para passadores; é fundamental para quem está no chão defender saber com quantos homens estarão as pontas e qual buraco cobrir."
    },
    {
        id: "voz-005",
        nivel: "voz_ativa",
        nivelNome: "Voz Ativa",
        tema: "Resgate Emocional após erro tático próprio",
        cenario: "Você errou a chamada de um levantamento e jogou a bola no bloqueio duplo perfeito deles, perdendo o rally do 23x23.",
        pergunta: "O que o maestro comunicador faz?",
        alternativas: [
            "Explica a lógica tática errada tentando provar que, no papel, deveria ter funcionado.",
            "Isola-se e deixa que os líderes do time tomem as rédeas comunicativas.",
            "Bate as mãos forte uma vez, aponta para o peito (mea-culpa evidente), diz rápido 'Falha de leitura minha. Ajusto na próxima bola, vamos para o passe.'",
            "Ignora o erro e elogia de forma falsa os outros jogadores para desviar a atenção."
        ],
        correta: 2,
        explicacaoCorreta: "Assume e arquiva. A liderança clara é blindada por autocrítica transparente e direcionamento para a única coisa sob controle: a ação da próxima jogada. Demorar nas justificativas espalha o veneno emocional.",
        feedbackErro: "Ponto de atenção: Autojustificação na quadra durante rally final suga a energia do time e gera irritação. Bater no próprio peito assume a responsabilidade e encerra a confusão num átimo de segundo."
    },
    {
        id: "voz-006",
        nivel: "voz_ativa",
        nivelNome: "Voz Ativa",
        tema: "Confirmação de ataque ('Bola de cheque')",
        cenario: "O saque foi mortal e a recepção voou desgovernada de graça e alta para o seu lado. Todos os atacantes se aproximam ofegantes.",
        pergunta: "Qual o erro na gestão dessa bola fácil?",
        alternativas: [
            "Organizar a recepção passando-a para o distribuidor (levantador) preparar um ataque seguro e letal no mano a mano.",
            "Ambos os centrais e ponteiros não se comunicarem, saltarem na avidez do ponto simultaneamente e trombarem deixando a bola cair mansa no chão ou na rede.",
            "Recuar para as zonas limpas de ataque e gritar alto pela coordenação da 'segunda bola'.",
            "Dar um simples toque limpo na quadra do oponente no ponto em que houver cobertura."
        ],
        correta: 1,
        explicacaoCorreta: "Bolas dadas de bandeja (cheque alta e mansa) geram ansiedade predatória e quebram as linhas de chamada, onde jogadores perdem a percepção espacial na ânsia de atacar e sofrem choque.",
        feedbackErro: "Ponto de atenção: O erro na bola de graça alta reside na falência comunicativa por excesso de vontade dos atacantes; todos calam as próprias vozes esperando matar o ponto solitariamente."
    },
    {
        id: "voz-007",
        nivel: "voz_ativa",
        nivelNome: "Voz Ativa",
        tema: "Sincronia do Grito no Levantamento (Ponteiro)",
        cenario: "A bola voou da recepção e está saindo suave e limpa na mão do levantador. Você é ponteiro.",
        pergunta: "Qual momento define a eficácia tática da sua voz na chamada do passe ('TEMPO!' ou 'ALTA!')?",
        alternativas: [
            "Quando a bola já abandonou as mãos do levantador e está em subida, para informar qual técnica você vai empregar.",
            "Silenciosamente durante toda a transição, pois o levantador e você combinaram a jogada antes e qualquer voz apenas o confundiria.",
            "O início e desenvolvimento da sua transição de passada de perna antes dele tocar na bola, guiando por som a disponibilidade da sua trajetória no tempo certo e localização.",
            "Logo após finalizar o salto, orientando como a bola deveria vir se não chegar como o planejado."
        ],
        correta: 2,
        explicacaoCorreta: "A voz cria uma bússola direcional temporal. O levantador aciona os movimentos biomecânicos finos escutando o volume e a posição do atacante nos momentos que precedem o toque na bola.",
        feedbackErro: "Ponto de atenção: Falar o que quer depois do passe subido não ajuda a coordenação motora e gera frustração. A audição localiza a disponibilidade exata onde sua passada está."
    },
    {
        id: "voz-008",
        nivel: "voz_ativa",
        nivelNome: "Voz Ativa",
        tema: "Aviso de 'Fora'",
        cenario: "Ataque cruzou rasante e, apesar de bater dentro (em cima da linha), pelo ângulo do seu passe ela parecia fora, e você gritou 'FORA!', causando o não-ataque do passador e o ponto.",
        pergunta: "O que o grupo precisa ajustar de imediato para alinhar o sistema sem penalizar a pró-atividade equivocada?",
        alternativas: [
            "Tirar a autoridade de chamadas 'fora/dentro' de quem está na periferia do bloqueio e focar apenas nas chamadas do técnico no banco.",
            "Obrigar que aquele que grita incorretamente seja sacado no próximo ponto, punindo o erro de percepção visual ativamente.",
            "Reunir rapidamente: 'Bateu linha. Erro de ângulo é do jogo. Continuem puxando a voz em bolas no limite, só não recuam a defesa em margem de erro. Firme na cobertura.'",
            "Mudar o protocolo para um silêncio restrito e não falar nenhuma avaliação instintiva nas defesas."
        ],
        correta: 2,
        explicacaoCorreta: "A voz instintiva tem imperfeições de perspectiva (paralaxe), mas cortar a pró-atividade vocal (calar o aviso de fora com punições ou críticas agressivas) esteriliza o ambiente. A falha é corrigida com reforço, realinhamento espacial e incentivo contínuo do uso da comunicação instintiva do grupo.",
        feedbackErro: "Ponto de atenção: Erro de ângulo (paralaxe) no grito 'Fora' não é burrice, é ilusão de ótica. Bater duro no companheiro castra sua comunicação nas bolas onde ele estava certo. Reforce a tomada de decisão em vez da penalidade do ponto de falha cega."
    },
    {
        id: "voz-009",
        nivel: "voz_ativa",
        nivelNome: "Voz Ativa",
        tema: "Mediação Pós Rally Intenso",
        cenario: "Quase quatro minutos de defesas plásticas em sequência de ataques que acabaram cravados pela equipe adversária que estravasou o comemoração. A sua equipe desaba de cansaço na quadra sem ar.",
        pergunta: "Como recompor a força e evitar a derrocada mental?",
        alternativas: [
            "Deixar todos quietos respirando por conta do cansaço e recomeçar o rodízio em estado de prostração.",
            "Tentar berrar furiosamente no rosto dos defensores culpando-os e gerando tensão de desespero e exigência agressiva por sangue nos olhos.",
            "Puxar todos os 6 no centro, olhar fixo para o time recuperando a respiração e soltar uma voz cadenciada de orgulho pelo que foram as defesas plásticas (foco positivo), lembrando da transição sem pânico, para virar a energia negativa do fim daquele ponto na adrenalina de voltar mais duro.",
            "Dizer aos reservas para pegarem água pois o set já se foi no emocional, focando a voz no futuro set e não no momento."
        ],
        correta: 2,
        explicacaoCorreta: "Gestão do suor é gestão de energia. Uma equipe extenuada e vencida de cansaço após um ponto precisa que alguém a reconecte com a exaltação da briga anterior (positivismo em derrotas honrosas) e injete firmeza no agora, virando a desolação em furor equilibrado da entrega total da sequência que vem.",
        feedbackErro: "Ponto de atenção: Rally gigante perdido puxa o pulmão e a moral. Silenciar cede espaço à prostração. O líder da quadra encurta o campo e reconecta os olhos: 'Vendemos caro, orgulho das coberturas. Traz as pernas, limpa suor, essa fúria virá na ponta!'"
    },
    {
        id: "voz-010",
        nivel: "voz_ativa",
        nivelNome: "Voz Ativa",
        tema: "Instabilidade do levantador principal",
        cenario: "O maestro da sua equipe está errando três bolas táticas em sequência (passe distante, falta de coordenação no tempo). O técnico adversário manda os sacadores forçarem nele toda vez que ele defende do rodízio.",
        pergunta: "Qual ação comunicativa da equipe blinda o distribuidor vacilante?",
        alternativas: [
            "Avisar de longe que se ele não consertar as mãos a equipe entrará em colapso completo tático.",
            "Assumir a aproximação nas zonas de conflito e dizer alto: 'Larga na primeira que eu seguro! Põe alto e alivia na precisão. Respira.'",
            "Mudar os gritos ofensivos táticos, pedindo jogadas complexas para testar o passador.",
            "Falar de costas ignorando-o durante toda a volta de aquecimento."
        ],
        correta: 1,
        explicacaoCorreta: "A blindagem de um pilar exposto requer comunicação assertiva que retira a pressão da excelência ('alivia na precisão, põe alto'). Isso corta o pânico dele ao receber os serviços forçados.",
        feedbackErro: "Ponto de atenção: Maestro fragilizado não levanta. A equipe retira a carga com a voz e assume mais responsabilidades de quadra, priorizando a segurança ('põe alto')."
    },
    {
        id: "voz-011",
        nivel: "voz_ativa",
        nivelNome: "Voz Ativa",
        tema: "Ajuste na paralela",
        cenario: "A linha defensiva direita está tomando ataques diretos na paralela. O bloqueador central e o ponteiro não estão fechando o corredor.",
        pergunta: "Como o defensor da linha direita (fundo) corrige isso sem desmotivar a rede?",
        alternativas: [
            "Espera o tempo técnico e pede para o treinador dar uma bronca no bloqueio.",
            "Grita durante a jogada: 'Vocês estão deixando o corredor escancarado, fecha isso!'",
            "Chama o bloqueador de ponta antes do saque e orienta: 'Gruda na antena e sela a paralela, deixa a diagonal longa comigo.'",
            "Fica em silêncio e tenta adivinhar o ataque pulando antes do tempo."
        ],
        correta: 2,
        explicacaoCorreta: "O defensor do fundo tem a visão total do buraco no bloqueio. Ele deve comandar o bloqueador a fechar a linha (antena) e assumir a responsabilidade da defesa no restante da quadra.",
        feedbackErro: "Ponto de atenção: Reclamar durante o rali ou esperar o treinador não resolve. A voz do fundo direciona o bloqueio para fechar o corredor cego (paralela)."
    },
    {
        id: "voz-012",
        nivel: "voz_ativa",
        nivelNome: "Voz Ativa",
        tema: "Recepção de saque viagem",
        cenario: "Fim de set empatado. O adversário vai sacar viagem muito forte. A sua linha de passe está em total silêncio e tensão.",
        pergunta: "Qual é a função da comunicação ativa antes do contato na bola?",
        alternativas: [
            "Nenhuma. O foco visual e o silêncio são absolutos para não distrair a percepção de velocidade.",
            "Um dos passadores deve gritar 'Abre a base e amortece!', ajudando a aliviar a tensão nervosa e relembrando o foco técnico coletivo.",
            "Gritar com o sacador adversário para tentar desconcentrá-lo.",
            "O líbero manda os outros passadores saírem para ele receber sozinho."
        ],
        correta: 1,
        explicacaoCorreta: "A voz afasta o congelamento causado pela ansiedade. Reafirmar comandos biomecânicos básicos em voz alta estabiliza a atenção da linha de passe perante a pressão do saque pesado.",
        feedbackErro: "Ponto de atenção: O silêncio total muitas vezes esconde o pânico individual. A comunicação assertiva quebra esse estado e conecta os passadores para a ação."
    },
    {
        id: "voz-013",
        nivel: "voz_ativa",
        nivelNome: "Voz Ativa",
        tema: "Levantamento quebrado",
        cenario: "A recepção explodiu e a bola está voando fora da quadra. O levantador corre desesperado de costas para a rede para tentar salvar.",
        pergunta: "Qual a melhor instrução do time para ele no momento do caos?",
        alternativas: [
            "Ficar em silêncio para ele conseguir pensar sozinho no que fazer.",
            "Gritar: 'Traz alto no meio da quadra!', oferecendo um alvo seguro para ele não errar a direção.",
            "Pedir bola rápida nas pontas para surpreender o adversário mesmo no aperto.",
            "Reclamar do passador que errou a recepção inicial."
        ],
        correta: 1,
        explicacaoCorreta: "No caos (bola quebrada fora da quadra), o time precisa dar uma referência simples (alto e no meio) para que o jogador apenas devolva a bola para o jogo, permitindo reorganizar.",
        feedbackErro: "Ponto de atenção: Exigir jogadas refinadas em bolas perdidas gera erro forçado. Oferecer a voz com a solução mais segura ('Traz alto!') salva o rali."
    },
    {
        id: "voz-014",
        nivel: "voz_ativa",
        nivelNome: "Voz Ativa",
        tema: "Provocação na rede",
        cenario: "O atacante adversário cravou uma bola forte, encarou a sua equipe e começou a provocar verbalmente.",
        pergunta: "Como o líder da quadra reage comunicando-se com o seu time?",
        alternativas: [
            "Responde à provocação no mesmo tom para mostrar que a equipe não abaixa a cabeça.",
            "Puxa os companheiros para o centro, vira de costas para o adversário e diz: 'Esquece ele, foca no bloqueio e ajuste da diagonal. Vamos marcar no jogo.'",
            "Reclama agressivamente com a arbitragem para aplicar um cartão.",
            "Abaixa a cabeça, aceita a pressão e pede desculpas ao bloqueio que falhou."
        ],
        correta: 1,
        explicacaoCorreta: "Trash-talk busca tirar a equipe do foco tático. O líder ignora a armadilha emocional, fecha o grupo e redireciona a energia para a execução técnica e tática do próximo ponto.",
        feedbackErro: "Ponto de atenção: Disputar ego na rede destrói a concentração tática. A melhor resposta à provocação é o isolamento mental coletivo focado em fazer o próximo ponto limpo."
    },
    {
        id: "voz-015",
        nivel: "voz_ativa",
        nivelNome: "Voz Ativa",
        tema: "Apoio após bloqueio (toco)",
        cenario: "Seu ponteiro foi bloqueado de forma limpa. A bola bate no bloqueio e volta rápida para o chão do seu lado da quadra.",
        pergunta: "Qual o papel vocal do fundo de quadra no momento exato em que a bola bate no bloqueio?",
        alternativas: [
            "Ficar calado porque a responsabilidade do apoio primário é dos jogadores da rede.",
            "Esperar a bola cair para incentivar o ponteiro: 'Na próxima passa!'",
            "Gritar alto 'COBRE!' ou 'APOIA!' no exato milissegundo do contato no bloqueio, ativando a reação rápida da equipe inteira.",
            "Reclamar do levantador que forçou a bola na marcação fechada."
        ],
        correta: 2,
        explicacaoCorreta: "A voz funciona como um alarme de reflexo. Gritar 'COBRE' no instante do bloqueio acelera o tempo de reação dos jogadores próximos, evitando que fiquem observando a bola cair.",
        feedbackErro: "Ponto de atenção: A paralisia ao ver o companheiro bloqueado é comum. O grito imediato do fundo quebra essa paralisia e engatilha o mergulho da cobertura para salvar a bola."
    },
    {
        id: "voz-016",
        nivel: "voz_ativa",
        nivelNome: "Voz Ativa",
        tema: "Recuperação após série de erros",
        cenario: "A equipe levou 4 pontos seguidos por falhas bobas (saque na rede, erro de passe). O clima está pesado e ninguém fala nada.",
        pergunta: "Como quebrar essa apatia coletiva no momento da reunião no centro da quadra?",
        alternativas: [
            "Apontar o erro individual de cada um para que não se repita.",
            "Cobrar vontade dizendo que se continuarem assim vão perder o set vergonhosamente.",
            "Bater palma forte, olhar nos olhos de todos e puxar o foco para uma única ação simples: 'Zera a cabeça! Respira e foca só na primeira recepção agora. Uma bola de cada vez.'",
            "Apenas ficar calado e esperar o jogo virar sozinho com a troca do sacador."
        ],
        correta: 2,
        explicacaoCorreta: "Aapatia e frustração bloqueiam a fluidez do jogo. O líder precisa intervir quebrando o clima pesado com foco estreito e positivo: focar unicamente na próxima bola simples, ignorando o placar ruim.",
        feedbackErro: "Ponto de atenção: Cobranças complexas ou excessivas no momento de baixa confiança pioram o quadro. A instrução deve ser acolhedora e minimalista: respirar e fazer a ação imediata mais simples."
    },
    // --- NOVAS QUESTÕES VISÃO DE JOGO (20) ---
    {
        id: "visao-018",
        nivel: "visao_jogo",
        nivelNome: "Visão de Jogo",
        tema: "Recepção de saque viagem longo",
        cenario: "O adversário saca viagem muito forte e a bola parece que vai no limite da linha de fundo. Você está na zona 6 e a bola vem na altura do seu ombro.",
        pergunta: "Como você decide se deve passar ou deixar a bola sair?",
        alternativas: [
            "Deixo passar sempre que bater no ombro, pois toda bola no ombro vai fora.",
            "Acompanho a trajetória desde o arremesso; se o sacador bateu por baixo da bola, eu recuo para passar, senão eu tiro o corpo.",
            "Faço o movimento de passe e decido no último segundo se fecho os braços, dependendo do grito do líbero.",
            "Vou para a bola de manchete sempre, porque é melhor não arriscar deixar cair dentro."
        ],
        correta: 1,
        explicacaoCorreta: "A leitura do saque começa na mão do sacador. Um contato mais embaixo na bola (sem top spin) tende a flutuar longo. Acompanhar a trajetória inicial dita a sua decisão antecipada de encurtar ou sair da bola.",
        feedbackErro: "Ponto de atenção: Decidir no último segundo ou tentar adivinhar a linha cega o passe. A leitura do giro e do impacto da mão do adversário no momento do contato é o que define o recuo ou a fuga."
    },
    {
        id: "visao-019",
        nivel: "visao_jogo",
        nivelNome: "Visão de Jogo",
        tema: "Ajuste em bola pingada no bloqueio duplo",
        cenario: "O ataque adversário está bem marcado pelo nosso bloqueio duplo no meio. O atacante arma o braço, mas diminui a velocidade da passada no último momento.",
        pergunta: "O que o defensor da zona 6 deve fazer?",
        alternativas: [
            "Recuar para pegar uma possível bola que exploda no bloqueio e vá longe.",
            "Deslocar um passo à frente, ajustando a base baixa para cobrir o pingo logo atrás do bloqueio.",
            "Gritar para o bloqueio abrir e deixar ele bater, garantindo a defesa fácil no fundo.",
            "Ir para a zona 1 ajudar a defender a paralela, caso ele gire o pulso."
        ],
        correta: 1,
        explicacaoCorreta: "A quebra do ritmo da passada do atacante e do braço armado sinaliza uma provável largada (pingo). O defensor central (zona 6) deve encurtar imediatamente o espaço atrás do paredão para pegar essa bola lenta.",
        feedbackErro: "Ponto de atenção: Ficar fixo no fundo da quadra quando o atacante tira a força significa morte certa. A defesa lê o corpo do oponente: se ele desacelera, você encurta."
    },
    {
        id: "visao-020",
        nivel: "visao_jogo",
        nivelNome: "Visão de Jogo",
        tema: "Transição defesa-ataque do ponteiro",
        cenario: "Você é ponteiro na zona 5. Fez uma defesa dura de um ataque em diagonal, a bola subiu alta no meio da quadra e o líbero vai levantar.",
        pergunta: "Qual é a sua primeira ação após a defesa?",
        alternativas: [
            "Ficar olhando o líbero executar o levantamento para saber onde a bola vai.",
            "Correr imediatamente para a rede, na zona 4, para saltar no tempo da bola.",
            "Recuperar o equilíbrio e recuar de frente para a bola, abrindo o leque para iniciar a passada de ataque de fora da quadra.",
            "Gritar para o central bater, pois você fez a defesa e está fora da jogada."
        ],
        correta: 2,
        explicacaoCorreta: "Após defender, o ponteiro deve abrir a quadra (recuar além da linha de três metros) para poder ver a bola e armar uma passada de ataque eficiente. Sem recuo não há força.",
        feedbackErro: "Ponto de atenção: Defender não exclui você da jogada. Contudo, correr direto para a rede anula seu tempo e passada. O segredo da transição é abrir o leque rapidamente."
    },
    {
        id: "visao-021",
        nivel: "visao_jogo",
        nivelNome: "Visão de Jogo",
        tema: "Conflito na zona de recepção (zona 5 e zona 6)",
        cenario: "Você está na zona 5. O saque é um flutuante tático que viaja exatamente entre você e o líbero na zona 6.",
        pergunta: "Qual é a regra tática básica de decisão na sobreposição?",
        alternativas: [
            "O líbero sempre pega a bola, independentemente da distância ou trajetória.",
            "Aquele que percebe primeiro se abaixa e deixa o parceiro bater manchete.",
            "Quem estiver na diagonal do sacador (linha de visão direta) grita 'Minha!' e entra, e o outro recua abrindo espaço.",
            "Ambos vão para a bola com a mão solta para um dos dois tocar."
        ],
        correta: 2,
        explicacaoCorreta: "A bola no meio (conflito) é resolvida pela visão de trajetória (quem enxerga de frente tem o melhor ângulo) associada à chamada rápida em voz alta ('Minha!'), organizando quem atua e quem sai.",
        feedbackErro: "Ponto de atenção: Hesitação no meio gera erro bobo. Esperar que o parceiro vá ou assumir que a bola é do líbero por obrigação trava a linha. A voz e o ângulo de frente decidem."
    },
    {
        id: "visao-022",
        nivel: "visao_jogo",
        nivelNome: "Visão de Jogo",
        tema: "Leitura de bloqueio simples na ponta",
        cenario: "O ataque adversário foi pelas pontas e seu time armou apenas um bloqueio simples com o ponteiro. Você está defendendo no meio-fundo (zona 6).",
        pergunta: "Onde você deve se posicionar ao ver o bloqueio simples?",
        alternativas: [
            "Atrás do bloqueador para pegar as bolas que baterem na mão dele e caírem no chão.",
            "Completamente fora do esconderijo do bloqueio, garantindo visão livre do braço do atacante na área da diagonal grossa.",
            "Na linha de 3 metros aguardando uma largada, pois o bloqueio simples não para ataque forte.",
            "No extremo da zona 1 cobrindo a paralela longa."
        ],
        correta: 1,
        explicacaoCorreta: "No vôlei, defensor que não enxerga a bola, não defende. Diante de bloqueio simples (que deixa grande ângulo aberto), o defensor de fundo se desloca para o espaço livre de visão do ataque, normalmente a diagonal longa.",
        feedbackErro: "Ponto de atenção: Ficar 'escondido' atrás do seu próprio bloqueador inativa sua defesa. Se o bloqueio não cobriu a diagonal, esse vácuo é a sua zona de vida ou morte."
    },
    {
        id: "visao-023",
        nivel: "visao_jogo",
        nivelNome: "Visão de Jogo",
        tema: "Ajuste na cobertura de ataque (central batendo)",
        cenario: "A recepção foi perfeita na mão. O seu central salta para a bola rápida (chute meio). Você é ponteiro na zona 4.",
        pergunta: "Qual o seu papel na jogada?",
        alternativas: [
            "Apenas recuar e me preparar para o próximo saque caso ele erre.",
            "Mergulhar sob o bloqueio na zona 3 (base) para realizar a cobertura primária baixa.",
            "Ficar parado, pois quem cobre bola de central é exclusivamente o levantador e o líbero.",
            "Recuar para a linha dos três metros, pronto para uma cobertura alta no caso de a bola voltar."
        ],
        correta: 1,
        explicacaoCorreta: "A cobertura de ataque é ativa. Quando o central ataca, os atacantes próximos (ponteiro na z4) convergem imediatamente para a base baixa (logo atrás do atacante), garantindo a proteção da bola que bate e volta reto.",
        feedbackErro: "Ponto de atenção: Ficar assistindo seu central atacar tira um homem da cobertura. O rebote curto exige que o jogador mais próximo (zona 4 ou 2) desça para salvar a volta do toco."
    },
    {
        id: "visao-024",
        nivel: "visao_jogo",
        nivelNome: "Visão de Jogo",
        tema: "Recepção de saque curto",
        cenario: "O sacador adversário já fez dois saques curtos na linha dos 3 metros. Você está na base de passe.",
        pergunta: "Como ajustar a base para evitar ser surpreendido de novo?",
        alternativas: [
            "Fico mais curvado, preparado para mergulhar de peixinho.",
            "Aviso o levantador para ele assumir os próximos passes curtos.",
            "Dou meio passo à frente na base inicial, transferindo levemente o peso para as pontas dos pés, pronto para explodir à frente.",
            "Recuo e deixo a zona curta exclusivamente para o líbero cobrir varrendo a quadra."
        ],
        correta: 2,
        explicacaoCorreta: "Antecipação posicional: se há padrão de saque curto, a linha de passe encurta levemente a base, adiantando o peso do corpo para facilitar a chegada rápida à bola baixa na frente.",
        feedbackErro: "Ponto de atenção: Recuar ou não ajustar o pé custa milissegundos preciosos no arranque frontal. Meio passo à frente garante que o passe seja feito na altura do umbigo, com controle."
    },
    {
        id: "visao-025",
        nivel: "visao_jogo",
        nivelNome: "Visão de Jogo",
        tema: "Posicionamento em bola de segurança",
        cenario: "O levantamento saiu longe da rede e quebrado para o oposto. A bola está fora da antena, forçando ele a bater uma bola alta de segurança.",
        pergunta: "O que a defesa deve fazer na quadra inteira?",
        alternativas: [
            "Avançar para a linha dos três metros porque uma bola de segurança geralmente é pingada.",
            "Abrir e recuar toda a linha de defesa, ajustando a base profunda para pegar bola longa, pois o ataque não tem bom ângulo para cravar.",
            "Concentrar todos os jogadores no bloqueio triplo para matar a bola quebrada.",
            "Ficar nas posições normais, ignorando o estado da bola."
        ],
        correta: 1,
        explicacaoCorreta: "Bolas altas e afastadas (segurança) dificultam cortes para baixo e ângulos agudos. O padrão de ataque é longo e espalhado. A defesa responde recuando as bases e abrindo o campo.",
        feedbackErro: "Ponto de atenção: Ficar adiantado em bola de segurança expõe as linhas de fundo. Bola ruim no ataque vira bola profunda. O recuo garante tempo para ler e encaixar a defesa."
    },
    {
        id: "visao-026",
        nivel: "visao_jogo",
        nivelNome: "Visão de Jogo",
        tema: "Defesa de central sem bloqueio",
        cenario: "Seu bloqueio caiu no engano da levantadora adversária. A central do outro lado ficou totalmente sem bloqueio para atacar na bola de primeiro tempo.",
        pergunta: "Como as defesas devem agir diante de um central solto na rede?",
        alternativas: [
            "Ficar exatamente na base para não quebrar o sistema defensivo.",
            "Recuar para a linha de fundo o máximo possível, esperando a força do ataque.",
            "As defesas das pontas e de fundo devem dar um ou dois passos rápidos em direção ao centro e abaixar a base, diminuindo a quadra para pegar a cravada forte.",
            "Gritar tentando distrair a atacante no ar."
        ],
        correta: 2,
        explicacaoCorreta: "Ataque sem bloqueio vira um tiro livre, geralmente com trajetória mais íngreme e centralizada (cravada forte). As defesas devem 'fechar a panela', aglomerando o centro com bases bem baixas para aguentar a pancada.",
        feedbackErro: "Ponto de atenção: Ficar longe ou aberto no ataque livre de central torna a defesa impossível (a bola cai no centro). Encurtar a quadra rapidamente e fechar o raio reduz o espaço de estrago."
    },
    {
        id: "visao-027",
        nivel: "visao_jogo",
        nivelNome: "Visão de Jogo",
        tema: "Cobertura de Bloqueio Duplo na Ponta",
        cenario: "O oposto adversário vai atacar. Seu time fecha um bloqueio duplo na zona 4. Você é o central que não participou do bloqueio, atuando na sobra.",
        pergunta: "Onde o central que sobra (não bloqueia) deve se posicionar?",
        alternativas: [
            "Fora da quadra esperando a bola passar para não atrapalhar a defesa de fundo.",
            "Ficar parado no meio da rede aguardando um possível erro do ataque.",
            "Recuar na diagonal curta, logo atrás do bloqueio duplo, para fechar pingo e bolas que batem no paredão e caem perto da rede.",
            "Ir para a linha de fundo dobrar a defesa do líbero."
        ],
        correta: 2,
        explicacaoCorreta: "O central que não salta na ponta transforma-se no 'líbero da frente', ajustando-se nas costas do próprio bloqueio para garantir a diagonal curtíssima e a cobertura primária da largada (pingo).",
        feedbackErro: "Ponto de atenção: Central não fica assistindo o rali. A sobra de rede é a proteção contra a deixadinha inteligente do atacante ou desvios curtos no bloqueio."
    },
    {
        id: "visao-028",
        nivel: "visao_jogo",
        nivelNome: "Visão de Jogo",
        tema: "Ajuste na Rotação 1",
        cenario: "Sua equipe está na Rotação 1 (levantador na zona 1 no saque). A equipe adversária saca forçado e seu central está posicionado para passar a bola de graça.",
        pergunta: "Como corrigir rapidamente essa lacuna tática antes do saque?",
        alternativas: [
            "Pedir tempo técnico para o treinador mudar a formação.",
            "Esconder o central empurrando-o próximo à rede, e trazer o ponteiro de fundo e o oposto para recompor a linha de três passadores sem cruzar as posições legais.",
            "O central passa mesmo assim, já que ele está na zona de fundo.",
            "Trazer o líbero para a frente da linha dos três metros."
        ],
        correta: 1,
        explicacaoCorreta: "Central na linha de trás que não foi trocado pelo líbero deve ser blindado. As posições laterais (ponteiro/oposto) puxam a linha de passe para trás e escondem o jogador, desde que respeitem a regra da lateralidade na rotação.",
        feedbackErro: "Ponto de atenção: Deixar o central receber saque forçado quebra o time. O sistema de vôlei permite empurrar peças para 'esconder' o passeiro fraco mantendo as posições relativas legais."
    },
    {
        id: "visao-029",
        nivel: "visao_jogo",
        nivelNome: "Visão de Jogo",
        tema: "Leitura de braço (diagonal longa)",
        cenario: "O ponteiro adversário tem a bola muito na frente do corpo, perdendo altura no salto. O bloqueio não vai chegar fechado.",
        pergunta: "Para onde você, como defensor da zona 5, deve direcionar o foco?",
        alternativas: [
            "Vou prever uma largada na zona 3, pois a bola está baixa.",
            "Desloco para a diagonal grossa e baixo a base, pois a tendência natural biomecânica de bola baixa e atrasada é rodar o ombro para a diagonal longa.",
            "Fecho a linha da paralela, pois é a única opção que sobra para ele.",
            "Fico ereto para estar pronto para cobrir a defesa longa."
        ],
        correta: 1,
        explicacaoCorreta: "Bola que passa da linha do ombro (baixa) restringe a flexão do punho, limitando cravadas agressivas. A fuga biomecânica mais comum é girar a bola longa e alta pela diagonal (sobre ou passando do bloqueio).",
        feedbackErro: "Ponto de atenção: Ler o corpo salva defesas. Bola que cai e atrasa no ar não tem paralela limpa nem cravada curta. O defensor ajusta passos abertos para a diagonal longa e estabiliza a base."
    },
    {
        id: "visao-030",
        nivel: "visao_jogo",
        nivelNome: "Visão de Jogo",
        tema: "Recuo para passe flutuante",
        cenario: "O adversário não vai sacar viagem. Ele para firme atrás da linha com a bola parada na mão (saque flutuante), mirando o espaço entre você e a linha de fundo.",
        pergunta: "Como posicionar a recepção antes de ele bater na bola?",
        alternativas: [
            "Mantenho a base fixa no centro e confio na minha mobilidade lateral.",
            "Fico na ponta dos pés pronto para correr para trás quando ele sacar.",
            "Adoto uma base de passe ligeiramente mais profunda, com peso equilibrado nas pernas para poder reagir de manchete ou de toque alto com firmeza.",
            "Agacho o máximo possível para abaixar o centro de gravidade e ver a bola vindo."
        ],
        correta: 2,
        explicacaoCorreta: "Saque flutuante longo morre rápido ou oscila no ar. Uma base ligeiramente recuada dá tempo de leitura. Passar de toque alto em saques no fundo muitas vezes é a escolha mais segura para evitar 'morte' no peito.",
        feedbackErro: "Ponto de atenção: Passador muito à frente para flutuante acaba passando com o queixo ou caindo para trás. A base um pé atrás estabiliza o centro para atacar a bola se vier curta ou aguentar firme se for longa."
    },
    {
        id: "visao-031",
        nivel: "visao_jogo",
        nivelNome: "Visão de Jogo",
        tema: "Bola dividida na rede (Cheque)",
        cenario: "A bola vinda do passe adversário sobrepõe o meio da fita (bola de cheque). O seu central e o levantador sobem na mesma bola.",
        pergunta: "Quem tem a prioridade na bola presa?",
        alternativas: [
            "O levantador, pois ele é o segundo toque da equipe.",
            "O central, pois ele tem o corpo e o braço melhor preparados e fortes para matar a bola de primeira, além de ter ângulo direto para cravada.",
            "Nenhum, eles devem deixar cair e recuperar com a defesa baixa.",
            "Aquele que for o capitão da equipe na quadra."
        ],
        correta: 1,
        explicacaoCorreta: "Bola na fita é duelo de força e altura. O central tem ataque direto, braço extenso e velocidade no primeiro tempo. O levantador deve abrir passagem e realizar a cobertura curta atrás.",
        feedbackErro: "Ponto de atenção: Levantador brigando por bola que mata ponto atrasa a jogada e arrisca choque feio. Se a bola passou da fita alta, ela é do matador (central ou ponteiro de frente)."
    },
    {
        id: "visao-032",
        nivel: "visao_jogo",
        nivelNome: "Visão de Jogo",
        tema: "Passe estourado na defesa longa",
        cenario: "Você defendeu uma patada violenta na zona 6, mas o passe estourou e está indo perigosamente para o fundo da quadra adversária.",
        pergunta: "O que você e a equipe fazem logo em seguida?",
        alternativas: [
            "Assistem para ver se ela vai cair dentro ou fora da quadra adversária.",
            "Grita pedindo desculpas pela defesa errada e sai da formação.",
            "O time grita 'VAI!' e pelo menos um atacante corre rápido acompanhando a linha da bola pronto para passar de manchete para trás antes que ela cruze a rede de fato.",
            "Deixa a responsabilidade para o líbero buscar do outro lado do campo."
        ],
        correta: 2,
        explicacaoCorreta: "Passe estourado (para fora ou além da rede) não é ponto perdido até a bola cair ou cruzar o plano vertical. A comunicação de emergência aciona a caça à bola pelo atleta mais veloz livre.",
        feedbackErro: "Ponto de atenção: Ficar assistindo a própria falha tira o foco tático de recuperação. Se a bola voa no limite, a equipe estica a corrida para salvar antes de invadir o campo oposto."
    },
    {
        id: "visao-033",
        nivel: "visao_jogo",
        nivelNome: "Visão de Jogo",
        tema: "Omissão no passe por excesso de respeito",
        cenario: "O saque vem no meio entre o líbero (que está passando mal no jogo) e o ponteiro. A bola está mais fácil para o ponteiro passar, mas é a 'área nominal' do líbero.",
        pergunta: "O que o ponteiro faz?",
        alternativas: [
            "Deixa o líbero assumir, afinal ele é o especialista em recepção.",
            "Fica parado e espera que o líbero chame a bola.",
            "Mete a voz firme 'MINHA!', ataca a bola na manchete com autoridade e domina o passe, retirando a pressão do líbero oscilante.",
            "Corre para trás e encobre a visão do líbero."
        ],
        correta: 2,
        explicacaoCorreta: "No vôlei de alto nível, o passe é vivo. Se a bola está na trajetória confortável do ponteiro e o líbero está tenso, a voz assume a liderança espacial. O excesso de respeito em bola de conflito gera o 'deixou'.",
        feedbackErro: "Ponto de atenção: Zonas de quadra não são muros de concreto. Se a bola de conflito favorece o seu ângulo de corpo, chame e passe. Respeitar zona excessivamente é aceitar ace bobo no meio."
    },
    {
        id: "visao-034",
        nivel: "visao_jogo",
        nivelNome: "Visão de Jogo",
        tema: "Defesa de oposto invertido (Canhoto na ponta direita)",
        cenario: "O oposto adversário é canhoto e está atacando da ponta direita dele (zona 2). Você defende na zona 5 (diagonal).",
        pergunta: "O que muda na sua visão de jogo na defesa?",
        alternativas: [
            "Nada, defendo do mesmo jeito que se ele fosse destro.",
            "O braço canhoto nessa saída favorece muito a paralela pesada. Eu encurto a base mais perto da linha lateral esquerda da minha quadra e preparo o corpo para uma pancada cortada e rápida.",
            "Vou para trás e aguardo bola pingada no meio.",
            "Deixo a linha e fico posicionado quase fora da quadra na zona 6."
        ],
        correta: 1,
        explicacaoCorreta: "A biomecânica do ataque canhoto na saída (zona 2) abre um excelente e potente corredor para o ataque paralelo, e uma diagonal ligeiramente forçada. A defesa da zona 5 precisa vedar melhor a linha e prever a velocidade cortada.",
        feedbackErro: "Ponto de atenção: Ler lateralidade muda seu jogo. Canhoto no lado direito tem paralela natural fortíssima. Se o defensor ignorar a mecânica cruzada, levará ataques no peito ou frestas de linha."
    },
    {
        id: "visao-035",
        nivel: "visao_jogo",
        nivelNome: "Visão de Jogo",
        tema: "Ajuste Pós-Defesa Longa do Líbero",
        cenario: "O seu líbero defendeu na linha de fundo (zona 6). A bola subiu perfeitamente para o centro da rede.",
        pergunta: "O que acontece com a organização do segundo toque?",
        alternativas: [
            "O líbero corre para fazer o segundo toque.",
            "A bola é deixada de graça para cair.",
            "O levantador principal se antecipa para assumir a bola, ou se estiver bloqueado posicionalmente, o central que não atacará (ou o líbero, se for levantamento com manchete) dita o tempo. Mas num sistema claro, o levantador deve pegar, e a rede grita organizando os tempos de ataque.",
            "Os ponteiros desistem do ataque pois o líbero defendeu."
        ],
        correta: 2,
        explicacaoCorreta: "Quando o líbero faz a defesa primária e a bola é boa de transição (bola C ou alta), o levantador retoma a sua função principal assumindo a bola no meio ou o central assume a segunda se o levantador for suprimido no fundo, mas a chamada do levantador é prioritária.",
        feedbackErro: "Ponto de atenção: Defesa do líbero significa que o levantador está livre. A organização de ataque flui naturalmente. A rede deve abrir o leque imediatamente e chamar."
    },
    {
        id: "visao-036",
        nivel: "visao_jogo",
        nivelNome: "Visão de Jogo",
        tema: "Visão de Sistema (Saque em buraco)",
        cenario: "O treinador aponta que a zona entre o ponteiro da zona 4 (que desceu para o passe) e o levantador na zona 1 no rodízio adiantado deles está mal protegida.",
        pergunta: "Como sacador tático, onde você mira o serviço?",
        alternativas: [
            "No líbero para garantir que a bola passe da rede com força.",
            "Forço totalmente na zona 6 distante e funda para tirar a força.",
            "No conflito exato nas costas do ponteiro de rede (curta) e à frente do corredor vazio, forçando a movimentação confusa do passeiro que recua.",
            "Saco longo de viagem sem mirar ponto exato."
        ],
        correta: 2,
        explicacaoCorreta: "Sacar tático é mirar nas frestas de deslocamento do rodízio. Uma bola flutuante atrás do ponteiro de rede que desce força ele a passar de costas ou força um passador cruzado a andar, quebrando as linhas ofensivas adversárias.",
        feedbackErro: "Ponto de atenção: Saque no líbero estabiliza o oponente. A visão de jogo do sacador encontra a fragilidade: o espaço onde dois jogadores se encaram e nenhum sabe quem é o dono natural."
    },
    {
        id: "visao-037",
        nivel: "visao_jogo",
        nivelNome: "Visão de Jogo",
        tema: "Entrada Falsa de Meio (Isolar o Bloqueio)",
        cenario: "Você é ponteiro. O seu central entra com muita força para uma jogada rápida no meio (chute primeiro tempo), chamando todo o bloqueio duplo deles para ele.",
        pergunta: "Qual é o seu comportamento corporal na aproximação do ataque na ponta?",
        alternativas: [
            "Faço a passada o mais lenta possível, pois a bola não será minha.",
            "Entro agressivamente, iniciando a passada em sincronia, com braço armado veloz. Mesmo sem a bola ir para o central, minha agressividade segura a ponta bloqueada, ou permite que eu receba o passe de tempo um contra um livre.",
            "Grito para o central parar, pois só eu vou receber na rede.",
            "Abandono a jogada para cobrir a defesa de fundo."
        ],
        correta: 1,
        explicacaoCorreta: "O ataque no vôlei é ilusão e força combinadas. Se o ponteiro não entra ameaçando, o bloqueador lateral adversário encurta para o meio e destrói o central. A ameaça dupla sincrônica e com intensidade puxa a marcação isolando o mano a mano.",
        feedbackErro: "Ponto de atenção: Passada preguiçosa denúncia quem não vai receber a bola. Para o 'enganar' (isolar as pontas) funcionar, todo atacante tem que pular como se fosse a bola do campeonato."
    },
    // --- NOVAS QUESTÕES PENSAMENTO DO LEVANTADOR (15) ---
    {
        id: "levantador-018",
        nivel: "pensamento_levantador",
        nivelNome: "Pensamento do Levantador",
        tema: "Distribuição contra central antecipador",
        cenario: "O central adversário está lendo muito bem o seu jogo e saltando junto com o seu central em quase todas as bolas de meio. O placar está 19 a 19.",
        pergunta: "Qual é a melhor decisão tática para usar a antecipação dele a favor do seu time?",
        alternativas: [
            "Continuar forçando bola no meio até ele errar o tempo de bloqueio.",
            "Usar o seu central como isca forte e acelerar a bola para as extremidades (chute na ponta ou saída), deixando o atacante no mano a mano.",
            "Levantar bolas bem altas (balões) para as pontas para dar tempo da defesa se arrumar.",
            "Passar a bola de graça para o outro lado e arrumar a defesa."
        ],
        correta: 1,
        explicacaoCorreta: "O bloqueador central que antecipa ou 'casa' com o central atacante abandona as pontas. A melhor tática é usar sua própria bola rápida no meio como chamariz e acelerar a distribuição para as laterais, criando bloqueio simples ou quebrado.",
        feedbackErro: "Ponto de atenção: Brigar de força contra um bloqueio bem postado é burrice tática. Se ele saltou no meio, a ponta está livre. A velocidade do passe lateral pune a antecipação."
    },
    {
        id: "levantador-019",
        nivel: "pensamento_levantador",
        nivelNome: "Pensamento do Levantador",
        tema: "Ajuste após passe quebrado (bola B ou C)",
        cenario: "A recepção foi ruim e a bola está fora da linha de três metros, quase na zona 6. Você corre para tentar levantar de toque ou manchete.",
        pergunta: "Qual é a prioridade na escolha do levantamento nessa situação?",
        alternativas: [
            "Tentar forçar uma bola rápida de meio do fundo da quadra.",
            "Levantar uma bola alta de segurança para as extremidades (ponta ou saída), dando tempo para o atacante se arrumar e ler o bloqueio.",
            "Tentar largar a bola de segunda mesmo estando longe da rede.",
            "Levantar para o líbero atacar do fundo."
        ],
        correta: 1,
        explicacaoCorreta: "Passe B ou C destrói as jogadas combinadas de velocidade. A prioridade é transformar o erro em uma bola alta e limpa para os atacantes de força (ponta ou oposto), transferindo a pressão para eles passarem o bloqueio.",
        feedbackErro: "Ponto de atenção: Tentar jogada rápida com bola fora da zona de conforto gera erros não forçados. Aceite o passe ruim e jogue a segurança máxima."
    },
    {
        id: "levantador-020",
        nivel: "pensamento_levantador",
        nivelNome: "Pensamento do Levantador",
        tema: "Uso do oposto no contra-ataque",
        cenario: "Você fez uma defesa fantástica na zona 1, levantando a bola no meio da quadra. O central assumiu o levantamento e seu oposto está pronto na zona 2.",
        pergunta: "O que o levantador (que defendeu) e o central devem comunicar?",
        alternativas: [
            "Nada, cada um sabe sua função instintivamente.",
            "O central grita para o levantador bater do fundo da quadra.",
            "O levantador grita 'Bola na saída!' ou 'Dá no oposto!' para guiar o central na escolha óbvia de manter o ataque forte pela direita.",
            "O central joga a bola direto para o outro lado."
        ],
        correta: 2,
        explicacaoCorreta: "O levantador, mesmo caído após defender, mantém a liderança vocal. Ao pedir a bola no oposto, ele facilita a decisão do central inexperiente em levantar e garante que a jogada de força seja usada.",
        feedbackErro: "Ponto de atenção: Central não é levantador. A voz do maestro, mesmo fora da jogada, orienta a mão do improviso e mantém a tática agressiva na ponta de segurança."
    },
    {
        id: "levantador-021",
        nivel: "pensamento_levantador",
        nivelNome: "Pensamento do Levantador",
        tema: "Explorando bloqueio baixo",
        cenario: "A equipe adversária fez uma substituição na zona 2, colocando um levantador muito baixo. Seu ponteiro de força está na zona 4, atacando bem.",
        pergunta: "Como ajustar a distribuição a longo prazo no set?",
        alternativas: [
            "Esconder o fato e jogar apenas com os centrais.",
            "Levantar sistematicamente bolas altas na ponta (zona 4) para explorar a fragilidade do bloqueio simples ou baixo adversário.",
            "Jogar apenas bolas no fundo (pipe) para confundir a defesa.",
            "Forçar todas as bolas no oposto para não cansar o ponteiro."
        ],
        correta: 1,
        explicacaoCorreta: "Vôlei é xadrez físico. Identificar uma fraqueza no bloqueio (altura ou lentidão) significa explorar aquele confronto direto exaustivamente. Bola alta e limpa para o ponteiro cravar no bloqueio baixo ou bater por cima.",
        feedbackErro: "Ponto de atenção: Inventar jogadas complexas quando existe uma fraqueza óbvia na rede é desperdício. Jogue o simples na fragilidade deles até que eles sejam obrigados a trocar."
    },
    {
        id: "levantador-022",
        nivel: "pensamento_levantador",
        nivelNome: "Pensamento do Levantador",
        tema: "Leitura de defesa recuada",
        cenario: "A recepção está na mão, mas você nota de soslaio que a defesa de fundo adversária está extremamente recuada (quase fora da quadra) esperando pancadas.",
        pergunta: "Qual é a sua melhor decisão ofensiva como levantador (estando na rede)?",
        alternativas: [
            "Levantar bem alto e forte para os pontas cravarem a qualquer custo.",
            "Esconder a intenção e executar uma largada de segunda (pingo) inteligente bem no centro da quadra adversária (zona 3).",
            "Dar um toque espalmado forte direto na defesa recuada.",
            "Levantar de costas no escuro para o oposto sem olhar o bloqueio."
        ],
        correta: 1,
        explicacaoCorreta: "Se a defesa abandona as intermediárias (zona 3 e coberturas baixas) para caçar pancada, a bola de segunda curta (pingo do levantador) é mortal e desestabiliza toda a estratégia defensiva.",
        feedbackErro: "Ponto de atenção: O levantador que também ataca (largadas e toques de segunda) pune defesas preguiçosas que andam para trás antes do tempo."
    },
    {
        id: "levantador-023",
        nivel: "pensamento_levantador",
        nivelNome: "Pensamento do Levantador",
        tema: "Acelerar jogo com passe perfeito",
        cenario: "Final de set, 24 a 24. A recepção veio perfeita na sua mão na rede (zona 3). O ponteiro adversário e o central estão muito focados no seu ponteiro de força.",
        pergunta: "Qual a melhor distribuição tática neste momento crítico?",
        alternativas: [
            "Entregar a bola alta para o ponteiro de força, pois é o atacante de confiança.",
            "Puxar uma bola de primeiro tempo rápida (chute meio ou tempo atrás) com o seu central para punir o bloqueio que está se abrindo e focado na ponta.",
            "Largar a bola de primeira sem olhar.",
            "Tentar levantar a bola de manchete para confundir."
        ],
        correta: 1,
        explicacaoCorreta: "No ponto decisivo, o bloqueio tende a ir para o atacante mais óbvio (segurança). Se o passe está perfeito, usar o meio no mano a mano surpreende e usa a quebra de marcação deles contra eles próprios.",
        feedbackErro: "Ponto de atenção: Levantar na obviedade no match point facilita o triplo bloqueio. Passe na mão com a rede aberta clama por bola de meio ou jogadas combinadas em velocidade."
    },
    {
        id: "levantador-024",
        nivel: "pensamento_levantador",
        nivelNome: "Pensamento do Levantador",
        tema: "Sinalização e combinação de jogada (Pipe)",
        cenario: "O saque deles tem sido fraco no líbero. Você sinaliza pelas costas para os centrais correrem uma china (finta lateral) e o ponteiro de trás atacar uma pipe (fundo meio).",
        pergunta: "Qual é o principal pré-requisito para o sucesso dessa combinação complexa?",
        alternativas: [
            "Que o ponteiro de trás salte o mais alto que puder sem se importar com a recepção.",
            "Que a recepção seja perfeita (passe A) para que o central consiga puxar o bloqueio na corrida rápida, liberando o corredor central para a pipe.",
            "Que o líbero levante a bola de manchete para enganar a rede.",
            "Que o levantador grite 'PIPE!' durante a jogada."
        ],
        correta: 1,
        explicacaoCorreta: "Jogadas combinadas e de fundo (pipe) dependem quase 100% de um passe na mão (zona de levantamento primária). Só assim a finta do central é crível e consegue fixar o bloqueio adversário, abrindo o meio.",
        feedbackErro: "Ponto de atenção: Combinar fintas de tempo com passe estourado não funciona porque o bloqueio adversário não precisará pular no central lento. O passe A é a ignição da Pipe livre."
    },
    {
        id: "levantador-025",
        nivel: "pensamento_levantador",
        nivelNome: "Pensamento do Levantador",
        tema: "Recuperação após erro consecutivo (Distribuição)",
        cenario: "Seu ponteiro titular de zona 4 já foi bloqueado ou errou os últimos 3 ataques. A confiança dele está visivelmente abalada.",
        pergunta: "Como gerenciar essa situação na próxima recepção?",
        alternativas: [
            "Forçar a bola nele na próxima vez para ele 'entrar no jogo', independentemente do passe.",
            "Distribuir o jogo entre o central e o oposto por alguns pontos, chamando a responsabilidade defensiva e aliviando a pressão imediata nas costas dele, até um passe fácil.",
            "Substituí-lo imediatamente sem falar nada.",
            "Levantar bem curto para ele só passar a bola."
        ],
        correta: 1,
        explicacaoCorreta: "O levantador gere o estado mental do time. Atacante em parafuso precisa de respiro. Transferir o ataque para as outras extremidades e meios 'esfria' a marcação nele e permite que ele recupere a concentração na defesa e no passe.",
        feedbackErro: "Ponto de atenção: Forçar jogo em quem está abalado leva ao erro consecutivo por ansiedade e bloqueios triplos. Distribua a pressão."
    },
    {
        id: "levantador-026",
        nivel: "pensamento_levantador",
        nivelNome: "Pensamento do Levantador",
        tema: "Leitura de rodízio (Levantador no fundo)",
        cenario: "Você (levantador) está nas zonas de trás (posições 1, 6 ou 5). O adversário sabe que você tem três atacantes potentes na frente (sistema 5x1).",
        pergunta: "Qual é o cuidado tático que o levantador de fundo deve ter na infiltração?",
        alternativas: [
            "Ficar fixo na rede esperando a bola e não defender fundo.",
            "Aguardar o saque ou o ataque do oponente cruzar a rede antes de iniciar o rápido deslocamento (infiltração) para não cometer falta de sobreposição e estar pronto na zona 3.",
            "Invadir a frente antes do saque para estar mais perto da rede.",
            "Tentar atacar a bola no primeiro toque do fundo."
        ],
        correta: 1,
        explicacaoCorreta: "A infiltração exige timing preciso. Antecipar demais causa falta de rodízio (sobreposição) e atrapalha a visão da defesa; atrasar perde o ponto de contato ideal. O arranque começa no exato contato do saque adversário.",
        feedbackErro: "Ponto de atenção: Correr antes do saque é falta grave e confunde a linha de recepção. O levantador do 5x1 precisa dominar o arranque explosivo pós-saque."
    },
    {
        id: "levantador-027",
        nivel: "pensamento_levantador",
        nivelNome: "Pensamento do Levantador",
        tema: "Adaptação a passe colado na rede",
        cenario: "A recepção foi forte demais e a bola está praticamente raspando a fita da rede, vindo direto para as suas mãos. O bloqueio duplo já está subindo na sua frente.",
        pergunta: "Qual o melhor recurso para evitar que a bola passe para o lado de lá de graça ou você seja bloqueado?",
        alternativas: [
            "Bater de manchete para o fundo da quadra.",
            "Executar um toque rápido deslizando os dedos lateralmente e paralelo à fita para a entrada ou saída, ou largar de manchete empurrando com as costas da mão (toque sujo válido para salvar).",
            "Tentar segurar a bola no ar e puxar.",
            "Virar de costas completamente e deixar a bola."
        ],
        correta: 1,
        explicacaoCorreta: "A bola quase colada não permite alavanca limpa. O toque em transição (varrida) joga a bola rápido na paralela antes da fita. O recurso salva o ponto evitando o contato dos bloqueadores adversários.",
        feedbackErro: "Ponto de atenção: Tentar o toque clássico perfeito com a bola na fita resulta em condução ou bloqueio direto. Recursos laterais e varridas de braço ou toque de um braço mantêm a bola viva no lado de cá."
    },
    {
        id: "levantador-028",
        nivel: "pensamento_levantador",
        nivelNome: "Pensamento do Levantador",
        tema: "Gestão do central lento",
        cenario: "Você percebe que o seu central titular está cansado e não está mais acompanhando o tempo rápido (chute e primeiro tempo) na subida com o passe.",
        pergunta: "Como o levantador adapta a jogada sem tirar o jogador de quadra?",
        alternativas: [
            "Continua levantando no mesmo tempo e culpa ele por chegar atrasado.",
            "Altera as chamadas para bolas de segundo tempo (chute mais alto ou meias) dando os milissegundos que o central precisa para entrar na bola com força e saltar inteiro.",
            "Desiste de atacar pelo meio até ele se recuperar.",
            "Exige substituição gritando para o técnico no meio do set."
        ],
        correta: 1,
        explicacaoCorreta: "Levantador se adapta à perna do atacante. Se o central perde a explosão, você atrasa meio tempo (bola B, mais alta no meio), dando-lhe a chance de ler o bloqueio e saltar com segurança de apoio.",
        feedbackErro: "Ponto de atenção: Ignorar o cansaço do companheiro gera bolas erradas e frustração. Modificar a altura e o tempo da bola central mantém a ameaça no meio sem depender de explosão máxima."
    },
    {
        id: "levantador-029",
        nivel: "pensamento_levantador",
        nivelNome: "Pensamento do Levantador",
        tema: "Bola de xeque para o atacante fominha",
        cenario: "O saque foi mortal e a recepção adversária retornou alta e fraca, caindo na sua área de levantamento. Seu central e ponteiro voam famintos na bola na fita, correndo o risco de se chocar e trombarem com você.",
        pergunta: "Qual é o comando imperativo do distribuidor nesse milissegundo de caos vantajoso?",
        alternativas: [
            "Pular junto com eles para tentar dar o toque de primeira.",
            "Gritar bem alto 'MINHA!' se tiver ângulo de ataque, ou 'DEIXA O (nome do central)!' impondo o domínio organizador e cortando a fominha excessiva que causa acidentes e erros bobos.",
            "Sair correndo e observar a colisão.",
            "Dar as costas para a jogada reclamando que não deixam ele levantar."
        ],
        correta: 1,
        explicacaoCorreta: "Bola de cheque desorganiza até time profissional por excesso de vontade. A voz mais autoritária tem que imperar para destinar a bola para apenas UM finalizador, evitando trompadas e bolas na rede.",
        feedbackErro: "Ponto de atenção: Silêncio na bola fácil mata o time no detalhe. O líder comanda: 'Sua!' e aponta, evitando a colisão de dois gigantes e organizando o ponto grátis."
    },
    {
        id: "levantador-030",
        nivel: "pensamento_levantador",
        nivelNome: "Pensamento do Levantador",
        tema: "Ajuste na diagonal forçada",
        cenario: "Você está levantando na ponta, mas o bloqueador poste deles é enorme e fecha quase toda a paralela do seu ponteiro. Ele está atacando e passando aperto.",
        pergunta: "Como o levantamento pode facilitar a vida do seu ponteiro nesse combate duro?",
        alternativas: [
            "Deixar a bola passar muito perto da rede e bem colada na fita para ele tentar um milagre.",
            "Levantar a bola com um pouco mais de margem (50-60cm de distância da rede) e mais alta, permitindo que ele tenha amplo ângulo para forçar a diagonal forte sem cair no abraço do poste.",
            "Forçar a bola na ponta mas bem baixa, acelerada ao extremo.",
            "Deixar de usar a entrada de rede inteiramente no jogo."
        ],
        correta: 1,
        explicacaoCorreta: "Contra paredão, a bola muito próxima à fita amarra o braço do atacante. Afastar a bola da rede dá ao ponteiro campo de visão e o ângulo necessário para varrer a diagonal grossa com violência.",
        feedbackErro: "Ponto de atenção: Levantador bom vê o bloqueio inimigo. Bolas coladas facilitam o bloqueador gigante. Bolas altas e ligeiramente afastadas dão ao seu ponta a quadra toda de opção cruzada."
    },
    {
        id: "levantador-031",
        nivel: "pensamento_levantador",
        nivelNome: "Pensamento do Levantador",
        tema: "Distribuição contra sistema com líbero antecipador",
        cenario: "O líbero adversário percebe que seu ponteiro está amassando e começa a cobrir toda a diagonal dele com antecipação brilhante, defendendo tudo.",
        pergunta: "Como quebrar essa leitura tática pelo meio da distribuição?",
        alternativas: [
            "Pedir para o ponteiro continuar forçando ali até quebrar o braço do líbero.",
            "Chamar jogadas de ataque com o oposto do outro lado da rede e bolas pelo fundo (pipe), forçando o líbero a abandonar a diagonal do ponteiro para cobrir o centro ou o corredor oposto.",
            "Ficar nervoso com o ponteiro por não conseguir fazer o ponto.",
            "Mudar os sacadores apenas."
        ],
        correta: 1,
        explicacaoCorreta: "Quando o fundo adversário casa com o ataque forte, a inversão de direção destrói a base deles. Ao atacar pelos flancos opostos e miolo, o líbero é forçado a voltar para a cobertura padrão, liberando o ponteiro novamente.",
        feedbackErro: "Ponto de atenção: Bater no muro forte da defesa desgasta seu melhor homem. Distribuir a bola estica o líbero. Vôlei é usar a quadra de forma larga e inteligente."
    },
    {
        id: "levantador-032",
        nivel: "pensamento_levantador",
        nivelNome: "Pensamento do Levantador",
        tema: "Pressão no Saque e a Confiança do Meio",
        cenario: "A equipe adversária errou dois saques seguidos tentando forçar. Eles vão bater o terceiro flutuante de segurança e o passe virá limpo, no meio do set (15-14).",
        pergunta: "Qual é a estratégia de choque ideal no primeiro ataque seguro?",
        alternativas: [
            "Uma bola de entrada tradicional, segurança total.",
            "Bola rápida de meio (tempo ou china) cravada com toda a força. Um ataque violento num saque frouxo de segurança destrói a moral defensiva de quem tentou 'apenas passar a bola' e desestabiliza toda a estrutura mental.",
            "Levantar de manchete longo sem velocidade.",
            "Largar a bola de primeira, economizando a energia."
        ],
        correta: 1,
        explicacaoCorreta: "No lado psicológico do jogo, punir um saque 'medroso' ou conservador com um ataque agressivo e rápido pelo meio crava um impacto mental gigante. O adversário sente que não pode aliviar o saque se não quiser tomar bomba no meio.",
        feedbackErro: "Ponto de atenção: Passe A (perfeito) em saque frouxo clama por potência e show. A bola pelo meio no primeiro tempo estabelece dominação e obriga o oponente a errar tentando forçar saques de novo."
    },
    // --- NOVAS QUESTÕES VOZ ATIVA (15) ---
    {
        id: "voz-017",
        nivel: "voz_ativa",
        nivelNome: "Voz Ativa",
        tema: "Quebra de confiança após sequência de aces",
        cenario: "Sua linha de recepção sofreu três aces seguidos. O passador titular está com a cabeça baixa e a equipe entrou em silêncio absoluto.",
        pergunta: "Qual é a intervenção imediata do capitão ou líder da quadra?",
        alternativas: [
            "Deixar ele em silêncio para ele recuperar a concentração sozinho.",
            "Pedir tempo e pedir para o treinador dar uma bronca no passador.",
            "Puxar todos para o meio, bater no peito do passador e orientar: 'Zera a cabeça! Ajuda na comunicação que eu cubro metade da sua linha. Vem para a rede limpo.'",
            "Ignorar o passador e pedir para o levantador forçar o saque."
        ],
        correta: 2,
        explicacaoCorreta: "A voz do líder quebra a espiral de pânico. Acolher assumindo parte da responsabilidade do espaço ('cubro metade da sua linha') e simplificando o problema ('zera a cabeça') reconecta o atleta ao jogo.",
        feedbackErro: "Ponto de atenção: O silêncio após aces consagra o sacador adversário. Deixar o passador sofrer sozinho afunda o time. O líder corta o mal com voz alta de apoio tático."
    },
    {
        id: "voz-018",
        nivel: "voz_ativa",
        nivelNome: "Voz Ativa",
        tema: "Dois atletas dividem a bola no centro",
        cenario: "O saque viaja no meio da quadra. O ponteiro e o líbero vão na mesma bola, trombam e a bola cai no chão. Ambos levantam visivelmente irritados um com o outro.",
        pergunta: "Como resolver o conflito posicional e emocional imediatamente?",
        alternativas: [
            "Esperar o fim do set para explicar a teoria das zonas de conflito.",
            "Deixar os dois discutirem para ver quem grita mais alto e assume a culpa.",
            "Entrar no meio, apartar o olhar de cobrança e definir: 'Sem olhar torto! Faltou voz! Líbero, a bola curta é sua; ponteiro, solta a voz no fundo! Próxima!'",
            "Criticar a postura dos dois e dizer que o erro foi infantil."
        ],
        correta: 2,
        explicacaoCorreta: "A resolução de conflitos na quadra deve ser técnica, rápida e sem julgamento pessoal. Definir quem pega o quê na próxima jogada apaga o erro passado e foca no acerto futuro.",
        feedbackErro: "Ponto de atenção: Trombada gera ego ferido. Discutir culpa perde o ponto e a química do time. A voz líder corta o drama e dita a regra prática: quem fala o quê na próxima."
    },
    {
        id: "voz-019",
        nivel: "voz_ativa",
        nivelNome: "Voz Ativa",
        tema: "Aviso de bloqueio flutuante (Oposto solto)",
        cenario: "O central adversário está escorregando todo o bloqueio para o lado do seu ponteiro, deixando o seu oposto completamente sem bloqueio na zona 2.",
        pergunta: "Como a defesa de trás informa essa vantagem crucial para o seu levantador?",
        alternativas: [
            "Grita bem alto no momento em que a bola está no ar: 'Oposto está sozinho! Levanta lá!'",
            "Avisa discretamente o levantador antes do saque: 'Atenção na leitura deles. Estão dobrando na entrada. A saída de rede está limpa, explora o corredor.'",
            "Espera o tempo técnico para mostrar a falha no quadro tático.",
            "O fundo não deve opinar na distribuição do levantador."
        ],
        correta: 1,
        explicacaoCorreta: "O fundo tem visão panorâmica. Informar a falha de bloqueio ao levantador *antes* da jogada permite que ele planeje a distribuição (jogar onde não tem parede) sem alardear a tática para o adversário.",
        feedbackErro: "Ponto de atenção: Gritar a tática no meio da jogada denuncia a intenção e o central adversário corrige a tempo. A comunicação tática de fundo é prévia, curta e objetiva."
    },
    {
        id: "voz-020",
        nivel: "voz_ativa",
        nivelNome: "Voz Ativa",
        tema: "Levantador nervoso em final de set",
        cenario: "Placar 23 a 23. O levantador está visivelmente tenso, hesitando na escolha das jogadas e olhando assustado para o treinador no banco.",
        pergunta: "Como o ponteiro de confiança age para estabilizá-lo?",
        alternativas: [
            "Pede para o técnico tirá-lo de quadra porque ele vai entregar o jogo.",
            "Corre até ele e exige bola rápida e complexa para provar que ele tem coragem.",
            "Olha nos olhos dele antes do saque e diz firme: 'Joga alto na ponta que eu resolvo. Relaxa a mão e confia no básico.'",
            "Fica em silêncio e apenas reza para a bola chegar boa."
        ],
        correta: 2,
        explicacaoCorreta: "O atacante líder puxa a responsabilidade no momento de tensão do distribuidor. Oferecer a bola de segurança ('alto na ponta') e a garantia ('eu resolvo') tira a paralisia do medo de errar do levantador.",
        feedbackErro: "Ponto de atenção: Levantador em pânico trava a mão. Exigir jogadas refinadas piora. O recado tem que ser: 'Joga no simples que nós garantimos a força'."
    },
    {
        id: "voz-021",
        nivel: "voz_ativa",
        nivelNome: "Voz Ativa",
        tema: "Ajuste na cobertura ineficiente",
        cenario: "O seu atacante de meio foi bloqueado duro duas vezes seguidas e a bola caiu no pé do próprio bloqueio, pois as coberturas estavam muito atrás da linha de três.",
        pergunta: "Como o próprio central bloqueado corrige a equipe?",
        alternativas: [
            "Ele briga com os defensores, dizendo que eles são preguiçosos e lentos.",
            "Ele pede desculpas e decide apenas passar a bola na próxima vez para não ser bloqueado de novo.",
            "Ele chama a equipe no centro e instrui: 'O bloqueio deles é pesado. Fechem a panela na base! Quero dois jogadores debaixo de mim quando eu saltar, o rebote é nosso!'",
            "Ele ignora e foca apenas em saltar mais alto na próxima tentativa."
        ],
        correta: 2,
        explicacaoCorreta: "O atacante lidera a correção da própria cobertura. Ele aponta o fato técnico (bloqueio pesado) e exige a postura correta da defesa (fechar a panela na base), transformando frustração em ajuste tático.",
        feedbackErro: "Ponto de atenção: Xingar a cobertura destrói a vontade de defender. Exigir posicionamento agressivo sob o ataque educa e compromete o time com o salvamento das bolas rebatidas."
    },
    {
        id: "voz-022",
        nivel: "voz_ativa",
        nivelNome: "Voz Ativa",
        tema: "Central bloqueador perdido",
        cenario: "O ataque adversário está jogando muito rápido e o seu central novato não está conseguindo chegar nas pontas para fechar o duplo, saltando sempre quebrado e atrasado.",
        pergunta: "Como o líbero, de trás da quadra, coordena a ajuda vocal?",
        alternativas: [
            "Ele pede para o técnico trocar o central imediatamente.",
            "O líbero grita após cada ponto cobrando o central que ele precisa ser mais rápido.",
            "O líbero orienta antes da jogada: 'Lê primeiro, salta depois. Eles estão usando o primeiro tempo falso. Não cai na finta, marca o passe e corre pro poste.'",
            "Ele abandona a defesa e tenta bloquear no lugar do central."
        ],
        correta: 2,
        explicacaoCorreta: "O fundo enxerga a armadilha do levantador inimigo. O líbero acalma o central inexperiente ensinando o gatilho da marcação: 'Lê o passe, ignora a finta curta e chega na ponta.'",
        feedbackErro: "Ponto de atenção: Cobrar velocidade de quem já está afobado só gera mais erros. O ajuste de leitura ('não cai na isca') resolve o problema temporal na raiz."
    },
    {
        id: "voz-023",
        nivel: "voz_ativa",
        nivelNome: "Voz Ativa",
        tema: "Grito de 'Fora' no saque",
        cenario: "O sacador adversário força um saque viagem no limite da linha de fundo. A trajetória parece duvidosa. Você e o líbero estão prestes a passar a bola.",
        pergunta: "Qual é o comportamento vocal correto sobre a decisão de deixar a bola passar?",
        alternativas: [
            "Quem estiver melhor posicionado para avaliar a bola grita alto e cedo 'FORA!', comandando os braços da equipe inteira a não tocarem na bola.",
            "Ficar calado, pois se gritar e a bola cair dentro, a culpa será sua.",
            "Ambos recuam e observam, esperando a bola pingar antes de falarem alguma coisa.",
            "Tocar na bola de leve e gritar 'Fora' ao mesmo tempo."
        ],
        correta: 0,
        explicacaoCorreta: "Bolas no limite geram reflexos involuntários de defesa. O grito assertivo 'FORA!' de quem tem a melhor visão de profundidade funciona como um freio motor que impede o colega de tocar na bola indevidamente.",
        feedbackErro: "Ponto de atenção: O medo de errar a linha cega o passe. A voz confiante e antecipada é a única forma de inibir o instinto de recepção em bolas que cruzam a linha de fundo."
    },
    {
        id: "voz-024",
        nivel: "voz_ativa",
        nivelNome: "Voz Ativa",
        tema: "Erros em sequência no ataque",
        cenario: "Você é ponteiro. Recebeu três bolas seguidas. Errou as três na rede tentando forçar o ponto contra o paredão. O time está tenso aguardando a sua reação.",
        pergunta: "Qual é a postura comunicativa que desarma a tensão?",
        alternativas: [
            "Reclamar ostensivamente que as bolas estão muito baixas e a culpa é do levantador.",
            "Socar o chão com raiva, mostrar frustração e afastar-se do grupo.",
            "Bater palmas curtas, levantar a mão assumindo, olhar para o levantador e dizer: 'O tempo foi meu. Manda a próxima com margem que eu viro pela diagonal longa. Desculpa o bloqueio.'",
            "Pedir para não receber mais bolas até o fim do set."
        ],
        correta: 2,
        explicacaoCorreta: "A frustração visível contamina o grupo e alimenta o adversário. Assumir a falha de forma direta, propor a solução tática ('diagonal longa') e pedir a bola de novo restabelece o fluxo de liderança positiva.",
        feedbackErro: "Ponto de atenção: Espalhar a culpa ou fazer drama apenas aumenta a pressão sobre os ombros de todos. Resiliência de quadra é engolir a falha, corrigir a mecânica em voz alta e buscar a próxima."
    },
    {
        id: "voz-025",
        nivel: "voz_ativa",
        nivelNome: "Voz Ativa",
        tema: "Ajuste na defesa de largada longa",
        cenario: "A equipe adversária está largando sistematicamente a bola bem no miolo da quadra (zona 3), caindo de forma mansa atrás do bloqueio e no meio da defesa aberta.",
        pergunta: "Como o líbero comanda a reestruturação da cobertura do pingo profundo?",
        alternativas: [
            "Fica bravo com os centrais por não terem bloqueado as largadas.",
            "Grita para a linha de trás inteira correr para frente assim que o atacante pular.",
            "Chama o ponteiro da zona 6 (meio fundo) e alinha: 'O centro é deles. Trava a base um passo à frente. Eu varro as diagonais curtas, você garante o meio solto!'",
            "Ele mesmo corre igual um louco varrendo toda a área sozinho."
        ],
        correta: 2,
        explicacaoCorreta: "Largada de miolo ataca as falhas de base longa. O líbero coordena o adiantamento do eixo central (zona 6) e redefine a varredura das diagonais para eliminar o vazio nas costas da rede.",
        feedbackErro: "Ponto de atenção: Correr desorganizado gera choque entre os defensores. A comunicação antecipada de zona de responsabilidade garante que o 'buraco negro' do meio seja coberto por quem tem o melhor arranque."
    },
    {
        id: "voz-026",
        nivel: "voz_ativa",
        nivelNome: "Voz Ativa",
        tema: "Silêncio tático",
        cenario: "Você é central. Está lendo perfeitamente o levantador adversário e sabe exatamente que ele vai jogar uma bola rápida nas costas dele, mas ele não sabe que você sabe.",
        pergunta: "Quando a comunicação falada deve ser substituída pelo silêncio intencional e gestos?",
        alternativas: [
            "Sempre, o vôlei é melhor jogado completamente em silêncio.",
            "Quando a leitura tática antecipada é perfeita e gritar o ajuste revelaria ao levantador adversário a sua intenção de bloqueio dobrado antes dele soltar a bola.",
            "Nunca, o time inteiro tem que gritar a todo momento para assustar os oponentes.",
            "Quando o técnico ordenar que ninguém fale para punir um erro."
        ],
        correta: 1,
        explicacaoCorreta: "A leitura furtiva é um trunfo. Gritar que você percebeu a isca fará o oponente mudar a jogada na hora de soltar a bola. Sinalizar com a mão para a defesa cobrir a paralela nas costas ou piscar para o ponteiro é a voz oculta eficiente.",
        feedbackErro: "Ponto de atenção: O grito revela o bote. Se você tem a vantagem da leitura corporal furtiva do levantador inimigo, guarde a informação em sinais para armar a armadilha sem alertar a presa."
    },
    {
        id: "voz-027",
        nivel: "voz_ativa",
        nivelNome: "Voz Ativa",
        tema: "Manutenção de ritmo após rali exaustivo vencido",
        cenario: "Sua equipe acabou de ganhar um rali de três minutos, com mergulhos e defesas impossíveis. O adversário também está morto no chão. Vocês ganharam o ponto, mas estão sem fôlego.",
        pergunta: "Qual é a condução da equipe na comemoração para não perder energia no próximo ponto?",
        alternativas: [
            "Fazer uma comemoração exagerada, correndo pela quadra e provocando os adversários.",
            "Comemorar forte num núcleo rápido, bater as mãos firmes, respirar fundo de olho fechado e puxar a voz: 'A quadra é nossa! Mas desce o foco pro saque simples, cadência no braço!'",
            "Ficar completamente em silêncio e ir devagar para a base de recepção.",
            "Pedir desculpas para os adversários pelas defesas absurdas."
        ],
        correta: 1,
        explicacaoCorreta: "Vitória em rali longo suga a perna e leva o cérebro à exaustão e relaxamento. A liderança comemora com firmeza (ancorando o ganho de moral) mas corta a euforia excessiva imediatamente com foco respiratório para o próximo movimento simples.",
        feedbackErro: "Ponto de atenção: Rali longo cria 'ressaca' no ponto seguinte se a equipe explodir muito ou murchar. O ajuste de frequência garante que a emoção vire força, e não falta de ar."
    },
    {
        id: "voz-028",
        nivel: "voz_ativa",
        nivelNome: "Voz Ativa",
        tema: "Cobrança sem ofensa em excesso de erros",
        cenario: "O seu time errou os últimos cinco saques no set de forma amadora, jogando bolas direto na fita ou metros para fora. A equipe está com medo de sacar.",
        pergunta: "Como o capitão orienta a quebra desse padrão negativo na roda técnica?",
        alternativas: [
            "Ameaça que quem errar o próximo saque vai para o banco e vai pagar multa no treino.",
            "Alivia completamente dizendo: 'Não tem problema, continua soltando o braço no máximo que uma hora entra.'",
            "Puxa a linha da responsabilidade técnica: 'Tira a força e foca no ângulo! Tira 20% do braço e bota a bola em cima do líbero deles. Ponto limpo agora, faz o jogo rodar.'",
            "Ele pede para todo mundo dar apenas saque por baixo até o fim."
        ],
        correta: 2,
        explicacaoCorreta: "Quando o erro forçado vira pandemia (medo de sacar), o capitão propõe uma solução técnica escalonável: reduzir a potência e focar no ponto cego tático (colocar no alvo). Isso alivia a pressão do 'ace' sem abdicar de atacar.",
        feedbackErro: "Ponto de atenção: Mandar continuar errando não resolve e punir severamente congela os braços de medo. Reduzir a potência e pedir tática foca a mente em alvo, não em risco."
    },
    {
        id: "voz-029",
        nivel: "voz_ativa",
        nivelNome: "Voz Ativa",
        tema: "Aviso de toque no bloqueio (Touch)",
        cenario: "O ataque do adversário raspou de raspão nos dedos mínimos do seu central, que caiu sabendo do toque. O líbero lá no fundo não viu o desvio, pois a bola foi forte e alta para o fundo da quadra.",
        pergunta: "O que o central faz instantaneamente?",
        alternativas: [
            "Esconde a mão e fica quieto fingindo que não bateu nele para o árbitro dar fora.",
            "Espera a bola cair e vê se a equipe consegue defender.",
            "Grita alto 'TOCOU!' ou 'NA MÃO!' enquanto ainda está caindo, ativando as defesas traseiras para buscarem a bola longe independentemente da linha de fora.",
            "Levanta o braço para confessar ao árbitro."
        ],
        correta: 2,
        explicacaoCorreta: "No vôlei rápido, defensores deixam a bola sair se não detectam desvio no bloqueio. O grito 'Tocou' de quem sentiu o raspão cancela o instinto de 'deixar sair' da linha de fundo e transforma a bola perdida numa bola jogável.",
        feedbackErro: "Ponto de atenção: Tentar enganar o árbitro custa o ponto se o juiz viu o toque. A prioridade técnica é salvar a bola do chão avisando a defesa que o traçado foi alterado pela fita humana."
    },
    {
        id: "voz-030",
        nivel: "voz_ativa",
        nivelNome: "Voz Ativa",
        tema: "Ajustando o passe na fala mansa",
        cenario: "Seu líbero, o melhor defensor do time, está tendo um péssimo dia na recepção do flutuante. A técnica de pernas dele está dura por nervosismo e os ombros encolhidos.",
        pergunta: "Qual fala na orelha dele tem o melhor poder de destravamento?",
        alternativas: [
            "'Você é o líbero, acorda para o jogo, a equipe precisa do seu passe para virar as pontas.'",
            "'Abaixa mais e respira. Solta a tensão do ombro, a bola está morrendo no seu peito. Pega ela na frente, estou do seu lado para varrer as curtas.'",
            "'Quer que eu passe todas as bolas na sua área? Fica mais lá no fundo escondido.'",
            "'Reclama com o árbitro sobre o tempo do saque para você poder descansar.'"
        ],
        correta: 1,
        explicacaoCorreta: "A cobrança assertiva descreve o erro motor (tensão e contato no peito) e prescreve o antídoto biomecânico (ombro solto, pegar na frente), adicionando uma âncora de segurança ('varro as curtas') que tira a ansiedade total dele.",
        feedbackErro: "Ponto de atenção: Falar para alguém se acalmar cobrando título (Você é líbero) só joga gasolina na fogueira. O atleta no erro técnico precisa de ajustes mecânicos práticos contados com tom estabilizador."
    },
    {
        id: "voz-031",
        nivel: "voz_ativa",
        nivelNome: "Voz Ativa",
        tema: "A voz no erro inevitável (teto baixo ou iluminação ruim)",
        cenario: "A bola vinda do passe estourado subiu nas luzes ofuscantes do ginásio ou em um teto muito baixo que quebra a referência visual do ponteiro que deve consertar.",
        pergunta: "Como a comunicação do grupo salva essa jogada complexa visualmente?",
        alternativas: [
            "Ficam em silêncio esperando que os olhos dele se adaptem sozinhos ao reflexo luminoso.",
            "Começam a gritar para ele 'Pula!', 'Sai da bola!', 'Ataca!' tudo ao mesmo tempo causando caos sonoro na audição do atleta.",
            "Uma única voz guia (o levantador ou líbero) assume o comando direcional e grita compassado: 'Tá alta, alinha o corpo... espera... agora bate limpo alto!' servindo como radar de profundidade sonoro.",
            "Jogam a responsabilidade de erro nas luzes do ginásio e entregam."
        ],
        correta: 2,
        explicacaoCorreta: "Quando a visão periférica de um atleta é comprometida por obstáculos (luz ofuscante ou teto próximo), a orientação acústica limpa de um companheiro fora da ofuscação (um guia solitário) atua como sonar para alinhar a passada e o toque dele no cego.",
        feedbackErro: "Ponto de atenção: O excesso de vozes num momento onde os olhos falham gera paralisação. Uma voz só calibra a referência espacial (tempo de salto) e o braço conserta na base da confiança rítmica."
    }
];
