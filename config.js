/* Configuration for API endpoints */

// Replace with your actual Cloudflare Worker URL
// Example: 'https://your-worker-name.your-subdomain.workers.dev'
const CLOUDFLARE_WORKER_URL = "https://wanderbot-worker.fme2114.workers.dev";

// Set to true to use Cloudflare Worker, false to use direct OpenAI API
const USE_CLOUDFLARE_WORKER = true;

// For development/testing - will be ignored if USE_CLOUDFLARE_WORKER is true
// NEVER commit real API keys to version control!
const OPENAI_API_KEY = "your-openai-api-key-here";

/* You can get one from: https://platform.openai.com/api-keys */
