const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Update these paths to where your Certbot files are located
const httpsOptions = {
  key: fs.readFileSync('/etc/letsencrypt/live/mayproperties.no-ip.org/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/mayproperties.no-ip.org/fullchain.pem'),
};

app.prepare().then(() => {
  createServer(httpsOptions, (req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(3000, (err) => {
    if (err) throw err;
    console.log('> Ready on https://mayproperties.no-ip.org');
  });
});