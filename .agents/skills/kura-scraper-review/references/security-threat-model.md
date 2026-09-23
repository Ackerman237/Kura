# Scraper Security Threat Model & Input Validation

This reference defines the security requirements and threat vectors for Kura web scrapers and media proxy endpoints.

*Primary sources: Apify `apify-actor-development/SKILL.md`, Secure Software Engineering (`magnus919`).*

---

## 1. Threat Vectors in Web Scraping & Media Proxying

Scrapers operate at the boundary between untrusted remote web hosts and internal application servers. They face five primary security threats:

```
[Untrusted Remote Host] ─── (Malicious Response / Redirect) ───> [Kura Scraper / Proxy] ───> [Internal Network / Client]
                                                                        │
                                                    Threats:
                                                    1. SSRF / DNS Rebinding
                                                    2. Arbitrary Remote Code / Script Injection
                                                    3. Dangerous Redirects
                                                    4. Credential / Token Leakage
                                                    5. Denial of Service (ReDoS / Memory Bloat)
```

---

## 2. Server-Side Request Forgery (SSRF) & DNS Rebinding Rules

Kura contains a media and image proxy (`src/proxy.js`, `/api/proxy`). It must strictly enforce SSRF prevention:

1. **Private / Loopback IP Blocking**:
   - Outbound requests to private, loopback, link-local, and reserved IPv4/IPv6 ranges must be rejected before request dispatch:
     - `127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`
     - `169.254.0.0/16` (Cloud metadata endpoint `169.254.169.254`)
     - `::1`, `fc00::/7`, `fe80::/10`
2. **DNS Resolution Verification**:
   - Hostnames must be resolved to IP addresses and validated against the blacklist prior to socket connection, preventing DNS rebinding attacks.
3. **Protocol Whitelisting**:
   - Only `http:` and `https:` protocols are permitted. Reject `file:`, `ftp:`, `gopher:`, `data:`, `javascript:`.
4. **Redirect Validation**:
   - HTTP 301/302/307/308 redirects must re-evaluate target URLs against the SSRF and protocol validator. Never follow redirects blindly to private addresses.

---

## 3. Remote Content Sanitization & Execution Prevention

From Apify security guidelines: **"Treat all crawled web content as untrusted input."**

1. **No Code Execution (`eval` / Shell)**:
   - Scraped titles, URLs, descriptions, or HTML snippets must never be passed to `eval()`, `new Function()`, shell execution (`exec`, `spawn`), or unescaped template literals.
2. **Sanitize Rendered HTML**:
   - If rendering scraped synopsis or author comments in the frontend, strip `<script>`, `<iframe>`, `<object>`, and inline event handlers (`onload`, `onerror`).
3. **URL Normalization**:
   - Validate and normalize extracted cover/page/video URLs using standard `new URL(url, baseUrl)` resolution. Reject malformed URI schemes.

---

## 4. Secrets & Token Isolation

1. **Credential Exposure**:
   - Proxy API keys, scraper auth cookies, or Cloudflare tokens must be loaded strictly from environment variables (`process.env`) or secure stores.
   - Never log secrets or tokens to application logs, console output, or client-side JSON responses.
2. **Referer / Cookie Header Scrubbing**:
   - When proxying media requests, strip sensitive upstream cookies and authorization headers from client responses.
