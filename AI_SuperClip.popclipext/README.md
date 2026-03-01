# AI SuperClip

A PopClip extension that enhances your selected text using AI. Select text, click an action, and get instant results.

**Created by Steve Reinhardt | [SRWorks LLC](https://srworks.co)**

## Features

| Action | What It Does |
|--------|--------------|
| **Improve Writing** | Enhance clarity and flow while preserving your voice |
| **Spelling & Grammar** | Fix errors without changing your style |
| **Make Longer** | Expand with relevant detail and examples |
| **Make Shorter** | Condense to essential points |
| **Summarize** | Extract key points and action items |

### Tone

Choose a writing tone that applies to Improve Writing, Make Longer, and Make Shorter:

| Tone | Description |
|------|-------------|
| **Default** | No tone adjustment — uses the AI model's natural response |
| **Professional** | Polished and business-appropriate |
| **Casual** | Relaxed and conversational |
| **Friendly** | Warm and approachable |
| **Direct** | Concise and to the point |

Tone does not apply to Spelling & Grammar or Summarize.

### Additional

- Hold **Shift** to copy result instead of pasting
- Plain text output (no markdown or special formatting)
- Automatic retry on network errors
- Toggle individual actions on/off in settings
- 10 models across 5 providers — switch anytime in settings

## Supported Models

| Provider | Models | Pricing |
|----------|--------|---------|
| **Groq** | Llama 4 Maverick (Free), Llama 4 Scout (Free) | Free |
| **OpenAI** | GPT-4.1, GPT-4.1 Mini | Paid |
| **Anthropic** | Sonnet 4.6, Haiku 4.5 (Fast) | Paid |
| **Mistral** | Medium, Small (Fast) | Paid |
| **Google** | 2.5 Pro, 2.5 Flash | Free tier |

## Requirements

- [PopClip](https://pilotmoon.com/popclip/) for macOS
- API key from one provider (Groq is free)

## Quick Start (Free)

1. Install the extension
2. Get a free API key from [console.groq.com](https://console.groq.com)
3. Open PopClip settings, paste your Groq key
4. Select text anywhere and click an action

## Configuration

Open PopClip menu bar icon, then click the gear on AI SuperClip.

### API Keys

| Provider | Get Your Key |
|----------|--------------|
| Groq (Free) | [console.groq.com/keys](https://console.groq.com/keys) |
| OpenAI | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| Anthropic | [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys) |
| Mistral | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) |
| Google Gemini | [ai.google.dev](https://ai.google.dev) |

Only enter a key for your selected provider.

## Usage

1. Select text in any app
2. Click an AI SuperClip action
3. Text is replaced with the result

**Tip:** Hold **Shift** when clicking to copy the result instead of pasting.

## Debugging

Enable debug mode:

```bash
defaults write com.pilotmoon.popclip EnableExtensionDebug -bool YES
```

View logs in **Console.app** with filter: `Process:PopClip Category:Extension`

## License

MIT License - Copyright (c) 2026 Steve Reinhardt, SRWorks LLC
