import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, Bell, Info, Share2, PlusSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import clunyLogo from "@assets/cluny-logo-customer.png";
import { useTranslation } from "react-i18next";

export function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Auto-show prompt after 3 seconds for new users
      const timer = setTimeout(() => {
        if (!isInstalled) setShowPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, [isInstalled]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
        setShowPrompt(false);
        setIsInstalled(true);
      }
    } else {
      // Manual instructions based on UA
      const ua = navigator.userAgent.toLowerCase();
      if (/iphone|ipad|ipod/.test(ua)) {
        toast({
          title: t("pwa.install_ios_title") || "تثبيت على iPhone",
          description: t("pwa.install_ios_desc") || "اضغط على أيقونة المشاركة (Share) ثم اختر 'إضافة إلى الشاشة الرئيسية'",
        });
      } else {
        toast({
          title: t("pwa.install_title") || "تثبيت التطبيق",
          description: t("pwa.install_desc") || "اضغط على القائمة (⋮) في المتصفح ثم اختر 'تثبيت التطبيق' أو 'إضافة إلى الشاشة الرئيسية'",
        });
      }
    }
  };

  if (isInstalled || !showPrompt) return null;

  return (
    <div className="fixed top-20 left-4 right-4 z-[100] animate-in fade-in slide-in-from-top-10 duration-700">
      <Card className="border-primary/20 bg-background/95 backdrop-blur-md shadow-2xl overflow-hidden rounded-[2rem]">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-inner border border-primary/10 bg-white p-1">
              <img src={clunyLogo} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-black text-primary leading-tight">{t("pwa.prompt_title") || "ثبت تطبيق كلووني"}</h3>
              <p className="text-xs text-muted-foreground font-medium">{t("pwa.prompt_desc") || "استمتع بتجربة أسرع ووصول فوري"}</p>
            </div>
            <div className="flex flex-col gap-2">
              <Button 
                onClick={handleInstall}
                className="rounded-xl h-10 px-6 font-bold bg-primary text-primary-foreground hover-elevate shadow-lg shadow-primary/20"
              >
                {t("pwa.install_btn") || "تثبيت الآن"}
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowPrompt(false)}
                className="text-[10px] h-6 text-muted-foreground hover:bg-transparent"
              >
                {t("pwa.not_now") || "ليس الآن"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
