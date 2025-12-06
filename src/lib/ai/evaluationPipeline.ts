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
      topics: ['Лидерство', 'Истина', 'Доверие'],
      why_helpful_to_user: 'Tests the user\'s ability to unpack layered intentions and reflect back high-status reasoning without submissiveness.',
      starter_prompt: 'What matters more: vision or trust?',
    },
    {
      id: 'socrates',
      name: 'Socrates',
      short_description: 'A philosopher who questions everything, testing your ability to engage with deep inquiry without defensiveness.',
      topics: ['Философия', 'Истина', 'Решение проблем'],
      why_helpful_to_user: 'Challenges you to reflect deeply and clarify your own thinking through dialogue.',
      starter_prompt: 'How do we know what we know?',
    },
    {
      id: 'sam',
      name: 'Sam',
      short_description: 'Your close friend, usually optimistic but going through a tough time.',
      topics: ['Эмпатия', 'Поддержка', 'Отношения'],
      why_helpful_to_user: 'Tests your ability to listen with empathy and provide emotional support.',
      starter_prompt: 'I can\'t believe this happened... they just called me into the office and that was it. Five years, gone.',
    },
    {
      id: 'marcus-aurelius',
      name: 'Marcus Aurelius',
      short_description: 'Sharing the burden of leadership and personal loss, seeking understanding in moments of vulnerability.',
      topics: ['Лидерство', 'Отношения', 'Доверие'],
      why_helpful_to_user: 'Tests your ability to listen to someone in power who is also struggling, balancing respect with empathy.',
      starter_prompt: 'Even an emperor needs someone who truly understands. The weight of decisions... it never gets easier.',
    },
    {
      id: 'frida-kahlo',
      name: 'Frida Kahlo',
      short_description: 'Processing physical pain and emotional betrayal, expressing deep emotions through art and words.',
      topics: ['Эмпатия', 'Отношения', 'Конфликты'],
      why_helpful_to_user: 'Tests your ability to listen to someone expressing intense emotions and pain without trying to fix them.',
      starter_prompt: 'The pain is constant, but what hurts more is feeling invisible. Do you see me? Really see me?',
    },
    {
      id: 'viktor-frankl',
      name: 'Viktor Frankl',
      short_description: 'Finding meaning through profound suffering, sharing wisdom from the depths of human experience.',
      topics: ['Решение проблем', 'Истина', 'Доверие'],
      why_helpful_to_user: 'Tests your ability to listen to someone who has found meaning in suffering, without minimizing their experience.',
      starter_prompt: 'In the camps, I learned that meaning can be found even in the darkest moments. But sometimes, I still struggle to find it.',
    },
    {
      id: 'virginia-woolf',
      name: 'Virginia Woolf',
      short_description: 'Navigating mental health and creative struggles, balancing brilliance with vulnerability.',
      topics: ['Эмпатия', 'Отношения', 'Ошибки'],
      why_helpful_to_user: 'Tests your ability to listen to someone with mental health challenges without pathologizing or dismissing them.',
      starter_prompt: 'The waves of darkness come and go. Sometimes I can write, sometimes I cannot. Do you understand what that feels like?',
    },
    {
      id: 'ernest-hemingway',
      name: 'Ernest Hemingway',
      short_description: 'Confronting depression and war trauma, struggling to express what cannot be said.',
      topics: ['Конфликты', 'Доверие', 'Отношения'],
      why_helpful_to_user: 'Tests your ability to listen to someone who struggles to express emotions, reading between the lines.',
      starter_prompt: 'I\'ve seen things... done things. The words don\'t come easy anymore. How do you talk about what you can\'t name?',
    },
    {
      id: 'brene-brown',
      name: 'Brené Brown',
      short_description: 'Opening up about vulnerability and shame, sharing research and personal experience.',
      topics: ['Доверие', 'Отношения', 'Эмпатия'],
      why_helpful_to_user: 'Tests your ability to listen to someone teaching about vulnerability while being vulnerable themselves.',
      starter_prompt: 'I study vulnerability, but living it is different. Sometimes I feel like a fraud. Can you understand that?',
    },
  ];

  // Filter personas based on topics if provided
  let personas = allPersonas;
  if (topics && topics.length > 0) {
    personas = allPersonas.filter(persona => 
      persona.topics.some(topic => 
        topics.some(userTopic => 
          topic.toLowerCase().includes(userTopic.toLowerCase()) || 
          userTopic.toLowerCase().includes(topic.toLowerCase())
        )
      )
    );
    
    // If no matches, return all personas
    if (personas.length === 0) {
      personas = allPersonas;
    }
    
    // Limit to 6 personas
    personas = personas.slice(0, 6);
  } else {
    // If no topics, return first 6
    personas = allPersonas.slice(0, 6);
  }

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
  
  const context = dialogueHistory
    .map((msg) => `${msg.agent}: ${msg.user}`)
    .join('\n');
  
  const nextQuestion = `${refinedPrompt}

— Dialogue history —
${context}

Score: ${score}

Your next question:`;

  logger.debug('Generated next question', { questionLength: nextQuestion.length });
  return nextQuestion;
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

