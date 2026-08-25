"use client";

import { ChevronRight } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Link } from "react-router";

export function NavMain({
  items,
  groupTitle,
}: {
  items: {
    title: string;
    url: string;
    icon?: React.ElementType;
    isActive: boolean;
    childActive: boolean;
    items?: {
      title: string;
      url: string;
      isActive: boolean;
    }[];
  }[];
  groupTitle?: string;
}) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <SidebarGroup className="py-0">
      {groupTitle && (
        <SidebarGroupLabel className="text-xs uppercase mt-2">
          {groupTitle}
        </SidebarGroupLabel>
      )}
      <SidebarMenu className="space-y-1">
        {items.map((item, idx) => {
          if ((item?.items?.length ?? 0) < 1) {
            return (
              <SidebarMenuItem key={idx}>
                <Link to={item.url}>
                  <SidebarMenuButton
                    className="h-9 mx-auto"
                    tooltip={item.title}
                    isActive={item.isActive}
                  >
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            );
          }
          // Collapsed to icons, the inline accordion is hidden by the rail's
          // own CSS - so pressing a parent did nothing at all and its children
          // could not be reached without expanding the sidebar first. A rail
          // that hides where you can go is worse than no rail. Same answer as
          // console-fe: a menu to the right, opened from the icon.
          if (isCollapsed) {
            return (
              <SidebarMenuItem key={idx}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton
                      className="mx-auto h-9"
                      tooltip={item.title}
                      isActive={item.isActive || item.childActive}
                    >
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    side="right"
                    align="start"
                    className="min-w-48"
                  >
                    {/* The parent names itself, because the icon that opened
                        this is no longer visible once the menu covers it. */}
                    <DropdownMenuLabel className="text-xs font-normal text-gray-01">
                      {item.title}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {item.items?.map((subItem) => (
                      <DropdownMenuItem key={subItem.title} asChild>
                        <Link
                          to={subItem.url}
                          className={cn(
                            subItem.isActive && "font-medium text-primary",
                          )}
                        >
                          {subItem.title}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            );
          }

          return (
            <Collapsible
              key={idx}
              asChild
              defaultOpen={item.childActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    className="mx-auto h-9"
                    tooltip={item.title}
                    isActive={item.isActive}
                  >
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub className="ml-6">
                    {item.items?.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <Link to={subItem.url}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={subItem.isActive}
                            className="text-xs"
                          >
                            <span>{subItem.title}</span>
                          </SidebarMenuSubButton>
                        </Link>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
