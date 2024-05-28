import { createClient } from "@/ai/client";
import { system } from "@/ai/prompt";
import { NextRequest } from "next/server";
import { streamHtml } from "openai-html-stream";

import {
  ChatCompletionCreateParamsStreaming,
  ChatCompletionMessageParam,
} from "openai/resources/index.mjs";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const url = params.get("url")!;
  const rawDeps = params.get("deps") || "[]";
  const deps = JSON.parse(rawDeps);
  const programStream = await createProgramStream({
    url,
    deps: deps.filter((dep: { url: string }) => dep.url !== url),
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
    model: "gpt-4o",
    stream: true,
  };

  console.log(params);

  const stream = await createClient(
    process.env.OPENAI_API_KEY!
  ).chat.completions.create(params);

  return stream;
}
