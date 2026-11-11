#!/bin/bash
# Installs graphify (pip package "graphifyy") at session start if it is missing,
# so the graphify hooks and the /graphify skill work in fresh environments.
set -euo pipefail
if ! command -v graphify >/dev/null 2>&1; then
  pip install --quiet graphifyy >/dev/null 2>&1 || pip install --quiet --user graphifyy >/dev/null 2>&1 || true
fi
exit 0
