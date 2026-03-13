# CLAUDE.md - AI SuperClip Developer Guide

## Repository Info

| Property | Value |
|----------|-------|
| **GitHub** | `srworksllc/popclip-ai-superclip` |
| **Local Path** | `/Users/stephenreinhardt/Sites/popclip-ai-superclip` |
| **Type** | PopClip extension (macOS) |
| **Extension** | `AI_SuperClip.popclipext` |

## Overview

AI SuperClip is a PopClip extension for macOS that enhances selected text using AI language models. It supports 5 providers and 10 models, with Groq's Llama 3.3 70B as the default.

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

### Groq (Paid)
| Model ID | Label | Max Tokens |
|----------|-------|------------|
| `openai/gpt-oss-120b` | GPT-OSS 120B | 8192 |
| `meta-llama/llama-4-scout-17b-16e-instruct` | Llama 4 Scout | 8192 |

### OpenAI (Paid)
| Model ID | Label | Max Tokens |
|----------|-------|------------|
| `gpt-4.1` | GPT-4.1 | 8192 |
| `gpt-4.1-mini` | GPT-4.1 Mini | 8192 |

### Anthropic Claude (Paid)
| Model ID | Label | Max Tokens |
|----------|-------|------------|
| `claude-sonnet-4-6` | Sonnet 4.6 | 8192 |
| `claude-haiku-4-5-20251001` | Haiku 4.5 (Fast) | 8192 |

### Mistral (Paid)
| Model ID | Label | Max Tokens |
|----------|-------|------------|
| `mistral-medium-latest` | Medium | 8192 |
| `mistral-small-latest` | Small (Fast) | 8192 |

### Google Gemini (Free Tier)
| Model ID | Label | Max Tokens |
|----------|-------|------------|
| `gemini-2.5-pro` | 2.5 Pro | 8192 |
| `gemini-2.5-flash` | 2.5 Flash | 8192 |


## Code Architecture

### settings.js Structure

```
Lines 1-10      Header and imports (axios)
Lines 12-43     Configuration constants
                - REQUEST_TIMEOUT: 60000ms
                - MAX_RETRIES: 2
                - RETRY_DELAY_MS: 500
                - MODEL_MAX_TOKENS: per-model token limits (10 models)
                - getMaxTokens(): helper function

Lines 45-111    PROMPTS object (5 prompt templates)

Lines 113-165   Utility functions
                - prepareResponse(): paste or copy based on Shift
                - sleep(): delay for retries
                - isRateLimitError(): check for 429
                - isRetryableError(): network/5xx/429
                - getErrorMessage(): user-friendly messages
                - isGroqModel(): check if Groq model

Lines 167-209   API routing and retry logic
                - callLLMapi(): routes to correct provider
                - callWithRetry(): exponential backoff wrapper

Lines 211-344   Provider API functions
                - callGroqAPI(): Groq (OpenAI-compatible)
                - callClaudeAPI(): Anthropic
                - callOpenAPI(): OpenAI
                - callMistralAPI(): Mistral
                - callGeminiAPI(): Google Gemini

Lines 346-391   Action handlers
                - runAction(): generic with error handling
                - improveWriting(), spellingAndGrammar(),
                  summarize(), makeLonger(), makeShorter()

Lines 393-424   exports.actions array
```

### API Endpoints

| Provider | Endpoint |
|----------|----------|
| Groq | `https://api.groq.com/openai/v1/chat/completions` |
| OpenAI | `https://api.openai.com/v1/chat/completions` |
| Claude | `https://api.anthropic.com/v1/messages` |
| Mistral | `https://api.mistral.ai/v1/chat/completions` |
| Gemini | `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent` |

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
| `geminiapikey` | secret | Google Gemini API key |
| `model` | multiple | Model selection dropdown |
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

### Add a New Model

1. Add model ID to `values` array in Config.json model option
2. Add label to `valueLabels` array (same index)
3. Add token limit to `MODEL_MAX_TOKENS` in settings.js
4. If new provider: add API key option, implement `callXxxAPI()`, update `callLLMapi()` router, add provider to `PROVIDERS` list in release.sh doc sync

CLAUDE.md and README.md model tables/counts are auto-synced from Config.json at release time (Step 2 of release.sh).

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
| 2 | Sync docs — auto-updates model tables/counts in CLAUDE.md and README.md (both copies) from Config.json + settings.js |
| 3 | Build ZIP (`.popclipextz`) |
| 4 | Git commit + tag (includes Config.json, package.json, CLAUDE.md, README.md x2) |
| 5 | Push to GitHub |
| 6 | Create GitHub release with ZIP attached |
| 7 | Cleanup (remove local ZIP) |

**Doc sync (Step 2) auto-updates:**
- Model count in CLAUDE.md overview and code architecture section
- Full model tables in CLAUDE.md (grouped by provider with token limits)
- Model count and summary table in both READMEs
- Provider grouping is defined in the `PROVIDERS` list inside release.sh

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
