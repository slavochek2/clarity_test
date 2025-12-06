'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getProfile, UserProfile } from '@/lib/storage';
import type { Persona as AIPersona } from '@/lib/ai/evaluationPipeline';

const LEVEL_LABELS: Record<UserProfile['skillLevel'], string> = {
  beginner: 'Beginner',
  developing: 'Developing',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

const GOAL_LABELS: Record<string, string> = {
  relationships: 'Improve relationships',
  mistakes: 'Reduce mistakes',
  conflicts: 'Prevent conflicts',
  trust: 'Increase trust',
  'problem-solving': 'Improve problem-solving',
};

export default function CompletePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [aiPersona, setAiPersona] = useState<AIPersona | null>(null);

  useEffect(() => {
    const savedProfile = getProfile();
    setProfile(savedProfile);

    // Get full AI persona data
    const aiPersonaJson = sessionStorage.getItem('selected_ai_persona');
    if (aiPersonaJson) {
      try {
        setAiPersona(JSON.parse(aiPersonaJson));
      } catch (e) {
        console.error('Error parsing AI persona:', e);
      }
    }
  }, []);

  if (!profile) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-lg text-center">
        <div className="mb-8">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
            You&apos;re all set!
          </h1>
          <p className="mt-3 text-gray-600 dark:text-gray-400">
            Your profile has been saved. Here&apos;s a summary:
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 text-left space-y-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Practice Partner
            </p>
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              {profile.persona.name}
            </p>
            {aiPersona && (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  {aiPersona.short_description}
                </p>
                {aiPersona.topics && aiPersona.topics.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Topics:</p>
                    <div className="flex flex-wrap gap-2">
                      {aiPersona.topics.map((topic, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 text-xs rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {aiPersona.why_helpful_to_user && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                      Why this helps you:
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {aiPersona.why_helpful_to_user}
                    </p>
                  </div>
                )}
              </>
            )}
            {!aiPersona && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {profile.persona.description}
              </p>
            )}
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Your Level
            </p>
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              {LEVEL_LABELS[profile.skillLevel]}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Your Goals
            </p>
            <ul className="space-y-1">
              {profile.goals.map((goal) => (
                <li
                  key={goal}
                  className="flex items-center gap-2 text-gray-700 dark:text-gray-300"
                >
                  <svg
                    className="w-4 h-4 text-indigo-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {GOAL_LABELS[goal] || goal}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <button
          onClick={() => router.push('/training')}
          className="mt-6 w-full py-3 px-4 rounded-lg font-medium bg-indigo-600 text-white hover:bg-indigo-500 transition-all"
        >
          Start Training Session
        </button>
      </div>
    </main>
  );
}
