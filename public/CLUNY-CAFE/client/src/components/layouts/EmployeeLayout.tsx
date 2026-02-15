import { ReactNode, useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { 
  Home, 
  ShoppingBag, 
  Users, 
  Coffee, 
  LogOut,
  ChefHat,
  CreditCard,
  TableIcon,
  ArrowRight,
  ClipboardList,
  SplitSquareVertical,
  Utensils
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

interface Employee {
  id: string;
  nameAr: string;
  role: string;
  branchId?: string;
}

interface EmployeeLayoutProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  backPath?: string;
}

export function EmployeeLayout({ 
  children, 
  title,
  showBack = false,
  backPath = "/employee/dashboard"
}: EmployeeLayoutProps) {
  const [location, setLocation] = useLocation();
  const [employee, setEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    const storedEmployee = localStorage.getItem("currentEmployee");
    if (storedEmployee) {
      setEmployee(JSON.parse(storedEmployee));
    }
  }, []);

  const [isSplitView, setIsSplitView] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("currentEmployee");
    setLocation("/employee/gateway");
  };

  const navItems = [
    { path: "/employee/dashboard", icon: Home, label: "الرئيسية", roles: ["all"] },
    { path: "/employee/cashier", icon: ShoppingBag, label: "الكاشير", roles: ["all"] },
    { path: "/employee/orders", icon: ClipboardList, label: "الطلبات", roles: ["all"] },
    { path: "/employee/pos", icon: CreditCard, label: "نقطة البيع", roles: ["cashier", "manager", "admin"] },
    { path: "/employee/kitchen", icon: ChefHat, label: "المطبخ", roles: ["barista", "manager", "admin"] },
    { path: "/employee/table-orders", icon: TableIcon, label: "الطاولات", roles: ["all"] },
    { path: "/employee/menu-management", icon: Coffee, label: "المشروبات", roles: ["manager", "admin"] },
    { path: "/employee/menu-management?type=food", icon: Utensils, label: "المأكولات", roles: ["manager", "admin"] },
    { path: "/employee/loyalty", icon: Users, label: "الولاء", roles: ["all"] },
  ];

  const filteredNavItems = navItems.filter(item => 
    item.roles.includes("all") || (employee?.role && item.roles.includes(employee.role))
  );

  const roleLabels: Record<string, string> = {
    admin: "مدير النظام",
    manager: "مدير",
    cashier: "كاشير",
    barista: "باريستا",
    driver: "سائق",
  };

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full" dir="rtl">
        <Sidebar side="right" collapsible="icon">
          <SidebarHeader className="border-b p-4">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback className="bg-[#9FB2B3] text-white">
                  {employee?.nameAr?.charAt(0) || "م"}
                </AvatarFallback>
              </Avatar>
              <div className="group-data-[collapsible=icon]:hidden">
                <p className="font-medium text-sm text-[#1F2D2E]">{employee?.nameAr || "موظف"}</p>
                <Badge className="bg-[#B58B5A] hover:bg-[#B58B5A]/90 text-white text-xs border-none">
                  {roleLabels[employee?.role || ""] || employee?.role}
                </Badge>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {filteredNavItems.map((item) => {
                    const fullPath = location + window.location.search;
                    const isActive = item.path.includes('?')
                      ? fullPath === item.path
                      : location === item.path && !window.location.search;
                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton 
                          asChild 
                          isActive={isActive}
                          data-testid={`nav-${item.path.split('/').pop()}`}
                        >
                          <Link href={item.path}>
                            <item.icon className="h-5 w-5" />
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t p-2">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={handleLogout}
                  className="text-destructive"
                  data-testid="button-logout"
                >
                  <LogOut className="h-5 w-5" />
                  <span>تسجيل الخروج</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <div className="flex flex-col flex-1 min-w-0">
          <header className="sticky top-0 z-50 flex h-14 items-center justify-between gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSplitView(!isSplitView)}
                className="hidden lg:flex gap-2"
                data-testid="button-toggle-split"
              >
                <SplitSquareVertical className="h-4 w-4" />
                {isSplitView ? "عرض كامل" : "شاشة مقسمة"}
              </Button>
              {showBack ? (
                <Button 
                  asChild 
                  variant="ghost" 
                  size="icon" 
                  data-testid="button-back"
                >
                  <Link href={backPath}>
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
              ) : (
                <SidebarTrigger data-testid="button-sidebar-toggle" />
              )}
              {title && <h1 className="text-lg font-semibold">{title}</h1>}
            </div>
            {employee && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground hidden sm:block">
                  {employee.nameAr}
                </span>
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {employee.nameAr?.charAt(0) || "م"}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}
          </header>

          <main className="flex-1 overflow-hidden">
            {isSplitView ? (
              <div className="flex h-full w-full divide-x divide-x-reverse">
                <div className="w-1/2 overflow-auto">
                  {children}
                </div>
                <div className="w-1/2 overflow-auto bg-muted/30">
                  <div className="p-4">
                    <iframe 
                      src="/employee/orders" 
                      className="w-full h-[calc(100vh-8rem)] border-none rounded-lg shadow-sm bg-background"
                      title="Order Management"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full overflow-auto">
                {children}
              </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
