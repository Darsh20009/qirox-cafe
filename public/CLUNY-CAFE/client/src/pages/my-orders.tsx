import { useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Coffee } from "lucide-react";
import { motion } from "framer-motion";
import OrderTracker from "@/components/order-tracker";
import { ReceiptInvoice } from "@/components/receipt-invoice";
import { CarPickupForm } from "@/components/car-pickup-form";
import type { Order as OrderType } from "@shared/schema";
import { CustomerLayout } from "@/components/layouts/CustomerLayout";
import { useCustomer } from "@/contexts/CustomerContext";
import { customerStorage } from "@/lib/customer-storage";

interface OrderDisplay extends OrderType {
 items: any[];
}

export default function MyOrders() {
 const [, setLocation] = useLocation();
 const { customer } = useCustomer();

 // Set SEO metadata
 useEffect(() => {
   document.title = "طلباتي - CLUNY CAFE | متابعة الطلبات والحالة";
   const metaDesc = document.querySelector('meta[name="description"]');
   if (metaDesc) metaDesc.setAttribute('content', 'متابع طلباتك السابقة والحالية في CLUNY CAFE - تتبع آني للحالة والتوصيل');
 }, []);

  const customerPhone = customer?.phone || (customer as any)?.phoneNumber || (customer as any)?.phoneNumberAr;
  const customerId = customer?.id;
  const isAuthenticated = !!customer && (!!customerPhone || !!customerId);
  
  useEffect(() => {
    console.log("[MyOrders] Customer:", customer);
    console.log("[MyOrders] Phone:", customerPhone, "ID:", customerId);
  }, [customer, customerPhone, customerId]);
  
  const { data: orders = [], isLoading, refetch } = useQuery<OrderDisplay[]>({
    queryKey: ["/api/orders/customer", customerPhone || customerId],
    enabled: !!(customerPhone || customerId),
    refetchInterval: 5000,
    queryFn: async () => {
      const identifier = customerPhone || customerId;
      if (!identifier) return [];
      console.log("[MyOrders] Fetching orders for:", identifier);
      const res = await fetch(`/api/orders/customer/${identifier}`);
      if (!res.ok) {
        console.error("[MyOrders] Failed to fetch orders:", res.statusText);
        return [];
      }
      const data = await res.json();
      console.log("[MyOrders] Fetched orders:", data?.length || 0);
      return data;
    }
  });

  // Combine server orders with local orders (for offline support)
  const allOrders = useMemo(() => {
    const localOrders = customerStorage.getOrders();
    const combined = [...orders];
    
    // Add local orders that aren't in server orders (avoid duplicates)
    localOrders.forEach(local => {
      if (!combined.find(s => s.orderNumber === local.orderNumber)) {
        combined.push(local as unknown as OrderDisplay);
      }
    });
    
    // Sort by date descending
    combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return combined;
  }, [orders]);

  return (
    <CustomerLayout showNav={true} showHeader={false}>
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-primary/5 to-amber-100 overflow-hidden relative" data-testid="page-my-orders">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-32 right-16 w-32 h-32 bg-accent/15 rounded-full blur-2xl animate-pulse" style={{animationDelay: '1.5s'}}></div>
          <div className="absolute top-1/2 left-10 w-28 h-28 bg-primary/10 rounded-full blur-xl animate-pulse" style={{animationDelay: '3s'}}></div>
        </div>

        <div className="max-w-4xl mx-auto p-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-6"
          >
            <Button
              variant="ghost"
              onClick={() => setLocation("/menu")}
              className="text-accent hover:text-accent hover:bg-primary/50 backdrop-blur-sm"
              data-testid="button-back"
            >
              <ArrowRight className="ml-2 h-5 w-5" />
              العودةللقائمة 
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl font-amiri font-bold bg-gradient-to-r from-amber-800 to-orange-700 bg-clip-text text-transparent mb-2">
              طلباتي
            </h1>
            <p className="text-accent font-cairo">
              تتبع طلباتك السابقةوالحالية 
            </p>
          </motion.div>

          {!isAuthenticated ? (
            <Card className="p-8 bg-white/90 backdrop-blur-lg shadow-2xl border-2 border-primary/50 text-center">
              <Coffee className="h-16 w-16 text-accent mx-auto mb-4" />
              <h2 className="text-2xl font-amiri font-bold text-accent mb-3">
                لا توجد طلبات بعد
              </h2>
              <p className="text-accent font-cairo mb-6">
                قم بتسجيل الدخول أو إنشاء طلب جديد لعرض طلباتك
              </p>
              <Button
                onClick={() => setLocation("/menu")}
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-cairo"
              >
                تصفح القائمة
              </Button>
            </Card>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex space-x-2 space-x-reverse">
                <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          ) : allOrders.length === 0 ? (
            <Card className="p-8 bg-white/90 backdrop-blur-lg shadow-2xl border-2 border-primary/50 text-center">
              <Coffee className="h-16 w-16 text-accent mx-auto mb-4" />
              <h2 className="text-2xl font-amiri font-bold text-accent mb-3">
                لا توجد طلبات بعد
              </h2>
              <p className="text-accent font-cairo mb-6">
                ابدأ طلبك الأول واستمتع بأفضل القهوة !
              </p>
              <Button
                onClick={() => setLocation("/menu")}
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-cairo"
              >
                تصفح القائمة
              </Button>
            </Card>
          ) : (
            <div className="space-y-6">
              {allOrders.map((order: OrderDisplay, index: number) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="space-y-4">
                    <Card className="p-6 bg-white/90 backdrop-blur-lg shadow-lg border-2 border-primary/50">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Coffee className="h-5 w-5 text-accent" />
                            <h3 className="text-lg font-cairo font-bold text-accent">
                              طلب #{order.orderNumber.includes('-') ? order.orderNumber.split('-').pop() : order.orderNumber}
                            </h3>
                          </div>
                          <p className="text-sm text-accent font-cairo">
                            {new Date(order.createdAt).toLocaleDateString('ar-SA', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <div className="text-left">
                          <span className="text-2xl font-bold text-accent font-cairo">
                            {Number(order.totalAmount).toFixed(2)} ريال
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {Array.isArray(order.items) ? order.items.map((item: any, i: number) => (
                          <div key={i} className="flex justify-between text-sm bg-background p-2 rounded-lg">
                            <span className="text-accent font-cairo">
                              {item.nameAr || item.name} × {item.quantity}
                            </span>
                            <span className="text-accent font-bold">
                              {(parseFloat(item.price || "0") * (item.quantity || 1)).toFixed(2)} ريال
                            </span>
                          </div>
                        )) : null}
                      </div>
                    </Card>

                    <OrderTracker order={order} />

                    {order.status === 'ready' && (
                      <CarPickupForm order={order} customer={customer} />
                    )}

                    {(order.status === 'ready' || order.status === 'completed') && (
                      <ReceiptInvoice order={order} />
                    )}

                    {order.customerNotes && (
                      <div className="bg-primary/20 rounded-lg p-3 mb-4 border border-primary/20">
                        <p className="text-accent text-sm font-semibold mb-1">ملاحظات العميل:</p>
                        <p className="text-white text-sm" data-testid={`text-customer-notes-${order.id}`}>
                          {order.customerNotes}
                        </p>
                      </div>
                    )}

                    {order.status === 'cancelled' && (order as any).cancellationReason && (
                      <div className="bg-red-900/20 rounded-lg p-3 mb-4 border border-red-500/20">
                        <p className="text-red-400 text-sm font-semibold mb-1">سبب الإلغاء:</p>
                        <p className="text-white text-sm">
                          {(order as any).cancellationReason}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </CustomerLayout>
  );
}