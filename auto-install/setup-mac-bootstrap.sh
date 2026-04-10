#!/bin/bash
# setup-mac-bootstrap.sh — curl-friendly entry point for the Mac auto-install.
#
# Usage from a Terminal one-liner (this is what the welcome email tells
# students to paste into Terminal):
#
#   bash -c "$(curl -fsSL https://raw.githubusercontent.com/okostec-events/nido_hack_26_team-01/main/auto-install/setup-mac-bootstrap.sh)" "" 02
#
# The "" before 02 is required because `bash -c` uses $0 as the script
# name slot, so "" becomes $0 and "02" becomes $1.
#
# Why this exists: macOS Gatekeeper blocks unsigned setup-mac.command
# files downloaded via a browser (the "Apple could not verify ... is
# free of malware" dialog). But files DOWNLOADED VIA curl/tar have no
# com.apple.quarantine attribute, so the script runs without ANY
# Gatekeeper warning. This bootstrap fetches the team's tarball via
# curl, extracts it into ~/Documents/GitHub/<team>/, then exec's the
# existing setup-mac.command from the extracted folder.
#
# Reuses: setup-mac.command for ALL the actual install logic (Homebrew,
# VS Code, Node, Git, Cline, GitHub Desktop, then `git clone` the team
# repo). This script only adds the initial "fetch the project files"
# step; everything else is delegated.

set -e

N="${1:-}"
if [ -z "$N" ]; then
  echo "ERROR: missing team number." >&2
  echo "" >&2
  echo "Usage: bash -c \"\$(curl -fsSL .../setup-mac-bootstrap.sh)\" \"\" <team-number>" >&2
  echo "  e.g. bash -c \"\$(curl -fsSL .../setup-mac-bootstrap.sh)\" \"\" 02" >&2
  exit 1
fi

PADDED=$(printf "%02d" "$N")
REPO="nido_hack_26_team-$PADDED"
ORG="okostec-events"
DIR="$HOME/Documents/GitHub/$REPO"

echo ""
echo "🚀 Nido Hack '26 — Team $PADDED Bootstrap"
echo "==========================================="
echo "Will install to: $DIR"
echo ""

mkdir -p "$DIR"
cd "$DIR"

# If the auto-install folder is already there, we assume a previous run
# already populated this directory and we just re-run the setup script.
if [ ! -f auto-install/setup-mac.command ]; then
  echo "→ Downloading team-$PADDED starter code from github.com/$ORG/$REPO ..."
  curl -fsSL "https://codeload.github.com/$ORG/$REPO/tar.gz/main" \
    | tar xz --strip-components=1
  echo "  ✓ extracted into $DIR"
else
  echo "✓ Project files already present in $DIR (re-running setup script)"
fi

echo ""
echo "→ Handing off to setup-mac.command ..."
echo ""

# IMPORTANT: invoking via `bash <path>` (vs double-clicking) bypasses
# Gatekeeper because the file was created by curl/tar, not downloaded
# from a browser, so it has no com.apple.quarantine attribute.
exec bash "$DIR/auto-install/setup-mac.command"
