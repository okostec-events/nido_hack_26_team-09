#!/bin/bash
set -e

# This script lives in <extracted-zip>/auto-install/
# We use the location of TEAM_URL.txt (in the same folder) to figure out
# which team's repo to clone — that way it works no matter what the
# extracted folder is named.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
EXTRACTED_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo ""
echo "🚀 Nido Hack '26 — Auto Install (Mac)"
echo "======================================"
echo ""

# 0. Figure out which team repo to clone
#    Priority 1: TEAM_URL.txt (one line, the HTTPS git URL)
#    Priority 2: derive from the extracted folder name
#
#    Note: on macOS Sequoia, scripts running from ~/Downloads/ may not
#    be able to read sibling files due to TCC restrictions, even for
#    simple text files. The `2>/dev/null` on `head` suppresses the
#    expected "Operation not permitted" stderr noise; the empty result
#    falls through cleanly to the folder-name fallback below.
TEAM_URL=""
if [ -f "$SCRIPT_DIR/TEAM_URL.txt" ]; then
  TEAM_URL=$(head -n1 "$SCRIPT_DIR/TEAM_URL.txt" 2>/dev/null | tr -d '[:space:]')
fi

if [ -z "$TEAM_URL" ]; then
  # Fallback: extract team name from the parent folder name.
  # GitHub ZIPs unzip as "nido_hack_26_team-XX-main" — strip the "-main"
  # suffix. This is the primary path on macOS Sequoia (where the
  # TEAM_URL.txt read above is blocked by TCC).
  FOLDER_NAME="$(basename "$EXTRACTED_DIR")"
  TEAM_NAME="${FOLDER_NAME%-main}"
  TEAM_URL="https://github.com/okostec-events/${TEAM_NAME}.git"
  echo "ℹ️  Using folder name to find your team repo: $TEAM_NAME"
fi

# Derive a clean team name (last path segment of the URL, no .git)
TEAM_NAME="$(basename "$TEAM_URL" .git)"
CLONE_DIR="$HOME/Documents/GitHub/$TEAM_NAME"

echo "Team repo:    $TEAM_URL"
echo "Will clone to: $CLONE_DIR"
echo ""

# 1. Install Homebrew if missing
if ! command -v brew &> /dev/null; then
  echo "→ Installing Homebrew (will ask for your Mac password once)..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  # Add brew to PATH for current session (Apple Silicon vs Intel)
  if [ -f /opt/homebrew/bin/brew ]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
  elif [ -f /usr/local/bin/brew ]; then
    eval "$(/usr/local/bin/brew shellenv)"
  fi
else
  echo "✓ Homebrew already installed"
fi

# 2. Install VS Code (skip if already present in /Applications)
echo ""
if [ -d "/Applications/Visual Studio Code.app" ]; then
  echo "✓ VS Code already installed, skipping"
else
  echo "→ Installing VS Code..."
  brew install --cask visual-studio-code
fi

# 3. Install GitHub Desktop (skip if already present)
if [ -d "/Applications/GitHub Desktop.app" ]; then
  echo "✓ GitHub Desktop already installed, skipping"
else
  echo "→ Installing GitHub Desktop..."
  brew install --cask github
fi

# 4. Install Node.js (skip if 'node' is already in PATH)
if command -v node &> /dev/null; then
  echo "✓ Node.js already installed ($(node --version)), skipping"
else
  echo "→ Installing Node.js..."
  brew install node
fi

# 5. Install Git (skip if 'git' is already in PATH)
if command -v git &> /dev/null; then
  echo "✓ Git already installed ($(git --version | cut -d' ' -f3)), skipping"
else
  echo "→ Installing Git..."
  brew install git
fi

# 6. Clone (or update) the team repo into ~/Documents/GitHub/<team>/
echo ""
mkdir -p "$HOME/Documents/GitHub"
if [ -d "$CLONE_DIR/.git" ]; then
  echo "✓ Repo already cloned, pulling latest changes..."
  git -C "$CLONE_DIR" pull --ff-only || echo "  (skipping pull — local changes present)"
else
  echo "→ Cloning $TEAM_URL ..."
  git clone "$TEAM_URL" "$CLONE_DIR"
fi

# 7. Make sure 'code' CLI is available (VS Code must expose its CLI shim)
if ! command -v code &> /dev/null; then
  echo ""
  echo "⚠️  The 'code' command is not in your PATH yet. To install it:"
  echo "    Open VS Code → Cmd+Shift+P → 'Shell Command: Install code command in PATH'"
  echo "    Then re-run this script."
  open -a "Visual Studio Code" "$CLONE_DIR"
  exit 0
fi

# 8. Install Cline AI extension (idempotent — skips if already installed)
echo ""
echo "→ Installing Cline AI extension..."
code --install-extension saoudrizwan.claude-dev

# 9. Open the cloned repo in VS Code (NOT the extracted ZIP folder)
echo ""
echo "→ Opening project in VS Code..."
code "$CLONE_DIR"

echo ""
echo "✅ Done! VS Code should now be open with your team's repo:"
echo "   $CLONE_DIR"
echo ""
echo "   Next: in VS Code, double-click 'index.html' in the left sidebar"
echo "   to start the Hackathon Clicker game."
echo ""
echo "   To push changes to your team, open GitHub Desktop, sign in,"
echo "   then File → Add Local Repository → choose the folder above."
echo ""
