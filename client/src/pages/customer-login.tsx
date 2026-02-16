import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Coffee, User, Phone, UserX } from "lucide-react";
import { customerStorage } from "@/lib/customer-storage";
import { useToast } from "@/hooks/use-toast";

export default function CustomerLogin() {
 const [, setLocation] = useLocation();
 const { toast } = useToast();
 const [mode, setMode] = useState<'choice' | 'register' | 'guest'>('choice');
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // Set SEO metadata
  useEffect(() => {
    document.title = "تسجيل دخول العملاء - QIROX CAFE | ادخل الآن";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', 'تسجيل دخول عملاء QIROX CAFE - سجل الآن واستمتع بعروضنا الحصرية والمكافآت');
  }, []);

  const handleRegister = () => {
    if (!name.trim() || !phone.trim() || !email.trim()) {
      toast({
        title: "خطأ",
        description: "الرجاء إدخال الاسم ورقم الجوال والبريد الإلكتروني",
        variant: "destructive"
      });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({
        title: "خطأ",
        description: "البريد الإلكتروني غير صحيح",
        variant: "destructive"
      });
      return;
    }

    customerStorage.registerCustomer(name, phone, email);
    toast({
      title: "مرحباً بك!",
      description: `تم تسجيل الدخول بنجاح. تم إنشاء بطاقتك الخاصة`,
    });
    setLocation("/menu");
  };

 const handleGuestMode = () => {
 customerStorage.setGuestMode(true);
 toast({
 title: "وضع الضيف",
 description: "يمكنك الآن تصفح القائمةوإضافة طلبك",
 });
 setLocation("/menu");
 };

 if (mode === 'choice') {
 return (
 <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background flex flex-col items-center justify-center p-4" dir="rtl">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Coffee className="w-12 h-12 text-accent" />
          <h1 className="text-4xl font-bold font-playfair text-foreground">QIROX CAFE</h1>
        </div>
        <p className="text-muted-foreground text-lg font-cairo">لكل لحظة قهوة ، لحظة نجاح</p>
      </div>

 <div className="w-full max-w-md space-y-4">
 <Card className="bg-card border-border/50 backdrop-blur shadow-lg">
 <CardHeader className="text-center">
 <CardTitle className="text-2xl text-foreground font-playfair">مرحباً بك</CardTitle>
 <CardDescription className="text-muted-foreground">
 اختر طريقة المتابعة 
 </CardDescription>
 </CardHeader>
 <CardContent className="space-y-3">
 <Button 
 onClick={() => setMode('register')}
 className="w-full h-12 bg-gradient-to-r from-accent to-accent/90 hover:from-accent/95 hover:to-accent/85 text-accent-foreground text-base font-semibold"
 data-testid="button-login"
 >
 <User className="ml-2" />
 تسجيل دخول
 </Button>
 
 <Button 
 onClick={() => setMode('guest')}
 variant="outline"
 className="w-full h-12 border-primary/30 text-foreground hover:bg-primary/5 text-base"
 data-testid="button-guest"
 >
 <UserX className="ml-2" />
 متابعة كضيف
 </Button>
 </CardContent>
 </Card>

 <div className="text-center">
 <p className="text-muted-foreground text-sm font-cairo">
 تسجيل الدخول يتيح لك: بطاقة ولاء • طوابع مجانية • متابعة طلباتك
 </p>
 </div>
 </div>
 </div>
 );
 }

 if (mode === 'register') {
 return (
 <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background flex flex-col items-center justify-center p-4" dir="rtl">
 <Card className="w-full max-w-md bg-card border-border/50 backdrop-blur shadow-lg">
 <CardHeader className="text-center">
 <div className="flex items-center justify-center gap-2 mb-2">
 <Coffee className="w-8 h-8 text-accent" />
 <CardTitle className="text-2xl text-foreground font-playfair">تسجيل الدخول</CardTitle>
 </div>
 <CardDescription className="text-muted-foreground">
 أدخل بياناتك للحصول على بطاقة ولاء خاصة
 </CardDescription>
 </CardHeader>
 <CardContent className="space-y-4">
 <div>
 <Label htmlFor="name" className="text-foreground">الاسم</Label>
 <Input
 id="name"
 type="text"
 placeholder="أدخل اسمك"
 value={name}
 onChange={(e) => setName(e.target.value)}
 className="bg-input border-border text-foreground placeholder:text-muted-foreground/50"
 data-testid="input-name"
 />
 </div>

 <div>
 <Label htmlFor="email" className="text-foreground">البريد الإلكتروني</Label>
 <Input
 id="email"
 type="email"
 placeholder="example@email.com"
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 className="bg-input border-border text-foreground placeholder:text-muted-foreground/50"
 data-testid="input-email"
 />
 </div>

 <div>
 <Label htmlFor="phone" className="text-foreground">رقم الجوال (9 أرقام تبدأ بـ 5)</Label>
 <div className="relative">
 <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-accent" />
 <Input
 id="phone"
 type="tel"
 placeholder="5xxxxxxxx"
 value={phone}
 onChange={(e) => setPhone(e.target.value)}
 className="bg-input border-border text-foreground placeholder:text-muted-foreground/50 pr-10"
 data-testid="input-phone"
 />
 </div>
 </div>

 <div className="space-y-2 pt-2">
 <Button
 onClick={handleRegister}
 className="w-full bg-gradient-to-r from-accent to-accent/90 hover:from-accent/95 hover:to-accent/85 text-accent-foreground font-semibold"
 data-testid="button-submit"
 >
 تسجيل الدخول
 </Button>

 <Button
 onClick={() => setMode('choice')}
 variant="ghost"
 className="w-full text-foreground/70 hover:text-foreground hover:bg-primary/10"
 data-testid="button-back"
 >
 رجوع
 </Button>
 </div>
 </CardContent>
 </Card>
 </div>
 );
 }

 // Guest mode confirmation
 return (
 <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background flex flex-col items-center justify-center p-4" dir="rtl">
 <Card className="w-full max-w-md bg-card border-border/50 backdrop-blur shadow-lg">
 <CardHeader className="text-center">
 <CardTitle className="text-2xl text-foreground font-playfair">وضع الضيف</CardTitle>
 <CardDescription className="text-muted-foreground">
 في وضع الضيف، لن تحصل على بطاقة ولاء أو طوابع مجانية 
 </CardDescription>
 </CardHeader>
 <CardContent className="space-y-3">
 <Button
 onClick={handleGuestMode}
 className="w-full bg-gradient-to-r from-muted to-muted/90 hover:from-muted/95 hover:to-muted/85 text-white font-semibold"
 data-testid="button-confirm-guest"
 >
 متابعة كضيف
 </Button>

 <Button
 onClick={() => setMode('choice')}
 variant="outline"
 className="w-full border-primary/30 text-foreground hover:bg-primary/5"
 data-testid="button-cancel-guest"
 >
 رجوع
 </Button>
 </CardContent>
 </Card>
 </div>
 );
}
