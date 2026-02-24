## 2025-02-12 - CSP Alignment Mismatch
**Vulnerability:** The Apache server configuration (`.htaccess`) was explicitly set to a "Relaxed Sub-site Policy" allowing `unsafe-eval` and `https:` wildcards, while the client-side HTML meta tags enforced a strict policy.
**Learning:** This created a potential security gap where removing the client-side meta tag (e.g., during development or by accident) would silently degrade security to a very permissive level.
**Prevention:** Ensure server-side security headers (CSP) align strictly with client-side requirements (meta tags) to provide consistent defense-in-depth. Removed `unsafe-eval` from `.htaccess` as Phaser 3 runs without it.
