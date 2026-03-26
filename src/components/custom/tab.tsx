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

  return (
    <div
      className="h-11 w-fit bg-white rounded-sm py-1 px-1.5 flex items-center gap-x-4"
      role="tablist"
      aria-label={tabKey}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.value;
        return (
          <button
            key={tab.value}
            role="tab"
            aria-selected={isActive}
            onClick={() => handleTabClick(tab.value)}
            className={cn(
              "min-w-26.75 h-full cursor-pointer px-2 rounded bg-transparent font-medium font-mont text-base text-black-01",
              isActive && "bg-pry-01",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
