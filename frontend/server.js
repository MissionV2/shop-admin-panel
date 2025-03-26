const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware для статических файлов
app.use(express.static(path.join(__dirname)));

// Маршрут для главной страницы
app.get('/', (req, res) => {
  fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
    if (err) {
      res.status(500).send('Ошибка загрузки страницы');
      return;
    }
    res.setHeader('Content-Type', 'text/html');
    res.send(data);
  });
});

// Маршрут для получения товаров
app.get('/products', (req, res) => {
  fs.readFile(path.join(__dirname, 'products.json'), (err, data) => {
    if (err) {
      res.status(500).json({ error: 'Ошибка загрузки товаров' });
      return;
    }
    res.setHeader('Content-Type', 'application/json');
    res.send(data);
  });
});

app.listen(PORT, () => {
  console.log(`Сервер магазина запущен на http://localhost:${PORT}`);
});