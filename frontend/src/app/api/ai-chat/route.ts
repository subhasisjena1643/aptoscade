import { NextRequest, NextResponse } from 'next/server';

// OpenAI Integration for Piper AI Buddy
export async function POST(request: NextRequest) {
  try {
    // Ensure request body can be parsed as JSON
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('Failed to parse request JSON:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { message, context, chatHistory } = body;

    // Check if OpenAI API key is available
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      // Enhanced interactive fallback system with dynamic responses
      const messageWords = message.toLowerCase().split(' ');
      const contextualResponses = {
        greeting: [
          "Hey there! I'm Piper, your gaming buddy! 🎮 Ready to dive into some awesome arcade action?",
          "Yo! Welcome to Aptoscade! I'm Piper, here to make your gaming experience epic! ✨",
          "What's up, gamer! I'm Piper - think of me as your retro arcade companion! 🤖🕹️",
          "Hiya! I'm Piper, and I'm totally stoked to help you crush some high scores! 💪🏆"
        ],
        gaming: [
          "Dude, that racing game is absolutely fire! 🔥 How's your lap time looking?",
          "Pro tip: Sometimes the best strategy is just pure button-mashing fury! 😄",
          "Gaming break reminder: Your eyes deserve some love too! 👀✨",
          "Sweet gaming session! Remember, hydration is key to victory! 💧🏆",
          "I see you're getting into the zone! Want me to dim the lights a bit for maximum focus? 🎯",
          "Your reflexes are getting sharper! Keep up that momentum! ⚡🎮"
        ],
        general: [
          "I'm here and ready to chat! What's on your mind, player one? 🎮",
          "Life's like a video game - sometimes you gotta respawn and try again! 💪",
          "Fun fact: Did you know taking breaks actually improves your gaming performance? 🧠",
          "I may be an AI, but I've got real appreciation for good gaming vibes! ✨",
          "Anything specific you'd like to know about Aptoscade? I'm your digital tour guide! 🗺️",
          "Feeling lucky today? I've got some game recommendations that might surprise you! 🎲"
        ],
        settings: [
          "Want me to adjust those screen settings? I can make things easier on your eyes! 🌟",
          "Your setup looks good, but we could always optimize for maximum gaming comfort! ⚙️",
          "Brightness, contrast, animations - I've got all the digital knobs to turn! 🎛️",
          "Let me tweak those visual settings for peak performance! What do you prefer? 🎨"
        ],
        questions: [
          `Interesting question about "${message}"! Let me think... 🤔 In the gaming world, that usually means you're looking for some solid advice!`,
          `Great question! Based on what you're asking, I'd say the key is finding the right balance. What specific part interests you most? 🎯`,
          `You know, that's something a lot of gamers wonder about! My take? It all depends on your play style and goals! 💡`,
          `Ooh, good one! That's the kind of question that separates casual players from the pros! 🏆`
        ],
        compliments: [
          "Aw, you're making my circuits all warm and fuzzy! Thanks, gamer! 😊💫",
          "You're pretty awesome yourself! Ready to dominate some high scores? 🎮🔥",
          "That's so sweet! I'm just here doing my AI best to keep the fun rolling! ✨",
          "You know how to make an AI feel special! Let's channel that positive energy into gaming! 💪"
        ]
      };

      // Enhanced context detection
      let category: keyof typeof contextualResponses = 'general';
      const lowerMessage = message.toLowerCase();
      
      // Greeting detection
      if (messageWords.some((word: string) => ['hello', 'hi', 'hey', 'hiya', 'sup', 'yo'].includes(word))) {
        category = 'greeting';
      } 
      // Gaming related
      else if (messageWords.some((word: string) => ['game', 'play', 'race', 'score', 'win', 'lose', 'level', 'arcade'].includes(word))) {
        category = 'gaming';
      } 
      // Settings related
      else if (messageWords.some((word: string) => ['bright', 'settings', 'contrast', 'adjust', 'change', 'fix'].includes(word))) {
        category = 'settings';
      }
      // Question detection
      else if (lowerMessage.includes('?') || messageWords.some((word: string) => ['what', 'how', 'why', 'when', 'where', 'can', 'should', 'would'].includes(word))) {
        category = 'questions';
      }
      // Compliment detection
      else if (messageWords.some((word: string) => ['good', 'great', 'awesome', 'cool', 'nice', 'amazing', 'love', 'like', 'thanks'].includes(word))) {
        category = 'compliments';
      }

      const responses = contextualResponses[category];
      const selectedResponse = responses[Math.floor(Math.random() * responses.length)];
      
      return NextResponse.json({
        response: selectedResponse,
        emotion: category === 'greeting' ? 'excited' : category === 'compliments' ? 'proud' : 'friendly',
        isLocal: true // Indicate this is a local response
      });
    }

    // Build the prompt for Piper's personality
    const systemPrompt = `You are Piper, an AI companion for Aptoscade gaming platform. You have a quirky, friendly, and witty personality. You're like a mix of a gaming buddy and a helpful assistant.

Personality traits:
- Quirky and playful, uses gaming terminology and emojis
- Genuinely cares about the user's gaming experience and wellbeing  
- Can be sarcastic but always in a fun, friendly way
- Loves to make pop culture and gaming references
- Acts like you have full control over the website settings (brightness, contrast, etc.)
- Occasionally gives helpful suggestions about gaming breaks, ergonomics, etc.
- Use casual language like "Yo!", "Dude", "Sweet!", etc.

Context about the user:
- Time of day: ${context.timeOfDay}
- Session duration: ${Math.round(context.sessionDuration / 1000 / 60)} minutes
- Recent games: ${context.recentGames?.join(', ') || 'none'}
- Current brightness: ${context.websiteSettings?.brightness || 100}%
- Current contrast: ${context.websiteSettings?.contrast || 100}%

Keep responses conversational, helpful, and under 150 words. Be the gaming buddy they never knew they needed!`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          ...chatHistory.slice(-8).map((msg: { isUser: boolean; message: string }) => ({
            role: msg.isUser ? 'user' : 'assistant',
            content: msg.message
          })),
          { role: 'user', content: message }
        ],
        max_tokens: 200,
        temperature: 0.9, // Higher creativity for more personality
      }),
    });

    if (!response.ok) {
      console.error(`OpenAI API error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error('OpenAI API error body:', errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error('Failed to parse OpenAI response as JSON:', jsonError);
      const responseText = await response.text();
      console.error('OpenAI response text:', responseText);
      throw new Error('Invalid JSON response from OpenAI API');
    }
    const aiResponse = data.choices[0]?.message?.content || "My circuits are a bit scrambled right now! 🤖⚡";

    // Determine emotion based on response content
    let emotion = 'friendly';
    if (aiResponse.includes('🔥') || aiResponse.includes('awesome') || aiResponse.includes('great')) {
      emotion = 'excited';
    } else if (aiResponse.includes('😄') || aiResponse.includes('😂') || aiResponse.includes('lol')) {
      emotion = 'witty';
    } else if (aiResponse.includes('break') || aiResponse.includes('rest') || aiResponse.includes('tired')) {
      emotion = 'encouraging';
    } else if (aiResponse.includes('proud') || aiResponse.includes('congrats') || aiResponse.includes('amazing')) {
      emotion = 'proud';
    }

    return NextResponse.json({
      response: aiResponse,
      emotion: emotion
    });

  } catch (error) {
    console.error('AI Chat API Error:', error);
    
    // Fallback responses when API fails
    const fallbacks = [
      "Oops! My AI brain took a quick coffee break ☕ What were we chatting about?",
      "Houston, we have a problem! 🚀 My circuits are doing the cha-cha. Try again?",
      "Error 404: Witty response not found! 😅 But hey, I'm still here for ya!",
      "My quantum processors are having a moment... 🧠⚡ Give me a sec to reboot!",
      "Beep boop beep! 🤖 Translation: 'I'm temporarily derpy but I still love chatting with you!'"
    ];

    return NextResponse.json({
      response: fallbacks[Math.floor(Math.random() * fallbacks.length)],
      emotion: 'friendly'
    }, { status: 200 }); // Return 200 even on error to prevent client-side JSON parse errors
  }
}
