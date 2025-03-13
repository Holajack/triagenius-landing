
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { 
  Menu,
  LayoutDashboard, 
  Users, 
  Bot, 
  BarChart3, 
  UserCircle2,
  Gift,
  Brain,
  Award
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

const SideDrawerMenu = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const menuItems = [
    {
      label: "Dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      onClick: () => navigate("/dashboard"),
      active: location.pathname === "/dashboard",
    },
    {
      label: "Community",
      icon: <Users className="h-5 w-5" />,
      onClick: () => navigate("/community"),
      active: location.pathname === "/community" || location.pathname.startsWith("/community/"),
    },
    {
      label: "Bonuses",
      icon: <Gift className="h-5 w-5" />,
      onClick: () => navigate("/bonuses"),
      active: location.pathname === "/bonuses",
    },
    {
      label: "Nora AI",
      icon: <Bot className="h-5 w-5" />,
      onClick: () => navigate("/dashboard"),
      active: false,
    },
    {
      label: "Reports",
      icon: <BarChart3 className="h-5 w-5" />,
      onClick: () => navigate("/reports"),
      active: location.pathname === "/reports",
    },
    {
      label: "Profile",
      icon: <UserCircle2 className="h-5 w-5" />,
      onClick: () => navigate("/profile"),
      active: location.pathname === "/profile",
    },
  ];

  // Mobile drawer menu
  const MobileDrawer = () => (
    <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
      <DrawerTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden absolute top-4 left-4 z-50">
          <Menu className="h-6 w-6" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="h-[85%]">
        <div className="p-4">
          <h2 className="text-xl font-semibold mb-4">Menu</h2>
          <div className="space-y-2">
            {menuItems.map((item) => (
              <DrawerClose asChild key={item.label}>
                <Button
                  variant={item.active ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={item.onClick}
                >
                  {item.icon}
                  <span className="ml-2">{item.label}</span>
                </Button>
              </DrawerClose>
            ))}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );

  // Desktop sidebar
  const DesktopSidebar = () => (
    <SidebarProvider defaultOpen={true} className="hidden md:block">
      <Sidebar className="border-r">
        <SidebarHeader className="border-b py-4">
          <div className="flex items-center px-2">
            <Award className="mr-2 h-6 w-6 text-triage-purple" />
            <span className="text-xl font-bold">Triage System</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton
                  isActive={item.active}
                  onClick={item.onClick}
                  tooltip={item.label}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="border-t p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">© 2023 Triage</span>
            <SidebarTrigger />
          </div>
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  );

  return (
    <>
      <MobileDrawer />
      <DesktopSidebar />
    </>
  );
};

export default SideDrawerMenu;
