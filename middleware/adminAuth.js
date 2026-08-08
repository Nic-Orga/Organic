// Authentification très simple par mot de passe partagé.
// Suffisant pour un artiste indépendant qui gère seul son catalogue,
// mais ce n'est pas un vrai système de comptes utilisateurs.
module.exports = function adminAuth(req, res, next) {
  const provided = req.headers['x-admin-password'];
  if (!process.env.ADMIN_PASSWORD) {
    return res.status(500).json({ error: 'ADMIN_PASSWORD non configuré côté serveur (.env).' });
  }
  if (provided && provided === process.env.ADMIN_PASSWORD) {
    return next();
  }
  return res.status(401).json({ error: 'Mot de passe admin invalide.' });
};
