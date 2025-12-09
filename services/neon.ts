import { neon, neonConfig } from '@neondatabase/serverless';

// Use environment variable if available, otherwise fallback to the provided connection string
// This ensures the app works immediately in the preview environment without .env configuration
const dbUrl = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_bA9q5GRVcLkY@ep-falling-dew-a1y0i58f-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

if (!dbUrl) {
  console.warn("DATABASE_URL is missing. Database features may not work correctly.");
}

// Configure Neon to suppress the browser security warning
// This is acceptable for prototyping but recommended to move to a backend for production
neonConfig.disableWarningInBrowsers = true;

// Initialize the Neon HTTP client
export const sql = neon(dbUrl);