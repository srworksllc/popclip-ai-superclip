#!/bin/bash

# Release Script for AI SuperClip (PopClip Extension)
#
# Usage:
#   ./release.sh <version>    Build, tag, push, and create GitHub release
#   ./release.sh              Show usage
#
# Example:
#   ./release.sh 1.2.0

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

EXT_DIR="AI_SuperClip.popclipext"
CONFIG_FILE="$EXT_DIR/Config.json"
PACKAGE_FILE="$EXT_DIR/package.json"
ZIP_NAME="AI_SuperClip.popclipextz"
GITHUB_REPO="srworksllc/popclip-ai-superclip"

NEW_VERSION="$1"

if [ -z "$NEW_VERSION" ]; then
  CURRENT=$(python3 -c "import json; print(json.load(open('$CONFIG_FILE'))['version'])")
  echo "Usage: ./release.sh <version>"
  echo ""
  echo "  Current version: $CURRENT"
  echo ""
  echo "Example:"
  echo "  ./release.sh 1.2.0"
  exit 1
fi

# ── Validate version format ──────────────────────────────────────────

if ! [[ "$NEW_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Error: Invalid version format. Use X.Y.Z (e.g., 1.2.0)"
  exit 1
fi

# ── Check for uncommitted changes ────────────────────────────────────

if [ -n "$(git status --porcelain)" ]; then
  echo "Error: Uncommitted changes. Commit or stash before releasing."
  exit 1
fi

# ── Check version is newer ───────────────────────────────────────────

CURRENT_VERSION=$(python3 -c "import json; print(json.load(open('$CONFIG_FILE'))['version'])")

version_to_int() {
  local IFS=.
  local parts=($1)
  echo $(( parts[0] * 10000 + parts[1] * 100 + parts[2] ))
}

CURRENT_INT=$(version_to_int "$CURRENT_VERSION")
NEW_INT=$(version_to_int "$NEW_VERSION")

if [ "$NEW_INT" -le "$CURRENT_INT" ]; then
  echo "Error: New version ($NEW_VERSION) must be greater than current ($CURRENT_VERSION)"
  exit 1
fi

# ── Check gh CLI ─────────────────────────────────────────────────────

if ! command -v gh &>/dev/null; then
  echo "Error: GitHub CLI (gh) is required. Install with: brew install gh"
  exit 1
fi

echo "========================================"
echo "  AI SuperClip — Release $CURRENT_VERSION → $NEW_VERSION"
echo "========================================"

# ── Step 1: Version bump ─────────────────────────────────────────────

echo ""
echo "Step 1: Updating version..."

# Update Config.json version field
python3 -c "
import json
with open('$CONFIG_FILE', 'r') as f:
    config = json.load(f)
config['version'] = '$NEW_VERSION'
for opt in config.get('options', []):
    if opt.get('identifier') == 'version-heading':
        opt['label'] = 'Version $NEW_VERSION'
with open('$CONFIG_FILE', 'w') as f:
    json.dump(config, f, indent=2)
    f.write('\n')
"

# Update package.json version field
python3 -c "
import json
with open('$PACKAGE_FILE', 'r') as f:
    pkg = json.load(f)
pkg['version'] = '$NEW_VERSION'
with open('$PACKAGE_FILE', 'w') as f:
    json.dump(pkg, f, indent=2)
    f.write('\n')
"

echo "  Config.json  → $NEW_VERSION"
echo "  package.json → $NEW_VERSION"

# ── Step 2: Build ZIP ────────────────────────────────────────────────

echo ""
echo "Step 2: Building $ZIP_NAME..."

rm -f "$ZIP_NAME"

cd "$SCRIPT_DIR"
zip -rq "$ZIP_NAME" "$EXT_DIR" \
  -x "$EXT_DIR/.*" \
  -x "*/.*" \
  -x "*/.DS_Store" \
  -x "*/._*"

ZIP_SIZE=$(du -h "$ZIP_NAME" | cut -f1)
echo "  Created: $ZIP_NAME ($ZIP_SIZE)"

# ── Step 3: Git commit + tag ─────────────────────────────────────────

echo ""
echo "Step 3: Committing and tagging..."

git add "$CONFIG_FILE" "$PACKAGE_FILE"
git commit -m "Release v$NEW_VERSION"
git tag -a "v$NEW_VERSION" -m "Version $NEW_VERSION"

echo "  Committed and tagged v$NEW_VERSION"

# ── Step 4: Push ─────────────────────────────────────────────────────

echo ""
echo "Step 4: Pushing to GitHub..."

git push origin main
git push origin "v$NEW_VERSION"

echo "  Pushed commit and tag"

# ── Step 5: GitHub release ───────────────────────────────────────────

echo ""
echo "Step 5: Creating GitHub release..."

# Collect commits since last tag
PREV_TAG=$(git tag --sort=-v:refname | grep -v "v$NEW_VERSION" | head -1)
RELEASE_NOTES=""
if [ -n "$PREV_TAG" ]; then
  RELEASE_NOTES=$(git log "$PREV_TAG"..HEAD~1 --pretty=format:"- %s" --reverse | grep -v "^- Release v")
fi
if [ -z "$RELEASE_NOTES" ]; then
  RELEASE_NOTES="- Bug fixes and improvements"
fi

gh release create "v$NEW_VERSION" "$ZIP_NAME" \
  --repo "$GITHUB_REPO" \
  --title "AI SuperClip v$NEW_VERSION" \
  --notes "$(cat <<EOF
## What's Changed

$RELEASE_NOTES

## Install

Download \`$ZIP_NAME\` and double-click to install in PopClip.
EOF
)"

echo "  Release created with $ZIP_NAME attached"

# ── Step 6: Cleanup ──────────────────────────────────────────────────

echo ""
echo "Step 6: Cleaning up..."

rm -f "$ZIP_NAME"
echo "  Removed $ZIP_NAME"

# ── Done ─────────────────────────────────────────────────────────────

echo ""
echo "========================================"
echo "  AI SuperClip v$NEW_VERSION released!"
echo "========================================"
echo ""
echo "  Tag:     v$NEW_VERSION"
echo "  Release: https://github.com/$GITHUB_REPO/releases/tag/v$NEW_VERSION"
echo ""
