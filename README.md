# tlbrowse

tlbrowse is an infinite canvas for the simulated web. You can create webpages by entering urls and clicking on links creates new pages. You should get incredibly funky with what imagine.

You can play with the hosted version on [https://tlbrowse.com](https://tlbrowse.com)

## Running Locally

Create a `.env.local` file with the following environment variables:

```
ANTHROPIC_API_KEY=<your-anthropic-api-key>
```

```bash
bun install
bun dev
```

## Changing the model

If you clone this locally you probably want to change the model. You can do this by editing `app/api/html/route.ts`.
