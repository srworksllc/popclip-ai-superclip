/**
 * AI SuperClip - PopClip Extension
 * 
 * Copyright (c) 2025 Steve Reinhardt, SR Works LLC
 * Licensed under the MIT License
 * 
 * https://srworks.co
 */

const axios = require("axios");

// Prompt templates
const PROMPTS = {
  improveWriting: `STEP 1: READ ALL INSTRUCTIONS BELOW BEFORE YOU START

STEP 2: COMPLETE THE TASK
Rewrite this text to improve clarity, flow, and impact while maintaining the original meaning.

STEP 3: UNDERSTAND THE OUTPUT FORMAT
- Do NOT write "Here's the improved version"
- Do NOT write "I've rewritten this for you"
- Do NOT add any introduction or explanation
- Do NOT use markdown formatting (no bold, no italics, no headers, no bullets)
- Do NOT use asterisks, underscores, or hashtags
- Output ONLY the rewritten text in plain text format
- Start immediately with the first word of the rewritten content

STEP 4: FOLLOW THESE PUNCTUATION RULES (CHECK EACH ONE):
□ Never use em dashes (the long dash that looks like this: —)
□ Never use en dashes (the medium dash that looks like this: –)
□ Never use semicolons (;)
□ Only use hyphens when joining two words into one compound word (examples: "well-known" or "high-quality")
□ Do NOT use hyphens to replace dashes in sentences
□ Use only these punctuation marks: commas, periods, parentheses, colons
□ If you would normally use a dash, use a comma or period instead
□ If you would normally use a semicolon, split it into two sentences with a period

STEP 5: APPLY THIS TONE (CHECK EACH ONE):
□ Approachable, confident, and grounded
□ Friendly and conversational but professional
□ Human and kind, not corporate or robotic
□ Confident but not cocky
□ Kind but not soft
□ Direct but not blunt
□ Professional but not formal
□ Conversational but not casual slang
□ If there's tension, diffuse it calmly and respectfully

STEP 6: BEFORE YOU RESPOND, VERIFY:
□ Did I remove ALL markdown formatting?
□ Did I remove ALL em dashes and en dashes?
□ Did I remove ALL semicolons?
□ Did I skip the preamble and start directly with the content?`,

  correctSpellingGrammar: `STEP 1: READ ALL INSTRUCTIONS BELOW BEFORE YOU START

STEP 2: COMPLETE THE TASK
Fix all spelling and grammar errors in this text. Maintain the original style and tone.

STEP 3: UNDERSTAND THE OUTPUT FORMAT
- Do NOT write "Here are the corrections"
- Do NOT write "I've fixed the errors"
- Do NOT add any introduction or explanation
- Do NOT use markdown formatting (no bold, no italics, no headers, no bullets)
- Do NOT use asterisks, underscores, or hashtags
- Output ONLY the corrected text in plain text format
- Start immediately with the first word of the corrected content

STEP 4: FOLLOW THESE PUNCTUATION RULES (CHECK EACH ONE):
□ Never use em dashes (the long dash that looks like this: —)
□ Never use en dashes (the medium dash that looks like this: –)
□ Never use semicolons (;)
□ Only use hyphens when joining two words into one compound word (examples: "well-known" or "high-quality")
□ Do NOT use hyphens to replace dashes in sentences
□ Use only these punctuation marks: commas, periods, parentheses, colons
□ If you would normally use a dash, use a comma or period instead
□ If you would normally use a semicolon, split it into two sentences with a period

STEP 5: APPLY THIS TONE (CHECK EACH ONE):
□ Approachable, confident, and grounded
□ Friendly and conversational but professional
□ Human and kind, not corporate or robotic
□ Confident but not cocky
□ Kind but not soft
□ Direct but not blunt
□ Professional but not formal
□ Conversational but not casual slang
□ If there's tension, diffuse it calmly and respectfully

STEP 6: BEFORE YOU RESPOND, VERIFY:
□ Did I remove ALL markdown formatting?
□ Did I remove ALL em dashes and en dashes?
□ Did I remove ALL semicolons?
□ Did I skip the preamble and start directly with the content?`,

  summarize: `STEP 1: READ ALL INSTRUCTIONS BELOW BEFORE YOU START

STEP 2: COMPLETE THE TASK
Summarize the following content in a clear and concise way. Capture the main ideas, key points, and any important conclusions or action items. Keep the summary objective and easy to understand, regardless of the topic or audience.

STEP 3: UNDERSTAND THE OUTPUT FORMAT
- Do NOT write "Here's a summary"
- Do NOT write "This text is about"
- Do NOT add any introduction or explanation
- Output ONLY the summary in plain text format
- Start immediately with the first word of the summary
- You MAY use bullets and outline format if it helps organize the key points

STEP 4: FOLLOW THESE PUNCTUATION RULES (CHECK EACH ONE):
□ Never use em dashes (the long dash that looks like this: —)
□ Never use en dashes (the medium dash that looks like this: –)
□ Never use semicolons (;)
□ Only use hyphens when joining two words into one compound word (examples: "well-known" or "high-quality")
□ Do NOT use hyphens to replace dashes in sentences
□ Use only these punctuation marks: commas, periods, parentheses, colons
□ If you would normally use a dash, use a comma or period instead
□ If you would normally use a semicolon, split it into two sentences with a period

STEP 5: APPLY THIS TONE (CHECK EACH ONE):
□ Approachable, confident, and grounded
□ Friendly and conversational but professional
□ Human and kind, not corporate or robotic
□ Confident but not cocky
□ Kind but not soft
□ Direct but not blunt
□ Professional but not formal
□ Conversational but not casual slang
□ If there's tension, diffuse it calmly and respectfully

STEP 6: BEFORE YOU RESPOND, VERIFY:
□ Did I remove ALL em dashes and en dashes?
□ Did I remove ALL semicolons?
□ Did I skip the preamble and start directly with the content?`,

  makeLonger: `STEP 1: READ ALL INSTRUCTIONS BELOW BEFORE YOU START

STEP 2: COMPLETE THE TASK
Expand this text with additional detail, examples, and elaboration while maintaining the original tone and message.

STEP 3: UNDERSTAND THE OUTPUT FORMAT
- Do NOT write "Here's the longer version"
- Do NOT write "I've expanded this"
- Do NOT add any introduction or explanation
- Do NOT use markdown formatting (no bold, no italics, no headers, no bullets)
- Do NOT use asterisks, underscores, or hashtags
- Output ONLY the expanded text in plain text format
- Start immediately with the first word of the expanded content

STEP 4: FOLLOW THESE PUNCTUATION RULES (CHECK EACH ONE):
□ Never use em dashes (the long dash that looks like this: —)
□ Never use en dashes (the medium dash that looks like this: –)
□ Never use semicolons (;)
□ Only use hyphens when joining two words into one compound word (examples: "well-known" or "high-quality")
□ Do NOT use hyphens to replace dashes in sentences
□ Use only these punctuation marks: commas, periods, parentheses, colons
□ If you would normally use a dash, use a comma or period instead
□ If you would normally use a semicolon, split it into two sentences with a period

STEP 5: APPLY THIS TONE (CHECK EACH ONE):
□ Approachable, confident, and grounded
□ Friendly and conversational but professional
□ Human and kind, not corporate or robotic
□ Confident but not cocky
□ Kind but not soft
□ Direct but not blunt
□ Professional but not formal
□ Conversational but not casual slang
□ If there's tension, diffuse it calmly and respectfully

STEP 6: BEFORE YOU RESPOND, VERIFY:
□ Did I remove ALL markdown formatting?
□ Did I remove ALL em dashes and en dashes?
□ Did I remove ALL semicolons?
□ Did I skip the preamble and start directly with the content?`,

  makeShorter: `STEP 1: READ ALL INSTRUCTIONS BELOW BEFORE YOU START

STEP 2: COMPLETE THE TASK
Condense this text to its essential points while preserving the core message and tone.

STEP 3: UNDERSTAND THE OUTPUT FORMAT
- Do NOT write "Here's the shorter version"
- Do NOT write "I've condensed this"
- Do NOT add any introduction or explanation
- Do NOT use markdown formatting (no bold, no italics, no headers, no bullets)
- Do NOT use asterisks, underscores, or hashtags
- Output ONLY the condensed text in plain text format
- Start immediately with the first word of the condensed content

STEP 4: FOLLOW THESE PUNCTUATION RULES (CHECK EACH ONE):
□ Never use em dashes (the long dash that looks like this: —)
□ Never use en dashes (the medium dash that looks like this: –)
□ Never use semicolons (;)
□ Only use hyphens when joining two words into one compound word (examples: "well-known" or "high-quality")
□ Do NOT use hyphens to replace dashes in sentences
□ Use only these punctuation marks: commas, periods, parentheses, colons
□ If you would normally use a dash, use a comma or period instead
□ If you would normally use a semicolon, split it into two sentences with a period

STEP 5: APPLY THIS TONE (CHECK EACH ONE):
□ Approachable, confident, and grounded
□ Friendly and conversational but professional
□ Human and kind, not corporate or robotic
□ Confident but not cocky
□ Kind but not soft
□ Direct but not blunt
□ Professional but not formal
□ Conversational but not casual slang
□ If there's tension, diffuse it calmly and respectfully

STEP 6: BEFORE YOU RESPOND, VERIFY:
□ Did I remove ALL markdown formatting?
□ Did I remove ALL em dashes and en dashes?
□ Did I remove ALL semicolons?
□ Did I skip the preamble and start directly with the content?`
};

function prepareResponse(data) {
  // if holding shift, copy just the response. else, paste the last input and response.
  if (popclip.modifiers.shift) {
    popclip.copyText(data);
  } else {
    popclip.pasteText(data);
  }
}

async function callLLMapi(prompt, options) {
  if (options.model.startsWith("gpt")) {
    return await callOpenAPI(prompt, options);
  } else if (options.model.startsWith("claude")) {
    return await callClaudeAPI(prompt, options);
  } else if (options.model.startsWith("mistral")) {
    return await callMistralAPI(prompt, options);
  } else if (options.model.startsWith("gemini")) {
    return await callGeminiAPI(prompt, options);
  } else throw new Error("Unknown model selection:" + options.model);
}

// --- CLAUDE
async function callClaudeAPI(prompt, options) {
  const key = options.claudeapikey.trim();
  if (!key || key.length === 0)
    throw new Error("Settings error: missing Claude API key");

  const requestConfig = {
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
      Accept: "application/json"
    }
  };

  const messages = [{ role: "user", content: prompt }];

  const { data } = await axios.post(
    "https://api.anthropic.com/v1/messages",
    {
      model: options.model,
      max_tokens: 2048,
      messages
    },
    requestConfig
  );
  return data.content[0].text.trim();
}

// --- OPENAI
async function callOpenAPI(prompt, options) {
  const key = options.apikey.trim();
  if (!key || key.length === 0)
    throw new Error("Settings error: missing OpenAI API key");

  const requestConfig = {
    headers: {
      Authorization: `Bearer ${key}`
    }
  };

  const messages = [{ role: "user", content: prompt }];
  const { data } = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: options.model,
      messages
    },
    requestConfig
  );
  return data.choices[0].message.content.trim();
}

// --- MISTRAL
async function callMistralAPI(prompt, options) {
  const key = options.mistralapikey.trim();
  if (!key || key.length === 0)
    throw new Error("Settings error: missing Mistral API key");

  const requestConfig = {
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Accept: "application/json"
    }
  };

  const messages = [{ role: "user", content: prompt }];
  const { data } = await axios.post(
    "https://api.mistral.ai/v1/chat/completions",
    {
      model: options.model,
      max_tokens: 2048,
      messages
    },
    requestConfig
  );
  return data.choices[0].message.content.trim();
}

// --- GEMINI
async function callGeminiAPI(prompt, options) {
  const key = options.geminiapikey.trim();
  if (!key || key.length === 0)
    throw new Error("Settings error: missing Gemini API key");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${options.model}:generateContent?key=${key}`;
  
  const body = {
    contents: [{
      parts: [{ text: prompt }]
    }]
  };

  const { data } = await axios.post(url, body, {
    headers: { "Content-Type": "application/json" }
  });
  
  if (!data || !data.candidates || !data.candidates[0]) {
    throw new Error("Gemini API error: Invalid response");
  }
  
  return data.candidates[0].content.parts[0].text.trim();
}

async function improveWritting(input, options) {
  let prompt = PROMPTS.improveWriting;
  prompt += "\n\n" + input.text.trim();

  const data = await callLLMapi(prompt, options);
  prepareResponse(data);
}

async function spellingAndGrammar(input, options) {
  let prompt = PROMPTS.correctSpellingGrammar;
  prompt += "\n\n" + input.text.trim();

  const data = await callLLMapi(prompt, options);
  prepareResponse(data);
}

async function summarize(input, options) {
  let prompt = PROMPTS.summarize;
  prompt += "\n\n" + input.text.trim();

  const data = await callLLMapi(prompt, options);
  prepareResponse(data);
}

async function makeLonger(input, options) {
  let prompt = PROMPTS.makeLonger;
  prompt += "\n\n" + input.text.trim();

  const data = await callLLMapi(prompt, options);
  prepareResponse(data);
}

async function makeShorter(input, options) {
  let prompt = PROMPTS.makeShorter;
  prompt += "\n\n" + input.text.trim();

  const data = await callLLMapi(prompt, options);
  prepareResponse(data);
}

exports.actions = [
  {
    title: "Improve Writing",
    icon: "iconify:heroicons-solid:sparkles",
    code: improveWritting,
    requirements: ["option-enable-improve-writing=1"]
  },
  {
    title: "Correct Spelling & Grammar",
    icon: "iconify:heroicons-solid:check-circle",
    code: spellingAndGrammar,
    requirements: ["option-enable-spelling-grammar=1"]
  },
  {
    title: "Make Longer",
    icon: "iconify:heroicons-solid:plus-circle",
    code: makeLonger,
    requirements: ["option-enable-make-longer=1"]
  },
  {
    title: "Make Shorter",
    icon: "iconify:heroicons-solid:minus-circle",
    code: makeShorter,
    requirements: ["option-enable-make-shorter=1"]
  },
  {
    title: "Summarize",
    icon: "iconify:heroicons-solid:list-bullet",
    code: summarize,
    after: "show-result",
    requirements: ["option-enable-summarize=1"]
  }
];
