# CLAUDE.md - Project Guide for AI Assistants

## Project Overview

AI SuperClip is a PopClip extension that sends selected text to various LLM providers for text enhancement tasks. It supports OpenAI, Anthropic Claude, Mistral, and Google Gemini APIs.

## Project Structure

```
popclip-ai-superclip/
└── AI_SuperClip.popclipext/    # PopClip extension bundle
    ├── Config.json              # Extension configuration and options
    ├── settings.js              # Main extension logic
    ├── package.json             # NPM package metadata
    ├── LICENSE                  # MIT License
    └── README.md                # Extension documentation
```

## Key Files

### Config.json
- Defines extension metadata (name, icon, identifier, author)
- Declares API key options for each provider (OpenAI, Claude, Mistral, Gemini)
- Lists available AI models in a dropdown
- Toggle options for enabling/disabling each action
- Requires `network` entitlement for API calls

### settings.js
- Main extension code using PopClip's JavaScript API
- Uses axios for HTTP requests (60s timeout)
- `MODEL_MAX_TOKENS` config for model-specific output limits
- `callWithRetry()` wrapper with exponential backoff (1 retry)
- `isRetryableError()` / `isRateLimitError()` for smart error handling
- `getErrorMessage()` for user-friendly error messages
- `SHARED_INSTRUCTIONS` object contains common prompt sections
- `buildPrompt()` function assembles prompts from task + shared instructions
- `PROMPTS` object contains task-specific prompts
- `runAction()` generic handler with error handling, retry, and `popclip.showFailure()`
- API functions: `callOpenAPI`, `callClaudeAPI`, `callMistralAPI`, `callGeminiAPI`
- Action functions: `improveWriting`, `spellingAndGrammar`, `summarize`, `makeLonger`, `makeShorter`
- Exports actions array with title, icon, code, and requirements

## Available Actions

| Action | Function | Icon |
|--------|----------|------|
| Improve Writing | `improveWriting` | sparkles |
| Correct Spelling & Grammar | `spellingAndGrammar` | check-circle |
| Make Longer | `makeLonger` | plus-circle |
| Make Shorter | `makeShorter` | minus-circle |
| Summarize | `summarize` | list-bullet |

## Supported Models (Updated January 2026)

- **OpenAI**: gpt-5.2, gpt-5.1, gpt-4.1, gpt-4.1-mini, gpt-4o, gpt-4o-mini
- **Claude**: claude-opus-4-5-20251101, claude-sonnet-4-5-20250929, claude-sonnet-4-20250514, claude-haiku-4-5-20251001
- **Mistral**: mistral-large-latest, mistral-medium-latest, mistral-small-latest
- **Gemini**: gemini-3-flash-preview, gemini-3-pro-preview, gemini-2.5-pro, gemini-2.5-flash

## Development Notes

### PopClip Extension Format
- Extension bundles use `.popclipext` folder extension
- `Config.json` defines extension configuration
- JavaScript modules are loaded via the `module` field
- Icons use `iconify:` prefix for Iconify icons or `symbol:` for SF Symbols

### API Endpoints
- OpenAI: `https://api.openai.com/v1/chat/completions`
- Claude: `https://api.anthropic.com/v1/messages`
- Mistral: `https://api.mistral.ai/v1/chat/completions`
- Gemini: `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`

### Prompt Design
All prompts follow a consistent structure:
1. Step-by-step instructions
2. Output format rules (no preamble, no markdown)
3. Punctuation rules (no em dashes, en dashes, semicolons)
4. Tone guidelines (approachable, professional, human)
5. Verification checklist

### Modifier Keys
- Default: Paste response directly
- Shift held: Copy response to clipboard instead

### Debugging
Enable debug mode:
```bash
defaults write com.pilotmoon.popclip EnableExtensionDebug -bool YES
```
View logs in Console.app with filter: `Process:PopClip Category:Extension`

## Common Tasks

### Adding a New Action
1. Add prompt template to `PROMPTS` object in settings.js
2. Create async action function that calls `callLLMapi` and `prepareResponse`
3. Add action to `exports.actions` array with title, icon, code, requirements
4. Add toggle option in Config.json under `options`

### Adding a New Model
1. Add model ID to `values` array in the `model` option in Config.json
2. If new provider, add API key option and implement new `callXxxAPI` function
3. Update `callLLMapi` router function with new model prefix check

### Updating Prompts
Edit the relevant prompt in the `PROMPTS` object. Follow the existing structure to maintain consistency.

---

## PopClip Extension Development Reference

Documentation: https://www.popclip.app/dev/

### Extension Formats
- **Snippets**: Plain YAML text files for simple extensions
- **Packages**: `.popclipext` folders with Config.json + resources (this project)

### Config.json Structure

**Required**: `name`

**Common Fields**:
| Field | Description |
|-------|-------------|
| `name` | Display name (localizable) |
| `icon` | Icon specification |
| `identifier` | Unique ID (alphanumerics, periods, hyphens) |
| `description` | Short description (localizable) |
| `popclipVersion` | Minimum PopClip build number |
| `module` | JavaScript module file path |
| `entitlements` | Array: `network`, `dynamic` |
| `options` | Array of user-configurable options |
| `actions` | Array of action definitions |

### Option Types
| Type | Description |
|------|-------------|
| `string` | Text input field |
| `boolean` | Checkbox (default: false) |
| `multiple` | Dropdown (requires `values` array) |
| `secret` | Password field (stored in keychain) |
| `heading` | Section header for grouping |

**Option Properties**: `identifier` (required), `type` (required), `label`, `description`, `defaultValue`, `values`, `valueLabels`

### Action Properties
| Property | Description |
|----------|-------------|
| `title` | Button/tooltip text |
| `icon` | Action icon (falls back to extension icon) |
| `code` | JavaScript function `(input, options, context)` |
| `requirements` | Array of conditions for visibility |
| `regex` | RegExp for text matching |
| `before` | Pre-action: `cut`, `copy`, `paste`, `paste-plain` |
| `after` | Post-action: `copy-result`, `paste-result`, `show-result`, `show-status` |
| `stayVisible` | Keep popup open after action |
| `captureHtml` | Extract HTML/Markdown from selection |

### Requirements Values
- `text` - Requires text selection
- `url` / `urls` - Requires URL in selection
- `email` - Requires email address
- `path` - Requires file path
- `option-foo=1` - Requires option `foo` to be enabled

### The `popclip` Global Object

**Input Properties**:
- `popclip.input.text` - Full selected text
- `popclip.input.matchedText` - Text matching requirements/regex
- `popclip.input.regexResult` - Regex capture groups
- `popclip.input.html` - HTML content (if `captureHtml` enabled)
- `popclip.input.markdown` - Markdown conversion (if `captureHtml` enabled)
- `popclip.input.data.urls` - Detected URLs array

**Context Properties**:
- `popclip.context.browserUrl` - Current page URL
- `popclip.context.browserTitle` - Current page title
- `popclip.context.appName` - Active app name
- `popclip.context.appIdentifier` - Active app bundle ID

**Modifier Keys**:
- `popclip.modifiers.shift` - Boolean
- `popclip.modifiers.command` - Boolean
- `popclip.modifiers.option` - Boolean
- `popclip.modifiers.control` - Boolean

**Methods**:
- `popclip.pasteText(string)` - Paste text
- `popclip.copyText(string)` - Copy to clipboard
- `popclip.showText(string)` - Display in PopClip bar
- `popclip.openUrl(url)` - Open URL
- `popclip.pressKey(combo)` - Simulate key press
- `popclip.performCommand(cmd)` - Execute cut/copy/paste
- `popclip.showSuccess()` - Show checkmark
- `popclip.showFailure()` - Show X mark
- `popclip.showSettings()` - Open extension settings

**Options Access**: `popclip.options.optionIdentifier`

### Icon Formats
- **Text**: Up to 3 characters (e.g., `"AI"`)
- **SF Symbols**: `symbol:brain` (macOS 11+)
- **Iconify**: `iconify:heroicons-solid:sparkles` (200k+ icons)
- **File**: `file:icon.png` (PNG/SVG in package)
- **SVG**: `svg:<svg>...</svg>`

**Modifiers**: `square`, `circle`, `filled`, `flip-x`, `flip-y`, `scale=N`, `rotate=N`

### Built-in Modules
PopClip bundles these npm packages (use via `require()`):
- `axios` (v1.12.2) - HTTP client
- `js-yaml` (v4.1.0) - YAML parser
- `sanitize-html` (v2.17.0) - HTML sanitizer
- Plus 20+ others

### Error Handling
- Normal return = success
- `throw new Error("message")` = failure
- `throw new Error("Settings error: ...")` = opens settings UI
- `throw new Error("Not signed in: ...")` = opens settings UI

### Constraints
- **Sandbox**: No filesystem access
- **Network**: HTTPS only, requires `network` entitlement
- **Language**: ES2023 supported

---

## Code Audit & Improvement Opportunities

### Fixed Issues (January 2026)

1. ~~**Typo**: `improveWritting` should be `improveWriting`~~ **FIXED**

2. ~~**No error handling**: API calls have no try/catch~~ **FIXED** - Added `runAction()` with try/catch and `popclip.showFailure()`

3. ~~**Boolean defaults**: All action toggles default to `false`~~ **FIXED** - Added `defaultValue: true` to all toggles

4. ~~**Inconsistent `after` behavior**: Only `summarize` uses `after: "show-result"`~~ **FIXED** - Removed, all actions now paste consistently

5. ~~**Code duplication**: All 5 action functions nearly identical~~ **FIXED** - Refactored to `runAction()` generic handler

6. ~~**Repetitive prompts**: ~80% of prompt text duplicated~~ **FIXED** - Extracted to `SHARED_INSTRUCTIONS` and `buildPrompt()`

7. ~~**API keys stored as plain text**~~ **FIXED** - Changed from `string` to `secret` type (stored in Keychain)

8. ~~**No request timeout**~~ **FIXED** - Added 30s timeout to all axios requests

### Future Improvements

**Medium Priority**:
- Add temperature option for controlling AI creativity
- Add max_tokens option for output length control

**Low Priority / Nice to Have**:
- Add custom prompt action for power users
- Use additional modifier keys (Option, Command) for different behaviors
- Add `captureHtml` for markdown-aware processing
- Add localization support for non-English users
