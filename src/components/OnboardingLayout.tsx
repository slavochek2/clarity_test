'use client';

interface OnboardingLayoutProps {
  children: React.ReactNode;
  currentStep: number;
  totalSteps?: number;
}

export default function OnboardingLayout({
  children,
  currentStep,
  totalSteps = 3,
}: OnboardingLayoutProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-lg">
        {children}

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mt-12">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i + 1 === currentStep
                  ? 'bg-indigo-600'
                  : i + 1 < currentStep
                  ? 'bg-indigo-400'
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
