## 2026-02-23 - [Input Validation for Static Assets]
**Vulnerability:** Game logic blindly trusted `symbols.json` content for file paths, potentially allowing Path Traversal or loading of unintended resources if the file was tampered with (e.g., via compromised CDN).
**Learning:** Even "static" JSON configuration files should be treated as untrusted input. Validating file paths against a strict whitelist (e.g., relative path, specific extension, no `..`) prevents unexpected behavior and potential exploits.
**Prevention:** Implement strict schema validation and path sanitization for all external data loaded by the application, regardless of source.

## 2026-02-23 - [Playwright Localhost Resolution]
**Vulnerability:** Playwright scripts using `localhost` failed due to IPv6 resolution (`::1`) when the server only listened on IPv4 (`127.0.0.1`).
**Learning:** Reliability of local verification scripts depends on explicit IP binding. `localhost` is ambiguous.
**Prevention:** Use `127.0.0.1` explicitly in local verification scripts to avoid IPv6/IPv4 mismatches.
