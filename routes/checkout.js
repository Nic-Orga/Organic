const express = require('express');
const Stripe = require('stripe');
const { getSupabase } = require('../supabase');

const router = express.Router();

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY manquant dans .env');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

// POST /api/checkout  body: { items: [{ id }] }  (id = id de titre, ou "bundle:genre")
router.post('/', async (req, res) => {
  try {
    const stripe = getStripe();
    const supabase = getSupabase();
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    if (items.length === 0) return res.status(400).json({ error: 'Panier vide.' });

    const { data: allTracks, error } = await supabase.from('tracks').select('*');
    if (error) throw error;

    const line_items = [];
    const trackIdSet = new Set();

    for (const item of items) {
      if (typeof item.id === 'string' && item.id.startsWith('bundle:')) {
        const genre = item.id.split(':')[1];
        const genreTracks = allTracks.filter((t) => t.genre === genre);
        if (genreTracks.length < 2) continue;
        const sum = genreTracks.reduce((s, t) => s + t.price, 0);
        const price = Math.round(sum * 0.75 * 2) / 2;
        genreTracks.forEach((t) => trackIdSet.add(t.id));
        line_items.push({
          price_data: { currency: 'eur', product_data: { name: `Pack complet — ${genre}` }, unit_amount: Math.round(price * 100) },
          quantity: 1
        });
      } else {
        const t = allTracks.find((t) => t.id === item.id);
        if (!t) continue;
        trackIdSet.add(t.id);
        line_items.push({
          price_data: { currency: 'eur', product_data: { name: t.title }, unit_amount: Math.round(t.price * 100) },
          quantity: 1
        });
      }
    }

    if (line_items.length === 0) return res.status(400).json({ error: 'Aucun article valide.' });

    const origin = req.headers.origin || `${req.protocol}://${req.get('host')}`;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items,
      success_url: `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/`,
      metadata: { trackIds: [...trackIdSet].join(',') }
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Erreur de paiement.' });
  }
});

// GET /api/checkout/session/:id -> vérifie le paiement, renvoie les liens de téléchargement
router.get('/session/:id', async (req, res) => {
  try {
    const stripe = getStripe();
    const supabase = getSupabase();
    const session = await stripe.checkout.sessions.retrieve(req.params.id);

    if (session.payment_status !== 'paid') {
      return res.status(402).json({ error: 'Paiement non confirmé.' });
    }

    const trackIds = (session.metadata?.trackIds || '').split(',').filter(Boolean);
    if (trackIds.length === 0) return res.json({ tracks: [] });

    const { data, error } = await supabase.from('tracks').select('title,download_link').in('id', trackIds);
    if (error) throw error;

    res.json({ tracks: data.map((t) => ({ title: t.title, downloadLink: t.download_link })) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Erreur.' });
  }
});

module.exports = router;
