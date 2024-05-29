import OpenAI from "openai";

export const createClient = (key: string) => {
  return new OpenAI({
    baseURL: "https://codestral.mistral.ai/v1",
    apiKey: key,
  });
};
