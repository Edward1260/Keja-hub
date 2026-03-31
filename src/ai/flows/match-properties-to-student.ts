'use server';
/**
 * @fileOverview A personalized property matching AI agent for students.
 *
 * - matchPropertiesToStudent - A function that handles the personalized property matching process.
 * - MatchPropertiesToStudentInput - The input type for the matchPropertiesToStudent function.
 * - MatchPropertiesToStudentOutput - The return type for the matchPropertiesToStudent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MatchPropertiesToStudentInputSchema = z.object({
  studentProfile: z
    .object({
      id: z.string().describe('The unique ID of the student.'),
      name: z.string().describe('The name of the student.'),
      budget: z
        .object({
          min: z.number().optional().describe('Minimum monthly budget.'),
          max: z.number().optional().describe('Maximum monthly budget.'),
        })
        .optional()
        .describe('Student budget for accommodation.'),
      desiredLocation: z
        .string()
        .optional()
        .describe('Preferred location for accommodation (e.g., "University of Nairobi").'),
      roommatePreferences: z
        .array(z.string())
        .optional()
        .describe('Preferences for roommates (e.g., "quiet", "social").'),
      lifestyle: z
        .array(z.string())
        .optional()
        .describe('Lifestyle preferences (e.g., "near campus", "has gym").'),
      propertyTypePreferences: z
        .array(z.string())
        .optional()
        .describe('Preferred property types (e.g., "apartment", "hostel").'),
    })
    .describe('The student\'s profile details.'),
  searchHistory: z
    .array(
      z.object({
        query: z.string().describe('The search query.'),
        results: z.array(z.string()).describe('List of property IDs from the search results.'),
        timestamp: z.string().describe('Timestamp of the search.'),
      })
    )
    .optional()
    .describe('A list of the student\'s past search queries and results.'),
  availableProperties: z
    .array(
      z.object({
        id: z.string().describe('Unique ID of the property.'),
        name: z.string().describe('Name of the property.'),
        description: z.string().describe('A brief description of the property.'),
        location: z.string().describe('General location of the property.'),
        price: z.number().describe('Monthly rental price.'),
        amenities: z
          .array(z.string())
          .optional()
          .describe('List of amenities (e.g., "Wi-Fi", "gym", "furnished").'),
        propertyType: z.string().describe('Type of property (e.g., "apartment", "hostel").'),
        numberOfBedrooms: z.number().optional().describe('Number of bedrooms.'),
        isAvailable: z.boolean().describe('Whether the property is currently available.'),
      })
    )
    .describe('A list of all currently available properties.'),
});
export type MatchPropertiesToStudentInput = z.infer<
  typeof MatchPropertiesToStudentInputSchema
>;

const RecommendedPropertySchema = z.object({
  id: z.string().describe('Unique ID of the recommended property.'),
  name: z.string().describe('Name of the recommended property.'),
  matchScore: z
    .number()
    .min(0)
    .max(100)
    .describe('A score (0-100) indicating how well this property matches the student\'s preferences.'),
  reason: z.string().describe('A brief explanation of why this property is recommended.'),
});

const MatchPropertiesToStudentOutputSchema = z.object({
  recommendations: z
    .array(RecommendedPropertySchema)
    .describe('A list of personalized property recommendations for the student.'),
});
export type MatchPropertiesToStudentOutput = z.infer<
  typeof MatchPropertiesToStudentOutputSchema
>;

export async function matchPropertiesToStudent(
  input: MatchPropertiesToStudentInput
): Promise<MatchPropertiesToStudentOutput> {
  return matchPropertiesToStudentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'matchPropertiesToStudentPrompt',
  input: {schema: MatchPropertiesToStudentInputSchema},
  output: {schema: MatchPropertiesToStudentOutputSchema},
  prompt: `You are an AI assistant specialized in matching students with suitable accommodation.

Based on the student's profile, their past search history, and the list of available properties, generate a list of personalized property recommendations.

Consider the following:
- **Student Profile**: Budget, desired location (especially near universities like University of Nairobi), roommate preferences, lifestyle, and preferred property types.
- **Search History**: Understand what kind of properties the student has looked for in the past to infer their implicit preferences.
- **Available Properties**: Only recommend properties from the provided list that are marked as available and generally align with the student's explicit and implicit preferences.

For each recommendation, provide a 'matchScore' (0-100) indicating how well it fits the student's criteria and a 'reason' explaining why it is a good match.

Student Profile:
ID: {{{studentProfile.id}}}
Name: {{{studentProfile.name}}}
{{#if studentProfile.budget}}Budget: Min {{studentProfile.budget.min}} - Max {{studentProfile.budget.max}}{{/if}}
{{#if studentProfile.desiredLocation}}Desired Location: {{{studentProfile.desiredLocation}}}{{/if}}
{{#if studentProfile.roommatePreferences}}Roommate Preferences: {{{studentProfile.roommatePreferences}}}{{/if}}
{{#if studentProfile.lifestyle}}Lifestyle: {{{studentProfile.lifestyle}}}{{/if}}
{{#if studentProfile.propertyTypePreferences}}Property Type Preferences: {{{studentProfile.propertyTypePreferences}}}{{/if}}

Search History:
{{#if searchHistory}}
{{#each searchHistory}}
  - Query: {{{query}}}, Results: {{{results}}}, Timestamp: {{{timestamp}}}
{{/each}}
{{else}}
  No search history available.
{{/if}}

Available Properties:
{{#each availableProperties}}
  - ID: {{{id}}}, Name: {{{name}}}, Location: {{{location}}}, Price: {{{price}}}, Type: {{{propertyType}}}, Bedrooms: {{{numberOfBedrooms}}}, Amenities: {{{amenities}}}, Available: {{{isAvailable}}}
{{/each}}

Provide your recommendations as a JSON array of objects, ensuring each object has 'id', 'name', 'matchScore', and 'reason' fields, as per the output schema. Prioritize the top 3-5 best matches.
`,
});

const matchPropertiesToStudentFlow = ai.defineFlow(
  {
    name: 'matchPropertiesToStudentFlow',
    inputSchema: MatchPropertiesToStudentInputSchema,
    outputSchema: MatchPropertiesToStudentOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
