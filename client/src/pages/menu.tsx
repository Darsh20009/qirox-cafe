import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCartStore } from "@/lib/cart-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PWAInstallButton } from "@/components/pwa-install";
import { useCustomer } from "@/contexts/CustomerContext";
import { useLocation } from "wouter";
import { Coffee, ShoppingCart, Flame, Snowflake, Star, Cake, User, Plus, Search, QrCode, ChevronLeft, ChevronRight, MapPin, Clock, Utensils, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import banner1 from "@assets/ChatGPT_Image_Jan_2,_2026,_04_26_37_PM_1771213940291.png";
import banner2 from "@assets/qirox_1771213927991.png";
import banner3 from "@assets/Screenshot_2026-01-27_120537_1771213900268.png";
import qiroxLogo from "@assets/QIROX_LOGO_1771194264304.png";
import type { CoffeeItem, IProductAddon, IPromoOffer } from "@shared/schema";
import { AddToCartModal } from "@/components/add-to-cart-modal";
import { Tag, Gift } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";

interface MenuCategory {
  id: string;
  nameAr: string;
  nameEn?: string;
  icon?: string;
  department?: 'drinks' | 'food';
  orderIndex: number;
  isSystem?: boolean;
}

export default function MenuPage() {
  const { cartItems, addToCart } = useCartStore();
  const { isAuthenticated, customer } = useCustomer();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { t, i18n } = useTranslation();

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedItem, setSelectedItem] = useState<CoffeeItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const bannerRef = useRef<HTMLDivElement>(null);

  const { data: customBanners = [] } = useQuery<any[]>({
    queryKey: ["/api/custom-banners"],
  });

  const { data: coffeeItems = [], isLoading } = useQuery<CoffeeItem[]>({
    queryKey: ["/api/coffee-items"],
  });

  const { data: allAddons = [] } = useQuery<IProductAddon[]>({
    queryKey: ["/api/product-addons"],
  });

  const { data: promoOffers = [] } = useQuery<IPromoOffer[]>({
    queryKey: ["/api/promo-offers"],
  });

  const { data: dynamicCategories = [] } = useQuery<MenuCategory[]>({
    queryKey: ["/api/menu-categories"],
  });

  const { data: businessConfig } = useQuery<any>({
    queryKey: ["/api/business-config"],
  });

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const isBothModes = businessConfig?.activityType === "both";
  const [activeMode, setActiveMode] = useState<"drinks" | "food">("drinks");
  const [initModeSet, setInitModeSet] = useState(false);

  useEffect(() => {
    if (businessConfig?.activityType === "both" && !initModeSet) {
      setActiveMode("drinks"); // Keep drinks as primary but show food more prominently
      setInitModeSet(true);
    }
  }, [businessConfig, initModeSet]);

  // Construct dynamic banners
  const bannerSlides = (() => {
    const slides = [];

    // 1. Add custom admin banners first
    if (customBanners.length > 0) {
      customBanners.forEach(banner => {
        slides.push({
          image: banner.imageUrl,
          title: i18n.language === 'ar' ? banner.titleAr : (banner.titleEn || banner.titleAr),
          subtitle: i18n.language === 'ar' ? banner.subtitleAr : (banner.subtitleEn || banner.subtitleAr),
          badge: i18n.language === 'ar' ? banner.badgeAr : (banner.badgeEn || banner.badgeAr),
          linkType: banner.linkType,
          linkId: banner.linkId,
          externalUrl: banner.externalUrl
        });
      });
    }

    // 2. Add fixed banner slides
    slides.push({
      image: banner1,
      badge: "QIROX EXCLUSIVE",
      title: "Build systems. Stay human.",
      subtitle: "نظام إدارة المقاهي الأكثر ذكاءً",
      linkType: "offer",
    });
    slides.push({
      image: banner2,
      badge: "NEW TECH",
      title: "Digital Evolution",
      subtitle: "نحو مستقبل رقمي أفضل لعملك",
      linkType: "offer",
    });
    slides.push({
      image: banner3,
      badge: "QIROX SYSTEMS",
      title: "Total Control",
      subtitle: "إدارة متكاملة لكل تفاصيل مشروعك",
      linkType: "external",
      externalUrl: "https://qirox.cafe"
    });

    // 3. Add dynamic "Smart" slides based on inventory/products
    if (coffeeItems.length > 0) {
      // Find cheapest drink
      const sortedByPrice = [...coffeeItems].sort((a, b) => a.price - b.price);
      const cheapest = sortedByPrice[0];
      const cheapestName = i18n.language === 'ar' ? cheapest?.nameAr : (cheapest?.nameEn || cheapest?.nameAr);
      if (cheapest) {
        slides.push({
          image: cheapest.imageUrl || banner1,
          title: t("menu.banner.smart.cheapest_title", { name: cheapestName }),
          subtitle: t("menu.banner.smart.cheapest_subtitle"),
          badge: t("menu.banner.smart.cheapest_badge"),
          linkType: 'product',
          linkId: (cheapest as any).id,
          externalUrl: undefined
        });
      }

      const newest = [...coffeeItems].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())[0];
      const newestName = i18n.language === 'ar' ? newest?.nameAr : (newest?.nameEn || newest?.nameAr);
      if (newest && (newest as any).id !== (cheapest as any).id) {
        slides.push({
          image: newest.imageUrl || banner2,
          title: t("menu.banner.smart.newest_title"),
          subtitle: t("menu.banner.smart.newest_subtitle", { name: newestName }),
          badge: t("menu.banner.smart.newest_badge"),
          linkType: 'product',
          linkId: (newest as any).id,
          externalUrl: undefined
        });
      }
    }

    // 3. Fallback to default slides if nothing else
    if (slides.length === 0) {
      slides.push(
        {
          image: banner1,
          title: t("banner.1.title"),
          subtitle: t("banner.1.subtitle"),
          badge: t("banner.1.badge"),
          linkType: 'product',
          linkId: "matcha-latte",
          externalUrl: undefined
        },
        {
          image: banner2,
          title: t("banner.2.title"),
          subtitle: t("banner.2.subtitle"),
          badge: t("banner.2.badge"),
          linkType: 'product',
          linkId: "vanilla-latte",
          externalUrl: undefined
        }
      );
    }

    return slides;
  })();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % bannerSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [bannerSlides.length]);

  const iconMap: Record<string, any> = {
    Coffee, Flame, Snowflake, Star, Cake, Utensils, Sparkles
  };

  const drinkSystemCategories = [
    { id: "all", name: t("menu.categories.all"), icon: Coffee, isSystem: true },
    { id: "hot", name: t("menu.categories.hot"), icon: Flame, isSystem: true },
    { id: "cold", name: t("menu.categories.cold"), icon: Snowflake, isSystem: true },
    { id: "specialty", name: t("menu.categories.specialty"), icon: Star, isSystem: true },
    { id: "drinks", name: t("menu.categories.drinks") || "المشروبات", icon: Coffee, isSystem: true },
    { id: "additional_drinks", name: "مشروبات إضافية", icon: Plus, isSystem: true },
    { id: "desserts", name: t("menu.categories.desserts"), icon: Cake, isSystem: true },
  ];

  const foodSystemCategories = [
    { id: "all", name: t("menu.categories.all"), icon: Utensils, isSystem: true },
    { id: "food", name: t("menu.categories.food"), icon: Utensils, isSystem: true },
    { id: "sandwiches", name: "السندوتشات", icon: Utensils, isSystem: true },
    { id: "bakery", name: t("menu.categories.bakery"), icon: Cake, isSystem: true },
    { id: "croissant", name: "الكرواسون", icon: Cake, isSystem: true },
    { id: "cake", name: "الكيك", icon: Cake, isSystem: true },
    { id: "desserts", name: t("menu.categories.desserts"), icon: Star, isSystem: true },
  ];

  const systemCategories = isBothModes
    ? (activeMode === "food" ? foodSystemCategories : drinkSystemCategories)
    : drinkSystemCategories;

  const customCategories = dynamicCategories
    .filter(c => {
      if (c.isSystem) return false;
      if (isBothModes) {
        return !c.department || c.department === activeMode;
      }
      return true;
    })
    .map(c => ({
      id: c.id,
      name: i18n.language === 'ar' ? c.nameAr : (c.nameEn || c.nameAr),
      icon: iconMap[c.icon || 'Coffee'] || Coffee,
      isSystem: false
    }));

  const categories = [...systemCategories, ...customCategories];

  const bestSellers = coffeeItems
    .filter(item => (item as any).isBestSeller || (item as any).salesCount > 10 || item.category === 'food' || item.category === 'bakery')
    .sort((a, b) => {
      // Prioritize food in best sellers if it matches
      const aIsFood = a.category === 'food' || a.category === 'bakery';
      const bIsFood = b.category === 'food' || b.category === 'bakery';
      if (aIsFood && !bIsFood) return -1;
      if (!aIsFood && bIsFood) return 1;
      return ((b as any).salesCount || 0) - ((a as any).salesCount || 0);
    })
    .slice(0, 8);


  const getGroupingKey = (item: CoffeeItem): string => {
    // 1. Explicit groupId has highest priority
    if ((item as any).groupId) return (item as any).groupId;

    const nameAr = item.nameAr || "";
    if (!nameAr || typeof nameAr !== 'string') return 'unknown';

    // Remove common prefixes and diacritics to help grouping
    const cleaned = nameAr.trim()
      .replace(/^[\u064B-\u0652]+/, '') // Remove leading diacritics
      .replace(/^(بارد|حار)\s+/i, ''); // Remove temperature prefixes

    // We want to group items that are truly variants of each other.
    // Usually, variants share most of the name but differ at the end.
    // For now, let's use the first two words if they exist, to differentiate 
    // "Matcha Latte" from "Matcha Latte Strawberry"
    const words = cleaned.split(/\s+/);
    if (words.length >= 2) {
      return `${words[0]} ${words[1]}`;
    }
    return words[0] || 'unknown';
  };

  const groupedItems = coffeeItems.reduce((acc: Record<string, CoffeeItem[]>, item) => {
    const groupKey = getGroupingKey(item);
    
    if (!acc[groupKey]) acc[groupKey] = [];
    acc[groupKey].push(item);
    return acc;
  }, {});

  const representativeItems = Object.values(groupedItems).map(group => {
    // Find the primary variant or just use the first one
    return group[0];
  });

  const drinkCategoryIds = ['basic', 'hot', 'cold', 'specialty', 'drinks'];
  const foodCategoryIds = ['food', 'bakery', 'desserts'];

  const filteredItems = representativeItems.filter(item => {
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const name = i18n.language === 'ar' ? item.nameAr : item.nameEn || item.nameAr;
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const drinkIds = [...drinkCategoryIds, ...dynamicCategories.filter(c => c.department === 'drinks').map(c => c.id)];
    const foodIds = [...foodCategoryIds, ...dynamicCategories.filter(c => c.department === 'food').map(c => c.id)];

    const matchesMode = !isBothModes || (
      selectedCategory !== "all" 
        ? (activeMode === "drinks" ? drinkIds.includes(item.category) : foodIds.includes(item.category))
        : true // Show all when "all" is selected
    );
    
    return matchesCategory && matchesSearch && matchesMode;
  });

  // Re-order filteredItems if both modes are active and "all" is selected
  // to show items from the active mode first
  const sortedFilteredItems = [...filteredItems].sort((a, b) => {
    if (!isBothModes || selectedCategory !== "all") return 0;
    
    const drinkIds = [...drinkCategoryIds, ...dynamicCategories.filter(c => c.department === 'drinks').map(c => c.id)];
    const foodIds = [...foodCategoryIds, ...dynamicCategories.filter(c => c.department === 'food').map(c => c.id)];
    
    const aMatchesMode = activeMode === "drinks" ? drinkIds.includes(a.category) : foodIds.includes(a.category);
    const bMatchesMode = activeMode === "drinks" ? drinkIds.includes(b.category) : foodIds.includes(b.category);
    
    if (aMatchesMode && !bMatchesMode) return -1;
    if (!aMatchesMode && bMatchesMode) return 1;
    return 0;
  });

  const handleAddToCartDirect = (item: CoffeeItem) => {
    const name = i18n.language === 'ar' ? item.nameAr : item.nameEn || item.nameAr;
    const groupKey = getGroupingKey(item);
    const group = groupedItems[groupKey] || [item];
    const hasMultipleVariants = group.length > 1;
    const hasSizes = item.availableSizes && item.availableSizes.length > 0;
    const hasAddons = allAddons.filter(a => a.isAvailable === 1).length > 0;

    if (hasMultipleVariants || hasSizes || hasAddons) {
      setSelectedItem(item);
      setIsModalOpen(true);
    } else {
      addToCart((item as any).id, 1, "default", []);
      toast({
        title: t("menu.added_to_cart"),
        description: t("menu.added_to_cart_desc", { name }),
      });
    }
  };

  const nextBanner = () => {
    setCurrentBannerIndex((prev) => (prev + 1) % bannerSlides.length);
  };

  const prevBanner = () => {
    setCurrentBannerIndex((prev) => (prev - 1 + bannerSlides.length) % bannerSlides.length);
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
    // document.documentElement updates are now handled globally in App.tsx
  };

  if (isLoading) {
    return (
      <div dir={i18n.language === 'ar' ? 'rtl' : 'ltr'} className="min-h-screen bg-background flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Coffee className="w-10 h-10 text-primary" />
        </motion.div>
      </div>
    );
  }

  return (
    <div dir={i18n.language === 'ar' ? 'rtl' : 'ltr'} className="min-h-screen bg-background pb-24 font-sans overflow-x-hidden text-foreground">
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-xl px-4 h-16 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img src={qiroxLogo} className="w-10 h-10 object-contain drop-shadow-md" alt="Logo" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-none text-white drop-shadow-md">{t("app.name")}</h1>
            <span className="text-[9px] text-white/80 font-medium uppercase tracking-wider">{t("app.tagline")}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <PWAInstallButton />
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleLanguage} 
            className="h-9 w-9 rounded-xl bg-white/20 backdrop-blur-sm hover:bg-white/30 border border-white/20"
          >
            <Languages className="w-4 h-4 text-white" />
          </Button>
          {isAuthenticated && (
            <Button variant="ghost" size="icon" onClick={() => setLocation("/my-card")} className="h-9 w-9 rounded-xl bg-white/20 backdrop-blur-sm hover:bg-white/30 border border-white/20">
              <QrCode className="w-4 h-4 text-white" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={() => setLocation("/cart")} className="relative h-9 w-9 rounded-xl bg-white/20 backdrop-blur-sm hover:bg-white/30 border border-white/20">
            <ShoppingCart className="w-4 h-4 text-white" />
            <AnimatePresence>
              {totalItems > 0 && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-1 -right-1 h-5 min-w-[1.25rem] px-1 flex items-center justify-center text-[10px] font-bold text-white bg-primary rounded-full border-2 border-white/50"
                >
                  {totalItems}
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => {
              const storedCustomer = localStorage.getItem("qahwa-customer") || localStorage.getItem("currentCustomer");
              if (isAuthenticated || customer || storedCustomer) {
                setLocation("/profile");
              } else {
                setLocation("/auth");
              }
            }} 
            className="h-9 w-9 rounded-xl bg-white/20 backdrop-blur-sm hover:bg-white/30 border border-white/20"
            data-testid="button-user-profile"
          >
            <User className="w-4 h-4 text-white" />
          </Button>

          {isAuthenticated && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setLocation("/my-offers")} 
              className="h-9 w-9 rounded-xl bg-white/20 backdrop-blur-sm hover:bg-white/30 border border-white/20"
              data-testid="button-my-offers-header"
            >
              <Sparkles className="w-4 h-4 text-white" />
            </Button>
          )}
        </div>
      </header>

      <main className="space-y-6">
        <div ref={bannerRef} className="relative w-full overflow-hidden">
          <div className="relative h-[280px] sm:h-[320px] md:h-[380px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentBannerIndex}
                initial={{ opacity: 0, x: i18n.language === 'ar' ? 100 : -100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: i18n.language === 'ar' ? -100 : 100 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0"
              >
                <div className="relative h-full w-full">
                  <img 
                    src={bannerSlides[currentBannerIndex].image} 
                    alt={bannerSlides[currentBannerIndex].title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                  
                  <div className={`absolute bottom-0 ${i18n.language === 'ar' ? 'right-0' : 'left-0'} left-0 right-0 p-6 text-white flex flex-col items-start gap-4`}>
                    <div className="space-y-1">
                      <Badge className="bg-accent text-white border-0 px-3 py-1">
                        {bannerSlides[currentBannerIndex].badge}
                      </Badge>
                      <h2 className="text-2xl sm:text-3xl font-bold">
                        {bannerSlides[currentBannerIndex].title}
                      </h2>
                      <p className="text-sm sm:text-base opacity-90 max-w-md">
                        {bannerSlides[currentBannerIndex].subtitle}
                      </p>
                    </div>
                    
                    <Button 
                      onClick={() => {
                        const slide = bannerSlides[currentBannerIndex];
                        if (slide.linkType === 'product' && slide.linkId) {
                          const product = coffeeItems.find(p => p.id === slide.linkId);
                          if (product) {
                            setSelectedItem(product);
                            setIsModalOpen(true);
                          }
                        } else if (slide.linkType === 'category' && slide.linkId) {
                          setSelectedCategory(slide.linkId);
                          window.scrollTo({ top: bannerRef.current?.offsetHeight || 0, behavior: 'smooth' });
                        } else if (slide.linkType === 'offer') {
                          setLocation("/my-offers");
                        } else if (slide.linkType === 'external' && slide.externalUrl) {
                          window.open(slide.externalUrl, '_blank');
                        }
                      }}
                      className="bg-primary hover:bg-primary/90 text-white rounded-full px-6 py-4 text-base font-bold shadow-2xl flex items-center gap-2 group"
                    >
                      <span>{t("menu.add_to_cart")}</span>
                      <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            <button 
              onClick={prevBanner}
              className={`absolute ${i18n.language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors`}
              data-testid="button-prev-banner"
            >
              {i18n.language === 'ar' ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
            <button 
              onClick={nextBanner}
              className={`absolute ${i18n.language === 'ar' ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors`}
              data-testid="button-next-banner"
            >
              {i18n.language === 'ar' ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>

            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
              {bannerSlides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentBannerIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === currentBannerIndex ? "w-6 bg-white" : "bg-white/50"
                  }`}
                  data-testid={`button-banner-dot-${idx}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="px-4 space-y-6">
          {isBothModes && (
            <div className="flex p-1 bg-secondary/30 rounded-2xl">
              <button
                onClick={() => { setActiveMode("drinks"); setSelectedCategory("all"); }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
                  activeMode === "drinks" ? "bg-primary text-white shadow-lg" : "text-muted-foreground"
                }`}
                data-testid="button-mode-drinks"
              >
                <Coffee className="w-4 h-4" />
                <span>{t("menu.mode.drinks")}</span>
              </button>
              <button
                onClick={() => { setActiveMode("food"); setSelectedCategory("all"); }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
                  activeMode === "food" ? "bg-primary text-white shadow-lg" : "text-muted-foreground"
                }`}
                data-testid="button-mode-food"
              >
                <Utensils className="w-4 h-4" />
                <span>{t("menu.mode.food")}</span>
              </button>
            </div>
          )}

          <div className="flex items-center gap-4 bg-secondary/50 rounded-xl p-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">{t("location.riyadh")}</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium">{t("status.open")}</span>
            </div>
          </div>

          {isAuthenticated && (
            <button
              onClick={() => setLocation("/my-offers")}
              className="w-full flex items-center justify-between bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-4 border border-primary/20 group hover:border-primary/40 transition-all"
              data-testid="button-my-offers-banner"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className={i18n.language === 'ar' ? 'text-right' : 'text-left'}>
                  <p className="font-bold text-foreground">{t("menu.discover_offers")}</p>
                  <p className="text-xs text-muted-foreground">{t("menu.personalized_offers")}</p>
                </div>
              </div>
              <ChevronLeft className="w-5 h-5 text-primary group-hover:translate-x-[-4px] transition-transform" />
            </button>
          )}

          {promoOffers.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-accent" />
                <h2 className="text-xl font-bold text-foreground">{t("menu.offers")}</h2>
              </div>
              <div className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-4 px-4 pb-2">
                {promoOffers.map((offer) => (
                  <motion.div 
                    key={offer.id} 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-shrink-0 w-[200px] snap-start bg-gradient-to-br from-accent/10 to-primary/10 rounded-2xl border-2 border-accent/30 p-3 space-y-3 shadow-sm cursor-pointer group relative overflow-hidden"
                    data-testid={`card-offer-${offer.id}`}
                  >
                    <div className="absolute top-2 left-2 z-10">
                      <Badge className="bg-accent text-white border-0 px-2 py-0.5 text-[10px]">
                        <Tag className="w-3 h-3 ml-1" />
                        {t("menu.offer_badge")}
                      </Badge>
                    </div>
                    {offer.imageUrl && (
                      <div className="aspect-video rounded-xl overflow-hidden bg-secondary">
                        <img 
                          src={offer.imageUrl} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                          alt={i18n.language === 'ar' ? offer.nameAr : offer.nameEn || offer.nameAr} 
                        />
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <h3 className="text-sm font-semibold text-foreground">{i18n.language === 'ar' ? offer.nameAr : offer.nameEn || offer.nameAr}</h3>
                      {offer.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{offer.description}</p>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-accent font-bold">{offer.offerPrice} <small className="text-xs font-normal">{t("currency")}</small></span>
                        <span className="text-xs text-muted-foreground line-through">{offer.originalPrice} {t("currency")}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          <div className="relative group">
            <Search className={`absolute ${i18n.language === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors`} />
            <input 
              type="text"
              placeholder={isBothModes && activeMode === 'food' ? t("menu.search_placeholder_food") : t("menu.search_placeholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full h-12 ${i18n.language === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'} bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm`}
              data-testid="input-search"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1 -mx-4 px-4">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCategory(cat.id);
                }}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                  selectedCategory === cat.id 
                    ? "bg-primary text-primary-foreground border-primary shadow-md" 
                    : "bg-card text-foreground border-border hover:border-primary/30 hover:bg-secondary/50"
                }`}
                data-testid={`button-category-${cat.id}`}
              >
                <cat.icon className={`w-4 h-4 ${selectedCategory === cat.id ? "text-primary-foreground" : "text-primary"}`} />
                <span>{cat.name}</span>
              </button>
            ))}
          </div>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">{t("menu.featured")}</h2>
              <Button variant="ghost" size="sm" className="text-primary text-sm">
                {t("menu.view_all")}
              </Button>
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-4 px-4 pb-2">
              {representativeItems.slice(0, 6).map((item) => (
                <motion.div 
                  key={item.id} 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-shrink-0 w-[140px] snap-start bg-card rounded-2xl border border-border p-3 space-y-3 shadow-sm cursor-pointer group"
                  onClick={() => handleAddToCartDirect(item)}
                  data-testid={`card-featured-${item.id}`}
                >
                  <div className="aspect-square rounded-xl overflow-hidden bg-secondary">
                    <img 
                      src={item.imageUrl} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                      alt={i18n.language === 'ar' ? item.nameAr : item.nameEn || item.nameAr} 
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder-coffee.png";
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-semibold truncate text-foreground">{i18n.language === 'ar' ? item.nameAr : item.nameEn || item.nameAr}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-primary font-bold">{item.price} <small className="text-xs font-normal text-muted-foreground">{t("currency")}</small></span>
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors">
                        <Plus className="w-4 h-4 text-primary group-hover:text-white transition-colors" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">
              {isBothModes 
                ? (activeMode === 'food' ? t("menu.all_items_food") : t("menu.all_items_drinks"))
                : t("menu.all_items")
              }
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <AnimatePresence mode="popLayout">
                {sortedFilteredItems.map((item) => (
                  <motion.div 
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="bg-card rounded-2xl border border-border p-3 flex gap-4 items-center shadow-sm cursor-pointer group"
                    onClick={() => handleAddToCartDirect(item)}
                    data-testid={`card-menu-${item.id}`}
                  >
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-secondary flex-shrink-0">
                      <img 
                        src={item.imageUrl} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                        alt={i18n.language === 'ar' ? item.nameAr : item.nameEn || item.nameAr} 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/placeholder-coffee.png";
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0 py-1">
                      <h3 className="text-base font-semibold truncate text-foreground mb-1">{i18n.language === 'ar' ? item.nameAr : item.nameEn || item.nameAr}</h3>
                      <p className="text-xs text-muted-foreground truncate mb-2">{item.description || t("menu.default_desc")}</p>

                      <div className="flex items-center justify-between">
                        <span className="text-primary font-bold text-lg">{item.price} <small className="text-xs font-normal text-muted-foreground">{t("currency")}</small></span>
                        <Button 
                          size="sm" 
                          className="h-8 w-8 p-0 rounded-lg bg-primary hover:bg-primary/90"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCartDirect(item);
                          }}
                          data-testid={`button-add-${item.id}`}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </section>
        </div>
      </main>

      <AddToCartModal
        item={selectedItem}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        variants={selectedItem ? (groupedItems[getGroupingKey(selectedItem)] || [selectedItem]) : []}
        onAddToCart={(data) => {
          addToCart(data.coffeeItemId, data.quantity, data.selectedSize, data.selectedAddons);
          setIsModalOpen(false);
          toast({ 
            title: t("menu.added_to_cart"), 
            description: t("menu.added_to_cart_desc", { name: i18n.language === 'ar' ? selectedItem?.nameAr : selectedItem?.nameEn || selectedItem?.nameAr }),
            className: "bg-card border-primary/20 text-foreground font-medium"
          });
        }}
      />

      {totalItems > 0 && (
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-6 inset-x-4 z-50"
        >
          <Button 
            onClick={() => setLocation("/cart")}
            className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl shadow-lg flex items-center justify-between px-5"
            data-testid="button-view-cart"
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div className="text-right">
                <p className="text-xs font-medium opacity-80">{t("menu.view_cart")}</p>
                <p className="text-sm font-bold">{t("menu.items_count", { count: totalItems })}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold">
                {cartItems.reduce((sum, i) => {
                  let itemPrice = 0;
                  const basePrice = i.coffeeItem?.price || 0;

                  // Use size price if available
                  if (i.selectedSize && i.coffeeItem?.availableSizes) {
                    const size = i.coffeeItem.availableSizes.find(s => s.nameAr === i.selectedSize);
                    itemPrice = size ? size.price : basePrice;
                  } else {
                    itemPrice = basePrice;
                  }

                  // Handle price formats
                  let price = 0;
                  if (typeof itemPrice === 'number') {
                    price = itemPrice;
                  } else if (typeof itemPrice === 'string') {
                    price = parseFloat(itemPrice);
                  } else if (itemPrice && typeof itemPrice === 'object' && '$numberDecimal' in (itemPrice as any)) {
                    price = parseFloat((itemPrice as any).$numberDecimal);
                  } else {
                    price = parseFloat(String(itemPrice));
                  }
                  
                  return sum + (isNaN(price) ? 0 : price * i.quantity);
                }, 0).toFixed(2)} {t("currency")}
              </span>
            </div>
          </Button>
        </motion.div>
      )}

    </div>
  );
}
