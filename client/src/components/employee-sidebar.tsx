import { useLocation } from 'wouter';
import { LayoutDashboard, ShoppingCart, ClipboardList, Settings, LogOut, User, BarChart3, Warehouse, Wallet, ChefHat, Table, Eye, Coffee, Utensils } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Employee } from '@shared/schema';
import QiroxLogo from "@assets/QIROX_LOGO_1771194264304.png";

interface EmployeeSidebarProps {
  employee: Employee | null;
  onLogout: () => void;
}

export function EmployeeSidebar({ employee, onLogout }: EmployeeSidebarProps) {
  const [location, navigate] = useLocation();

  const baseMenuItems = [
    { label: 'لوحة التحكم', icon: LayoutDashboard, path: '/employee/dashboard' },
    { label: 'الكاشير', icon: ShoppingCart, path: '/employee/cashier' },
    { label: 'نقاط البيع', icon: BarChart3, path: '/employee/pos' },
    { label: 'الطلبات', icon: ClipboardList, path: '/employee/orders' },
    { label: 'المطبخ', icon: ChefHat, path: '/employee/kitchen' },
    { label: 'الطاولات', icon: Table, path: '/employee/table-orders' },
  ];

  const managerMenuItems = [
    { label: 'إدارة النظام', icon: Settings, path: '/admin/settings' },
    { label: 'إدارة الموظفين', icon: User, path: '/admin/employees' },
    { label: 'التقارير', icon: BarChart3, path: '/admin/reports' },
    { label: 'المحاسبة', icon: Wallet, path: '/manager/accounting' },
    { label: 'المخزون', icon: Warehouse, path: '/manager/inventory' },
  ];

  const showManagerItems = ['manager', 'owner', 'admin'].includes(employee?.role || '');
  const isBothModes = true; // For development/control, will be derived from config in future if needed

  const menuManagementItems = showManagerItems ? [
    { label: 'إدارة المشروبات', icon: Coffee, path: '/employee/menu-management' },
    ...(isBothModes ? [{ label: 'إدارة المأكولات', icon: Utensils, path: '/employee/menu-management?type=food' }] : []),
  ] : [];

  const menuItems = [
    ...baseMenuItems,
    ...(showManagerItems ? managerMenuItems : []),
    ...menuManagementItems,
  ];

  return (
    <div className="hidden lg:flex w-64 bg-background border-l border-border flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3 mb-2">
          <img 
            src={QiroxLogo} 
            alt="QIROX SYSTEMS" 
            className="w-10 h-10 object-contain"
          />
          <div>
            <h2 className="text-lg font-bold text-foreground">QIROX SYSTEMS</h2>
            <p className="text-xs text-muted-foreground">نظام الموظفين</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">الموظف: {employee?.fullName || 'جاري التحميل...'}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const fullPath = location + window.location.search;
          const isActive = item.path.includes('?')
            ? fullPath === item.path
            : location === item.path && !window.location.search;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-foreground hover:bg-primary/10'
              }`}
              data-testid={`sidebar-link-${item.label}`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}

        {showManagerItems && (
          <>
            <div className="my-4 border-t border-border pt-4">
              <p className="px-4 text-xs font-bold text-[#B58B5A] uppercase">القائمة الإدارية</p>
            </div>
            {managerMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-foreground hover:bg-primary/10'
                  }`}
                  data-testid={`sidebar-link-${item.label}`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </>
        )}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-border space-y-2">
        <Button
          onClick={onLogout}
          variant="outline"
          className="w-full justify-start text-sm border-border text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          data-testid="button-logout-sidebar"
        >
          <LogOut className="w-4 h-4 ml-2" />
          تسجيل الخروج
        </Button>
      </div>
    </div>
  );
}
