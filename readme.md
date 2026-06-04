# DVC Vôlei Escolar App

O **DVC App** é uma aplicação web progressiva (PWA) desenvolvida para a gestão completa de equipes e projetos de voleibol. Ele integra a gestão administrativa, técnica, financeira e comunicacional em uma única plataforma, focando no desenvolvimento individual do atleta e no fortalecimento do vínculo da equipe.

## Características Principais

- **Gestão de Atletas e Membros:** Cadastro completo, acompanhamento de presença, histórico financeiro.
- **Mural de Avisos:** Comunicação em tempo real para a equipe e responsáveis.
- **Agenda de Treinos e Jogos:** Calendário interativo para escalação, convocação e presenças.
- **Sistema de Avaliações (Auto, Pares e Equipe Técnica):** Módulos que gerenciam avaliações periódicas para acompanhar o desenvolvimento técnico e tático.
- **Ranking e Gamificação:** Sistema de pontuação focado no engajamento, evolução e compromisso com o projeto.
- **Gestão Financeira:** Controle de contribuições, isenções, envio de comprovantes e justificativas.

## Estrutura do Projeto

Para seguir as melhores práticas da indústria, a estrutura da aplicação foi reorganizada da seguinte forma:

```
/
├── index.html            # Ponto de entrada da aplicação
├── assets/               # Recursos estáticos
│   ├── css/              # Arquivos de estilo (Tailwind CSS)
│   ├── js/               # Scripts e módulos JS
│   ├── img/              # Imagens e ícones otimizados (WebP)
│   └── video/            # Vídeos da aplicação (MP4)
└── README.md             # Documentação
```

## Otimizações

- **Imagens:** Todas as imagens foram comprimidas e convertidas para o formato `.webp`, reduzindo significativamente o tempo de carregamento no navegador.
- **Vídeos:** Os vídeos foram convertidos de `.mov` para `.mp4` usando a compressão padrão (H.264) para garantir ampla compatibilidade.
- **Tailwind CSS:** A versão de produção utiliza uma compilação local do Tailwind CSS, eliminando a dependência do CDN e melhorando a velocidade e confiabilidade da aplicação em produção.
- **Documentação do Código:** Adicionados cabeçalhos em formato JSDoc detalhando as responsabilidades e contextos de cada módulo no diretório `assets/js`.

## Desenvolvimento (Live Server)

Para desenvolver ou visualizar o projeto localmente:

1. Abra a pasta raiz do projeto (`DVC`) no **VS Code**.
2. Certifique-se de que possui a extensão **Live Server** instalada.
3. Clique com o botão direito sobre o arquivo `index.html` e selecione **"Open with Live Server"**.
4. O navegador padrão se abrirá na porta `:5500`.

### Modificando o CSS (Tailwind)
Se for fazer alterações nos arquivos HTML/JS que exigem novas classes do Tailwind CSS, você precisa recompilar o arquivo final:

```bash
npx tailwindcss -i ./assets/css/input.css -o ./assets/css/output.css --watch
```
Isso iniciará o Tailwind em modo de observação (watch), recompilando automaticamente a cada salvamento.

## Repositório
O código-fonte e o versionamento podem ser encontrados no [GitHub (Privado)](https://github.com/gabrielbarbosa-physics/DVC_volei_escolar).
