# Cokform Transfer Manifest

Generated: 2026-08-21T14:52:35.016934+00:00

- Included files: **2174**
- Excluded by secret marker: **0**
- Excluded directories: `.git`, `node_modules`, `dist`, caches, coverage, browser reports.
- Excluded files: real `.env` files, `.pem`, `.p12`, private keys, credentials and detected secret markers.
- The inventory is a SHA-256 manifest. Verify it after unpacking before continuing development.

## Integrity check

```bash
python3 scripts/verify_transfer_inventory.py
```

## Deliberately not transferred

Actual browser sessions, OAuth tokens, Supabase/Cloudflare/GitHub secrets, personal keys, recovery files, response ciphertext/plaintext and customer identifiers are not in this package. Reconnect services through the platform dashboards after transfer.
