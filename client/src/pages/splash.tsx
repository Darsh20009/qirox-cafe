import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clunyLogo from "@/assets/cluny-logo.png";
import ButtonPourAnimation from "@/components/button-pour-animation";
import { ChevronLeft } from "lucide-react";

import QiroxLogo from "@assets/QIROX_LOGO_1771194264304.png";
import LoadingBg from "@assets/Screenshot_2026-01-27_120537_1771213900268.png";

export default function SplashScreen() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  const [shouldShow, setShouldShow] = useState<boolean | null>(null);

  useEffect(() => {
    const hasSeenSplash = localStorage.getItem("hasSeenSplash");
    if (hasSeenSplash) {
      setShouldShow(false);
      setLocation("/menu");
      return;
    }

    setShouldShow(true);
    localStorage.setItem("hasSeenSplash", "true");

    const timer = setTimeout(() => {
      setLoading(false);
      setTimeout(() => setLocation("/menu"), 300);
    }, 2000);
    return () => clearTimeout(timer);
  }, [setLocation]);

  if (shouldShow === false) return null;

  return (
    <div className="fixed inset-0 bg-[#0A0F14] flex items-center justify-center z-50 overflow-hidden font-ibm-arabic">
      <div className="absolute inset-0">
        <img 
          src={LoadingBg} 
          alt="" 
          className="w-full h-full object-cover opacity-40 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0F14]/80 via-transparent to-[#0A0F14]/80" />
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
      </div>

      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
            transition={{ duration: 0.8 }}
            className="relative z-10 flex flex-col items-center max-w-xs w-full px-6"
          >
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              className="mb-16"
            >
              <img src={QiroxLogo} alt="QIROX" className="w-32 h-auto object-contain" />
            </motion.div>

            <div className="relative w-full h-16 bg-transparent rounded-xl border border-cyan-500/20 flex items-center justify-center overflow-hidden group shadow-2xl">
              <ButtonPourAnimation />
              <span className="relative z-20 text-white text-xl font-medium flex items-center drop-shadow-md">
                استكشف القائمة
                <ChevronLeft className="mr-2 w-6 h-6" />
              </span>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 1 }}
              className="text-center mt-16"
            >
              <h1 className="text-4xl font-playfair tracking-[0.1em] text-white mb-2 font-bold uppercase">
                QIROX
              </h1>
              <p className="text-cyan-500/70 text-sm tracking-[0.2em] uppercase font-medium">
                Build systems. Stay human.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
