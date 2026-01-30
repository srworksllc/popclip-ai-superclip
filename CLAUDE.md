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
- Uses axios for HTTP requests
- Contains prompt templates in the `PROMPTS` object
- API functions: `callOpenAPI`, `callClaudeAPI`, `callMistralAPI`, `callGeminiAPI`
- Action functions: `improveWritting`, `spellingAndGrammar`, `summarize`, `makeLonger`, `makeShorter`
- Exports actions array with title, icon, code, and requirements

## Available Actions

| Action | Function | Icon |
|--------|----------|------|
| Improve Writing | `improveWritting` | sparkles |
| Correct Spelling & Grammar | `spellingAndGrammar` | check-circle |
| Make Longer | `makeLonger` | plus-circle |
| Make Shorter | `makeShorter` | minus-circle |
| Summarize | `summarize` | list-bullet |

## Supported Models

- **OpenAI**: gpt-4.1, gpt-4.1-mini, gpt-4o, gpt-4o-mini
- **Claude**: claude-opus-4-5-20251101, claude-sonnet-4-5-20250929, claude-sonnet-4-20250514, claude-haiku-4-5-20251001, claude-3-5-sonnet-20241022, claude-3-5-haiku-20241022
- **Mistral**: mistral-large-latest, mistral-medium-latest, mistral-small-latest
- **Gemini**: gemini-2.5-pro, gemini-2.5-flash, gemini-2.0-flash

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
