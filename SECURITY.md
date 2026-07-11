# Security policy

## Supported versions

| Version | Support |
| --- | --- |
| Current `main` | Supported |
| Older tags | Critical issues when practical |
| Independently modified forks | Contact the fork owner |

## Reporting a vulnerability

Do not publish exploit details, secrets, or private user content in an issue, discussion, or pull request.

1. Open the repository’s **Security** tab.
2. Use **Report a vulnerability** when private vulnerability reporting is available.
3. Otherwise, open a minimal public issue that only asks the maintainer for a private reporting channel.

Include the affected version or commit, impact, minimum reproduction, realistic abuse case, and any proposed mitigation. Do not send real credentials, personal journal content, or unnecessary personal data.

## Important guidance for archive owners

Shiori generates a publishable static site. Never record:

- passwords, API keys, tokens, cookies, private keys, or connection strings;
- private source code, customer data, or confidential project details;
- precise addresses, identity documents, or unnecessary contact information;
- sensitive medical or financial data;
- information about another person without their permission.

`draft: true` excludes a record from generated output, but it does not hide a Markdown file committed to a public GitHub repository. Shiori is not a secret store.

If a secret is committed, deleting the file is not enough because Git history and deployments may retain it. Revoke and rotate the credential immediately, then remove it from history and invalidate affected deployments.

## Implementation defenses

- Raw HTML from Markdown is escaped rather than executed.
- Unsafe URL schemes such as `javascript:` are rejected.
- Content language and text direction are validated independently of interface locale.
- Translation conflicts and duplicate public routes fail the build.
- Generated scripts are external and compatible with the project CSP.
- Cloudflare headers restrict framing, permissions, referrers, and executable content.
- Smoke tests reject inline event handlers, unsafe URLs, missing language metadata, and broken internal references.
