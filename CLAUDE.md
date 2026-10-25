# CLAUDE.md: hatchery launcher playbook

I open a session here, describe a project, and you take it from idea to a deployed, verified app in its own private repo. Follow this file. DECISION-TREE.md picks the architecture. PROJECTS.md lists every project. SETUP.md covers what I did by hand.

## Ground rules

- Free tier only. Never enter payment details or start anything billable. If a step needs a payment method or a paid plan, stop and ask me.
- Ask when my answer changes the outcome. Otherwise pick the sensible default, say so, and go.
- One session per project. Knowledge for every project goes into these files, not into chat.
- Never print, store or commit an account token. The proxy adds them: `curl` to `api.cloudflare.com` or `console.neon.tech` needs no auth header, and `wrangler` and `neonctl` run with the placeholder values in the environment.
- Use the Karpathy guidelines skill (`.claude/skills/karpathy-guidelines`).
- When you need me, or finish a long task, send a push notification.
- Write every file in short declarative sentences. No em-dashes, buzzwords or filler.

## 1. Kickoff

Ask in one message, with your proposed answer for each, so I can reply "yes" or change one line:

1. What it is, in one sentence, and who uses it: only me, or others too.
2. Done means: the artifact, where it runs, and what the visual frontend shows. Define both before building.
3. Data: what gets saved, and whether it must sync across devices or people.
4. Does anything run without me: a schedule, a long job, a crawler?
5. AI features: none, or one of the options in DECISION-TREE.md. Never a paid API without my OK.
6. Repo name: 1 to 32 characters, lowercase letters, digits, dashes. It becomes the Worker name and the URL.
7. Private (default) or public.

## 2. Plan

Walk DECISION-TREE.md. Climb only as far as the project needs. Then write the plan as `PLAN.md` in the new repo: goal, done criteria, architecture path with the reason for each service, data shape, test floor, milestones. Show me the plan summary before building anything past the first deploy.

If no branch fits, take the closest, explain it in the project's DECISIONS.md, and after delivery extend DECISION-TREE.md in a hatchery PR.

## 3. Create the repo

Sessions cannot create repos. The `create-project` workflow does it with `HATCHERY_PAT`.

```sh
run=$(gh api -X POST repos/OWNER/hatchery/actions/workflows/create-project.yml/dispatches \
  -f ref=main -f "inputs[name]=$NAME" -f "inputs[description]=$DESCRIPTION" \
  -F return_run_details=true --jq .workflow_run_id)
until [ "$(gh api repos/OWNER/hatchery/actions/runs/$run --jq .status)" = completed ]; do sleep 5; done
gh api repos/OWNER/hatchery/actions/runs/$run --jq .conclusion
job=$(gh api repos/OWNER/hatchery/actions/runs/$run/jobs --jq '.jobs[0].id')
gh api repos/OWNER/hatchery/check-runs/$job/annotations --jq '.[] | "\(.title): \(.message)"'
```

The annotations carry the result or a clear error. Then:

1. Attach the repo with the `add_repo` tool, `access: push`.
2. Clone it to `/home/user/$NAME` as the tool says, then call `register_repo_root`.
3. Run `CLAUDE_CODE_REMOTE=true CLAUDE_PROJECT_DIR=$PWD bash scripts/session-start.sh` in it. Sessions with several repos skip repo hooks, so run it yourself. It sets my commit identity, the git hook and dependencies.
4. Read the project's CLAUDE.md. From here, it governs work inside the project.

## 4. First deploy, within the hour

Bootstrap goes straight to `main`: it only renames the template, and an empty repo has nothing to review.

First run `bash scripts/check-env.sh` in hatchery. If the Access check fails, stop and ask me: without it a private project would deploy in the open.

1. `project.json`: name, title, description, `workersSubdomain` (from `curl -s https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/workers/subdomain | jq -r .result.subdomain`).
2. `wrangler.jsonc` and `package.json`: the same name.
3. README.md, `status.html` text, `assets/icon.svg`, then `npm run icons`.
4. `PLAN.md` and a first DECISIONS.md entry with the architecture path.
5. Commit, push, `npm run deploy`. Production is live behind Access.
6. Add the project to PROJECTS.md (step 8).

Everything after this goes through a branch and a PR.

## 5. Provision

Only what the plan needs. Every service gets a reason in the project README.

- D1: `npx wrangler d1 create $NAME` and `npx wrangler d1 create $NAME-preview`. Production binding at the top level of `wrangler.jsonc`, preview binding under `previews`.
- Worker secrets: `npx wrangler secret put NAME`, and `npx wrangler preview base-config secret put NAME` for Previews.
- Neon: `neonctl projects create --name $NAME`. Store the connection string as a Worker secret. Never in the repo.
- Actions secrets: the proxy blocks sessions from them. Use hatchery's `project-secret` workflow:
  1. Dispatch it with `inputs[repo]` and `inputs[secret]`. The run's notice annotation gives `key_id=... key=...`.
  2. `printf '%s' "$VALUE" | python3 scripts/seal-secret.py "$KEY"` (from the hatchery checkout).
  3. Dispatch again with `inputs[key_id]` and `inputs[sealed]`. The plaintext never leaves the session.
- R2, Zero Trust seats, Workers Paid, Apple or code-signing certificates: payment. Stop and ask.
- Public projects: `scripts/access.sh public $NAME` when I say so, plus `"public": true` and the analytics token in `project.json`. Add a `sitemap.xml` and real headings for search. Keep SEO in proportion: AI search answers informational queries directly.
- Custom domain, when I say it is ready to share: add `{"pattern": "$NAME.example.com", "custom_domain": true}` to `routes` in `wrangler.jsonc`, set `url` in `project.json`, deploy main. Access still applies unless the project is public.

## 6. Build

- Work on a branch. Small commits. The pre-commit hook runs every test; never skip it.
- Tests first for logic. Keep the project's test floor (its DECISIONS.md).
- Data preservation: version field, defaults for new fields, migrations, fixtures for every past shape. Never reset my data unless I ask.
- Secure by default: OWASP top 10, `el()` or `textContent` instead of `innerHTML`, secrets only server-side.
- AI features use whatever option I chose at kickoff.

## 7. Deploy and verify

1. `npm run deploy` on the branch. It runs the tests, writes the status page data, scans `dist/`, deploys a Preview, and runs the read-only smoke tests against it through the proxy.
2. Look at it yourself: open the Preview URL with Playwright on a phone viewport, take a screenshot, read it. Check the status page too. If it doesn't look right, it isn't done.
3. Open a PR: `gh api repos/OWNER/$NAME/pulls -f title=... -f head=$BRANCH -f base=main -f body=...`. `gh pr` is blocked.
4. Never merge on your own. I merge, or tell you to. After a merge, check out `main`, pull, and `npm run deploy` for production.

## 8. Record

- PROJECTS.md: add or update the project's row in a hatchery branch and open a PR on hatchery.
- Project DECISIONS.md and CLAUDE.md: what the next session needs.
- Lessons for every project: update these files in the same hatchery PR. If it changes conventions, bump `VERSION` and add a CHANGELOG.md entry.

## 9. Report in the session

- What was built and what changed.
- Links: repo, PR, Preview or production URL, status page.
- What to try on my phone.
- Open questions and anything that needs payment or my decision.

## Follow-up sessions

Later work happens in sessions on the project repo. Its CLAUDE.md asks them to attach hatchery read-only and compare `VERSION` with the project's `HATCHERY_VERSION`. A newer version means: show me the CHANGELOG entries and ask. Never update automatically.

When a project session learns something every project needs, it opens a PR on hatchery if attached, otherwise appends to `HATCHERY_INBOX.md` in the project and tells me. In hatchery sessions, fold inbox items from projects into these files when I ask.

## Maintaining hatchery

- Conventions are versioned in `VERSION` (semver): major when projects must change code, minor for new conventions or template features, patch for fixes. Every bump gets a CHANGELOG.md entry.
- Template changes go to `hatchery-template` in a PR, with its `HATCHERY_VERSION` bumped to match.
- `create-project` needs `HATCHERY_PAT`; `project-secret` needs its Secrets permission. Both report errors as annotations.
- Only workflows on `main` can be dispatched. A new workflow works after I merge it.

## Limits worth remembering

- GitHub proxy (tested 2026-10-25): REST only, no GraphQL. Blocks repo creation, repo settings, Actions secrets and variables, releases, and branch deletion. Allows workflow dispatch, runs, jobs, annotations, PRs, and pushes to attached repos.
- Actions minutes: 2,000 a month across all private repos. macOS counts 10x.
- Cloudflare free plan: 5 cron triggers per account, 100,000 Worker requests a day, 10 D1 databases.
- Session network: package registries, GitHub, `*.workers.dev`, `*.example.com`, and the network secret hosts.
