import express from 'express';
import {
  scrapeMangaList,
  scrapeMangaDetail,
  scrapeChapterImages,
  scrapeGenres,
} from '../../doujindesu.js';

const router = express.Router();

router.get('/list', async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 24;
    const type = req.query.type && req.query.type !== 'all' ? req.query.type : undefined;
    const genre = req.query.genre && req.query.genre !== 'all' ? req.query.genre : undefined;
    const sort = req.query.sort || undefined;
    const query = req.query.q || undefined;
    const data = await scrapeMangaList({ page, limit, type, query, genre, sort, withMeta: true });
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

router.get('/genres', async (_req, res) => {
  try {
    const data = await scrapeGenres();
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

router.get('/detail/:slug', async (req, res) => {
  try {
    const data = await scrapeMangaDetail(req.params.slug);
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

router.get('/chapter/:id', async (req, res) => {
  try {
    const data = await scrapeChapterImages(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

export default router;
