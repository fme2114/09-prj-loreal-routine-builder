# Cloudflare Worker Setup Guide

This guide explains how to set up a Cloudflare Worker to securely proxy OpenAI API requests, keeping your API key hidden from the client-side code.

## Step 1: Deploy Cloudflare Worker

1. **Log in to Cloudflare Dashboard**

   - Go to [dash.cloudflare.com](https://dash.cloudflare.com)
   - Navigate to "Workers & Pages"

2. **Create a New Worker**

   - Click "Create application"
   - Choose "Create Worker"
   - Give it a name (e.g., `loreal-openai-proxy`)

3. **Replace Worker Code**
   - Copy the code from `cloudflare-worker.js` in this project
   - Paste it into the Cloudflare Worker editor
   - Click "Save and deploy"

## Step 2: Configure Environment Variables

1. **Add Your OpenAI API Key**
   - In your Worker dashboard, go to "Settings" → "Variables"
   - Under "Environment Variables", click "Add variable"
   - Name: `OPENAI_API_KEY`
   - Value: Your actual OpenAI API key
   - Click "Encrypt" to make it a secret
   - Click "Save and deploy"

## Step 3: Configure Your Application

1. **Update config.js**

   ```javascript
   // Replace with your actual Cloudflare Worker URL
   const CLOUDFLARE_WORKER_URL =
     "https://your-worker-name.your-subdomain.workers.dev";

   // Set to true to use Cloudflare Worker
   const USE_CLOUDFLARE_WORKER = true;
   ```

2. **Get Your Worker URL**
   - In your Worker dashboard, you'll see the URL at the top
   - It looks like: `https://loreal-openai-proxy.your-subdomain.workers.dev`
   - Copy this URL and paste it in `config.js`

## Step 4: Test Your Setup

1. **Test the Application**
   - Open your application in a browser
   - Select some products
   - Try generating a routine
   - Check the browser's Network tab to verify requests go to your Worker URL

## Security Benefits

✅ **API Key Hidden**: Your OpenAI API key is stored securely in Cloudflare and never exposed to users

✅ **CORS Handled**: The Worker properly handles cross-origin requests

✅ **Rate Limiting**: You can add rate limiting in the Worker if needed

✅ **Request Filtering**: The Worker only accepts requests to the specific OpenAI endpoint

## Troubleshooting

### Common Issues:

1. **"Not Found" Error**

   - Check that your Worker URL is correct in `config.js`
   - Ensure the Worker is deployed and accessible

2. **API Errors**

   - Verify your OpenAI API key is correctly set in Worker environment variables
   - Check that the key has sufficient credits

3. **CORS Errors**
   - The provided Worker code includes CORS headers
   - If you modify the code, ensure CORS headers are maintained

### Development vs Production

- **Development**: You can set `USE_CLOUDFLARE_WORKER = false` in `config.js` to use direct API calls with the key in the file
- **Production**: Always set `USE_CLOUDFLARE_WORKER = true` and use the Worker for security

## Optional: Custom Domain

If you have a custom domain on Cloudflare, you can:

1. Go to "Triggers" → "Custom Domains"
2. Add a route like `api.yourdomain.com/openai`
3. Update `CLOUDFLARE_WORKER_URL` to use your custom domain

This makes your API endpoint look more professional and branded.
