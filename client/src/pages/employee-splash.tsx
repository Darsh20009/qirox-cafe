import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Zap, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import QiroxLogo from "@assets/QIROX_LOGO_1771194264304.png";

export default function EmployeeSplash() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(true);

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Set metadata for employee splash
    document.title = "نظام الموظفين - QIROX SYSTEMS | نظام إدارة متكامل";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', 'نظام إدارة الموظفين والعمليات في QIROX SYSTEMS - نظام متكامل لإدارة الطلبات والمبيعات');

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-background via-primary/5 to-background flex flex-col items-center justify-center p-4 overflow-hidden relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-10 left-10 w-64 h-64 rounded-full bg-primary/10 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 20, 0],
            y: [0, -20, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-accent/10 blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            x: [0, -30, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Main content */}
      <motion.div
        className="z-10 flex flex-col items-center gap-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        {/* CLUNY CAFE Logo */}
        <motion.div
          className="relative"
          animate={{
            y: [0, -10, 0],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="relative w-48 h-48 flex items-center justify-center">
            <img
              src={QiroxLogo}
              alt="QIROX SYSTEMS - نظام إدارة الموظفين"
              className="w-full h-full object-contain"
            />
          </div>
        </motion.div>

        {/* Subtitle */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          <p className="text-muted text-lg font-cairo">نظام إدارة الموظفين</p>
        </motion.div>

        {/* Action Buttons */}
        {!isLoading && (
          <motion.div 
            className="flex flex-col gap-3 w-full max-w-[280px]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Button 
              size="lg"
              onClick={() => setLocation("/employee/gateway")}
              className="bg-primary text-primary-foreground font-bold h-14 rounded-2xl hover-elevate shadow-lg shadow-primary/20"
            >
              الدخول للنظام
            </Button>
            
            <Button 
              variant="outline"
              size="lg"
              onClick={async () => {
                const manifestTag = document.getElementById('main-manifest') as HTMLLinkElement;
                if (manifestTag) manifestTag.href = '/employee-manifest.json';
                
                // Force update for some browsers
                const newManifest = manifestTag.cloneNode(true) as HTMLLinkElement;
                newManifest.href = '/employee-manifest.json?v=' + Date.now();
                manifestTag.parentNode?.replaceChild(newManifest, manifestTag);

                if (deferredPrompt) {
                  deferredPrompt.prompt();
                  const { outcome } = await deferredPrompt.userChoice;
                  if (outcome === 'accepted') {
                    setDeferredPrompt(null);
                  }
                } else {
                  const ua = navigator.userAgent.toLowerCase();
                  if (/iphone|ipad|ipod/.test(ua)) {
                    alert("لتثبيت النظام على iPhone: اضغط على زر 'مشاركة' ثم 'إضافة إلى الشاشة الرئيسية'");
                  } else {
                    alert("لتثبيت النظام: اضغط على القائمة (⋮) ثم 'تثبيت التطبيق'");
                  }
                }
              }}
              className="border-primary/20 text-primary font-bold h-14 rounded-2xl hover-elevate"
            >
              <Download className="ml-2 h-5 w-5" />
              تحميل نظام الموظفين
            </Button>
          </motion.div>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <motion.div
            className="flex gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-3 h-3 rounded-full bg-primary"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* Welcome message */}
      <motion.div
        className="absolute bottom-8 text-center z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.8 }}
      >
        <p className="text-muted/70 font-cairo text-sm">
          أهلاً وسهلاً بك في نظام الموظفين
        </p>
      </motion.div>
    </div>
  );
}
