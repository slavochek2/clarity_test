'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import OnboardingLayout from '@/components/OnboardingLayout';
import SelectCard from '@/components/SelectCard';
import { UserProfile } from '@/lib/storage';

type SkillLevel = UserProfile['skillLevel'];

const OPTIONS: { id: SkillLevel; label: string; shortcut: string }[] = [
  { id: 'beginner', label: 'Less than once per week', shortcut: '1' },
  { id: 'developing', label: 'A few times per week', shortcut: '2' },
  { id: 'intermediate', label: 'Every day', shortcut: '3' },
  { id: 'advanced', label: 'In all important conversations', shortcut: '4' },
];

export default function AssessPage() {
  const router = useRouter();
  const [selectedLevel, setSelectedLevel] = useState<SkillLevel | null>(null);

  const selectLevel = useCallback((level: SkillLevel) => {
    setSelectedLevel(level);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const option = OPTIONS.find((o) => o.shortcut === e.key);
      if (option) {
        selectLevel(option.id);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectLevel]);

  const handleContinue = () => {
    if (!selectedLevel) return;

    // Store skill level for next step
    sessionStorage.setItem('onboarding_skillLevel', selectedLevel);

    router.push('/onboarding/persona');
  };

  return (
    <OnboardingLayout currentStep={2} totalSteps={3}>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
          How often do you paraphrase back what others say?
        </h1>
        <p className="mt-3 text-gray-600 dark:text-gray-400">
          Be honest – this helps us personalize your training
        </p>
      </div>

      <div className="space-y-3">
        {OPTIONS.map((option) => (
          <SelectCard
            key={option.id}
            label={option.label}
            shortcut={option.shortcut}
            selected={selectedLevel === option.id}
            onClick={() => selectLevel(option.id)}
          />
        ))}
      </div>

      <div className="mt-8">
        <button
          onClick={handleContinue}
          disabled={!selectedLevel}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
            selectedLevel
              ? 'bg-indigo-600 text-white hover:bg-indigo-500'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
          }`}
        >
          Continue
        </button>
      </div>
    </OnboardingLayout>
  );
}
