'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getProfile } from '@/lib/storage';
import type { Persona as AIPersona } from '@/lib/ai/evaluationPipeline';

export default function TrainingIntroPage() {
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);
  const [aiPersona, setAiPersona] = useState<AIPersona | null>(null);
  const [profile, setProfile] = useState<any>(null);

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

  // Use AI persona if available, otherwise fallback to profile
  const character = aiPersona ? {
    id: aiPersona.id,
    name: aiPersona.name,
    description: aiPersona.short_description,
    avatar: '/avatars/default.png',
  } : profile?.persona ? {
    id: profile.persona.id,
    name: profile.persona.name,
    description: profile.persona.description,
    avatar: '/avatars/default.png',
  } : {
    id: 'default',
    name: 'Unknown',
    description: 'No character selected',
    avatar: '/avatars/default.png',
  };

  const situation = {
    role: 'You are practicing active listening',
    location: 'Training session',
    context: aiPersona?.starter_prompt || 'Start a conversation to practice your listening skills.',
  };

  const handleStart = () => {
    setIsStarting(true);
    // Small delay for transition feel
    setTimeout(() => {
      router.push('/training/session');
    }, 300);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-2xl">
        {/* Character intro */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">👤</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
            Meet {character.name}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {character.description}
          </p>
        </div>

        {/* Situation card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
          <h2 className="text-sm font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mb-4">
            The Situation
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

        {/* Instructions */}
        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 mb-8">
          <h3 className="text-sm font-medium text-indigo-900 dark:text-indigo-100 mb-2">
            How this works
          </h3>
          <ul className="text-sm text-indigo-800 dark:text-indigo-200 space-y-1">
            <li>• You&apos;ll have <strong>3 minutes</strong> to practice active listening</li>
            <li>• Speak your response — it will be transcribed live</li>
            <li>• After each response, estimate how understood {character.name} feels</li>
            <li>• Get instant feedback and tips to improve</li>
          </ul>
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
          {isStarting ? 'Starting...' : 'Start Training'}
        </button>
      </div>
    </main>
  );
}
