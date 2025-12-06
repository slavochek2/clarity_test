'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getProfile, UserProfile } from '@/lib/storage';
import { MOCK_SESSION } from '@/lib/mockData';

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
  const [isStarting, setIsStarting] = useState(false);

  const { character, situation } = MOCK_SESSION;

  useEffect(() => {
    setProfile(getProfile());
  }, []);

  const handleStart = () => {
    setIsStarting(true);
    setTimeout(() => {
      router.push('/training/session');
    }, 300);
  };

  if (!profile) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-2xl">
        {/* Success header */}
        <div className="text-center mb-8">
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
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Ready to practice with {character.name}
          </p>
        </div>

        {/* Profile summary - compact */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400">Partner:</span>
              <span className="font-medium text-gray-900 dark:text-white">{profile.persona.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400">Level:</span>
              <span className="font-medium text-gray-900 dark:text-white">{LEVEL_LABELS[profile.skillLevel]}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400">Goals:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {profile.goals.map(g => GOAL_LABELS[g] || g).join(', ')}
              </span>
            </div>
          </div>
        </div>

        {/* Situation card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <h2 className="text-sm font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mb-4">
            Your First Scenario
          </h2>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Your role</p>
              <p className="text-gray-900 dark:text-white font-medium">{situation.role}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
              <p className="text-gray-900 dark:text-white font-medium">{situation.location}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">What&apos;s happening</p>
              <p className="text-gray-900 dark:text-white font-medium">{situation.context}</p>
            </div>
          </div>
        </div>

        {/* Start button */}
        <button
          onClick={handleStart}
          disabled={isStarting}
          className={`w-full py-4 px-6 rounded-lg font-medium text-lg transition-all ${
            isStarting
              ? 'bg-indigo-400 text-white cursor-wait'
              : 'bg-indigo-600 text-white hover:bg-indigo-500'
          }`}
        >
          {isStarting ? 'Starting...' : 'Begin Practice'}
        </button>
      </div>
    </main>
  );
}
