import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Coffee, LogOut, ShoppingBag, CreditCard, Gift, Download, Loader2, User, Mail, Phone, Pencil, Save, X } from "lucide-react";
import { useCustomer } from "@/contexts/CustomerContext";
import { customerStorage, type CustomerProfile, type LocalOrder } from "@/lib/customer-storage";
import { useToast } from "@/hooks/use-toast";
import QRCode from "qrcode";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLoyaltyCard } from "@/hooks/useLoyaltyCard";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function CustomerProfilePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { customer, logout } = useCustomer();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [cardQrUrl, setCardQrUrl] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");

  const { card: loyaltyCard, isLoading: isLoadingCard } = useLoyaltyCard();

  const { data: serverOrders = [], isLoading: isLoadingOrders } = useQuery<any[]>({
    queryKey: ["/api/orders/customer", customer?.phone],
    enabled: !!customer?.phone,
    queryFn: async () => {
      const res = await fetch(`/api/orders/customer/${customer?.phone}`);
      if (!res.ok) return [];
      return res.json();
    }
  });

  useEffect(() => {
    const loadedProfile = customerStorage.getProfile();
    if (!loadedProfile && !customer) {
      setLocation("/auth");
      return;
    }
    setProfile(loadedProfile);
    
    // Generate QR code for loyalty card
    if (loyaltyCard?.qrToken) {
      QRCode.toDataURL(loyaltyCard.qrToken, {
        width: 200,
        margin: 2,
        color: { dark: '#2D9B6E', light: '#FFFFFF' }
      }).then(setCardQrUrl).catch(console.error);
    }
  }, [setLocation, customer, loyaltyCard]);

  const handleLogout = () => {
    logout();
    toast({
      title: "تم تسجيل الخروج",
      description: "نراك قريباً!"
    });
    setLocation("/auth");
  };

  const handleDownloadCard = () => {
    if (!cardQrUrl) return;

    const link = document.createElement('a');
    link.download = `qahwa-card-${profile?.cardNumber}.png`;
    link.href = cardQrUrl;
    link.click();

    toast({
      title: "تم التنزيل",
      description: "تم تنزيل بطاقتك بنجاح"
    });
  };

  const startEditing = () => {
    setEditName(customer?.name || "");
    setEditEmail(customer?.email || "");
    setEditPhone(customer?.phone || "");
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditName("");
    setEditEmail("");
    setEditPhone("");
  };

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { name: string; email: string }) => {
      const customerId = customer?.id;
      if (!customerId) throw new Error("No customer ID");
      return await apiRequest("PATCH", `/api/customers/${customerId}`, data);
    },
    onSuccess: () => {
      toast({
        title: "تم الحفظ",
        description: "تم تحديث بياناتك بنجاح"
      });
      setIsEditing(false);
      if (profile) {
        const updatedProfile = { ...profile, name: editName };
        setProfile(updatedProfile);
        customerStorage.updateProfile({ name: editName });
      }
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء تحديث البيانات"
      });
    }
  });

  const handleSaveProfile = () => {
    if (!editName.trim()) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "الاسم مطلوب"
      });
      return;
    }
    updateProfileMutation.mutate({ name: editName, email: editEmail });
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const nextFreeDrinkProgress = ((profile.stamps || 0) / 5) * 100;

  // Combine local and server orders, avoiding duplicates by orderNumber
  const localOrders = customerStorage.getOrders();
  const allOrders = [...serverOrders];
  
  localOrders.forEach(local => {
    if (!allOrders.find(s => s.orderNumber === local.orderNumber)) {
      allOrders.push(local);
    }
  });

  // Sort by date descending
  allOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-20" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center gap-2">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Coffee className="w-6 h-6" />
              CLUNY CAFE
            </h1>
          </div>
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="text-white hover:text-white hover:bg-white/20"
            data-testid="button-logout"
          >
            <LogOut className="ml-2 w-4 h-4" />
            تسجيل خروج
          </Button>
        </div>
      </div>

      <div className="container mx-auto p-4 max-w-4xl">
        {/* Profile Card */}
        <Card className="mb-6 bg-white border-border shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-foreground flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                {isEditing ? "تعديل البيانات" : `مرحباً، ${profile.name}`}
              </CardTitle>
              {!isEditing && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={startEditing}
                  className="text-primary hover:text-primary hover:bg-primary/10"
                  data-testid="button-edit-profile"
                >
                  <Pencil className="w-4 h-4 ml-1" />
                  تعديل
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name" className="flex items-center gap-2 text-muted-foreground">
                    <User className="w-4 h-4" />
                    الاسم
                  </Label>
                  <Input
                    id="edit-name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="أدخل اسمك"
                    data-testid="input-edit-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email" className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    البريد الإلكتروني
                  </Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="example@email.com"
                    dir="ltr"
                    data-testid="input-edit-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone" className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    رقم الجوال
                  </Label>
                  <Input
                    id="edit-phone"
                    value={editPhone}
                    disabled
                    className="bg-muted"
                    dir="ltr"
                    data-testid="input-edit-phone"
                  />
                  <p className="text-xs text-muted-foreground">لا يمكن تغيير رقم الجوال</p>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={updateProfileMutation.isPending}
                    className="flex-1 bg-primary hover:bg-primary/90"
                    data-testid="button-save-profile"
                  >
                    {updateProfileMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin ml-2" />
                    ) : (
                      <Save className="w-4 h-4 ml-2" />
                    )}
                    حفظ التغييرات
                  </Button>
                  <Button
                    onClick={cancelEditing}
                    variant="outline"
                    className="border-border"
                    data-testid="button-cancel-edit"
                  >
                    <X className="w-4 h-4 ml-1" />
                    إلغاء
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground" dir="ltr">{profile.phone}</span>
                </div>
                {customer?.email && (
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground" dir="ltr">{customer.email}</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-secondary border border-border gap-1">
            <TabsTrigger value="orders" className="data-[state=active]:bg-primary data-[state=active]:text-white" data-testid="tab-orders">
              <ShoppingBag className="ml-2 w-4 h-4" />
              طلباتي
            </TabsTrigger>
            <TabsTrigger value="card" className="data-[state=active]:bg-primary data-[state=active]:text-white" data-testid="tab-card">
              <CreditCard className="ml-2 w-4 h-4" />
              بطاقاتي
            </TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders" className="mt-4 space-y-4">
            {isLoadingOrders ? (
              <div className="flex justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : allOrders.length === 0 ? (
              <Card className="bg-white border-border shadow-sm">
                <CardContent className="p-8 text-center text-muted-foreground">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>لا توجد طلبات سابقة</p>
                </CardContent>
              </Card>
            ) : (
              allOrders.map((order) => (
                <Card key={order.id || order.orderNumber} className="bg-white border-border shadow-sm" data-testid={`order-${order.orderNumber}`}>
                  <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                    <div>
                      <CardTitle className="text-lg text-foreground">
                        طلب #{order.orderNumber}
                      </CardTitle>
                      <CardDescription className="text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString('ar-SA', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge className="bg-primary text-white">
                        {order.totalAmount} ر.س
                      </Badge>
                      {order.status && (
                        <Badge variant="outline" className="text-[10px] py-0 h-5 border-border text-muted-foreground">
                          {order.status === 'completed' ? 'مكتمل' : 
                           order.status === 'pending' ? 'قيد الانتظار' :
                           order.status === 'preparing' ? 'جاري التحضير' : order.status}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {(Array.isArray(order.items) ? order.items : []).map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-sm text-foreground">
                          <span>{item.nameAr || item.coffeeItem?.nameAr || 'منتج'} × {item.quantity}</span>
                          <span className="text-muted-foreground">{(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)} ر.س</span>
                        </div>
                      ))}
                      {order.usedFreeDrink && (
                        <Badge variant="outline" className="border-green-500 text-green-600 mt-2">
                          <Gift className="ml-1 w-3 h-3" />
                          استخدمت مشروب مجاني
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Card Tab */}
          <TabsContent value="card" className="mt-4">
            <div className="bg-gradient-to-br from-primary to-primary/80 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden mb-8" data-testid="card-loyalty-main">
              {/* Background patterns */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12 blur-xl" />
              
              <div className="relative z-10 space-y-6">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                      <Coffee className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold font-ibm-plex-arabic">بطاقة الولاء</h3>
                      <p className="text-xs text-white/70 font-ibm-arabic">CLUNY CAFE REWARDS</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30">
                    <span className="text-sm font-medium">
                      {loyaltyCard?.tier === 'platinum' ? 'بلاتيني' : 
                       loyaltyCard?.tier === 'gold' ? 'ذهبي' : 
                       loyaltyCard?.tier === 'silver' ? 'فضي' : 'برونزي'}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-end mt-8">
                  <div className="space-y-1">
                    <p className="text-xs text-white/70 font-ibm-plex-arabic">النقاط الحالية</p>
                    <p className="text-4xl font-bold font-ibm-plex-arabic leading-none">
                      {loyaltyCard?.points || 0}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-white/70 font-ibm-plex-arabic">قيمة المكافأة</p>
                    <p className="text-2xl font-bold font-ibm-plex-arabic leading-none">
                      {((loyaltyCard?.points || 0) / 100 * 5).toFixed(2)} <span className="text-sm">ر.س</span>
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/20">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-white/60 font-mono tracking-widest">
                      {loyaltyCard?.cardNumber || '---- ---- ---- ----'}
                    </span>
                    <div className="w-10 h-6 bg-white/10 rounded-md flex items-center justify-center">
                      <div className="w-6 h-4 bg-white/20 rounded-sm" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* QR Code Section */}
            {cardQrUrl && (
              <div className="mt-6 flex flex-col items-center">
                <div className="bg-white p-3 rounded-2xl shadow-lg border border-border">
                  <img src={cardQrUrl} alt="QR Code" className="w-32 h-32" />
                </div>
                <p className="text-xs text-muted-foreground mt-2 font-ibm-plex-arabic">امسح الكود للحصول على نقاطك</p>
              </div>
            )}

            {/* Loyalty Stats Below Card - New Points System */}
            <div className="mt-8 space-y-4">
              <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800" data-testid="card-points-info">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-500/10 rounded-lg">
                        <Gift className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold font-ibm-plex-arabic text-amber-800 dark:text-amber-200">نظام النقاط</p>
                        <p className="text-xs text-amber-600 dark:text-amber-400 font-ibm-plex-arabic">10 نقاط لكل مشروب • 100 نقطة = 5 ريال</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={handleDownloadCard}
                  className="bg-accent hover:bg-accent/90 text-white shadow-lg font-ibm-plex-arabic"
                  data-testid="button-download-card"
                >
                  <Download className="ml-2 w-4 h-4" />
                  تحميل البطاقة
                </Button>
                <Button
                  onClick={() => setLocation("/my-offers")}
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary/10 font-ibm-plex-arabic"
                  data-testid="button-my-offers"
                >
                  <Gift className="ml-2 w-4 h-4" />
                  عروضي الخاصة
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <Button
          onClick={() => setLocation("/menu")}
          variant="outline"
          className="w-full mt-6 border-primary text-primary hover:bg-primary/10"
          data-testid="button-back-menu"
        >
          العودة للقائمة 
        </Button>
      </div>
    </div>
  );
}
