import { useState, memo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/cart-store";
import { useCustomer } from "@/contexts/CustomerContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import PaymentMethods from "./payment-methods";
import { generatePDF } from "@/lib/pdf-generator";
import { saveOrderLocally } from "@/lib/local-orders";
import { CreditCard, FileText, MessageCircle, Check, ArrowRight, Coffee, ShoppingCart, Wallet, Star, Phone, Truck, Store, MapPin, Upload, User } from "lucide-react";
import type { PaymentMethodInfo, PaymentMethod, Branch } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

type CheckoutStep = 'review' | 'delivery' | 'payment' | 'confirmation' | 'success';
type DeliveryType = 'pickup' | 'delivery' | 'curbside' | null;

const CheckoutModal = memo(() => {
 const [, navigate] = useLocation();
 const {
 cartItems,
 isCheckoutOpen,
 hideCheckout,
 clearCart,
 getTotalPrice
 } = useCartStore();
 const { customer } = useCustomer();

 const { toast } = useToast();
 const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
 const [currentStep, setCurrentStep] = useState<CheckoutStep>('review');
 const [orderDetails, setOrderDetails] = useState<any>(null);

 // State for customer form fields
 const [customerName, setCustomerName] = useState(customer?.name || "");
 const [customerPhone, setCustomerPhone] = useState(customer?.phone || "");

 // Vehicle info state
 const [carType, setCarType] = useState(customer?.carType || "");
 const [carColor, setCarColor] = useState(customer?.carColor || "");
 const [carPlate, setCarPlate] = useState("");

 // Delivery/Pickup state
 const [deliveryType, setDeliveryType] = useState<DeliveryType>(null);
 const [selectedBranch, setSelectedBranch] = useState<string>("");
 const [deliveryAddress, setDeliveryAddress] = useState("");
 const [deliveryNotes, setDeliveryNotes] = useState("");
 
 // Receipt upload state
 const [receiptFile, setReceiptFile] = useState<File | null>(null);
 const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

 const { data: paymentMethods = [] } = useQuery<PaymentMethodInfo[]>({
 queryKey: ["/api/payment-methods"],
 enabled: isCheckoutOpen,
 });

 const { data: branches = [] } = useQuery<Branch[]>({
 queryKey: ["/api/branches"],
 enabled: isCheckoutOpen && deliveryType === 'pickup',
 });

 const createOrderMutation = useMutation({
 mutationFn: async (orderData: any) => {
 const response = await apiRequest("POST", "/api/orders", orderData);
 return response.json();
 },
 onSuccess: (order) => {
 setOrderDetails(order);
 if (!customer) saveOrderLocally(order.orderNumber);
 if (selectedPaymentMethod === 'cash') handlePaymentConfirmed(order);
 else setCurrentStep('confirmation');
 },
 onError: (error) => {
 toast({
 variant: "destructive",
 title: "خطأ في إنشاء الطلب",
 description: error.message,
 });
 },
 });

 const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (file) {
 if (file.size > 5 * 1024 * 1024) {
 toast({ variant: "destructive", title: "الملف كبير جداً", description: "يرجى اختيار صورة أقل من 5 ميجابايت" });
 return;
 }
 setReceiptFile(file);
 const reader = new FileReader();
 reader.onloadend = () => setReceiptPreview(reader.result as string);
 reader.readAsDataURL(file);
 }
 };

 const handleProceedDelivery = () => {
 if (!deliveryType) {
 toast({ variant: "destructive", title: "يرجى اختيار طريقة الاستلام" });
 return;
 }
 if (deliveryType === 'pickup' && !selectedBranch) {
 toast({ variant: "destructive", title: "يرجى اختيار الفرع" });
 return;
 }
 if (deliveryType === 'delivery' && !deliveryAddress.trim()) {
 toast({ variant: "destructive", title: "يرجى إدخال عنوان التوصيل" });
 return;
 }
 if (deliveryType === 'curbside' && (!carType.trim() || !carColor.trim() || !carPlate.trim())) {
   toast({ variant: "destructive", title: "يرجى إدخال بيانات السيارة كاملة" });
   return;
 }
 setCurrentStep('payment');
 };

 const handleProceedPayment = () => {
 if (!selectedPaymentMethod) {
 toast({ variant: "destructive", title: "يرجى اختيار طريقة الدفع" });
 return;
 }
 const selectedMethodInfo = paymentMethods.find(m => m.id === selectedPaymentMethod);
 if (selectedMethodInfo?.requiresReceipt && !receiptFile) {
 toast({ variant: "destructive", title: "يرجى رفع إيصال الدفع" });
 return;
 }
 if (!customerName || !customerPhone) {
 toast({ variant: "destructive", title: "يرجى إدخال الاسم ورقم الهاتف" });
 return;
 }

    const orderData = {
      items: cartItems.map(item => ({
        coffeeItemId: item.coffeeItemId,
        quantity: item.quantity,
        price: item.coffeeItem?.price || "0",
        name: item.coffeeItem?.nameAr || "",
      })),
      totalAmount: getTotalPrice().toString(),
      paymentMethod: selectedPaymentMethod,
      status: "pending",
      customerId: customer?.id || null,
      customerInfo: { name: customerName, phone: customerPhone },
      deliveryType: deliveryType,
      carPickup: deliveryType === 'curbside' || deliveryType === 'car-pickup',
      carInfo: (deliveryType === 'curbside' || deliveryType === 'car-pickup') ? {
        carType: carType,
        carColor: carColor,
        plateNumber: carPlate
      } : null,
      carType: (deliveryType === 'curbside' || deliveryType === 'car-pickup') ? carType : null,
      carColor: (deliveryType === 'curbside' || deliveryType === 'car-pickup') ? carColor : null,
      carPlate: (deliveryType === 'curbside' || deliveryType === 'car-pickup') ? carPlate : null,
      plateNumber: (deliveryType === 'curbside' || deliveryType === 'car-pickup') ? carPlate : null,
      branchId: (deliveryType === 'pickup' || deliveryType === 'curbside' || deliveryType === 'car-pickup') ? selectedBranch : null,
      deliveryAddress: deliveryType === 'delivery' ? deliveryAddress : null,
      deliveryNotes: deliveryNotes || null,
      paymentReceiptUrl: receiptPreview || null,
      customerPhone: customerPhone,
    };
 createOrderMutation.mutate(orderData);
 };

 const handlePaymentConfirmed = async (order: any) => {
 try {
 const pdfBlob = await generatePDF(order, cartItems as any, selectedPaymentMethod as any);
 const url = URL.createObjectURL(pdfBlob);
 const link = document.createElement('a');
 link.href = url;
 link.download = `invoice-${order.orderNumber}.pdf`;
 link.click();
 URL.revokeObjectURL(url);
 setCurrentStep('success');
 toast({ title: "تم إنشاء الطلب بنجاح!" });
 setTimeout(() => {
 clearCart();
 hideCheckout();
 navigate(customer ? "/my-orders" : `/tracking?order=${order.orderNumber}`);
 }, 2000);
 } catch (error) {
 toast({ variant: "destructive", title: "خطأ في توليد الفاتورة" });
 }
 };

 const handleClose = () => {
 hideCheckout();
 setCurrentStep('review');
 setOrderDetails(null);
 setSelectedPaymentMethod(null);
 setDeliveryType(null);
 setReceiptFile(null);
 setReceiptPreview(null);
 };

 const steps = [
 { id: 'review', title: 'مراجعة الطلب', icon: ShoppingCart },
 { id: 'delivery', title: 'طريقة الاستلام', icon: Truck },
 { id: 'payment', title: 'طريقة الدفع', icon: Wallet },
 { id: 'confirmation', title: 'تأكيد الدفع', icon: Check },
 { id: 'success', title: 'تم بنجاح', icon: Star },
 ];

 const getCurrentStepIndex = () => steps.findIndex(step => step.id === currentStep);

 return (
 <Dialog open={isCheckoutOpen} onOpenChange={handleClose} data-testid="modal-checkout">
 <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-background via-card to-background border-primary/30" dir="rtl">
 <DialogHeader className="text-center pb-6">
 <DialogTitle className="flex items-center justify-center text-3xl font-bold text-primary font-amiri" data-testid="text-checkout-modal-title">
 <Coffee className="w-8 h-8 ml-3" />
 إتمام الطلب
 </DialogTitle>
 <p className="text-muted-foreground mt-2">"لكل لحظة قهوة ، لحظة نجاح"</p>
 </DialogHeader>

 <div className="flex items-center justify-center mb-8">
 <div className="flex items-center space-x-4 space-x-reverse">
 {steps.map((step, index) => {
 const isActive = step.id === currentStep;
 const isCompleted = index < getCurrentStepIndex();
 const StepIcon = step.icon;
 return (
 <div key={step.id} className="flex items-center">
 <div className={`relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${isActive ? 'bg-primary border-primary text-primary-foreground' : (isCompleted ? 'bg-primary/20 border-primary text-primary' : 'bg-muted border-muted-foreground/30 text-muted-foreground')}`}>
 {isCompleted ? <Check className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
 </div>
 {index < steps.length - 1 && <div className={`w-12 h-1 mx-2 rounded-full ${isCompleted ? 'bg-primary' : 'bg-muted'}`} />}
 </div>
 );
 })}
 </div>
 </div>

 <div className="space-y-6">
 {currentStep === 'review' && (
 <div className="space-y-6 animate-in fade-in duration-500">
 {!customer && (
 <Card>
 <CardHeader><CardTitle className="text-right flex items-center gap-2"><User className="w-5 h-5" /> معلومات العميل</CardTitle></CardHeader>
 <CardContent className="space-y-4">
 <div><Label>الاسم</Label><Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} dir="rtl" /></div>
 <div><Label>رقم الهاتف</Label><Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} dir="ltr" /></div>
 </CardContent>
 </Card>
 )}
 <div className="bg-card/50 rounded-xl p-6 border border-primary/20">
 <h3 className="text-lg font-semibold mb-4 flex items-center"><ShoppingCart className="w-5 h-5 ml-2" /> ملخص الطلب</h3>
 <div className="space-y-3 mb-4">
 {cartItems.map((item) => (
 <div key={item.coffeeItemId} className="flex justify-between items-center p-3 bg-background/50 rounded-lg">
 <span>{item.coffeeItem?.nameAr} × {item.quantity}</span>
 <span className="font-semibold text-primary">{(Number(item.coffeeItem?.price || 0) * item.quantity).toFixed(2)} ريال</span>
 </div>
 ))}
 </div>
 <div className="border-t border-primary/30 pt-4"><div className="flex justify-between items-center bg-primary/10 p-4 rounded-lg"><span className="text-lg font-semibold">المجموع الكلي:</span><span className="text-2xl font-bold text-primary">{getTotalPrice().toFixed(2)} ريال</span></div></div>
 </div>
 <Button onClick={() => setCurrentStep('delivery')} size="lg" className="w-full">متابعة</Button>
 </div>
 )}

 {currentStep === 'delivery' && (
 <div className="space-y-6 animate-in fade-in duration-500">
 <div className="bg-card/50 rounded-xl p-6 border border-primary/20">
 <RadioGroup value={deliveryType || ""} onValueChange={(v) => setDeliveryType(v as DeliveryType)}>
 <div className="space-y-4">
 <div className={`p-4 rounded-lg border-2 ${deliveryType === 'pickup' ? 'border-primary bg-primary/10' : 'border-border'}`} onClick={() => setDeliveryType('pickup')}>
 <div className="flex items-center space-x-3 space-x-reverse"><RadioGroupItem value="pickup" id="pickup" /><Label htmlFor="pickup" className="font-semibold">استلام من الفرع</Label></div>
 {deliveryType === 'pickup' && (
 <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)} className="w-full mt-2 p-2 rounded border bg-background">
 <option value="">-- اختر فرعاً --</option>
 {branches.map((b) => <option key={b.id} value={b.id}>{b.nameAr}</option>)}
 </select>
 )}
 </div>
 <div className={`p-4 rounded-lg border-2 ${deliveryType === 'delivery' ? 'border-primary bg-primary/10' : 'border-border'}`} onClick={() => setDeliveryType('delivery')}>
 <div className="flex items-center space-x-3 space-x-reverse"><RadioGroupItem value="delivery" id="delivery" /><Label htmlFor="delivery" className="font-semibold">توصيل للمنزل (15 ريال)</Label></div>
 {deliveryType === 'delivery' && (
 <div className="mt-2 space-y-2">
 <Textarea value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} placeholder="عنوان التوصيل" dir="rtl" />
 <Input value={deliveryNotes} onChange={(e) => setDeliveryNotes(e.target.value)} placeholder="ملاحظات" dir="rtl" />
 </div>
 )}
 </div>
                   <div className={`p-4 rounded-lg border-2 ${deliveryType === 'curbside' ? 'border-primary bg-primary/10' : 'border-border'}`} onClick={() => setDeliveryType('curbside')}>
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <RadioGroupItem value="curbside" id="curbside" />
                      <Label htmlFor="curbside" className="font-semibold flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4" />
                        استلام من السيارة
                      </Label>
                    </div>
                    {deliveryType === 'curbside' && (
                      <div className="mt-4 space-y-4 border-t pt-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>نوع السيارة</Label>
                            <Input 
                              value={carType} 
                              onChange={(e) => setCarType(e.target.value)} 
                              placeholder="مثال: تويوتا كامري" 
                              dir="rtl" 
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>لون السيارة</Label>
                            <Input 
                              value={carColor} 
                              onChange={(e) => setCarColor(e.target.value)} 
                              placeholder="مثال: أبيض" 
                              dir="rtl" 
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>رقم اللوحة</Label>
                          <Input 
                            value={carPlate} 
                            onChange={(e) => setCarPlate(e.target.value)} 
                            placeholder="مثال: أ ب ج 1234" 
                            dir="rtl" 
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </RadioGroup>
 </div>
 <div className="flex gap-3"><Button variant="outline" onClick={() => setCurrentStep('review')} className="flex-1">رجوع</Button><Button onClick={handleProceedDelivery} className="flex-1">متابعة</Button></div>
 </div>
 )}

 {currentStep === 'payment' && (
 <div className="space-y-6 animate-in fade-in duration-500">
 <div className="bg-card/50 rounded-xl p-6 border border-primary/20">
 <PaymentMethods paymentMethods={paymentMethods} selectedMethod={selectedPaymentMethod} onSelectMethod={setSelectedPaymentMethod} />
 {selectedPaymentMethod && paymentMethods.find(m => m.id === selectedPaymentMethod)?.requiresReceipt && (
 <div className="mt-4 p-4 border-2 border-dashed rounded-lg text-center">
 <Label htmlFor="receipt-upload" className="cursor-pointer">
 {receiptPreview ? <img src={receiptPreview} className="max-h-32 mx-auto" /> : <div><Upload className="mx-auto" /> اضغط لرفع الإيصال</div>}
 </Label>
 <input id="receipt-upload" type="file" onChange={handleReceiptUpload} className="hidden" />
 </div>
 )}
 </div>
 <div className="flex gap-3"><Button variant="outline" onClick={() => setCurrentStep('delivery')} className="flex-1">رجوع</Button><Button onClick={handleProceedPayment} disabled={createOrderMutation.isPending} className="flex-1">تأكيد الطلب</Button></div>
 </div>
 )}
 </div>
 </DialogContent>
 </Dialog>
 );
});

export default CheckoutModal;
