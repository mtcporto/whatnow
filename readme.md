# Sistema de Alertas e Gestão de Catástrofes

## Descrição

Este projeto consiste em uma aplicação web para monitoramento e visualização de alertas de emergência e informações sobre gestão de catástrofes. A aplicação consome dados da API da Red Cross PrepareCenter para fornecer alertas em tempo real sobre desastres naturais e orientações sobre como proceder durante eventos como terremotos, furacões e outras emergências.

O sistema é dividido em duas seções principais:
1. **Alertas**: Exibe alertas ativos de emergências e desastres naturais no Brasil
2. **Gestão de Catástrofes**: Apresenta informações detalhadas sobre diferentes tipos de catástrofes, com recomendações em várias fases (mitigação, previsão sazonal, alerta, vigilância, resposta imediata e recuperação)

## Tecnologias Utilizadas

- **HTML5**: Estruturação da página web
- **CSS3**: Estilização e layout responsivo
- **JavaScript (ES6+)**: Processamento de dados e interatividade
- **Bootstrap 4.5.2**: Framework CSS para design responsivo e componentes pré-estilizados
- **Fetch API**: Para requisições assíncronas à API da Red Cross
- **DOMParser**: Para processamento de respostas XML
- **jQuery**: Biblioteca JavaScript para simplificar a manipulação do DOM (versão slim)
- **Popper.js**: Biblioteca para gerenciamento de poppers (necessária para o Bootstrap)

## APIs Utilizadas

- **Red Cross PrepareCenter API**: API que fornece alertas e informações sobre catástrofes
  - Endpoint de alertas: `/org/{country_code}/alerts/rss`
  - Endpoint de gestão de catástrofes: `/org/{country_code}/whatnow?eventType={eventType}`

## Funcionalidades

- Visualização de alertas ativos em formato de cards
- Informações detalhadas sobre diferentes tipos de desastres naturais
- Recomendações para diferentes fases de emergências (antes, durante e após)
- Visualização de status de conexão com as APIs
- Tratamento robusto de erros e diferentes formatos de resposta (JSON/XML)
- Interface responsiva para dispositivos móveis e desktop

## Requisitos

- Servidor web para hospedar a aplicação (Apache, Nginx, etc.)
- Chave de API válida da Red Cross PrepareCenter
- Navegador moderno com suporte a JavaScript ES6+

## Como Usar

1. Clone o repositório para seu servidor web
2. Configure sua chave de API no arquivo `index.html`
3. Acesse a aplicação pelo navegador

## Observações

A aplicação depende da disponibilidade e estrutura atual da API da Red Cross. Caso ocorram alterações na API, podem ser necessárias adaptações no código.

## Limitações Conhecidas

- Dependência de chave de API válida
- Necessidade de conexão à internet para receber dados atualizados
- Possíveis restrições de CORS ao acessar a API diretamente do navegador

## Licença

[Incluir informação de licença aqui]