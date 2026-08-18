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

// Filet de sécurité : toute erreur (ex. fichier trop volumineux via multer)
// doit renvoyer du JSON, jamais la page HTML d'erreur par défaut d'Express,
// sinon le front-end plante en essayant de parser du HTML comme du JSON.
app.use((err, req, res, next) => {
  console.error(err);
  if (err && err.name === 'MulterError') {
    const messages = {
      LIMIT_FILE_SIZE: 'Fichier trop volumineux (20 Mo maximum).'
    };
    return res.status(400).json({ error: messages[err.code] || err.message });
  }
  res.status(err.status || 500).json({ error: err.message || 'Erreur serveur.' });
});

app.listen(PORT, () => {
  console.log(`Organic tourne sur http://localhost:${PORT}`);
});
