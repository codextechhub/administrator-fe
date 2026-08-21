#!/usr/bin/env bash
# List the page/route-ish files changed in the working tree (staged, unstaged,
# untracked) - the screens a "just-finished design" most likely touched. The
# agent maps these to their routes (cross-ref routes-path.ts) and drives them.
#
# Optional arg: a git ref to diff against instead of the working tree
# (e.g. `changed-pages.sh HEAD~1` to target the last commit's screens).
set -euo pipefail

REF="${1:-}"

if [ -n "$REF" ]; then
  git diff --name-only "$REF" -- 'src/pages/**' 'src/components/**' 'src/routes/**'
else
  git status --porcelain -- 'src/pages/**' 'src/components/**' 'src/routes/**' \
    | sed -E 's/^.{3}//'
fi
