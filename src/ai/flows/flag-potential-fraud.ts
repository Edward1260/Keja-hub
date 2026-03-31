'use server';
/**
 * @fileOverview An AI agent that flags potential fraudulent listings, user activities, or payment patterns.
 *
 * - flagPotentialFraud - A function that handles the fraud detection process.
 * - FlagPotentialFraudInput - The input type for the flagPotentialFraud function.
 * - FlagPotentialFraudOutput - The return type for the flagPotentialFraud function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FlagPotentialFraudInputSchema = z.object({
  reviewContent: z
    .string()
    .describe('Content to be reviewed for potential fraud, e.g., a listing description, user activity log, or payment details.'),
  context: z
    .string()
    .optional()
    .describe('Additional context or background information relevant to the review content.'),
});
export type FlagPotentialFraudInput = z.infer<typeof FlagPotentialFraudInputSchema>;

const FlagPotentialFraudOutputSchema = z.object({
  isFraudSuspected: z.boolean().describe('True if fraud is suspected, false otherwise.'),
  fraudConfidenceScore: z
    .number()
    .min(0)
    .max(1)
    .describe('A score from 0 to 1 indicating the confidence level of fraud suspicion, where 1 is high confidence.'),
  reasoning: z.string().describe('A detailed explanation of why fraud is suspected or not.'),
  recommendations: z
    .array(z.string())
    .describe('Recommended actions for administrators to investigate further, if fraud is suspected.'),
});
export type FlagPotentialFraudOutput = z.infer<typeof FlagPotentialFraudOutputSchema>;

export async function flagPotentialFraud(
  input: FlagPotentialFraudInput
): Promise<FlagPotentialFraudOutput> {
  return flagPotentialFraudFlow(input);
}

const prompt = ai.definePrompt({
  name: 'flagPotentialFraudPrompt',
  input: {schema: FlagPotentialFraudInputSchema},
  output: {schema: FlagPotentialFraudOutputSchema},
  prompt: `You are an AI-powered fraud detection system for NairobiPad, a property and student accommodation platform.
Your task is to analyze provided content and determine if there are signs of potential fraud (e.g., fake listings, suspicious user behavior, abnormal payment patterns).

Consider the following:
- Consistency and plausibility of details.
- Unusual language or offers.
- Red flags in user activity or payment history.
- Any additional context provided.

Return a JSON object indicating if fraud is suspected, a confidence score, a detailed reasoning, and specific recommendations for further investigation if fraud is suspected.

Review Content: {{{reviewContent}}}

{{#if context}}
Additional Context: {{{context}}}
{{/if}}
`,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_NONE',
      },
    ],
  },
});

const flagPotentialFraudFlow = ai.defineFlow(
  {
    name: 'flagPotentialFraudFlow',
    inputSchema: FlagPotentialFraudInputSchema,
    outputSchema: FlagPotentialFraudOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('No output received from the prompt.');
    }
    return output;
  }
);
