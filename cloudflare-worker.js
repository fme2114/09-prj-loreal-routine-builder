// Cloudflare Worker Code
// Replace this placeholder with your actual Cloudflare Worker code

export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json",
    };

    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const apiKey = env.OPENAI_API_KEY; // Make sure to name your secret OPENAI_API_KEY in the Cloudflare Workers dashboard
    const apiUrl = "https://api.openai.com/v1/chat/completions";
    const userInput = await request.json();

    const requestBody = {
      model: "gpt-4o",
      messages: userInput.messages,
      max_completion_tokens: 1500, // Increased from 800 to allow much longer responses
      temperature: 0.7, // Added temperature for more natural responses
    };

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    // Add error handling for OpenAI API errors
    if (!response.ok) {
      console.error("OpenAI API Error:", data);
      return new Response(
        JSON.stringify({
          error: {
            message: data.error?.message || "OpenAI API request failed",
            type: data.error?.type || "api_error",
          },
        }),
        {
          status: response.status,
          headers: corsHeaders,
        }
      );
    }

    return new Response(JSON.stringify(data), { headers: corsHeaders });
  },
};
