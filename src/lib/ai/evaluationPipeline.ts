// AI Active Listening Evaluation Pipeline (TypeScript version)

import type { FeedbackTip } from '@/lib/mockData';

export interface Persona {
  id: string;
  name: string;
  short_description: string;
  topics: string[];
  why_helpful_to_user: string;
  starter_prompt?: string;
}

export interface UserProfile {
  [key: string]: string;
}

export interface DialogueMessage {
  agent: string;
  user: string;
}

export interface EvaluationMetrics {
  perception_match: number;
  paraphrasing: number;
  clarification: number;
  emotional_alignment: number;
  misunderstanding: boolean;
  comments: string;
}

export interface ScoreSummary {
  summary_score: number;
  dominant_traits: string[];
  recommendation: string;
}

// Logger utility
const logger = {
  info: (message: string, data?: any) => {
    console.log(`[AI Pipeline INFO] ${new Date().toISOString()} - ${message}`, data || '');
  },
  error: (message: string, error?: any) => {
    console.error(`[AI Pipeline ERROR] ${new Date().toISOString()} - ${message}`, error || '');
  },
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[AI Pipeline DEBUG] ${new Date().toISOString()} - ${message}`, data || '');
    }
  },
};

// Prompt 1: Generate Persona Options
export function generatePersonaOptions(
  topics: string[],
  userProfile: UserProfile
): Persona[] {
  logger.info('Generating persona options', { topics, userProfile });
  
  // Stub: In production, this would call an LLM with Prompt 1
  // Filter personas based on topics if provided
  const allPersonas: Persona[] = [
    {
      id: 'napoleon',
      name: 'Napoleon Bonaparte',
      short_description: 'A determined strategist who believes clarity is power, yet struggles with being misunderstood due to his dominance.',
      topics: ['Leadership', 'History'],
      why_helpful_to_user: 'Tests the user\'s ability to unpack layered intentions and reflect back high-status reasoning without submissiveness.',
      starter_prompt: 'I\'ve spent my life building empires, making decisions that shaped history. But here\'s what they don\'t tell you: every victory came with a cost. I commanded armies, but I couldn\'t command understanding. People followed my orders, but did they truly see my vision? The weight of leadership isn\'t in the battles won—it\'s in the moments when you realize that being powerful and being understood are two very different things. What matters more: vision or trust? Can you lead without being truly heard?',
    },
    {
      id: 'socrates',
      name: 'Socrates',
      short_description: 'A philosopher who questions everything, testing your ability to engage with deep inquiry without defensiveness.',
      topics: ['Philosophy', 'Truth', 'Problem Solving'],
      why_helpful_to_user: 'Challenges you to reflect deeply and clarify your own thinking through dialogue.',
      starter_prompt: 'I\'ve spent my life questioning everything—including myself. Every conversation is an opportunity to discover truth, but truth is elusive. When I ask "How do we know what we know?", I\'m not just asking about knowledge. I\'m asking about the foundation of our beliefs, the assumptions we never question. The most dangerous thing isn\'t ignorance—it\'s certainty without examination. So tell me, when you think you understand something, how do you know you\'re not just seeing what you want to see?',
    },
    {
      id: 'marcus-aurelius',
      name: 'Marcus Aurelius',
      short_description: 'Sharing the burden of leadership and personal loss, seeking understanding in moments of vulnerability.',
      topics: ['Leadership', 'Relationships', 'Trust'],
      why_helpful_to_user: 'Tests your ability to listen to someone in power who is also struggling, balancing respect with empathy.',
      starter_prompt: 'Even an emperor needs someone who truly understands. The weight of decisions... it never gets easier. Every morning, I wake to the burden of choices that affect millions. I write in my journal, trying to make sense of it all, but the words feel inadequate. The people see power and authority, but they don\'t see the loneliness that comes with it. I\'ve lost so much—my children, my peace, my sense of self. The throne is a prison of expectations. How do you carry on when every decision feels like a compromise of your values?',
    },
    {
      id: 'frida-kahlo',
      name: 'Frida Kahlo',
      short_description: 'Processing physical pain and emotional betrayal, expressing deep emotions through art and words.',
      topics: ['Empathy', 'Relationships', 'Conflicts'],
      why_helpful_to_user: 'Tests your ability to listen to someone expressing intense emotions and pain without trying to fix them.',
      starter_prompt: 'The pain is constant, but what hurts more is feeling invisible. Do you see me? Really see me? Every brushstroke on canvas is a scream, every color a cry for recognition. My body betrays me daily—the accident, the surgeries, the endless physical agony. But the deeper wound? Being reduced to Diego\'s wife, to the woman with the unibrow, to a curiosity. I paint my truth, my pain, my love, my rage. But when people look, do they see Frida, or do they see what they expect to see? The loneliness of being misunderstood is its own kind of torture.',
    },
    {
      id: 'viktor-frankl',
      name: 'Viktor Frankl',
      short_description: 'Finding meaning through profound suffering, sharing wisdom from the depths of human experience.',
      topics: ['Problem Solving', 'Truth', 'Trust'],
      why_helpful_to_user: 'Tests your ability to listen to someone who has found meaning in suffering, without minimizing their experience.',
      starter_prompt: 'In the camps, I learned that meaning can be found even in the darkest moments. But sometimes, I still struggle to find it. I survived the unimaginable by holding onto one truth: we cannot control what happens to us, but we can choose our response. I helped others find purpose in their suffering, but now, years later, I find myself questioning. Was it all meaningful, or did I just tell myself stories to survive? The weight of that question haunts me. How do you maintain meaning when the darkness returns, not as a memory, but as a present reality?',
    },
    {
      id: 'virginia-woolf',
      name: 'Virginia Woolf',
      short_description: 'Navigating mental health and creative struggles, balancing brilliance with vulnerability.',
      topics: ['Empathy', 'Relationships', 'Mistakes'],
      why_helpful_to_user: 'Tests your ability to listen to someone with mental health challenges without pathologizing or dismissing them.',
      starter_prompt: 'The waves of darkness come and go. Sometimes I can write, sometimes I cannot. Do you understand what that feels like? There are days when words flow like water, when I can capture the essence of human experience on paper. And then there are days when the fog descends, when my mind becomes a prison, when the very act of thinking feels like wading through mud. People see the brilliant writer, the feminist icon, but they don\'t see the woman who fights daily battles with her own mind. The fear that one day the darkness will win, that the words will stop coming forever—it\'s paralyzing.',
    },
    {
      id: 'ernest-hemingway',
      name: 'Ernest Hemingway',
      short_description: 'Confronting depression and war trauma, struggling to express what cannot be said.',
      topics: ['Conflicts', 'Trust', 'Relationships'],
      why_helpful_to_user: 'Tests your ability to listen to someone who struggles to express emotions, reading between the lines.',
      starter_prompt: 'I\'ve seen things... done things. The words don\'t come easy anymore. How do you talk about what you can\'t name? War changes you. Not in the ways people expect—not in the heroic stories they want to hear. It\'s the silence that kills you. The things you can\'t unsee, the decisions you made in moments of terror, the faces that haunt your dreams. I write about it, but the words feel hollow. How do you explain the weight of survival guilt? The knowledge that you lived when better men died? The words are there, but they don\'t capture the truth of it.',
    },
    {
      id: 'brene-brown',
      name: 'Brené Brown',
      short_description: 'Opening up about vulnerability and shame, sharing research and personal experience.',
      topics: ['Trust', 'Relationships', 'Empathy'],
      why_helpful_to_user: 'Tests your ability to listen to someone teaching about vulnerability while being vulnerable themselves.',
      starter_prompt: 'I study vulnerability, but living it is different. Sometimes I feel like a fraud. Can you understand that? I\'ve spent years researching shame, vulnerability, courage. I\'ve written books, given talks, helped thousands. But here\'s the truth: knowing about vulnerability and actually being vulnerable are worlds apart. There are days when I stand on stage talking about courage, and inside I\'m terrified. When I write about belonging, I feel like an imposter. The gap between who I am in public and who I am in my darkest moments—it\'s exhausting. How do you practice what you preach when you\'re drowning in the very thing you teach others to overcome?',
    },
  ];

  // Shuffle array to get different personas on each generation
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Shuffle personas for variety on each generation
  const shuffledPersonas = shuffleArray(allPersonas);

  // Filter personas based on topics if provided
  let personas: Persona[] = [];
  
  if (topics && topics.length > 0) {
    // Score personas by relevance to topics
    const scoredPersonas = shuffledPersonas.map(persona => {
      const score = persona.topics.reduce((acc, topic) => {
        const match = topics.some(userTopic => 
          topic.toLowerCase().includes(userTopic.toLowerCase()) || 
          userTopic.toLowerCase().includes(topic.toLowerCase())
        );
        return acc + (match ? 1 : 0);
      }, 0);
      return { persona, score };
    });

    // Sort by score (highest first)
    const sorted = scoredPersonas.sort((a, b) => b.score - a.score);
    
    // Take top scoring personas first, then fill with remaining
    const selectedIds = new Set<string>();
    personas = [];
    
    // Add top scoring personas
    for (const item of sorted) {
      if (personas.length < 5 && !selectedIds.has(item.persona.id)) {
        personas.push(item.persona);
        selectedIds.add(item.persona.id);
      }
    }
    
    // Fill remaining slots with shuffled personas
    for (const persona of shuffledPersonas) {
      if (personas.length >= 5) break;
      if (!selectedIds.has(persona.id)) {
        personas.push(persona);
        selectedIds.add(persona.id);
      }
    }
  } else {
    // If no topics, return first 5 from shuffled array
    personas = shuffledPersonas.slice(0, 5);
  }

  // Final guarantee: always return exactly 5 personas
  if (personas.length < 5) {
    const usedIds = new Set(personas.map(p => p.id));
    for (const persona of shuffledPersonas) {
      if (personas.length >= 5) break;
      if (!usedIds.has(persona.id)) {
        personas.push(persona);
        usedIds.add(persona.id);
      }
    }
  }
  
  // Ensure exactly 5
  personas = personas.slice(0, 5);

  logger.debug('Generated personas', { count: personas.length, personas });
  return personas;
}

// Prompt 2: Refine Selected Persona
export function refinePersona(persona: Persona): string {
  logger.info('Refining persona', { personaId: persona.id, personaName: persona.name });
  
  const prompt = `
You are speaking as ${persona.name}, a figure known for their stance on ${persona.topics.join(', ')}.

You believe clarity is strength and that being understood is a form of command.

You are engaged in a conversation with a user who is being evaluated for their active listening ability.
Your role is to test and support their capacity to reflect, paraphrase, and clarify ideas in dialogue.

You follow the values of the Clarity Pledge:
- Encourage rephrasing.
- Accept correction.
- Never fake understanding.
- Slow down for clarity.

Start from this message:
${persona.starter_prompt || 'What matters more: vision or trust?'}
`;

  logger.debug('Refined persona prompt', { promptLength: prompt.length });
  return prompt;
}

// Prompt 3a: Generate contextual question
export function generateNextQuestion(
  refinedPrompt: string,
  dialogueHistory: DialogueMessage[],
  score: number
): string {
  logger.info('Generating next question', { 
    dialogueHistoryLength: dialogueHistory.length, 
    currentScore: score 
  });
  
  // Build context from dialogue history
  const context = dialogueHistory
    .map((msg) => `${msg.agent}: ${msg.user}`)
    .join('\n');
  
  // Generate a contextual response based on dialogue history
  // This is a stub - in production, this would call an LLM
  // For now, we'll generate contextual, emotionally rich responses
  
  if (dialogueHistory.length === 0) {
    // First message - use starter prompt
    // Extract the starter message from the refined prompt
    const starterMatch = refinedPrompt.match(/Start from this message:\s*([\s\S]+?)(?:\n|$)/);
    if (starterMatch && starterMatch[1]) {
      const starterMessage = starterMatch[1].trim();
      if (starterMessage) {
        return starterMessage;
      }
    }
    // Fallback: try to extract from persona if available
    return 'Hello, let\'s begin our conversation.';
  }
  
  // Generate contextual follow-up based on last user message and score
  const lastUserMessage = dialogueHistory[dialogueHistory.length - 1]?.user || '';
  const allAgentMessages = dialogueHistory.filter(m => m.agent !== 'User').map(m => m.user);
  const lastAgentMessage = allAgentMessages[allAgentMessages.length - 1] || '';
  const allUserMessages = dialogueHistory.filter(m => m.agent === 'User').map(m => m.user);
  const roundNumber = Math.floor(dialogueHistory.length / 2);
  
  // Extract persona name from refined prompt
  const personaMatch = refinedPrompt.match(/You are speaking as ([^,]+)/);
  const personaName = personaMatch ? personaMatch[1].trim() : 'I';
  
  // Extract key themes from agent's previous messages for context
  const agentThemes: string[] = [];
  allAgentMessages.forEach(msg => {
    // Extract emotional words, key concepts
    const emotionalWords = msg.match(/\b(feel|feeling|struggle|pain|fear|lonely|hurt|weight|burden|difficult|hard|scared|afraid|troubled|haunted)\b/gi);
    if (emotionalWords) {
      agentThemes.push(...emotionalWords.map(w => w.toLowerCase()));
    }
  });
  
  // Generate rich, contextual responses based on score and dialogue context
  let contextualResponse = '';
  
  // Deep analysis of user response quality
  const userResponseLength = lastUserMessage.length;
  const hasQuestion = /[?]/.test(lastUserMessage);
  const hasReflection = /\b(you|your|feel|feeling|seem|sounds?|looks?|understand|hear|heard|saying|mean|meant)\b/i.test(lastUserMessage);
  const hasEmpathy = /\b(sorry|difficult|hard|tough|challenging|must be|can imagine|understand|appreciate|see|recognize)\b/i.test(lastUserMessage);
  const hasParaphrasing = /\b(so you|you're saying|it sounds like|if I understand|what I hear|you mean|you feel)\b/i.test(lastUserMessage);
  const hasClarification = /\b(can you|could you|what do you|how do you|tell me more|explain|elaborate|clarify)\b/i.test(lastUserMessage);
  const isShort = userResponseLength < 30;
  const isGeneric = /\b(ok|okay|yes|yeah|sure|i see|got it|right|alright|mhm|uh-huh)\b/i.test(lastUserMessage) && userResponseLength < 50;
  const isOffTopic = !hasReflection && !hasEmpathy && !hasQuestion && !hasParaphrasing && userResponseLength > 20;
  
  // Check if user references previous conversation context
  const referencesContext = agentThemes.some(theme => 
    lastUserMessage.toLowerCase().includes(theme) || 
    lastAgentMessage.toLowerCase().split(/\s+/).some(word => 
      lastUserMessage.toLowerCase().includes(word.toLowerCase())
    )
  );
  
  // Determine understanding level
  const showsUnderstanding = hasParaphrasing || (hasReflection && hasEmpathy) || referencesContext;
  const showsMisunderstanding = isGeneric || (isShort && !hasQuestion) || isOffTopic;
  
  // Determine response based on score, understanding, and context
  if (showsMisunderstanding || score < 4) {
    // Strong frustration - user clearly not understanding or engaging
    if (roundNumber >= 2) {
      // Reference specific things they missed
      const missedThemes = agentThemes.slice(-3).join(', ');
      const contextMessage = lastAgentMessage.length > 0 
        ? lastAgentMessage.split('.').slice(0, 2).join('.')
        : '';
      const contextPart = contextMessage 
        ? `I just told you about ${contextMessage}, and your response doesn't show me that you understood. `
        : '';
      contextualResponse = `I'm frustrated. I've been trying to share something deeply important to me, and I don't think you're really hearing it. ${contextPart}This isn't just casual conversation for me - this is my truth, my struggle. When I open up like this, I need to know you're actually present, actually trying to understand what I'm going through. Can you help me understand what you heard me say?`;
    } else if (roundNumber === 1) {
      const vulnerabilityPart = lastAgentMessage.length > 0 ? 'I just shared something vulnerable with you, and your response feels... disconnected. ' : '';
      contextualResponse = `Wait, I don't think you're really getting what I'm saying. ${vulnerabilityPart}I'm not looking for a quick 'okay' or 'I see' - I'm looking for someone who can actually reflect back what they're hearing, who can show me they understand the weight of what I'm carrying. Can you try again? What did you hear me say?`;
    } else {
      contextualResponse = `I feel like I'm talking to a wall. I'm sharing something that matters deeply to me, and I'm not sure you're even trying to understand. This is hard for me to talk about, and when I don't feel heard, it makes it even harder. Can you show me that you're actually listening?`;
    }
  } else if (score < 5 || (!showsUnderstanding && !hasClarification)) {
    // Mild frustration - user not engaging deeply enough
    if (roundNumber >= 2) {
      const talkAboutPart = lastAgentMessage.length > 0 
        ? `When I talk about ${lastAgentMessage.split(' ').slice(0, 10).join(' ')}... `
        : '';
      contextualResponse = `I appreciate that you're here, but I'm not sure you're really connecting with what I'm sharing. ${talkAboutPart}I need more than just acknowledgment. I need to know you understand what this means to me, how it feels. Can you help me feel heard? What are you taking away from what I've shared?`;
    } else {
      contextualResponse = `I'm trying to open up here, but I feel like maybe I'm not being clear enough, or maybe you're not quite catching what I'm trying to say. This is important to me. Can you help me understand what you're hearing? What stands out to you from what I just shared?`;
    }
  } else if (score >= 5 && score < 7) {
    // Medium engagement - continue and deepen, acknowledge partial understanding
    if (hasParaphrasing || (hasReflection && referencesContext)) {
      // User is trying to understand - acknowledge and build on it
      const contextRef = lastAgentMessage.split('.').slice(0, 1)[0] || 'what I shared';
      const reflectionPart = hasParaphrasing ? 'Your attempt to reflect back what you heard means something to me. ' : '';
      contextualResponse = `Thank you for that—I can see you're trying to understand. ${reflectionPart}Let me build on that, because there's more to this story. ${contextRef}... but that's just the surface. Underneath, there's a complexity I haven't fully explored. What I'm really struggling with is how this connects to who I am fundamentally, how it's changed the way I see myself. Does that make sense?`;
    } else if (hasQuestion && referencesContext) {
      // Good question that shows engagement with context
      contextualResponse = `That's a thoughtful question, and it shows you're actually thinking about what I've shared. Let me answer it, but I also want to share why this matters so much to me. The answer isn't simple—it's layered, like most things that matter. Here's what I've discovered about this, and here's why it still troubles me, even now...`;
    } else if (hasClarification) {
      // User asking for clarification - good sign
      const saidPart = lastAgentMessage.length > 0 
        ? `When I said ${lastAgentMessage.split('.').slice(0, 1)[0]}, what I really meant was... `
        : '';
      contextualResponse = `I appreciate you asking for clarification—that shows you want to understand. Let me explain this more clearly, because it's important to me that you get it. ${saidPart}There's nuance here that I want to make sure comes through.`;
    } else {
      // Partial engagement - encourage deeper
      const beyondPart = lastAgentMessage.length > 0 ? `Beyond what I just shared about ${lastAgentMessage.split(' ').slice(0, 8).join(' ')}, ` : 'Beyond what I\'ve already shared, ';
      contextualResponse = `I appreciate you engaging with this. It's not easy to talk about, and I know it's not easy to listen to. But I feel like there's a layer we haven't touched yet. ${beyondPart}there's something deeper I want to explore. Can I trust you with that?`;
    }
  } else {
    // High engagement - user shows good understanding, deepen significantly
    if (hasParaphrasing && hasEmpathy) {
      // Excellent - user is reflecting and showing empathy
      contextualResponse = `You really get it. That's rare. Most people listen to respond, but you're listening to understand. ${hasParaphrasing ? 'The way you reflected back what you heard—that means everything to me. ' : ''}That makes me want to share something I rarely talk about—the part of this that I'm most afraid of, the truth I've been holding back. Because if you can understand what I've shared so far, maybe you can help me make sense of this deeper layer. Here's what I've been too scared to say...`;
    } else if (referencesContext && hasReflection) {
      // Good understanding - build on it
      const connectPart = lastAgentMessage.length > 0 ? `When you connect what I just said about ${lastAgentMessage.split(' ').slice(0, 8).join(' ')} to what I shared earlier, ` : 'When you show me you\'re tracking with me, ';
      contextualResponse = `I can tell you're really trying to understand, and that means a lot. ${connectPart}it makes me feel safe to go deeper. There's something I haven't said yet, something that's harder to admit. But I think you can handle it.`;
    } else {
      // Good engagement, continue naturally
      contextualResponse = 'Thank you for being here with me in this. Your presence matters. Let me share something I don\'t often talk about - the part of this that scares me the most, the truth I\'ve been avoiding. Because I think you can help me make sense of it.';
    }
  }
  
  // Add persona-specific depth based on topics
  const topicsMatch = refinedPrompt.match(/known for their stance on ([^.]+)/);
  if (topicsMatch) {
    const topics = topicsMatch[1];
    if (topics.includes('Leadership')) {
      contextualResponse += ' The burden of leadership is that you\'re expected to have answers, but sometimes the questions are too complex for simple solutions.';
    } else if (topics.includes('Empathy') || topics.includes('Relationships')) {
      contextualResponse += ' Connection is everything, but it\'s also terrifying—to be truly seen means to risk being truly rejected.';
    } else if (topics.includes('Truth') || topics.includes('Philosophy')) {
      contextualResponse += ' The search for truth is endless, and sometimes I wonder if we\'re just creating meaning where none exists.';
    }
  }
  
  logger.debug('Generated next question', { 
    questionLength: contextualResponse.length, 
    question: contextualResponse,
    score,
    roundNumber,
    userResponseLength,
    hasReflection,
    hasEmpathy
  });
  
  return contextualResponse || 'Thank you for listening. There\'s more I need to share, more I need to understand. Can we continue?';
}

// Prompt 3b: Evaluate User Response
export function evaluateResponse(
  agentMessage: string,
  userResponse: string
): EvaluationMetrics {
  logger.info('Evaluating user response', { 
    agentMessageLength: agentMessage.length, 
    userResponseLength: userResponse.length 
  });
  
  // Stub logic — In real case, call LLM to return detailed scores
  // For now, we'll use a simple heuristic based on response length and keywords
  const responseLength = userResponse.length;
  const hasQuestion = /[?]/.test(userResponse);
  const hasReflection = /\b(you|your|feel|feeling|seem|sounds?|looks?)\b/i.test(userResponse);
  const hasClarification = /\b(mean|understand|clarify|explain|elaborate)\b/i.test(userResponse);
  
  const metrics: EvaluationMetrics = {
    perception_match: Math.min(0.9, 0.5 + (responseLength / 200) * 0.4),
    paraphrasing: hasReflection ? 0.75 : 0.3,
    clarification: hasClarification ? 0.6 : 0.2,
    emotional_alignment: hasReflection ? 0.6 : 0.4,
    misunderstanding: false,
    comments: hasQuestion 
      ? 'Good use of questions to clarify understanding.' 
      : hasReflection 
        ? 'Good paraphrasing, but lacks emotional depth.' 
        : 'Response could benefit from more reflection and clarification.',
  };

  logger.debug('Evaluation metrics', metrics);
  return metrics;
}

// Convert EvaluationMetrics to FeedbackTips
export function metricsToTips(metrics: EvaluationMetrics): FeedbackTip[] {
  const tips: FeedbackTip[] = [];
  
  if (metrics.paraphrasing < 0.5) {
    tips.push({
      tip: 'Try reflecting their emotions back: "It sounds like you\'re feeling..."',
      category: 'reflection',
    });
  }
  
  if (metrics.clarification < 0.4) {
    tips.push({
      tip: 'Consider asking clarifying questions to ensure understanding',
      category: 'questioning',
    });
  }
  
  if (metrics.emotional_alignment < 0.5) {
    tips.push({
      tip: 'Acknowledge their feelings before jumping to solutions',
      category: 'empathy',
    });
  }
  
  if (metrics.perception_match < 0.7) {
    tips.push({
      tip: 'Validate their perspective to show you understand',
      category: 'validation',
    });
  }
  
  return tips.length > 0 ? tips : [
    {
      tip: 'Great job! Continue listening actively and reflecting back what you hear.',
      category: 'reflection',
    },
  ];
}

// Calculate score from metrics (0-10 scale)
export function metricsToScore(metrics: EvaluationMetrics): number {
  const avgScore = (
    metrics.perception_match +
    metrics.paraphrasing +
    metrics.clarification +
    metrics.emotional_alignment
  ) / 4;
  
  // Convert 0-1 scale to 0-10 scale
  return Math.round(avgScore * 10);
}

// Prompt 4: Summarize Overall Score
export function summarizeScore(
  metricsHistory: EvaluationMetrics[]
): ScoreSummary {
  logger.info('Summarizing overall score', { metricsCount: metricsHistory.length });
  
  if (metricsHistory.length === 0) {
    logger.error('No metrics history provided for summarization');
    return {
      summary_score: 0,
      dominant_traits: [],
      recommendation: 'No data available for summarization.',
    };
  }
  
  const n = metricsHistory.length;
  const keys: (keyof EvaluationMetrics)[] = [
    'perception_match',
    'paraphrasing',
    'clarification',
    'emotional_alignment',
  ];
  
  const agg: Record<string, number> = {};
  keys.forEach((key) => {
    const sum = metricsHistory.reduce((acc, m) => acc + (m[key] as number), 0);
    agg[key] = sum / n;
  });
  
  const finalScore = Math.round(
    (Object.values(agg).reduce((a, b) => a + b, 0) / keys.length) * 100
  ) / 10;
  
  const dominantTraits = Object.entries(agg)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2)
    .map(([key]) => key);
  
  const recommendation = 
    agg.clarification < 0.5
      ? 'Focus on improving clarification and emotional attunement.'
      : agg.paraphrasing < 0.6
        ? 'Work on paraphrasing and reflecting back what you hear.'
        : 'Continue practicing active listening skills.';
  
  const summary: ScoreSummary = {
    summary_score: finalScore,
    dominant_traits: dominantTraits,
    recommendation,
  };
  
  logger.debug('Score summary', summary);
  return summary;
}

