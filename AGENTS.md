# AGENTS.md

The guidance for coding agents in this repository lives in
[CLAUDE.md](./CLAUDE.md). Read it before making changes — it covers the build and
test commands, the WSL loading workflow, and the architectural decisions that are
not obvious from the code: why detection is pure functions over a signals object,
why network calls run inside the page instead of the popup, and why the VTEX
admin is treated as hostile territory.

This file exists so agents that look for `AGENTS.md` find the same instructions.
