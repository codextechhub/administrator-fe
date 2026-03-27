"use client";
import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { HomeIcon, LogoutIcon, TeamMgtIcon } from "@/assets/navbar-svg";
import { NavMain } from "./nav-main";
import { routesPath } from "@/routes/routesPath";
import { useLocation, useNavigate } from "react-router";
import PromptModal from "./modal/prompt-modal";
import useToggleModal from "@/hooks/use-toggle";
import { BookOpen, DollarSign, Settings } from "lucide-react";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation().pathname;
  const navigate = useNavigate();
  const handleLogout = () => {
    navigate(routesPath.AUTH.LOGIN, { replace: true });
  };

  const { isOpen: openLogout, toggleClick: toggleLogout } =
    useToggleModal(false); // logout modal

  const data = {
    overview: [
      {
        title: "Dashboard",
        url: routesPath.PROTECTED.OVERVIEW.INDEX,
        icon: HomeIcon,
        isActive: location.startsWith(routesPath.PROTECTED.OVERVIEW.INDEX),
        childActive: false,
        items: [
          //   {
          //     title: "Schedule Payment",
          //     url: "#",
          //     isActive: false,
          //   },
        ],
      },
      {
        title: "Branches",
        url: routesPath.PROTECTED.BRANCHES.INDEX,
        icon: TeamMgtIcon,
        isActive: location.startsWith(routesPath.PROTECTED.BRANCHES.INDEX),
        childActive: false,
      },
    ],
    people: [
      {
        title: "Students",
        url: routesPath.PROTECTED.STUDENTS.INDEX,
        icon: TeamMgtIcon,
        isActive: location.startsWith(routesPath.PROTECTED.STUDENTS.INDEX),
        childActive: false,
      },
      {
        title: "Teachers",
        url: routesPath.PROTECTED.TEACHERS.INDEX,
        icon: TeamMgtIcon,
        isActive: location.startsWith(routesPath.PROTECTED.TEACHERS.INDEX),
        childActive: false,
      },
      {
        title: "Administrators",
        url: routesPath.PROTECTED.ADMINISTRATORS.INDEX,
        icon: TeamMgtIcon,
        isActive: location.startsWith(
          routesPath.PROTECTED.ADMINISTRATORS.INDEX,
        ),
        childActive: false,
      },
    ],
    academics: [
      {
        title: "Academic Management",
        url: "#",
        icon: BookOpen,
        isActive: location.includes(routesPath.PROTECTED.ACADEMIC.INDEX),
        childActive: location.includes(routesPath.PROTECTED.ACADEMIC.INDEX),
        items: [
          {
            title: "Academic Session",
            url: routesPath.PROTECTED.ACADEMIC.SESSION,
            isActive: location.includes(routesPath.PROTECTED.ACADEMIC.SESSION),
          },
          {
            title: "Academic Calender",
            url: routesPath.PROTECTED.ACADEMIC.CALENDER,
            isActive: location.includes(routesPath.PROTECTED.ACADEMIC.CALENDER),
          },
        ],
      },
      {
        title: "Classes",
        url: routesPath.PROTECTED.CLASSES.INDEX,
        icon: TeamMgtIcon,
        isActive: location.startsWith(routesPath.PROTECTED.CLASSES.INDEX),
        childActive: false,
      },
    ],
    finance: [
      {
        title: "Finance",
        url: "#",
        icon: DollarSign,
        isActive: location.startsWith("#"),
        childActive: false,
      },
      {
        title: "Settings",
        url: "#",
        icon: Settings,
        isActive: location.startsWith("#"),
        childActive: false,
      },
    ],
  };
  const { state } = useSidebar();
  const schoolName = "Caleb International College";
  return (
    <>
      <Sidebar className="bg-white" collapsible="icon" {...props}>
        <SidebarHeader className="bg-white border-b">
          <SidebarMenu>
            <SidebarMenuItem className="mt-2">
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-transparent cursor-pointer mx-auto justify-center overflow-hidden"
                tooltip={schoolName}
              >
                {/* <div className={cn("size-fit ")}>{svgIcons.logo}</div> */}
                <div className={cn("size-fit ")}>
                  <img
                    src="/image/caleb.jpeg"
                    // src="/svg/icon.svg"
                    alt="school logo"
                    className="size-7.5"
                  />
                </div>
                {state !== "collapsed" && (
                  <div className="max-w-45">
                    <h4 className="text-sm font-semibold text-gray-01 font-mont truncate">
                      {schoolName}
                    </h4>
                    <p className="text-xs text-gray-06 truncate">
                      School Admin
                    </p>
                  </div>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent className="bg-white pt-3">
          <NavMain items={data.overview} groupTitle="Overview" />
          <NavMain items={data.people} groupTitle="People" />
          <NavMain items={data.academics} groupTitle="Academics" />
          <NavMain items={data.finance} groupTitle="Finance" />
        </SidebarContent>
        <SidebarFooter className="bg-white ">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                className="h-10 mx-auto mb-10 text-destructive hover:bg-destructive/5 hover:text-destructive"
                tooltip="Logout"
                onClick={toggleLogout}
              >
                <LogoutIcon />
                <span>Logout</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <PromptModal
        isOpen={openLogout}
        onClose={toggleLogout}
        onConfirm={handleLogout}
        title="Log Out?"
        description="Are you sure you want to log out of your account?"
        containerClass="min-h-[320px] lg:w-[390px]"
        srcClass="size-25"
        src="/image/caution.png"
        onConfirmText="Log Out"
        canCancel
        loading={false}
        onConfirmClass="bg-error-01 text-white shadow-xs hover:bg-error-01/90 focus-visible:ring-error-01/20"
      />
    </>
  );
}
