import express from 'express';
import {
  scrapeNekoList,
  scrapeNekoDetail,
} from '../../nekopoi.js';
import {
  scrapeHentaiList,
  scrapeHentaiDetail,
  scrapeHentaiGenres,
  scrapeHentaiGenre,
} from '../../hentaitv.js';
import {
  scrapeEpornerList,
  scrapeEpornerDetail,
  scrapeEpornerCategories,
  scrapeEpornerCategory,
} from '../../eporner.js';

const router = express.Router();

// --- Unified Cross-Provider Trending ---
router.get('/trending', async (req, res) => {
  try {
    const provider = req.query.provider || 'htv';
    let data;
    if (provider === 'neko') {
      data = await scrapeNekoList(1);
    } else if (provider === 'tube') {
      data = await scrapeEpornerList({ page: 1 });
    } else {
      data = await scrapeHentaiList({ page: 1 });
    }
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

// --- NekoPoi ---
router.get('/neko/list', async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const data = await scrapeNekoList(page);
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

router.get('/neko/detail/:slug', async (req, res) => {
  try {
    const data = await scrapeNekoDetail(req.params.slug);
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

// --- HentaiTV ---
router.get('/htv/genres', async (_req, res) => {
  try {
    const data = await scrapeHentaiGenres();
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

router.get('/htv/list', async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const query = req.query.q || undefined;
    const genre = req.query.genre && req.query.genre !== 'all' ? req.query.genre : undefined;
    let data;
    if (genre) {
      data = await scrapeHentaiGenre(genre, page);
    } else {
      data = await scrapeHentaiList({ page, query });
    }
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

router.get('/htv/detail/:slug', async (req, res) => {
  try {
    const data = await scrapeHentaiDetail(req.params.slug);
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

// --- Eporner ---
router.get('/tube/categories', async (_req, res) => {
  try {
    const data = await scrapeEpornerCategories();
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

router.get('/tube/list', async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const query = req.query.q || undefined;
    const category = req.query.category && req.query.category !== 'all' ? req.query.category : undefined;
    let data;
    if (category) {
      data = await scrapeEpornerCategory(category, page);
    } else {
      data = await scrapeEpornerList({ page, query });
    }
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

router.get('/tube/detail/:id', async (req, res) => {
  try {
    const data = await scrapeEpornerDetail(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

export default router;
