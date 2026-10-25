# hatchery

A cloud build system for personal projects. I open a Claude Code session here, describe a project, and the session creates a private repo for it, builds it, deploys it, verifies it, and reports back.

## Files

| File | What it is |
| --- | --- |
| [CLAUDE.md](CLAUDE.md) | The launcher playbook every session follows. |
| [DECISION-TREE.md](DECISION-TREE.md) | How a project picks its architecture, with free-plan limits. |
| [PROJECTS.md](PROJECTS.md) | Every project: repo, URL, visibility, services, status. |
| [SETUP.md](SETUP.md) | What I did by hand, once: accounts, tokens, DNS, the cloud environment, smoke tests. |
| [DECISIONS.md](DECISIONS.md) | Hatchery's own choices and test results. |
| [VERSION](VERSION), [CHANGELOG.md](CHANGELOG.md) | Convention versions. Projects record theirs in `HATCHERY_VERSION`. |
| [PROMPT.md](PROMPT.md) | The original brief. |
| `.github/workflows/create-project.yml` | Creates a private project repo from `hatchery-template`. |
| `.github/workflows/project-secret.yml` | Sets an Actions secret on a project repo. |
| `scripts/setup.sh` | Setup script for the `hatchery-build` cloud environment. |
| `scripts/check-env.sh` | Checks a session: tools, tokens, Access, GitHub. |
| `scripts/access.sh` | Cloudflare Access: protect all Workers, make one public. |
| `scripts/seal-secret.py` | Seals a secret for `project-secret`. |

The project scaffold lives in the private template repo [`OWNER/hatchery-template`](https://github.com/OWNER/hatchery-template).

## Credits

`.claude/skills/karpathy-guidelines/` is vendored unchanged from [forrestchang/andrej-karpathy-skills](https://github.com/forrestchang/andrej-karpathy-skills) at commit [`2c606141936f1eeef17fa3043a72095b4765b9c2`](https://github.com/forrestchang/andrej-karpathy-skills/tree/2c606141936f1eeef17fa3043a72095b4765b9c2), MIT license. It is a community skill based on Andrej Karpathy's observations about LLM coding, not written by him. `hatchery-template` carries the same copy, so every project has it.
