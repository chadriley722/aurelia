import { OpenAI } from 'openai';

export const config = { runtime: 'edge' };

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const AURELIA_ID = process.env.AURELIA_ASSISTANT_ID!;

export default async function handler(req: Request) {
  if (req.method !== 'POST')
    return new Response('Method Not Allowed', { status: 405 });

  try {
    const { message, threadId } = await req.json();
    const thread = threadId ?? (await openai.beta.threads.create({})).id;

    await openai.beta.threads.messages.create(thread, {
      role: 'user',
      content: message,
    });

    const run = await openai.beta.threads.runs.create(thread, {
      assistant_id: AURELIA_ID,
      stream: true,
    });

    return new Response(run.toReadableStream(), {
      headers: { 'Content-Type': 'text/event-stream' },
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
