export interface Character {
  id: string;
  name: string;
  avatar: string;
  description: string;
}

export interface Situation {
  role: string;
  location: string;
  context: string;
}

export interface TrainingSession {
  character: Character;
  situation: Situation;
  initialMessage: string;
}

export interface FeedbackTip {
  tip: string;
  category: 'empathy' | 'reflection' | 'validation' | 'questioning';
}

// Mock character data
export const MOCK_SESSION: TrainingSession = {
  character: {
    id: 'sam',
    name: 'Sam',
    avatar: '/avatars/sam.png',
    description: 'Your close friend, usually optimistic but going through a tough time',
  },
  situation: {
    role: 'You are Sam\'s roommate',
    location: 'Your shared apartment kitchen',
    context: 'Sam just came home and told you they got fired from their job of 5 years',
  },
  initialMessage: "I can't believe this happened... they just called me into the office and that was it. Five years, gone. I don't even know what to do now.",
};

// Mock AI responses based on round
export const MOCK_AI_RESPONSES = [
  "Yeah, I guess... it's just so sudden. I thought I was doing a good job, you know? My last review was great. I keep replaying everything in my head trying to figure out what I did wrong.",
  "Thanks for listening. It helps to talk about it. I'm just scared about what comes next. The job market is tough right now, and I have rent to pay...",
  "You're right, I should probably take a day or two to process this before jumping into anything. I just feel like I need to be doing something productive, you know?",
];

// Mock tips based on user responses
export const MOCK_TIPS: FeedbackTip[][] = [
  [
    { tip: "Try reflecting their emotions back: 'It sounds like you're feeling shocked and confused'", category: 'reflection' },
    { tip: "Avoid jumping to solutions immediately - first acknowledge their feelings", category: 'empathy' },
  ],
  [
    { tip: "Good job acknowledging their fear. You could also validate that their concern is reasonable", category: 'validation' },
    { tip: "Consider asking an open-ended question like 'What's weighing on you most right now?'", category: 'questioning' },
  ],
  [
    { tip: "Excellent reflection of their need for productivity", category: 'reflection' },
    { tip: "You might offer support without taking over: 'I'm here if you want to brainstorm together'", category: 'empathy' },
  ],
];

// Mock understanding scores (what the character "actually" felt)
export const MOCK_UNDERSTANDING_SCORES = [6, 7, 8];

// Helper to get mock response for a round
export function getMockResponse(round: number): string {
  return MOCK_AI_RESPONSES[round % MOCK_AI_RESPONSES.length];
}

export function getMockTips(round: number): FeedbackTip[] {
  return MOCK_TIPS[round % MOCK_TIPS.length];
}

export function getMockScore(round: number): number {
  return MOCK_UNDERSTANDING_SCORES[round % MOCK_UNDERSTANDING_SCORES.length];
}
