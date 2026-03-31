import { config } from 'dotenv';
config();

import '@/ai/flows/flag-potential-fraud.ts';
import '@/ai/flows/recommend-price-to-landlord.ts';
import '@/ai/flows/match-properties-to-student.ts';
import '@/ai/flows/rental-assistant-flow.ts';
import '@/ai/flows/generate-property-vibe.ts';
