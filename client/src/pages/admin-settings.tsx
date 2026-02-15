import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Save, Shield, Bell, Palette, Database, Plus, Store, Utensils, Coffee, AlertTriangle, Layout, ShieldAlert, Users, Loader2, Trash2, FolderTree, Flame, Snowflake, Star, Cake, Sparkles, GripVertical, Pencil, CreditCard, Wifi, WifiOff, Eye, EyeOff, ExternalLink, CheckCircle, XCircle, Banknote, Smartphone } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface MenuCategory {
  id: string;
  nameAr: string;
  nameEn?: string;
  icon?: string;
  department: 'drinks' | 'food';
  orderIndex: number;
  isSystem?: boolean;
}

export default function AdminSettings() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { data: config, isLoading } = useQuery<any>({
    queryKey: ["/api/business-config"],
  });

  const { data: menuCategories = [], isLoading: categoriesLoading } = useQuery<MenuCategory[]>({
    queryKey: ["/api/menu-categories"],
  });

  const drinkCategories = menuCategories.filter(c => c.department === 'drinks' || !c.department);
  const foodCategories = menuCategories.filter(c => c.department === 'food');

  // Debug for Admin Category Logic
  console.log('Admin Categories:', {
    total: menuCategories.length,
    drinks: drinkCategories.map(c => c.nameAr),
    food: foodCategories.map(c => c.nameAr)
  });

  const { data: pgConfig, isLoading: pgLoading } = useQuery<any>({
    queryKey: ["/api/payment-gateway/config"],
  });

  const [pgProvider, setPgProvider] = useState<string>('none');
  const [pgCashEnabled, setPgCashEnabled] = useState(true);
  const [pgPosEnabled, setPgPosEnabled] = useState(true);
  const [pgQahwaCardEnabled, setPgQahwaCardEnabled] = useState(true);
  const [pgBankTransferEnabled, setPgBankTransferEnabled] = useState(false);
  const [pgStcPayEnabled, setPgStcPayEnabled] = useState(false);
  const [neoleapClientId, setNeoleapClientId] = useState("");
  const [neoleapClientSecret, setNeoleapClientSecret] = useState("");
  const [neoleapMerchantId, setNeoleapMerchantId] = useState("");
  const [neoleapBaseUrl, setNeoleapBaseUrl] = useState("https://api.neoleap.com.sa");
  const [geideaPublicKey, setGeideaPublicKey] = useState("");
  const [geideaApiPassword, setGeideaApiPassword] = useState("");
  const [geideaBaseUrl, setGeideaBaseUrl] = useState("https://api.merchant.geidea.net");
  const [showSecrets, setShowSecrets] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (pgConfig) {
      setPgProvider(pgConfig.provider || 'none');
      setPgCashEnabled(pgConfig.cashEnabled !== false);
      setPgPosEnabled(pgConfig.posEnabled !== false);
      setPgQahwaCardEnabled(pgConfig.qahwaCardEnabled !== false);
      setPgBankTransferEnabled(pgConfig.bankTransferEnabled || false);
      setPgStcPayEnabled(pgConfig.stcPayEnabled || false);
      if (pgConfig.neoleap) {
        setNeoleapMerchantId(pgConfig.neoleap.merchantId || '');
        setNeoleapBaseUrl(pgConfig.neoleap.baseUrl || 'https://api.neoleap.com.sa');
      }
      if (pgConfig.geidea) {
        setGeideaBaseUrl(pgConfig.geidea.baseUrl || 'https://api.merchant.geidea.net');
      }
    }
  }, [pgConfig]);

  const pgMutation = useMutation({
    mutationFn: async (updates: any) => {
      const res = await apiRequest("PATCH", "/api/payment-gateway/config", updates);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-gateway/config"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payment-methods"] });
      toast({ title: "تم الحفظ", description: "تم حفظ إعدادات الدفع بنجاح" });
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const handleSavePaymentConfig = () => {
    const updates: any = {
      provider: pgProvider,
      cashEnabled: pgCashEnabled,
      posEnabled: pgPosEnabled,
      qahwaCardEnabled: pgQahwaCardEnabled,
      bankTransferEnabled: pgBankTransferEnabled,
      stcPayEnabled: pgStcPayEnabled,
    };

    if (neoleapClientId && !neoleapClientId.startsWith('****')) updates.neoleapClientId = neoleapClientId;
    if (neoleapClientSecret && !neoleapClientSecret.startsWith('****')) updates.neoleapClientSecret = neoleapClientSecret;
    if (neoleapMerchantId) updates.neoleapMerchantId = neoleapMerchantId;
    if (neoleapBaseUrl) updates.neoleapBaseUrl = neoleapBaseUrl;
    if (geideaPublicKey && !geideaPublicKey.startsWith('****')) updates.geideaPublicKey = geideaPublicKey;
    if (geideaApiPassword && !geideaApiPassword.startsWith('****')) updates.geideaApiPassword = geideaApiPassword;
    if (geideaBaseUrl) updates.geideaBaseUrl = geideaBaseUrl;

    pgMutation.mutate(updates);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await apiRequest("POST", "/api/payment-gateway/test", {});
      const data = await res.json();
      setTestResult(data);
    } catch {
      setTestResult({ success: false, message: "فشل في الاتصال" });
    } finally {
      setIsTesting(false);
    }
  };

  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryNameEn, setNewCategoryNameEn] = useState("");
  const [newCategoryDepartment, setNewCategoryDepartment] = useState<'drinks' | 'food'>('drinks');
  const [newCategoryIcon, setNewCategoryIcon] = useState('Coffee');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editDepartment, setEditDepartment] = useState<'drinks' | 'food'>('drinks');

  const mutation = useMutation({
    mutationFn: async (updates: any) => {
      const res = await apiRequest("PATCH", "/api/business-config", updates);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business-config"] });
      toast({
        title: "تم التحديث",
        description: "تم حفظ التغييرات بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data: { nameAr: string; nameEn?: string; icon?: string; department: string }) => {
      return apiRequest("POST", "/api/menu-categories", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/menu-categories"] });
      setIsAddingCategory(false);
      setNewCategoryName("");
      setNewCategoryNameEn("");
      setNewCategoryDepartment('drinks');
      setNewCategoryIcon('Coffee');
      toast({ title: "تم إضافة القسم الفرعي بنجاح" });
    },
    onError: () => {
      toast({ title: "فشل في إضافة القسم", variant: "destructive" });
    }
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return apiRequest("PUT", `/api/menu-categories/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/menu-categories"] });
      setEditingCategoryId(null);
      toast({ title: "تم تحديث القسم بنجاح" });
    },
    onError: () => {
      toast({ title: "فشل في تحديث القسم", variant: "destructive" });
    }
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      return apiRequest("DELETE", `/api/menu-categories/${categoryId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/menu-categories"] });
      toast({ title: "تم حذف القسم بنجاح" });
    },
    onError: () => {
      toast({ title: "فشل في حذف القسم", variant: "destructive" });
    }
  });

  const iconOptions = [
    { value: 'Coffee', label: 'قهوة', Icon: Coffee },
    { value: 'Flame', label: 'ساخن', Icon: Flame },
    { value: 'Snowflake', label: 'بارد', Icon: Snowflake },
    { value: 'Star', label: 'مميز', Icon: Star },
    { value: 'Cake', label: 'حلويات', Icon: Cake },
    { value: 'Utensils', label: 'مأكولات', Icon: Utensils },
    { value: 'Sparkles', label: 'خاص', Icon: Sparkles },
  ];

  const getIconComponent = (iconName: string) => {
    const found = iconOptions.find(i => i.value === iconName);
    return found ? found.Icon : Coffee;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-white dark:bg-background min-h-screen" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold font-ibm-arabic">إدارة الموقع والنظام</h1>
          <p className="text-muted-foreground mt-1 font-ibm-arabic text-sm">تخصيص كامل للهوية، نوع النشاط، وحالة النظام</p>
        </div>
        <div className="bg-accent/10 p-3 rounded-full">
          <Layout className="w-6 h-6 text-accent" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Maintenance Mode */}
        <Card className="hover-elevate border-orange-100 dark:border-orange-900/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                  <ShieldAlert className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">حالة النظام</CardTitle>
                  <CardDescription>تفعيل وضع الصيانة أو التحديث</CardDescription>
                </div>
              </div>
              <Switch
                checked={config?.isMaintenanceMode}
                onCheckedChange={(checked) => mutation.mutate({ isMaintenanceMode: checked })}
                disabled={mutation.isPending}
                className="data-[state=checked]:bg-orange-600"
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <div className="p-3 bg-orange-50 dark:bg-orange-900/10 rounded-lg text-xs text-orange-800 dark:text-orange-300">
              عند التفعيل، سيتم تحويل جميع العملاء تلقائياً لصفحة التوقف المؤقت.
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">رسالة الحالة للعملاء</Label>
              <Select
                value={config?.maintenanceReason || "maintenance"}
                onValueChange={(value) => mutation.mutate({ maintenanceReason: value })}
                disabled={mutation.isPending}
              >
                <SelectTrigger className="font-ibm-arabic">
                  <SelectValue placeholder="اختر السبب" />
                </SelectTrigger>
                <SelectContent className="font-ibm-arabic">
                  <SelectItem value="maintenance">الموقع خارج الخدمة حالياً (صيانة)</SelectItem>
                  <SelectItem value="development">الموقع تحت التطوير حالياً</SelectItem>
                  <SelectItem value="update">جاري تحديث الموقع حالياً</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Business Type */}
        <Card className="hover-elevate border-blue-100 dark:border-blue-900/30">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Store className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">تخصيص النشاط</CardTitle>
                <CardDescription>تحديد نوع النظام والتحكم في الأقسام</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">نوع النشاط التجاري</Label>
              <Select
                value={config?.activityType || "cafe"}
                onValueChange={(value) => mutation.mutate({ activityType: value })}
                disabled={mutation.isPending}
              >
                <SelectTrigger className="font-ibm-arabic">
                  <SelectValue placeholder="اختر نوع النشاط" />
                </SelectTrigger>
                <SelectContent className="font-ibm-arabic">
                  <SelectItem value="cafe">نظام كافيه فقط</SelectItem>
                  <SelectItem value="restaurant">نظام مطعم فقط</SelectItem>
                  <SelectItem value="both">نظام مطعم وكافيه معاً</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-bold text-blue-800 dark:text-blue-300">أقسام النظام المتاحة</Label>
                <div className="flex gap-2">
                  {isAddingSection ? (
                    <div className="flex items-center gap-1 animate-in slide-in-from-left-2">
                      <Input 
                        size={1} 
                        className="h-7 text-xs w-24" 
                        placeholder="اسم القسم..."
                        value={newSectionName}
                        onChange={(e) => setNewSectionName(e.target.value)}
                      />
                      <Button 
                        size="sm" 
                        className="h-7 px-2"
                        onClick={() => {
                          if (newSectionName.trim()) {
                            toast({ title: "تمت الإضافة", description: `تم إضافة قسم ${newSectionName} بنجاح` });
                            setNewSectionName("");
                            setIsAddingSection(false);
                          }
                        }}
                      >حفظ</Button>
                      <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setIsAddingSection(false)}>إلغاء</Button>
                    </div>
                  ) : (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-7 text-xs text-blue-700 hover:bg-blue-100"
                      onClick={() => setIsAddingSection(true)}
                    >
                      <Plus className="w-3 h-3 ml-1" />
                      إضافة قسم
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border">
                  <div className="flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs">إدارة المأكولات</span>
                  </div>
                  <Switch
                    checked={config?.isFoodEnabled}
                    onCheckedChange={(checked) => mutation.mutate({ isFoodEnabled: checked })}
                    disabled={mutation.isPending}
                  />
                </div>
                <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border">
                  <div className="flex items-center gap-2">
                    <Coffee className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs">إدارة المشروبات</span>
                  </div>
                  <Switch
                    checked={config?.isDrinksEnabled}
                    onCheckedChange={(checked) => mutation.mutate({ isDrinksEnabled: checked })}
                    disabled={mutation.isPending}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Menu Categories Management */}
        <Card className="hover-elevate border-teal-100 dark:border-teal-900/30 md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-100 dark:bg-teal-900/20 rounded-lg">
                  <FolderTree className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">إدارة الأقسام الفرعية</CardTitle>
                  <CardDescription>إضافة وتعديل أقسام المنيو وتعيينها لإدارة المشروبات أو المأكولات</CardDescription>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => setIsAddingCategory(true)}
                disabled={isAddingCategory}
                data-testid="button-add-menu-category"
              >
                <Plus className="w-4 h-4 ml-1" />
                إضافة قسم
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            {isAddingCategory && (
              <div className="p-4 bg-teal-50/50 dark:bg-teal-900/10 rounded-lg border border-teal-200 dark:border-teal-800 space-y-3">
                <Label className="text-sm font-bold text-teal-800 dark:text-teal-300">إضافة قسم فرعي جديد</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">اسم القسم (عربي)</Label>
                    <Input
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="مثال: مشروبات خاصة"
                      className="text-right"
                      data-testid="input-new-category-name-ar"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">اسم القسم (إنجليزي) - اختياري</Label>
                    <Input
                      value={newCategoryNameEn}
                      onChange={(e) => setNewCategoryNameEn(e.target.value)}
                      placeholder="e.g. Special Drinks"
                      data-testid="input-new-category-name-en"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">تابع لقسم</Label>
                    <Select
                      value={newCategoryDepartment}
                      onValueChange={(v) => setNewCategoryDepartment(v as 'drinks' | 'food')}
                    >
                      <SelectTrigger data-testid="select-new-category-department">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="drinks">
                          <div className="flex items-center gap-2">
                            <Coffee className="w-4 h-4" />
                            <span>إدارة المشروبات</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="food">
                          <div className="flex items-center gap-2">
                            <Utensils className="w-4 h-4" />
                            <span>إدارة المأكولات</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">الأيقونة</Label>
                    <Select
                      value={newCategoryIcon}
                      onValueChange={setNewCategoryIcon}
                    >
                      <SelectTrigger data-testid="select-new-category-icon">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {iconOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            <div className="flex items-center gap-2">
                              <opt.Icon className="w-4 h-4" />
                              <span>{opt.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2 justify-end pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsAddingCategory(false);
                      setNewCategoryName("");
                      setNewCategoryNameEn("");
                    }}
                    data-testid="button-cancel-add-category"
                  >
                    إلغاء
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      if (newCategoryName.trim()) {
                        createCategoryMutation.mutate({
                          nameAr: newCategoryName.trim(),
                          nameEn: newCategoryNameEn.trim() || undefined,
                          icon: newCategoryIcon,
                          department: newCategoryDepartment,
                        });
                      }
                    }}
                    disabled={!newCategoryName.trim() || createCategoryMutation.isPending}
                    data-testid="button-save-new-category"
                  >
                    {createCategoryMutation.isPending ? "جاري الحفظ..." : "حفظ القسم"}
                  </Button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1">
                  <Coffee className="w-4 h-4 text-teal-600" />
                  <Label className="text-sm font-bold">أقسام إدارة المشروبات</Label>
                  <Badge variant="secondary" className="text-[10px]">{drinkCategories.length}</Badge>
                </div>
                {drinkCategories.length === 0 && (
                  <p className="text-xs text-muted-foreground py-3 text-center">لا توجد أقسام فرعية بعد</p>
                )}
                {drinkCategories.map(cat => {
                  const IconComp = getIconComponent(cat.icon || 'Coffee');
                  return (
                    <div key={cat.id} className="flex items-center justify-between p-2.5 bg-card border rounded-lg group" data-testid={`category-item-${cat.id}`}>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center">
                          <IconComp className="w-4 h-4 text-teal-600" />
                        </div>
                        <div>
                          <span className="text-sm font-medium">{cat.nameAr}</span>
                          {cat.nameEn && <span className="text-xs text-muted-foreground mr-2">({cat.nameEn})</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {editingCategoryId === cat.id ? (
                          <Select
                            value={editDepartment}
                            onValueChange={(v) => {
                              setEditDepartment(v as 'drinks' | 'food');
                              updateCategoryMutation.mutate({ id: cat.id, data: { department: v } });
                            }}
                          >
                            <SelectTrigger className="h-7 text-xs w-32" data-testid={`select-edit-dept-${cat.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="drinks">المشروبات</SelectItem>
                              <SelectItem value="food">المأكولات</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setEditingCategoryId(cat.id);
                              setEditDepartment(cat.department || 'drinks');
                            }}
                            data-testid={`button-edit-category-${cat.id}`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            if (confirm("هل أنت متأكد من حذف هذا القسم؟")) {
                              deleteCategoryMutation.mutate(cat.id);
                            }
                          }}
                          data-testid={`button-delete-category-${cat.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1">
                  <Utensils className="w-4 h-4 text-orange-600" />
                  <Label className="text-sm font-bold">أقسام إدارة المأكولات</Label>
                  <Badge variant="secondary" className="text-[10px]">{foodCategories.length}</Badge>
                </div>
                {foodCategories.length === 0 && (
                  <p className="text-xs text-muted-foreground py-3 text-center">لا توجد أقسام فرعية بعد</p>
                )}
                {foodCategories.map(cat => {
                  const IconComp = getIconComponent(cat.icon || 'Utensils');
                  return (
                    <div key={cat.id} className="flex items-center justify-between p-2.5 bg-card border rounded-lg group" data-testid={`category-item-${cat.id}`}>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
                          <IconComp className="w-4 h-4 text-orange-600" />
                        </div>
                        <div>
                          <span className="text-sm font-medium">{cat.nameAr}</span>
                          {cat.nameEn && <span className="text-xs text-muted-foreground mr-2">({cat.nameEn})</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {editingCategoryId === cat.id ? (
                          <Select
                            value={editDepartment}
                            onValueChange={(v) => {
                              setEditDepartment(v as 'drinks' | 'food');
                              updateCategoryMutation.mutate({ id: cat.id, data: { department: v } });
                            }}
                          >
                            <SelectTrigger className="h-7 text-xs w-32" data-testid={`select-edit-dept-${cat.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="drinks">المشروبات</SelectItem>
                              <SelectItem value="food">المأكولات</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setEditingCategoryId(cat.id);
                              setEditDepartment(cat.department || 'food');
                            }}
                            data-testid={`button-edit-category-${cat.id}`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            if (confirm("هل أنت متأكد من حذف هذا القسم؟")) {
                              deleteCategoryMutation.mutate(cat.id);
                            }
                          }}
                          data-testid={`button-delete-category-${cat.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Gateway Management */}
        <Card className="border-indigo-100 dark:border-indigo-900/30 md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg">
                  <CreditCard className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">إدارة طرق الدفع وبوابة الدفع</CardTitle>
                  <CardDescription>اختر مزود الدفع الإلكتروني وادخل بيانات الاعتماد</CardDescription>
                </div>
              </div>
              {pgConfig && (
                <Badge variant={pgConfig.provider !== 'none' && (pgConfig.neoleap?.configured || pgConfig.geidea?.configured) ? 'default' : 'secondary'}>
                  {pgConfig.provider === 'neoleap' ? 'NeoLeap' : pgConfig.provider === 'geidea' ? 'Geidea' : 'غير مفعّل'}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-2">
            <div className="space-y-3">
              <Label className="text-sm font-bold">مزود الدفع الإلكتروني</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'none', label: 'بدون بوابة', desc: 'كاش فقط', icon: Banknote },
                  { id: 'neoleap', label: 'NeoLeap (نيو ليب)', desc: 'مدى، فيزا، ماستر كارد', icon: CreditCard },
                  { id: 'geidea', label: 'Geidea (جيديا)', desc: 'مدى، فيزا، ماستر كارد', icon: CreditCard },
                ].map((opt) => (
                  <div
                    key={opt.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      pgProvider === opt.id
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
                        : 'border-border hover:border-indigo-300'
                    }`}
                    onClick={() => setPgProvider(opt.id)}
                    data-testid={`payment-provider-${opt.id}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <opt.icon className={`w-4 h-4 ${pgProvider === opt.id ? 'text-indigo-600' : 'text-muted-foreground'}`} />
                      <span className={`text-sm font-bold ${pgProvider === opt.id ? 'text-indigo-700 dark:text-indigo-400' : ''}`}>{opt.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {pgProvider === 'neoleap' && (
              <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900/30 rounded-lg border">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <Label className="text-sm font-bold text-indigo-700 dark:text-indigo-400">إعدادات NeoLeap (نيو ليب)</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open('https://developers.neoleap.com.sa/', '_blank')}
                    data-testid="link-neoleap-portal"
                  >
                    <ExternalLink className="w-3 h-3 ml-1" />
                    بوابة المطورين
                  </Button>
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded border border-blue-200 dark:border-blue-800 text-xs space-y-1">
                  <p className="font-bold text-blue-800 dark:text-blue-300">كيف تحصل على بيانات الاعتماد:</p>
                  <ol className="list-decimal list-inside space-y-0.5 text-blue-700 dark:text-blue-400">
                    <li>سجّل حساب مطور في <span className="font-mono">developers.neoleap.com.sa</span></li>
                    <li>فعّل حسابك عبر البريد الإلكتروني</li>
                    <li>اشترك في الخطة المناسبة وانتظر الموافقة</li>
                    <li>احصل على Client ID و Client Secret من لوحة التحكم</li>
                  </ol>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Client ID</Label>
                    <div className="relative">
                      <Input
                        type={showSecrets ? 'text' : 'password'}
                        value={neoleapClientId}
                        onChange={(e) => setNeoleapClientId(e.target.value)}
                        placeholder={pgConfig?.neoleap?.configured ? pgConfig.neoleap.clientId : 'أدخل Client ID'}
                        className="text-xs font-mono"
                        data-testid="input-neoleap-client-id"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Client Secret</Label>
                    <Input
                      type={showSecrets ? 'text' : 'password'}
                      value={neoleapClientSecret}
                      onChange={(e) => setNeoleapClientSecret(e.target.value)}
                      placeholder="أدخل Client Secret"
                      className="text-xs font-mono"
                      data-testid="input-neoleap-client-secret"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Merchant ID (اختياري)</Label>
                    <Input
                      value={neoleapMerchantId}
                      onChange={(e) => setNeoleapMerchantId(e.target.value)}
                      placeholder="معرّف التاجر"
                      className="text-xs font-mono"
                      data-testid="input-neoleap-merchant-id"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Base URL</Label>
                    <Input
                      value={neoleapBaseUrl}
                      onChange={(e) => setNeoleapBaseUrl(e.target.value)}
                      className="text-xs font-mono"
                      data-testid="input-neoleap-base-url"
                    />
                  </div>
                </div>

                {pgConfig?.neoleap?.configured && (
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle className="w-3 h-3" />
                    <span>بيانات الاعتماد محفوظة</span>
                  </div>
                )}
              </div>
            )}

            {pgProvider === 'geidea' && (
              <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900/30 rounded-lg border">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <Label className="text-sm font-bold text-indigo-700 dark:text-indigo-400">إعدادات Geidea (جيديا)</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open('https://docs.geidea.net/docs/overview', '_blank')}
                    data-testid="link-geidea-docs"
                  >
                    <ExternalLink className="w-3 h-3 ml-1" />
                    وثائق جيديا
                  </Button>
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded border border-blue-200 dark:border-blue-800 text-xs space-y-1">
                  <p className="font-bold text-blue-800 dark:text-blue-300">كيف تحصل على بيانات الاعتماد:</p>
                  <ol className="list-decimal list-inside space-y-0.5 text-blue-700 dark:text-blue-400">
                    <li>سجّل الدخول في بوابة التاجر من جيديا</li>
                    <li>اذهب إلى Payment Gateway ثم Gateway Settings</li>
                    <li>انسخ Public Key و API Password</li>
                    <li>أو تواصل مع <span className="font-mono">support@geidea.net</span></li>
                  </ol>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Public Key (المفتاح العام)</Label>
                    <Input
                      type={showSecrets ? 'text' : 'password'}
                      value={geideaPublicKey}
                      onChange={(e) => setGeideaPublicKey(e.target.value)}
                      placeholder={pgConfig?.geidea?.configured ? pgConfig.geidea.publicKey : 'أدخل المفتاح العام'}
                      className="text-xs font-mono"
                      data-testid="input-geidea-public-key"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">API Password (كلمة مرور API)</Label>
                    <Input
                      type={showSecrets ? 'text' : 'password'}
                      value={geideaApiPassword}
                      onChange={(e) => setGeideaApiPassword(e.target.value)}
                      placeholder="أدخل كلمة مرور API"
                      className="text-xs font-mono"
                      data-testid="input-geidea-api-password"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs">Base URL</Label>
                    <Input
                      value={geideaBaseUrl}
                      onChange={(e) => setGeideaBaseUrl(e.target.value)}
                      className="text-xs font-mono"
                      data-testid="input-geidea-base-url"
                    />
                  </div>
                </div>

                {pgConfig?.geidea?.configured && (
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle className="w-3 h-3" />
                    <span>بيانات الاعتماد محفوظة</span>
                  </div>
                )}
              </div>
            )}

            {pgProvider !== 'none' && (
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSecrets(!showSecrets)}
                >
                  {showSecrets ? <EyeOff className="w-3 h-3 ml-1" /> : <Eye className="w-3 h-3 ml-1" />}
                  {showSecrets ? 'إخفاء البيانات' : 'إظهار البيانات'}
                </Button>
              </div>
            )}

            <div className="space-y-3 p-4 bg-muted/30 rounded-lg border">
              <Label className="text-sm font-bold">طرق الدفع المتاحة للعملاء</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { key: 'cashEnabled', label: 'الدفع نقداً (كاش)', icon: Banknote, value: pgCashEnabled, setter: setPgCashEnabled },
                  { key: 'posEnabled', label: 'جهاز نقاط البيع (POS)', icon: Smartphone, value: pgPosEnabled, setter: setPgPosEnabled },
                  { key: 'qahwaCardEnabled', label: 'بطاقة كلوني كافيه', icon: CreditCard, value: pgQahwaCardEnabled, setter: setPgQahwaCardEnabled },
                  { key: 'stcPayEnabled', label: 'STC Pay', icon: Smartphone, value: pgStcPayEnabled, setter: setPgStcPayEnabled },
                  { key: 'bankTransferEnabled', label: 'تحويل بنكي', icon: CreditCard, value: pgBankTransferEnabled, setter: setPgBankTransferEnabled },
                ].map((method) => (
                  <div key={method.key} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border">
                    <div className="flex items-center gap-2">
                      <method.icon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs">{method.label}</span>
                    </div>
                    <Switch
                      checked={method.value}
                      onCheckedChange={method.setter}
                      disabled={pgMutation.isPending}
                    />
                  </div>
                ))}
              </div>
              {pgProvider !== 'none' && (
                <p className="text-[10px] text-muted-foreground">
                  البطاقة البنكية و Apple Pay ستظهر تلقائياً عند تفعيل بوابة {pgProvider === 'neoleap' ? 'نيو ليب' : 'جيديا'} وإدخال البيانات
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 flex-wrap pt-2">
              <Button
                onClick={handleSavePaymentConfig}
                disabled={pgMutation.isPending}
                data-testid="button-save-payment-config"
              >
                {pgMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : <Save className="w-4 h-4 ml-1" />}
                حفظ إعدادات الدفع
              </Button>
              {pgProvider !== 'none' && (
                <Button
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  data-testid="button-test-payment-connection"
                >
                  {isTesting ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : <Wifi className="w-4 h-4 ml-1" />}
                  اختبار الاتصال
                </Button>
              )}
              {testResult && (
                <div className={`flex items-center gap-1 text-xs ${testResult.success ? 'text-green-600' : 'text-destructive'}`}>
                  {testResult.success ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Branding & Visual Identity */}
        <Card className="hover-elevate border-purple-100 dark:border-purple-900/30">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Palette className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">الهوية البصرية</CardTitle>
                <CardDescription>التحكم في الألوان والاسم والشعار</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">اسم المنشأة التجاري (عربي)</Label>
              <Input
                value={config?.tradeNameAr || ""}
                onChange={(e) => mutation.mutate({ tradeNameAr: e.target.value })}
                placeholder="مثال: كلاوني كافيه"
                className="font-ibm-arabic"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">اللون الأساسي (أزرار/تفاعل)</Label>
                <div className="flex gap-2">
                  <Input type="color" className="w-10 h-10 p-1 rounded cursor-pointer" value="#8B5A2B" disabled />
                  <Input value="#8B5A2B" className="text-xs font-mono" disabled />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">لون الخلفية (الرئيسي)</Label>
                <div className="flex gap-2">
                  <Input type="color" className="w-10 h-10 p-1 rounded cursor-pointer" value="#F7F8F8" disabled />
                  <Input value="#F7F8F8" className="text-xs font-mono" disabled />
                </div>
              </div>
            </div>
            <div className="pt-2">
              <Button variant="outline" className="w-full text-xs gap-2">
                <Palette className="w-3 h-3" />
                تخصيص شكل الباركود (QR)
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* User Management Quick Links */}
        <Card className="hover-elevate border-green-100 dark:border-green-900/30">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">إدارة المستخدمين</CardTitle>
                <CardDescription>التحكم في الموظفين والعملاء</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <div className="flex flex-col gap-3">
              <Button 
                variant="outline" 
                className="justify-between group hover:border-accent font-ibm-arabic"
                onClick={() => navigate('/manager/employees')}
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground group-hover:text-accent" />
                  <span>إدارة طاقم العمل والموظفين</span>
                </div>
                <div className="px-2 py-1 bg-green-50 text-green-700 text-[10px] rounded-full">نشط</div>
              </Button>
              <Button variant="outline" className="justify-start gap-2 group hover:border-accent font-ibm-arabic">
                <Users className="w-4 h-4 text-muted-foreground group-hover:text-accent" />
                <span>إدارة قاعدة بيانات العملاء والولاء</span>
              </Button>
              <Button 
                variant="ghost" 
                className="text-xs text-muted-foreground hover:text-accent font-ibm-arabic"
                onClick={() => navigate('/admin/branches')}
              >
                انتقال إلى إدارة الفروع والتراخيص →
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer Info */}
      <div className="text-center pt-10 text-muted-foreground text-xs font-ibm-arabic">
        <p>نظام كلاوني - جميع التغييرات يتم تطبيقها فوراً على واجهة العميل</p>
        {mutation.isPending && <p className="text-accent animate-pulse mt-2">جاري حفظ التعديلات...</p>}
      </div>
    </div>
  );
}
