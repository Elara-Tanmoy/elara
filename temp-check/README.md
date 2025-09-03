
# Elara API

## Run locally
```
cd api
cp .env.example .env
npm install
npm run fetch-feeds   # optional: populate threat feeds
npm run dev
```
Health: `GET http://localhost:3001/health`

Scan a link:
```
curl -s -X POST http://localhost:3001/scan-link -H 'Content-Type: application/json' -d '{"url":"https://example.com"}' | jq
```

## Notes
- Uses Redis if `REDIS_URL` is set, otherwise an in-process LRU cache.
- Stores uploaded files to `data/public/` and serves them at `/files/...` for safe-view.
