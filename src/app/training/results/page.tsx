'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FeedbackTip } from '@/lib/mockData';
import { getProfile } from '@/lib/storage';
import type { Persona as AIPersona } from '@/lib/ai/evaluationPipeline';

interface RoundResult {
  userMessage: string;
  userEstimate: number;
  actualScore: number;
  tips: FeedbackTip[];
}

export default function TrainingResultsPage() {
  const router = useRouter();
  const [results, setResults] = useState<RoundResult[]>([]);
  const [overallScore, setOverallScore] = useState(0);
  const [characterName, setCharacterName] = useState('your practice partner');
  const [aiPersona, setAiPersona] = useState<AIPersona | null>(null);

  useEffect(() => {
    // Load character name from profile or sessionStorage
    const profile = getProfile();
    if (profile?.persona) {
      setCharacterName(profile.persona.name);
    }

    // Load full AI persona data if available
    const aiPersonaJson = sessionStorage.getItem('selected_ai_persona');
    if (aiPersonaJson) {
      try {
        const persona = JSON.parse(aiPersonaJson) as AIPersona;
        setAiPersona(persona);
        setCharacterName(persona.name);
      } catch (e) {
        console.error('Error parsing AI persona:', e);
      }
    }

    // Load training results
    const stored = sessionStorage.getItem('training_results');
    if (stored) {
      const parsed: RoundResult[] = JSON.parse(stored);
      setResults(parsed);

      // Calculate overall score (0-100)
      if (parsed.length > 0) {
        const avgActualScore = parsed.reduce((sum, r) => sum + r.actualScore, 0) / parsed.length;
        const avgCalibration = parsed.reduce((sum, r) => sum + (10 - Math.abs(r.userEstimate - r.actualScore)), 0) / parsed.length;
        // Score is combination of how understood character felt + calibration accuracy
        const score = Math.round((avgActualScore * 5 + avgCalibration * 5));
        setOverallScore(score);
      }
    }
  }, []);

  const getScoreColor = () => {
    if (overallScore >= 80) return 'text-green-500';
    if (overallScore >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreLabel = () => {
    if (overallScore >= 80) return 'Excellent!';
    if (overallScore >= 60) return 'Good progress';
    if (overallScore >= 40) return 'Keep practicing';
    return 'Room for growth';
  };

  // Collect all unique tips from all rounds
  const allTips = results.flatMap((r) => r.tips);
  const uniqueTips = allTips.filter(
    (tip, index, self) => index === self.findIndex((t) => t.tip === tip.tip)
  );

  // Find patterns - where user consistently over/under estimated
  const calibrationErrors = results.map((r) => r.userEstimate - r.actualScore);
  const avgError = calibrationErrors.length > 0
    ? calibrationErrors.reduce((a, b) => a + b, 0) / calibrationErrors.length
    : 0;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl mb-2">
            Training Complete
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Here&apos;s how you did with {characterName}
          </p>
          {aiPersona && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-md mx-auto">
              {aiPersona.short_description}
            </p>
          )}
        </div>

        {/* Overall score card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-200 dark:border-gray-700 mb-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Your Score</p>
          <div className={`text-6xl font-bold ${getScoreColor()} mb-2`}>
            {overallScore}
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">out of 100</p>
          <p className={`mt-3 font-medium ${getScoreColor()}`}>{getScoreLabel()}</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Exchanges</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{results.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Avg. Understanding</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {results.length > 0
                ? (results.reduce((sum, r) => sum + r.actualScore, 0) / results.length).toFixed(1)
                : 0}
              <span className="text-base text-gray-400">/10</span>
            </p>
          </div>
        </div>

        {/* Calibration insight */}
        {results.length > 0 && (
          <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-indigo-900 dark:text-indigo-100 mb-2">
              Calibration Insight
            </h3>
            <p className="text-sm text-indigo-800 dark:text-indigo-200">
              {Math.abs(avgError) <= 0.5
                ? "Your estimates were well-calibrated! You have good awareness of how your responses land."
                : avgError > 0
                ? `You tended to overestimate by ${avgError.toFixed(1)} points on average. Try to notice when you might be assuming more connection than is there.`
                : `You tended to underestimate by ${Math.abs(avgError).toFixed(1)} points on average. Give yourself more credit — your responses are landing better than you think!`}
            </p>
          </div>
        )}

        {/* Key takeaways */}
        {uniqueTips.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Key Takeaways
            </h2>
            <ul className="space-y-3">
              {uniqueTips.slice(0, 4).map((tip, i) => (
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
        )}

        {/* Round by round breakdown */}
        {results.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Round by Round
            </h2>
            <div className="space-y-4">
              {results.map((result, i) => (
                <div
                  key={i}
                  className="border-b border-gray-100 dark:border-gray-700 last:border-0 pb-4 last:pb-0"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Round {i + 1}
                    </span>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-400">Your guess: {result.userEstimate}</span>
                      <span className="text-gray-300">|</span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                        Actual: {result.actualScore}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                    &quot;{result.userMessage.slice(0, 100)}{result.userMessage.length > 100 ? '...' : ''}&quot;
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => router.push('/training')}
            className="flex-1 py-3 px-4 rounded-lg font-medium bg-indigo-600 text-white hover:bg-indigo-500 transition-all"
          >
            Try Again
          </button>
          <button
            onClick={() => router.push('/')}
            className="flex-1 py-3 px-4 rounded-lg font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
          >
            Back to Home
          </button>
        </div>
      </div>
    </main>
  );
}
