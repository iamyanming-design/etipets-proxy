const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const path = require('path');

const SERPAPI_KEY = '0367a1c487731b84caed917ab4476a7491c289e776bda861e6e23f64c2b9232d';
const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // ── /health ──
  if (pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', time: new Date().toISOString() }));
    return;
  }

  // ── /search → proxy to SerpApi ──
  if (pathname === '/search') {
    const params = { ...parsedUrl.query, api_key: SERPAPI_KEY };
    const queryStr = Object.entries(params)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
    const serpUrl = `https://serpapi.com/search.json?${queryStr}`;
    console.log(`[PROXY] engine=${params.engine} q=${params.q || params.data_id || ''}`);

    https.get(serpUrl, (serpRes) => {
      let data = '';
      serpRes.on('data', chunk => data += chunk);
      serpRes.on('end', () => {
        res.writeHead(serpRes.statusCode, { 'Content-Type': 'application/json' });
        res.end(data);
      });
    }).on('error', (err) => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    });
    return;
  }

  // ── / → 提供前端 HTML ──
  if (pathname === '/' || pathname === '/index.html') {
    const filePath = path.join(__dirname, 'index.html');
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(data);
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`✅ ETi Pets 全端系統啟動於 port ${PORT}`);
  console.log(`   前端介面: http://localhost:${PORT}/`);
  console.log(`   API Proxy: http://localhost:${PORT}/search`);
});
