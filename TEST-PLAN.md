# Repo creation test plan

Goal: find out how a cloud session on `hatchery` can create a new private repo and get code into it, with no manual steps.

Run this in a cloud session on `hatchery`. Record every command's exact output in RESULTS below. Do not delete any repo. Use test names only: `hatchery-test-a`, `hatchery-test-b1`, `hatchery-test-b2`, `hatchery-test-c`.

## Facts from the docs

- All GitHub traffic goes through the GitHub proxy. It serves API calls only for repos attached to the session. Others get 403 `is not enabled for this session`.
- The proxy blocks GraphQL for everyone. Use `gh api` (REST), never `gh repo create`, `gh pr` or `gh issue`.
- A `GH_TOKEN` set on the environment passes into the container unchanged. Unknown: whether the proxy's repo scope still applies to it.

## 0. Baseline

1. `echo "${GH_TOKEN:0:4}"`: placeholder (`prox`) or a real token prefix.
2. `git remote -v` and `gh api repos/{owner}/hatchery --jq .full_name`.
3. `gh api user --jq .login`.

## A. Own token in the session

Needs a test environment with `GH_TOKEN` set to a real token.

1. `gh api -X POST user/repos -f name=hatchery-test-a -F private=true`
2. If created: `gh api repos/{owner}/hatchery-test-a --jq .private`
3. Push: make a temp dir with one commit, then `git push https://x-access-token:$GH_TOKEN@github.com/{owner}/hatchery-test-a.git HEAD:main`
4. Also try a plain `git push` with the remote set to `https://github.com/{owner}/hatchery-test-a.git`. This tests the proxy's git credential.

## B. Workflow in hatchery creates the repo

Needs Actions secret `HATCHERY_PAT` on hatchery. Session environment has no token.

B1, dispatch:
1. `gh api -X POST repos/{owner}/hatchery/actions/workflows/create-project.yml/dispatches -f ref=main -f 'inputs[name]=hatchery-test-b1'`
2. If that returns 403, record the message. The Claude GitHub App may lack Actions write.
3. `gh api repos/{owner}/hatchery/actions/runs --jq '.workflow_runs[0] | {status, conclusion, html_url}'`

B2, push relay (also tests building inside the session and exporting):
1. `git checkout -b request/hatchery-test-b2`
2. Create `export/hatchery-test-b2/README.md` and `export/hatchery-test-b2/index.html`. Commit.
3. `git push -u origin request/hatchery-test-b2`
4. Check the run as in B1 step 3.
5. Check the result: `gh api repos/{owner}/hatchery-test-b2/contents/README.md`. A 403 here is expected, because the repo is not attached. Record it anyway.

## C. Attach the new repo mid-session

1. Try to clone a repo created above: `git clone https://github.com/{owner}/hatchery-test-b2.git /tmp/b2`. Record the result.
2. Ask whether this session has any built-in way to add a repository. Record what Claude Code reports.
3. If Claude Code Projects is available on the account: in a Project with hatchery attached, ask a thread to create `hatchery-test-c` via B, then add it to itself, clone it and push a commit.

## RESULTS

Fill in per step: command, output, verdict (works / blocked / error).
