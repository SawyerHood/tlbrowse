type Provider = "anthropic" | "groq" | "openai" | "mistral";

export const SUPPORTED_MODELS = [
  // OpenAI
  "gpt-3.5-turbo",
  "gpt-4",
  "gpt-4-turbo",
  "gpt-4-32k",
  "gpt-4o",
  // Anthropic
  "claude-3-opus-20240229",
  "claude-3-sonnet-20240229",
  "claude-3-haiku-20240307",
  // Groq
  "llama3-70b-8192",
  "llama3-8b-8192",

  // Mistral
  "codestral-latest",
];

export function modelToProvider(model: string): Provider {
  switch (model) {
    case "gpt-3.5-turbo":
    case "gpt-4":
    case "gpt-4-turbo":
    case "gpt-4-32k":
    case "gpt-4o":
      return "openai";
    case "claude-3-opus-20240229":
    case "claude-3-sonnet-20240229":
    case "claude-3-haiku-20240307":
      return "anthropic";
    case "llama3-70b-8192":
    case "llama3-8b-8192":
      return "groq";

    case "codestral-latest":
      return "mistral";

    default:
      throw new Error(`Model ${model} not supported`);
  }
}

export const MODELS_GROUPED_BY_PROVIDER = SUPPORTED_MODELS.reduce(
  (acc, model) => {
    const provider = modelToProvider(model);
    acc[provider].push(model);
    return acc;
  },
  { openai: [], anthropic: [], groq: [], mistral: [] } as Record<
    Provider,
    string[]
  >
);

export function selectKeyForModel(
  model: string,
  keys: { openai: string; anthropic: string; groq: string; mistral: string }
): string {
  const provider = modelToProvider(model);
  return keys[provider];
}

export function modelToOpenRouter(
  model: "haiku" | "opus" | "sonnet" | "gpt-4o"
) {
  switch (model) {
    case "haiku":
      return "anthropic/claude-3-haiku";
    case "opus":
      return "anthropic/claude-3-opus";
    case "sonnet":
      return "anthropic/claude-3-sonnet";
    case "gpt-4o":
      return "openai/gpt-4o";
  }
}
