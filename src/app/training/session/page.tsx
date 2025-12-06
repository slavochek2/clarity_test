'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  getMockResponse,
  getMockTips,
  getMockScore,
  FeedbackTip,
} from '@/lib/mockData';
import { getProfile } from '@/lib/storage';
import type { Persona as AIPersona } from '@/lib/ai/evaluationPipeline';

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
}

interface RoundResult {
  userMessage: string;
  userEstimate: number;
  actualScore: number;
  tips: FeedbackTip[];
}

type SessionPhase = 'listening' | 'speaking' | 'rating' | 'feedback' | 'ai-responding';

const SESSION_DURATION = 180; // 3 minutes in seconds

export default function TrainingSessionPage() {
  const router = useRouter();
  const [aiPersona, setAiPersona] = useState<AIPersona | null>(null);
  const [character, setCharacter] = useState({
    id: 'default',
    name: 'Loading...',
    avatar: '/avatars/default.png',
    description: '',
  });
  const [situation, setSituation] = useState({
    role: 'You are practicing active listening',
    location: 'Training session',
    context: '',
  });
  const [initialMessage, setInitialMessage] = useState('Loading...');

  // Load AI persona data
  useEffect(() => {
    const profile = getProfile();
    const aiPersonaJson = sessionStorage.getItem('selected_ai_persona');
    
    if (aiPersonaJson) {
      try {
        const persona = JSON.parse(aiPersonaJson) as AIPersona;
        setAiPersona(persona);
        setCharacter({
          id: persona.id,
          name: persona.name,
          avatar: '/avatars/default.png',
          description: persona.short_description,
        });
        setSituation({
          role: 'You are practicing active listening',
          location: 'Training session',
          context: persona.starter_prompt || 'Start a conversation to practice your listening skills.',
        });
        setInitialMessage(persona.starter_prompt || 'Hello, let\'s begin our conversation.');
      } catch (e) {
        console.error('Error loading AI persona:', e);
        // Fallback
        setInitialMessage('Hello, let\'s begin our conversation.');
      }
    } else if (profile?.persona) {
      // Fallback to profile persona
      setCharacter({
        id: profile.persona.id,
        name: profile.persona.name,
        avatar: '/avatars/default.png',
        description: profile.persona.description,
      });
      setInitialMessage('Hello, let\'s begin our conversation.');
    } else {
      setInitialMessage('Hello, let\'s begin our conversation.');
    }
  }, []);

  // Session state
  const [timeLeft, setTimeLeft] = useState(SESSION_DURATION);
  const [phase, setPhase] = useState<SessionPhase>('listening');
  const [messages, setMessages] = useState<Message[]>([]);

  // Initialize messages when initialMessage is loaded
  useEffect(() => {
    if (initialMessage && initialMessage !== 'Loading...' && messages.length === 0) {
      setMessages([{ id: '1', sender: 'ai', text: initialMessage }]);
    }
  }, [initialMessage]);
  const [currentRound, setCurrentRound] = useState(0);
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);

  // Speaking/transcription state
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');

  // Rating state
  const [userEstimate, setUserEstimate] = useState(5);

  // Feedback state
  const [currentTips, setCurrentTips] = useState<FeedbackTip[]>([]);
  const [actualScore, setActualScore] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prevTimeLeft) => {
        if (prevTimeLeft <= 1) {
          clearInterval(timer);
          sessionStorage.setItem('training_results', JSON.stringify(roundResults));
          router.push('/training/results');
          return 0;
        }
        return prevTimeLeft - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [roundResults, router]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Simulate voice recording (in real app, would use Web Speech API)
  const toggleRecording = useCallback(() => {
    if (isRecording) {
      setIsRecording(false);
    } else {
      setIsRecording(true);
      setPhase('speaking');
    }
  }, [isRecording]);

  // Handle transcript input (mock - in real app would come from speech recognition)
  const handleTranscriptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTranscript(e.target.value);
  };

  // Submit user response
  const handleSubmit = useCallback(() => {
    if (!transcript.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: transcript,
    };
    setMessages((prev) => [...prev, userMessage]);
    setTranscript('');
    setIsRecording(false);
    setPhase('rating');
  }, [transcript]);

  // Submit rating
  const handleRatingSubmit = useCallback(async () => {
    console.log('[Training Session] Submitting rating', { currentRound, userEstimate });
    
    const lastUserMessage = messages.filter((m) => m.sender === 'user').pop();
    const lastAiMessage = messages.filter((m) => m.sender === 'ai').pop();
    
    if (!lastUserMessage || !lastAiMessage) {
      console.warn('[Training Session] Missing messages, using mock data');
      const tips = getMockTips(currentRound);
      const score = getMockScore(currentRound);
      setCurrentTips(tips);
      setActualScore(score);
      setRoundResults((prev) => [
        ...prev,
        {
          userMessage: lastUserMessage?.text || '',
          userEstimate,
          actualScore: score,
          tips,
        },
      ]);
      setPhase('feedback');
      return;
    }

    try {
      console.log('[Training Session] Calling AI evaluation API', {
        agentMessage: lastAiMessage.text.substring(0, 50) + '...',
        userResponse: lastUserMessage.text.substring(0, 50) + '...',
      });

      const response = await fetch('/api/ai/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentMessage: lastAiMessage.text,
          userResponse: lastUserMessage.text,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('[Training Session] AI evaluation received', {
        score: data.score,
        tipsCount: data.tips?.length || 0,
        metrics: data.metrics,
      });

      setCurrentTips(data.tips || []);
      setActualScore(data.score || 0);

      setRoundResults((prev) => [
        ...prev,
        {
          userMessage: lastUserMessage.text,
          userEstimate,
          actualScore: data.score || 0,
          tips: data.tips || [],
        },
      ]);

      setPhase('feedback');
    } catch (error) {
      console.error('[Training Session] Error evaluating with AI, using mock data', error);
      // Fallback to mock data
      const tips = getMockTips(currentRound);
      const score = getMockScore(currentRound);
      setCurrentTips(tips);
      setActualScore(score);
      setRoundResults((prev) => [
        ...prev,
        {
          userMessage: lastUserMessage.text,
          userEstimate,
          actualScore: score,
          tips,
        },
      ]);
      setPhase('feedback');
    }
  }, [currentRound, messages, userEstimate]);

  // Continue after feedback
  const handleContinue = useCallback(async () => {
    console.log('[Training Session] Continuing to next round', { currentRound });
    setPhase('ai-responding');

    try {
      // Build dialogue history
      const dialogueHistory = messages
        .filter((m) => m.sender === 'ai' || m.sender === 'user')
        .map((m) => ({
          agent: m.sender === 'ai' ? character.name : 'User',
          user: m.text,
        }));

      // Calculate average score from round results
      const avgScore = roundResults.length > 0
        ? roundResults.reduce((sum, r) => sum + r.actualScore, 0) / roundResults.length
        : 0;

      console.log('[Training Session] Generating next question', {
        dialogueHistoryLength: dialogueHistory.length,
        avgScore,
      });

      // Use AI persona if available, otherwise construct from character
      const personaForAPI = aiPersona || {
        id: character.id,
        name: character.name,
        topics: ['Empathy', 'Support'],
        starter_prompt: initialMessage,
        short_description: character.description,
        why_helpful_to_user: '',
      };

      const response = await fetch('/api/ai/generate-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          persona: personaForAPI,
          dialogueHistory,
          score: avgScore,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('[Training Session] Next question generated', {
        questionLength: data.question?.length || 0,
        question: data.question,
      });

      // Use the generated question directly (it should be just the question, not the full prompt)
      let aiResponse = data.question || getMockResponse(currentRound);
      
      // Clean up the response if it contains unwanted parts
      // Remove any prompt instructions or dialogue history markers
      aiResponse = aiResponse
        .replace(/— Dialogue history —/g, '')
        .replace(/Score: \d+/g, '')
        .replace(/Your next question:/g, '')
        .replace(/You are speaking as[\s\S]*?Start from this message:/g, '')
        .trim();
      
      // If response is very long, it might still contain the full prompt
      if (aiResponse.length > 300) {
        // Try to extract just the last sentence or question
        const sentences = aiResponse.split(/[.!?]+/).filter((s: string) => s.trim().length > 0);
        if (sentences.length > 0) {
          aiResponse = sentences[sentences.length - 1].trim();
          if (!aiResponse.endsWith('.') && !aiResponse.endsWith('?') && !aiResponse.endsWith('!')) {
            aiResponse += '.';
          }
        } else {
          // Fallback: take last 200 characters
          aiResponse = aiResponse.slice(-200).trim();
        }
      }
      
      // If still no good response, use mock
      if (!aiResponse || aiResponse.length < 10) {
        aiResponse = getMockResponse(currentRound);
      }

      const aiMessage: Message = {
        id: Date.now().toString(),
        sender: 'ai',
        text: aiResponse,
      };
      setMessages((prev) => [...prev, aiMessage]);
      setCurrentRound((prev) => prev + 1);
      setUserEstimate(5);
      setPhase('listening');
    } catch (error) {
      console.error('[Training Session] Error generating question, using mock data', error);
      // Fallback to mock data
      setTimeout(() => {
        const aiResponse = getMockResponse(currentRound);
        const aiMessage: Message = {
          id: Date.now().toString(),
          sender: 'ai',
          text: aiResponse,
        };
        setMessages((prev) => [...prev, aiMessage]);
        setCurrentRound((prev) => prev + 1);
        setUserEstimate(5);
        setPhase('listening');
      }, 1500);
    }
  }, [currentRound, messages, roundResults, character, initialMessage, aiPersona]);

  // Handle finish button
  const handleFinish = useCallback(() => {
    console.log('[Training Session] Finishing session', { roundResults });
    // Save results to sessionStorage
    sessionStorage.setItem('training_results', JSON.stringify(roundResults));
    router.push('/training/results');
  }, [roundResults, router]);

  // Get timer color based on time left
  const getTimerColor = () => {
    if (timeLeft <= 30) return 'text-red-500';
    if (timeLeft <= 60) return 'text-yellow-500';
    return 'text-gray-700 dark:text-gray-300';
  };

  return (
    <main className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header with timer and character */}
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          {/* Character info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
              <span className="text-lg">👤</span>
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{character.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{situation.location}</p>
            </div>
          </div>

          {/* Timer and Finish button */}
          <div className="flex items-center gap-4">
            <div className={`text-2xl font-mono font-bold ${getTimerColor()}`}>
              {formatTime(timeLeft)}
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                handleFinish();
              }}
              type="button"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-all"
            >
              Finish
            </button>
          </div>
        </div>
      </header>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.sender === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                }`}
              >
                {message.sender === 'ai' && (
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mb-1">
                    {character.name}
                  </p>
                )}
                <p className="text-sm leading-relaxed">{message.text}</p>
              </div>
            </div>
          ))}

          {/* AI responding indicator */}
          {phase === 'ai-responding' && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-gray-800 rounded-2xl px-4 py-3 border border-gray-200 dark:border-gray-700">
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mb-1">
                  {character.name}
                </p>
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      {(phase === 'listening' || phase === 'speaking') && (
        <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-4">
          <div className="max-w-3xl mx-auto">
            {/* Live transcription display */}
            <div className="relative mb-3">
              <textarea
                value={transcript}
                onChange={handleTranscriptChange}
                placeholder="Type your response here..."
                className="w-full p-3 pr-12 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={3}
                onKeyDown={(e) => {
                  // Allow Enter+Shift for new line, Enter alone to submit
                  if (e.key === 'Enter' && !e.shiftKey && transcript.trim()) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
              />
              {isRecording && (
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-xs text-red-500 font-medium">Recording</span>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  toggleRecording();
                }}
                type="button"
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  isRecording
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400'
                }`}
                title={isRecording ? 'Stop recording' : 'Start recording (optional)'}
              >
                {isRecording ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                  </svg>
                )}
              </button>

              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleSubmit();
                }}
                type="button"
                disabled={!transcript.trim()}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  transcript.trim()
                    ? 'bg-indigo-600 text-white hover:bg-indigo-500 cursor-pointer'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                }`}
              >
                Submit Response
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rating overlay */}
      {phase === 'rating' && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-20"
          onClick={(e) => {
            // Prevent closing on overlay click, only allow button clicks
            if (e.target === e.currentTarget) {
              e.preventDefault();
            }
          }}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">
              How understood does {character.name} feel?
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
              Estimate before seeing the actual result
            </p>

            {/* Slider */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
                <span>Not at all</span>
                <span>Completely</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={userEstimate}
                onChange={(e) => setUserEstimate(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="text-center mt-3">
                <span className="text-4xl font-bold text-indigo-600">{userEstimate}</span>
                <span className="text-gray-500 dark:text-gray-400">/10</span>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleRatingSubmit();
              }}
              type="button"
              className="w-full py-3 px-4 rounded-lg font-medium bg-indigo-600 text-white hover:bg-indigo-500 transition-all cursor-pointer"
            >
              See Result
            </button>
          </div>
        </div>
      )}

      {/* Feedback overlay */}
      {phase === 'feedback' && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-20"
          onClick={(e) => {
            // Prevent closing on overlay click
            if (e.target === e.currentTarget) {
              e.preventDefault();
            }
          }}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Score comparison */}
            <div className="text-center mb-6">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                {character.name} actually felt...
              </p>
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <p className="text-xs text-gray-400 mb-1">Your estimate</p>
                  <span className="text-3xl font-bold text-gray-400">{userEstimate}</span>
                </div>
                <div className="text-2xl text-gray-300">→</div>
                <div className="text-center">
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 mb-1">Actual</p>
                  <span className="text-3xl font-bold text-indigo-600">{actualScore}</span>
                </div>
              </div>
              <p className="mt-3 text-sm font-medium">
                {Math.abs(userEstimate - actualScore) <= 1 ? (
                  <span className="text-green-600">Great calibration! 🎯</span>
                ) : userEstimate > actualScore ? (
                  <span className="text-yellow-600">You overestimated a bit</span>
                ) : (
                  <span className="text-yellow-600">You underestimated a bit</span>
                )}
              </p>
            </div>

            {/* Tips */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Tips for improvement
              </h3>
              <ul className="space-y-3">
                {currentTips.map((tip, i) => (
                  <li
                    key={i}
                    className="flex gap-3 text-sm text-gray-600 dark:text-gray-300"
                  >
                    <span className="text-indigo-600 dark:text-indigo-400 shrink-0">💡</span>
                    <span>{tip.tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleContinue();
              }}
              type="button"
              className="w-full mt-6 py-3 px-4 rounded-lg font-medium bg-indigo-600 text-white hover:bg-indigo-500 transition-all cursor-pointer"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
