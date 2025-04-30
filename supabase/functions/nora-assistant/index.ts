
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { corsHeaders } from "../_shared/cors.ts";

// Helper function for logging with timestamps
const log = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`, data ? JSON.stringify(data) : '');
};

// The name of the OpenAI assistant
const ASSISTANT_NAME = "Nora";

// OpenAI API URL
const OPENAI_API_URL = "https://api.openai.com/v1";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the API key and assistant ID from environment variables
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    const assistantId = Deno.env.get('OPENAI_ASSISTANT_ID');
    
    log('Checking OpenAI credentials', { 
      hasApiKey: !!openaiApiKey, 
      hasAssistantId: !!assistantId,
      assistantIdValue: assistantId || 'Not set'
    });
    
    // Verify API key exists and has a valid format
    if (!openaiApiKey) {
      log('Error: OPENAI_API_KEY environment variable not set');
      return new Response(
        JSON.stringify({ 
          error: 'OpenAI API key not configured',
          response: "I'm having trouble connecting to my AI brain. Please ask an administrator to set up my API key correctly.",
          suggestions: ["Check API configuration", "Try again later"]
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!assistantId) {
      log('Error: OPENAI_ASSISTANT_ID environment variable not set');
      return new Response(
        JSON.stringify({ 
          error: 'OpenAI Assistant ID not configured',
          response: "My AI assistant ID is missing. Please ask an administrator to set up my configuration correctly.",
          suggestions: ["Check assistant configuration", "Try again later"] 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate key format (simple check, not foolproof)
    if (!openaiApiKey.startsWith('sk-') || openaiApiKey.length < 20) {
      log('Error: OPENAI_API_KEY appears to be invalid');
      return new Response(
        JSON.stringify({ 
          error: 'OpenAI API key appears to be invalid',
          response: "There seems to be an issue with my API key format. Please ask an administrator to check the OpenAI API key.",
          suggestions: ["Verify API key format", "Check OpenAI account", "Try again later"]
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { message, userId, assistantName } = await req.json();
    const effectiveAssistantName = assistantName || ASSISTANT_NAME;
    
    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    log('Received message for assistant', { 
      userId, 
      messageLength: message.length, 
      assistantName: effectiveAssistantName,
      assistantId 
    });
    
    try {
      // Special handling for connection test messages
      if (message === "test connection") {
        log('Connection test requested');
        return new Response(
          JSON.stringify({ 
            response: "Connection test successful", 
            suggestions: ["Ask me about focus techniques", "How can I improve my productivity?"]
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Setup timeout logger
      const timeoutId = setTimeout(() => {
        log('Request might time out soon');
      }, 20000); // 20 second timeout for logging
      
      // Create a Thread
      log('Creating new thread with OpenAI');
      const threadResponse = await fetch(`${OPENAI_API_URL}/threads`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v1'
        },
        body: JSON.stringify({})
      });
      
      if (!threadResponse.ok) {
        const errorText = await threadResponse.text();
        log('OpenAI thread creation error', {
          status: threadResponse.status,
          body: errorText
        });
        if (threadResponse.status === 401) {
          return new Response(
            JSON.stringify({ 
              error: 'Invalid OpenAI API key',
              response: "I can't connect to my AI brain because my API key is invalid. Please ask an administrator to update my API key.",
              suggestions: ["Check OpenAI account", "Update API key", "Try again later"]
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        throw new Error(`Failed to create thread: ${errorText}`);
      }
      
      const threadData = await threadResponse.json();
      const threadId = threadData.id;
      log('Thread created', { threadId });
      
      // Add a Message to the Thread
      log('Adding message to thread');
      const messageResponse = await fetch(`${OPENAI_API_URL}/threads/${threadId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v1'
        },
        body: JSON.stringify({
          role: "user",
          content: message
        })
      });
      
      if (!messageResponse.ok) {
        const errorText = await messageResponse.text();
        log('OpenAI message creation error', {
          status: messageResponse.status,
          body: errorText
        });
        throw new Error(`Failed to add message: ${errorText}`);
      }
      
      log('Message added to thread');
      
      // Run the Assistant
      log('Running assistant on thread', { assistantId });
      const runResponse = await fetch(`${OPENAI_API_URL}/threads/${threadId}/runs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v1'
        },
        body: JSON.stringify({
          assistant_id: assistantId,
          instructions: `You are ${effectiveAssistantName}, a helpful assistant focused on helping users improve focus and productivity.`
        })
      });
      
      if (!runResponse.ok) {
        const errorText = await runResponse.text();
        log('OpenAI run creation error', {
          status: runResponse.status,
          body: errorText
        });
        if (runResponse.status === 404) {
          return new Response(
            JSON.stringify({ 
              error: 'Invalid Assistant ID',
              response: "My Assistant ID doesn't seem to exist. Please ask an administrator to check the OpenAI Assistant ID.",
              suggestions: ["Verify Assistant ID", "Check OpenAI account", "Try again later"]
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        throw new Error(`Failed to run assistant: ${errorText}`);
      }
      
      const runData = await runResponse.json();
      const runId = runData.id;
      log('Assistant run started', { runId });
      
      // Poll for the run completion
      let runStatus = runData.status;
      let assistantResponse = "";
      let attempts = 0;
      const maxAttempts = 30; // Maximum number of polling attempts
      
      while (runStatus !== 'completed' && runStatus !== 'failed' && attempts < maxAttempts) {
        // Wait for a short time before polling again
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
        
        const runCheckResponse = await fetch(`${OPENAI_API_URL}/threads/${threadId}/runs/${runId}`, {
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'OpenAI-Beta': 'assistants=v1'
          }
        });
        
        if (!runCheckResponse.ok) {
          const errorText = await runCheckResponse.text();
          log('OpenAI run check error', {
            status: runCheckResponse.status,
            body: errorText,
            attempt: attempts
          });
          // Continue polling despite errors
          continue;
        }
        
        const runCheckData = await runCheckResponse.json();
        runStatus = runCheckData.status;
        log('Run status check', { status: runStatus, attempt: attempts });
      }
      
      clearTimeout(timeoutId);
      
      if (runStatus !== 'completed') {
        log('Assistant run did not complete in time', { finalStatus: runStatus });
        throw new Error(`Assistant run ${runStatus === 'failed' ? 'failed' : 'timed out'}`);
      }
      
      // Get the messages from the Thread
      log('Retrieving messages from thread');
      const messagesResponse = await fetch(`${OPENAI_API_URL}/threads/${threadId}/messages`, {
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'OpenAI-Beta': 'assistants=v1'
        }
      });
      
      if (!messagesResponse.ok) {
        const errorText = await messagesResponse.text();
        log('OpenAI messages retrieval error', {
          status: messagesResponse.status,
          body: errorText
        });
        throw new Error(`Failed to retrieve messages: ${errorText}`);
      }
      
      const messagesData = await messagesResponse.json();
      
      // Get the assistant's last message
      const assistantMessages = messagesData.data.filter((msg: any) => msg.role === 'assistant');
      
      if (assistantMessages.length === 0) {
        log('No assistant messages found');
        throw new Error('No response received from assistant');
      }
      
      // Get the most recent message (should be first in the list)
      const latestMessage = assistantMessages[0];
      
      // Extract the text content from the message
      assistantResponse = latestMessage.content
        .filter((content: any) => content.type === 'text')
        .map((content: any) => content.text.value)
        .join('\n');
      
      log('Assistant response received', { responseLength: assistantResponse.length });
      
      // Generate some simple suggestions based on the message context
      // This is a simple implementation - you may want to enhance this
      const suggestions = generateSuggestions(message, assistantResponse);
      
      return new Response(
        JSON.stringify({ 
          response: assistantResponse,
          suggestions: suggestions || [],
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (apiError) {
      // Handle network or timeout errors specifically
      log('OpenAI API connection error', { 
        message: apiError.message, 
        name: apiError.name,
        stack: apiError.stack
      });
      
      const isAbortError = apiError.name === 'AbortError';
      
      // Return a graceful fallback response
      return new Response(
        JSON.stringify({ 
          response: isAbortError 
            ? "My response timed out. This could be due to high traffic or connectivity issues. Please try again shortly."
            : "I'm having trouble connecting right now. My service might be temporarily unavailable. Please try again in a few minutes.",
          suggestions: [
            "Try again shortly", 
            "Ask a simpler question", 
            "Check your internet connection"
          ],
          error: apiError.message
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    log('Error in nora-assistant function', { message: error.message, stack: error.stack });
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        response: "I encountered an unexpected issue. Please try refreshing the page and asking again."
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Function to generate context-aware suggestions
function generateSuggestions(userMessage: string, assistantResponse: string): string[] {
  const lowercaseMessage = userMessage.toLowerCase();
  const suggestions: string[] = [];
  
  // Add suggestion based on question context
  if (lowercaseMessage.includes('focus') || lowercaseMessage.includes('concentrate')) {
    suggestions.push("What are the best techniques for deep focus?");
  }
  
  if (lowercaseMessage.includes('study') || lowercaseMessage.includes('learn')) {
    suggestions.push("How can I improve my study habits?");
  }
  
  if (lowercaseMessage.includes('distract') || lowercaseMessage.includes('procrastinate')) {
    suggestions.push("How do I avoid distractions while working?");
  }
  
  // Add general follow-up suggestions
  suggestions.push("Can you explain that in more detail?");
  
  // Keep suggestions list to max 3 items
  return suggestions.slice(0, 3);
}
