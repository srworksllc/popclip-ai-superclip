/**
 * AI SuperClip - PopClip Extension
 *
 * Copyright (c) 2025 Steve Reinhardt, SR Works LLC
 * Licensed under the MIT License
 *
 * https://srworks.co
 */

const axios = require("axios");

// Request timeout in milliseconds (60 seconds for larger models)
const REQUEST_TIMEOUT = 60000;

// Retry configuration
const MAX_RETRIES = 1;
const RETRY_DELAY_MS = 1000;

// Model-specific max_tokens configuration
const MODEL_MAX_TOKENS = {
  // Groq (free, fast)
  "llama-3.3-70b-versatile": 8192,
  "llama-3.1-8b-instant": 8192,
  "mixtral-8x7b-32768": 8192,
  "gemma2-9b-it": 8192,
  // OpenAI GPT-5.x (larger context, higher output)
  "gpt-5.2": 16384,
  "gpt-5.1": 16384,
  // OpenAI GPT-4.x
  "gpt-4.1": 8192,
  "gpt-4.1-mini": 8192,
  "gpt-4o": 4096,
  "gpt-4o-mini": 4096,
  // Claude (all support high output)
  "claude-opus-4-5-20251101": 8192,
  "claude-sonnet-4-5-20250929": 8192,
  "claude-sonnet-4-20250514": 8192,
  "claude-haiku-4-5-20251001": 8192,
  // Mistral
  "mistral-large-latest": 8192,
  "mistral-medium-latest": 4096,
  "mistral-small-latest": 4096,
  // Gemini
  "gemini-3-flash-preview": 8192,
  "gemini-3-pro-preview": 8192,
  "gemini-2.5-pro": 8192,
  "gemini-2.5-flash": 8192
};

// Default max_tokens if model not in config
const DEFAULT_MAX_TOKENS = 4096;

// Get max_tokens for a model
function getMaxTokens(model) {
  return MODEL_MAX_TOKENS[model] || DEFAULT_MAX_TOKENS;
}

// Prompt templates for each action
const PROMPTS = {
  improveWriting: `Rewrite the text below to improve clarity, flow, and impact. Keep the original meaning intact.

RULES:
1. Output ONLY the improved text. No preamble, no "Here's the improved version", no explanation.
2. Start immediately with the first word of the rewritten content.
3. NO markdown formatting. No bold, italics, headers, or bullet points.
4. NO em dashes (—), en dashes (–), or semicolons (;). Use commas or periods instead.
5. Only use hyphens for compound words like "well-known" or "high-quality".
6. Match the original length approximately. Do not drastically shorten or lengthen.
7. Preserve the author's voice. Make it clearer, not different.

TEXT TO IMPROVE:`,

  correctSpellingGrammar: `Fix all spelling and grammar errors in the text below. Do not change the meaning, style, or tone.

RULES:
1. Output ONLY the corrected text. No preamble, no "Here are the corrections", no explanation.
2. Start immediately with the first word of the corrected content.
3. NO markdown formatting. No bold, italics, headers, or bullet points.
4. NO em dashes (—), en dashes (–), or semicolons (;). Use commas or periods instead.
5. Only use hyphens for compound words like "well-known" or "high-quality".
6. ONLY fix errors. Do not rephrase, reword, or "improve" the writing.
7. If the text has no errors, return it exactly as provided.

TEXT TO CORRECT:`,

  summarize: `Summarize the text below. Extract the main ideas, key points, and any action items.

RULES:
1. Output ONLY the summary. No preamble, no "Here's a summary", no explanation.
2. Start immediately with the first word of the summary.
3. NO em dashes (—), en dashes (–), or semicolons (;). Use commas or periods instead.
4. Only use hyphens for compound words like "well-known" or "high-quality".
5. Keep it concise. Aim for 20 to 30 percent of the original length.
6. Use bullet points only if the content has multiple distinct topics or action items.
7. Write in plain, objective language. No opinions or interpretations.

TEXT TO SUMMARIZE:`,

  makeLonger: `Expand the text below with more detail, examples, or elaboration. Keep the same tone and message.

RULES:
1. Output ONLY the expanded text. No preamble, no "Here's the longer version", no explanation.
2. Start immediately with the first word of the expanded content.
3. NO markdown formatting. No bold, italics, headers, or bullet points.
4. NO em dashes (—), en dashes (–), or semicolons (;). Use commas or periods instead.
5. Only use hyphens for compound words like "well-known" or "high-quality".
6. Add substance, not fluff. Include relevant details, examples, or context.
7. Roughly double the length, but prioritize quality over hitting a word count.
8. Maintain the original voice and style.

TEXT TO EXPAND:`,

  makeShorter: `Condense the text below to its essential points. Preserve the core message and tone.

RULES:
1. Output ONLY the condensed text. No preamble, no "Here's the shorter version", no explanation.
2. Start immediately with the first word of the condensed content.
3. NO markdown formatting. No bold, italics, headers, or bullet points.
4. NO em dashes (—), en dashes (–), or semicolons (;). Use commas or periods instead.
5. Only use hyphens for compound words like "well-known" or "high-quality".
6. Cut filler words, redundancies, and unnecessary qualifiers.
7. Aim for roughly half the original length, but keep all essential information.
8. Do not lose important details or change the meaning.

TEXT TO CONDENSE:`
};

// Handle response based on modifier keys
function prepareResponse(data) {
  if (popclip.modifiers.shift) {
    popclip.copyText(data);
  } else {
    popclip.pasteText(data);
  }
}

// Sleep utility for retry delays
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Check if error is a rate limit (429) error
function isRateLimitError(error) {
  return error.response && error.response.status === 429;
}

// Check if error is retryable (network errors, 5xx, 429)
function isRetryableError(error) {
  if (!error.response) {
    // Network error, timeout, etc.
    return true;
  }
  const status = error.response.status;
  return status === 429 || (status >= 500 && status < 600);
}

// Get user-friendly error message
function getErrorMessage(error) {
  if (isRateLimitError(error)) {
    return "Rate limit exceeded. Please wait a moment and try again.";
  }
  if (!error.response) {
    return "Network error. Please check your connection.";
  }
  if (error.response.status === 401) {
    return "Invalid API key. Please check your settings.";
  }
  if (error.response.status === 403) {
    return "Access denied. Please check your API key permissions.";
  }
  if (error.response.status >= 500) {
    return "Server error. Please try again later.";
  }
  return error.message || "An unexpected error occurred.";
}

// Check if model is a Groq model
function isGroqModel(model) {
  return model.startsWith("llama") || model.startsWith("mixtral") || model.startsWith("gemma");
}

// Route to appropriate API based on model
async function callLLMapi(prompt, options) {
  if (isGroqModel(options.model)) {
    return await callGroqAPI(prompt, options);
  } else if (options.model.startsWith("gpt")) {
    return await callOpenAPI(prompt, options);
  } else if (options.model.startsWith("claude")) {
    return await callClaudeAPI(prompt, options);
  } else if (options.model.startsWith("mistral")) {
    return await callMistralAPI(prompt, options);
  } else if (options.model.startsWith("gemini")) {
    return await callGeminiAPI(prompt, options);
  }
  throw new Error("Unknown model selection: " + options.model);
}

// Wrapper with retry logic
async function callWithRetry(apiFunction, prompt, options) {
  let lastError;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await apiFunction(prompt, options);
    } catch (error) {
      lastError = error;

      // Don't retry settings errors
      if (error.message && error.message.toLowerCase().startsWith("settings error")) {
        throw error;
      }

      // Don't retry if not retryable or on last attempt
      if (!isRetryableError(error) || attempt === MAX_RETRIES) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      await sleep(RETRY_DELAY_MS * Math.pow(2, attempt));
    }
  }

  throw lastError;
}

// --- GROQ API (Free, OpenAI-compatible)
async function callGroqAPI(prompt, options) {
  const key = options.groqapikey.trim();
  if (!key || key.length === 0) {
    throw new Error("Settings error: missing Groq API key. Get a free key at console.groq.com");
  }

  const { data } = await axios.post(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      model: options.model,
      max_tokens: getMaxTokens(options.model),
      messages: [{ role: "user", content: prompt }]
    },
    {
      timeout: REQUEST_TIMEOUT,
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json"
      }
    }
  );
  return data.choices[0].message.content.trim();
}

// --- CLAUDE API
async function callClaudeAPI(prompt, options) {
  const key = options.claudeapikey.trim();
  if (!key || key.length === 0) {
    throw new Error("Settings error: missing Claude API key");
  }

  const { data } = await axios.post(
    "https://api.anthropic.com/v1/messages",
    {
      model: options.model,
      max_tokens: getMaxTokens(options.model),
      messages: [{ role: "user", content: prompt }]
    },
    {
      timeout: REQUEST_TIMEOUT,
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
        Accept: "application/json"
      }
    }
  );
  return data.content[0].text.trim();
}

// --- OPENAI API
async function callOpenAPI(prompt, options) {
  const key = options.apikey.trim();
  if (!key || key.length === 0) {
    throw new Error("Settings error: missing OpenAI API key");
  }

  const { data } = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: options.model,
      max_tokens: getMaxTokens(options.model),
      messages: [{ role: "user", content: prompt }]
    },
    {
      timeout: REQUEST_TIMEOUT,
      headers: {
        Authorization: `Bearer ${key}`
      }
    }
  );
  return data.choices[0].message.content.trim();
}

// --- MISTRAL API
async function callMistralAPI(prompt, options) {
  const key = options.mistralapikey.trim();
  if (!key || key.length === 0) {
    throw new Error("Settings error: missing Mistral API key");
  }

  const { data } = await axios.post(
    "https://api.mistral.ai/v1/chat/completions",
    {
      model: options.model,
      max_tokens: getMaxTokens(options.model),
      messages: [{ role: "user", content: prompt }]
    },
    {
      timeout: REQUEST_TIMEOUT,
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Accept: "application/json"
      }
    }
  );
  return data.choices[0].message.content.trim();
}

// --- GEMINI API
async function callGeminiAPI(prompt, options) {
  const key = options.geminiapikey.trim();
  if (!key || key.length === 0) {
    throw new Error("Settings error: missing Gemini API key");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${options.model}:generateContent?key=${key}`;

  const { data } = await axios.post(
    url,
    {
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        maxOutputTokens: getMaxTokens(options.model)
      }
    },
    {
      timeout: REQUEST_TIMEOUT,
      headers: { "Content-Type": "application/json" }
    }
  );

  if (!data || !data.candidates || !data.candidates[0]) {
    throw new Error("Gemini API error: Invalid response");
  }

  return data.candidates[0].content.parts[0].text.trim();
}

// Generic action runner with error handling and retry
async function runAction(promptKey, input, options) {
  try {
    const prompt = PROMPTS[promptKey] + "\n\n" + input.text.trim();

    // Use retry wrapper
    const apiFunction = async (p, o) => callLLMapi(p, o);
    const data = await callWithRetry(apiFunction, prompt, options);

    prepareResponse(data);
  } catch (error) {
    // Re-throw settings errors to trigger PopClip settings UI
    if (error.message && error.message.toLowerCase().startsWith("settings error")) {
      throw error;
    }

    // Show failure indicator
    popclip.showFailure();

    // Log detailed error for debugging
    console.log("AI SuperClip Error:", getErrorMessage(error));

    throw new Error(getErrorMessage(error));
  }
}

// Action handlers
async function improveWriting(input, options) {
  await runAction("improveWriting", input, options);
}

async function spellingAndGrammar(input, options) {
  await runAction("correctSpellingGrammar", input, options);
}

async function summarize(input, options) {
  await runAction("summarize", input, options);
}

async function makeLonger(input, options) {
  await runAction("makeLonger", input, options);
}

async function makeShorter(input, options) {
  await runAction("makeShorter", input, options);
}

exports.actions = [
  {
    title: "Improve Writing",
    icon: "iconify:heroicons-solid:sparkles",
    code: improveWriting,
    requirements: ["text", "option-enable-improve-writing=1"]
  },
  {
    title: "Correct Spelling & Grammar",
    icon: "iconify:heroicons-solid:check-circle",
    code: spellingAndGrammar,
    requirements: ["text", "option-enable-spelling-grammar=1"]
  },
  {
    title: "Make Longer",
    icon: "iconify:heroicons-solid:plus-circle",
    code: makeLonger,
    requirements: ["text", "option-enable-make-longer=1"]
  },
  {
    title: "Make Shorter",
    icon: "iconify:heroicons-solid:minus-circle",
    code: makeShorter,
    requirements: ["text", "option-enable-make-shorter=1"]
  },
  {
    title: "Summarize",
    icon: "iconify:heroicons-solid:list-bullet",
    code: summarize,
    requirements: ["text", "option-enable-summarize=1"]
  }
];
