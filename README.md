# tlbrowse

https://github.com/SawyerHood/tlbrowse/assets/2380669/bcbb7ac1-c463-44ad-9adb-6be59f4c636e

tlbrowse is an infinite canvas for the simulated web. You can create webpages by entering urls and clicking on links creates new pages. You should get incredibly funky with what imagine.

You can play with the hosted version on [https://tlbrowse.com](https://tlbrowse.com)

## Why?

For fun! This is an experiment in new ways of brainstorming and interacting with LLMs. This is a demo, but I'm trying to poke around with new ways to play with visual outputs from LLMs. I'm really inspired about being able to latently build out an entire sitemap while browsing. Is this ready to create production ready websites? No way, but the interaction paradigm is interesting.

## Running Locally

Create a `.env.local` file with the following environment variables:

```
ANTHROPIC_API_KEY=<your-anthropic-api-key>
```

This project uses [`bun`](https://bun.sh/) as its package manager and [`node`](https://nodejs.org/) for its execution environment. Make sure that you have both installed. Then run the following commands:

```bash
bun install
bun dev
```

## Changing the model

If you clone this locally you probably want to change the model. You can do this by editing `app/api/html/route.ts`.
