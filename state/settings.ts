import { atomWithStorage } from "jotai/utils";
import { atom } from "jotai";

export type Settings = {
  apiKey: string;
  model: "haiku" | "sonnet" | "opus" | "gpt-4o";
  prompt: string;
};

export const settingsAtom = atomWithStorage<Settings>("settings", {
  apiKey: "",
  model: "haiku",
  prompt: "",
});

export const settingsStringAtom = atom((get) => {
  return JSON.stringify(get(settingsAtom));
});

export const DEFAULT_SETTINGS = {
  apiKey: "",
  model: "haiku",
  prompt: "",
};
