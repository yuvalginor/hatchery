# hatchery: build prompt

Status: done. This brief built hatchery 1.0.0 and is kept for history only. Do not follow it. CLAUDE.md is the playbook, DECISIONS.md records what changed since, including the move from the `hatchery-template` repo to `recipes/`.

----

I want a cloud build system for personal projects. I hand it ideas throughout the day and it builds them. This repo, `hatchery`, is the launcher: it contains the conventions, I open a claude code session, describe a project, and you create a new private GitHub repo for it, build it, provision what it needs, deliver it, and report back. Follow-up work happens in same/new sessions on the new repo.

Autonomous means no manual steps in the flow. You create the repo, the Cloudflare resources, the backend and everything else yourself. It does not mean working without me. Ask when my input changes the outcome.

One session per project. No Claude Code Projects: each project keeps its own clean context. Knowledge that applies across projects lives in hatchery's files (CLAUDE.md, DECISION-TREE.md, PROJECTS.md), not in a shared conversation.

Reporting happens in the session itself and in the project's visual frontend. Claude's push notifications tell me when a session needs me. No GitHub issues for reporting.

Projects may vary: web apps, dashboards, research and data analysis, experiments, scheduled jobs, mobile apps, desktop tools, and shapes I haven't thought of.

## Why

I build the things I want and need, and I use them from day one. I improve them iteratively while I use them. Everything below serves that.

- Build simple, ship fast, scale when needed. Build for me first. Don't build for scale nobody asked for.
- Deploy early. A working pipeline from the first hour, so I can try the project on my phone or wherever it runs.
- I use my apps during development. A change must never break or lose my saved data.
- If I can't see it and interact with it, it isn't done.

## Core rules

- Free tier only. Never enter payment details or start anything billable. If a step needs payment details or a paid plan, stop and raise it to me. Upgrade per project only if I ask.
- AI features are a per-project decision. Options: a free tier (Gemini API, Cloudflare Workers AI, others), an MCP connector so my chat agent works with the project's data (no UI, so only sometimes right), or a paid API. Present the options and let me choose. Never start a paid API without my OK.
- One private repo per project. Never a monorepo. Public only if I ask.
- Every project has a visual frontend where I see results. Even a research project gets a dashboard that communicates findings: charts, tables, a plain-language summary. Results never live only in a chat reply or a text file.
- Every project ends with two things: the artifact, ready wherever it runs, and that visual frontend showing it works: what was built, how it was verified, screenshots where relevant, how to run it. Define both before building.
- Web first. HTML/CSS/JS (TypeScript, Vite) is the default for everything, because it's generic, scales from tiny to large, and ports to other targets later. Deviate only with a stated reason.
- Static frontend. The frontend is always static files served from the CDN, even when there is a backend. Deviate only for a material reason, logged in DECISIONS.md.
- Climb the ladder only when required. Every added service needs a stated reason in the README.
- No per-project dashboard work, ever. All provisioning goes through account-level tokens.

## Tokens and environments

- One cloud environment, `hatchery-build`. Network: Limited, plus package managers, plus custom allowed domains `*.workers.dev` and `*.example.com` so sessions can check deployed sites.
- Account tokens are network secrets, never env vars. The proxy attaches them outside the session, so a session can use them but never read them.
  - Cloudflare token: host `api.cloudflare.com`, header `Authorization: Bearer`.
  - Neon key: host `console.neon.tech`, header `Authorization: Bearer`.
  - Access service token: hosts of deployed sites, headers `CF-Access-Client-Id` and `CF-Access-Client-Secret`. Lets sessions verify private deploys.
- Plain env vars: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN=placeholder`, `NEON_API_KEY=placeholder`, `WRANGLER_SEND_METRICS=false`. The placeholders only make wrangler and neonctl run.
- Sessions deploy with wrangler. Branches go to preview URLs, main to production. CI runs tests only.
- Merging: sessions work on a branch, deploy a preview, and open a PR (REST API; the proxy blocks `gh pr`). Merging to main is my call: I merge the PR, or tell the session to merge it. Never merge on your own.
- No account token is ever stored in a project repo. A scheduled job that needs data gets a narrow per-project secret, such as its own database connection string.
- Projects that crawl arbitrary websites run the crawler in their own GitHub Actions. The token-holding session only reads the collected data. Add an open-network environment only if this proves not enough.
- Minimum token scopes. Cloudflare: Workers Scripts, D1, R2, Access apps and policies, Access service tokens (edit); Account Settings, User Details, Memberships (read); on the example.com zone only, Workers Routes and DNS if custom domains need it. Never billing, members or account settings edit. Set an expiry.
- Repo creation (tested 2026-10-25): the session triggers hatchery's `create-project` workflow over the REST API. The workflow creates the private repo with the `HATCHERY_PAT` Actions secret. The session then attaches the new repo with the `add_repo` tool (access: push) and builds in it directly. No GitHub token ever enters a session. The cloud GitHub proxy blocks `POST /user/repos` and pushes to unattached repos whatever the token.

## Conventions, every project

- Organized code: split into files and modules by responsibility. No giant single files.
- Start with a plan: as a Markdown file, a design document, requirements, etc
- Tests for everything. Commits are gated on all tests passing, enforced by a pre-commit hook and in CI. The hook is committed and wired with `core.hooksPath`, so fresh clones get it. Propose a minimum test floor per project type in DECISIONS.md; at least unit tests for logic and one end-to-end check that the frontend loads and renders.
- Data preservation. Saved data carries a version field. New fields get defaults. Never rename or remove a field without a migration. The loader accepts every past version. Tests load fixtures of every past data shape. Never reset my data unless I ask.
- Secure by default. Consider the OWASP top 10. Never put dynamic text in `innerHTML`; use `textContent` or sanitize. No secrets in frontend code; proxy them through a Worker.
- Follow the Karpathy guidelines skill for Claude Code. It is a community skill based on Karpathy's guidelines (forrestchang/andrej-karpathy-skills on GitHub), not his own. Vendor it into this launcher repo under .claude/skills/, pinned to a commit, and copy it into every new repo so cloud sessions have it. Cite the source and commit in the README.
- Project notes live in the repo: CLAUDE.md for how to work on the project, and a DECISIONS.md log of choices and assumptions. Every session reads them first and updates them before finishing.
- Shareable by default: Open Graph tags, a social preview image, a clean title and description. Full SEO when the project is public-facing. Keep SEO proportionate: AI search answers informational queries directly, so don't over-invest.
- Downloadable later: build web apps as installable PWAs, and keep the code structured so wrapping it as a native app (Capacitor for mobile, Tauri for desktop) needs no rewrite.
- Hosting: always deploy. Private projects sit behind Cloudflare Access, plus noindex (robots.txt Disallow, noindex meta tag, X-Robots-Tag header). Deploy to a free workers.dev URL while in progress. Promote to a subdomain of example.com (e.g. app-name.example.com) when I say it's ready to share, or to its own domain if I give one.
- Commit identity: every commit uses my name and my GitHub no-reply email (`<id>+<login>@users.noreply.github.com`), so it counts as my contribution and never exposes my real email. Set it per repo before the first commit. This includes commits made by workflows.
- Analytics: Cloudflare Web Analytics (cookieless) whenever relevant, by default on public projects.
- Privacy: only an allowlist ships. The deploy uploads the build output folder and nothing else. Docs, tests, notes and configs never ship. Sourcemaps are off. Secrets stay server-side. Add an automated check that scans the build output before every deploy and fails the deploy on bad practice: secrets, API keys, tokens, private IP addresses, internal hostnames, stray emails, `.map` files. It is a sanity check, not a guarantee.
- Registry: add every project to PROJECTS.md in this launcher repo. One row each: name, repo, URL, public or private, services used, status.

## Scaffold and conventions sync

- New projects are created from a GitHub template repo, `hatchery-template`. It holds the tested scaffold: Vite, tests, hooks, CI, deploy, privacy check, PWA.
- Hatchery conventions are versioned. Each project records the version it follows.
- At the start of every session in a project, fetch the latest hatchery version. If it is newer, show what changed and ask me whether to update. Never update automatically.
- Feedback goes the other way too. When a project session learns something every project needs, or must update PROJECTS.md or the tree: open a PR on hatchery if it is attached, otherwise append to `HATCHERY_INBOX.md` in the project and tell me.

## Architecture decision tree

Write it as a Mermaid flowchart in DECISION-TREE.md, with short notes per branch. Start sparse:

1. Can it run in a browser? Yes (the default): web app, then climb the ladder.
2. Does it need to run without me, on a schedule or for a long time? Yes: add a scheduled or long-running backend (Cloudflare cron Workers when light, GitHub Actions when heavy, up to the 6 hour job limit), still with a web dashboard for results. Private repos share about 2,000 Actions minutes a month; budget heavy jobs against that.
3. Does it need what serverless can't do: state held between requests, live connections, long jobs? Branch off here.
4. Does it truly need to run outside a browser (native mobile, desktop, hardware)?

(expand as required for backend, databases, background workers etc. )

Web ladder:
0. Static / in-browser: data in browser storage, no backend. Prefer IndexedDB over localStorage (5MB cap). Request persistent storage. Always include export and import of the data as a file, since browser storage is per-device and can be evicted. Install as a PWA.
1. Secret or small server logic: Worker route.
2. Shared or persistent data: D1.
3. File storage: R2.
4. Outgrows SQLite: Neon.

The tree grows on demand. User accounts are the first expected example: no branch covers them yet. When a project needs them, choose the right fit then (Supabase is a candidate) and add the branch.

When a project fits no branch: pick the closest branch, explain the choice in DECISIONS.md, and after delivering, extend the tree and open a PR on this launcher repo for me to review. Only expand the tree when absolutely certain that no existing branch covers the new use case adequately.

## Deliverables in this repo

1. CLAUDE.md: the launcher playbook. Kickoff questions, walking the decision tree, repo creation, build, provision, deploy, verify the frontend actually loads and works, update PROJECTS.md, report in the session.
2. DECISION-TREE.md: the flowchart and branch notes.
3. .claude/skills/: the vendored Karpathy guidelines skill.
4. .github/workflows/create-project.yml: creates a project repo from hatchery-template on request from a session. A tested prototype is already in this repo; harden it (template generate, name checks, clear errors) rather than start over.
5. hatchery-template: the template repo. Lean. Don't template what's faster to generate.
6. scripts/setup.sh: idempotent cloud environment setup. Installs wrangler, neonctl, gh, and whatever the branches need.
7. SETUP.md: step-by-step for everything I do by hand, phone-friendly where possible:
   - Signing up for Cloudflare and Neon. Choosing a neutral workers.dev subdomain, since every project shares it.
   - Moving example.com DNS to Cloudflare without touching the site. It is hosted elsewhere and should stay there. Cover: exporting existing records from the current DNS provider, recreating them on Cloudflare with the the site host records set to DNS only, checking email records survive, switching nameservers, and verifying the site and its SSL still work after the switch.
   - Each token with the minimum permissions needed, including DNS, custom domains, Access. Where to find the account ID.
   - GitHub token type and scopes for creating private repos, setting secrets and releases. Making sure the Claude GitHub App has access to All repositories.
   - GitHub email privacy: keep my email private and block pushes that expose it.
   - Configuring the `hatchery-build` cloud environment: network access, allowed domains, network secrets, env vars, setup script. Environments are personal and picked per session.
   - A smoke test per branch I can run from my phone.

## Research and verification

Research before writing. Check current docs for Claude Code on the web (environments, network access, setup scripts, session limits, GitHub access, skills in cloud sessions), wrangler, Cloudflare free-plan limits, API token permissions, custom domains and Access, the site host with external DNS, Cloudflare Workers custom domains, Neon free plan and API, GitHub token scopes and Actions limits for private repos, browser storage limits and eviction (especially Safari), PWA, Capacitor and Tauri build options, free AI options (Workers AI, Gemini API free tier). Things change, don't rely on memory. Cite the doc pages in SETUP.md.

Repo creation is already tested; see Tokens and environments. Do not redo it.

Settle during the build, by research or test, and record the answer in DECISIONS.md or SETUP.md:
- Does the proxy's network secret replace the placeholder `Authorization` header wrangler and neonctl send? Write a test into SETUP.md: `wrangler whoami` and `neonctl me`. If it fails, propose the cleanest alternative.
- Can a session set a project repo's Actions secrets through the GitHub proxy?
- Do Workers custom domains need zone DNS edit? Does Neon offer keys narrower than the personal API key?
- Do R2 or Cloudflare Zero Trust (Access) require a payment method? If so, the payment rule applies: flag it to me.
- Free AI options: Gemini API free tier limits and data use, Workers AI daily allowance.

Results of the earlier repo-creation tests are on branches `test/results-a`, `test/results-b-c`, `test/results-d`. Fold anything useful into SETUP.md, then delete those branches and the `request/hatchery-test-b2` branch, and remove TEST-PLAN.md.

Writing style for every file: short declarative sentences, no em-dashes, no buzzwords, no filler. Every line earns its place.

When done, give me a short summary and point me to SETUP.md.

