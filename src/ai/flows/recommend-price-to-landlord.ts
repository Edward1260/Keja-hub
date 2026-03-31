'use server';
/**
 * @fileOverview An AI agent that provides rental price recommendations for landlords.
 *
 * - recommendPriceToLandlord - A function that handles the rental price recommendation process.
 * - RecommendPriceToLandlordInput - The input type for the recommendPriceToLandlord function.
 * - RecommendPriceToLandlordOutput - The return type for the recommendPriceToLandlord function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RecommendPriceToLandlordInputSchema = z.object({
  propertyType: z.string().describe('The type of property (e.g., apartment, house, studio).'),
  bedrooms: z.number().int().min(0).describe('The number of bedrooms in the property.'),
  bathrooms: z.number().int().min(0).describe('The number of bathrooms in the property.'),
  sizeSqFt: z.number().int().min(1).describe('The size of the property in square feet.'),
  locationDescription: z
    .string()
    .describe("A detailed description of the property's location, including proximity to institutions like University of Nairobi."),
  amenities: z.array(z.string()).describe('A list of amenities available at the property (e.g., furnished, parking, internet, gym).'),
  currentMarketTrends: z.string().optional().describe('Optional: A brief overview of current rental market trends in Nairobi, if available.'),
});
export type RecommendPriceToLandlordInput = z.infer<typeof RecommendPriceToLandlordInputSchema>;

const RecommendPriceToLandlordOutputSchema = z.object({
  recommendedPrice: z.number().min(0).describe('The recommended optimal monthly rental price in KES.'),
  reasoning: z
    .string()
    .describe('A detailed justification for the recommended price, considering market trends, property features, and location.'),
});
export type RecommendPriceToLandlordOutput = z.infer<typeof RecommendPriceToLandlordOutputSchema>;

const priceRecommendationPrompt = ai.definePrompt({
  name: 'priceRecommendationPrompt',
  input: {schema: RecommendPriceToLandlordInputSchema},
  output: {schema: RecommendPriceToLandlordOutputSchema},
  prompt: `You are an expert real estate market analyst specializing in student accommodation in Nairobi, Kenya.
Your task is to provide an optimal monthly rental price recommendation (in Kenyan Shillings - KES) for a property, along with a clear justification.
Consider the property's features, location, and current market trends to provide a competitive and fair price that maximizes landlord earnings.

Property Details:
- Property Type: {{{propertyType}}}
- Bedrooms: {{{bedrooms}}}
- Bathrooms: {{{bathrooms}}}
- Size (SqFt): {{{sizeSqFt}}}
- Location: {{{locationDescription}}}
- Amenities: {{#each amenities}}- {{{this}}}
{{/each}}
{{#if currentMarketTrends}}
Current Market Trends: {{{currentMarketTrends}}}
{{/if}}

Based on the above information and current market conditions in Nairobi, what is the optimal monthly rental price in KES for this property? Provide a clear numerical value for the recommendedPrice and a detailed reasoning for your recommendation.
`,
});

const recommendPriceToLandlordFlow = ai.defineFlow(
  {
    name: 'recommendPriceToLandlordFlow',
    inputSchema: RecommendPriceToLandlordInputSchema,
    outputSchema: RecommendPriceToLandlordOutputSchema,
  },
  async input => {
    const {output} = await priceRecommendationPrompt(input);
    if (!output) {
      throw new Error('Failed to get a price recommendation.');
    }
    return output;
  }
);

export async function recommendPriceToLandlord(
  input: RecommendPriceToLandlordInput
): Promise<RecommendPriceToLandlordOutput> {
  return recommendPriceToLandlordFlow(input);
}
