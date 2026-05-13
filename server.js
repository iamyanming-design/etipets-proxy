const http = require('http');
const https = require('https');
const url = require('url');

const SERPAPI_KEY = '0367a1c487731b84caed917ab4476a7491c289e776bda861e6e23f64c2b9232d';
const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  // CORS headers — allow all origins
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);

  // Health check
  if (parsedUrl.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', message: 'ETi Pets SerpApi Proxy is running' }));
    return;
  }

  // /search endpoint — proxy to SerpApi
  if (parsedUrl.pathname === '/search') {
    const params = { ...parsedUrl.query, api_key: SERPAPI_KEY };
    const queryStr = Object.entries(params)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
    const serpUrl = `https://serpapi.com/search.json?${queryStr}`;

    console.log(`[${new Date().toISOString()}] Proxying: engine=${params.engine} q=${params.q || params.data_id || ''}`);

    https.get(serpUrl, (serpRes) => {
      let data = '';
      serpRes.on('data', chunk => data += chunk);
      serpRes.on('end', () => {
        res.writeHead(serpRes.statusCode, { 'Content-Type': 'application/json' });
        res.end(data);
      });
    }).on('error', (err) => {
      console.error('SerpApi error:', err.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    });
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`✅ ETi Pets SerpApi Proxy running on port ${PORT}`);
});
