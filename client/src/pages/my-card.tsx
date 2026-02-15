import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { CustomerLayout } from "@/components/layouts/CustomerLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { CreditCard, History, Gift, ArrowUpRight, Wallet, Send, ArrowDownRight, Clock, CheckCircle2, QrCode, ArrowRight, ArrowLeft } from "lucide-react";
import { useCustomer } from "@/contexts/CustomerContext";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import QRCodeLib from "qrcode";

const POINTS_PER_SAR = 20;

export default function MyCardPage() {
  const { t, i18n } = useTranslation();
  const { customer } = useCustomer();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [recipientPhone, setRecipientPhone] = useState("");
  const [transferPoints, setTransferPoints] = useState("");
  const [pin, setPin] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [showQrDialog, setShowQrDialog] = useState(false);
  
  const { data: loyaltyCards, isLoading: isLoadingCards } = useQuery<any[]>({
    queryKey: ['/api/customer/loyalty-cards'],
    enabled: !!customer
  });

  const { data: transactions, isLoading: isLoadingTransactions } = useQuery<any[]>({
    queryKey: ['/api/customer/loyalty-transactions'],
    enabled: !!customer
  });

  const transferMutation = useMutation({
    mutationFn: async (data: { recipientPhone: string; points: number; pin: string }) => {
      const response = await apiRequest("POST", "/api/customer/transfer-points", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: t("card.transfer_success") || "تم التحويل بنجاح",
        description: t("card.transfer_success_desc", { points: transferPoints, name: data.recipientName }) || `تم تحويل ${transferPoints} نقطة إلى ${data.recipientName}`,
      });
      setTransferDialogOpen(false);
      setRecipientPhone("");
      setTransferPoints("");
      setPin("");
      queryClient.invalidateQueries({ queryKey: ['/api/customer/loyalty-cards'] });
      queryClient.invalidateQueries({ queryKey: ['/api/customer/loyalty-transactions'] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: t("card.transfer_failed") || "فشل التحويل",
        description: error.message || t("card.transfer_error") || "حدث خطأ أثناء التحويل",
      });
    }
  });

  const activeCard = loyaltyCards?.[0];
  const points = activeCard?.points ?? (customer as any)?.points ?? 0;
  const pendingPoints = activeCard?.pendingPoints ?? (customer as any)?.pendingPoints ?? 0;
  const sarValue = (points / POINTS_PER_SAR).toFixed(2);

  useEffect(() => {
    if (activeCard?.qrToken || activeCard?.cardNumber) {
      const qrData = activeCard.qrToken || activeCard.cardNumber;
      QRCodeLib.toDataURL(qrData, {
        width: 200,
        margin: 2,
        color: { dark: '#2D9B6E', light: '#FFFFFF' }
      }).then(setQrCodeUrl).catch(console.error);
    }
  }, [activeCard]);

  if (!customer && !isLoadingCards && !isLoadingTransactions) {
    return (
      <CustomerLayout>
        <div className="container max-w-lg mx-auto p-4 flex flex-col items-center justify-center min-h-[50vh] space-y-4">
          <p className="font-ibm-arabic text-muted-foreground">{t("card.login_required") || "يجب تسجيل الدخول لعرض البطاقة"}</p>
          <Button onClick={() => setLocation("/auth")} data-testid="button-login">{t("auth.login") || "تسجيل الدخول"}</Button>
        </div>
      </CustomerLayout>
    );
  }

  if (isLoadingCards || isLoadingTransactions) {
    return (
      <CustomerLayout>
        <div className="container max-w-lg mx-auto p-4 flex items-center justify-center min-h-[50vh]">
          <p className="font-ibm-arabic">{t("common.loading") || "جاري التحميل..."}</p>
        </div>
      </CustomerLayout>
    );
  }

  const handleTransfer = () => {
    if (!recipientPhone || !transferPoints || Number(transferPoints) <= 0) {
      toast({ variant: "destructive", title: t("card.fill_all_fields") || "يرجى ملء جميع الحقول" });
      return;
    }
    if (Number(transferPoints) > points) {
      toast({ variant: "destructive", title: t("card.insufficient_points") || "رصيد النقاط غير كافي" });
      return;
    }
    transferMutation.mutate({
      recipientPhone,
      points: Number(transferPoints),
      pin
    });
  };

  return (
    <CustomerLayout>
      <div className="container max-w-lg mx-auto p-4 space-y-6 pb-24" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setLocation("/")}
              data-testid="button-back"
            >
              {i18n.language === 'ar' ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
            </Button>
            <h1 className="text-2xl font-bold font-amiri text-primary" data-testid="text-page-title">{t("card.title") || "محفظتي"}</h1>
          </div>
          {qrCodeUrl && (
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setShowQrDialog(true)}
              data-testid="button-show-qr"
            >
              <QrCode className="w-5 h-5" />
            </Button>
          )}
        </div>

        <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-none shadow-xl overflow-hidden relative" data-testid="card-wallet">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12 blur-xl" />
          <CardHeader className="relative z-10">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <CardTitle className="text-xl opacity-90 font-amiri">{t("card.card_title") || "بطاقة كلووني"}</CardTitle>
                <p className="text-sm opacity-75 font-ibm-arabic">{customer?.name || t("card.default_customer_name") || 'عميل كلووني'}</p>
              </div>
              <Wallet className="w-8 h-8 opacity-50" />
            </div>
          </CardHeader>
          <CardContent className="space-y-6 relative z-10">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs opacity-75 font-medium font-ibm-arabic">{t("card.points_balance") || "رصيد النقاط"}</p>
                <h2 className="text-3xl font-bold font-ibm-arabic" data-testid="text-points-balance">{points}</h2>
                <p className="text-sm opacity-75 font-ibm-arabic">= {sarValue} {t("currency") || "ريال"}</p>
              </div>
              <div className="space-y-1 text-left">
                <p className="text-xs opacity-75 font-medium font-ibm-arabic">{t("card.pending_points") || "نقاط معلقة"}</p>
                <h2 className="text-2xl font-bold font-ibm-arabic text-yellow-200" data-testid="text-pending-points">{pendingPoints}</h2>
                <p className="text-xs opacity-60 font-ibm-arabic">{t("card.pending_desc") || "تضاف عند اكتمال الطلب"}</p>
              </div>
            </div>
            
            <div className="flex justify-between items-end">
              <div className="space-y-1">
                <p className="text-[10px] opacity-75 uppercase tracking-wider font-ibm-arabic">{t("card.card_number") || "رقم البطاقة"}</p>
                <p className="font-mono text-lg tracking-widest" data-testid="text-card-number">
                  {activeCard?.cardNumber?.replace(/(.{4})/g, '$1 ') || '**** **** ****'}
                </p>
              </div>
              <Badge variant="secondary" className="bg-white/20 text-white border-none text-[10px] font-ibm-arabic">
                {t("card.active") || "نشطة"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800" data-testid="card-points-info">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <Gift className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-bold font-ibm-arabic text-amber-800 dark:text-amber-200">{t("card.loyalty_system") || "نظام النقاط"}</p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-ibm-arabic">{t("card.loyalty_desc") || "10 نقاط لكل مشروب • 100 نقطة = 5 ريال"}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-3">
              <Button 
                variant="ghost" 
                size="lg" 
                className="w-full flex flex-col gap-1"
                onClick={() => setTransferDialogOpen(true)}
                data-testid="button-transfer-points"
              >
                <Send className="w-5 h-5 text-primary" />
                <span className="text-sm font-ibm-arabic">{t("card.transfer_points") || "تحويل نقاط"}</span>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <Button 
                variant="ghost" 
                size="lg" 
                className="w-full flex flex-col gap-1"
                onClick={() => setLocation("/my-orders")}
                data-testid="button-my-orders"
              >
                <History className="w-5 h-5 text-primary" />
                <span className="text-sm font-ibm-arabic">{t("nav.my_orders") || "طلباتي"}</span>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="font-bold text-lg font-amiri">{t("card.recent_transactions") || "آخر العمليات"}</h3>
          </div>
          
          <div className="space-y-3">
            {transactions && transactions.length > 0 ? (
              transactions.slice(0, 5).map((tx: any, idx: number) => (
                <Card key={tx.id || idx} className="bg-card/30 border-none shadow-sm hover:bg-card/50 transition-colors" data-testid={`card-transaction-${idx}`}>
                  <CardContent className="p-3 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        tx.type === 'earn' || tx.type === 'transfer_in' 
                          ? 'bg-green-500/10 text-green-600' 
                          : tx.type === 'pending' 
                            ? 'bg-yellow-500/10 text-yellow-600'
                            : 'bg-primary/10 text-primary'
                      }`}>
                        {tx.type === 'earn' || tx.type === 'transfer_in' ? (
                          <ArrowDownRight className="w-4 h-4" />
                        ) : tx.type === 'pending' ? (
                          <Clock className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold font-ibm-arabic">{i18n.language === 'ar' ? (tx.descriptionAr || (tx.type === 'earn' ? 'كسب نقاط' : tx.type === 'transfer_in' ? 'استلام نقاط' : tx.type === 'transfer_out' ? 'تحويل نقاط' : 'استبدال نقاط')) : (tx.descriptionEn || tx.descriptionAr || tx.type)}</p>
                        <p className="text-[10px] text-muted-foreground font-ibm-arabic">
                          {new Date(tx.createdAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US')}
                        </p>
                      </div>
                    </div>
                    <div className={`font-bold font-ibm-arabic ${
                      tx.type === 'earn' || tx.type === 'transfer_in' 
                        ? 'text-green-600' 
                        : tx.type === 'pending'
                          ? 'text-yellow-600'
                          : 'text-primary'
                    }`}>
                      {tx.type === 'earn' || tx.type === 'transfer_in' ? '+' : '-'}{Math.abs(tx.points)}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-10 opacity-50">
                <History className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p className="text-sm font-ibm-arabic">{t("card.no_transactions") || "لا توجد عمليات سابقة"}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent className="max-w-md" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'} data-testid="dialog-transfer-points">
          <DialogHeader>
            <DialogTitle className="font-amiri text-xl flex items-center gap-2">
              <Send className="w-5 h-5" />
              {t("card.transfer_points") || "تحويل نقاط"}
            </DialogTitle>
            <DialogDescription className="font-ibm-arabic">
              {t("card.transfer_desc") || "أدخل رقم جوال المستلم وعدد النقاط المراد تحويلها"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="font-ibm-arabic">{t("card.recipient_phone") || "رقم جوال المستلم"}</Label>
              <Input
                type="tel"
                placeholder="05xxxxxxxx"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                dir="ltr"
                data-testid="input-recipient-phone"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-ibm-arabic">{t("card.points_amount") || "عدد النقاط"}</Label>
              <Input
                type="number"
                placeholder="100"
                value={transferPoints}
                onChange={(e) => setTransferPoints(e.target.value)}
                min="1"
                max={points}
                data-testid="input-transfer-points"
              />
              <p className="text-xs text-muted-foreground font-ibm-arabic">
                {t("card.available_balance", { points }) || `الرصيد المتاح: ${points} نقطة`}
              </p>
            </div>
            <div className="space-y-2">
              <Label className="font-ibm-arabic">{t("card.pin") || "الرقم السري (اختياري)"}</Label>
              <Input
                type="password"
                placeholder="****"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                data-testid="input-pin"
              />
            </div>
            
            {transferPoints && Number(transferPoints) > 0 && (
              <Card className="bg-muted/50">
                <CardContent className="p-3 text-center">
                  <p className="text-sm font-ibm-arabic text-muted-foreground">{t("card.will_transfer") || "سيتم تحويل"}</p>
                  <p className="text-2xl font-bold text-primary">{transferPoints} {t("card.points") || "نقطة"}</p>
                  <p className="text-xs text-muted-foreground font-ibm-arabic">
                    = {(Number(transferPoints) / POINTS_PER_SAR).toFixed(2)} {t("currency") || "ريال"}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setTransferDialogOpen(false)} data-testid="button-cancel-transfer">
              {t("common.cancel") || "إلغاء"}
            </Button>
            <Button 
              onClick={handleTransfer} 
              disabled={transferMutation.isPending}
              data-testid="button-confirm-transfer"
            >
              {transferMutation.isPending ? t("card.transferring") || "جاري التحويل..." : t("card.confirm_transfer") || "تأكيد التحويل"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showQrDialog} onOpenChange={setShowQrDialog}>
        <DialogContent className="max-w-sm" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'} data-testid="dialog-qr-code">
          <DialogHeader>
            <DialogTitle className="font-amiri text-xl flex items-center gap-2 justify-center">
              <QrCode className="w-5 h-5" />
              {t("card.qr_title") || "رمز البطاقة"}
            </DialogTitle>
            <DialogDescription className="font-ibm-arabic text-center">
              {t("card.qr_desc") || "اعرض هذا الرمز للكاشير لكسب النقاط"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center py-6">
            {qrCodeUrl && (
              <div className="bg-white p-4 rounded-xl shadow-lg">
                <img 
                  src={qrCodeUrl} 
                  alt="QR Code" 
                  className="w-48 h-48"
                  data-testid="img-qr-code"
                />
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-4 font-mono" data-testid="text-card-number-qr">
              {activeCard?.cardNumber || ''}
            </p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQrDialog(false)} className="w-full" data-testid="button-close-qr">
              {t("common.close") || "إغلاق"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CustomerLayout>
  );
}
