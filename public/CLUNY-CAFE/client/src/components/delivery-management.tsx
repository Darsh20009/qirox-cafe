import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Truck, MapPin, Users, Plus, Settings, 
  Link2, Phone, Mail, Car, Bike, Clock,
  DollarSign, Globe, Key, Trash2, Edit,
  CheckCircle, XCircle, RefreshCw
} from "lucide-react";

const DELIVERY_PROVIDERS = [
  { id: 'noon_food', nameAr: 'نون فود', nameEn: 'Noon Food', logo: '🟡' },
  { id: 'hunger_station', nameAr: 'هنقرستيشن', nameEn: 'Hunger Station', logo: '🟠' },
  { id: 'keeta', nameAr: 'كيتا', nameEn: 'Keeta', logo: '🟢' },
  { id: 'jahez', nameAr: 'جاهز', nameEn: 'Jahez', logo: '🔴' },
  { id: 'toyou', nameAr: 'تو يو', nameEn: 'ToYou', logo: '🔵' },
  { id: 'mrsool', nameAr: 'مرسول', nameEn: 'Mrsool', logo: '🟣' },
  { id: 'careem', nameAr: 'كريم', nameEn: 'Careem', logo: '🟤' },
  { id: 'custom', nameAr: 'مخصص', nameEn: 'Custom', logo: '⚙️' },
];

const VEHICLE_TYPES = [
  { id: 'motorcycle', nameAr: 'دراجة نارية', icon: Bike },
  { id: 'car', nameAr: 'سيارة', icon: Car },
  { id: 'bicycle', nameAr: 'دراجة هوائية', icon: Bike },
  { id: 'scooter', nameAr: 'سكوتر', icon: Bike },
];

export function DeliveryManagement() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("integrations");
  const [isIntegrationDialogOpen, setIsIntegrationDialogOpen] = useState(false);
  const [isDriverDialogOpen, setIsDriverDialogOpen] = useState(false);
  const [isZoneDialogOpen, setIsZoneDialogOpen] = useState(false);
  
  const [newIntegration, setNewIntegration] = useState({
    providerName: '',
    providerNameAr: '',
    apiKey: '',
    apiSecret: '',
    merchantId: '',
    webhookUrl: '',
    baseUrl: '',
    isActive: 0,
    isTestMode: 1,
    commissionPercent: 0,
    fixedFee: 0,
  });

  const [newDriver, setNewDriver] = useState({
    fullName: '',
    phone: '',
    email: '',
    vehicleType: 'motorcycle',
    vehiclePlate: '',
    vehicleModel: '',
    shiftStart: '08:00',
    shiftEnd: '22:00',
    maxConcurrentOrders: 3,
  });

  const [newZone, setNewZone] = useState({
    nameAr: '',
    nameEn: '',
    branchId: '',
    zoneType: 'radius',
    centerLat: 24.7136,
    centerLng: 46.6753,
    radiusKm: 5,
    baseFee: 10,
    feePerKm: 2,
    minOrderAmount: 0,
    freeDeliveryThreshold: 100,
    estimatedMinMinutes: 20,
    estimatedMaxMinutes: 45,
    isActive: 1,
  });

  const { data: integrationsData, isLoading: loadingIntegrations } = useQuery({
    queryKey: ['/api/delivery/integrations'],
  });

  const { data: driversData, isLoading: loadingDrivers } = useQuery({
    queryKey: ['/api/delivery/drivers'],
  });

  const { data: zonesData, isLoading: loadingZones } = useQuery({
    queryKey: ['/api/delivery/zones'],
  });

  const { data: branchesData } = useQuery({
    queryKey: ['/api/branches'],
  });

  const createIntegrationMutation = useMutation({
    mutationFn: async (data: typeof newIntegration) => {
      return apiRequest('POST', '/api/delivery/integrations', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/delivery/integrations'] });
      setIsIntegrationDialogOpen(false);
      setNewIntegration({ providerName: '', providerNameAr: '', apiKey: '', apiSecret: '', merchantId: '', webhookUrl: '', baseUrl: '', isActive: 0, isTestMode: 1, commissionPercent: 0, fixedFee: 0 });
      toast({ title: "تم بنجاح", description: "تمت إضافة شركة التوصيل" });
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل في إضافة شركة التوصيل", variant: "destructive" });
    },
  });

  const createDriverMutation = useMutation({
    mutationFn: async (data: typeof newDriver) => {
      return apiRequest('POST', '/api/delivery/drivers', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/delivery/drivers'] });
      setIsDriverDialogOpen(false);
      setNewDriver({ fullName: '', phone: '', email: '', vehicleType: 'motorcycle', vehiclePlate: '', vehicleModel: '', shiftStart: '08:00', shiftEnd: '22:00', maxConcurrentOrders: 3 });
      toast({ title: "تم بنجاح", description: "تمت إضافة المندوب" });
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل في إضافة المندوب", variant: "destructive" });
    },
  });

  const createZoneMutation = useMutation({
    mutationFn: async (data: typeof newZone) => {
      return apiRequest('POST', '/api/delivery/zones', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/delivery/zones'] });
      setIsZoneDialogOpen(false);
      toast({ title: "تم بنجاح", description: "تمت إضافة منطقة التوصيل" });
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل في إضافة منطقة التوصيل", variant: "destructive" });
    },
  });

  const toggleIntegrationMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: number }) => {
      return apiRequest('PATCH', `/api/delivery/integrations/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/delivery/integrations'] });
      toast({ title: "تم التحديث", description: "تم تغيير حالة الربط" });
    },
  });

  const toggleDriverStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest('PATCH', `/api/delivery/drivers/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/delivery/drivers'] });
      toast({ title: "تم التحديث", description: "تم تغيير حالة المندوب" });
    },
  });

  const integrations = integrationsData?.integrations || [];
  const drivers = driversData?.drivers || [];
  const zones = zonesData?.zones || [];
  const branches = branchesData || [];

  return (
    <div className="p-4 sm:p-6 space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
            <Truck className="w-8 h-8 text-primary" />
            إدارة التوصيل
          </h1>
          <p className="text-muted-foreground mt-1">إدارة شركات التوصيل والمناديب ومناطق التغطية</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Link2 className="w-4 h-4" />
            <span className="hidden sm:inline">شركات التوصيل</span>
            <span className="sm:hidden">الشركات</span>
          </TabsTrigger>
          <TabsTrigger value="drivers" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">المناديب</span>
            <span className="sm:hidden">المناديب</span>
          </TabsTrigger>
          <TabsTrigger value="zones" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span className="hidden sm:inline">مناطق التوصيل</span>
            <span className="sm:hidden">المناطق</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">ربط شركات التوصيل الخارجية</h2>
            <Dialog open={isIntegrationDialogOpen} onOpenChange={setIsIntegrationDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2" data-testid="button-add-integration">
                  <Plus className="w-4 h-4" />
                  إضافة شركة
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
                <DialogHeader>
                  <DialogTitle>إضافة شركة توصيل جديدة</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>شركة التوصيل</Label>
                    <Select value={newIntegration.providerName} onValueChange={(value) => {
                      const provider = DELIVERY_PROVIDERS.find(p => p.id === value);
                      setNewIntegration(prev => ({ ...prev, providerName: value, providerNameAr: provider?.nameAr || '' }));
                    }}>
                      <SelectTrigger data-testid="select-provider">
                        <SelectValue placeholder="اختر شركة التوصيل" />
                      </SelectTrigger>
                      <SelectContent>
                        {DELIVERY_PROVIDERS.map(provider => (
                          <SelectItem key={provider.id} value={provider.id}>
                            <span className="flex items-center gap-2">
                              <span>{provider.logo}</span>
                              <span>{provider.nameAr}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>API Key</Label>
                      <Input 
                        type="password"
                        value={newIntegration.apiKey}
                        onChange={(e) => setNewIntegration(prev => ({ ...prev, apiKey: e.target.value }))}
                        placeholder="أدخل مفتاح API"
                        data-testid="input-api-key"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>API Secret</Label>
                      <Input 
                        type="password"
                        value={newIntegration.apiSecret}
                        onChange={(e) => setNewIntegration(prev => ({ ...prev, apiSecret: e.target.value }))}
                        placeholder="أدخل السر"
                        data-testid="input-api-secret"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>معرف التاجر (Merchant ID)</Label>
                    <Input 
                      value={newIntegration.merchantId}
                      onChange={(e) => setNewIntegration(prev => ({ ...prev, merchantId: e.target.value }))}
                      placeholder="معرف التاجر من الشركة"
                      data-testid="input-merchant-id"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Webhook URL</Label>
                    <Input 
                      value={newIntegration.webhookUrl}
                      onChange={(e) => setNewIntegration(prev => ({ ...prev, webhookUrl: e.target.value }))}
                      placeholder="https://your-domain.com/api/webhooks/delivery"
                      dir="ltr"
                      data-testid="input-webhook-url"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>نسبة العمولة %</Label>
                      <Input 
                        type="number"
                        value={newIntegration.commissionPercent}
                        onChange={(e) => setNewIntegration(prev => ({ ...prev, commissionPercent: parseFloat(e.target.value) || 0 }))}
                        data-testid="input-commission"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>رسوم ثابتة (ر.س)</Label>
                      <Input 
                        type="number"
                        value={newIntegration.fixedFee}
                        onChange={(e) => setNewIntegration(prev => ({ ...prev, fixedFee: parseFloat(e.target.value) || 0 }))}
                        data-testid="input-fixed-fee"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={newIntegration.isTestMode === 1}
                        onCheckedChange={(checked) => setNewIntegration(prev => ({ ...prev, isTestMode: checked ? 1 : 0 }))}
                        data-testid="switch-test-mode"
                      />
                      <Label>وضع الاختبار</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={newIntegration.isActive === 1}
                        onCheckedChange={(checked) => setNewIntegration(prev => ({ ...prev, isActive: checked ? 1 : 0 }))}
                        data-testid="switch-active"
                      />
                      <Label>مفعّل</Label>
                    </div>
                  </div>

                  <Button 
                    className="w-full" 
                    onClick={() => createIntegrationMutation.mutate(newIntegration)}
                    disabled={!newIntegration.providerName || createIntegrationMutation.isPending}
                    data-testid="button-save-integration"
                  >
                    {createIntegrationMutation.isPending ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {loadingIntegrations ? (
            <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
          ) : integrations.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Link2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">لم يتم ربط أي شركة توصيل</h3>
                <p className="text-muted-foreground mb-4">أضف شركات التوصيل الخارجية لتلقي الطلبات منها</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {integrations.map((integration: any) => {
                const provider = DELIVERY_PROVIDERS.find(p => p.id === integration.providerName);
                return (
                  <Card key={integration.id} className={`relative ${integration.isActive ? 'border-green-500/50' : 'border-muted'}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{provider?.logo || '📦'}</span>
                          <div>
                            <CardTitle className="text-lg">{integration.providerNameAr || provider?.nameAr}</CardTitle>
                            <CardDescription>{provider?.nameEn}</CardDescription>
                          </div>
                        </div>
                        <Badge variant={integration.isActive ? "default" : "secondary"}>
                          {integration.isActive ? 'مفعّل' : 'معطّل'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">وضع الاختبار:</span>
                        <Badge variant={integration.isTestMode ? "outline" : "default"}>
                          {integration.isTestMode ? 'تجريبي' : 'إنتاج'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">العمولة:</span>
                        <span>{integration.commissionPercent}% + {integration.fixedFee} ر.س</span>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => toggleIntegrationMutation.mutate({ id: integration.id, isActive: integration.isActive ? 0 : 1 })}
                          data-testid={`button-toggle-${integration.id}`}
                        >
                          {integration.isActive ? <XCircle className="w-4 h-4 ml-1" /> : <CheckCircle className="w-4 h-4 ml-1" />}
                          {integration.isActive ? 'إيقاف' : 'تفعيل'}
                        </Button>
                        <Button variant="outline" size="sm" data-testid={`button-edit-${integration.id}`}>
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="drivers" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">مناديب التوصيل الداخلي</h2>
            <Dialog open={isDriverDialogOpen} onOpenChange={setIsDriverDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2" data-testid="button-add-driver">
                  <Plus className="w-4 h-4" />
                  إضافة مندوب
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg" dir="rtl">
                <DialogHeader>
                  <DialogTitle>إضافة مندوب جديد</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>الاسم الكامل</Label>
                    <Input 
                      value={newDriver.fullName}
                      onChange={(e) => setNewDriver(prev => ({ ...prev, fullName: e.target.value }))}
                      placeholder="أدخل اسم المندوب"
                      data-testid="input-driver-name"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>رقم الجوال</Label>
                      <Input 
                        value={newDriver.phone}
                        onChange={(e) => setNewDriver(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="05xxxxxxxx"
                        dir="ltr"
                        data-testid="input-driver-phone"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>البريد الإلكتروني</Label>
                      <Input 
                        type="email"
                        value={newDriver.email}
                        onChange={(e) => setNewDriver(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="email@example.com"
                        dir="ltr"
                        data-testid="input-driver-email"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>نوع المركبة</Label>
                    <Select value={newDriver.vehicleType} onValueChange={(value) => setNewDriver(prev => ({ ...prev, vehicleType: value }))}>
                      <SelectTrigger data-testid="select-vehicle-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {VEHICLE_TYPES.map(vehicle => (
                          <SelectItem key={vehicle.id} value={vehicle.id}>
                            {vehicle.nameAr}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>رقم اللوحة</Label>
                      <Input 
                        value={newDriver.vehiclePlate}
                        onChange={(e) => setNewDriver(prev => ({ ...prev, vehiclePlate: e.target.value }))}
                        placeholder="ABC 1234"
                        dir="ltr"
                        data-testid="input-vehicle-plate"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>موديل المركبة</Label>
                      <Input 
                        value={newDriver.vehicleModel}
                        onChange={(e) => setNewDriver(prev => ({ ...prev, vehicleModel: e.target.value }))}
                        placeholder="Honda PCX 2023"
                        data-testid="input-vehicle-model"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>بداية الوردية</Label>
                      <Input 
                        type="time"
                        value={newDriver.shiftStart}
                        onChange={(e) => setNewDriver(prev => ({ ...prev, shiftStart: e.target.value }))}
                        data-testid="input-shift-start"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>نهاية الوردية</Label>
                      <Input 
                        type="time"
                        value={newDriver.shiftEnd}
                        onChange={(e) => setNewDriver(prev => ({ ...prev, shiftEnd: e.target.value }))}
                        data-testid="input-shift-end"
                      />
                    </div>
                  </div>

                  <Button 
                    className="w-full" 
                    onClick={() => createDriverMutation.mutate(newDriver)}
                    disabled={!newDriver.fullName || !newDriver.phone || createDriverMutation.isPending}
                    data-testid="button-save-driver"
                  >
                    {createDriverMutation.isPending ? 'جاري الحفظ...' : 'إضافة المندوب'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {loadingDrivers ? (
            <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
          ) : drivers.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">لا يوجد مناديب</h3>
                <p className="text-muted-foreground mb-4">أضف مناديب التوصيل الداخلي لتوصيل الطلبات</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {drivers.map((driver: any) => {
                const vehicle = VEHICLE_TYPES.find(v => v.id === driver.vehicleType);
                const VehicleIcon = vehicle?.icon || Car;
                const statusColors: Record<string, string> = {
                  available: 'bg-green-500',
                  busy: 'bg-yellow-500',
                  offline: 'bg-gray-400',
                  on_break: 'bg-blue-500',
                };
                const statusLabels: Record<string, string> = {
                  available: 'متاح',
                  busy: 'مشغول',
                  offline: 'غير متصل',
                  on_break: 'في استراحة',
                };

                return (
                  <Card key={driver.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <VehicleIcon className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{driver.fullName}</CardTitle>
                            <CardDescription className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {driver.phone}
                            </CardDescription>
                          </div>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${statusColors[driver.status] || 'bg-gray-400'}`} title={statusLabels[driver.status]} />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">المركبة:</span>
                        <span>{vehicle?.nameAr} - {driver.vehiclePlate || 'غير محدد'}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">التقييم:</span>
                        <span>⭐ {driver.rating?.toFixed(1) || '5.0'} ({driver.ratingCount || 0})</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">الطلبات:</span>
                        <span>{driver.totalDeliveries || 0} طلب</span>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Select 
                          value={driver.status} 
                          onValueChange={(value) => toggleDriverStatusMutation.mutate({ id: driver.id, status: value })}
                        >
                          <SelectTrigger className="flex-1" data-testid={`select-driver-status-${driver.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="available">متاح</SelectItem>
                            <SelectItem value="busy">مشغول</SelectItem>
                            <SelectItem value="on_break">استراحة</SelectItem>
                            <SelectItem value="offline">غير متصل</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="outline" size="icon" data-testid={`button-edit-driver-${driver.id}`}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="zones" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">مناطق التوصيل والأسعار</h2>
            <Dialog open={isZoneDialogOpen} onOpenChange={setIsZoneDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2" data-testid="button-add-zone">
                  <Plus className="w-4 h-4" />
                  إضافة منطقة
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
                <DialogHeader>
                  <DialogTitle>إضافة منطقة توصيل جديدة</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>اسم المنطقة (عربي)</Label>
                      <Input 
                        value={newZone.nameAr}
                        onChange={(e) => setNewZone(prev => ({ ...prev, nameAr: e.target.value }))}
                        placeholder="مثال: شمال الرياض"
                        data-testid="input-zone-name-ar"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>اسم المنطقة (إنجليزي)</Label>
                      <Input 
                        value={newZone.nameEn}
                        onChange={(e) => setNewZone(prev => ({ ...prev, nameEn: e.target.value }))}
                        placeholder="e.g. North Riyadh"
                        dir="ltr"
                        data-testid="input-zone-name-en"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>الفرع</Label>
                    <Select value={newZone.branchId} onValueChange={(value) => setNewZone(prev => ({ ...prev, branchId: value }))}>
                      <SelectTrigger data-testid="select-zone-branch">
                        <SelectValue placeholder="اختر الفرع" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((branch: any) => (
                          <SelectItem key={branch.id} value={branch.id}>
                            {branch.nameAr}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>خط العرض (Lat)</Label>
                      <Input 
                        type="number"
                        step="0.0001"
                        value={newZone.centerLat}
                        onChange={(e) => setNewZone(prev => ({ ...prev, centerLat: parseFloat(e.target.value) || 0 }))}
                        dir="ltr"
                        data-testid="input-zone-lat"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>خط الطول (Lng)</Label>
                      <Input 
                        type="number"
                        step="0.0001"
                        value={newZone.centerLng}
                        onChange={(e) => setNewZone(prev => ({ ...prev, centerLng: parseFloat(e.target.value) || 0 }))}
                        dir="ltr"
                        data-testid="input-zone-lng"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>نطاق التغطية (كم)</Label>
                    <Input 
                      type="number"
                      value={newZone.radiusKm}
                      onChange={(e) => setNewZone(prev => ({ ...prev, radiusKm: parseFloat(e.target.value) || 0 }))}
                      data-testid="input-zone-radius"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>الرسوم الأساسية (ر.س)</Label>
                      <Input 
                        type="number"
                        value={newZone.baseFee}
                        onChange={(e) => setNewZone(prev => ({ ...prev, baseFee: parseFloat(e.target.value) || 0 }))}
                        data-testid="input-zone-base-fee"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>الرسوم لكل كم (ر.س)</Label>
                      <Input 
                        type="number"
                        value={newZone.feePerKm}
                        onChange={(e) => setNewZone(prev => ({ ...prev, feePerKm: parseFloat(e.target.value) || 0 }))}
                        data-testid="input-zone-fee-per-km"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>الحد الأدنى للطلب (ر.س)</Label>
                      <Input 
                        type="number"
                        value={newZone.minOrderAmount}
                        onChange={(e) => setNewZone(prev => ({ ...prev, minOrderAmount: parseFloat(e.target.value) || 0 }))}
                        data-testid="input-zone-min-order"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>توصيل مجاني من (ر.س)</Label>
                      <Input 
                        type="number"
                        value={newZone.freeDeliveryThreshold}
                        onChange={(e) => setNewZone(prev => ({ ...prev, freeDeliveryThreshold: parseFloat(e.target.value) || 0 }))}
                        data-testid="input-zone-free-delivery"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>الوقت الأدنى (دقيقة)</Label>
                      <Input 
                        type="number"
                        value={newZone.estimatedMinMinutes}
                        onChange={(e) => setNewZone(prev => ({ ...prev, estimatedMinMinutes: parseInt(e.target.value) || 0 }))}
                        data-testid="input-zone-min-time"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>الوقت الأقصى (دقيقة)</Label>
                      <Input 
                        type="number"
                        value={newZone.estimatedMaxMinutes}
                        onChange={(e) => setNewZone(prev => ({ ...prev, estimatedMaxMinutes: parseInt(e.target.value) || 0 }))}
                        data-testid="input-zone-max-time"
                      />
                    </div>
                  </div>

                  <Button 
                    className="w-full" 
                    onClick={() => createZoneMutation.mutate(newZone)}
                    disabled={!newZone.nameAr || !newZone.branchId || createZoneMutation.isPending}
                    data-testid="button-save-zone"
                  >
                    {createZoneMutation.isPending ? 'جاري الحفظ...' : 'إضافة المنطقة'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {loadingZones ? (
            <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
          ) : zones.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">لا توجد مناطق توصيل</h3>
                <p className="text-muted-foreground mb-4">أضف مناطق التوصيل لتحديد نطاق التغطية والأسعار</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {zones.map((zone: any) => (
                <Card key={zone.id} className={zone.isActive ? 'border-green-500/50' : 'border-muted'}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{zone.nameAr}</CardTitle>
                        <CardDescription>{zone.nameEn}</CardDescription>
                      </div>
                      <Badge variant={zone.isActive ? "default" : "secondary"}>
                        {zone.isActive ? 'نشط' : 'معطّل'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">نطاق التغطية:</span>
                      <span>{zone.radiusKm} كم</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">الرسوم:</span>
                      <span>{zone.baseFee} ر.س + {zone.feePerKm} ر.س/كم</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">التوصيل المجاني:</span>
                      <span>{zone.freeDeliveryThreshold ? `${zone.freeDeliveryThreshold}+ ر.س` : 'غير متاح'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">وقت التوصيل:</span>
                      <span>{zone.estimatedMinMinutes}-{zone.estimatedMaxMinutes} دقيقة</span>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1" data-testid={`button-edit-zone-${zone.id}`}>
                        <Edit className="w-4 h-4 ml-1" />
                        تعديل
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
