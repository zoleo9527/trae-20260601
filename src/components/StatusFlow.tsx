interface Step {
  key: string;
  label: string;
  active: boolean;
  done: boolean;
}

interface Props {
  steps: Step[];
}

export default function StatusFlow({ steps }: Props) {
  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => (
        <div key={step.key} className="flex items-center flex-1">
          <div className="flex flex-col items-center flex-1">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                step.done
                  ? 'bg-green-500 text-white'
                  : step.active
                  ? 'bg-beer-500 text-white ring-4 ring-beer-100'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {step.done ? '✓' : index + 1}
            </div>
            <span
              className={`text-xs mt-2 text-center ${
                step.active ? 'text-beer-700 font-medium' : step.done ? 'text-gray-700' : 'text-gray-400'
              }`}
            >
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={`flex-1 h-1 mx-2 rounded ${
                step.done && steps[index + 1].active ? 'bg-beer-300' : step.done ? 'bg-green-400' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
