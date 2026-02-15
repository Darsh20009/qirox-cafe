import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coffee, LogOut, ArrowLeft, ShoppingCart, ClipboardList, User, Award, ChefHat, Wallet, Warehouse, Eye, Calendar, FileText, BarChart3, Settings, Lock, Clock, Utensils } from "lucide-react";
import type { Employee } from "@shared/schema";

export default function EmployeeHome() {
  const [, setLocation] = useLocation();
  const [employee, setEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    const storedEmployee = localStorage.getItem("currentEmployee");
    if (storedEmployee) {
      const emp = JSON.parse(storedEmployee);
      setEmployee(emp);
    } else {
      window.location.href = "/employee/gateway";
    }
  }, []);

  const handleLogout = () => {
    // Keep employee session but redirect to gateway for "soft" logout if desired,
    // or just clear if they really want to exit. 
    // The user asked for "data updates automatically not necessarily logout".
    // We will keep the current logout but ensure login is seamless.
    localStorage.removeItem("currentEmployee");
    setLocation("/employee/gateway");
  };

  if (!employee) {
    return null;
  }

  const isManager = employee.role === "manager" || employee.role === "admin";

  const employeeQuickAccess = [
    {
      title: "نقاط البيع",
      description: "نظام الخدمة السريعة",
      icon: ShoppingCart,
      path: "/employee/pos",
      color: "from-green-500 to-green-600",
      testId: "button-pos"
    },
    {
      title: "الطلبات",
      description: "عرض طلبات العملاء",
      icon: ClipboardList,
      path: "/employee/orders",
      color: "from-blue-500 to-blue-600",
      testId: "button-orders"
    },
    {
      title: "الحضور والغياب",
      description: "سجل الحضور",
      icon: Calendar,
      path: "/employee/attendance",
      color: "from-purple-500 to-purple-600",
      testId: "button-attendance"
    },
    {
      title: "طلب إجازة",
      description: "تقديم طلب إجازة",
      icon: FileText,
      path: "/employee/leave-request",
      color: "from-orange-500 to-orange-600",
      testId: "button-leave"
    },
    {
      title: "المطبخ",
      description: "عرض الطلبات المرسلة",
      icon: ChefHat,
      path: "/employee/kitchen",
      color: "from-red-500 to-red-600",
      testId: "button-kitchen"
    },
    {
      title: "الموارد البشرية",
      description: "بيانات الموظفين",
      icon: User,
      path: "/employee/dashboard",
      color: "from-indigo-500 to-indigo-600",
      testId: "button-hr"
    }
  ];

  const managerAccess = [
    {
      title: "إدارة المشروبات",
      description: "إضافة وتعديل المشروبات",
      icon: Coffee,
      path: "/employee/menu-management",
      color: "from-amber-500 to-amber-600",
      testId: "button-menu-mgmt"
    },
    {
      title: "إدارة المأكولات",
      description: "إضافة وتعديل المأكولات",
      icon: Utensils,
      path: "/employee/menu-management?type=food",
      color: "from-orange-500 to-orange-600",
      testId: "button-food-mgmt"
    },
    {
      title: "إدارة المكونات",
      description: "المواد الخام والمخزون",
      icon: Warehouse,
      path: "/employee/ingredients",
      color: "from-cyan-500 to-cyan-600",
      testId: "button-ingredients-mgmt"
    },
    {
      title: "لوحة التحكم",
      description: "الإحصائيات والتقارير",
      icon: BarChart3,
      path: "/employee/dashboard",
      color: "from-teal-500 to-teal-600",
      testId: "button-dashboard"
    },
    {
      title: "الموظفون",
      description: "إدارة فريق العمل",
      icon: Lock,
      path: "/manager/employees",
      color: "from-pink-500 to-pink-600",
      testId: "button-employees"
    },
    {
      title: "الجداول",
      description: "إدارة الحجوزات",
      icon: Eye,
      path: "/employee/tables",
      color: "from-lime-500 to-lime-600",
      testId: "button-tables"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/20">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-700 rounded-full flex items-center justify-center flex-shrink-0">
                <Coffee className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-accent">لوحة التحكم</h1>
                <p className="text-gray-400 text-sm">مرحباً {employee.fullName}</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4 ml-2" />
              تسجيل الخروج
            </Button>
          </div>

          {/* Employee Info */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="bg-[#2d1f1a] border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">الوظيفة</p>
                    <p className="text-white font-bold text-lg">{employee.jobTitle || employee.role}</p>
                  </div>
                  <Badge className="bg-primary/20 text-primary">{employee.role === "manager" ? "مدير" : "موظف"}</Badge>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-[#2d1f1a] border-primary/20">
              <CardContent className="pt-6">
                <div>
                  <p className="text-gray-400 text-sm">الفرع</p>
                  <p className="text-white font-bold text-lg">{employee.branchId || "جميع الفروع"}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-[#2d1f1a] border-primary/20">
              <CardContent className="pt-6">
                <div>
                  <p className="text-gray-400 text-sm">رقم الموظف</p>
                  <p className="text-white font-bold text-lg">{employee.id?.slice(0, 8)}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Employee Quick Access */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-accent mb-6">الوصول السريع</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {employeeQuickAccess.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.path}
                  onClick={() => setLocation(item.path)}
                  className={`bg-gradient-to-br ${item.color} hover:opacity-90 h-auto p-6 text-left justify-start rounded-xl`}
                  data-testid={item.testId}
                >
                  <div className="text-left w-full">
                    <div className="flex items-center gap-3 mb-2">
                      <Icon className="w-5 h-5" />
                      <span className="font-bold text-base">{item.title}</span>
                    </div>
                    <p className="text-white/80 text-xs ml-8">{item.description}</p>
                  </div>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Manager Access */}
        {isManager && (
          <div>
            <h2 className="text-2xl font-bold text-accent mb-6">صلاحيات المدير</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {managerAccess.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.path}
                    onClick={() => setLocation(item.path)}
                    className={`bg-gradient-to-br ${item.color} hover:opacity-90 h-auto p-6 text-left justify-start rounded-xl`}
                    data-testid={item.testId}
                  >
                    <div className="text-left w-full">
                      <div className="flex items-center gap-3 mb-2">
                        <Icon className="w-5 h-5" />
                        <span className="font-bold text-base">{item.title}</span>
                      </div>
                      <p className="text-white/80 text-xs ml-8">{item.description}</p>
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
