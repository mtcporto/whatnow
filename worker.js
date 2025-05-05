// worker.js para Cloudflare
addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
  })
  
  async function handleRequest(request) {
    const url = new URL(request.url)
    const path = url.pathname
    const params = url.search
  
    // API Preparecenter base URL
    const API_BASE = "https://api.preparecenter.org/v1"
    const API_KEY = "ucoUdythzuslm8pee4YEBAnb3KThmdfW"
    
    let targetUrl = ""
    
    // Roteamento das URLs
    if (path.includes('/whatnow')) {
      // Rota para What Now
      const country = new URLSearchParams(params).get('country') || 'BRA'
      const eventType = new URLSearchParams(params).get('eventType') || 'earthquake,hurricane'
      targetUrl = `${API_BASE}/org/${country}/whatnow?eventType=${eventType}`
    } else if (path.includes('/alerts')) {
      // Rota para Alertas
      const country = new URLSearchParams(params).get('country') || 'BRA'
      targetUrl = `${API_BASE}/org/${country}/alerts/rss`
    } else {
      // Rota não reconhecida
      return new Response('Not Found', { status: 404 })
    }
  
    try {
      const response = await fetch(targetUrl, {
        headers: {
          'x-api-key': API_KEY
        }
      })
      
      // Obter body e tipo de conteúdo
      const body = await response.text()
      const contentType = response.headers.get('content-type')
      
      // Retornar resposta com CORS headers
      return new Response(body, {
        status: response.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': contentType || 'application/json'
        }
      })
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        }
      })
    }
  }