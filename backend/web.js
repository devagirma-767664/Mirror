const app = require('./server');

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || (process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1');

app.listen(PORT, HOST, () => console.log(`Mirror API listening on http://${HOST}:${PORT}`));
