import * as React from "react";
import {
  LayoutDashboard,
  Users,
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
      title: "Người dùng",
      url: paths.admin.users.path,
      icon: Users,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user: authUser } = useAuth();
  const userData = {
    name: authUser?.preferred_username || authUser?.name || "Người dùng",
    email: authUser?.email || "Chưa có email",
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
                <h2 className="text-lg font-semibold truncate">Trang quản trị</h2>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          title="Danh mục"
          items={data.navMain}
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  );
}
