import { createClient } from "@/ai/client";
import { modelToOpenRouter } from "@/ai/models";
import { system } from "@/ai/prompt";
import PostHogClient from "@/lib/postHogServer";
import { shouldUseAuth } from "@/lib/shouldUseAuth";
import { Settings } from "@/state/settings";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { streamHtml } from "openai-html-stream";

import {
  ChatCompletionCreateParamsStreaming,
  ChatCompletionMessageParam,
} from "openai/resources/index.mjs";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const url = formData.get("url")! as string;
  const rawDeps = (formData.get("deps") as string) || "[]";
  const deps = JSON.parse(rawDeps);
  const prompts = JSON.parse((formData.get("prompts")! as string) || "[]");
  const settings: Settings = JSON.parse(formData.get("settings")! as string);

  if (shouldUseAuth) {
    const user = await currentUser();
    const posthog = PostHogClient();

    if (!user) {
      return new Response(`<h1>Unauthorized</h1><p>Log in to continue</p>`, {
        status: 401,
        headers: { "Content-Type": "text/html" },
      });
    }

    posthog.capture({
      distinctId: user.id,
      event: "gen html",
      properties: {
        url,
        model: settings?.model,
        depth: deps.length,
      },
    });
  }

  const programStream = await createProgramStream({
    url,
    prompts,
    // Keep only the last 3 deps
    deps: deps
      .filter(
        (dep: { url: string; html?: string }) => dep.html && dep.url !== url
      )
      .slice(-3),
    settings,
  });

  return new Response(
    streamHtml(programStream, {
      injectIntoHead: '<script src="/bootstrap.js"></script>',
    }),
    {
      headers: {
        "Content-Type": "text/html",
      },
      status: 200,
    }
  );
}

async function createProgramStream({
  url,
  deps,
  settings,
  prompts,
}: {
  url: string;
  deps: { url: string; html: string }[];
  settings: Settings;
  prompts: string[];
}) {
  const makeMessage = (url: string) => {
    if (!prompts.length) {
      return `<url>${url}</url>`;
    }

    return `${prompts
      .map((prompt) => `<directive>${prompt}</directive>`)
      .join("\n")}\n<url>${url}</url>`;
  };
  const params: ChatCompletionCreateParamsStreaming = {
    messages: [
      {
        role: "system",
        content: settings.prompt || system,
      },
      ...deps.flatMap((dep): ChatCompletionMessageParam[] => [
        {
          role: "user",
          content: makeMessage(dep.url),
        },
        {
          role: "assistant",
          content: dep.html.replace(
            `<script src="/bootstrap.js"></script>`,
            ""
          ),
        },
      ]),
      {
        role: "user",
        content: makeMessage(url),
      },
    ],

    model: !settings.apiKey
      ? "claude-3-haiku-20240307"
      : modelToOpenRouter(settings.model),
    stream: true,
    max_tokens: 4000,
  };

  const client = createClientFromSettings(settings);

  return await client.chat.completions.create(params);
}

function createClientFromSettings(settings: Settings) {
  if (!settings.apiKey) {
    return createClient(process.env.ANTHROPIC_API_KEY!);
  }

  return createClient(settings.apiKey, "https://openrouter.ai/api/v1");
}
