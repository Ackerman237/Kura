import express from 'express';

const router = express.Router();
const DEFAULT_DIRECT_EMBED_HOSTS = ['nhplayer.com', 'playmogo.com', 'streampoi.com'];

const directEmbedHosts = (process.env.DIRECT_EMBED_HOSTS || DEFAULT_DIRECT_EMBED_HOSTS.join(','))
  .split(',')
  .map((host) => host.trim().toLowerCase())
  .filter(Boolean);

router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    app: 'kura',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    memory: process.memoryUsage(),
    node: process.version,
    directEmbedHosts,
  });
});

export default router;
