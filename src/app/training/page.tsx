'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getProfile } from '@/lib/storage';

export default function TrainingPage() {
  const router = useRouter();

  useEffect(() => {
    const profile = getProfile();
    if (profile) {
      // User has completed onboarding, go directly to session
      router.replace('/training/session');
    } else {
      // No profile, start onboarding
      router.replace('/onboarding/goals');
    }
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
      <p className="text-gray-600 dark:text-gray-400">Loading...</p>
    </main>
  );
}
