import OpenAI from "openai";

export const createClient = (key: string) => {
  return new OpenAI({
    baseURL: "https://braintrustproxy.com/v1",
    apiKey: key,
  });
};
