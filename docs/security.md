# Security and Privacy

## Authentication and Tenant Isolation

- Auth.js uses signed JWT sessions and credentials hashed with bcrypt (12 rounds).
- Dashboard middleware and the server dashboard layout both reject unauthenticated access.
- Route handlers scope reads by `userId` and verify ownership of submitted account/category relationships.
- Registration, login, 2FA verification, and demo webhook ingestion have bounded in-process rate limits. A distributed deployment should replace the in-memory store with a shared Redis-compatible limiter.

## Two-Factor Authentication

TOTP secrets are encrypted with AES-256-GCM using `TWO_FACTOR_ENCRYPTION_KEY`. Recovery codes are bcrypt hashes and are consumed using a compare-and-swap update. Disabling or replacing 2FA requires password reauthentication. Never log secrets, recovery codes, passwords, or QR payloads.

## Demo SMS Sync

Demo SMS Sync is not a banking integration. A per-user random webhook token authorizes sample alerts; identical payloads are fingerprinted to prevent duplicate pending charges. Approval validates all owned relationships and commits the optional recurring rule, transaction, and status transition atomically.

Webhook tokens should be sent in the `Authorization: Bearer` header. Query-string support exists for simple portfolio tooling but may be recorded by infrastructure logs.

## Privacy and Logging

Exports use a versioned envelope and include assets and sync records. Wipe removes every financial/sync record and removes the webhook token while retaining the user account, password, and 2FA configuration. Structured error logs intentionally omit values whose keys indicate passwords, secrets, tokens, raw messages, or amounts.
