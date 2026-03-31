'use server';
/**
 * @fileOverview An AI Rental Assistant flow that helps users navigate listings and find their ideal home.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const RentalAssistantInputSchema = z.object({
  userQuery: z.string().describe('The user\'s question or request.'),
  context: z.string().optional().describe('Context about the current page or available properties.'),
});
export type RentalAssistantInput = z.infer<typeof RentalAssistantInputSchema>;

const RentalAssistantOutputSchema = z.object({
  response: z.string().describe('The AI\'s response to the user.'),
  suggestions: z.array(z.string()).describe('Quick follow-up questions for the user.'),
});
export type RentalAssistantOutput = z.infer<typeof RentalAssistantOutputSchema>;

export async function rentalAssistant(input: RentalAssistantInput): Promise<RentalAssistantOutput> {
  return rentalAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'rentalAssistantPrompt',
  input: { schema: RentalAssistantInputSchema },
  output: { schema: RentalAssistantOutputSchema },
  prompt: `You are the NairobiPad AI Concierge. Your goal is to help users find the perfect rental property in Nairobi and other Kenyan cities.

You have access to the following context:
{{{context}}}

User Query: {{{userQuery}}}

Guidelines:
- Be professional, helpful, and concise.
- If the user is looking for a property, use the provided context to make recommendations.
- Mention specific areas like Westlands, Kilimani, or Parklands if relevant.
- Always provide 3 short follow-up suggestions for the user.
`,
});

const rentalAssistantFlow = ai.defineFlow(
  {
    name: 'rentalAssistantFlow',
    inputSchema: RentalAssistantInputSchema,
    outputSchema: RentalAssistantOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) throw new Error('No output from AI');
    return output;
  }
);
