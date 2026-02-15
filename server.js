// Simple local dev server (replaces vercel dev for local development)
const http = require('http');
const fs = require('fs');
const path = require('path');

// Load .env
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
        const [key, ...vals] = line.trim().split('=');
        if (key && vals.length) process.env[key] = vals.join('=');
    });
}

// Import API handlers
const enhanceHandler = require('./api/enhance');
const summarizeHandler = require('./api/summarize');

const PORT = 3000;

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
};

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const pathname = url.pathname;

    // === API Routes ===
    if (pathname === '/api/enhance' || pathname === '/api/summarize') {
        // Parse JSON body for POST requests
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
            try {
                req.body = body ? JSON.parse(body) : {};
            } catch (e) {
                req.body = {};
            }

            // Create a mock response object compatible with Vercel handlers
            const mockRes = {
                statusCode: 200,
                headers: {},
                setHeader(key, value) { this.headers[key] = value; },
                status(code) { this.statusCode = code; return this; },
                json(data) {
                    res.writeHead(this.statusCode, {
                        ...this.headers,
                        'Content-Type': 'application/json',
                    });
                    res.end(JSON.stringify(data));
                },
                end(data) {
                    res.writeHead(this.statusCode, this.headers);
                    res.end(data);
                }
            };

            try {
                if (pathname === '/api/enhance') {
                    await enhanceHandler(req, mockRes);
                } else {
                    await summarizeHandler(req, mockRes);
                }
            } catch (error) {
                console.error('API Error:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }));
            }
        });
        return;
    }

    // === Static File Serving ===
    let filePath;

    if (pathname === '/' || pathname === '/index.html') {
        filePath = path.join(__dirname, 'public', 'index.html');
    } else if (pathname === '/summary' || pathname === '/summary/') {
        filePath = path.join(__dirname, 'public', 'summary', 'summary.html');
    } else {
        // Serve from public/ directory
        filePath = path.join(__dirname, 'public', pathname);
    }

    // Check if file exists
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
});

server.listen(PORT, () => {
    console.log(`\n  🚀 PromptForge dev server running at:`);
    console.log(`     http://localhost:${PORT}`);
    console.log(`     http://localhost:${PORT}/summary\n`);
});
