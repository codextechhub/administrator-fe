"use client";

import { ChevronRight } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
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
