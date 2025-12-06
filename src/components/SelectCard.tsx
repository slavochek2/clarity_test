'use client';

interface SelectCardProps {
  label: string;
  shortcut: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export default function SelectCard({
  label,
  shortcut,
  selected,
  onClick,
  disabled = false,
}: SelectCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full p-4 rounded-lg border-2 text-left transition-all flex items-center gap-4 ${
        selected
          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30'
          : disabled
          ? 'border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed'
          : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-gray-50 dark:hover:bg-gray-800'
      }`}
    >
      <span
        className={`w-8 h-8 rounded flex items-center justify-center text-sm font-medium shrink-0 ${
          selected
            ? 'bg-indigo-600 text-white'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
        }`}
      >
        {shortcut}
      </span>
      <span
        className={`text-base ${
          selected
            ? 'text-indigo-900 dark:text-indigo-100 font-medium'
            : 'text-gray-700 dark:text-gray-300'
        }`}
      >
        {label}
      </span>
      {selected && (
        <svg
          className="w-5 h-5 text-indigo-600 ml-auto shrink-0"
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
    </button>
  );
}
