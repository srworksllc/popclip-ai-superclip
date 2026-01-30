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

// Shared prompt instructions
const SHARED_INSTRUCTIONS = {
  outputFormat: `STEP 3: UNDERSTAND THE OUTPUT FORMAT
- Do NOT add any introduction or explanation
- Do NOT use markdown formatting (no bold, no italics, no headers, no bullets)
- Do NOT use asterisks, underscores, or hashtags
- Output ONLY plain text format
- Start immediately with the first word of the content`,

  punctuationRules: `STEP 4: FOLLOW THESE PUNCTUATION RULES (CHECK EACH ONE):
- Never use em dashes (the long dash that looks like this: —)
- Never use en dashes (the medium dash that looks like this: –)
- Never use semicolons (;)
- Only use hyphens when joining two words into one compound word (examples: "well-known" or "high-quality")
- Do NOT use hyphens to replace dashes in sentences
- Use only these punctuation marks: commas, periods, parentheses, colons
- If you would normally use a dash, use a comma or period instead
- If you would normally use a semicolon, split it into two sentences with a period`,

  toneGuidelines: `STEP 5: APPLY THIS TONE (CHECK EACH ONE):
- Approachable, confident, and grounded
- Friendly and conversational but professional
- Human and kind, not corporate or robotic
- Confident but not cocky
- Kind but not soft
- Direct but not blunt
- Professional but not formal
- Conversational but not casual slang
- If there's tension, diffuse it calmly and respectfully`,

  verification: `STEP 6: BEFORE YOU RESPOND, VERIFY:
- Did I remove ALL markdown formatting?
- Did I remove ALL em dashes and en dashes?
- Did I remove ALL semicolons?
- Did I skip the preamble and start directly with the content?`
};

// Build a complete prompt with shared instructions
function buildPrompt(task, outputNote = "") {
  return `STEP 1: READ ALL INSTRUCTIONS BELOW BEFORE YOU START

STEP 2: COMPLETE THE TASK
${task}

${SHARED_INSTRUCTIONS.outputFormat}${outputNote}

${SHARED_INSTRUCTIONS.punctuationRules}

${SHARED_INSTRUCTIONS.toneGuidelines}

${SHARED_INSTRUCTIONS.verification}`;
}

// Prompt templates
const PROMPTS = {
  improveWriting: buildPrompt(
    "Rewrite this text to improve clarity, flow, and impact while maintaining the original meaning."
  ),
  correctSpellingGrammar: buildPrompt(
    "Fix all spelling and grammar errors in this text. Maintain the original style and tone."
  ),
  summarize: buildPrompt(
    "Summarize the following content in a clear and concise way. Capture the main ideas, key points, and any important conclusions or action items. Keep the summary objective and easy to understand, regardless of the topic or audience.",
    "\n- You MAY use bullets and outline format if it helps organize the key points"
  ),
  makeLonger: buildPrompt(
    "Expand this text with additional detail, examples, and elaboration while maintaining the original tone and message."
  ),
  makeShorter: buildPrompt(
    "Condense this text to its essential points while preserving the core message and tone."
  )
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
