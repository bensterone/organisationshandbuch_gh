const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const fav = require('../services/favorites.service');

router.get('/', authenticate, async (req, res, next) => {
  try { res.json(await fav.listFavorites(req.user.id)); } catch (e) { next(e); }
});

router.post('/', authenticate, async (req, res, next) => {
  try { res.status(201).json(await fav.addFavorite(req.user.id, req.body.navigation_item_id)); } catch (e) { next(e); }
});

router.delete('/', authenticate, async (req, res, next) => {
  try { res.json(await fav.removeFavorite(req.user.id, req.body.navigation_item_id)); } catch (e) { next(e); }
});

module.exports = router;
