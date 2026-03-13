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
        opt['label'] = 'Version $NEW_VERSION · srworks.co'
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

# ── Step 2: Sync documentation ───────────────────────────────────

echo ""
echo "Step 2: Syncing docs from Config.json..."

python3 << 'PYEOF'
import json, re, os

SCRIPT_DIR = os.path.dirname(os.path.abspath("release.sh")) or "."
EXT_DIR = os.path.join(SCRIPT_DIR, "AI_SuperClip.popclipext")
CONFIG = os.path.join(EXT_DIR, "Config.json")
SETTINGS = os.path.join(EXT_DIR, "settings.js")
CLAUDE_MD = os.path.join(SCRIPT_DIR, "CLAUDE.md")
README = os.path.join(SCRIPT_DIR, "README.md")
BUNDLE_README = os.path.join(EXT_DIR, "README.md")

# ── Parse Config.json ──

with open(CONFIG) as f:
    config = json.load(f)

model_opt = next(o for o in config["options"] if o.get("identifier") == "model")
model_ids = model_opt["values"]
model_labels = model_opt["valueLabels"]
model_count = len(model_ids)

# ── Parse token limits from settings.js ──

with open(SETTINGS) as f:
    settings_src = f.read()

tokens = {}
for mid in model_ids:
    m = re.search(re.escape(f'"{mid}"') + r'\s*:\s*(\d+)', settings_src)
    tokens[mid] = int(m.group(1)) if m else 4096

# ── Provider grouping (order matters) ──

PROVIDERS = [
    {"prefix": ["meta-llama/", "llama"], "name": "Groq", "tier": "Paid", "readme_tier": "Paid"},
    {"prefix": ["gpt"],                  "name": "OpenAI", "tier": "Paid",     "readme_tier": "Paid"},
    {"prefix": ["claude"],               "name": "Anthropic Claude", "tier": "Paid", "readme_tier": "Paid"},
    {"prefix": ["mistral"],              "name": "Mistral", "tier": "Paid",    "readme_tier": "Paid"},
    {"prefix": ["gemini"],               "name": "Google Gemini", "tier": "Free Tier", "readme_tier": "Free tier"},
]

def get_provider(model_id):
    for p in PROVIDERS:
        if any(model_id.startswith(px) for px in p["prefix"]):
            return p
    return None

provider_count = len(set(get_provider(m)["name"] for m in model_ids if get_provider(m)))

# ── Build CLAUDE.md model tables ──

claude_tables = ""
grouped = {}
for mid, label in zip(model_ids, model_labels):
    prov = get_provider(mid)
    if not prov:
        continue
    key = prov["name"]
    if key not in grouped:
        grouped[key] = {"provider": prov, "models": []}
    # Strip provider prefix from label (e.g. "Groq: Llama 4 Maverick (Free)" -> "Llama 4 Maverick (Free)")
    short_label = label.split(": ", 1)[-1] if ": " in label else label
    grouped[key]["models"].append((mid, short_label, tokens.get(mid, 4096)))

for prov in PROVIDERS:
    key = prov["name"]
    if key not in grouped:
        continue
    claude_tables += f'### {key} ({prov["tier"]})\n'
    claude_tables += "| Model ID | Label | Max Tokens |\n"
    claude_tables += "|----------|-------|------------|\n"
    for mid, label, tok in grouped[key]["models"]:
        claude_tables += f"| `{mid}` | {label} | {tok} |\n"
    claude_tables += "\n"

claude_tables = claude_tables.rstrip("\n")

# ── Build README model table ──

readme_rows = ""
for prov in PROVIDERS:
    key = prov["name"]
    if key not in grouped:
        continue
    models_str = ", ".join(label for _, label, _ in grouped[key]["models"])
    display_name = key.replace("Anthropic Claude", "Anthropic").replace("Google Gemini", "Google")
    readme_rows += f"| **{display_name}** | {models_str} | {prov['readme_tier']} |\n"

readme_rows = readme_rows.rstrip("\n")

# ── Update CLAUDE.md ──

with open(CLAUDE_MD) as f:
    claude = f.read()

# Update overview model count
claude = re.sub(
    r'supports \d+ providers and \d+ models',
    f'supports {provider_count} providers and {model_count} models',
    claude
)

# Update MODEL_MAX_TOKENS count
claude = re.sub(
    r'per-model token limits \(\d+ models\)',
    f'per-model token limits ({model_count} models)',
    claude
)

# Replace model tables section
claude = re.sub(
    r'(## Supported Models\n\n).*?(\n## Code Architecture)',
    r'\1' + claude_tables + r'\n\n\2',
    claude,
    flags=re.DOTALL
)

with open(CLAUDE_MD, "w") as f:
    f.write(claude)

# ── Update READMEs ──

for readme_path in [README, BUNDLE_README]:
    with open(readme_path) as f:
        content = f.read()

    # Update model count line
    content = re.sub(
        r'\d+ models across \d+ providers',
        f'{model_count} models across {provider_count} providers',
        content
    )

    # Replace model table
    content = re.sub(
        r'(\| Provider \| Models \| Pricing \|\n\|[-|]+\|\n).*?(\n\n)',
        r'\1' + readme_rows + r'\n\n',
        content,
        flags=re.DOTALL
    )

    with open(readme_path, "w") as f:
        f.write(content)

print(f"  Models: {model_count} across {provider_count} providers")
print(f"  CLAUDE.md    ✓")
print(f"  README.md    ✓ (both copies)")
PYEOF

# ── Step 3: Build ZIP ────────────────────────────────────────────────

echo ""
echo "Step 3: Building $ZIP_NAME..."

rm -f "$ZIP_NAME"

cd "$SCRIPT_DIR"
zip -rq "$ZIP_NAME" "$EXT_DIR" \
  -x "$EXT_DIR/.*" \
  -x "*/.*" \
  -x "*/.DS_Store" \
  -x "*/._*"

ZIP_SIZE=$(du -h "$ZIP_NAME" | cut -f1)
echo "  Created: $ZIP_NAME ($ZIP_SIZE)"

# ── Step 4: Git commit + tag ─────────────────────────────────────────

echo ""
echo "Step 4: Committing and tagging..."

git add "$CONFIG_FILE" "$PACKAGE_FILE" CLAUDE.md README.md "$EXT_DIR/README.md"
git commit -m "Release v$NEW_VERSION"
git tag -a "v$NEW_VERSION" -m "Version $NEW_VERSION"

echo "  Committed and tagged v$NEW_VERSION"

# ── Step 5: Push ─────────────────────────────────────────────────────

echo ""
echo "Step 5: Pushing to GitHub..."

git push origin main
git push origin "v$NEW_VERSION"

echo "  Pushed commit and tag"

# ── Step 6: GitHub release ───────────────────────────────────────────

echo ""
echo "Step 6: Creating GitHub release..."

# Collect commits since last tag
PREV_TAG=$(git tag --sort=-v:refname | grep -v "v$NEW_VERSION" | head -1)
RELEASE_NOTES=""
if [ -n "$PREV_TAG" ]; then
  RELEASE_NOTES=$(git log "$PREV_TAG"..HEAD~1 --pretty=format:"- %s" --reverse | grep -v "^- Release v")
fi
if [ -z "$RELEASE_NOTES" ]; then
  RELEASE_NOTES="- Bug fixes and improvements"
fi

NOTES_FILE=$(mktemp)
cat > "$NOTES_FILE" <<EOF
## What's Changed

$RELEASE_NOTES

## Install

Download \`$ZIP_NAME\` and double-click to install in PopClip.
EOF

gh release create "v$NEW_VERSION" "$ZIP_NAME" \
  --repo "$GITHUB_REPO" \
  --title "AI SuperClip v$NEW_VERSION" \
  --notes-file "$NOTES_FILE"

rm -f "$NOTES_FILE"

echo "  Release created with $ZIP_NAME attached"

# ── Step 7: Cleanup ──────────────────────────────────────────────────

echo ""
echo "Step 7: Cleaning up..."

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
