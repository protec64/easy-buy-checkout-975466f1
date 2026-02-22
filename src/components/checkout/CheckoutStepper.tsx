import { Check } from "lucide-react";

interface CheckoutStepperProps {
  currentStep: number;
  steps: string[];
}

const CheckoutStepper = ({ currentStep, steps }: CheckoutStepperProps) => {
  return (
    <div className="flex items-center justify-center gap-0 mb-6">
      {steps.map((label, index) => {
        const stepNum = index + 1;
        const isCompleted = currentStep > stepNum;
        const isCurrent = currentStep === stepNum;

        return (
          <div key={label} className="flex items-center">
            {index > 0 && (
              <div
                className={`h-0.5 w-8 sm:w-12 mx-1 transition-colors duration-300 ${
                  isCompleted ? "bg-primary" : "bg-border"
                }`}
              />
            )}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300 ${
                  isCompleted
                    ? "bg-primary text-primary-foreground"
                    : isCurrent
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : stepNum}
              </div>
              <span
                className={`text-[11px] font-medium whitespace-nowrap ${
                  isCurrent ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CheckoutStepper;
