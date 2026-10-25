# Setup

Everything you do by hand, once. Do the steps in order. "Phone" steps work on a phone; "desktop" steps want a big screen. Sources are at the end.

## Decide first: payment details on free plans

Two Cloudflare products ask for a payment method even on their free plans. The payment rule says I stop and ask, so this is your decision:

- **Zero Trust, for Access.** Access is the sign-in in front of every private project. Onboarding asks for payment details even for the Free plan, which costs nothing. Without it, private projects are only hidden by an unlisted URL and `noindex`. Sessions refuse the first deploy of a project until Access works.
- **R2, for file storage.** Needs an R2 subscription with a payment method, even at zero usage. Not needed yet. Small files fit in D1 until a project needs more.

Recommendation: add a payment method for Zero Trust in step 4, and skip R2 until a project needs it.

## 1. GitHub settings (phone)

1. Settings > Emails: tick **Keep my email addresses private** and **Block command line pushes that expose my email**. Your no-reply address is `ID+USERNAME@users.noreply.github.com`. Every hatchery commit uses it.
2. Settings > Applications > Installed GitHub Apps > Claude > Configure: **Repository access: All repositories**. New project repos must be attachable the moment they exist.

## 2. Cloudflare account (phone)

1. Sign up at dash.cloudflare.com/sign-up and verify the email.
2. My Profile > Authentication: turn on two-factor authentication.

## 3. workers.dev subdomain and account ID (phone)

1. Workers & Pages > **Change** next to **Your subdomain**. Pick something neutral and short, such as `yg-apps`. Every project shares it: URLs look like `<project>.<subdomain>.workers.dev`.
2. Workers & Pages > Account Details: copy the **Account ID**. You need it in step 8.

## 4. Zero Trust and Access (phone)

Only if you chose to add a payment method.

1. Dashboard > **Zero Trust**. Choose a team name, select the **Free** plan, enter payment details. You will not be charged.
2. Zero Trust > Integrations > Identity providers > **Add new identity provider** > **One-time PIN**. You sign in to private projects with a code sent to your Cloudflare email.
3. Zero Trust > Access controls > Service credentials > Service Tokens > **Create Service Token**. Name: `hatchery-sessions`. Duration: 1 year. Select **Generate token**. Keep the page open: the Client Secret shows only once, and it goes straight into step 8. Never paste it into a chat.

The Access app itself is created by a session in step 9.

## 5. Cloudflare API token (desktop is easier)

My Profile > API Tokens > Create Token > **Create Custom Token**. Name: `hatchery`.

| Group | Permission | Access | Why |
| --- | --- | --- | --- |
| Account | Workers Scripts | Edit | Deploy Workers, Previews, custom domains, secrets |
| Account | D1 | Edit | Create databases, run migrations |
| Account | Access: Apps and Policies | Edit | The Access app for all Workers, public bypasses |
| Account | Access: Service Tokens | Edit | Find and rotate the sessions token |
| Account | Account Settings | Read | wrangler reads account details |
| User | User Details | Read | `wrangler whoami`, the Access policy email |
| User | Memberships | Read | wrangler finds the account |

- Account Resources: Include > your account.
- Client IP Address Filtering: leave empty. Sessions call from Anthropic's network.
- TTL: end date one year out. Put a reminder in your calendar.
- Later, by editing the token: after step 11, add Zone > **Workers Routes** > Edit with Zone Resources: Include > Specific zone > `example.com`. Add Zone > **DNS** > Edit on that zone only if smoke test 5 fails. Add Account > **Workers R2 Storage** > Edit only if you approve R2.
- Never: Billing, Members, Account Settings Edit, API Tokens.

Copy the token. It goes into step 8.

## 6. GitHub token HATCHERY_PAT (phone)

The `create-project` and `project-secret` workflows use it. Sessions never see it.

The existing token creates repos but lacks the Secrets permission (tested: "Resource not accessible by personal access token"). Either edit it, or replace it:

- **Edit:** Settings > Developer settings > Personal access tokens > Fine-grained tokens > the hatchery token > Edit. Add Repository permissions > **Secrets: Read and write**. The token value stays the same.
- **Replace:** open this prefilled form, then set **Repository access: All repositories** (the one field a link cannot fill):
  `https://github.com/settings/personal-access-tokens/new?name=HATCHERY_PAT&description=hatchery+workflows:+create+project+repos,+set+their+Actions+secrets&target_name=OWNER&expires_in=366&administration=write&contents=read&secrets=write`
  Then hatchery > Settings > Secrets and variables > Actions > `HATCHERY_PAT` > Update.

The token needs, on all repositories: **Administration** read and write (create repos, mark the template), **Contents** read (copy the template), **Secrets** read and write (project secrets), and **Metadata** read (automatic). It needs nothing for releases: sessions cannot create releases, so project workflows publish them with their own `GITHUB_TOKEN`.

## 7. Neon (phone)

1. Sign up at console.neon.tech on the Free plan.
2. Account settings > API keys > **Create new API key**. Name: `hatchery`. A personal key, because hatchery creates one Neon project per project; a project-scoped key cannot. Neon keys never expire: rotate yearly.

## 8. The hatchery-build cloud environment (phone or desktop)

At claude.ai/code, open the environment selector under the message box > **New environment**. Environments are personal. Pick this one for every hatchery and project session.

1. **Name:** `hatchery-build`.
2. **Network access:** **Custom** (newer apps call it **Limited**). Tick **Also include default list of common package managers**. Allowed domains:
   ```
   *.workers.dev
   *.example.com
   example.com
   ```
3. **Network secrets.** Add three. The proxy attaches them outside the session, so sessions use them without seeing them.
   - Cloudflare. Allowed websites: `api.cloudflare.com`. Header `Authorization`, prefix `Bearer`, value: the step 5 token.
   - Neon. Allowed websites: `console.neon.tech`. Header `Authorization`, prefix `Bearer`, value: the step 7 key.
   - Access. Allowed websites: `*.<subdomain>.workers.dev` and `*.example.com`, with your subdomain from step 3. Never `*.workers.dev`: that sends the token to every Workers site on the internet. Two header rows, prefix cleared: `CF-Access-Client-Id` with the Client ID, and `CF-Access-Client-Secret` with the Client Secret from step 4.
     If the form takes only one header: header `X-Hatchery-Access`, no prefix, value `{"cf-access-client-id":"<ID>","cf-access-client-secret":"<SECRET>"}`. In step 9, ask for `ACCESS_TOKEN_HEADER=X-Hatchery-Access scripts/access.sh init`.
4. **Environment variables:**
   ```
   CLOUDFLARE_ACCOUNT_ID=<account ID from step 3>
   CLOUDFLARE_API_TOKEN=placeholder
   NEON_API_KEY=placeholder
   WRANGLER_SEND_METRICS=false
   WRANGLER_SEND_ERROR_REPORTS=false
   ```
   The placeholders only make wrangler and neonctl start. `WRANGLER_SEND_ERROR_REPORTS=false` stops wrangler from asking about crash reports.
5. **Setup script:** paste the contents of `scripts/setup.sh` from this repo. It installs wrangler, neonctl and PyNaCl in about 15 seconds and the environment caches the result.
6. **Save.**

## 9. First session: checks and Access (phone)

First merge the hatchery branch that added this file. Workflows only run from `main`.

Start a session on hatchery in `hatchery-build` and send:

> Run scripts/check-env.sh. If only the Access check fails, run scripts/access.sh init and run the checks again. Report the result.

Every line should say OK. This settles the open question from the build: whether the proxy replaces the placeholder that `wrangler` and `neonctl` send. If those two checks fail and the `curl` checks pass, see "Fallback for CLI tokens" below.

## 10. Clean up test leftovers (phone)

Sessions cannot delete branches or repos; the GitHub proxy blocks both.

- hatchery > Branches: delete `test/results-a`, `test/results-b-c`, `test/results-d` and `request/hatchery-test-b2`. Their useful results are in DECISIONS.md.
- Delete the test repos, each in Settings > Danger zone: `hatchery-test-b1`, `hatchery-test-b2`, `hatchery-test-d`, `hatchery-test-gen`.

## 11. Move example.com DNS to Cloudflare (desktop)

The site stays on the site host. Only the DNS moves. Plan for an evening; nameserver changes can take up to 24 hours.

1. **Snapshot what exists.** At your current DNS provider, export the zone file if it offers one. Otherwise write down every record: A, AAAA, CNAME, MX, TXT (SPF, DKIM, DMARC, site verifications), CAA, SRV. Note the current nameservers too: that is your rollback.
   If the nameservers are the site host's, the apex and `www` records are host-internal. You recreate them by hand in step 4.
2. **DNSSEC.** If it is on at your registrar, turn it off first by removing the DS record. Wait at least the DS record's TTL before step 5.
3. **Add the domain.** Cloudflare dashboard > Add a domain > `example.com` > Free plan. Review the records Cloudflare scanned. If you have a zone file: DNS > Records > Import and Export, and untick **Proxy imported DNS records**.
4. **the site host records, DNS only (grey cloud):**
   - Apex `example.com`: CNAME to `the host's apex target` (Cloudflare flattens it), or A to `<host IP>`. Delete any other apex A record, such as `<old IP>`.
   - `www`: CNAME to `the host's site name`.
   - Every record pointing at the site host must be DNS only. Proxied records break the site host's certificates.
5. **Email records.** Copy MX, SPF, DKIM and DMARC exactly. All DNS only. If you have CAA records, keep `letsencrypt.org` for the site host.
6. **Compare.** Every record from step 1 exists in Cloudflare with the same value.
7. **Switch nameservers** at your registrar to the two Cloudflare gives you. Exact names.
8. **Verify** once Cloudflare marks the domain Active:
   - `https://example.com` and `https://www.example.com` load with a valid padlock.
   - the site host > Domain management lists both names and shows HTTPS enabled. If the certificate errors, select Renew certificate.
   - Send yourself mail at the domain and receive it. Check MX, SPF and DMARC with toolbox.googleapps.com/apps/dig.
   - If your nameservers were the site host's: only now delete the the site host DNS zone, then check the custom domain is still on the site.
9. **Rollback** if something breaks: set the old nameservers back at the registrar.
10. **Optional:** turn DNSSEC on in Cloudflare and add its DS record at the registrar.
11. **Token:** edit the step 5 token and add Zone > Workers Routes > Edit for `example.com`.

## 12. Web Analytics (phone, after step 11)

Analytics & Logs > Web Analytics > Add a site > hostname `example.com` > manual setup. Copy the `token` value from the snippet. It is public by design: it ships in page source. Paste it in a hatchery session and ask to record it in CLAUDE.md. The snippet works for every `*.example.com` subdomain, so public projects share it. Creating one site per project would need Account Settings Edit on the token, which it must not have.

## 13. Smoke tests per branch (phone)

Send each in a new hatchery session in `hatchery-build`, in order. Each builds on `smoke-web`.

1. **Environment:** "Run scripts/check-env.sh." Expect all OK.
2. **Web app, rung 0:** "New project smoke-web: a one-page list app. Take every default." Expect a link that asks you to sign in with a code, an app you can install, and a green status page.
3. **Branch Preview and PR:** "In smoke-web, change the title on a branch." Expect a Preview URL behind sign-in and a PR that you merge.
4. **Worker and D1, rungs 1 and 2:** "In smoke-web, add a shared counter: a Worker route backed by D1." Expect the Preview to use `smoke-web-preview`, so clicks there never change production.
5. **Public and custom domain:** "Make smoke-web public at smoke-web.example.com with analytics." Expect it loads without sign-in and Web Analytics shows the visit. If the deploy fails with an authentication error, add Zone DNS Edit (step 5).
6. **Schedule, branch 2:** "Add a daily cron to smoke-web that records the date in D1 and shows the last run on the status page." It uses one of the account's 5 cron triggers.
7. **Actions secret:** "Set an Actions secret HELLO=world on smoke-web with project-secret, then prove the job sees it by printing its SHA-256 from a workflow." Expect `sha256("world")`.
8. **Neon, rung 4:** "Create a Neon project for smoke-web and show its row count on the status page."
9. **Android, branch 4:** "Wrap smoke-web with Capacitor and build a debug APK in Actions." Expect an APK artifact you can install.
10. **Clean up:** "Delete smoke-web's Worker, D1 databases, Neon project and cron, and its PROJECTS.md row." Then delete the repo by hand.

Not smoke-tested on purpose: R2 (payment method), iOS and macOS builds (paid Apple membership, 10x Actions minutes).

## Fallback for CLI tokens

If `curl` reaches Cloudflare and Neon but `wrangler whoami` or `neonctl me` fail, the proxy adds the secret but does not replace a header the tool already sends. The cleanest fallback: delete that secret and put the real token in the environment variable instead (`CLOUDFLARE_API_TOKEN` or `NEON_API_KEY`). Sessions can then read it, so keep the scopes minimal and the expiry short. Hatchery's own scripts keep working either way.

## What sessions can and cannot do on GitHub (tested 2026-10-24 and 25)

| Works | Blocked by the GitHub proxy |
| --- | --- |
| REST calls on attached repos | GraphQL, so `gh pr` and `gh issue` |
| Dispatching workflows on `main`, reading runs, jobs and annotations | Job logs (redirect to a blocked host; the GitHub MCP tools can read them) |
| `add_repo` to attach a new repo, then clone and push | Creating repos, with any token |
| Opening and closing PRs | Repo settings, Actions secrets and variables, releases |
| Pushing branches | Deleting branches, pushing tags |

The workflows cover the gaps: `create-project` creates and marks repos, `project-secret` sets secrets.

## Sources

Claude Code
- Cloud environments: network access, network secrets, setup scripts, caching, limits. https://code.claude.com/docs/en/cloud-environments
- Cloud sessions, GitHub proxy, limits. https://code.claude.com/docs/en/claude-code-on-the-web
- Skills in cloud sessions. https://code.claude.com/docs/en/skills#skills-in-cowork-and-cloud-sessions

Cloudflare
- workers.dev subdomain. https://developers.cloudflare.com/workers/configuration/routing/workers-dev/
- Account ID. https://developers.cloudflare.com/fundamentals/account/find-account-and-zone-ids/
- Create an API token. https://developers.cloudflare.com/fundamentals/api/get-started/create-token/
- Token permissions. https://developers.cloudflare.com/fundamentals/api/reference/permissions/
- Workers limits and pricing. https://developers.cloudflare.com/workers/platform/limits/ and https://developers.cloudflare.com/workers/platform/pricing/
- D1 limits. https://developers.cloudflare.com/d1/platform/limits/
- R2 pricing and subscription. https://developers.cloudflare.com/r2/pricing/ and https://developers.cloudflare.com/r2/get-started/
- Durable Objects pricing. https://developers.cloudflare.com/durable-objects/platform/pricing/
- Workers AI pricing. https://developers.cloudflare.com/workers-ai/platform/pricing/
- Zero Trust setup, payment details. https://developers.cloudflare.com/cloudflare-one/setup/
- Access for Workers. https://developers.cloudflare.com/workers/configuration/cloudflare-access/
- Service tokens, single header. https://developers.cloudflare.com/cloudflare-one/access-controls/service-credentials/service-tokens/
- Previews. https://developers.cloudflare.com/workers/previews/
- Version URLs. https://developers.cloudflare.com/workers/versions-and-deployments/version-urls/
- Custom domains. https://developers.cloudflare.com/workers/configuration/routing/custom-domains/
- Static assets headers. https://developers.cloudflare.com/workers/static-assets/headers/
- Wrangler environment variables. https://developers.cloudflare.com/workers/wrangler/system-environment-variables/
- Change nameservers. https://developers.cloudflare.com/dns/zone-setups/full-setup/setup/
- Import DNS records. https://developers.cloudflare.com/dns/manage-dns-records/how-to/import-and-export/
- Web Analytics FAQ. https://developers.cloudflare.com/web-analytics/faq/
- API schema, permissions per endpoint. https://github.com/cloudflare/api-schemas

Neon
- Plans. https://neon.com/docs/introduction/plans
- API keys. https://neon.com/docs/manage/api-keys
- CLI. https://neon.com/docs/cli/install and https://neon.com/docs/cli/me

GitHub
- Fine-grained tokens and prefilled links. https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens
- Permissions per endpoint. https://docs.github.com/en/rest/authentication/permissions-required-for-fine-grained-personal-access-tokens
- Email privacy. https://docs.github.com/en/account-and-profile/how-tos/email-preferences/setting-your-commit-email-address
- Blocking pushes that expose your email. https://docs.github.com/en/account-and-profile/how-tos/email-preferences/blocking-command-line-pushes-that-expose-your-personal-email-address
- Installed GitHub Apps. https://docs.github.com/en/apps/using-github-apps/reviewing-and-modifying-installed-github-apps
- Create a repo from a template. https://docs.github.com/en/rest/repos/repos#create-a-repository-using-a-template
- Actions billing and free minutes. https://docs.github.com/en/billing/concepts/product-billing/github-actions
- Actions limits. https://docs.github.com/en/actions/reference/limits

the site host
- External DNS. the site host's docs on external DNS

Web platform
- Storage quotas and eviction, Safari included. https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria
- WebKit storage policy. https://webkit.org/blog/14403/updates-to-storage-policy/
- Installable PWAs. https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable

Native wrappers
- Capacitor environment setup. https://capacitorjs.com/docs/getting-started/environment-setup
- Tauri in GitHub Actions. https://v2.tauri.app/distribute/pipelines/github/

AI
- Gemini API pricing and free tier. https://ai.google.dev/gemini-api/docs/pricing
- Gemini API rate limits. https://ai.google.dev/gemini-api/docs/rate-limits
- Gemini API terms, unpaid services. https://ai.google.dev/gemini-api/terms
