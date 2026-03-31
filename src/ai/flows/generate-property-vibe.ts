'use server';
/**
 * @fileOverview AI Vibe Analytics agent for NairobiPad.
 *
 * - generatePropertyVibe - Function to analyze property vibe.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const VibeInputSchema = z.object({
  title: z.string(),
  description: z.string(),
  amenities: z.array(z.string()).optional(),
  location: z.string(),
});

const VibeOutputSchema = z.object({
  vibeLabel: z.string().describe('A short, catchy label for the vibe (e.g., Focused Studio).'),
  vibeDescription: z.string().describe('A 1-sentence description of the atmosphere.'),
  suitabilityScore: z.number().min(0).max(100).describe('How well it fits student needs.'),
  tags: z.array(z.string()).limit(3),
});

export type PropertyVibe = z.infer<typeof VibeOutputSchema>;

const vibePrompt = ai.definePrompt({
  name: 'vibePrompt',
  input: { schema: VibeInputSchema },
  output: { schema: VibeOutputSchema },
  prompt: `You are the NairobiPad Neural Architect. Your task is to analyze a property listing and determine its "Vibe Profile".

Property: {{{title}}}
Location: {{{location}}}
Description: {{{description}}}
Amenities: {{#each amenities}}- {{{this}}}
{{/each}}

Based on this, generate a JSON object with:
1. 'vibeLabel': A premium, technical-sounding label.
2. 'vibeDescription': An evocative sentence about the lifestyle.
3. 'suitabilityScore': 0-100 score for student/professional productivity.
4. 'tags': 3 keywords representing the core essence.

Return strictly JSON.`,
});

export async function generatePropertyVibe(input: z.infer<typeof VibeInputSchema>): Promise<PropertyVibe> {
  const { output } = await vibePrompt(input);
  if (!output) throw new Error('Vibe projection failed');
  return output;
}
