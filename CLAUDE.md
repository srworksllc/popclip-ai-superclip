# CLAUDE.md - AI SuperClip Developer Guide

## Repository Info

| Property | Value |
|----------|-------|
| **GitHub** | `srworksllc/popclip-ai-superclip` |
| **Local Path** | `/Users/stephenreinhardt/Sites/popclip-ai-superclip` |
| **Type** | PopClip extension (macOS) |
| **Extension** | `AI_SuperClip.popclipext` |

## Overview

AI SuperClip is a PopClip extension for macOS that enhances selected text using AI language models. It supports 4 providers, with Groq's Llama 3.3 70B as the default. Each provider exposes one curated flagship model — the dropdown selects the provider, and the actual model ID is resolved from `PROVIDER_MODELS` in `settings.js`.

**Author:** Steve Reinhardt | SR Works LLC | https://srworks.co
**License:** MIT
**PopClip Version:** 4069+

## Project Structure

```
popclip-ai-superclip/
├── AI_SuperClip.popclipext/     # PopClip extension bundle
│   ├── Config.json              # Extension metadata and options
│   ├── settings.js              # Main extension logic (440 lines)
│   ├── package.json             # NPM package metadata
│   ├── LICENSE                  # MIT License
│   └── README.md                # User documentation (bundle copy)
├── CLAUDE.md                    # This file
└── README.md                    # User documentation
```

## Actions

| Action | Prompt Key | Icon | Description |
|--------|------------|------|-------------|
| Improve Writing | `improveWriting` | sparkles | Enhance clarity and flow, preserve voice |
| Spelling & Grammar | `correctSpellingGrammar` | check-circle | Fix errors only, no rewording |
| Make Longer | `makeLonger` | plus-circle | Expand with detail, roughly double length |
| Make Shorter | `makeShorter` | minus-circle | Condense to essentials, roughly half length |
| Summarize | `summarize` | list-bullet | Extract key points, 20-30% of original |

**Modifier:** Hold Shift to copy instead of paste.

## Supported Models

The dropdown stores provider keys (`groq`, `openai`, `claude`, `mistral`). The actual model ID sent to each provider is resolved at call time from `PROVIDER_MODELS` in `settings.js`. This means model upgrades require editing one constant — no Config.json changes, no doc churn from snapshot model IDs.

| Provider | Dropdown Key | Current Model ID | Last Verified |
|----------|--------------|------------------|---------------|
| Groq | `groq` | `llama-3.3-70b-versatile` | Jun 2026 |
| OpenAI | `openai` | `gpt-5.5` | Jun 2026 |
| Anthropic Claude | `claude` | `claude-sonnet-4-6` | Jun 2026 |
| Mistral | `mistral` | `mistral-medium-latest` | Jun 2026 |

`MAX_TOKENS` is a single constant (currently `2048`). It applies to all providers. The value is intentionally low to keep requests inside Groq free-tier rate limits (12K TPM) — Groq counts the reserved `max_tokens` against the budget whether the response uses them or not.


## Code Architecture

### settings.js Structure

- Header and imports (`axios`)
- Configuration constants: `REQUEST_TIMEOUT` (60s), `MAX_RETRIES` (2), `RETRY_DELAY_MS` (500), `PROVIDER_MODELS` (provider→model map), `MAX_TOKENS` (2048)
- `TONES` map and `TONE_ACTIONS` list — tone instructions injected into writing prompts when not "default"
- `PROMPTS` object — 5 prompt templates (improveWriting, correctSpellingGrammar, summarize, makeLonger, makeShorter)
- Utility functions: `prepareResponse()` (paste vs copy on Shift), `sleep()`, `isRateLimitError()`, `isRetryableError()`, `getErrorMessage()`
- `callLLMapi()` — switch on provider key, routes to provider-specific function
- `callWithRetry()` — exponential backoff wrapper
- Provider functions: `callGroqAPI`, `callOpenAPI`, `callClaudeAPI`, `callMistralAPI` — each looks up its model via `PROVIDER_MODELS[<key>]`
- Action handlers: `runAction()` generic dispatcher + the 5 thin action wrappers
- `exports.actions` array — PopClip action declarations

### API Endpoints

| Provider | Endpoint |
|----------|----------|
| Groq | `https://api.groq.com/openai/v1/chat/completions` |
| OpenAI | `https://api.openai.com/v1/chat/completions` |
| Claude | `https://api.anthropic.com/v1/messages` |
| Mistral | `https://api.mistral.ai/v1/chat/completions` |

### Error Handling

**Retry Logic:**
- Retries on: Network errors, 429 (rate limit), 5xx (server errors)
- Does NOT retry on: 401 (auth), 403 (forbidden), settings errors
- Exponential backoff: 500ms, 1s delay

**Settings Errors:**
- Messages starting with "Settings error:" trigger PopClip settings UI
- Example: `throw new Error("Settings error: missing Groq API key")`

**User Messages:**
| Condition | Message |
|-----------|---------|
| 429 | "Rate limit exceeded. Please wait a moment and try again." |
| Network | "Network error. Please check your connection." |
| 401 | "Invalid API key. Please check your settings." |
| 403 | "Access denied. Please check your API key permissions." |
| 5xx | "Server error. Please try again later." |

## Prompt Design

All prompts follow consistent rules:
1. Output ONLY the result (no preamble, explanations)
2. NO markdown formatting (bold, italics, headers, bullets) — except Summarize allows bullet points for multi-topic content
3. NO em dashes, en dashes, or semicolons. Hyphens only for compound words
4. Preserve paragraph breaks and line structure
5. Writing prompts (Improve, Make Longer, Make Shorter) enforce a natural, human tone with contractions and short sentences
6. Spelling & Grammar fixes capitalization and protects code, URLs, file paths, and technical terms from modification
7. Summarize handles short input (under 2 sentences) gracefully with a one-sentence summary
8. Tone injection: When tone is not "default", a tone instruction is appended after the prompt rules for writing actions only (Improve, Make Longer, Make Shorter). Does NOT apply to Spelling & Grammar or Summarize.

## Config.json Structure

### Option Identifiers

| Identifier | Type | Purpose |
|------------|------|---------|
| `groqapikey` | secret | Groq API key (Keychain) |
| `apikey` | secret | OpenAI API key |
| `claudeapikey` | secret | Anthropic API key |
| `mistralapikey` | secret | Mistral API key |
| `model` | multiple | Provider key (`groq`, `openai`, `claude`, `mistral`) |
| `tone` | multiple | Tone selection (default, professional, casual, friendly, direct) |
| `enable-improve-writing` | boolean | Toggle Improve Writing action |
| `enable-spelling-grammar` | boolean | Toggle Spelling & Grammar action |
| `enable-make-longer` | boolean | Toggle Make Longer action |
| `enable-make-shorter` | boolean | Toggle Make Shorter action |
| `enable-summarize` | boolean | Toggle Summarize action |

### Action Requirements Format

```javascript
requirements: ["text", "option-enable-improve-writing=1"]
```

Requires text selection AND the toggle option enabled.

## Common Tasks

### Add a New Action

1. Add prompt to `PROMPTS` object in settings.js
2. Create action handler: `async function newAction(input, options) { await runAction("promptKey", input, options); }`
3. Add to `exports.actions` array with title, icon, code, requirements
4. Add toggle option in Config.json with `identifier`, `label`, `type: boolean`, `defaultValue: true`

### Update a Provider's Model

When a provider releases a new flagship, edit one line in `PROVIDER_MODELS` in `settings.js`. No Config.json edits needed. After updating, manually refresh the "Current Model ID" row in the Supported Models table above (the release script does not auto-sync this, by design — model labels are too short and reviewer-facing to derive from API IDs reliably).

### Add a New Provider

1. Add the provider key to `PROVIDER_MODELS` in `settings.js`
2. Implement `callXxxAPI()`
3. Add the provider to the `switch` in `callLLMapi()`
4. Add an API key option to `Config.json`
5. Add the provider key + label to the `model` dropdown's `values` and `valueLabels` arrays in `Config.json`
6. Add a row to the Supported Models table above

### Update a Prompt

Edit the relevant key in `PROMPTS` object. Follow existing structure:
- Task description
- RULES: numbered list
- TEXT TO X: label for input

## Release Process

```bash
./release.sh 1.2.0
```

**Steps:**

| Step | Action |
|------|--------|
| 1 | Version bump (Config.json, package.json) |
| 2 | Sync docs — refreshes the provider count and the "Current Model ID" column in CLAUDE.md and READMEs from `PROVIDER_MODELS` in settings.js |
| 3 | Build ZIP (`.popclipextz`) |
| 4 | Git commit + tag (includes Config.json, package.json, CLAUDE.md, README.md x2) |
| 5 | Push to GitHub |
| 6 | Create GitHub release with ZIP attached |
| 7 | Cleanup (remove local ZIP) |

**Doc sync (Step 2):**
- Reads `PROVIDER_MODELS` from `settings.js` (single source of truth for model IDs)
- Updates the provider count in CLAUDE.md overview and READMEs
- Hand-written human labels (e.g. "Llama 3.3 70B", "GPT-5.5") are NOT auto-derived from API IDs — update them manually when the model line in `PROVIDER_MODELS` changes

## Debugging

Enable debug mode:
```bash
defaults write com.pilotmoon.popclip EnableExtensionDebug -bool YES
```

View logs in Console.app:
- Filter: `Process:PopClip Category:Extension`
- Look for: `AI SuperClip Error:` messages

Disable debug mode:
```bash
defaults delete com.pilotmoon.popclip EnableExtensionDebug
```

## PopClip API Reference

### popclip Global Object

**Input:**
- `popclip.input.text` - Selected text
- `popclip.input.html` - HTML (if captureHtml enabled)
- `popclip.input.markdown` - Markdown (if captureHtml enabled)

**Modifiers:**
- `popclip.modifiers.shift` - Boolean
- `popclip.modifiers.command` - Boolean
- `popclip.modifiers.option` - Boolean
- `popclip.modifiers.control` - Boolean

**Methods:**
- `popclip.pasteText(string)` - Paste text
- `popclip.copyText(string)` - Copy to clipboard
- `popclip.showSuccess()` - Show checkmark
- `popclip.showFailure()` - Show X mark
- `popclip.showSettings()` - Open extension settings

**Options:** `popclip.options.{identifier}`

### Icon Formats

- Text: `"AI"` (up to 3 chars)
- SF Symbols: `symbol:brain`
- Iconify: `iconify:heroicons-solid:sparkles`
- File: `file:icon.png`

### Built-in Modules

Available via `require()`:
- `axios` (v1.12.2) - HTTP client
- `js-yaml` (v4.1.0) - YAML parser
- `sanitize-html` (v2.17.0) - HTML sanitizer

### Constraints

- Sandbox: No filesystem access
- Network: HTTPS only, requires `network` entitlement
- Language: ES2023 supported

## Future Improvements

**Medium Priority:**
- Temperature option for AI creativity control
- Max tokens option for output length control

**Low Priority:**
- Custom prompt action for power users
- Additional modifier keys for different behaviors
- HTML/Markdown capture with `captureHtml`
- Localization support

---

PopClip Documentation: https://www.popclip.app/dev/
