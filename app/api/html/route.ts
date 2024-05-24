import { createClient } from "@/ai/client";
import { system } from "@/ai/prompt";
import { NextRequest } from "next/server";

import {
  ChatCompletionCreateParamsStreaming,
  ChatCompletionMessageParam,
} from "openai/resources/index.mjs";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const url = params.get("url")!;
  const rawDeps = params.get("deps") || "[]";
  const deps = JSON.parse(rawDeps);

  return new Response(
    new ReadableStream({
      async start(controller) {
        try {
          const programStream = await createProgramStream({
            url,
            deps: deps.filter((dep: { url: string }) => dep.url !== url),
          });

          let programResult = "";

          let startedSending = false;
          let sentIndex = 0;

          for await (const chunk of programStream) {
            const value = chunk.choices[0]?.delta?.content || "";

            programResult += value;

            if (startedSending) {
              const match = programResult.match(/<\/html>/);
              if (match) {
                controller.enqueue(
                  programResult.slice(sentIndex, match.index! + match[0].length)
                );
                break;
              } else {
                controller.enqueue(value);
                sentIndex = programResult.length;
              }
            } else {
              const match = programResult.match(/<head>/);
              if (match) {
                programResult =
                  `<!DOCTYPE html><html><head><script src="/bootstrap.js"></script>\n` +
                  programResult.slice(match.index! + match[0].length);
                controller.enqueue(programResult);
                sentIndex = programResult.length;
                startedSending = true;
              }
            }
          }
          await new Promise((resolve) => setTimeout(resolve, 50));
          controller.close();
        } catch (e) {
          console.error(e);
          controller.error(e);
          controller.close();
        }
      },
    }).pipeThrough(new TextEncoderStream()),
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
