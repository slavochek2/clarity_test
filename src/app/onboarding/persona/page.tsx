'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import OnboardingLayout from '@/components/OnboardingLayout';
import SelectCard from '@/components/SelectCard';
import { saveProfile, Persona, UserProfile } from '@/lib/storage';

const PERSONAS: Persona[] = [
  {
    id: 'marcus-aurelius',
    name: 'Marcus Aurelius',
    description: 'Sharing the burden of leadership and personal loss',
  },
  {
    id: 'frida-kahlo',
    name: 'Frida Kahlo',
    description: 'Processing physical pain and emotional betrayal',
  },
  {
    id: 'viktor-frankl',
    name: 'Viktor Frankl',
    description: 'Finding meaning through profound suffering',
  },
  {
    id: 'virginia-woolf',
    name: 'Virginia Woolf',
    description: 'Navigating mental health and creative struggles',
  },
  {
    id: 'ernest-hemingway',
    name: 'Ernest Hemingway',
    description: 'Confronting depression and war trauma',
  },
  {
    id: 'brene-brown',
    name: 'Brené Brown',
    description: 'Opening up about vulnerability and shame',
  },
];

const SHORTCUTS = ['1', '2', '3', '4', '5', '6'];

export default function PersonaPage() {
  const router = useRouter();
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);

  const selectPersona = useCallback((persona: Persona) => {
    setSelectedPersona(persona);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const index = SHORTCUTS.indexOf(e.key);
      if (index !== -1 && index < PERSONAS.length) {
        selectPersona(PERSONAS[index]);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectPersona]);

  const handleContinue = () => {
    if (!selectedPersona) return;

    // Retrieve data from previous steps
    const goalsJson = sessionStorage.getItem('onboarding_goals');
    const goals = goalsJson ? JSON.parse(goalsJson) : [];

    const skillLevel = sessionStorage.getItem('onboarding_skillLevel') as UserProfile['skillLevel'] || 'beginner';

    // Save complete profile
    saveProfile({
      goals,
      skillLevel,
      persona: selectedPersona,
      createdAt: new Date().toISOString(),
    });

    // Clean up session storage
    sessionStorage.removeItem('onboarding_goals');
    sessionStorage.removeItem('onboarding_skillLevel');

    router.push('/onboarding/complete');
  };

  return (
    <OnboardingLayout currentStep={3} totalSteps={3}>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
          Who would you like to listen to?
        </h1>
        <p className="mt-3 text-gray-600 dark:text-gray-400">
          Practice with a historical figure sharing their struggles
        </p>
      </div>

      <div className="space-y-3">
        {PERSONAS.map((persona, index) => (
          <SelectCard
            key={persona.id}
            label={persona.name}
            shortcut={SHORTCUTS[index]}
            selected={selectedPersona?.id === persona.id}
            onClick={() => selectPersona(persona)}
            description={persona.description}
          />
        ))}
      </div>

      <div className="mt-8">
        <button
          onClick={handleContinue}
          disabled={!selectedPersona}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
            selectedPersona
              ? 'bg-indigo-600 text-white hover:bg-indigo-500'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
          }`}
        >
          Start Practicing
        </button>
      </div>
    </OnboardingLayout>
  );
}
