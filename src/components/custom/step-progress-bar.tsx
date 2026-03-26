const StepProgressBar = ({ totalSteps = 5, currentStep = 1 }) => {
  const clamped = Math.max(1, Math.min(currentStep, totalSteps));

  return (
    <div className="w-full font-mont">
      {/* Track */}
      <div className="flex items-center w-full">
        {Array.from({ length: totalSteps }).map((_, i) => {
          const stepNum = i + 1;
          const isCompleted = stepNum < clamped;
          const isActive = stepNum === clamped;

          return (
            <div key={i} className="flex items-center flex-1">
              {/* Dot */}
              <div
                className={`
                  size-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-200
                  ${isCompleted ? "bg-primary border-2 border-primary" : ""}
                  ${isActive ? "bg-white border-2 border-dashed border-gray-01" : ""}
                  ${!isCompleted && !isActive ? "bg-white border-2 border-dashed border-gray-300" : ""}
                `}
              >
                {isCompleted && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path
                      d="M1 4L3.5 6.5L9 1"
                      stroke="white"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
                {isActive && (
                  <div className="w-2 h-2 rounded-full bg-gray-01" />
                )}
              </div>

              {/* Connector */}
              {i < totalSteps - 1 && (
                <div className="flex-1 mx-1">
                  <svg
                    width="100%"
                    height="2"
                    style={{ display: "block", overflow: "visible" }}
                  >
                    <line
                      x1="0"
                      y1="1"
                      x2="100%"
                      y2="1"
                      stroke={isCompleted ? "#4A659D" : "#D1D5DB"}
                      strokeWidth="2"
                      strokeDasharray="5 4"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Labels */}
      <div className="flex mt-1.5">
        {Array.from({ length: totalSteps }).map((_, i) => {
          const stepNum = i + 1;
          const isCompleted = stepNum < clamped;
          const isActive = stepNum === clamped;
          return (
            <div key={i} className="flex-1">
              <span
                className={`text-[10px] uppercase tracking-widest
                  ${isActive ? "text-gray-01 font-bold" : ""}
                  ${isCompleted ? "text-primary font-semibold" : ""}
                  ${!isActive && !isCompleted ? "text-gray-300" : ""}
                `}
              >
                Step {stepNum}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StepProgressBar;
