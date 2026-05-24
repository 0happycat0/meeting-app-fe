import * as React from "react";
import {
  BookOpen,
  LayoutDashboard,
  Users,
  Frame,
  Map,
  PieChart,
  Settings2,
  ShieldCheck,
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
  SidebarRail,
} from "@/components/ui/sidebar";
import { paths } from "@/config/paths";
import { useAuth } from "@/hooks/use-auth";

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: paths.admin.root.path,
      icon: LayoutDashboard,
      exactlyMatchPathname: true
    },
    {
      title: "Users",
      url: paths.admin.users.path,
      icon: Users,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user: authUser, logout } = useAuth();
  const userData = {
    name: authUser?.preferred_username || authUser?.name || "User",
    email: authUser?.email || "No email",
  };

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
                <ShieldCheck className="size-5" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
                <h2 className="text-lg font-semibold truncate">Admin Panel</h2>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          title="Menu"
          items={data.navMain}
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  );
}
