# 🛡️ GuardRail AI

> AI-powered security scanning for Next.js applications. Finds vulnerabilities in your pull requests and tells you exactly how to fix them.

![GuardRail AI Banner](https://img.shields.io/badge/GuardRail-AI%20Security-blue?style=for-the-badge&logo=shield)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## What it does

GuardRail AI is a GitHub Action that runs on every pull request in your Next.js project. It:

1. **Scans changed files** for 20+ security vulnerabilities specific to Next.js/TypeScript
2. **Uses Gemini AI** to explain each finding in plain English and suggest a specific fix
3. **Posts a PR comment** with clear, actionable results — no dashboard to open, no context switching

Built for teams who want security as part of the developer workflow, not a blocker after it.

---

## PR Comment Example

When GuardRail finds issues, it posts a comment like this directly on your PR:

```
🛡️ GuardRail AI Security Scan

Found 2 issues in this PR — 🔴 1 CRITICAL · 🟠 1 HIGH

---

🔴 CRITICAL — Hardcoded API Key
File: app/api/generate/route.ts · Line 8

const apiKey = "sk-proj-abc123xyzREALKEY"

What's wrong: This API key is now permanently embedded in your git history.
Even if you delete it in the next commit, it's recoverable forever.

How to fix: Move the key to an environment variable.

const apiKey = process.env.GEMINI_API_KEY
if (!apiKey) throw new Error('GEMINI_API_KEY is not set')
```

---

## Quick Start

**1. Add to your project** — copy `.github/workflows/example.yml` into your repo:

```yaml
name: GuardRail AI Security Scan

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  guardrail:
    name: Security Scan
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
      - name: Run GuardRail AI
        uses: montech-stack/guardrail@v1
        with:
          gemini-api-key: ${{ secrets.GEMINI_API_KEY }}
```

**2. Add your Gemini API key** to repository secrets as `GEMINI_API_KEY`

Get a free key at [aistudio.google.com](https://aistudio.google.com/apikey)

**3. Open a PR** — GuardRail will scan it automatically

---

## What GuardRail catches

| Category | Rules |
|---|---|
| 🔑 **Secrets** | Hardcoded API keys, passwords, tokens, AWS keys, private keys, DB connection strings |
| 🧨 **XSS** | `dangerouslySetInnerHTML`, `innerHTML`, `eval()`, `new Function()`, `javascript:` hrefs |
| 💉 **Injection** | SQL injection via template literals, command injection, NoSQL injection, path traversal, SSRF |
| 🔐 **Auth** | Missing auth in API routes, JWT vulnerabilities, wildcard CORS, insecure cookies, missing CSRF |
| 📤 **Exposure** | Server secrets in client components, sensitive data in responses, verbose error messages, debug endpoints |

---

## Configuration

```yaml
- uses: montech-stack/guardrail@v1
  with:
    gemini-api-key: ${{ secrets.GEMINI_API_KEY }}

    # Minimum severity to report (critical, high, medium, low)
    severity-threshold: 'low'

    # Fail the PR check at this severity or above (or 'never')
    fail-on-severity: 'critical'
```

### Suppress a finding

Add `// guardrail-ignore` to the line to suppress it:

```typescript
const value = dangerousInput; // guardrail-ignore
```

---

## Outputs

| Output | Description |
|---|---|
| `issues-found` | Total number of issues found |
| `critical-count` | Number of critical severity issues |
| `high-count` | Number of high severity issues |

---

## Tech stack

- **Runtime:** Node.js 20, TypeScript
- **GitHub:** `@actions/core`, `@actions/github`  
- **AI:** Google Gemini 1.5 Flash
- **Bundle:** `@vercel/ncc` (single-file dist, no install step)

---

## Contributing

PRs welcome. To add a new rule, add a pattern to the appropriate file in `src/rules/` and it will be picked up automatically.

---

## License

MIT © [Michael James](https://github.com/montech-stack)
