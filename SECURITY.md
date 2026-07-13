# Security Policy

`@liqo/sdk` is used to move real money. We take its security seriously.

## Reporting a Vulnerability

**Do not report security vulnerabilities through public GitHub issues, discussions, or pull requests.**

Report privately via **GitHub Security Advisories** — the **"Report a vulnerability"** button under this repository's **Security** tab. This is the preferred and supported channel. A dedicated security contact email will be published here once it is available.

Please include:

- A description of the vulnerability and its impact
- Steps to reproduce (proof-of-concept if possible)
- Affected version(s) of `@liqo/sdk`

We support coordinated disclosure and will credit reporters who wish to be acknowledged once a fix has shipped.

## Handling Secrets Safely

- **API keys are secrets.** Never commit them, never ship them to a browser or mobile app, and never log them. Load them from environment variables.
- The SDK is **server-side only**. Frontends must call your backend, which uses the SDK.
- **Always verify webhook signatures** with `liqo.webhooks.verify()` using the **raw request body** before trusting any webhook payload.
- Prefer a **live** key only in production; use **sandbox** keys everywhere else.

## Supported Versions

Security fixes are applied to the latest published major line.

| Version | Supported |
|---|---|
| `2.x` | ✅ |
| `1.x` | ⚠️ Critical fixes only |
| `< 1.0` | ❌ |

Thank you for helping keep Liqo and its users safe.
