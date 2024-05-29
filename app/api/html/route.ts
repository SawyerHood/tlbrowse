import { createClient } from "@/ai/client";
import { system } from "@/ai/prompt";
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
  const programStream = await createProgramStream({
    url,
    // Keep only the last 3 deps
    deps: deps.filter((dep: { url: string }) => dep.url !== url).slice(-3),
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
}: {
  url: string;
  deps: { url: string; html: string }[];
}) {
  const params: ChatCompletionCreateParamsStreaming = {
    messages: [
      {
        role: "system",
        content: system,
      },
      ...deps.flatMap((dep): ChatCompletionMessageParam[] => [
        {
          role: "user",
          content: dep.url,
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
        content: url,
      },
    ],
    model: "codestral-latest",
    stream: true,
  };

  console.log(params);

  const stream = await createClient(
    process.env.MISTRAL_API_KEY!
  ).chat.completions.create(params);

  return stream;
}
