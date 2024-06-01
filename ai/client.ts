import OpenAI from "openai";

export const createClient = (
  key: string,
  baseURL: string = "https://braintrustproxy.com/v1"
) => {
  return new OpenAI({
    baseURL: baseURL,
    apiKey: key,
  });
};
