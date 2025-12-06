'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import OnboardingLayout from '@/components/OnboardingLayout';
import SelectCard from '@/components/SelectCard';

const GOALS = [
  { id: 'relationships', label: 'Improve relationships', shortcut: 'A' },
  { id: 'mistakes', label: 'Reduce mistakes', shortcut: 'B' },
  { id: 'conflicts', label: 'Prevent conflicts', shortcut: 'C' },
  { id: 'trust', label: 'Increase trust', shortcut: 'D' },
  { id: 'problem-solving', label: 'Improve problem-solving', shortcut: 'E' },
];

const MAX_SELECTIONS = 3;

export default function GoalsPage() {
  const router = useRouter();
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  const toggleGoal = useCallback((goalId: string) => {
    setSelectedGoals((prev) => {
      if (prev.includes(goalId)) {
        return prev.filter((id) => id !== goalId);
      }
      if (prev.length >= MAX_SELECTIONS) {
        return prev;
      }
      return [...prev, goalId];
    });
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const key = e.key.toUpperCase();
      const goal = GOALS.find((g) => g.shortcut === key);
      if (goal) {
        toggleGoal(goal.id);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleGoal]);

  const handleContinue = () => {
    // Store goals temporarily in sessionStorage for the next step
    sessionStorage.setItem('onboarding_goals', JSON.stringify(selectedGoals));
    router.push('/onboarding/assess');
  };

  return (
    <OnboardingLayout currentStep={1} totalSteps={3}>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
          What do you hope to achieve?
        </h1>
        <p className="mt-3 text-gray-600 dark:text-gray-400">
          Pick up to 3 priorities
        </p>
      </div>

      <div className="space-y-3">
        {GOALS.map((goal) => (
          <SelectCard
            key={goal.id}
            label={goal.label}
            shortcut={goal.shortcut}
            selected={selectedGoals.includes(goal.id)}
            onClick={() => toggleGoal(goal.id)}
            disabled={
              selectedGoals.length >= MAX_SELECTIONS &&
              !selectedGoals.includes(goal.id)
            }
          />
        ))}
      </div>

      <div className="mt-8">
        <button
          onClick={handleContinue}
          disabled={selectedGoals.length === 0}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
            selectedGoals.length > 0
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
