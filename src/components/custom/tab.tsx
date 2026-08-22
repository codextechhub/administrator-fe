import { cn } from "@/lib/utils";
import { useSearchParams } from "react-router";

export interface TabOption {
  label: string;
  value: string;
}

interface TabsProps {
  tabKey: string;
  tabs: TabOption[];
}

export default function Tabs({ tabKey, tabs }: TabsProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  const defaultTab = tabs[0]?.value ?? "";
  const activeTab = searchParams.get(tabKey) ?? defaultTab;

  const handleTabClick = (value: string) => {
    setSearchParams((prev: URLSearchParams) => {
      const next = new URLSearchParams(prev);
      next.set(tabKey, value);
      return next;
    });
  };

  const activeIndex = Math.max(
    0,
    tabs.findIndex((tab) => tab.value === activeTab),
  );

  return (
    <div
      // `grid-flow-col auto-cols-fr` gives every tab the same width, which is
      // what lets the highlight below be positioned by index alone.
      className="relative h-11 w-fit grid grid-flow-col auto-cols-fr items-stretch bg-white rounded-full border border-border p-1"
      role="tablist"
      aria-label={tabKey}
    >
      {/* One highlight that slides, rather than a background that switches off
          one button and on another. The eye follows the move and knows which
          tab it came from; an instant swap just changes what is blue. Sliding
          on transform (not on left) keeps it off the layout path, and anyone
          who has asked their system to stop animating gets the instant swap. */}
      <span
        aria-hidden
        className="pointer-events-none absolute top-1 bottom-1 left-1 rounded-full bg-pry-01 transition-transform duration-300 ease-[cubic-bezier(.4,0,.2,1)] motion-reduce:transition-none"
        style={{
          width: `calc((100% - 0.5rem) / ${tabs.length})`,
          transform: `translateX(${activeIndex * 100}%)`,
        }}
      />
      {tabs.map((tab) => {
        const isActive = activeTab === tab.value;
        return (
          <button
            key={tab.value}
            role="tab"
            aria-selected={isActive}
            onClick={() => handleTabClick(tab.value)}
            className={cn(
              "relative z-1 min-w-26.75 cursor-pointer px-4 rounded-full bg-transparent font-medium font-mont text-base whitespace-nowrap transition-colors",
              isActive ? "text-primary" : "text-gray-01 hover:text-black-01",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
