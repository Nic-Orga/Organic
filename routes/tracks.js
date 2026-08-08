const express = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const { getSupabase, BUCKET } = require('../supabase');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

// Les fichiers sont gardés en mémoire puis envoyés vers Supabase Storage
// (pas d'écriture sur le disque du serveur, qui ne persiste pas sur l'hébergement gratuit).
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 Mo par fichier
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'audio' && !file.mimetype.startsWith('audio/')) {
      return cb(new Error('Le fichier "audio" doit être un fichier audio.'));
    }
    if (file.fieldname === 'cover' && !file.mimetype.startsWith('image/')) {
      return cb(new Error('Le fichier "cover" doit être une image.'));
    }
    cb(null, true);
  }
});

const VALID_GENRES = ['synthwave', 'game', 'calm'];

function toApiShape(row) {
  return {
    id: row.id,
    title: row.title,
    genre: row.genre,
    price: row.price,
    coverUrl: row.cover_url,
    audioUrl: row.audio_url,
    createdAt: Number(row.created_at)
  };
}

async function uploadToStorage(file, destPath) {
  const supabase = getSupabase();
  const { error } = await supabase.storage.from(BUCKET).upload(destPath, file.buffer, {
    contentType: file.mimetype,
    upsert: true
  });
  if (error) throw new Error('Échec de l\u2019upload : ' + error.message);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(destPath);
  return data.publicUrl;
}

// GET /api/tracks -> catalogue public (jamais le downloadLink)
router.get('/', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('tracks')
      .select('id,title,genre,price,cover_url,audio_url,created_at')
      .order('created_at', { ascending: true });
    if (error) throw error;
    res.json(data.map(toApiShape));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Erreur serveur.' });
  }
});

// POST /api/tracks -> ajouter un titre (protégé)
router.post('/', adminAuth, upload.fields([{ name: 'audio', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), async (req, res) => {
  try {
    const { title, genre, price, downloadLink } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ error: 'Titre requis.' });
    if (!VALID_GENRES.includes(genre)) return res.status(400).json({ error: 'Genre invalide.' });
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0) return res.status(400).json({ error: 'Prix invalide.' });

    const id = 't_' + crypto.randomUUID();
    const audioFile = req.files?.audio?.[0];
    const coverFile = req.files?.cover?.[0];

    let audioUrl = null;
    let coverUrl = null;
    if (audioFile) audioUrl = await uploadToStorage(audioFile, `${id}/audio${path.extname(audioFile.originalname) || ''}`);
    if (coverFile) coverUrl = await uploadToStorage(coverFile, `${id}/cover${path.extname(coverFile.originalname) || ''}`);

    const supabase = getSupabase();
    const { error } = await supabase.from('tracks').insert({
      id,
      title: title.trim(),
      genre,
      price: numPrice,
      download_link: downloadLink || null,
      cover_url: coverUrl,
      audio_url: audioUrl,
      created_at: Date.now()
    });
    if (error) throw error;

    res.status(201).json({ id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Erreur lors de l'ajout." });
  }
});

// DELETE /api/tracks/:id -> supprimer un titre (protégé)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data: track, error: fetchErr } = await supabase
      .from('tracks').select('*').eq('id', req.params.id).maybeSingle();
    if (fetchErr) throw fetchErr;
    if (!track) return res.status(404).json({ error: 'Introuvable.' });

    // Best effort : on retire aussi les fichiers du stockage.
    await supabase.storage.from(BUCKET).remove([
      `${track.id}/audio.mp3`, `${track.id}/audio.wav`, `${track.id}/audio.m4a`, `${track.id}/audio.ogg`,
      `${track.id}/cover.jpg`, `${track.id}/cover.jpeg`, `${track.id}/cover.png`, `${track.id}/cover.webp`
    ]).catch(() => {});

    const { error: delErr } = await supabase.from('tracks').delete().eq('id', req.params.id);
    if (delErr) throw delErr;

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Erreur lors de la suppression.' });
  }
});

module.exports = router;
