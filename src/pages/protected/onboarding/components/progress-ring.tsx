/**
 * The onboarding percentage, drawn as a ring.
 *
 * It is derived - done over total - and nothing more. There is no readiness
 * score behind it: the platform counts steps, and a number out of 100 that
 * looked like a grade would be inventing an authority the backend does not have.
 */
export function ProgressRing({
  value,
  size = 96,
  stroke = 8,
}: {
  /** 0-100. */
  value: number;
  size?: number;
  stroke?: number;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${clamped}% of your onboarding steps are done`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-gray-03"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="stroke-primary transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <div className="absolute inset-0 grid place-content-center text-center">
        <span className="text-xl font-semibold font-mont text-black-01 leading-none">
          {clamped}%
        </span>
        <span className="text-[10px] uppercase tracking-widest text-gray-05">
          Ready
        </span>
      </div>
    </div>
  );
}
