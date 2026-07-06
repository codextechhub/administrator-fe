import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { AppSidebar } from "../app-sidebar";
import { svgIcons } from "@/assets/svg";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router";
import { useSessionTimeout } from "@/hooks/use-session-timeout";
import { useTokenRefresh } from "@/hooks/use-token-refresh";
import { SessionTimeoutModal } from "@/components/session-timeout-modal";
import { useAppSelector } from "@/redux/store";
import { selectUser } from "@/redux/features/auth/auth-slice";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "../ui/combobox";

export default function DashboardLayout({
  children,
  hasBack = false,
  onBack,
  title,
}: {
  children: React.ReactNode;
  hasBack?: boolean;
  title?: string;
  onBack?: () => void;
}) {
  const navigate = useNavigate();

  useTokenRefresh();
  const { open, secondsLeft, isExpired, onContinue, onLogout, goToLogin } =
    useSessionTimeout();

  const user = useAppSelector(selectUser);
  const fullName =
    user?.full_name ||
    [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim();
  const roleLabel = humanizeRole(user?.user_type || user?.role);
  const avatarFallback = initials(fullName);
  const selectedBranch = user?.branch_name;

  const branchOptions = [
    { label: "All Branches", value: "all" },
    { label: "Primary - Ikeja", value: "primary-ikeja" },
    { label: "Secondary - Ikeja", value: "secondary-ikeja" },
    { label: "Secondary - Lekki", value: "secondary-lekki" },
  ];
  return (
    <>
      <SessionTimeoutModal
        open={open}
        secondsLeft={secondsLeft}
        isExpired={isExpired}
        onContinue={onContinue}
        onLogout={onLogout}
        goToLogin={goToLogin}
      />
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="bg-white-05">
          <header className="flex justify-between h-15 px-3 lg:px-10 shrink-0 sticky top-0 z-10 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 bg-white border border-l-0 border-white-02">
            <div className="inline-flex items-center gap-2">
              {hasBack && (
                <>
                  <figure
                    onClick={() => {
                      onBack ? onBack() : navigate(-1);
                    }}
                    className="uppercase font-light text-gray-01 text-sm inline-flex items-center cursor-pointer"
                  >
                    <ChevronLeft className="text-inherit size-5 mr-1" />
                    Back
                  </figure>
                  <Separator
                    orientation="vertical"
                    className="rotate-10 w-[1.2px] bg-black-01 data-[orientation=vertical]:h-7"
                  />
                </>
              )}

              <h6 className="text-base uppercase font-semibold text-black-01">
                {title || "Welcome back!!"}
              </h6>
            </div>

            <Combobox items={branchOptions}>
              <ComboboxInput
                showTrigger={false}
                placeholder={selectedBranch || "Switch branch"}
                className="border-primary ring-0!"
              />
              <ComboboxContent>
                <ComboboxEmpty>No items found.</ComboboxEmpty>
                <ComboboxList>
                  {(framework) => (
                    <ComboboxItem key={framework.value} value={framework}>
                      {framework.label}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>

            <div className="gap-x-3 inline-flex items-center">
              <button
                type="button"
                className="size-8.5 rounded-full relative bg-gray-04 grid place-content-center"
              >
                {svgIcons.notificationBell}
              </button>

              <Separator
                orientation="vertical"
                className=" data-[orientation=vertical]:h-7"
              />

              <figure className="inline-flex items-center gap-x-3 pl-2.5 py-1 ">
                <Avatar>
                  <AvatarImage src={"/image/avatar2.png"} />
                  <AvatarFallback>{avatarFallback}</AvatarFallback>
                </Avatar>

                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{fullName}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {roleLabel}
                  </span>
                </div>
              </figure>
            </div>
          </header>
          <div className="flex flex-1 flex-col pt-0">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}

// Turn a backend role token ("SCHOOL_ADMIN", "branch_admin") into a display
// label ("School Admin"). Empty string when nothing is set.
function humanizeRole(value?: string | null): string {
  if (!value) return "";
  return value
    .replace(/[_-]+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Derive up to two uppercase initials from a full name for the avatar fallback.
function initials(name?: string | null): string {
  if (!name) return "";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
  return (first + last).toUpperCase();
}
