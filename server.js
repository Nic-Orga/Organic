require('dotenv').config();
const express = require('express');
const path = require('path');

const tracksRouter = require('./routes/tracks');
const checkoutRouter = require('./routes/checkout');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/api/tracks', tracksRouter);
app.use('/api/checkout', checkoutRouter);
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`Organic tourne sur http://localhost:${PORT}`);
});
