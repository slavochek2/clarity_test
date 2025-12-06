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

const SHORTCUTS = ['1', '2', '3', '4', '5'];

// Map goal IDs to topics for AI (English)
const GOAL_TO_TOPIC_MAP: Record<string, string> = {
  'relationships': 'Relationships',
  'mistakes': 'Mistakes',
  'conflicts': 'Conflicts',
  'trust': 'Trust',
  'problem-solving': 'Problem Solving',
};

export default function PersonaPage() {
  const router = useRouter();
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [aiPersonas, setAiPersonas] = useState<AIPersona[]>([]);
  const [personas, setPersonas] = useState<Persona[]>(FALLBACK_PERSONAS);
  const [isLoading, setIsLoading] = useState(true);

  const selectPersona = useCallback((persona: Persona) => {
    console.log('[Persona Page] Persona selected', { personaId: persona.id, personaName: persona.name });
    setSelectedPersona(persona);
  }, []);

  // Load personas from AI API
  const loadPersonas = useCallback(async () => {
    try {
      console.log('[Persona Page] Loading personas from AI API');
      setIsLoading(true);
      setSelectedPersona(null); // Reset selection when regenerating

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

      // Store full AI personas and transform to page personas
      if (data.personas && Array.isArray(data.personas) && data.personas.length > 0) {
        setAiPersonas(data.personas);
        
        const transformedPersonas: Persona[] = data.personas.map((aiPersona: AIPersona) => ({
          id: aiPersona.id,
          name: aiPersona.name,
          description: aiPersona.short_description || aiPersona.why_helpful_to_user || '',
        }));

        console.log('[Persona Page] Transformed personas', transformedPersonas);
        setPersonas(transformedPersonas);
      } else {
        console.warn('[Persona Page] No personas in response, using fallback');
        setAiPersonas([]);
        setPersonas(FALLBACK_PERSONAS);
      }
    } catch (error) {
      console.error('[Persona Page] Error loading personas from AI, using fallback', error);
      setAiPersonas([]);
      setPersonas(FALLBACK_PERSONAS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPersonas();
  }, [loadPersonas]);

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

    // Find full AI persona data
    const fullAIPersona = aiPersonas.find(p => p.id === selectedPersona.id);

    // Retrieve data from previous steps
    const goalsJson = sessionStorage.getItem('onboarding_goals');
    const goals = goalsJson ? JSON.parse(goalsJson) : [];

    const skillLevel = sessionStorage.getItem('onboarding_skillLevel') as UserProfile['skillLevel'] || 'beginner';

    // Save complete profile with full AI persona data
    const profileData = {
      goals,
      skillLevel,
      persona: selectedPersona,
      createdAt: new Date().toISOString(),
    };

    // Store full AI persona data separately for later use
    if (fullAIPersona) {
      sessionStorage.setItem('selected_ai_persona', JSON.stringify(fullAIPersona));
    }

    saveProfile(profileData);

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
        <>
          <div className="space-y-4">
            {aiPersonas.length > 0 ? (
              aiPersonas.map((aiPersona, index) => {
                const persona = personas.find(p => p.id === aiPersona.id);
                return (
                  <div
                    key={aiPersona.id}
                    className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                      selectedPersona?.id === aiPersona.id
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30'
                        : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => persona && selectPersona(persona)}
                  >
                    <div className="flex items-start gap-4">
                      <span
                        className={`w-8 h-8 rounded flex items-center justify-center text-sm font-medium shrink-0 ${
                          selectedPersona?.id === aiPersona.id
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {SHORTCUTS[index]}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3
                            className={`text-lg font-semibold ${
                              selectedPersona?.id === aiPersona.id
                                ? 'text-indigo-900 dark:text-indigo-100'
                                : 'text-gray-900 dark:text-white'
                            }`}
                          >
                            {aiPersona.name}
                          </h3>
                          {selectedPersona?.id === aiPersona.id && (
                            <svg
                              className="w-5 h-5 text-indigo-600"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                        
                        <p
                          className={`text-sm mb-3 ${
                            selectedPersona?.id === aiPersona.id
                              ? 'text-indigo-700 dark:text-indigo-300'
                              : 'text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          {aiPersona.short_description}
                        </p>

                        {aiPersona.topics && aiPersona.topics.length > 0 && (
                          <div className="mb-3">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mr-2">Topics:</span>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {aiPersona.topics.map((topic, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                                >
                                  {topic}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {aiPersona.why_helpful_to_user && (
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                              Why this helps you:
                            </p>
                            <p
                              className={`text-sm ${
                                selectedPersona?.id === aiPersona.id
                                  ? 'text-indigo-600 dark:text-indigo-400'
                                  : 'text-gray-600 dark:text-gray-400'
                              }`}
                            >
                              {aiPersona.why_helpful_to_user}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
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
          </div>

          {aiPersonas.length > 0 && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setAiPersonas([]);
                  setPersonas([]);
                  setSelectedPersona(null);
                  loadPersonas();
                }}
                type="button"
                disabled={isLoading}
                className="w-12 h-12 flex items-center justify-center text-2xl text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 border border-indigo-300 dark:border-indigo-700 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title="Regenerate personas"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  '🔄'
                )}
              </button>
            </div>
          )}
        </>
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
