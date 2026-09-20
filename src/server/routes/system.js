import express from 'express';

const router = express.Router();

router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    app: 'kura',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    memory: process.memoryUsage(),
    node: process.version,
  });
});

export default router;
