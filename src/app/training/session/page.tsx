'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  MOCK_SESSION,
  getMockResponse,
  getMockTips,
  getMockScore,
  FeedbackTip,
} from '@/lib/mockData';

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
  const { character, situation, initialMessage } = MOCK_SESSION;

  // Session state
  const [timeLeft, setTimeLeft] = useState(SESSION_DURATION);
  const [phase, setPhase] = useState<SessionPhase>('listening');
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'ai', text: initialMessage },
  ]);
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
  const handleRatingSubmit = useCallback(() => {
    const tips = getMockTips(currentRound);
    const score = getMockScore(currentRound);

    setCurrentTips(tips);
    setActualScore(score);

    // Save round result
    const lastUserMessage = messages.filter((m) => m.sender === 'user').pop();
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
  }, [currentRound, messages, userEstimate]);

  // Continue after feedback
  const handleContinue = useCallback(() => {
    setPhase('ai-responding');

    // Simulate AI thinking/responding
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
  }, [currentRound]);

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

          {/* Timer */}
          <div className={`text-2xl font-mono font-bold ${getTimerColor()}`}>
            {formatTime(timeLeft)}
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
                placeholder={isRecording ? 'Speak now... (or type for demo)' : 'Press the mic button to speak...'}
                className="w-full p-3 pr-12 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={3}
                disabled={!isRecording && transcript === ''}
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
                onClick={toggleRecording}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                  isRecording
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}
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
                onClick={handleSubmit}
                disabled={!transcript.trim()}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  transcript.trim()
                    ? 'bg-indigo-600 text-white hover:bg-indigo-500'
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-20">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl">
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
              onClick={handleRatingSubmit}
              className="w-full py-3 px-4 rounded-lg font-medium bg-indigo-600 text-white hover:bg-indigo-500 transition-all"
            >
              See Result
            </button>
          </div>
        </div>
      )}

      {/* Feedback overlay */}
      {phase === 'feedback' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-20">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl max-h-[80vh] overflow-y-auto">
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
              onClick={handleContinue}
              className="w-full mt-6 py-3 px-4 rounded-lg font-medium bg-indigo-600 text-white hover:bg-indigo-500 transition-all"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
