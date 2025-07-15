// server.js
const config = require('./config');
const express = require('express');
const cors = require('cors');
const { procesarTarjetas } = require('./bot');
const { WebSocketServer } = require('ws');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.post('/api/iniciar', async (req, res) => {
  const { tarjetas } = req.body;

  if (!tarjetas || !Array.isArray(tarjetas) || tarjetas.length === 0) {
    return res.status(400).json({ error: 'No se recibieron tarjetas válidas' });
  }

  console.log(`🔗 Recibidas ${tarjetas.length} tarjetas desde React`);

  const resultados = [];
  await procesarTarjetas(tarjetas, (resultado) => {
    resultados.push(resultado);
  });

  res.json(resultados);
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor Express escuchando en ${config.BASE_URL}`);
});

const wss = new WebSocketServer({ port: 3002 });
console.log(`🔗 WebSocket escuchando en ${config.WS_URL}`);

wss.on('connection', (ws) => {
  console.log('🔗 Cliente WebSocket conectado');

  ws.on('message', async (data) => {
    try {
      const { tarjetas } = JSON.parse(data);

      if (!tarjetas || !Array.isArray(tarjetas) || tarjetas.length === 0) {
        ws.send(JSON.stringify({ error: 'No se recibieron tarjetas válidas' }));
        ws.close();
        return;
      }

      console.log(`🧩 Procesando ${tarjetas.length} tarjetas en tiempo real`);

      await procesarTarjetas(tarjetas, (resultado) => {
        ws.send(JSON.stringify(resultado));
      });

      ws.close();
      console.log('✅ Procesamiento WebSocket terminado');
    } catch (error) {
      console.error('❌ Error en WebSocket:', error);
      ws.send(JSON.stringify({ error: 'Error interno en WebSocket' }));
      ws.close();
    }
  });

  ws.on('close', () => {
    console.log('🔚 Cliente WebSocket desconectado');
  });
});
