# AI SuperClip

A PopClip extension that enhances your selected text using AI. Select text, click an action, and get instant results.

**Created by Steve Reinhardt | [SR Works LLC](https://srworks.co)**

## Features

| Action | What It Does |
|--------|--------------|
| **Improve Writing** | Enhance clarity and flow while preserving your voice |
| **Spelling & Grammar** | Fix errors without changing your style |
| **Make Longer** | Expand with relevant detail and examples |
| **Make Shorter** | Condense to essential points |
| **Summarize** | Extract key points and action items |

**Additional:**
- Hold **Shift** to copy result instead of pasting
- Plain text output (no markdown or special formatting)
- Automatic retry on network errors
- Toggle actions on/off in settings

## Supported Providers

| Provider | Models | Pricing |
|----------|--------|---------|
| **Groq** | Llama 3.3 70B, Llama 3.1 8B, Mixtral, Gemma 2 | Free |
| **OpenAI** | GPT-5.2, GPT-5.1, GPT-4.1, GPT-4o | Paid |
| **Anthropic** | Claude Opus 4.5, Sonnet 4.5, Sonnet 4, Haiku 4.5 | Paid |
| **Mistral** | Large 3, Medium 3, Small 3 | Paid |
| **Google** | Gemini 3 Flash, 3 Pro, 2.5 Pro, 2.5 Flash | Free tier |

**Default:** Groq Llama 3.3 70B (free, high quality)

## Requirements

- [PopClip](https://pilotmoon.com/popclip/) for macOS
- API key from one provider (Groq is free)

## Installation

### Option 1: Download Release

1. Download `AI_SuperClip.popclipextz` from [Releases](../../releases)
2. Double-click to install

### Option 2: Clone Repository

```bash
git clone https://github.com/srworksllc/popclip-ai-superclip.git
```

Double-click the `AI_SuperClip.popclipext` folder to install.

## Quick Start (Free)

1. Install the extension
2. Get a free API key from [console.groq.com](https://console.groq.com)
3. Open PopClip settings, paste your Groq key
4. Select text anywhere and click an action

## Configuration

Open PopClip menu bar icon → Click the gear on AI SuperClip.

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

View logs in **Console.app** → Filter: `Process:PopClip Category:Extension`

## License

MIT License - Copyright (c) 2025 Steve Reinhardt, SR Works LLC
