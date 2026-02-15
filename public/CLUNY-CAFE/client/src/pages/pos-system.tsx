import { useEffect, useState, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { db } from "@/lib/db/dexie-db";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  ClipboardList,
  Coffee, ShoppingBag, User, Phone, Trash2, Plus, Minus, ArrowRight, 
  Check, Search, X, Printer, MonitorSmartphone, 
  Wifi, WifiOff, FileText, CreditCard, Banknote, Smartphone,
  PauseCircle, PlayCircle, Clock, RotateCcw, Percent, Tag, 
  Calculator, Grid3X3, ChevronLeft, ChevronRight,
  Loader2, CheckCircle, Zap, Building, Users, Edit3, Navigation,
  Receipt, Wallet, QrCode, SplitSquareVertical, AlertTriangle,
  RefreshCw, Archive, MoreVertical, MessageSquare, ScanLine, Camera, Gift,
  Table2, Lock, Unlock, Bell, BellOff, Volume2, VolumeX, Eye, XCircle,
  Columns2, Sparkles, Shield, KeyRound
} from "lucide-react";
import { playNotificationSound } from "@/lib/notification-sounds";
import { useOrderWebSocket } from "@/lib/websocket";

import { useAudio } from "@/hooks/use-audio";

interface TableData {
  id: string;
  tableNumber: string;
  seats: number;
  capacity?: number;
  isOccupied: boolean | number;
  isActive: boolean | number;
}
import BarcodeScanner from "@/components/barcode-scanner";
import DrinkCustomizationDialog, { DrinkCustomization, SelectedAddon } from "@/components/drink-customization-dialog";
import { printTaxInvoice, printSimpleReceipt, printKitchenOrder } from "@/lib/print-utils";
import { LoadingState, EmptyState } from "@/components/ui/states";
import type { Employee, CoffeeItem, PaymentMethod, LoyaltyCard } from "@shared/schema";

interface OrderItem {
  lineItemId: string;
  coffeeItem: CoffeeItem;
  quantity: number;
  itemDiscount?: number;
  discountType?: 'fixed' | 'percentage';
  notes?: string;
  customization?: DrinkCustomization;
}

const generateLineItemId = () => `line-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

interface ParkedOrder {
  id: string;
  name: string;
  items: OrderItem[];
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  tableNumber?: string;
  createdAt: string;
  note?: string;
  priority?: 'normal' | 'urgent';
  appliedDiscount?: { code: string; percentage: number; reason: string } | null;
  invoiceDiscount?: number;
}

interface SplitPayment {
  method: PaymentMethod;
  amount: number;
}

interface PaymentMethodInfo {
  id: PaymentMethod;
  name: string;
  nameEn: string;
  icon: typeof CreditCard;
  color: string;
  bgColor: string;
  enabled: boolean;
}

interface OrderTypeInfo {
  id: OrderType;
  name: string;
  nameEn: string;
  icon: typeof Coffee;
  color: string;
  bgColor: string;
}

type OrderType = "dine_in" | "takeaway" | "delivery" | "car_pickup";

const PAYMENT_METHODS: PaymentMethodInfo[] = [
  { id: "cash", name: "نقدي", nameEn: "Cash", icon: Banknote, color: "text-primary", bgColor: "bg-primary", enabled: true },
  { id: "pos-network", name: "بطاقة صراف", nameEn: "Bank Card", icon: CreditCard, color: "text-primary", bgColor: "bg-primary", enabled: true },
  { id: "pos", name: "بطاقة كلوني", nameEn: "Cluny Card", icon: CreditCard, color: "text-primary", bgColor: "bg-primary", enabled: true },
];

const ORDER_TYPES: OrderTypeInfo[] = [
  { id: "dine_in", name: "محلي", nameEn: "Dine-in", icon: Users, color: "text-primary", bgColor: "bg-primary" },
  { id: "takeaway", name: "سفري", nameEn: "Takeaway", icon: ShoppingBag, color: "text-primary", bgColor: "bg-primary" },
  { id: "delivery", name: "توصيل", nameEn: "Delivery", icon: Zap, color: "text-primary", bgColor: "bg-primary" },
  { id: "car_pickup", name: "استلام من السيارة", nameEn: "Car Pick-up", icon: Navigation, color: "text-primary", bgColor: "bg-primary" },
];

export default function POSSystem() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { playSound } = useAudio();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [orderType, setOrderType] = useState<OrderType>("dine_in");
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [carType, setCarType] = useState("");
  const [carColor, setCarColor] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [customerPoints, setCustomerPoints] = useState(0);
  const [loyaltyCard, setLoyaltyCard] = useState<LoyaltyCard | null>(null);
  const [selectedTable, setSelectedTable] = useState<TableData | null>(null);
  const [showTableSelect, setShowTableSelect] = useState(false);
  const [isSplitView, setIsSplitView] = useState(false);
  const [tableNumber, setTableNumber] = useState("");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [posConnected, setPosConnected] = useState(true);
  const [parkedOrders, setParkedOrders] = useState<ParkedOrder[]>([]);
  const [showParkedOrders, setShowParkedOrders] = useState(false);
  const [invoiceDiscount, setInvoiceDiscount] = useState(0);
  const [invoiceDiscountType, setInvoiceDiscountType] = useState<'fixed' | 'percentage'>('percentage');
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; percentage: number; reason: string } | null>(null);
  const [showSplitPayment, setShowSplitPayment] = useState(false);
  const [splitPayments, setSplitPayments] = useState<SplitPayment[]>([]);
  const [showParkDialog, setShowParkDialog] = useState(false);
  const [parkOrderNote, setParkOrderNote] = useState("");
  const [showDiscountDialog, setShowDiscountDialog] = useState(false);
  const [itemDiscountId, setItemDiscountId] = useState<string | null>(null);
  const [itemDiscountAmount, setItemDiscountAmount] = useState(0);
  const [itemDiscountType, setItemDiscountType] = useState<'fixed' | 'percentage'>('percentage');
  const [discountCode, setDiscountCode] = useState("");
  const [cashDrawerOpen, setCashDrawerOpen] = useState(false);
  const [currentSplitAmount, setCurrentSplitAmount] = useState(0);
  const [currentSplitMethod, setCurrentSplitMethod] = useState<PaymentMethod>("cash");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [changeAmount, setChangeAmount] = useState<number>(0);

  const [lastOrder, setLastOrder] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showKitchenReceipt, setShowKitchenReceipt] = useState(false);
  const [autoPrint, setAutoPrint] = useState(() => {
    const saved = localStorage.getItem("pos_auto_print");
    return saved === "true";
  });

  useEffect(() => {
    localStorage.setItem("pos_auto_print", String(autoPrint));
  }, [autoPrint]);
  const [notificationAudio] = useState(new Audio("/notification.mp3"));
  const [showLiveOrders, setShowLiveOrders] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem("pos_sound_enabled");
    return saved !== "false";
  });
  const [alertsEnabled, setAlertsEnabled] = useState(() => {
    const saved = localStorage.getItem("pos_alerts_enabled");
    return saved !== "false";
  });
  const [splitViewMode, setSplitViewMode] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<any>(null);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);

  const [posPointsRedeemed, setPosPointsRedeemed] = useState(0);
  const [posPointsVerified, setPosPointsVerified] = useState(false);
  const [posPointsVerificationToken, setPosPointsVerificationToken] = useState("");
  const [posShowVerifyDialog, setPosShowVerifyDialog] = useState(false);
  const [posVerificationCode, setPosVerificationCode] = useState("");
  const [posIsRequestingCode, setPosIsRequestingCode] = useState(false);
  const [posIsVerifyingCode, setPosIsVerifyingCode] = useState(false);
  const [posDevCode, setPosDevCode] = useState<string | null>(null);
  const [posPointsInputValue, setPosPointsInputValue] = useState(0);

  const pointsToSar = (pts: number) => (pts / 100) * 5;

  const handlePosRequestCode = async () => {
    if (!posPointsInputValue || posPointsInputValue <= 0) {
      toast({ title: "خطأ", description: "يرجى إدخال عدد النقاط", variant: "destructive" });
      return;
    }
    if (!customerPhone) {
      toast({ title: "خطأ", description: "يرجى إدخال رقم هاتف العميل", variant: "destructive" });
      return;
    }

    setPosIsRequestingCode(true);
    try {
      const response = await apiRequest("POST", "/api/loyalty/points/request-code", {
        phone: customerPhone,
        points: posPointsInputValue,
        requestedBy: 'employee',
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setPosShowVerifyDialog(true);
        if (data.devCode) setPosDevCode(data.devCode);
        toast({ title: "تم إرسال الرمز", description: data.maskedEmail ? `تم الإرسال إلى ${data.maskedEmail}` : "تم إنشاء الرمز" });
      } else {
        toast({ title: "خطأ", description: data.error || "حدث خطأ", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "خطأ", description: "حدث خطأ في إرسال الرمز", variant: "destructive" });
    } finally {
      setPosIsRequestingCode(false);
    }
  };

  const handlePosVerifyCode = async () => {
    if (!posVerificationCode.trim() || posVerificationCode.length < 4) {
      toast({ title: "خطأ", description: "أدخل رمز صحيح من 4 أرقام", variant: "destructive" });
      return;
    }

    setPosIsVerifyingCode(true);
    try {
      const response = await apiRequest("POST", "/api/loyalty/points/verify-code", {
        phone: customerPhone,
        code: posVerificationCode.trim(),
      });
      const data = await response.json();
      if (response.ok && data.verified) {
        setPosPointsVerified(true);
        setPosPointsRedeemed(data.points);
        setPosPointsVerificationToken(data.verificationToken);
        setPosShowVerifyDialog(false);
        setPosVerificationCode("");
        setPosDevCode(null);
        toast({ title: "تم التحقق بنجاح!", description: `سيتم خصم ${pointsToSar(data.points).toFixed(2)} ريال` });
      } else {
        toast({ title: "خطأ", description: data.error || "الرمز غير صحيح", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "خطأ", description: "حدث خطأ في التحقق", variant: "destructive" });
    } finally {
      setPosIsVerifyingCode(false);
    }
  };

  const handlePosCancelPoints = () => {
    setPosPointsVerified(false);
    setPosPointsRedeemed(0);
    setPosPointsVerificationToken("");
    setPosPointsInputValue(0);
    setPosVerificationCode("");
    setPosDevCode(null);
  };

  // Fetch live orders for POS notification and control
  const { data: liveOrders = [] } = useQuery<any[]>({
    queryKey: ["/api/orders/live"],
    queryFn: async () => {
      const res = await fetch("/api/orders");
      if (!res.ok) return [];
      return res.json();
    },
    refetchInterval: 5000,
  });

  // Sound loop for new orders
  useEffect(() => {
    // DISABLED: No longer using sound intervals to avoid repetitive noise
    // Sound is now handled by playNotificationSound which repeats twice (ton ton)
    return () => {};
  }, [soundEnabled, liveOrders, notificationAudio]);

  // Track previous order count to play sound
    const [prevOrderCount, setPrevOrderCount] = useState(0);
    useEffect(() => {
      const ordersArray = Array.isArray(liveOrders) ? liveOrders : [];
      if (ordersArray.length > prevOrderCount && prevOrderCount > 0) {
        const newCount = ordersArray.length - prevOrderCount;
        setNewOrdersCount(prev => prev + newCount);
        
        if (soundEnabled) {
          playNotificationSound('newOrder', 0.7);
        }
        
        if (alertsEnabled) {
          toast({
            title: "طلب جديد!",
            description: `وصل ${newCount > 1 ? newCount + ' طلبات جديدة' : 'طلب جديد'} إلى النظام`,
            className: "bg-primary text-primary-foreground",
          });
        }
      }
      setPrevOrderCount(ordersArray.length);
    }, [liveOrders, prevOrderCount, toast, soundEnabled, alertsEnabled]);

  // WebSocket for real-time order updates
  const { isConnected: wsConnected } = useOrderWebSocket({
    clientType: 'pos',
    branchId: employee?.branchId,
    onNewOrder: (order) => {
      setActiveAlerts(prev => [...prev, order]);
      if (soundEnabled) {
        playNotificationSound('newOrder', 0.9);
      }
      if (alertsEnabled) {
        toast({
          title: "طلب جديد!",
          description: `طلب #${order?.orderNumber || 'جديد'} - ${order?.customerInfo?.customerName || 'عميل'}`,
          className: "bg-primary text-primary-foreground",
        });
      }
      setNewOrdersCount(prev => prev + 1);
      queryClient.invalidateQueries({ queryKey: ["/api/orders/live"] });
    },
    onOrderUpdated: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders/live"] });
    },
    enabled: !!employee?.branchId
  });

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem("pos_sound_enabled", String(soundEnabled));
  }, [soundEnabled]);
  
  useEffect(() => {
    localStorage.setItem("pos_alerts_enabled", String(alertsEnabled));
  }, [alertsEnabled]);
  
  const [isCheckingCustomer, setIsCheckingCustomer] = useState(false);
  const [isValidatingDiscount, setIsValidatingDiscount] = useState(false);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showCustomizationDialog, setShowCustomizationDialog] = useState(false);
  const [customizingItem, setCustomizingItem] = useState<CoffeeItem | null>(null);
  const [editingLineItemId, setEditingLineItemId] = useState<string | null>(null);
  const [usedFreeDrinks, setUsedFreeDrinks] = useState(0);
  const [offlineOrders, setOfflineOrders] = useState<any[]>([]);
  
  const [categoryPage, setCategoryPage] = useState(0);
  const categoriesPerPage = 6;
  

  useEffect(() => {
    const loadEmployee = async () => {
      const storedEmployee = localStorage.getItem("currentEmployee");
      if (storedEmployee) {
        try {
          const parsed = JSON.parse(storedEmployee);
          if (!parsed.branchId) {
            const response = await fetch('/api/verify-session');
            if (response.ok) {
              const data = await response.json();
              if (data.employee?.branchId) {
                parsed.branchId = data.employee.branchId;
                localStorage.setItem("currentEmployee", JSON.stringify(parsed));
              }
            }
          }
          setEmployee(parsed);
        } catch (e) {
          console.error("Error parsing employee:", e);
          setLocation("/employee/gateway");
        }
      } else {
        setLocation("/employee/gateway");
      }
    };
    loadEmployee();
    
    try {
      const savedParkedOrders = localStorage.getItem("parkedOrders");
      if (savedParkedOrders) {
        setParkedOrders(JSON.parse(savedParkedOrders));
      }
      
      const savedOfflineOrders = localStorage.getItem("offlineOrders");
      if (savedOfflineOrders) {
        setOfflineOrders(JSON.parse(savedOfflineOrders));
      }
    } catch (e) {
      console.error("Error loading saved data:", e);
    }
  }, [setLocation]);

  const [syncingOffline, setSyncingOffline] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const syncOfflineOrders = useCallback(async () => {
    if (offlineOrders.length === 0 || syncingOffline) return;
    
    setSyncingOffline(true);
    
    try {
      const sessionVerify = await fetch('/api/verify-session', { credentials: 'include' });
      if (!sessionVerify.ok) {
        toast({ 
          title: "يرجى تسجيل الدخول", 
          description: "سيتم مزامنة الطلبات بعد تسجيل الدخول", 
          variant: "destructive" 
        });
        return;
      }
      
      const syncedOrders: string[] = [];
      const failedOrders: typeof offlineOrders = [];
      
      for (const order of offlineOrders) {
        try {
          const response = await fetch("/api/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: 'include',
            body: JSON.stringify(order),
          });
          
          if (response.ok) {
            syncedOrders.push(order.offlineId);
          } else {
            failedOrders.push(order);
          }
        } catch (error) {
          console.error("Failed to sync order:", error);
          failedOrders.push(order);
        }
      }
      
      if (failedOrders.length > 0) {
        setOfflineOrders(failedOrders);
        localStorage.setItem("offlineOrders", JSON.stringify(failedOrders));
        toast({ 
          title: "مزامنة جزئية", 
          description: `تم رفع ${syncedOrders.length} طلب، ${failedOrders.length} طلب فشل`, 
          variant: "destructive" 
        });
      } else {
        setOfflineOrders([]);
        localStorage.removeItem("offlineOrders");
        toast({ title: "تمت المزامنة", description: `تم رفع ${syncedOrders.length} طلب محفوظ`, className: "bg-green-600 text-white" });
      }
    } finally {
      setSyncingOffline(false);
    }
  }, [offlineOrders, syncingOffline, toast]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({ title: "تم استعادة الاتصال", description: "جاري مزامنة الطلبات المحفوظة...", className: "bg-green-600 text-white" });
      syncOfflineOrders();
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast({ title: "انقطع الاتصال", description: "النظام يعمل في وضع عدم الاتصال", variant: "destructive" });
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast, syncOfflineOrders]);

  useEffect(() => {
    const checkPosConnection = async () => {
      try {
        const response = await fetch('/api/pos/status', { method: 'GET' });
        if (response.ok) {
          const data = await response.json();
          setPosConnected(data.connected === true);
        }
      } catch (error) {
        setPosConnected(false);
      }
    };
    checkPosConnection();
    const interval = setInterval(checkPosConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem("parkedOrders", JSON.stringify(parkedOrders));
  }, [parkedOrders]);

  const { data: productsData, isLoading } = useQuery<any[]>({
    queryKey: ["/api/coffee-items"],
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    queryFn: async () => {
      try {
        const res = await fetch("/api/coffee-items", {
          headers: { "Accept": "application/json" }
        });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        
        const validItems = Array.isArray(data) ? data.filter(item => item && item.id) : [];
        
        if (validItems.length > 0) {
          try {
            await db.products.clear();
            const localProducts = validItems.map((item: any) => ({
              id: String(item.id),
              nameAr: item.nameAr || "منتج بدون اسم",
              price: Number(item.price) || 0,
              category: item.category || "general",
              imageUrl: item.imageUrl,
              isAvailable: item.isAvailable ?? 1,
              tenantId: item.tenantId,
              availableSizes: item.availableSizes || [],
              updatedAt: Date.now()
            }));
            await db.products.bulkAdd(localProducts);
          } catch (dexieError) {
            console.error("Dexie update error:", dexieError);
          }
        }
        return validItems;
      } catch (error) {
        console.error("POS Query Error:", error);
        return [];
      }
    }
  });

  const { data: offlineProducts } = useQuery<any[]>({
    queryKey: ["offline-products"],
    queryFn: async () => {
      const prods = await db.products.toArray();
      return prods as any[];
    },
    enabled: isOnline === false // Use isOnline instead of isOffline which might be shadowed
  });

  // Fetch available tables for selection
  const { data: tablesData = [] } = useQuery<TableData[]>({
    queryKey: ["/api/tables"],
    queryFn: async () => {
      const res = await fetch("/api/tables");
      if (!res.ok) return [];
      const data = await res.json();
      return data.filter((t: TableData) => 
        (t.isActive === true || t.isActive === 1)
      );
    },
    staleTime: 1000 * 30, // Refresh every 30 seconds
  });

  // Check if orders are suspended globally
  const { data: orderSuspensionStatus } = useQuery<{ suspended: boolean }>({
    queryKey: ["/api/settings/order-suspension"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/settings/order-suspension");
        if (!res.ok) return { suspended: false };
        return res.json();
      } catch {
        return { suspended: false };
      }
    },
    staleTime: 1000 * 10, // Check every 10 seconds
  });

  const isOrdersSuspended = orderSuspensionStatus?.suspended || false;

  const coffeeItems = useMemo(() => {
    try {
      const items = !isOnline ? (offlineProducts || []) : (productsData || []);
      return Array.isArray(items) ? items : [];
    } catch (e) {
      console.error("Error computing coffeeItems:", e);
      return [];
    }
  }, [productsData, offlineProducts, isOnline]);

  // Categories and filtered items computed from coffeeItems
  const categoriesList = useMemo(() => {
    try {
      const items = Array.isArray(coffeeItems) ? coffeeItems : [];
      const cats = Array.from(new Set(items.map((item: any) => item?.categoryAr || item?.category || "أخرى")));
      return [
        { id: "all", name: "الكل", icon: Coffee, color: "text-primary" },
        ...cats.map(cat => ({ 
          id: cat, 
          name: cat, 
          icon: Coffee, 
          color: "text-primary" 
        }))
      ];
    } catch (e) {
      console.error("Error computing categories:", e);
      return [{ id: "all", name: "الكل", icon: Coffee, color: "text-primary" }];
    }
  }, [coffeeItems]);

  const filteredItemsList = useMemo(() => {
    try {
      const items = Array.isArray(coffeeItems) ? coffeeItems : [];
      return items.filter((item: any) => {
        if (!item) return false;
        const matchesSearch = (item.nameAr?.toLowerCase().includes(searchQuery.toLowerCase())) ||
                              (item.nameEn?.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesCategory = selectedCategory === "all" || 
                                (item.categoryAr === selectedCategory) ||
                                (item.category === selectedCategory);
        return matchesSearch && matchesCategory;
      });
    } catch (e) {
      console.error("Error filtering items:", e);
      return [];
    }
  }, [coffeeItems, searchQuery, selectedCategory]);

  const checkCustomer = useCallback(async (phone: string) => {
    if (phone.length === 9 && phone.startsWith('5')) {
      setIsCheckingCustomer(true);
      try {
        const response = await fetch(`/api/customers/lookup-by-phone`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone })
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.found && data.customer) {
            setCustomerName(data.customer.name);
            setCustomerEmail(data.customer.email || "");
            setCustomerPoints(data.customer.points || 0);
            setCustomerId(data.customer.id);
            setLoyaltyCard(data.loyaltyCard || null);
            setShowRegisterDialog(false);
            
            toast({
              title: "عميل مسجل",
              description: `مرحباً ${data.customer.name}! لديك ${data.customer.points || 0} نقطة`,
              className: "bg-green-600 text-white",
            });
          } else {
            setShowRegisterDialog(true);
          }
        }
      } catch (error) {
        console.error('Error checking customer:', error);
      } finally {
        setIsCheckingCustomer(false);
      }
    }
  }, [toast]);

  useEffect(() => {
    const timer = setTimeout(() => checkCustomer(customerPhone), 500);
    return () => clearTimeout(timer);
  }, [customerPhone, checkCustomer]);

  // Clamp usedFreeDrinks when order items or loyalty card changes
  useEffect(() => {
    const hasQahwaCard = paymentMethod === 'qahwa-card' || (showSplitPayment && splitPayments.some(p => p.method === 'qahwa-card'));
    
    if (hasQahwaCard && loyaltyCard) {
      const availableFreeDrinks = Math.max(0, (loyaltyCard.freeCupsEarned || 0) - (loyaltyCard.freeCupsRedeemed || 0));
      const totalDrinks = orderItems.reduce((sum, item) => sum + item.quantity, 0);
      const maxUsable = Math.min(availableFreeDrinks, totalDrinks);
      if (usedFreeDrinks > maxUsable) {
        setUsedFreeDrinks(maxUsable);
      }
    } else if (!hasQahwaCard && usedFreeDrinks > 0) {
      // Reset usedFreeDrinks when qahwa-card is no longer selected
      setUsedFreeDrinks(0);
    }
  }, [orderItems, loyaltyCard, paymentMethod, showSplitPayment, splitPayments, usedFreeDrinks]);

  const handleCustomerFoundFromScanner = useCallback((result: any) => {
    if (result.found) {
      if (result.card) {
        setCustomerPhone(result.card.phoneNumber || "");
        setCustomerName(result.card.customerName || result.customer?.name || "");
        setLoyaltyCard(result.card);
        setCustomerPoints(result.customer?.points || result.card.points || 0);
        if (result.customer?.id) {
          setCustomerId(result.customer.id);
        }
        if (result.customer?.email) {
          setCustomerEmail(result.customer.email);
        }
        
        const availableFreeDrinks = Math.max(0, (result.card.freeCupsEarned || 0) - (result.card.freeCupsRedeemed || 0));
        
        toast({
          title: "تم العثور على العميل",
          description: `مرحباً ${result.card.customerName}! ${availableFreeDrinks > 0 ? `لديك ${availableFreeDrinks} مشروب مجاني` : `${result.card.stamps % 6}/6 أختام`}`,
          className: "bg-green-600 text-white",
        });
      }
      setShowBarcodeScanner(false);
    }
  }, [toast]);

  const addToOrder = (coffeeItem: CoffeeItem) => {
    if (!coffeeItem) return;
    setCustomizingItem(coffeeItem);
    setEditingLineItemId(null);
    setShowCustomizationDialog(true);
  };

  const openEditCustomization = (orderItem: OrderItem) => {
    if (!orderItem || !orderItem.coffeeItem) return;
    setCustomizingItem(orderItem.coffeeItem);
    setEditingLineItemId(orderItem.lineItemId);
    setShowCustomizationDialog(true);
  };

  const handleCustomizationConfirm = (customization: DrinkCustomization, quantity: number) => {
    if (!customizingItem) return;
    
    if (editingLineItemId) {
      setOrderItems(orderItems.map(item => 
        item.lineItemId === editingLineItemId 
          ? { ...item, customization, quantity }
          : item
      ));
    } else {
      const existingItemIndex = orderItems.findIndex(item => {
        if (item.coffeeItem.id !== customizingItem.id) return false;
        // Also check if size matches for merging
        if (item.customization?.selectedSize !== customization.selectedSize) return false;
        const existingAddons = item.customization?.selectedAddons || [];
        const newAddons = customization.selectedAddons || [];
        if (existingAddons.length !== newAddons.length) return false;
        return existingAddons.every(ea => 
          newAddons.some(na => na.addonId === ea.addonId && na.quantity === ea.quantity)
        );
      });

      if (existingItemIndex >= 0) {
        setOrderItems(orderItems.map((item, index) => 
          index === existingItemIndex 
            ? { ...item, quantity: item.quantity + quantity }
            : item
        ));
      } else {
        setOrderItems([...orderItems, { 
          lineItemId: generateLineItemId(),
          coffeeItem: customizingItem, 
          quantity, 
          customization 
        }]);
      }
    }
    
    setShowCustomizationDialog(false);
    setCustomizingItem(null);
    setEditingLineItemId(null);
  };

  const updateQuantity = (lineItemId: string, newQuantity: number) => {
    if (!lineItemId) return;
    if (newQuantity <= 0) {
      setOrderItems(orderItems.filter(item => item && item.lineItemId !== lineItemId));
    } else {
      setOrderItems(orderItems.map(item =>
        item && item.lineItemId === lineItemId ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  const applyItemDiscount = (lineItemId: string, discount: number, type: 'fixed' | 'percentage') => {
    setOrderItems(orderItems.map(item => {
      if (item.lineItemId === lineItemId) {
        let basePrice = Number(item.coffeeItem.price);
        // Size price logic
        if (item.customization?.selectedSize) {
          const sizeOption = item.coffeeItem.availableSizes?.find(
            s => s.nameAr === item.customization?.selectedSize || s.nameEn === item.customization?.selectedSize
          );
          if (sizeOption) basePrice = Number(sizeOption.price);
        }
        const addonsPrice = item.customization?.totalAddonsPrice || 0;
        const itemTotal = (basePrice + addonsPrice) * item.quantity;
        const actualDiscount = type === 'percentage' ? (itemTotal * discount / 100) : discount;
        return { ...item, itemDiscount: Math.min(actualDiscount, itemTotal), discountType: type };
      }
      return item;
    }));
    setItemDiscountId(null);
    setItemDiscountAmount(0);
    setShowDiscountDialog(false);
  };

  const calculateSubtotal = () => {
    return orderItems.reduce((sum, item) => {
      if (!item || !item.coffeeItem) return sum;
      let basePrice = Number(item.coffeeItem.price);
      
      // Update price based on selected size
      if (item.customization?.selectedSize) {
        const sizeOption = item.coffeeItem.availableSizes?.find(
          s => s.nameAr === item.customization?.selectedSize || s.nameEn === item.customization?.selectedSize
        );
        if (sizeOption) {
          basePrice = Number(sizeOption.price);
        }
      }
      
      const addonsPrice = item.customization?.totalAddonsPrice || 0;
      const itemTotal = (basePrice + addonsPrice) * item.quantity;
      const itemDiscount = item.itemDiscount || 0;
      return sum + itemTotal - itemDiscount;
    }, 0);
  };

  const calculateCodeDiscount = () => {
    if (!appliedDiscount) return 0;
    return (calculateSubtotal() * appliedDiscount.percentage) / 100;
  };

  const calculateInvoiceDiscount = () => {
    if (invoiceDiscount <= 0) return 0;
    const subtotal = calculateSubtotal() - calculateCodeDiscount();
    if (invoiceDiscountType === 'percentage') {
      return (subtotal * invoiceDiscount) / 100;
    }
    return Math.min(invoiceDiscount, subtotal);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const codeDiscount = calculateCodeDiscount();
    const invDiscount = calculateInvoiceDiscount();
    const total = subtotal - codeDiscount - invDiscount;
    return Math.max(0, total).toFixed(2);
  };

  const validateDiscountCode = async () => {
    if (!discountCode.trim()) return;
    
    setIsValidatingDiscount(true);
    try {
      const response = await fetch('/api/discount-codes/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: discountCode })
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        setAppliedDiscount({
          code: data.code,
          percentage: data.discountPercentage,
          reason: data.reason
        });
        toast({
          title: "تم تطبيق الخصم",
          description: `${data.reason} - ${data.discountPercentage}%`,
          className: "bg-green-600 text-white",
        });
      } else {
        toast({
          title: "كود غير صالح",
          description: data.error || "الكود غير صحيح أو منتهي",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({ title: "خطأ", description: "فشل التحقق من الكود", variant: "destructive" });
    } finally {
      setIsValidatingDiscount(false);
    }
  };

  const parkOrder = () => {
    if (orderItems.length === 0) {
      toast({ title: "خطأ", description: "لا توجد عناصر لتعليقها", variant: "destructive" });
      return;
    }

    const parkedOrder: ParkedOrder = {
      id: `park-${Date.now()}`,
      name: customerName || `طلب معلق #${parkedOrders.length + 1}`,
      items: [...orderItems],
      customerName,
      customerPhone,
      customerEmail,
      tableNumber,
      createdAt: new Date().toISOString(),
      note: parkOrderNote,
      priority: 'normal',
      appliedDiscount,
      invoiceDiscount
    };

    setParkedOrders([...parkedOrders, parkedOrder]);
    resetForm();
    setShowParkDialog(false);
    setParkOrderNote("");
    
    toast({
      title: "تم تعليق الطلب",
      description: `تم حفظ الطلب: ${parkedOrder.name}`,
      className: "bg-blue-600 text-white",
    });
  };

  const resumeParkedOrder = (parkedOrder: ParkedOrder) => {
    setOrderItems(parkedOrder.items);
    setCustomerName(parkedOrder.customerName);
    setCustomerPhone(parkedOrder.customerPhone);
    setCustomerEmail(parkedOrder.customerEmail || "");
    setTableNumber(parkedOrder.tableNumber || "");
    setAppliedDiscount(parkedOrder.appliedDiscount || null);
    setInvoiceDiscount(parkedOrder.invoiceDiscount || 0);
    setParkedOrders(parkedOrders.filter(o => o.id !== parkedOrder.id));
    setShowParkedOrders(false);
    
    toast({
      title: "تم استئناف الطلب",
      description: parkedOrder.name,
    });
  };

  const deleteParkedOrder = (id: string) => {
    setParkedOrders(parkedOrders.filter(o => o.id !== id));
    toast({ title: "تم حذف الطلب المعلق" });
  };

  const updateParkedOrderPriority = (id: string, priority: 'normal' | 'urgent') => {
    setParkedOrders(parkedOrders.map(o => 
      o.id === id ? { ...o, priority } : o
    ));
  };

  const openCashDrawer = async () => {
    try {
      const response = await fetch('/api/pos/cash-drawer/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      
      if (response.ok) {
        setCashDrawerOpen(true);
        setTimeout(() => setCashDrawerOpen(false), 3000);
        toast({ title: "تم فتح الخزانة", className: "bg-green-600 text-white" });
      } else {
        toast({ title: "فشل فتح الخزانة", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "خطأ في الاتصال بالخزانة", variant: "destructive" });
    }
  };

  const handlePrintReceipt = async () => {
    if (!lastOrder) {
      toast({
        title: "خطأ",
        description: "لا يوجد طلب للطباعة",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await fetch('/api/pos/print-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          orderNumber: lastOrder.orderNumber,
          receiptData: lastOrder
        })
      });
    } catch (error) {
      console.error("Error sending to printer:", error);
    }
    
    try {
      await printSimpleReceipt({
        orderNumber: lastOrder.orderNumber,
        customerName: lastOrder.customerName,
        customerPhone: lastOrder.customerPhone,
        items: lastOrder.items,
        subtotal: lastOrder.subtotal,
        discount: lastOrder.discount,
        invoiceDiscount: lastOrder.invoiceDiscount,
        total: lastOrder.total,
        paymentMethod: lastOrder.paymentMethod,
        employeeName: lastOrder.employeeName,
        tableNumber: lastOrder.tableNumber,
        orderType: lastOrder.orderType,
        orderTypeName: lastOrder.orderTypeName,
        date: lastOrder.date,
      });
      toast({ title: "تم فتح نافذة الطباعة", className: "bg-green-600 text-white" });
    } catch (error) {
      console.error("Error printing receipt:", error);
      toast({ title: "خطأ في الطباعة", variant: "destructive" });
    }
  };

  const handlePrintTaxInvoice = async () => {
    if (!lastOrder) {
      toast({
        title: "خطأ",
        description: "لا يوجد طلب للطباعة",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await fetch('/api/pos/print-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          orderNumber: lastOrder.orderNumber,
          receiptData: { ...lastOrder, isTaxInvoice: true }
        })
      });
    } catch (error) {
      console.error("Error sending tax invoice to printer:", error);
    }
    
    try {
      await printTaxInvoice({
        orderNumber: lastOrder.orderNumber,
        customerName: lastOrder.customerName,
        customerPhone: lastOrder.customerPhone,
        items: lastOrder.items,
        subtotal: lastOrder.subtotal,
        discount: lastOrder.discount,
        invoiceDiscount: lastOrder.invoiceDiscount,
        total: lastOrder.total,
        paymentMethod: lastOrder.paymentMethod,
        employeeName: lastOrder.employeeName,
        tableNumber: lastOrder.tableNumber,
        orderType: lastOrder.orderType,
        orderTypeName: lastOrder.orderTypeName,
        date: lastOrder.date,
      });
      toast({ title: "تم فتح نافذة الفاتورة الضريبية", className: "bg-green-600 text-white" });
    } catch (error) {
      console.error("Error printing tax invoice:", error);
      toast({ title: "خطأ في الطباعة", variant: "destructive" });
    }
  };

  const resetForm = () => {
    setOrderItems([]);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setCustomerPoints(0);
    setCustomerId(null);
    setLoyaltyCard(null);
    setTableNumber("");
    setPaymentMethod("cash");
    setOrderType("dine_in");
    setDiscountCode("");
    setAppliedDiscount(null);
    setInvoiceDiscount(0);
    setInvoiceDiscountType('fixed');
    setShowRegisterDialog(false);
    setSplitPayments([]);
    setShowSplitPayment(false);
    setUsedFreeDrinks(0);
    setCarType("");
    setCarColor("");
    setPlateNumber("");
    handlePosCancelPoints();
  };

  const addSplitPayment = () => {
    if (currentSplitAmount <= 0) return;
    const remaining = parseFloat(calculateTotal()) - splitPayments.reduce((sum, p) => sum + p.amount, 0);
    const amount = Math.min(currentSplitAmount, remaining);
    
    setSplitPayments([...splitPayments, { method: currentSplitMethod, amount }]);
    setCurrentSplitAmount(0);
  };

  const removeSplitPayment = (index: number) => {
    setSplitPayments(splitPayments.filter((_, i) => i !== index));
  };

  const getRemainingAmount = () => {
    const total = parseFloat(calculateTotal());
    const paid = splitPayments.reduce((sum, p) => sum + p.amount, 0);
    return Math.max(0, total - paid);
  };

  const handlePrintReceipts = async (order: any) => {
    try {
      // 1. Print Customer Tax Invoice
      await printTaxInvoice({
        orderNumber: order.orderNumber,
        customerName: customerName || order.customerInfo?.customerName || "عميل",
        customerPhone: customerPhone || order.customerInfo?.customerPhone || "",
        items: (orderItems.length > 0 ? orderItems : order.items) as any,
        subtotal: calculateSubtotal() || order.subtotal?.toString() || "0",
        total: calculateTotal() || order.totalAmount?.toString() || "0",
        paymentMethod: PAYMENT_METHODS.find(m => m.id === paymentMethod)?.name || order.paymentMethod,
        employeeName: employee?.fullName || "",
        tableNumber: tableNumber || order.tableNumber,
        orderType: ((orderType as any) === 'car_pickup' ? 'takeaway' : (orderType as any)) as any,
        date: new Date().toISOString(),
      });

      // 2. Print Kitchen Summary Receipt
      await printKitchenOrder({
        orderNumber: order.orderNumber,
        tableNumber: tableNumber || order.tableNumber,
        items: (orderItems.length > 0 ? orderItems : order.items) as any,
        timestamp: new Date().toLocaleString('ar-SA')
      });
    } catch (error) {
      console.error("Failed to print receipts:", error);
    }
  };

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      if (!isOnline) {
        const offlineId = `offline-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const offlineOrder = { 
          ...orderData, 
          offlineId, 
          createdAt: new Date().toISOString(),
          status: 'pending'
        };
        
        // Save to IndexedDB
        await db.invoices.add({
          tempId: offlineId,
          items: orderData.items,
          totalAmount: Number(orderData.totalAmount),
          paymentMethod: orderData.paymentMethod,
          createdAt: Date.now(),
          status: 'pending',
          tenantId: (employee as any)?.tenantId || 'demo-tenant',
          branchId: employee?.branchId || ''
        });

        // Add to sync queue
        await db.syncQueue.add({
          type: 'CREATE_ORDER',
          payload: orderData,
          status: 'pending',
          retryCount: 0,
          createdAt: Date.now()
        });

        return { orderNumber: offlineId, totalAmount: orderData.totalAmount, offline: true };
      }
      
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });
      
      if (!response.ok) throw new Error("Failed to create order");
      return response.json();
    },
    onSuccess: async (order) => {
      const paymentInfo = showSplitPayment && splitPayments.length > 0
        ? splitPayments.map(p => `${PAYMENT_METHODS.find(m => m.id === p.method)?.name}: ${p.amount.toFixed(2)}`).join(' + ')
        : PAYMENT_METHODS.find(m => m.id === paymentMethod)?.name || paymentMethod;
      
      const orderTypeInfo = ORDER_TYPES.find(t => t.id === orderType);
      
      const orderSummary = {
        orderNumber: order.orderNumber,
        customerName: customerName || "عميل",
        customerPhone: customerPhone || "",
        items: orderItems,
        subtotal: calculateSubtotal().toFixed(2),
        discount: appliedDiscount ? {
          code: appliedDiscount.code,
          percentage: appliedDiscount.percentage,
          amount: calculateCodeDiscount().toFixed(2)
        } : undefined,
        invoiceDiscount: calculateInvoiceDiscount() > 0 ? calculateInvoiceDiscount().toFixed(2) : undefined,
        total: order.totalAmount,
        paymentMethod: paymentInfo,
        employeeName: employee?.fullName || "",
        tableNumber: tableNumber || undefined,
        orderType: orderType,
        orderTypeName: orderTypeInfo?.name || orderType,
        date: new Date().toISOString(),
        offline: order.offline
      };

      setLastOrder(orderSummary);
      
      if (autoPrint && !order.offline) {
        handlePrintReceipts(order);
      }
      
      setShowReceipt(true);
      
      if (paymentMethod === "cash" || splitPayments.some(p => p.method === "cash")) {
        openCashDrawer();
      }
      
      toast({
        title: order.offline ? "تم حفظ الطلب محلياً" : "تم إنشاء الطلب بنجاح",
        description: order.offline ? "سيتم المزامنة عند عودة الإنترنت" : `رقم الطلب: ${order.orderNumber}`,
        className: "bg-green-600 text-white",
      });
      
      await queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      resetForm();
    },
    onError: (error: any) => {
      console.error("Order creation error:", error);
      const errorMessage = error?.message || error?.response?.data?.error || "فشل إنشاء الطلب. يرجى المحاولة مرة أخرى";
      toast({
        title: "خطأ في إنشاء الطلب",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleSubmitOrder = (statusArg?: any) => {
    if (orderItems.length === 0) {
      toast({ title: "خطأ", description: "يرجى إضافة عناصر للطلب", variant: "destructive" });
      return;
    }

    if (!employee?.branchId) {
      toast({ title: "خطأ", description: "معلومات الفرع غير متوفرة", variant: "destructive" });
      return;
    }

    if (showSplitPayment && getRemainingAmount() > 0.01) {
      toast({ title: "خطأ", description: "يرجى إكمال الدفع المقسم", variant: "destructive" });
      return;
    }

    let orderStatus = typeof statusArg === 'string' ? statusArg : "in_progress";
    
    // Auto-confirm for non-cash payments when checking out
    if (orderStatus === "in_progress" && paymentMethod !== "cash" && !showSplitPayment) {
      orderStatus = "payment_confirmed";
    }

    // Automatically confirm if it's sent to kitchen
    if (orderStatus === "in_progress") {
      orderStatus = "confirmed";
    }

    const tableId = selectedTable?.id;
    const isTableOpen = (tableId || tableNumber) && orderStatus === "pending";

    const orderData = {
      items: orderItems.map(item => {
        let itemPrice = Number(item.coffeeItem.price);
        const selectedSizeName = item.customization?.selectedSize;
        if (selectedSizeName) {
          const sizeOption = item.coffeeItem.availableSizes?.find(
            s => s.nameAr === selectedSizeName
          );
          if (sizeOption) itemPrice = sizeOption.price;
        }
        return {
          coffeeItemId: item.coffeeItem.id,
          quantity: item.quantity,
          price: itemPrice + (item.customization?.totalAddonsPrice || 0),
          itemDiscount: item.itemDiscount || 0,
          customization: item.customization ? {
            selectedSize: selectedSizeName,
            selectedAddons: item.customization.selectedAddons,
            totalAddonsPrice: item.customization.totalAddonsPrice,
            notes: item.customization.notes
          } : undefined
        };
      }),
      totalAmount: posPointsVerified 
        ? Math.max(0, parseFloat(calculateTotal()) - pointsToSar(posPointsRedeemed)).toFixed(2)
        : calculateTotal(),
      paymentMethod: isTableOpen ? "cash" : (showSplitPayment ? "split" : paymentMethod),
      splitPayments: (!isTableOpen && showSplitPayment) ? splitPayments : undefined,
      customerInfo: {
        customerName: customerName || "عميل",
        phoneNumber: customerPhone || undefined,
        customerEmail: customerEmail || undefined
      },
      customerId: customerId || undefined,
      employeeId: employee?.id,
      branchId: employee.branchId,
      orderType: (tableId || tableNumber) ? 'dine-in' : orderType,
      deliveryType: orderType === 'car_pickup' ? 'car_pickup' : (orderType === 'delivery' ? 'delivery' : (orderType === 'dine_in' ? 'dine-in' : 'pickup')),
      tableNumber: tableNumber || undefined,
      tableId: selectedTable?.id || undefined,
      discountCode: appliedDiscount?.code,
      invoiceDiscount: calculateInvoiceDiscount() > 0 ? calculateInvoiceDiscount() : undefined,
      usedFreeDrinks: (!isTableOpen && (paymentMethod === 'qahwa-card' || (showSplitPayment && splitPayments.some(p => p.method === 'qahwa-card')))) ? usedFreeDrinks : 0,
      ...(orderType === 'car_pickup' ? { carType, carColor, plateNumber } : {}),
      pointsRedeemed: posPointsVerified ? posPointsRedeemed : 0,
      pointsValue: posPointsVerified ? pointsToSar(posPointsRedeemed) : 0,
      pointsVerificationToken: posPointsVerified ? posPointsVerificationToken : undefined,
      status: isTableOpen ? "open" : orderStatus,
      tableStatus: isTableOpen ? "open" : "pending",
      isOpenTab: isTableOpen
    };

    createOrderMutation.mutate(orderData);
  };

  const handlePrintDraft = () => {
    if (orderItems.length === 0) return;
    const draftData = {
      orderNumber: "DRAFT-" + Date.now().toString().slice(-6),
      customerName: customerName || "عميل",
      customerPhone: customerPhone || "",
      items: orderItems,
      total: calculateTotal(),
      subtotal: calculateSubtotal(),
      tableNumber: tableNumber,
      date: new Date().toISOString(),
      isDraft: true,
      paymentMethod: paymentMethod,
      employeeName: employee?.fullName || ""
    };
    printSimpleReceipt(draftData as any);
    toast({ title: "فاتورة مبدئية", description: "تم إرسال الفاتورة المبدئية للطباعة" });
  };

  if (!employee) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <LoadingState message="جاري التحميل..." />
      </div>
    );
  }

  const visibleCategories = Array.isArray(categoriesList) ? categoriesList.slice(categoryPage * categoriesPerPage, (categoryPage + 1) * categoriesPerPage) : [{id: "all", name: "الكل", icon: Coffee, color: "text-primary"}];
  const totalPages = Array.isArray(categoriesList) ? Math.ceil(categoriesList.length / categoriesPerPage) : 1;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col" dir="rtl">
      <div className="flex flex-col lg:flex-row h-screen gap-0">
        {/* Header - Responsive */}
        <div className="flex-1 flex flex-col min-h-0 lg:min-h-screen">
          <header className="bg-card/80 backdrop-blur-sm border-b border-border px-3 sm:px-6 py-3 sm:py-4 flex-shrink-0">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-xl flex-shrink-0 flex items-center justify-center shadow-lg">
                  <Coffee className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">
                    نظام نقاط البيع
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">{employee.fullName}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-background/50 rounded-full border border-border">
                  {isOnline ? (
                    <>
                      <Wifi className="w-4 h-4 text-green-500" />
                      <span className="text-xs font-medium">متصل</span>
                      {syncing && <Loader2 className="w-3 h-3 animate-spin text-primary ml-1" />}
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-4 h-4 text-destructive" />
                      <span className="text-xs font-medium">وضع الأوفلاين</span>
                    </>
                  )}
                </div>
                
                {offlineOrders.length > 0 && (
                  <Badge variant="destructive" className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 animate-pulse text-xs sm:text-sm">
                    <Archive className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="hidden sm:inline">فواتير معلقة</span>
                    <span className="bg-red-700 px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-bold">
                      {offlineOrders.length}
                    </span>
                  </Badge>
                )}
                
                {offlineOrders.length > 0 && isOnline && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={syncOfflineOrders}
                    disabled={syncingOffline}
                    className="text-xs sm:text-sm"
                  >
                    {syncingOffline ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" /> : <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />}
                    <span className="hidden sm:inline ml-1 sm:mr-2">مزامنة ({offlineOrders.length})</span>
                  </Button>
                )}
                
                <Button 
                  variant={soundEnabled ? "outline" : "secondary"}
                  size="icon"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="h-9 w-9"
                  title={soundEnabled ? "إيقاف الصوت" : "تشغيل الصوت"}
                  data-testid="button-toggle-sound"
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </Button>
                
                <Button 
                  variant={alertsEnabled ? "outline" : "secondary"}
                  size="icon"
                  onClick={() => setAlertsEnabled(!alertsEnabled)}
                  className="h-9 w-9"
                  title={alertsEnabled ? "إيقاف التنبيهات" : "تشغيل التنبيهات"}
                  data-testid="button-toggle-alerts"
                >
                  {alertsEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setShowLiveOrders(true);
                    setNewOrdersCount(0);
                    setActiveAlerts([]); // Clear alerts when clicking orders button
                  }} 
                  className="text-xs sm:text-sm relative"
                  data-testid="button-live-orders"
                >
                  <ClipboardList className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2 flex-shrink-0" />
                  <span className="hidden sm:inline">الطلبات</span>
                  {activeAlerts.length > 0 && (
                    <Badge variant="destructive" className="absolute -top-2 -left-2 h-5 w-5 p-0 flex items-center justify-center text-xs animate-pulse">
                      {activeAlerts.length > 9 ? '9+' : activeAlerts.length}
                    </Badge>
                  )}
                </Button>

                <Button 
                  variant={splitViewMode ? "default" : "outline"}
                  size="sm" 
                  onClick={() => setSplitViewMode(!splitViewMode)} 
                  className="text-xs sm:text-sm"
                  data-testid="button-split-view"
                >
                  <Columns2 className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2 flex-shrink-0" />
                  <span className="hidden sm:inline">{splitViewMode ? 'عرض كامل' : 'عرض مقسم'}</span>
                </Button>

                <Badge 
                  variant={posConnected ? "default" : "secondary"} 
                  className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm"
                >
                  <MonitorSmartphone className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="hidden sm:inline">{posConnected ? "متصل" : "غير متصل"}</span>
                </Badge>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowParkedOrders(true)} 
                  className={`text-xs sm:text-sm ${parkedOrders.length > 0 ? 'animate-pulse' : ''}`}
                  data-testid="button-parked-orders"
                >
                  <PauseCircle className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2 flex-shrink-0" />
                  <span className="hidden sm:inline">معلق</span>
                  {parkedOrders.length > 0 && (
                    <Badge variant="secondary" className="text-xs mr-1 sm:mr-2 ml-0.5">
                      {parkedOrders.length}
                    </Badge>
                  )}
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={openCashDrawer} 
                  className="text-xs sm:text-sm"
                  data-testid="button-open-drawer"
                >
                  <Receipt className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2 flex-shrink-0" />
                  <span className="hidden sm:inline">فتح</span>
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setLocation("/employee/dashboard")} 
                  className="h-9 w-9 sm:h-10 sm:w-10"
                  data-testid="button-back"
                >
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                </Button>
              </div>
            </div>
          </header>

          {/* Order Suspension Banner */}
          {isOrdersSuspended && (
            <div className="bg-destructive/10 border-b border-destructive/30 px-4 py-3 flex items-center justify-center gap-3">
              <Lock className="w-5 h-5 text-destructive" />
              <span className="text-destructive font-bold text-lg">
                الطلبات معلقة مؤقتاً - لا يمكن إنشاء طلبات جديدة
              </span>
            </div>
          )}

          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden gap-0">
            {/* Live Orders Split Panel */}
            {splitViewMode && (
              <div className="w-full lg:w-[340px] xl:w-[380px] bg-card/50 border-l border-border flex flex-col overflow-hidden">
                <div className="p-3 border-b border-border flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-primary" />
                    <span className="font-bold text-sm">الطلبات المباشرة</span>
                    {wsConnected && (
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    )}
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {(Array.isArray(liveOrders) ? liveOrders : []).filter((o: any) => o.status !== 'completed' && o.status !== 'cancelled').length}
                  </Badge>
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-2 space-y-2">
                    {(Array.isArray(liveOrders) ? liveOrders : []).filter((o: any) => o.status !== 'completed' && o.status !== 'cancelled').map((order: any) => {
                      const statusColors: Record<string, string> = {
                        pending: 'border-r-4 border-r-orange-500',
                        payment_confirmed: 'border-r-4 border-r-yellow-500',
                        confirmed: 'border-r-4 border-r-blue-400',
                        in_progress: 'border-r-4 border-r-blue-500',
                        ready: 'border-r-4 border-r-green-500',
                        open: 'border-r-4 border-r-purple-500'
                      };
                      const statusLabels: Record<string, string> = {
                        pending: 'في الانتظار',
                        payment_confirmed: 'تم الدفع',
                        confirmed: 'مؤكد',
                        in_progress: 'قيد التجهيز',
                        ready: 'جاهز',
                        open: 'طاولة مفتوحة'
                      };
                      return (
                        <Card
                          key={order.id}
                          className={`overflow-hidden ${statusColors[order.status] || ''}`}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs font-bold px-1.5 py-0">
                                  #{order.orderNumber}
                                </Badge>
                                {order.tableNumber && (
                                  <Badge variant="secondary" className="text-[9px] px-1 py-0">
                                    T{order.tableNumber}
                                  </Badge>
                                )}
                                <span className="text-xs text-muted-foreground truncate max-w-[80px]">
                                  {order.customerInfo?.customerName || "عميل"}
                                </span>
                              </div>
                              <Badge
                                variant={order.status === 'pending' || order.status === 'payment_confirmed' ? 'destructive' : order.status === 'ready' ? 'default' : 'secondary'}
                                className="text-[10px] px-1.5"
                              >
                                {statusLabels[order.status] || order.status}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(order.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                              <span className="font-bold text-foreground">{Number(order.totalAmount).toFixed(2)} ر.س</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {order.status === 'pending' && (
                                <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={async () => {
                                  await apiRequest("PATCH", `/api/orders/${order.id}/status`, { status: "in_progress" });
                                  if (soundEnabled) playNotificationSound('statusChange', 0.3);
                                  queryClient.invalidateQueries({ queryKey: ["/api/orders/live"] });
                                }}>
                                  <PlayCircle className="w-3 h-3 ml-0.5" />
                                  بدء
                                </Button>
                              )}
                              {order.status === 'in_progress' && (
                                <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={async () => {
                                  await apiRequest("PATCH", `/api/orders/${order.id}/status`, { status: "ready" });
                                  if (soundEnabled) playNotificationSound('success', 0.5);
                                  queryClient.invalidateQueries({ queryKey: ["/api/orders/live"] });
                                }}>
                                  <Check className="w-3 h-3 ml-0.5" />
                                  جاهز
                                </Button>
                              )}
                              {(order.status === 'ready' || order.status === 'in_progress') && (
                                <Button size="sm" className="h-6 text-[10px] px-2" onClick={async () => {
                                  await apiRequest("PATCH", `/api/orders/${order.id}/status`, { status: "completed" });
                                  if (soundEnabled) playNotificationSound('success', 0.5);
                                  queryClient.invalidateQueries({ queryKey: ["/api/orders/live"] });
                                  toast({ title: "تم إكمال الطلب", description: `طلب #${order.orderNumber}` });
                                }}>
                                  <CheckCircle className="w-3 h-3 ml-0.5" />
                                  إكمال
                                </Button>
                              )}
                              <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2 text-destructive" onClick={async () => {
                                if (confirm('هل أنت متأكد من إلغاء هذا الطلب؟')) {
                                  await apiRequest("PATCH", `/api/orders/${order.id}/status`, { status: "cancelled" });
                                  queryClient.invalidateQueries({ queryKey: ["/api/orders/live"] });
                                  toast({ title: "تم إلغاء الطلب", variant: "destructive" });
                                }
                              }}>
                                <XCircle className="w-3 h-3 ml-0.5" />
                                إلغاء
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                    {(Array.isArray(liveOrders) ? liveOrders : []).filter((o: any) => o.status !== 'completed' && o.status !== 'cancelled').length === 0 && (
                      <div className="text-center text-muted-foreground py-8">
                        <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">لا توجد طلبات نشطة</p>
                        <p className="text-xs">ستظهر الطلبات الجديدة هنا تلقائياً</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Products Section */}
            <div className="flex-1 flex flex-col p-3 sm:p-6 overflow-hidden min-w-0">
              <div className="flex items-center gap-2 sm:gap-4 mb-4 sm:mb-6 flex-wrap">
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground flex-shrink-0" />
                  <Input
                    placeholder="بحث..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10 sm:pr-12 h-10 sm:h-12 text-sm sm:text-lg rounded-xl"
                    data-testid="input-search"
                  />
                </div>
                
                {searchQuery && (
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setSearchQuery("")}
                    className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 overflow-x-auto pb-2">
                {categoryPage > 0 && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setCategoryPage(p => p - 1)}
                    className="shrink-0 h-10 w-10 sm:h-14 sm:w-auto"
                  >
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                )}
                
                <div className="flex gap-1 sm:gap-2 flex-1 min-w-0 overflow-x-auto pb-1">
                  {visibleCategories.map((cat: any) => (
                    <Button
                      key={cat.id}
                      variant={selectedCategory === cat.id ? "default" : "outline"}
                      onClick={() => setSelectedCategory(cat.id)}
                      size="sm"
                      className={`shrink-0 h-10 sm:h-14 text-xs sm:text-base rounded-xl transition-all ${
                        selectedCategory === cat.id ? `${cat.color} shadow-lg` : ""
                      }`}
                      data-testid={`button-category-${cat.id}`}
                    >
                      <cat.icon className="w-3 h-3 sm:w-5 sm:h-5 ml-0.5 sm:ml-2" />
                      <span className="hidden sm:inline font-medium">{cat.name}</span>
                    </Button>
                  ))}
                </div>
                
                {categoryPage < totalPages - 1 && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setCategoryPage(p => p + 1)}
                    className="shrink-0 h-10 w-10 sm:h-14 sm:w-auto"
                  >
                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                )}
              </div>

              <ScrollArea className="flex-1 -mx-2 sm:-mx-2 px-2 sm:px-2">
                {isLoading ? (
                  <LoadingState message="جاري تحميل المنتجات..." />
                ) : !Array.isArray(filteredItemsList) || filteredItemsList.length === 0 ? (
                  <EmptyState 
                    title="لا توجد منتجات مطابقة"
                    description="جرب البحث بكلمات أخرى"
                    icon={<Coffee className="w-10 h-10 text-muted-foreground" />}
                  />
                ) : (
                  <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 sm:gap-4">
                    {filteredItemsList.map((item: any) => {
                      if (!item || !item.id) return null;
                      const inCart = orderItems.find(oi => oi.coffeeItem && oi.coffeeItem.id === item.id);
                      return (
                        <Card
                          key={item.id}
                          className={`relative cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-xl rounded-xl overflow-hidden group hover-elevate ${
                            inCart ? 'ring-2 ring-primary' : ''
                          }`}
                          onClick={() => addToOrder(item)}
                          data-testid={`card-item-${item.id}`}
                        >
                          {inCart && (
                            <div className="absolute top-2 left-2 z-10 bg-primary text-primary-foreground w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                              {inCart.quantity}
                            </div>
                          )}
                          <CardContent className="p-4">
                            <div className="aspect-square bg-muted rounded-xl mb-3 flex items-center justify-center transition-all overflow-hidden">
                              {item.imageUrl ? (
                                <img 
                                  src={item.imageUrl} 
                                  alt={item.nameAr}
                                  className="w-full h-full object-cover rounded-xl group-hover:scale-110 transition-transform duration-300"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                  }}
                                />
                              ) : null}
                              <Coffee className={`w-12 h-12 text-primary/60 group-hover:text-primary/80 transition-all ${item.imageUrl ? 'hidden' : ''}`} />
                            </div>
                            <h3 className="text-sm font-semibold text-foreground truncate mb-1">{item.nameAr}</h3>
                            {item.nameEn && (
                              <p className="text-xs text-muted-foreground truncate mb-2">{item.nameEn}</p>
                            )}
                            <p className="text-xl font-bold text-foreground">{Number(item.price).toFixed(2)} <span className="text-sm text-muted-foreground">ر.س</span></p>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Order Panel - Responsive */}
            <div className="w-full lg:w-[420px] bg-card/90 backdrop-blur-sm border-t lg:border-r lg:border-t-0 border-border flex flex-col max-h-[50vh] lg:max-h-none">
              <div className="p-5 border-b border-border">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5" />
                    الفاتورة
                  </h2>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setShowParkDialog(true)} 
                      disabled={orderItems.length === 0}
                      data-testid="button-park-order"
                    >
                      <PauseCircle className="w-5 h-5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={resetForm}
                      data-testid="button-clear-order"
                    >
                      <RotateCcw className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="5xxxxxxxx"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
                        className="pr-10 rounded-lg"
                        data-testid="input-phone"
                      />
                    </div>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => setShowBarcodeScanner(true)}
                      title="مسح بطاقة الولاء"
                      data-testid="button-scan-loyalty-card"
                    >
                      <ScanLine className="w-4 h-4" />
                    </Button>
                    {isCheckingCustomer && <Loader2 className="w-5 h-5 animate-spin text-primary self-center" />}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="اسم العميل"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="pr-10 rounded-lg"
                        data-testid="input-customer-name"
                      />
                    </div>
                      <Select value={tableNumber} onValueChange={(val) => {
                        setTableNumber(val);
                        const table = tablesData.find(t => t.tableNumber === val);
                        if (table) setSelectedTable(table);
                      }}>
                        <SelectTrigger className="rounded-lg" data-testid="select-table">
                          <Table2 className="w-4 h-4 ml-2 text-muted-foreground" />
                          <SelectValue placeholder="اختر طاولة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">بدون طاولة</SelectItem>
                          {tablesData.map((table) => (
                            <SelectItem 
                              key={table.id} 
                              value={table.tableNumber}
                            >
                              طاولة {table.tableNumber} ({table.capacity || table.seats} مقاعد)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                  </div>
                  
                  {loyaltyCard && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 bg-primary/10 rounded-lg p-2 border border-primary/20">
                        <Coffee className="w-4 h-4 text-primary" />
                        <span className="text-sm text-primary">
                          {loyaltyCard.stamps || 0} أختام | {customerPoints} نقطة
                        </span>
                      </div>
                      {customerPoints > 0 && (
                        <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 border border-blue-200 dark:border-blue-800 space-y-2">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-1">
                              <Sparkles className="w-4 h-4 text-blue-600" />
                              <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">خصم بالنقاط</span>
                            </div>
                            <span className="text-xs text-blue-600">≈ {pointsToSar(customerPoints).toFixed(2)} ر.س</span>
                          </div>
                          {posPointsVerified ? (
                            <div className="flex items-center justify-between gap-2 bg-green-50 dark:bg-green-950/30 rounded p-2 border border-green-200 dark:border-green-800 flex-wrap">
                              <div className="flex items-center gap-1">
                                <Shield className="w-3 h-3 text-green-600" />
                                <span className="text-xs text-green-700 dark:text-green-400 font-semibold">تم التحقق - {posPointsRedeemed} نقطة = {pointsToSar(posPointsRedeemed).toFixed(2)} ر.س</span>
                              </div>
                              <Button variant="destructive" size="sm" onClick={handlePosCancelPoints} data-testid="button-pos-cancel-points">
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min={0}
                                max={customerPoints}
                                value={posPointsInputValue || ''}
                                onChange={(e) => setPosPointsInputValue(Math.min(Number(e.target.value), customerPoints))}
                                placeholder="عدد النقاط"
                                className="h-8 text-xs bg-white dark:bg-background"
                                data-testid="input-pos-points"
                              />
                              <Button
                                size="sm"
                                onClick={handlePosRequestCode}
                                disabled={posIsRequestingCode || !posPointsInputValue || posPointsInputValue <= 0}
                                data-testid="button-pos-send-code"
                              >
                                {posIsRequestingCode ? <Loader2 className="w-3 h-3 animate-spin" /> : <KeyRound className="w-3 h-3" />}
                                <span className="mr-1 text-xs">إرسال رمز</span>
                              </Button>
                            </div>
                          )}
                          {!posPointsVerified && (
                              <p className="text-[10px] text-muted-foreground">سيظهر الرمز للعميل في لوحة التحكم الخاصة به</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <ScrollArea className="flex-1 p-5">
                {orderItems.length === 0 ? (
                  <div className="text-center text-muted-foreground py-12">
                    <ShoppingBag className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg">اضغط على المنتجات لإضافتها</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orderItems.map((item, itemIndex) => {
                      if (!item || !item.coffeeItem) return null;
                      const basePrice = Number(item.coffeeItem.price || 0);
                      const addonsPrice = item.customization?.totalAddonsPrice || 0;
                      const itemTotalBeforeDiscount = (basePrice + addonsPrice) * item.quantity;
                      const itemTotal = itemTotalBeforeDiscount - (item.itemDiscount || 0);
                      
                      return (
                        <div 
                          key={item.lineItemId} 
                          className="bg-muted/50 rounded-xl p-4 border border-border"
                          data-testid={`order-item-${item.lineItemId}`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="font-semibold text-foreground">{item.coffeeItem.nameAr}</h4>
                              <p className="text-sm text-muted-foreground">
                                {basePrice.toFixed(2)} ر.س
                                {addonsPrice > 0 && <span className="text-primary"> +{addonsPrice.toFixed(2)}</span>}
                                {' × '}{item.quantity}
                              </p>
                              {item.customization?.selectedAddons && item.customization.selectedAddons.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {item.customization.selectedAddons.map(addon => (
                                    <Badge key={addon.addonId} variant="outline" className="text-xs">
                                      {addon.nameAr} {addon.quantity > 1 && `×${addon.quantity}`}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                              {item.itemDiscount && item.itemDiscount > 0 && (
                                <Badge variant="secondary" className="mt-1">
                                  خصم: {item.itemDiscount.toFixed(2)} ر.س
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1 bg-background rounded-lg p-1">
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                onClick={() => updateQuantity(item.lineItemId, item.quantity - 1)} 
                                data-testid={`button-decrease-${item.lineItemId}`}
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                              <span className="w-8 text-center font-bold text-lg">{item.quantity}</span>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                onClick={() => updateQuantity(item.lineItemId, item.quantity + 1)} 
                                data-testid={`button-increase-${item.lineItemId}`}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-foreground">
                              {itemTotal.toFixed(2)} ر.س
                            </span>
                            <div className="flex gap-1">
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                onClick={() => openEditCustomization(item)} 
                                data-testid={`button-edit-${item.lineItemId}`}
                              >
                                <Edit3 className="w-4 h-4" />
                              </Button>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                onClick={() => { setItemDiscountId(item.lineItemId); setShowDiscountDialog(true); }} 
                                data-testid={`button-item-discount-${item.lineItemId}`}
                              >
                                <Tag className="w-4 h-4" />
                              </Button>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                onClick={() => setOrderItems(orderItems.filter(i => i.lineItemId !== item.lineItemId))} 
                                data-testid={`button-remove-${item.lineItemId}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    <Separator className="my-4" />

                    <div className="flex gap-2">
                      <Input
                        placeholder="كود الخصم"
                        value={discountCode}
                        onChange={(e) => setDiscountCode(e.target.value)}
                        className="rounded-lg"
                        data-testid="input-discount-code"
                      />
                      <Button 
                        onClick={validateDiscountCode} 
                        disabled={isValidatingDiscount || !discountCode.trim()} 
                        data-testid="button-apply-discount"
                      >
                        {isValidatingDiscount ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      </Button>
                    </div>

                    {appliedDiscount && (
                      <div className="flex items-center justify-between bg-accent/50 rounded-lg px-4 py-2 border border-border">
                        <div className="flex items-center gap-2">
                          <Percent className="w-4 h-4 text-primary" />
                          <span className="text-sm text-foreground">{appliedDiscount.reason} ({appliedDiscount.percentage}%)</span>
                        </div>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => { setAppliedDiscount(null); setDiscountCode(""); }} 
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="خصم على الفاتورة"
                        value={invoiceDiscount || ""}
                        onChange={(e) => setInvoiceDiscount(parseFloat(e.target.value) || 0)}
                        className="rounded-lg"
                        data-testid="input-invoice-discount"
                      />
                      <Button 
                        variant={invoiceDiscountType === 'fixed' ? 'default' : 'outline'}
                        size="icon"
                        onClick={() => setInvoiceDiscountType('fixed')}
                      >
                        <span className="text-xs font-bold">ر.س</span>
                      </Button>
                      <Button 
                        variant={invoiceDiscountType === 'percentage' ? 'default' : 'outline'}
                        size="icon"
                        onClick={() => setInvoiceDiscountType('percentage')}
                      >
                        <Percent className="w-4 h-4" />
                      </Button>
                    </div>

                    <Separator className="my-4" />

                    <div className="space-y-2 text-sm bg-muted/50 rounded-lg p-3">
                      <div className="flex justify-between text-muted-foreground">
                        <span>المجموع الفرعي:</span>
                        <span className="text-foreground font-medium">{calculateSubtotal().toFixed(2)} ر.س</span>
                      </div>
                      {appliedDiscount && (
                        <div className="flex justify-between text-primary">
                          <span>خصم الكود ({appliedDiscount.percentage}%):</span>
                          <span>-{calculateCodeDiscount().toFixed(2)} ر.س</span>
                        </div>
                      )}
                      {calculateInvoiceDiscount() > 0 && (
                        <div className="flex justify-between text-primary">
                          <span>خصم الفاتورة{invoiceDiscountType === 'percentage' ? ` (${invoiceDiscount}%)` : ''}:</span>
                          <span>-{calculateInvoiceDiscount().toFixed(2)} ر.س</span>
                        </div>
                      )}
                      {posPointsVerified && posPointsRedeemed > 0 && (
                        <div className="flex justify-between text-sm text-green-600 gap-2 flex-wrap">
                          <span>خصم النقاط ({posPointsRedeemed} نقطة):</span>
                          <span>-{pointsToSar(posPointsRedeemed).toFixed(2)} ر.س</span>
                        </div>
                      )}
                      <Separator className="my-2" />
                      <div className="flex justify-between text-xl font-bold text-primary">
                        <span>الإجمالي:</span>
                        <span>{posPointsVerified 
                          ? Math.max(0, parseFloat(calculateTotal()) - pointsToSar(posPointsRedeemed)).toFixed(2) 
                          : calculateTotal()} ر.س</span>
                      </div>
                    </div>

                    <div className="space-y-3 mt-6 pt-4 border-t border-border">
                      <div className="space-y-2">
                        <span className="text-sm text-muted-foreground font-medium">نوع الطلب</span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {ORDER_TYPES.map((type) => (
                            <Button
                              key={type.id}
                              variant={orderType === type.id ? "default" : "outline"}
                              size="sm"
                              onClick={() => setOrderType(type.id)}
                              className={`flex items-center justify-center gap-1.5 h-11 font-bold text-xs ${
                                orderType === type.id ? "shadow-lg" : ""
                              }`}
                              data-testid={`button-order-type-${type.id}`}
                            >
                              <type.icon className="w-4 h-4" />
                              <span className="hidden sm:inline">{type.name}</span>
                              <span className="sm:hidden">{type.nameEn}</span>
                            </Button>
                          ))}
                        </div>
                      </div>

                      {orderType === "car_pickup" && (
                        <div className="space-y-2 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                          <span className="text-sm font-medium text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                            <Navigation className="w-4 h-4" />
                            بيانات السيارة
                          </span>
                          <div className="grid grid-cols-3 gap-2">
                            <Input
                              placeholder="نوع السيارة"
                              value={carType}
                              onChange={(e) => setCarType(e.target.value)}
                              className="h-9 text-sm"
                              data-testid="input-car-type"
                            />
                            <Input
                              placeholder="لون السيارة"
                              value={carColor}
                              onChange={(e) => setCarColor(e.target.value)}
                              className="h-9 text-sm"
                              data-testid="input-car-color"
                            />
                            <Input
                              placeholder="رقم اللوحة"
                              value={plateNumber}
                              onChange={(e) => setPlateNumber(e.target.value)}
                              className="h-9 text-sm"
                              data-testid="input-plate-number"
                            />
                          </div>
                        </div>
                      )}

                      <Separator />

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground font-medium">طريقة الدفع</span>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setShowSplitPayment(!showSplitPayment)}
                            className="h-7 px-2 text-xs"
                          >
                            <SplitSquareVertical className="w-3 h-3 ml-1" />
                            {showSplitPayment ? 'إلغاء' : 'تقسيم'}
                          </Button>
                        </div>
                        
                        {!showSplitPayment ? (
                          <>
                            <div className="grid grid-cols-4 gap-1.5">
                              {PAYMENT_METHODS.map((method) => (
                                <Button
                                  key={method.id}
                                  variant={paymentMethod === method.id ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => {
                                    setPaymentMethod(method.id);
                                    if (method.id !== 'qahwa-card') setUsedFreeDrinks(0);
                                  }}
                                  className={`flex flex-col h-14 gap-0.5 p-1 ${method.id === 'apple_pay' ? 'bg-black text-white hover:bg-black/90 border-0' : ''}`}
                                  data-testid={`button-payment-${method.id}`}
                                >
                                  {method.id === 'apple_pay' ? (
                                    <div className="flex flex-col items-center justify-center">
                                      <span className="text-[10px] font-black tracking-tighter"> Pay</span>
                                    </div>
                                  ) : (
                                    <>
                                      <method.icon className="w-4 h-4" />
                                      <span className="text-[9px] leading-tight text-center">{method.name}</span>
                                    </>
                                  )}
                                </Button>
                              ))}
                            </div>
                            
                            {paymentMethod === 'cash' && (
                              <div className="space-y-4 mt-2 p-3 bg-muted/30 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1">
                                    <Label className="text-xs font-bold mb-1 block text-right">المبلغ المستلم</Label>
                                    <div className="relative">
                                      <Banknote className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                      <Input
                                        type="number"
                                        value={cashReceived || ''}
                                        onChange={(e) => setCashReceived(parseFloat(e.target.value) || 0)}
                                        className="pr-10 h-10 text-lg font-bold text-center"
                                        placeholder="0.00"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex-1">
                                    <Label className="text-xs font-bold mb-1 block text-right">المبلغ المتبقي</Label>
                                    <div className="h-10 flex items-center justify-center bg-primary/10 rounded-lg border border-primary/20">
                                      <span className="text-lg font-bold text-primary">
                                        {changeAmount.toFixed(2)} ر.س
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-3 gap-1.5">
                                  {[10, 20, 50, 100, 200, 500].map(amount => (
                                    <Button 
                                      key={amount}
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setCashReceived((cashReceived || 0) + amount)}
                                      className="h-8 text-[10px] font-bold"
                                    >
                                      +{amount}
                                    </Button>
                                  ))}
                                  <Button 
                                    variant="destructive" 
                                    size="sm" 
                                    onClick={() => setCashReceived(0)}
                                    className="h-8 text-[10px] font-bold col-span-3"
                                  >
                                    مسح المبلغ
                                  </Button>
                                </div>
                              </div>
                            )}

                            {paymentMethod === 'qahwa-card' && loyaltyCard && (() => {
                              const availableFreeDrinks = Math.max(0, (loyaltyCard.freeCupsEarned || 0) - (loyaltyCard.freeCupsRedeemed || 0));
                              const totalDrinks = orderItems.reduce((sum, item) => sum + item.quantity, 0);
                              const maxUsable = Math.min(availableFreeDrinks, totalDrinks);
                              
                              if (availableFreeDrinks <= 0) return (
                                <div className="p-2 bg-muted rounded-lg text-center text-sm text-muted-foreground">
                                  لا يوجد مشروبات مجانية متاحة
                                </div>
                              );
                              
                              return (
                                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-green-700 dark:text-green-400">
                                      <Gift className="w-4 h-4 inline ml-1" />
                                      مشروبات مجانية متاحة: {availableFreeDrinks}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-green-600 dark:text-green-400">استخدام:</span>
                                    <div className="flex items-center gap-1 bg-background rounded-lg p-1">
                                      <Button 
                                        size="icon" 
                                        variant="ghost"
                                        onClick={() => setUsedFreeDrinks(Math.max(0, usedFreeDrinks - 1))}
                                        disabled={usedFreeDrinks <= 0}
                                        data-testid="button-decrease-free-drinks"
                                      >
                                        <Minus className="w-4 h-4" />
                                      </Button>
                                      <span className="w-8 text-center font-bold">{usedFreeDrinks}</span>
                                      <Button 
                                        size="icon" 
                                        variant="ghost"
                                        onClick={() => setUsedFreeDrinks(Math.min(maxUsable, usedFreeDrinks + 1))}
                                        disabled={usedFreeDrinks >= maxUsable}
                                        data-testid="button-increase-free-drinks"
                                      >
                                        <Plus className="w-4 h-4" />
                                      </Button>
                                    </div>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => setUsedFreeDrinks(maxUsable)}
                                      className="text-xs"
                                      data-testid="button-use-all-free"
                                    >
                                      استخدام الكل ({maxUsable})
                                    </Button>
                                  </div>
                                </div>
                              );
                            })()}
                          </>
                        ) : (
                          <div className="space-y-2">
                            {splitPayments.map((payment, index) => (
                              <div key={index} className="flex items-center justify-between bg-muted/50 rounded-lg p-2">
                                <div className="flex items-center gap-2">
                                  {PAYMENT_METHODS.find(m => m.id === payment.method)?.icon && (
                                    <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                                      {(() => {
                                        const IconComponent = PAYMENT_METHODS.find(m => m.id === payment.method)?.icon;
                                        return IconComponent ? <IconComponent className="w-3.5 h-3.5 text-primary-foreground" /> : null;
                                      })()}
                                    </div>
                                  )}
                                  <span className="text-xs">{PAYMENT_METHODS.find(m => m.id === payment.method)?.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm">{payment.amount.toFixed(2)} ر.س</span>
                                  <Button size="icon" variant="ghost" onClick={() => removeSplitPayment(index)}>
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                            
                            {getRemainingAmount() > 0 && (
                              <div className="flex gap-1.5">
                                <select 
                                  value={currentSplitMethod}
                                  onChange={(e) => setCurrentSplitMethod(e.target.value as PaymentMethod)}
                                  className="bg-background border border-border text-foreground rounded-lg px-2 py-1.5 text-xs flex-1"
                                >
                                  {PAYMENT_METHODS.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                  ))}
                                </select>
                                <Input
                                  type="number"
                                  placeholder={`${getRemainingAmount().toFixed(2)}`}
                                  value={currentSplitAmount || ""}
                                  onChange={(e) => setCurrentSplitAmount(parseFloat(e.target.value) || 0)}
                                  className="h-8 text-xs flex-1"
                                />
                                <Button onClick={addSplitPayment} size="sm">
                                  <Plus className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            )}
                            
                            <div className="text-center py-1.5 bg-muted/30 rounded-lg">
                              <span className="text-xs text-muted-foreground">المتبقي: </span>
                              <span className={`font-bold text-sm ${getRemainingAmount() > 0 ? 'text-destructive' : 'text-primary'}`}>
                                {getRemainingAmount().toFixed(2)} ر.س
                              </span>
                            </div>
                            
                            {splitPayments.some(p => p.method === 'qahwa-card') && loyaltyCard && (() => {
                              const availableFreeDrinks = Math.max(0, (loyaltyCard.freeCupsEarned || 0) - (loyaltyCard.freeCupsRedeemed || 0));
                              const totalDrinks = orderItems.reduce((sum, item) => sum + item.quantity, 0);
                              const maxUsable = Math.min(availableFreeDrinks, totalDrinks);
                              
                              if (availableFreeDrinks <= 0) return null;
                              
                              return (
                                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-green-700 dark:text-green-400">
                                      <Gift className="w-3 h-3 inline ml-1" />
                                      مجاني: {availableFreeDrinks}
                                    </span>
                                    <div className="flex items-center gap-1 bg-background rounded p-0.5">
                                      <Button 
                                        size="icon" 
                                        variant="ghost"
                                        className="h-6 w-6"
                                        onClick={() => setUsedFreeDrinks(Math.max(0, usedFreeDrinks - 1))}
                                        disabled={usedFreeDrinks <= 0}
                                      >
                                        <Minus className="w-3 h-3" />
                                      </Button>
                                      <span className="w-6 text-center font-bold text-sm">{usedFreeDrinks}</span>
                                      <Button 
                                        size="icon" 
                                        variant="ghost"
                                        className="h-6 w-6"
                                        onClick={() => setUsedFreeDrinks(Math.min(maxUsable, usedFreeDrinks + 1))}
                                        disabled={usedFreeDrinks >= maxUsable}
                                      >
                                        <Plus className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>

                <div className="grid grid-cols-2 gap-3 mt-auto pt-4 border-t border-border">
                  <Button 
                    variant="outline" 
                    className="h-14 text-lg font-bold rounded-xl flex items-center justify-center gap-2"
                    onClick={handlePrintDraft}
                    disabled={orderItems.length === 0 || isOrdersSuspended}
                  >
                    <Printer className="w-5 h-5" />
                    فاتورة مبدئية
                  </Button>
                  <Button 
                    className="h-14 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                    onClick={() => handleSubmitOrder("pending")}
                    disabled={orderItems.length === 0 || isOrdersSuspended}
                    data-testid="button-submit-order"
                  >
                    <CheckCircle className="w-5 h-5" />
                    {(tableNumber && tableNumber !== "none") ? "إرسال للمطبخ" : "إرسال للمطبخ"}
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-3 mt-3">
                  <Button 
                    className="h-16 text-xl font-bold bg-accent hover:bg-accent/90 text-white rounded-xl flex items-center justify-center gap-3 shadow-xl shadow-accent/20 transition-all active:scale-[0.98]"
                    onClick={() => handleSubmitOrder("in_progress")}
                    disabled={orderItems.length === 0 || isOrdersSuspended}
                    data-testid="button-checkout"
                  >
                    <CreditCard className="w-6 h-6" />
                    دفع وإغلاق الفاتورة
                  </Button>
                </div>
                    </div>
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showParkedOrders} onOpenChange={setShowParkedOrders}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Archive className="w-6 h-6" />
              الطلبات المعلقة ({parkedOrders.length})
            </DialogTitle>
            <DialogDescription>
              يمكنك استئناف أي طلب معلق أو حذفه
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {parkedOrders.length === 0 ? (
              <EmptyState 
                title="لا توجد طلبات معلقة"
                icon={<Clock className="w-10 h-10 text-muted-foreground" />}
              />
            ) : (
              <div className="space-y-3">
                {parkedOrders.sort((a, b) => {
                  if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
                  if (b.priority === 'urgent' && a.priority !== 'urgent') return 1;
                  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                }).map((order) => (
                  <Card 
                    key={order.id} 
                    className={order.priority === 'urgent' ? 'border-destructive/50' : ''}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-foreground">{order.name}</h4>
                            {order.priority === 'urgent' && (
                              <Badge variant="destructive" className="text-xs">
                                <AlertTriangle className="w-3 h-3 ml-1" />
                                عاجل
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{order.items.length} عنصر</span>
                            <span>{order.items.reduce((sum, i) => sum + i.quantity, 0)} قطعة</span>
                            {order.tableNumber && <span>طاولة {order.tableNumber}</span>}
                          </div>
                          {order.note && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                              <MessageSquare className="w-3 h-3" />
                              {order.note}
                            </div>
                          )}
                        </div>
                        <div className="text-left">
                          <Badge variant="secondary" className="text-xs">
                            {new Date(order.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                          </Badge>
                          <p className="text-lg font-bold text-foreground mt-1">
                            {order.items.reduce((sum, i) => sum + (Number(i.coffeeItem.price) * i.quantity - (i.itemDiscount || 0)), 0).toFixed(2)} ر.س
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => resumeParkedOrder(order)} 
                          className="flex-1"
                          data-testid={`button-resume-${order.id}`}
                        >
                          <PlayCircle className="w-4 h-4 ml-1" />
                          استئناف
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateParkedOrderPriority(order.id, order.priority === 'urgent' ? 'normal' : 'urgent')}
                        >
                          <AlertTriangle className={`w-4 h-4 ${order.priority === 'urgent' ? 'text-destructive' : ''}`} />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={() => deleteParkedOrder(order.id)}
                          data-testid={`button-delete-parked-${order.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={showParkDialog} onOpenChange={setShowParkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعليق الطلب</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>ملاحظة (اختياري)</Label>
              <Input
                value={parkOrderNote}
                onChange={(e) => setParkOrderNote(e.target.value)}
                placeholder="أضف ملاحظة للطلب المعلق..."
                className="mt-2"
                data-testid="input-park-note"
              />
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-sm text-muted-foreground">سيتم حفظ:</p>
              <ul className="text-sm text-foreground mt-2 space-y-1">
                <li>{orderItems.length} منتج</li>
                <li>المجموع: {calculateTotal()} ر.س</li>
                {customerName && <li>العميل: {customerName}</li>}
                {tableNumber && <li>طاولة: {tableNumber}</li>}
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowParkDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={parkOrder} data-testid="button-confirm-park">
              <PauseCircle className="w-4 h-4 ml-1" />
              تعليق الطلب
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDiscountDialog} onOpenChange={setShowDiscountDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>خصم على المنتج</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>نوع الخصم</Label>
              <div className="flex gap-2 mt-2">
                <Button 
                  variant={itemDiscountType === 'fixed' ? 'default' : 'outline'}
                  onClick={() => setItemDiscountType('fixed')}
                  className="flex-1"
                >
                  مبلغ ثابت (ر.س)
                </Button>
                <Button 
                  variant={itemDiscountType === 'percentage' ? 'default' : 'outline'}
                  onClick={() => setItemDiscountType('percentage')}
                  className="flex-1"
                >
                  نسبة مئوية (%)
                </Button>
              </div>
            </div>
            <div>
              <Label>
                قيمة الخصم {itemDiscountType === 'percentage' ? '(%)' : '(ر.س)'}
              </Label>
              <Input
                type="number"
                value={itemDiscountAmount}
                onChange={(e) => setItemDiscountAmount(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="mt-2 text-xl text-center"
                data-testid="input-item-discount-amount"
              />
            </div>
            {itemDiscountType === 'percentage' && (
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 15, 20, 25, 30, 50, 100].map(p => (
                  <Button 
                    key={p} 
                    variant="outline" 
                    size="sm"
                    onClick={() => setItemDiscountAmount(p)}
                  >
                    {p}%
                  </Button>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDiscountDialog(false); setItemDiscountId(null); }}>
              إلغاء
            </Button>
            <Button 
              onClick={() => { if (itemDiscountId) applyItemDiscount(itemDiscountId, itemDiscountAmount, itemDiscountType); }} 
              data-testid="button-confirm-item-discount"
            >
              <Check className="w-4 h-4 ml-1" />
              تطبيق الخصم
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showLiveOrders} onOpenChange={setShowLiveOrders}>
        <DialogContent className="max-w-5xl h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-6 h-6 text-primary" />
                إدارة الطلبات المباشرة
                {wsConnected && (
                  <Badge variant="outline" className="text-xs">
                    <div className="w-2 h-2 bg-green-500 rounded-full ml-1 animate-pulse" />
                    مباشر
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {liveOrders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length} طلب نشط
                </Badge>
              </div>
            </DialogTitle>
            <DialogDescription>
              متابعة وتحكم في الطلبات النشطة في النظام - اضغط على الطلب لعرض التفاصيل
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex gap-4 flex-1 min-h-0 mt-4">
            <ScrollArea className="flex-1">
              <div className="space-y-3 pr-4">
                {liveOrders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').map((order: any) => {
                  const statusColors: Record<string, string> = {
                    pending: 'border-r-4 border-r-orange-500',
                    in_progress: 'border-r-4 border-r-blue-500',
                    ready: 'border-r-4 border-r-green-500',
                    open: 'border-r-4 border-r-purple-500'
                  };
                  const statusLabels: Record<string, string> = {
                    pending: 'في الانتظار',
                    in_progress: 'قيد التجهيز',
                    ready: 'جاهز للاستلام',
                    open: 'طاولة مفتوحة'
                  };
                  return (
                    <Card 
                      key={order.id} 
                      className={`overflow-hidden cursor-pointer hover-elevate ${statusColors[order.status] || ''} ${selectedOrderDetails?.id === order.id ? 'ring-2 ring-primary' : ''}`}
                      onClick={() => setSelectedOrderDetails(order)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="text-base font-bold px-2 py-0.5">
                              #{order.orderNumber}
                            </Badge>
                            <div>
                              <p className="font-medium text-foreground text-sm">{order.customerInfo?.customerName || "عميل"}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {new Date(order.createdAt).toLocaleTimeString('ar-SA')}
                                {order.tableNumber && (
                                  <>
                                    <span className="mx-1">•</span>
                                    <Table2 className="w-3 h-3" />
                                    طاولة {order.tableNumber}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge variant={order.status === 'pending' ? 'destructive' : order.status === 'ready' ? 'default' : 'secondary'}>
                              {statusLabels[order.status] || order.status}
                            </Badge>
                            <p className="font-bold text-primary text-sm">{Number(order.totalAmount).toFixed(2)} ر.س</p>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {order.status === 'pending' && (
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={async (e) => {
                              e.stopPropagation();
                              await apiRequest("PATCH", `/api/orders/${order.id}/status`, { status: "in_progress" });
                              if (soundEnabled) playNotificationSound('statusChange', 0.3);
                              queryClient.invalidateQueries({ queryKey: ["/api/orders/live"] });
                            }}>
                              <PlayCircle className="w-3 h-3 ml-1" />
                              بدء التجهيز
                            </Button>
                          )}
                          {order.status === 'in_progress' && (
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={async (e) => {
                              e.stopPropagation();
                              await apiRequest("PATCH", `/api/orders/${order.id}/status`, { status: "ready" });
                              if (soundEnabled) playNotificationSound('success', 0.5);
                              queryClient.invalidateQueries({ queryKey: ["/api/orders/live"] });
                            }}>
                              <Check className="w-3 h-3 ml-1" />
                              جاهز
                            </Button>
                          )}
                          {(order.status === 'ready' || order.status === 'in_progress') && (
                            <Button size="sm" className="h-7 text-xs" onClick={async (e) => {
                              e.stopPropagation();
                              await apiRequest("PATCH", `/api/orders/${order.id}/status`, { status: "completed" });
                              if (soundEnabled) playNotificationSound('success', 0.5);
                              queryClient.invalidateQueries({ queryKey: ["/api/orders/live"] });
                              toast({ title: "تم إكمال الطلب", description: `طلب #${order.orderNumber}` });
                            }}>
                              <CheckCircle className="w-3 h-3 ml-1" />
                              إكمال
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive hover:bg-destructive/10" onClick={async (e) => {
                            e.stopPropagation();
                            if (confirm('هل أنت متأكد من إلغاء هذا الطلب؟')) {
                              await apiRequest("PATCH", `/api/orders/${order.id}/status`, { status: "cancelled" });
                              queryClient.invalidateQueries({ queryKey: ["/api/orders/live"] });
                              toast({ title: "تم إلغاء الطلب", variant: "destructive" });
                            }
                          }}>
                            <XCircle className="w-3 h-3 ml-1" />
                            إلغاء
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {liveOrders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length === 0 && (
                  <EmptyState title="لا توجد طلبات نشطة" description="ستظهر الطلبات الجديدة هنا تلقائياً" />
                )}
              </div>
            </ScrollArea>
            
            {selectedOrderDetails && (
              <Card className="w-80 flex-shrink-0 flex flex-col">
                <CardContent className="p-4 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg">تفاصيل الطلب</h3>
                    <Button size="icon" variant="ghost" onClick={() => setSelectedOrderDetails(null)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-3 flex-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">رقم الطلب:</span>
                      <span className="font-bold">#{selectedOrderDetails.orderNumber}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">العميل:</span>
                      <span>{selectedOrderDetails.customerInfo?.customerName || 'عميل'}</span>
                    </div>
                    {selectedOrderDetails.customerInfo?.phoneNumber && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">الهاتف:</span>
                        <span dir="ltr">{selectedOrderDetails.customerInfo.phoneNumber}</span>
                      </div>
                    )}
                    {selectedOrderDetails.tableNumber && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">الطاولة:</span>
                        <span>طاولة {selectedOrderDetails.tableNumber}</span>
                      </div>
                    )}
                    <Separator className="my-2" />
                    <div className="text-sm font-medium mb-2">الأصناف:</div>
                    <ScrollArea className="h-40">
                      <div className="space-y-2">
                        {selectedOrderDetails.items?.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-sm bg-muted/30 rounded p-2">
                            <span>{item.quantity}x {item.name || item.coffeeItem?.name || 'صنف'}</span>
                            <span className="font-medium">{Number(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    <Separator className="my-2" />
                    <div className="flex justify-between font-bold">
                      <span>الإجمالي:</span>
                      <span className="text-primary">{Number(selectedOrderDetails.totalAmount).toFixed(2)} ر.س</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t">
                    <Button variant="outline" size="sm" onClick={() => {
                      printSimpleReceipt(selectedOrderDetails);
                      toast({ title: "جاري الطباعة..." });
                    }}>
                      <Printer className="w-4 h-4 ml-1" />
                      طباعة
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => {
                      printTaxInvoice(selectedOrderDetails);
                      toast({ title: "جاري طباعة الفاتورة..." });
                    }}>
                      <FileText className="w-4 h-4 ml-1" />
                      فاتورة
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showReceipt && !!lastOrder} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-primary" />
              تم إنشاء الطلب بنجاح
            </DialogTitle>
          </DialogHeader>
          {lastOrder && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-xl p-6 text-center">
                <p className="text-muted-foreground text-sm mb-1">رقم الطلب</p>
                <p className="text-3xl font-bold text-primary">{lastOrder.orderNumber.split('-').pop()}</p>
                <p className="text-2xl font-bold text-foreground mt-3">{lastOrder.total} ر.س</p>
                {lastOrder.offline && (
                  <Badge variant="secondary" className="mt-2">
                    <WifiOff className="w-3 h-3 ml-1" />
                    محفوظ محلياً
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <Button 
                  className="h-14" 
                  variant="outline"
                  onClick={async () => {
                    try {
                      await apiRequest("POST", "/api/orders/mark-all-completed", {});
                      queryClient.invalidateQueries({ queryKey: ["/api/orders/live"] });
                      toast({ title: "تم التحديث", description: "تم تحديث جميع الطلبات إلى مكتمل" });
                    } catch (err) {
                      toast({ title: "خطأ", description: "فشل تحديث الطلبات", variant: "destructive" });
                    }
                  }}
                  data-testid="button-mark-all-completed"
                >
                  <CheckCircle className="w-5 h-5 ml-2" />
                  إكمال الكل
                </Button>
                <Button onClick={handlePrintReceipt} className="h-14" data-testid="button-print-receipt">
                  <Printer className="w-5 h-5 ml-2" />
                  طباعة الإيصال
                </Button>
              </div>
              <Button onClick={handlePrintTaxInvoice} variant="outline" className="h-14 w-full mt-3" data-testid="button-print-tax">
                <FileText className="w-5 h-5 ml-2" />
                فاتورة ضريبية
              </Button>
              <Button onClick={() => setShowReceipt(false)} variant="ghost" className="w-full" data-testid="button-close-receipt">
                إغلاق
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showBarcodeScanner} onOpenChange={setShowBarcodeScanner}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              مسح بطاقة الولاء
            </DialogTitle>
          </DialogHeader>
          <BarcodeScanner 
            onCustomerFound={handleCustomerFoundFromScanner}
            onClose={() => setShowBarcodeScanner(false)}
            showManualInput={true}
          />
        </DialogContent>
      </Dialog>

      <DrinkCustomizationDialog
        coffeeItem={customizingItem}
        open={showCustomizationDialog}
        onClose={() => {
          setShowCustomizationDialog(false);
          setCustomizingItem(null);
          setEditingLineItemId(null);
        }}
        onConfirm={handleCustomizationConfirm}
        initialCustomization={editingLineItemId ? orderItems.find(i => i.lineItemId === editingLineItemId)?.customization : undefined}
        initialQuantity={editingLineItemId ? (orderItems.find(i => i.lineItemId === editingLineItemId)?.quantity || 1) : 1}
      />

      <Dialog open={posShowVerifyDialog} onOpenChange={setPosShowVerifyDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              التحقق من رمز النقاط
            </DialogTitle>
            <DialogDescription>
              أدخل الرمز المكون من 4 أرقام الذي أرسل إلى بريد العميل
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {posDevCode && (
              <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <p className="text-xs text-yellow-700 dark:text-yellow-400 font-mono">
                  [وضع التطوير] الرمز: <strong>{posDevCode}</strong>
                </p>
              </div>
            )}
            <div className="flex flex-col items-center gap-3">
              <Input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={posVerificationCode}
                onChange={(e) => setPosVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="0000"
                className="text-center text-2xl tracking-[0.5em] font-mono w-48"
                autoFocus
                data-testid="input-pos-verification-code"
              />
              <p className="text-xs text-muted-foreground">
                النقاط: {posPointsInputValue} = {pointsToSar(posPointsInputValue).toFixed(2)} ر.س
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setPosShowVerifyDialog(false); setPosVerificationCode(""); }}>
              إلغاء
            </Button>
            <Button
              onClick={handlePosVerifyCode}
              disabled={posIsVerifyingCode || posVerificationCode.length < 4}
              data-testid="button-pos-verify-code"
            >
              {posIsVerifyingCode ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : <Check className="w-4 h-4 ml-1" />}
              تأكيد الرمز
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
