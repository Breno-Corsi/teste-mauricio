import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { api } from './src/routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));

app.use('/api', api);
app.use('/api', (req, res) => res.status(404).json({ erro: 'Rota não encontrada.' }));
app.use(express.static(path.join(__dirname, 'public')));

app.use((err, req, res, next) => {
  if (err.status === 400 || err.type === 'entity.parse.failed') {
    return res.status(400).json({ erro: 'Requisição inválida.' });
  }
  console.error(err);
  res.status(500).json({ erro: 'Erro interno do servidor.' });
});

app.listen(PORT, () => {
  console.log(`Veio rodando em http://localhost:${PORT}`);
});
