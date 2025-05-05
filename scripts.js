document.addEventListener('DOMContentLoaded', function() {
    // Configuração de cache
    const CACHE_DURATION = 30 * 60 * 1000; // 30 minutos em milissegundos
    
    // URLs da API via worker
    const workerUrl = "https://whatnow.mosaicoworkers.workers.dev";
    const whatNowUrl = `${workerUrl}/whatnow?country=BRA&eventType=earthquake,hurricane,drought,chemical,extreme-heat,flood,hail,landslide,pandemic,tropical-cyclone,tsunami,wildfire`;
    const alertsUrl = `${workerUrl}/alerts?country=BRA`; // URL para alertas ativos
    
    // IMPORTANTE: Mover essas funções utilitárias para o topo antes de usá-las
    // Função para traduzir o tipo de evento
    function translateEventType(eventType) {
        const translations = {
            'Earthquake': 'Terremoto',
            'Hurricane': 'Furacão',
            'Drought': 'Seca',
            'Chemical': 'Perigo químico',
            'Extreme-Heat': 'Calor extremo',
            'Flood': 'Enchente',
            'Hail': 'Chuva de granizo',
            'Landslide': 'Deslizamento de terra',
            'Pandemic': 'Pandemia',
            'Tropical-Cyclone': 'Ciclone tropical',
            'Tsunami': 'Tsunami',
            'Wildfire': 'Incêndio florestal'
        };
        
        return translations[eventType] || eventType;
    }
    
    // Função para traduzir o nome das seções
    function translateSectionName(section) {
        const sectionNames = {
            'mitigation': 'MITIGAÇÃO',
            'seasonalForecast': 'PREVISÃO SAZONAL',
            'warning': 'ALERTA',
            'watch': 'VIGILÂNCIA',
            'immediate': 'AÇÃO IMEDIATA',
            'recover': 'RECUPERAÇÃO'
        };
        
        return sectionNames[section] || section;
    }
    
    // Função para obter o nome do ícone baseado no tipo de evento
    function getIconForEventType(eventType) {
        const eventTypeLower = eventType.toLowerCase();
        const iconMapping = {
            'earthquake': 'earthquake@3x.png',
            'hurricane': 'hurricane-alt@3x.png',
            'drought': 'drought@3x.png',
            'chemical': 'chemical-hazard@3x.png',
            'extreme-heat': 'heatwave@3x.png',
            'flood': 'flood@3x.png',
            'hail': 'storm-alt@3x.png',
            'landslide': 'landslide@3x.png',
            'pandemic': 'pandemic@3x.png',
            'tropical-cyclone': 'tropical-cyclone@3x.png',
            'tsunami': 'tsunami@3x.png',
            'wildfire': 'extreme-fire@3x.png'
        };
        
        return `icons/${iconMapping[eventTypeLower] || 'earthquake@3x.png'}`;
    }
    
    // Função para sanitizar HTML (segurança)
    function sanitizeHTML(text) {
        if (!text) return '';
        const element = document.createElement('div');
        element.textContent = text;
        return element.innerHTML;
    }

    // Configuração do botão de tema (modo claro como padrão)
    setupThemeToggle();
    
    // Configurar notificações
    setupNotifications();
    
    // Configurar filtro de região
    setupRegionFilter();
    
    // Inicializar
    fetchAlerts();
    fetchWhatNow();
    
    // Configurar eventos de tab - CORREÇÃO aqui para navegação entre abas
    document.querySelectorAll('#content-tabs .nav-link').forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remover classes ativas das abas e painéis
            document.querySelectorAll('#content-tabs .nav-link').forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });
            
            document.querySelectorAll('.tab-pane').forEach(p => {
                p.classList.remove('show', 'active');
            });
            
            // Ativar a aba clicada
            this.classList.add('active');
            this.setAttribute('aria-selected', 'true');
            
            // Ativar o conteúdo da aba
            const tabId = this.getAttribute('href');
            const tabContent = document.querySelector(tabId);
            if (tabContent) {
                tabContent.classList.add('show', 'active');
            }
        });
    });
    
    // Função para mostrar toast
    function showToast(message, duration = 3000) {
        const toastContainer = document.querySelector('.toast-container');
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        
        toastContainer.appendChild(toast);
        
        // Forçar reflow para iniciar a transição corretamente
        toast.offsetHeight;
        
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toastContainer.removeChild(toast);
            }, 300); // tempo da transição
        }, duration);
    }
    
    // Função para configurar filtro de região
    function setupRegionFilter() {
        const regionButtons = document.querySelectorAll('.region-button');
        
        regionButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Remover classe ativa de todos os botões
                regionButtons.forEach(btn => btn.classList.remove('active'));
                
                // Adicionar classe ativa ao botão clicado
                this.classList.add('active');
                
                const selectedRegion = this.dataset.region;
                filterContentByRegion(selectedRegion);
            });
        });
    }
    
    // Função para filtrar conteúdo por região
    function filterContentByRegion(region) {
        const activeTab = document.querySelector('#content-tabs .nav-link.active').getAttribute('href').substring(1);
        
        if (activeTab === 'alerts') {
            // Filtrar alertas por região
            const alertCards = document.querySelectorAll('#active-alerts-container .alert-card');
            
            alertCards.forEach(card => {
                if (region === 'all' || card.dataset.region === region) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        } else {
            // Filtrar whatnow por região
            const whatnowCards = document.querySelectorAll('#whatnow .card');
            
            whatnowCards.forEach(card => {
                if (region === 'all' || card.dataset.region === region) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        }
    }
    
    // Função para configurar notificações
    function setupNotifications() {
        // Verificar se o navegador suporta notificações
        if ('Notification' in window) {
            // Verificar se o usuário já deu permissão
            if (Notification.permission === 'granted') {
                // As notificações já estão permitidas
                console.log('Notificações já estão habilitadas');
            } else if (Notification.permission !== 'denied') {
                // Mostrar banner para solicitar permissão
                document.getElementById('notifications-banner').style.display = 'flex';
                
                // Adicionar evento ao botão de habilitar notificações
                document.getElementById('enable-notifications').addEventListener('click', function() {
                    requestNotificationPermission();
                });
            }
        }
    }
    
    // Função para solicitar permissão de notificação
    function requestNotificationPermission() {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                console.log('Permissão concedida para notificações');
                // Esconder o banner
                document.getElementById('notifications-banner').style.display = 'none';
                
                // Enviar uma notificação de boas-vindas
                sendNotification(
                    'Notificações ativadas!',
                    'Você receberá alertas importantes sobre eventos climáticos e emergências.'
                );
                
                // Registrar para receber notificações de novos alertas (simulado)
                subscribeToAlerts();
            }
        });
    }
    
    // Função para enviar uma notificação
    function sendNotification(title, body, icon = null) {
        if (Notification.permission === 'granted') {
            const options = {
                body: body,
                icon: icon || 'icons/alert@3x.png'
            };
            
            const notification = new Notification(title, options);
            
            notification.onclick = function() {
                window.focus();
                this.close();
            };
        }
    }
    
    // Função para simular inscrição em alertas
    function subscribeToAlerts() {
        console.log('Inscrito para receber alertas em tempo real');
        
        // Simular a chegada de um novo alerta após alguns segundos
        setTimeout(() => {
            showNewAlertsBadge();
        }, 30000);
    }
    
    // Função para mostrar badge de novos alertas
    function showNewAlertsBadge() {
        const badge = document.getElementById('active-alerts-badge');
        badge.style.display = 'inline-block';
        
        if (Notification.permission === 'granted') {
            sendNotification(
                'Novo alerta disponível',
                'Um novo alerta foi emitido para sua região. Consulte os detalhes.'
            );
        }
    }
    
    // Função para alternar entre tema claro e escuro
    function setupThemeToggle() {
        const themeToggle = document.getElementById('theme-toggle');
        const savedTheme = localStorage.getItem('theme');
        
        // Aplicar tema salvo se existir e for dark
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
            themeToggle.setAttribute('aria-label', 'Alternar para modo claro');
        } else {
            // Garantir que o modo claro seja o padrão
            localStorage.setItem('theme', 'light');
        }
        
        // Configurar o evento de clique
        themeToggle.addEventListener('click', function() {
            document.body.classList.toggle('dark-mode');
            const isDarkMode = document.body.classList.contains('dark-mode');
            
            // Atualizar o ícone do botão
            this.innerHTML = isDarkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
            
            // Atualizar aria-label
            this.setAttribute('aria-label', isDarkMode ? 'Alternar para modo claro' : 'Alternar para modo escuro');
            
            // Salvar a preferência no localStorage
            localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
        });
    }
    
    // Função para exibir o loader
    function showLoader(containerId) {
        const container = document.getElementById(containerId);
        container.innerHTML = `
            <div class="loading-container" role="status" aria-live="polite">
                <div class="loading-spinner"></div>
                <p class="loading-text">Carregando informações...</p>
            </div>`;
    }
    
    // Função para exibir mensagem quando não há dados disponíveis
    function showNoDataMessage(containerId, message) {
        const container = document.getElementById(containerId);
        container.innerHTML = `
            <div class="alert alert-warning" role="alert">
                <div class="d-flex align-items-center">
                    <i class="fas fa-exclamation-triangle mr-3" style="font-size: 24px;" aria-hidden="true"></i>
                    <div>
                        <h4 class="alert-heading">Nenhuma informação disponível</h4>
                        <p class="mb-0">${sanitizeHTML(message)}</p>
                    </div>
                </div>
            </div>`;
    }
    
    // Função para copiar texto para a área de transferência
    function copyToClipboard(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text)
                .then(() => {
                    showToast('Link copiado para a área de transferência!');
                })
                .catch(err => {
                    console.error('Erro ao copiar texto: ', err);
                    fallbackCopyToClipboard(text);
                });
        } else {
            fallbackCopyToClipboard(text);
        }
    }
    
    // Método alternativo para copiar texto (para navegadores que não suportam clipboard API)
    function fallbackCopyToClipboard(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                showToast('Link copiado para a área de transferência!');
            } else {
                showToast('Não foi possível copiar o link');
            }
        } catch (err) {
            console.error('Erro ao copiar texto: ', err);
            showToast('Falha ao copiar o link');
        }
        
        document.body.removeChild(textarea);
    }
    
    // Funções de cache
    function saveToCache(key, data, duration = CACHE_DURATION) {
        try {
            const cacheData = {
                timestamp: Date.now(),
                expiry: Date.now() + duration,
                data: data
            };
            localStorage.setItem(`whatnow_${key}`, JSON.stringify(cacheData));
        } catch (e) {
            console.warn('Erro ao salvar no cache:', e);
        }
    }
    
    function getFromCache(key) {
        try {
            const cachedData = localStorage.getItem(`whatnow_${key}`);
            if (!cachedData) return null;
            
            const parsedData = JSON.parse(cachedData);
            const now = Date.now();
            
            // Verificar se o cache expirou
            if (parsedData.expiry && now > parsedData.expiry) {
                localStorage.removeItem(`whatnow_${key}`);
                return null;
            }
            
            return parsedData.data;
        } catch (e) {
            console.warn('Erro ao acessar cache:', e);
            return null;
        }
    }
    
    // Função para formatar data
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    // Função para determinar região pela coordenada
    function getRegionForCoordinates(lat, lng) {
        // Simplificação para fins de demonstração
        const regions = ['norte', 'nordeste', 'centro-oeste', 'sudeste', 'sul'];
        return regions[Math.floor(Math.random() * regions.length)];
    }
    
    // Função para renderizar alertas
    function renderAlerts(alerts) {
        const container = document.getElementById('active-alerts-container');
        
        if (!alerts || !Array.isArray(alerts) || alerts.length === 0) {
            container.innerHTML = `
                <div class="alert alert-info" role="status">
                    <div class="d-flex align-items-center">
                        <i class="fas fa-info-circle mr-3" style="font-size: 24px;" aria-hidden="true"></i>
                        <div>
                            <h4 class="alert-heading">Nenhum alerta ativo no momento</h4>
                            <p class="mb-0">Não há alertas ativos para sua região. Confira a aba "O que fazer" para informações preventivas.</p>
                        </div>
                    </div>
                </div>`;
            return;
        }
        
        // Remover o indicador de novos alertas quando o usuário visualiza a tab
        document.getElementById('active-alerts-badge').style.display = 'none';
        
        const fragment = document.createDocumentFragment();
        
        alerts.forEach((alert, index) => {
            try {
                // Dados do alerta
                const alertType = alert.info?.event || 'Alerta Desconhecido';
                const region = getRegionForCoordinates(0, 0); // Simplificado para demo
                
                // Criar card
                const alertCard = document.createElement('div');
                alertCard.className = 'alert-card';
                alertCard.dataset.region = region;
                
                // Cabeçalho
                const header = document.createElement('div');
                header.className = 'alert-header';
                
                const iconSpan = document.createElement('span');
                iconSpan.className = 'alert-icon';
                iconSpan.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
                
                const headerTitle = document.createElement('span');
                headerTitle.textContent = sanitizeHTML(alertType);
                
                header.appendChild(iconSpan);
                header.appendChild(headerTitle);
                
                // Corpo
                const body = document.createElement('div');
                body.className = 'alert-body';
                
                const time = document.createElement('div');
                time.className = 'alert-time';
                time.textContent = `Emitido em ${formatDate(alert.sent || new Date())}`;
                
                const title = document.createElement('div');
                title.className = 'alert-title';
                title.textContent = sanitizeHTML(alert.info?.headline || 'Alerta de emergência');
                
                const description = document.createElement('div');
                description.className = 'alert-description';
                description.textContent = sanitizeHTML(alert.info?.description || 'Nenhuma descrição disponível.');
                
                const location = document.createElement('div');
                location.className = 'alert-location';
                location.textContent = `Localização: ${sanitizeHTML(alert.info?.area?.area_desc || 'Área não especificada')}`;
                
                body.appendChild(time);
                body.appendChild(title);
                body.appendChild(description);
                body.appendChild(location);
                
                // Botões de compartilhamento - SIMPLIFICADO
                const shareButtons = document.createElement('div');
                shareButtons.className = 'share-buttons';
                
                const whatsappBtn = document.createElement('button');
                whatsappBtn.className = 'share-button share-whatsapp';
                whatsappBtn.innerHTML = '<i class="fab fa-whatsapp"></i> WhatsApp';
                whatsappBtn.addEventListener('click', function() {
                    const text = `${alertType}: ${alert.info?.headline}\n${alert.info?.description}\nLocalização: ${alert.info?.area?.area_desc}`;
                    const url = window.location.href;
                    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + '\n\n' + url)}`, '_blank');
                });
                
                const copyBtn = document.createElement('button');
                copyBtn.className = 'share-button share-copy';
                copyBtn.innerHTML = '<i class="fas fa-link"></i> Copiar Link';
                copyBtn.addEventListener('click', function() {
                    copyToClipboard(window.location.href);
                });
                
                shareButtons.appendChild(whatsappBtn);
                shareButtons.appendChild(copyBtn);
                body.appendChild(shareButtons);
                
                // Montar card
                alertCard.appendChild(header);
                alertCard.appendChild(body);
                fragment.appendChild(alertCard);
            } catch (err) {
                console.error(`Erro ao processar alerta ${index}:`, err);
            }
        });
        
        container.innerHTML = '';
        container.appendChild(fragment);
    }
    
    // Função para renderizar conteúdo WhatNow
    function renderWhatNow(data) {
        const whatnowContainer = document.getElementById('whatnow');
        
        if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
            showNoDataMessage('whatnow', 'Não há informações disponíveis para exibir no momento.');
            return;
        }
        
        // Limpar o container existente
        whatnowContainer.innerHTML = '';
        
        // Criar fragmento para melhor performance
        const fragment = document.createDocumentFragment();
        
        // Processar dados
        data.data.forEach((item, index) => {
            try {
                // Verificar se tem tradução
                if (!item.translations || (!item.translations.pt && !item.translations.en)) {
                    console.log(`Item sem tradução adequada: ${JSON.stringify(item)}`);
                    return;
                }
                
                // Preferir português
                const translation = item.translations.pt || item.translations.en;
                const eventTypeTranslated = translateEventType(item.eventType);
                const iconPath = getIconForEventType(item.eventType);
                
                // Região aleatória para demo
                const regions = ['norte', 'nordeste', 'centro-oeste', 'sudeste', 'sul'];
                const region = regions[Math.floor(Math.random() * regions.length)];
                
                // Criar card
                const card = document.createElement('div');
                card.className = 'card';
                card.dataset.eventType = item.eventType.toLowerCase();
                card.dataset.region = region;
                
                // Cabeçalho
                const cardHeader = document.createElement('div');
                cardHeader.className = 'card-header p-0';
                cardHeader.id = `heading-${index}`;
                
                const button = document.createElement('button');
                button.className = 'btn btn-link w-100 text-left p-0';
                button.type = 'button';
                button.setAttribute('data-toggle', 'collapse');
                button.setAttribute('data-target', `#collapse-${index}`);
                button.setAttribute('aria-expanded', index === 0 ? 'true' : 'false');
                button.setAttribute('aria-controls', `collapse-${index}`);
                
                // Conteúdo do cabeçalho
                const headerContent = document.createElement('div');
                headerContent.className = 'hazard-header';
                
                const iconDiv = document.createElement('div');
                iconDiv.className = 'hazard-icon';
                
                const iconImg = document.createElement('img');
                iconImg.src = iconPath;
                iconImg.alt = eventTypeTranslated;
                iconImg.loading = "lazy";
                iconDiv.appendChild(iconImg);
                
                const contentDiv = document.createElement('div');
                contentDiv.className = 'hazard-content';
                
                const title = document.createElement('h3');
                title.className = 'hazard-title';
                title.textContent = `Mensagens importantes para ${eventTypeTranslated.toLowerCase()}`;
                
                const description = document.createElement('p');
                description.className = 'hazard-description';
                description.textContent = sanitizeHTML(translation.description || '');
                
                const indicator = document.createElement('span');
                indicator.className = 'collapse-indicator';
                indicator.innerHTML = '<i class="fas fa-chevron-down"></i>';
                indicator.setAttribute('aria-hidden', 'true');
                
                contentDiv.appendChild(title);
                contentDiv.appendChild(description);
                
                headerContent.appendChild(iconDiv);
                headerContent.appendChild(contentDiv);
                headerContent.appendChild(indicator);
                
                button.appendChild(headerContent);
                cardHeader.appendChild(button);
                
                // Corpo do card
                const collapseDiv = document.createElement('div');
                collapseDiv.id = `collapse-${index}`;
                collapseDiv.className = index === 0 ? 'collapse show' : 'collapse';
                collapseDiv.setAttribute('aria-labelledby', `heading-${index}`);
                collapseDiv.setAttribute('data-parent', '#whatnow');
                
                // Carregar o conteúdo agora mesmo
                const cardBody = document.createElement('div');
                cardBody.className = 'card-body';
                
                const stageWrapper = document.createElement('div');
                stageWrapper.className = 'stage-wrapper p-3';
                
                // Processar estágios
                if (translation.stages) {
                    const sections = ['mitigation', 'seasonalForecast', 'warning', 'watch', 'immediate', 'recover'];
                    
                    sections.forEach(section => {
                        if (translation.stages[section] && translation.stages[section].length > 0) {
                            const sectionDiv = document.createElement('div');
                            sectionDiv.className = `stage-section ${section}`;
                            
                            const sectionTitle = document.createElement('div');
                            sectionTitle.className = 'stage-title';
                            sectionTitle.textContent = translateSectionName(section);
                            
                            const sectionList = document.createElement('ol');
                            sectionList.className = 'stage-list';
                            sectionList.setAttribute('role', 'list');
                            
                            translation.stages[section].forEach(tip => {
                                const listItem = document.createElement('li');
                                listItem.textContent = sanitizeHTML(tip);
                                sectionList.appendChild(listItem);
                            });
                            
                            sectionDiv.appendChild(sectionTitle);
                            sectionDiv.appendChild(sectionList);
                            stageWrapper.appendChild(sectionDiv);
                        }
                    });
                }
                
                // Adicionar botões de compartilhamento - SIMPLIFICADO
                const shareButtons = document.createElement('div');
                shareButtons.className = 'share-buttons';
                
                const whatsappBtn = document.createElement('button');
                whatsappBtn.className = 'share-button share-whatsapp';
                whatsappBtn.innerHTML = '<i class="fab fa-whatsapp"></i> WhatsApp';
                whatsappBtn.addEventListener('click', function() {
                    const text = `${title.textContent}\n${description.textContent}`;
                    const url = window.location.href;
                    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + '\n\n' + url)}`, '_blank');
                });
                
                const copyBtn = document.createElement('button');
                copyBtn.className = 'share-button share-copy';
                copyBtn.innerHTML = '<i class="fas fa-link"></i> Copiar Link';
                copyBtn.addEventListener('click', function() {
                    copyToClipboard(window.location.href);
                });
                
                shareButtons.appendChild(whatsappBtn);
                shareButtons.appendChild(copyBtn);
                stageWrapper.appendChild(shareButtons);
                
                cardBody.appendChild(stageWrapper);
                collapseDiv.appendChild(cardBody);
                
                // Montar card completo
                card.appendChild(cardHeader);
                card.appendChild(collapseDiv);
                fragment.appendChild(card);
            } catch (err) {
                console.error(`Erro ao processar item ${index}:`, err);
            }
        });
        
        whatnowContainer.appendChild(fragment);
        console.log(`Processados ${data.data.length} itens de whatnow com sucesso`);
        
        // Adicionar funcionalidade de filtro
        setupFilter();
    }
    
    // Configurar o filtro de eventos
    function setupFilter() {
        const eventSelector = document.getElementById('event-type-selector');
        
        eventSelector.addEventListener('change', function() {
            const selectedEventType = this.value;
            const cards = document.querySelectorAll('#whatnow .card');
            
            cards.forEach(card => {
                if (selectedEventType === 'all' || card.dataset.eventType === selectedEventType) {
                    card.style.display = 'block';
                    // Animar entrada suavemente
                    card.style.opacity = 0;
                    setTimeout(() => {
                        card.style.transition = 'opacity 0.3s';
                        card.style.opacity = 1;
                    }, 10);
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }
    
    // Função para buscar alertas ativos
    function fetchAlerts() {
        showLoader('active-alerts-container');
        
        // Para fins de demonstração, usamos alertas simulados
        const cachedAlerts = getFromCache('alerts_data');
        if (cachedAlerts) {
            console.log('Usando dados do cache para alertas');
            renderAlerts(cachedAlerts);
            return;
        }
        
        console.log('Gerando alertas simulados para demonstração');
        
        setTimeout(() => {
            // Alertas simulados
            const simulatedAlerts = [
                {
                    id: "alert-1",
                    sender: "Centro Nacional de Monitoramento e Alertas de Desastres Naturais",
                    sent: new Date().toISOString(),
                    status: "Actual",
                    info: {
                        event: "Inundação",
                        headline: "Alerta de inundações para região sul do país",
                        description: "Fortes chuvas contínuas podem causar inundações em áreas ribeirinhas. Moradores devem ficar atentos e seguir orientações da Defesa Civil.",
                        severity: "Severe",
                        area: {
                            area_desc: "Região Sul do Brasil - RS, SC, PR"
                        }
                    }
                },
                {
                    id: "alert-2",
                    sender: "INMET",
                    sent: new Date(Date.now() - 3600000).toISOString(), // 1 hora atrás
                    status: "Actual",
                    info: {
                        event: "Onda de Calor",
                        headline: "Alerta de calor extremo para região Nordeste",
                        description: "Temperaturas podem atingir 40°C nos próximos dias. Recomenda-se beber água regularmente e evitar exposição ao sol nos horários de pico.",
                        severity: "Extreme",
                        area: {
                            area_desc: "Região Nordeste - BA, SE, AL, PE, PB, RN, CE, PI, MA"
                        }
                    }
                }
            ];
            
            saveToCache('alerts_data', simulatedAlerts);
            renderAlerts(simulatedAlerts);
        }, 700);
    }
    
    // Função para buscar dados de whatnow
    function fetchWhatNow() {
        showLoader('whatnow');
        
        const cachedData = getFromCache('whatnow_data');
        if (cachedData) {
            console.log('Usando dados do cache para whatnow');
            renderWhatNow(cachedData);
            return;
        }
        
        console.log(`Buscando dados da API: ${whatNowUrl}`);
        
        fetch(whatNowUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Status: ${response.status} - ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                saveToCache('whatnow_data', data);
                console.log('Dados recebidos com sucesso. Processando whatnow...');
                renderWhatNow(data);
            })
            .catch(error => {
                console.error(`Erro ao buscar dados whatnow: ${error.message}`);
                showNoDataMessage('whatnow', 'Não foi possível carregar dados da API. Por favor, verifique sua conexão e tente novamente mais tarde.');
            });
    }
});