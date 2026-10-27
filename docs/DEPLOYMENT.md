# Palette Lab — Deployment

## Production

- Public URL: https://palette-lab.3476554092.workers.dev/
- Platform: Cloudflare Workers with static assets
- Source: `yangzirui50-hash/palette-lab`, branch `main`
- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Preview command: `npx wrangler preview`
- GitHub access is limited to the `palette-lab` repository.

The first Git-connected production build completed successfully on 2026-10-27. Later commits pushed to `main` can be rebuilt and deployed through the same Cloudflare integration.

## Environment configuration

The first deployment contained no provider secrets and correctly presented an offline fallback. DeepSeek has since been configured for production: the public health check reports `configured: true` and `provider: deepseek`.

Non-secret provider settings:

```dotenv
AI_PROVIDER=deepseek
AI_MODEL=deepseek-flash
AI_BASE_URL=https://api.deepseek.com/chat/completions
UNSPLASH_PROVIDER=unsplash
```

Server-side secrets to configure separately in Cloudflare:

- `AI_API_KEY`
- `UNSPLASH_ACCESS_KEY` after Unsplash approves the owner's application

Never commit `.dev.vars`, real API keys, passwords or Cloudflare credentials. Do not place provider secrets in frontend environment variables or repository files.

## Production verification — 2026-10-27

- Public page and static assets load successfully.
- `/api/health` and `/api/providers` return HTTP 200 in the browser.
- Current health state is `status: ok`, `configured: true`, `provider: deepseek`.
- The 800 × 500 test image returns three expected colors: `#080808` 50%, `#E0FF50` 32.5%, `#4890E0` 17.5%.
- Dark mode and Art/Poster rendering work after deployment.
- The Art/Poster preview passes its two configured contrast checks.
- At 390 px viewport width, document width is 390 px with no horizontal overflow.
- Before secret configuration, AI analysis returned the visible fallback `AI 服务尚未配置，离线功能不受影响。`
- A real production DeepSeek Flash analysis returned HTTP 200 with accurate image content, composition and area analysis; provider and model were verified in the response.
- Reference comparison remains pending Unsplash access; no mock result is presented as production AI.

## Remaining rollout steps

1. After Unsplash approval, configure its Access Key and verify attributed search plus DeepSeek comparison.
2. Keep local and production secret configurations separate, and monitor provider usage.
