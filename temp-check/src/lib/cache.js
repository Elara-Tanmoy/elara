
import Redis from 'ioredis';
import LRU from 'lru-cache';

const useRedis = !!process.env.REDIS_URL;
let redis;
if (useRedis) {
  redis = new Redis(process.env.REDIS_URL, { lazyConnect: true });
}

const lru = new LRU({ max: 5000, ttl: 60 * 1000 });

export async function getCache(key) {
  if (lru.has(key)) return lru.get(key);
  if (useRedis) {
    try { await redis.connect(); const v = await redis.get(key); if (v) return JSON.parse(v); } catch {}
  }
  return null;
}

export async function setCache(key, value, ttlSec=3600) {
  lru.set(key, value, { ttl: 60 * 1000 });
  if (useRedis) {
    try { await redis.connect(); await redis.set(key, JSON.stringify(value), 'EX', ttlSec); } catch {}
  }
}
