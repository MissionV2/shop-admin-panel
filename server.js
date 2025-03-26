const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 8080;

app.use(bodyParser.json());

// Пути к файлам с товарами
const ADMIN_PRODUCTS_FILE = path.join(__dirname, 'products.json');
const FRONTEND_PRODUCTS_FILE = path.join(__dirname, '../frontend/products.json');

// Чтение товаров из файла
function readProducts() {
  try {
    const data = fs.readFileSync(ADMIN_PRODUCTS_FILE);
    return JSON.parse(data);
  } catch (error) {
    console.error('Ошибка чтения файла товаров:', error);
    return [];
  }
}

// Запись товаров в оба файла (admin и frontend)
function writeProducts(products) {
  try {
    const data = JSON.stringify(products, null, 2);
    
    // Запись в файл админ-панели
    fs.writeFileSync(ADMIN_PRODUCTS_FILE, data);
    console.log(`Файл ${ADMIN_PRODUCTS_FILE} обновлен`);
    
    // Запись в файл фронтенда
    fs.writeFileSync(FRONTEND_PRODUCTS_FILE, data);
    console.log(`Файл ${FRONTEND_PRODUCTS_FILE} обновлен`);
    
    return true;
  } catch (error) {
    console.error('Ошибка записи файлов товаров:', error);
    return false;
  }
}

// Проверка и инициализация файлов при запуске
function initializeFiles() {
  if (!fs.existsSync(ADMIN_PRODUCTS_FILE)) {
    writeProducts([]);
  }
  
  if (!fs.existsSync(FRONTEND_PRODUCTS_FILE)) {
    writeProducts([]);
  }
}

// Инициализация файлов
initializeFiles();

// Middleware для логирования запросов
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Получение списка товаров
app.get('/api/products', (req, res) => {
  try {
    const products = readProducts();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении списка товаров' });
  }
});

// Добавление нового товара
app.post('/api/products', (req, res) => {
  try {
    const products = readProducts();
    const newProduct = {
      id: products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1,
      ...req.body,
      // Добавляем обязательные поля, если они не указаны
      name: req.body.name || 'Без названия',
      price: req.body.price || 0,
      description: req.body.description || '',
      categories: req.body.categories || []
    };
    
    products.push(newProduct);
    
    if (writeProducts(products)) {
      res.status(201).json(newProduct);
    } else {
      res.status(500).json({ error: 'Ошибка при сохранении товара' });
    }
  } catch (error) {
    res.status(400).json({ error: 'Некорректные данные товара' });
  }
});

// Обновление товара
app.put('/api/products/:id', (req, res) => {
  try {
    const products = readProducts();
    const id = parseInt(req.params.id);
    const index = products.findIndex(p => p.id === id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Товар не найден' });
    }
    
    // Обновляем только переданные поля
    const updatedProduct = { 
      ...products[index], 
      ...req.body,
      id // Защищаем ID от изменения
    };
    
    products[index] = updatedProduct;
    
    if (writeProducts(products)) {
      res.json(updatedProduct);
    } else {
      res.status(500).json({ error: 'Ошибка при обновлении товара' });
    }
  } catch (error) {
    res.status(400).json({ error: 'Некорректные данные товара' });
  }
});

// Удаление товара
app.delete('/api/products/:id', (req, res) => {
  try {
    const products = readProducts();
    const id = parseInt(req.params.id);
    const initialLength = products.length;
    const filteredProducts = products.filter(p => p.id !== id);
    
    if (initialLength === filteredProducts.length) {
      return res.status(404).json({ error: 'Товар не найден' });
    }
    
    if (writeProducts(filteredProducts)) {
      res.status(204).send();
    } else {
      res.status(500).json({ error: 'Ошибка при удалении товара' });
    }
  } catch (error) {
    res.status(400).json({ error: 'Некорректный ID товара' });
  }
});

// Обработка несуществующих роутов
app.use((req, res) => {
  res.status(404).json({ error: 'Маршрут не найден' });
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error('Ошибка сервера:', err);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

app.listen(PORT, () => {
  console.log(`Сервер админ-панели запущен на http://localhost:${PORT}`);
  console.log(`Файлы товаров синхронизируются между:`);
  console.log(`- ${ADMIN_PRODUCTS_FILE}`);
  console.log(`- ${FRONTEND_PRODUCTS_FILE}`);
});