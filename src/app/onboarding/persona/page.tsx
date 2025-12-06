'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import OnboardingLayout from '@/components/OnboardingLayout';
import SelectCard from '@/components/SelectCard';
import { saveProfile, Persona, UserProfile } from '@/lib/storage';
import type { Persona as AIPersona } from '@/lib/ai/evaluationPipeline';

// Fallback personas if API fails
const FALLBACK_PERSONAS: Persona[] = [
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

// Map goal IDs to topics for AI
const GOAL_TO_TOPIC_MAP: Record<string, string> = {
  'relationships': 'Отношения',
  'mistakes': 'Ошибки',
  'conflicts': 'Конфликты',
  'trust': 'Доверие',
  'problem-solving': 'Решение проблем',
};

export default function PersonaPage() {
  const router = useRouter();
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [personas, setPersonas] = useState<Persona[]>(FALLBACK_PERSONAS);
  const [isLoading, setIsLoading] = useState(true);

  const selectPersona = useCallback((persona: Persona) => {
    console.log('[Persona Page] Persona selected', { personaId: persona.id, personaName: persona.name });
    setSelectedPersona(persona);
  }, []);

  // Load personas from AI API
  useEffect(() => {
    async function loadPersonas() {
      try {
        console.log('[Persona Page] Loading personas from AI API');
        setIsLoading(true);

        // Get data from previous steps
        const goalsJson = sessionStorage.getItem('onboarding_goals');
        const goals = goalsJson ? JSON.parse(goalsJson) : [];
        const skillLevel = sessionStorage.getItem('onboarding_skillLevel') || 'beginner';

        // Convert goals to topics
        const topics = goals.map((goalId: string) => GOAL_TO_TOPIC_MAP[goalId] || goalId).filter(Boolean);

        console.log('[Persona Page] Requesting personas with', {
          topics,
          skillLevel,
          goals,
        });

        // Call AI API to generate personas
        const response = await fetch('/api/ai/personas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topics,
            userProfile: {
              skillLevel,
              goals: goals.join(', '),
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        console.log('[Persona Page] Personas received from AI', {
          count: data.personas?.length || 0,
          personas: data.personas,
        });

        // Transform AI personas to page personas
        if (data.personas && Array.isArray(data.personas) && data.personas.length > 0) {
          const transformedPersonas: Persona[] = data.personas.map((aiPersona: AIPersona) => ({
            id: aiPersona.id,
            name: aiPersona.name,
            description: aiPersona.short_description || aiPersona.why_helpful_to_user || '',
          }));

          console.log('[Persona Page] Transformed personas', transformedPersonas);
          setPersonas(transformedPersonas);
        } else {
          console.warn('[Persona Page] No personas in response, using fallback');
          setPersonas(FALLBACK_PERSONAS);
        }
      } catch (error) {
        console.error('[Persona Page] Error loading personas from AI, using fallback', error);
        setPersonas(FALLBACK_PERSONAS);
      } finally {
        setIsLoading(false);
      }
    }

    loadPersonas();
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const index = SHORTCUTS.indexOf(e.key);
      if (index !== -1 && index < personas.length) {
        selectPersona(personas[index]);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectPersona, personas]);

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

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Generating personalized personas...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {personas.map((persona, index) => (
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
      )}

      <div className="mt-8">
        <button
          onClick={(e) => {
            e.preventDefault();
            handleContinue();
          }}
          type="button"
          disabled={!selectedPersona || isLoading}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
            selectedPersona && !isLoading
              ? 'bg-indigo-600 text-white hover:bg-indigo-500 cursor-pointer'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
          }`}
        >
          {isLoading ? 'Loading...' : 'Start Practicing'}
        </button>
      </div>
    </OnboardingLayout>
  );
}
