import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { AppSidebar } from "../app-sidebar";
import { svgIcons } from "@/assets/svg";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router";
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

  const branchOptions = [
    { label: "All Branches", value: "all" },
    { label: "Primary - Ikeja", value: "primary-ikeja" },
    { label: "Secondary - Ikeja", value: "secondary-ikeja" },
    { label: "Secondary - Lekki", value: "secondary-lekki" },
  ];
  return (
    <>
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
                placeholder="Switch branch"
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
                  <AvatarFallback>OE</AvatarFallback>
                </Avatar>

                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Osegbo Emeka</span>
                  <span className="text-muted-foreground truncate text-xs">
                    Head Teacher
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
