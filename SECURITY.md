# Security

Report vulnerabilities privately to the maintainer. Do not open a public issue
for a working exploit.

## What this API assumes

- TLS terminates in front of Node (nginx, Caddy, a cloud load balancer). The
  process itself speaks HTTP.
- `JWT_SECRET` is at least 32 characters and never committed. Rotate it and
  every issued token dies.
- Set `TRUST_PROXY=true` **only** when a reverse proxy is stripping/overwriting
  `X-Forwarded-For`. Enabling it on a public port lets clients spoof IPs and
  skip rate limits.
- `CORS_ORIGIN=*` is rejected when `NODE_ENV=production`. A Bearer-token API
  still needs an explicit origin if a browser will call it. Cookie sessions
  later would use the same allowlist.

## What the code already does

- Helmet headers, body size cap, global + auth rate limits
- Passwords hashed with bcryptjs (12 rounds); hashes never leave `toJSON`
- JWTs are HS256 with explicit `iss` / `aud`; verification rejects anything else
- Owner-scoped queries: another user's id returns 404, not 403
- Request logs redact `Authorization` and `Cookie`
- Duplicate emails are a unique index, not a check-then-insert
