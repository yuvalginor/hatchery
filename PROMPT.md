# hatchery: build prompt (draft)

Status: work in progress. Do not execute yet.

----

I want a cloud build system for personal projects. I hand it ideas throughout the day and it builds them. This repo, `hatchery`, is the launcher: it contains the conventions, I open a claude code session, describe a project, and you create a new private GitHub repo for it, build it, provision what it needs, deliver it, and report back. Follow-up work happens in same/new sessions on the new repo.

Autonomous means no manual steps in the flow. You create the repo, the Cloudflare resources, the backend and everything else yourself. It does not mean working without me. Ask when my input changes the outcome.

Reporting happens in the session itself and in the project's visual frontend. Claude's push notifications tell me when a session needs me. No GitHub issues for reporting.

Projects may vary: web apps, dashboards, research and data analysis, experiments, scheduled jobs, mobile apps, desktop tools, and shapes I haven't thought of.

## Core rules

- Free tier only. Never enter payment details or start anything billable. If a step needs payment details or a paid plan, stop and raise it to me. Upgrade per project only if I ask.
- One private repo per project. Never a monorepo. Public only if I ask.
- Every project has a visual frontend where I see results. Even a research project gets a dashboard that communicates findings: charts, tables, a plain-language summary. Results never live only in a chat reply or a text file.
- Every project ends with two things: the artifact, ready wherever it runs, and that visual frontend showing it works: what was built, how it was verified, screenshots where relevant, how to run it. Define both before building.
- Web first. HTML/CSS/JS (TypeScript, Vite) is the default for everything, because it's generic, scales from tiny to large, and ports to other targets later. Deviate only with a stated reason.
- Climb the ladder only when required. Every added service needs a stated reason in the README.
- No per-project dashboard work, ever. All provisioning goes through account-level tokens in the cloud environment: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, NEON_API_KEY, GH_TOKEN.

## Conventions, every project

- Organized code: split into files and modules by responsibility. No giant single files.
- Start with a plan: as a Markdown file, a design document, requirements, etc
- Tests for everything. Commits are gated on all tests passing, enforced by a pre-commit hook and in CI.
- Follow the Karpathy guidelines skill for Claude Code. Find the canonical version on GitHub, vendor it into this launcher repo under .claude/skills/, and copy it into every new repo so cloud sessions have it. Cite the source in the README.
- Project notes live in the repo: CLAUDE.md for how to work on the project, and a DECISIONS.md log of choices and assumptions. Every session reads them first and updates them before finishing.
- Shareable by default: Open Graph tags, a social preview image, a clean title and description. Full SEO when the project is public-facing.
- Downloadable later: build web apps as installable PWAs, and keep the code structured so wrapping it as a native app (Capacitor for mobile, Tauri for desktop) needs no rewrite.
- Hosting: always deploy. Private projects sit behind Cloudflare Access. Deploy to a free workers.dev URL while in progress. Promote to a subdomain of example.com (e.g. app-name.example.com) when I say it's ready to share, or to its own domain if I give one.
- Privacy: the deployed output must be clean. Secrets stay server-side. Add an automated check that scans the build output before every deploy and fails the deploy on bad practice: secrets, API keys, tokens, private IP addresses, internal hostnames, stray emails. It is a sanity check, not a guarantee.
- Registry: add every project to PROJECTS.md in this launcher repo. One row each: name, repo, URL, public or private, services used, status.

## Architecture decision tree

Write it as a Mermaid flowchart in DECISION-TREE.md, with short notes per branch. Start sparse:

1. Can it run in a browser? Yes (the default): web app, then climb the ladder.
2. Does it need to run without me, on a schedule or for a long time? Yes: add a scheduled or long-running backend (Cloudflare cron Workers when light, GitHub Actions when heavy, up to the 6 hour job limit), still with a web dashboard for results.
3. Does it truly need to run outside a browser (native mobile, desktop, hardware)?

(expand as required for backend, databases, background workers etc. )

Web ladder:
0. Static / in-browser: data in browser storage, no backend. Prefer IndexedDB over localStorage (5MB cap). Request persistent storage. Always include export and import of the data as a file, since browser storage is per-device and can be evicted. Install as a PWA.
1. Secret or small server logic: Worker route.
2. Shared or persistent data: D1. Auth only if multi-user.
3. File storage: R2.
4. Outgrows SQLite: Neon.
No Supabase.

When a project fits no branch: pick the closest branch, explain the choice in DECISIONS.md, and after delivering, extend the tree and open a PR on this launcher repo for me to review. Only expand the tree when absolutely certain that no existing branch covers the new use case adequately.

## Deliverables in this repo

1. CLAUDE.md: the launcher playbook. Kickoff questions, walking the decision tree, repo creation, build, provision, deploy, verify the frontend actually loads and works, update PROJECTS.md, report in the session.
2. DECISION-TREE.md: the flowchart and branch notes.
3. .claude/skills/: the vendored Karpathy guidelines skill.
4. templates/: CLAUDE.md, DECISIONS.md, pre-commit hook, CI with test gating, deploy workflow, the build-output privacy check. Keep it lean. Don't template what's faster to generate.
5. scripts/setup.sh: idempotent cloud environment setup. Installs wrangler, neonctl, gh, and whatever the branches need.
6. SETUP.md: step-by-step for everything I do by hand, phone-friendly where possible:
   - Signing up for Cloudflare and Neon.
   - Moving example.com DNS to Cloudflare without touching the site. It is hosted elsewhere and should stay there. Cover: exporting existing records from the current DNS provider, recreating them on Cloudflare with the the site host records set to DNS only, checking email records survive, switching nameservers, and verifying the site and its SSL still work after the switch.
   - Each token with the minimum permissions needed, including DNS, custom domains, Access. Where to find the account ID.
   - GitHub token type and scopes for creating private repos, setting secrets and releases. Making sure the Claude GitHub App has access to All repositories.
   - Configuring the Claude Code cloud environment: env vars, network access, setup script. Recommend whether I need two environments (a locked-down one for builds, an open one for data collection) and explain the trade-off. Check whether environments apply to all repos or get picked per session.
   - A smoke test per branch I can run from my phone.

## Research and verification

Research before writing. Check current docs for Claude Code on the web (environments, network access, setup scripts, session limits, GitHub access, skills in cloud sessions), wrangler, Cloudflare free-plan limits, API token permissions, custom domains and Access, the site host with external DNS, Cloudflare Workers custom domains, Neon free plan and API, GitHub token scopes and Actions limits for private repos, browser storage limits and eviction (especially Safari), PWA, Capacitor and Tauri build options. Things change, don't rely on memory. Cite the doc pages in SETUP.md.

Verify what you can from this session. Specifically, test whether a cloud session started here can create a new private repo and push to it. If not, find the cleanest workaround and document it.

Writing style for every file: short declarative sentences, no em-dashes, no buzzwords, no filler. Every line earns its place.

When done, give me a short summary and point me to SETUP.md.

----

## Open questions (not part of the prompt yet)

- Repo creation from a cloud session. The GitHub proxy limits API calls to the repos attached to the session. Candidate paths, untested:
  - A: `GH_TOKEN` env var with `gh api -X POST /user/repos`. Unclear whether the proxy's repo scope applies to a token I supply.
  - B: a `create-project` workflow in hatchery, triggered by the session over REST. A PAT stored as a hatchery Actions secret creates the repo. The session never holds the token.
  - C: run hatchery as a Claude Code Project. Threads can add a repo to themselves mid-task if the Claude GitHub App covers it.
  - Plan: one cloud session on hatchery tries A, B and C and reports what works.
- Token storage: network secrets for Cloudflare and Neon instead of env vars. Pending the blast radius discussion.
- One or two cloud environments.
- R2 may require a payment method on file.
- Actions minutes: about 2,000 a month for private repos, macOS runners count 10x.
- iOS needs a paid Apple developer account. Out of scope unless I ask?
- Pre-commit hook must be committed (`core.hooksPath`) so fresh clones get it.
- The Karpathy skill is a community repo. Pin a commit. Projects threads do not load repo skills.
- Minimum test floor per project type.

From the conventions review, to decide:
- Adopt: commit identity set to the GitHub no-reply email in every repo. Privacy scan also covers repo tree and commit authors before a repo goes public.
- Adopt: branch previews. Branches deploy to a preview URL, main is production. Decide who merges to main.
- Adopt: a GitHub template repo for the scaffold, so creation is one `generate` call.
- Adopt: a way for project sessions to feed back to hatchery (PR when attached, inbox file otherwise). Keeps PROJECTS.md and the tree current.
- Adopt: versioned saved data with migrations and fixture tests.
- Adopt: noindex headers as a second layer behind Access.
- Gap: verifying a deploy behind Access needs an Access service token.
- Gap: the workers.dev account subdomain is shared by all projects. Pick a neutral one.
- Gap: Vite sourcemaps must be off or caught by the privacy scan.
- Check: Zero Trust onboarding may ask for a card.
- Push back: no self-updating hooks that run launcher code in every project.
