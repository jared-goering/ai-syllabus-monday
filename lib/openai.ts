import OpenAI from "openai"

/**
 * Shared OpenAI client configured via the OPENAI_API_KEY environment variable.
 *
 * IMPORTANT: Make sure you set NEXT_PUBLIC_OPENAI_API_KEY (for edge runtime) or
 * OPENAI_API_KEY (for node runtime) in your environment. The latter is used on
 * the server only, which is the safer choice because it will never be shipped
 * to the browser.
 */
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) 