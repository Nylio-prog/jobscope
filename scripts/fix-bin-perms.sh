#!/usr/bin/env bash
set -euo pipefail

if [[ ! -d node_modules ]]; then
  echo "fix:bin-perms: node_modules not found, skipping."
  exit 0
fi

missing_count="$(find node_modules -type f -path '*/bin/*' ! -perm /111 | wc -l | tr -d ' ')"

if [[ "${missing_count}" == "0" ]]; then
  echo "fix:bin-perms: bin executables already have execute permissions."
  exit 0
fi

find node_modules -type f -path '*/bin/*' -exec chmod +x {} +
echo "fix:bin-perms: restored execute permissions on ${missing_count} file(s)."
