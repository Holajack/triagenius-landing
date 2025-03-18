
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { quizType, userId } = await req.json();
    
    if (!quizType || !userId) {
      return new Response(
        JSON.stringify({ error: 'Quiz type and user ID are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    // Prepare system prompt based on quiz type
    const systemPrompt = `
      You are designing a learning assessment quiz for the ${quizType} learning style.
      Create 5 questions that will help determine if a person learns best through ${quizType} methods.
      
      For Physical/Kinesthetic learning: Focus on hands-on activities, movement-based concepts.
      For Auditory learning: Focus on listening comprehension, verbal processing.
      For Visual learning: Focus on spatial relationships, imagery, and visual patterns.
      For Logical learning: Focus on problem-solving, patterns, and analytical thinking.
      For Vocal learning: Focus on verbal expression, speaking aloud, and linguistic processing.
      
      Format your response as a JSON array with objects containing:
      {
        "question": "The question text",
        "options": ["option1", "option2", "option3", "option4"],
        "correctAnswer": "The correct option",
        "explanation": "Why this is the correct answer",
        "learningStyleIndicator": "What this question reveals about learning style"
      }
    `;

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate ${quizType} learning style assessment questions.` }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API returned an error: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const quizQuestions = JSON.parse(data.choices[0].message.content);
    
    return new Response(
      JSON.stringify({ questions: quizQuestions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-learning-quiz function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
