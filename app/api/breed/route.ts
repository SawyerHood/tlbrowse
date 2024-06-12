import { createClient } from "@/ai/client";
import { modelToOpenRouter } from "@/ai/models";
import PostHogClient from "@/lib/postHogServer";
import { shouldUseAuth } from "@/lib/shouldUseAuth";
import { Settings } from "@/state/settings";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { streamHtml } from "openai-html-stream";

import { ChatCompletionCreateParamsStreaming } from "openai/resources/index.mjs";

const makePrompt = (
  p1: string,
  p2: string
) => `Here are two "parent" websites in HTML format:

<parent1_html>
${p1}
</parent1_html>

<parent2_html>
${p2}
</parent2_html>

Your task is to create an "offspring" website by combining features and elements from these two parent sites. The offspring site should inherit aspects of the layout, styling, content and functionality from each parent. However, it should also allow for random mutations and variations to occur, so the child site is a unique remix of its parents, not just a direct clone.

First, carefully analyze each parent site's HTML. In a <scratchpad>, list out the key features, elements, and styles used in each parent. Consider things like:

- Overall layout structure (e.g. header, sidebar, main content area, footer) 
- Color scheme, fonts, and other stylistic choices
- Navigation menus and link styles
- Key content sections and how they are arranged
- Any interactive elements like forms, buttons, animations
- Unique or interesting HTML elements or CSS tricks used

After analyzing the parents, brainstorm ideas for how to combine their features into the offspring site. Consider questions like:

- Which parent's layout should be the primary influence? How can elements of the other layout be incorporated?
- How can the color schemes and styles be melded together or evolved into something new?
- Which content sections from each parent should be preserved? Can any be combined, split up, or turned into new types of content?
- What new features or elements could be introduced that aren't in either parent?

Brainstorm at least 3-4 possible creative directions for the offspring site before settling on a direction.

Finally, generate the full HTML code for the offspring website. Combine the key elements and features of the parents based on your brainstorming, but mutate and evolve them as well, so the offspring has its own unique identity.

The offspring HTML should be a fully valid, standalone HTML file that could be saved and opened in a web browser. It should combine substantial portions of HTML from each parent file, but mutated and blended together, not just copied verbatim. It should also include some new "evolved" features not present in either parent.

Return the full HTML of the offspring inside <offspring_html> tags.

Remember, the goal is a whimsical, surprising, but still functional remix of the parent sites, almost like the output of a "genetic algorithm" applied to website code. Be creative, and have fun! But make sure the output is still valid HTML.
`;

export async function POST(req: NextRequest) {
  console.log("breed");
  const formData = await req.formData();
  const rawDeps = (formData.get("deps") as string) || "[]";
  const deps = JSON.parse(rawDeps);
  const prompts = JSON.parse((formData.get("prompts")! as string) || "[]");
  const settings: Settings = JSON.parse(formData.get("settings")! as string);

  console.log(deps);

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
        model: settings?.model,
        depth: deps.length,
      },
    });
  }

  const programStream = await createProgramStream({
    prompts,
    // Keep only the last 3 deps
    deps: deps.filter((dep: { html?: string }) => dep.html).slice(-3),
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
  deps,
  settings,
  prompts,
}: {
  deps: { url: string; html: string }[];
  settings: Settings;
  prompts: string[];
}) {
  const params: ChatCompletionCreateParamsStreaming = {
    messages: [
      {
        role: "system",
        content: makePrompt(deps[0].html, deps[1].html),
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
