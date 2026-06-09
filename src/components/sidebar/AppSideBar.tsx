import * as React from "react";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Video,
} from "lucide-react";

import { NavMain } from "@/components/sidebar/NavMain";
import { NavUser } from "@/components/sidebar/NavUser";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { paths } from "@/config/paths";
import { useAuth } from "@/hooks/use-auth";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user: authUser, isAdmin } = useAuth();
  const isUserAdmin = isAdmin();

  const userData = {
    name: authUser?.preferred_username || authUser?.name || "Người dùng",
    email: authUser?.email || "Chưa có email",
  };

  const navItems: React.ComponentProps<typeof NavMain>["items"] = [
    {
      title: "Cuộc họp",
      url: paths.app.meetings.path,
      icon: Video,
    },
  ];

  if (isUserAdmin) {
    navItems.push(
      {
        title: "Dashboard Admin",
        url: paths.admin.root.path,
        icon: LayoutDashboard,
        exactlyMatchPathname: true,
      },
      {
        title: "Quản lý Người dùng",
        url: paths.admin.users.path,
        icon: Users,
      }
    );
  }

  return (
    <Sidebar
      collapsible="icon"
      {...props}
    >
      <SidebarHeader className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="hover:bg-transparent cursor-default">
              <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                {isUserAdmin ? <ShieldCheck className="size-5" /> : <Video className="size-5" />}
              </div>
              <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
                <h2 className="text-lg font-semibold truncate">
                  {isUserAdmin ? "Trang quản trị" : "Meeting App"}
                </h2>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          title="Danh mục"
          items={navItems}
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  );
}
