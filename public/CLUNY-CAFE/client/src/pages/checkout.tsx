import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useCartStore } from "@/lib/cart-store";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import PaymentMethods from "@/components/payment-methods";
import { customerStorage } from "@/lib/customer-storage";
import { useCustomer } from "@/contexts/CustomerContext";
import { useLoyaltyCard } from "@/hooks/useLoyaltyCard";
import { User, Gift, CheckCircle, Sparkles, Shield, Loader2, KeyRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { PaymentMethodInfo, PaymentMethod } from "@shared/schema";

export default function CheckoutPage() {
  const { t, i18n } = useTranslation();
  const [, setLocation] = useLocation();
  const { cartItems, clearCart, getFinalTotal, deliveryInfo } = useCartStore();
  const { toast } = useToast();
  const isAr = i18n.language === 'ar';

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [showSuccessPage, setShowSuccessPage] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPassword, setCustomerPassword] = useState("");
  const [wantToRegister, setWantToRegister] = useState(false);
  const [customerNotes, setCustomerNotes] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [isValidatingDiscount, setIsValidatingDiscount] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState<{code: string, percentage: number, isOffer?: boolean} | null>(null);
  const [pointsRedeemed, setPointsRedeemed] = useState(0);
  const [usePoints, setUsePoints] = useState(false);
  const [pointsVerified, setPointsVerified] = useState(false);
  const [pointsVerificationToken, setPointsVerificationToken] = useState("");
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [isRequestingCode, setIsRequestingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const { card: loyaltyCard, refetch: refetchLoyaltyCard } = useLoyaltyCard();

  const pointsToSar = (pts: number) => (pts / 100) * 5;

  const getFinalTotalWithPoints = () => {
    let total = getFinalTotal();
    if (appliedDiscount) {
      total = total * (1 - appliedDiscount.percentage / 100);
    }
    if (usePoints && pointsVerified) {
      total = Math.max(0, total - pointsToSar(pointsRedeemed));
    }
    return total;
  };
  const [isRegistering, setIsRegistering] = useState(false);
  const { customer, setCustomer } = useCustomer();

  useEffect(() => {
    if (customer) {
      setCustomerName(customer.name);
      setCustomerPhone(customer.phone);
      if (customer.email) setCustomerEmail(customer.email);
    }
  }, [customer]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment') === 'callback') {
      const storedOrderData = sessionStorage.getItem('pendingOrderData');
      const storedSessionId = sessionStorage.getItem('paymentSessionId');
      const storedProvider = sessionStorage.getItem('paymentProvider');

      if (storedOrderData && storedSessionId) {
        (async () => {
          try {
            const verifyRes = await apiRequest("POST", "/api/payments/verify", {
              sessionId: storedSessionId,
              provider: storedProvider,
            });
            const verifyData = await verifyRes.json();

            if (verifyData.verified) {
              const orderData = JSON.parse(storedOrderData);
              orderData.paymentStatus = 'paid';
              orderData.transactionId = verifyData.transactionId;
              sessionStorage.removeItem('pendingOrderData');
              sessionStorage.removeItem('paymentSessionId');
              sessionStorage.removeItem('paymentProvider');
              createOrderMutation.mutate(orderData);
            } else {
              sessionStorage.removeItem('pendingOrderData');
              sessionStorage.removeItem('paymentSessionId');
              sessionStorage.removeItem('paymentProvider');
              toast({ variant: "destructive", title: "فشل الدفع", description: verifyData.error || "لم يتم التحقق من الدفع" });
            }
          } catch {
            toast({ variant: "destructive", title: "خطأ", description: "فشل التحقق من حالة الدفع" });
          }
        })();
      }
      window.history.replaceState({}, '', '/checkout');
    }
  }, []);

  useEffect(() => {
    const activeOffer = customerStorage.getActiveOffer();
    if (activeOffer && activeOffer.discount > 0 && !appliedDiscount) {
      const discountPercentage = activeOffer.type === 'loyalty' 
        ? 0 
        : activeOffer.discount;
      
      if (discountPercentage > 0) {
        setAppliedDiscount({
          code: activeOffer.title,
          percentage: discountPercentage,
          isOffer: true
        });
        toast({
          title: t("points.offer_applied"),
          description: `${activeOffer.title} - ${t("points.discount")} ${discountPercentage}%`,
        });
      }
    }
  }, []);

  const { data: paymentMethods = [] } = useQuery<PaymentMethodInfo[]>({
    queryKey: ["/api/payment-methods"],
    queryFn: async () => {
      const res = await fetch(`/api/payment-methods`);
      return res.json();
    }
  });

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const response = await apiRequest("POST", "/api/orders", orderData);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Order failed");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setOrderDetails(data);
      clearCart();
      customerStorage.clearActiveOffer();
      setShowSuccessPage(true);
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/loyalty/cards/phone"] });
      refetchLoyaltyCard();
      const displayNum = data.orderNumber.includes('-') ? data.orderNumber.split('-').pop() : data.orderNumber;
      toast({ title: t("checkout.order_success"), description: `${t("tracking.order_number")}: ${displayNum}` });
    },
    onError: (error) => toast({ variant: "destructive", title: t("checkout.order_error"), description: error.message }),
  });

  const handleValidateDiscount = async () => {
    if (!discountCode.trim()) return;
    setIsValidatingDiscount(true);
    try {
      const response = await fetch('/api/discount-codes/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: discountCode.trim(), customerId: customer?.id }),
      });
      const data = await response.json();
      if (response.ok && data.valid) {
        setAppliedDiscount({ code: discountCode.trim(), percentage: data.discountPercentage });
      } else {
        setAppliedDiscount(null);
        toast({ variant: "destructive", title: t("checkout.invalid_discount") });
      }
    } finally { setIsValidatingDiscount(false); }
  };

  const handleRequestVerificationCode = async () => {
    if (!pointsRedeemed || pointsRedeemed <= 0) {
      toast({ variant: "destructive", title: t("points.enter_points_amount") });
      return;
    }

    const phone = customer?.phone || customerPhone;
    if (!phone) {
      toast({ variant: "destructive", title: t("points.phone_required") });
      return;
    }

    setIsRequestingCode(true);
    try {
      const response = await apiRequest("POST", "/api/loyalty/points/request-code", {
        phone,
        points: pointsRedeemed,
        requestedBy: 'customer',
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setShowVerificationDialog(true);
        if (data.devCode) setDevCode(data.devCode);
        toast({
          title: t("points.code_sent"),
          description: data.maskedEmail
            ? t("points.code_sent_to_email", { email: data.maskedEmail })
            : t("points.code_generated"),
        });
      } else {
        toast({ variant: "destructive", title: data.error || t("points.code_error") });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: t("points.code_error") });
    } finally {
      setIsRequestingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim() || verificationCode.length < 4) {
      toast({ variant: "destructive", title: t("points.enter_valid_code") });
      return;
    }

    const phone = customer?.phone || customerPhone;
    setIsVerifyingCode(true);
    try {
      const response = await apiRequest("POST", "/api/loyalty/points/verify-code", {
        phone,
        code: verificationCode.trim(),
      });
      const data = await response.json();
      if (response.ok && data.verified) {
        setPointsVerified(true);
        setUsePoints(true);
        setPointsVerificationToken(data.verificationToken);
        setShowVerificationDialog(false);
        setVerificationCode("");
        setDevCode(null);
        toast({ title: t("points.verified_success"), description: t("points.points_will_be_deducted", { amount: pointsToSar(pointsRedeemed).toFixed(2) }) });
      } else {
        toast({ variant: "destructive", title: data.error || t("points.invalid_code") });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: t("points.verification_error") });
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const handleCancelPoints = () => {
    setUsePoints(false);
    setPointsVerified(false);
    setPointsVerificationToken("");
    setPointsRedeemed(0);
    setVerificationCode("");
    setDevCode(null);
  };

  const handleProceedPayment = () => {
    if (!selectedPaymentMethod) {
      toast({ variant: "destructive", title: t("checkout.select_payment") });
      return;
    }
    if (!customerName.trim()) {
      toast({ variant: "destructive", title: t("checkout.enter_customer_name") });
      return;
    }
    setShowConfirmation(true);
  };

  const isOnlinePaymentMethod = (method: string | null) => {
    if (!method) return false;
    const onlineMethods = ['neoleap', 'geidea', 'apple_pay', 'neoleap-apple-pay', 'bank_card'];
    return onlineMethods.includes(method);
  };

  const confirmAndCreateOrder = async () => {
    let finalTotal = getFinalTotalWithPoints();

    if (selectedPaymentMethod === ('wallet' as any) && (customer?.walletBalance || 0) < finalTotal) {
      toast({ variant: "destructive", title: t("points.insufficient_wallet") });
      return;
    }

    let activeCustomerId = customer?.id;
    if (!activeCustomerId && wantToRegister) {
      setIsRegistering(true);
      const regRes = await fetch("/api/customers/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: customerName, phone: customerPhone, email: customerEmail, password: customerPassword })
      });
      if (regRes.ok) {
        const newC = await regRes.json();
        activeCustomerId = newC.id;
        setCustomer(newC);
      }
      setIsRegistering(false);
    }

    const orderData = {
      customerId: activeCustomerId,
      customerName: customerName,
      customerPhone: customerPhone,
      customerEmail: customerEmail,
      items: cartItems.map(i => ({
        coffeeItemId: i.coffeeItemId,
        quantity: i.quantity,
        price: i.coffeeItem?.price || 0,
        nameAr: i.coffeeItem?.nameAr || ""
      })),
      totalAmount: finalTotal,
      paymentMethod: selectedPaymentMethod as PaymentMethod,
      status: "pending",
      branchId: deliveryInfo?.branchId || "default",
      orderType: deliveryInfo?.type === 'car-pickup' ? 'car_pickup' : (deliveryInfo?.type === 'pickup' && deliveryInfo?.dineIn ? 'dine-in' : 'regular'),
      deliveryType: deliveryInfo?.type === 'car-pickup' ? 'car_pickup' : deliveryInfo?.type || 'pickup',
      customerNotes: customerNotes,
      discountCode: appliedDiscount?.code,
      pointsRedeemed: (usePoints && pointsVerified) ? pointsRedeemed : 0,
      pointsValue: (usePoints && pointsVerified) ? pointsToSar(pointsRedeemed) : 0,
      pointsVerificationToken: (usePoints && pointsVerified) ? pointsVerificationToken : undefined,
      ...(deliveryInfo?.type === 'car-pickup' && deliveryInfo?.carInfo ? {
        carType: deliveryInfo.carInfo.carType,
        carColor: deliveryInfo.carInfo.carColor,
        plateNumber: deliveryInfo.carInfo.plateNumber,
      } : {}),
    };

    if (isOnlinePaymentMethod(selectedPaymentMethod)) {
      try {
        const initRes = await apiRequest("POST", "/api/payments/init", {
          amount: finalTotal,
          currency: "SAR",
          orderId: `temp-${Date.now()}`,
          customerName: customerName,
          customerEmail: customerEmail || undefined,
          customerPhone: customerPhone || undefined,
          paymentMethod: selectedPaymentMethod,
          returnUrl: `${window.location.origin}/checkout?payment=callback`,
        });
        const initData = await initRes.json();
        if (initData.redirectUrl) {
          sessionStorage.setItem('pendingOrderData', JSON.stringify(orderData));
          sessionStorage.setItem('paymentSessionId', initData.sessionId || '');
          sessionStorage.setItem('paymentProvider', initData.provider || '');
          window.location.href = initData.redirectUrl;
          return;
        } else {
          toast({ variant: "destructive", title: "خطأ", description: initData.error || "فشل بدء عملية الدفع" });
          return;
        }
      } catch (err: any) {
        toast({ variant: "destructive", title: "خطأ في الدفع", description: err.message || "فشل الاتصال ببوابة الدفع" });
        return;
      }
    }

    createOrderMutation.mutate(orderData);
  };

  if (showSuccessPage) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-[#533d2d]" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl text-center space-y-6">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
          <h2 className="text-3xl font-bold text-accent">{t("nav.thank_you")}</h2>
          <p>{t("checkout.order_desc")} <span className="font-bold text-primary">#{orderDetails?.orderNumber?.includes('-') ? orderDetails.orderNumber.split('-').pop() : orderDetails?.orderNumber}</span></p>
          <Button onClick={() => setLocation("/menu")} className="w-full h-12 bg-primary" data-testid="button-back-to-menu">{t("cart.continue_shopping")}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 bg-[#21302f]" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-white text-center mb-8">{t("nav.checkout")}</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader><CardTitle>{t("checkout.order_summary")}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {cartItems.map((item, index) => (
                  <div key={index} className="flex justify-between items-center gap-2 text-sm" data-testid={`cart-item-${index}`}>
                    <span>{isAr ? item.coffeeItem?.nameAr : item.coffeeItem?.nameEn} × {item.quantity}</span>
                    <span className="font-bold">{((item.coffeeItem?.price || 0) * item.quantity).toFixed(2)} {t("currency")}</span>
                  </div>
                ))}
                {appliedDiscount && (
                  <div className="flex justify-between items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-950/30 p-2 rounded">
                    <span>{t("points.discount")} ({appliedDiscount.percentage}%)</span>
                    <span>-{(getFinalTotal() * appliedDiscount.percentage / 100).toFixed(2)} {t("currency")}</span>
                  </div>
                )}
                {usePoints && pointsVerified && (
                  <div className="flex justify-between items-center gap-2 text-sm text-blue-600 bg-blue-50 dark:bg-blue-950/30 p-2 rounded">
                    <span>{t("points.points_discount")}</span>
                    <span>-{pointsToSar(pointsRedeemed).toFixed(2)} {t("currency")}</span>
                  </div>
                )}
                <div className="pt-4 border-t font-bold text-xl flex justify-between gap-2">
                  <span>{t("cart.total")}:</span>
                  <span className="text-primary">
                    {getFinalTotalWithPoints().toFixed(2)} {t("currency")}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="pt-6 space-y-4">
                {customer ? (
                  <div className="bg-muted/30 p-4 rounded-lg flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-accent" />
                      <div>
                        <p className="font-semibold">{customer.name}</p>
                        <p className="text-sm text-muted-foreground">{customer.phone}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder={t("checkout.full_name")} data-testid="input-customer-name" />
                    <Input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder={t("checkout.phone")} data-testid="input-customer-phone" />
                    <div className="flex items-center gap-2">
                      <Checkbox id="register" checked={wantToRegister} onCheckedChange={checked => setWantToRegister(!!checked)} data-testid="checkbox-register" />
                      <Label htmlFor="register">{t("checkout.want_to_register")}</Label>
                    </div>
                  </div>
                )}

                <PaymentMethods
                  paymentMethods={paymentMethods}
                  selectedMethod={selectedPaymentMethod}
                  onSelectMethod={setSelectedPaymentMethod}
                />

                {appliedDiscount?.isOffer && (
                  <div className="border rounded-lg p-4 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="font-semibold text-green-800 dark:text-green-300">{appliedDiscount.code}</p>
                          <p className="text-sm text-green-600">{t("points.discount")} {appliedDiscount.percentage}% {t("points.applied")}</p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setAppliedDiscount(null);
                          customerStorage.clearActiveOffer();
                        }}
                        className="text-red-500"
                        data-testid="button-remove-offer"
                      >
                        {t("points.remove")}
                      </Button>
                    </div>
                  </div>
                )}

                <div className="border rounded-lg p-4 bg-orange-50 dark:bg-orange-950/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Gift className="w-5 h-5 text-orange-600" />
                    <Label className="font-semibold">{t("checkout.have_discount")}</Label>
                  </div>
                  <div className="flex gap-2">
                    <Input 
                      value={discountCode} 
                      onChange={e => setDiscountCode(e.target.value)} 
                      placeholder={t("checkout.enter_discount")}
                      disabled={!!appliedDiscount}
                      data-testid="input-discount-code"
                    />
                    <Button onClick={handleValidateDiscount} disabled={!!appliedDiscount} data-testid="button-apply-discount">{t("checkout.apply")}</Button>
                  </div>
                  {appliedDiscount && !appliedDiscount.isOffer && (
                    <p className="text-sm text-green-600 mt-2">{t("points.applied")}: {appliedDiscount.code} ({appliedDiscount.percentage}%)</p>
                  )}
                </div>

                {customer && loyaltyCard && (loyaltyCard.points || 0) > 0 && (
                  <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-5 h-5 text-blue-600" />
                      <Label className="font-semibold text-blue-800 dark:text-blue-300">{t("points.cluny_points")}</Label>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center gap-2 flex-wrap">
                        <span className="text-sm text-blue-700 dark:text-blue-400">{t("points.your_balance")}: {loyaltyCard.points} {t("points.points_unit")}</span>
                        <span className="text-sm font-bold text-blue-800 dark:text-blue-300">≈ {pointsToSar(loyaltyCard.points || 0).toFixed(2)} {t("currency")}</span>
                      </div>

                      {pointsVerified ? (
                        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3 space-y-2">
                          <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                            <Shield className="w-4 h-4" />
                            <span className="text-sm font-semibold">{t("points.verified_and_active")}</span>
                          </div>
                          <div className="flex justify-between items-center gap-2 flex-wrap">
                            <span className="text-sm">{pointsRedeemed} {t("points.points_unit")} = {pointsToSar(pointsRedeemed).toFixed(2)} {t("currency")}</span>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={handleCancelPoints}
                              data-testid="button-cancel-points"
                            >
                              {t("points.cancel_use")}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-3">
                            <Input
                              type="number"
                              min={0}
                              max={loyaltyCard.points}
                              value={pointsRedeemed || ''}
                              onChange={(e) => {
                                const val = Math.min(Math.max(0, Number(e.target.value)), loyaltyCard.points || 0);
                                setPointsRedeemed(val);
                              }}
                              placeholder={t("points.enter_points")}
                              className="bg-white dark:bg-background"
                              data-testid="input-points-redeem"
                            />
                            <Button 
                              onClick={handleRequestVerificationCode}
                              disabled={isRequestingCode || !pointsRedeemed || pointsRedeemed <= 0}
                              data-testid="button-request-points-code"
                            >
                              {isRequestingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                              <span className="mr-1">{t("points.send_code")}</span>
                            </Button>
                          </div>
                          {pointsRedeemed > 0 && (
                            <p className="text-xs text-blue-600 dark:text-blue-400">
                              {t("points.will_deduct", { amount: pointsToSar(pointsRedeemed).toFixed(2) })}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {t("points.verification_required")}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                )}

                <Button onClick={handleProceedPayment} className="w-full h-14 text-lg" data-testid="button-proceed-payment">{t("checkout.confirm_order")}</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={showVerificationDialog} onOpenChange={setShowVerificationDialog}>
        <DialogContent dir={isAr ? 'rtl' : 'ltr'} className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              {t("points.verify_title")}
            </DialogTitle>
            <DialogDescription>{t("points.verify_desc")}</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="text-center bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">{t("points.redeeming")}</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{pointsRedeemed} {t("points.points_unit")}</p>
              <p className="text-sm text-blue-600">=  {pointsToSar(pointsRedeemed).toFixed(2)} {t("currency")}</p>
            </div>
            <div className="space-y-2">
              <Label>{t("points.enter_code")}</Label>
              <Input
                type="text"
                maxLength={4}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                placeholder="1234"
                className="text-center text-2xl tracking-widest font-bold"
                dir="ltr"
                data-testid="input-verification-code"
              />
            </div>
            {devCode && (
              <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-2 text-center">
                <p className="text-xs text-yellow-700 dark:text-yellow-400">{t("points.dev_code")}: <span className="font-bold text-lg">{devCode}</span></p>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowVerificationDialog(false)} className="flex-1" data-testid="button-cancel-verify">
              {t("points.cancel")}
            </Button>
            <Button 
              onClick={handleVerifyCode} 
              disabled={isVerifyingCode || verificationCode.length < 4}
              className="flex-1"
              data-testid="button-confirm-verify"
            >
              {isVerifyingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {t("points.verify")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent dir={isAr ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>{t("checkout.confirm_title")}</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center">
            <p className="text-lg">{t("checkout.confirm_question")}</p>
            <p className="text-2xl font-bold text-primary mt-2">{getFinalTotalWithPoints().toFixed(2)} {t("currency")}</p>
            {usePoints && pointsVerified && (
              <p className="text-sm text-blue-600 mt-1">{t("points.includes_points_discount", { points: pointsRedeemed, amount: pointsToSar(pointsRedeemed).toFixed(2) })}</p>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConfirmation(false)} className="flex-1" data-testid="button-cancel-order">{t("points.cancel")}</Button>
            <Button onClick={confirmAndCreateOrder} className="flex-1 bg-green-600" data-testid="button-confirm-order">{t("checkout.confirm_pay")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
