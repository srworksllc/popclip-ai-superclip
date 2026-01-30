# AI SuperClip

A powerful PopClip extension that enhances your selected text using multiple AI providers.

**Created by Steve Reinhardt | [SR Works LLC](https://srworks.io)**

## Features

Select any text and instantly:

- **Improve Writing** - Enhance clarity, flow, and impact
- **Correct Spelling & Grammar** - Fix errors while maintaining your style
- **Make Longer** - Expand text with additional detail and examples
- **Make Shorter** - Condense to essential points
- **Summarize** - Extract key points and conclusions

### Additional Features

- Hold **Shift** to copy the response to clipboard instead of pasting
- Toggle individual actions on/off in extension settings
- Consistent warm, professional tone across all outputs
- Plain text output (no markdown formatting)

## Supported AI Providers

| Provider | Models |
|----------|--------|
| **OpenAI** | GPT-4.1, GPT-4.1 mini, GPT-4o, GPT-4o mini |
| **Anthropic Claude** | Opus 4.5, Sonnet 4.5, Sonnet 4, Haiku 4.5, Sonnet 3.5, Haiku 3.5 |
| **Mistral AI** | Large, Medium, Small |
| **Google Gemini** | 2.5 Pro, 2.5 Flash, 2.0 Flash |

## Requirements

- [PopClip](https://pilotmoon.com/popclip/) for macOS
- API key from at least one supported provider

## Installation

### Option 1: Download Release

1. Download `AI_SuperClip.popclipextz` from the [Releases](../../releases) page
2. Double-click the downloaded file
3. Click "Install Extension" in PopClip

### Option 2: Clone Repository

1. Clone the repository:
   ```bash
   git clone https://github.com/srworksllc/popclip-ai-superclip.git
   ```
2. Double-click the `AI_SuperClip.popclipext` folder
3. Click "Install Extension" in PopClip

## Configuration

After installation, click the PopClip icon in the menu bar and open extension settings.

### API Keys

Add API keys for the providers you want to use:

| Provider | Get Your Key |
|----------|--------------|
| OpenAI | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| Anthropic Claude | [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys) |
| Mistral AI | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) |
| Google Gemini | [ai.google.dev](https://ai.google.dev) |

### Select Your Model

Choose your preferred AI model from the dropdown. You only need an API key for the provider of your selected model.

### Toggle Actions

Enable or disable individual actions to customize which options appear in your PopClip menu.

## Usage

1. Select any text in any application
2. Click one of the AI SuperClip actions in the PopClip menu
3. The enhanced text replaces your selection (or hold Shift to copy instead)

## Debugging

If you encounter issues, enable debug mode:

```bash
defaults write com.pilotmoon.popclip EnableExtensionDebug -bool YES
```

Then open **Console.app** and filter by: `Process:PopClip Category:Extension`

## License

MIT License - Copyright (c) 2025 Steve Reinhardt, SR Works LLC

See [LICENSE](AI_SuperClip.popclipext/LICENSE) for full details.
