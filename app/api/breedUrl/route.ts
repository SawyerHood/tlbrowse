import { createClient } from "@/ai/client";
import PostHogClient from "@/lib/postHogServer";
import { shouldUseAuth } from "@/lib/shouldUseAuth";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

import { ChatCompletionCreateParams } from "openai/resources/index.mjs";

const makePrompt = (
  p1: string,
  p2: string
) => `You will be acting as a website breeder. Your task is to generate a new website name based on two existing websites, as if the new website were the offspring of the two parent sites.

Here are the two URLs you will be working with:
<url1>
${p1}
</url1>
<url2>
${p2}
</url2>

To generate the offspring website name, follow these steps:

1. Analyze each website and identify their key elements, themes, and characteristics. Consider factors such as the website's purpose, target audience, design style, and content focus.

2. Brainstorm potential offspring website names that combine elements from both parent websites. The new name should reflect a blend of the two sites' themes and characteristics.

3. When creating the offspring website name, keep these guidelines in mind:
   - The name should be concise and memorable.
   - It should maintain a coherent theme that relates to both parent websites.
   - The name should hint at the potential purpose or content of the hypothetical offspring website.
   - Feel free to use wordplay, puns, or creative combinations of words from the parent website names or their key elements.

4. After brainstorming and refining your ideas, select the best offspring website name.

Please output the final offspring website name inside <offspring_url> tags.
`;

export async function POST(req: NextRequest) {
  const { urls } = await req.json();

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
      event: "breed url",
    });
  }

  const offspringUrl = await genResponse({ urls });

  return new Response(JSON.stringify(offspringUrl), {
    headers: {
      "Content-Type": "application/json",
    },
    status: 200,
  });
}

async function genResponse({ urls }: { urls: string[] }): Promise<string> {
  const params: ChatCompletionCreateParams = {
    messages: [
      {
        role: "user",
        content: makePrompt(urls[0], urls[1]),
      },
    ],

    model: "claude-3-haiku-20240307",
    max_tokens: 4000,
  };

  const client = createClient(process.env.ANTHROPIC_API_KEY!);

  const content = (await client.chat.completions.create(params)).choices[0]
    .message.content!;
  const offspringUrlMatch = content.match(
    /<offspring_url>(.*?)<\/offspring_url>/
  );
  return offspringUrlMatch ? offspringUrlMatch[1] : "";
}
