import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Plus, Minus, ShoppingCart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { CoffeeItem, IProductAddon } from "@shared/schema";

interface AddToCartModalProps {
  item: CoffeeItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (itemData: any) => void;
  variants?: CoffeeItem[];
}

export function AddToCartModal({
  item,
  isOpen,
  onClose,
  onAddToCart,
  variants = [],
}: AddToCartModalProps) {
  const [selectedVariant, setSelectedVariant] = useState<CoffeeItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const { toast } = useToast();

  const resetModal = useCallback(() => {
    setQuantity(1);
    setSelectedSize(null);
    setSelectedAddons([]);
    setSelectedVariant(null);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen && item) {
      setSelectedVariant(item);
      setQuantity(1);
      setSelectedSize(null);
      setSelectedAddons([]);
    }
  }, [isOpen, item]);

  const activeItem = selectedVariant || item;

  // Fetch all general addons
  const { data: allAddons = [] } = useQuery<IProductAddon[]>({
    queryKey: ["/api/product-addons"],
    enabled: isOpen && !!activeItem,
  });

  // Fetch product-specific addons
  const { data: specificAddons = [] } = useQuery<IProductAddon[]>({
    queryKey: ["/api/coffee-items", (activeItem as any)?.id, "addons"],
    enabled: isOpen && !!activeItem && !!(activeItem as any)?.id,
  });

  // Fetch all coffee items for drink addons
  const { data: allCoffeeItems = [] } = useQuery<CoffeeItem[]>({
    queryKey: ["/api/coffee-items"],
    enabled: isOpen && !!activeItem,
  });

  // General addons (available to all products, excluding drink addons)
  const generalAddons = useMemo(() => {
    if (!activeItem) return [];
    return allAddons.filter(addon => addon.isAvailable === 1 && !addon.isAddonDrink);
  }, [activeItem, allAddons]);

  // Drink addons - addons that are linked to existing drinks
  const drinkAddons = useMemo(() => {
    if (!activeItem) return [];
    return allAddons.filter(addon => addon.isAvailable === 1 && addon.isAddonDrink && addon.linkedCoffeeItemId);
  }, [activeItem, allAddons]);

  // Get linked drink info for display
  const getLinkedDrinkInfo = (addon: IProductAddon) => {
    if (!addon.linkedCoffeeItemId) return null;
    return allCoffeeItems.find(item => item.id === addon.linkedCoffeeItemId);
  };

  // Combined addons: specific first, then general (without duplicates)
  const itemAddons = useMemo(() => {
    const specificIds = new Set(specificAddons.map(a => a.id));
    const uniqueGeneralAddons = generalAddons.filter(a => !specificIds.has(a.id));
    return [...specificAddons, ...uniqueGeneralAddons].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
  }, [specificAddons, generalAddons]);

  const handleAddToCart = () => {
    if (!activeItem) return;

    if (activeItem.availableSizes && activeItem.availableSizes.length > 0 && !selectedSize) {
      toast({
        title: "تنبيه",
        description: "يرجى اختيار حجم المشروب",
        variant: "destructive",
      });
      return;
    }

    const cartItem = {
      coffeeItemId: activeItem.id,
      quantity,
      selectedSize: selectedSize || "default",
      selectedAddons: selectedAddons,
    };

    onAddToCart(cartItem);
    resetModal();
  };

  if (!activeItem) return null;

  const totalPrice =
    (selectedSize
      ? activeItem.availableSizes?.find((s) => s.nameAr === selectedSize)?.price ??
        activeItem.price
      : activeItem.price) * quantity +
    selectedAddons.reduce((sum, addonId) => {
      const addon = allAddons.find((a) => a.id === addonId);
      return sum + (addon?.price ?? 0);
    }, 0) * quantity;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && resetModal()}>
      <DialogContent className="max-w-sm bg-background border border-border rounded-2xl p-0 overflow-hidden">
        <div className="relative h-32 bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center">
          {activeItem.imageUrl && (
            <img 
              src={activeItem.imageUrl.startsWith('/') ? activeItem.imageUrl : `/${activeItem.imageUrl}`} 
              alt={activeItem.nameAr} 
              className="w-24 h-24 rounded-xl object-cover border-4 border-background shadow-lg"
            />
          )}
        </div>
        
        <div className="px-4 pb-4 space-y-4">
          <DialogHeader className="pt-2">
            <DialogTitle className="text-xl font-bold text-center text-foreground">
              {activeItem.nameAr}
            </DialogTitle>
            {activeItem.description && (
              <p className="text-xs text-muted-foreground text-center line-clamp-2 mt-1">
                {activeItem.description}
              </p>
            )}
          </DialogHeader>

          {variants.length > 1 && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground">اختر النوع</Label>
              <div className="flex flex-wrap gap-3">
                {variants.map((variant) => {
                  // Differentiate variants by their unique names if they belong to the same group
                  // For example, display "فراولة" instead of the full name if it's a variant
                  const displayName = variant.nameAr.replace(activeItem.nameAr, '').trim() || variant.nameAr;
                  
                  return (
                    <button
                      key={variant.id}
                      onClick={() => {
                        setSelectedVariant(variant);
                        setSelectedSize(null);
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                        selectedVariant?.id === variant.id 
                          ? "bg-primary text-white shadow-md border-2 border-primary" 
                          : "bg-secondary text-foreground border-2 border-border hover:border-primary/50"
                      }`}
                    >
                      {variant.nameAr}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {activeItem.availableSizes && activeItem.availableSizes.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground">اختر الحجم</Label>
              <div className="grid grid-cols-3 gap-2">
                {activeItem.availableSizes.map((size) => (
                  <button
                    key={size.nameAr}
                    onClick={() => setSelectedSize(size.nameAr)}
                    className={`p-2 rounded-xl text-center transition-all ${
                      selectedSize === size.nameAr
                        ? "bg-primary text-white shadow-md"
                        : "bg-secondary border border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="text-xs font-semibold">{size.nameAr}</div>
                    <div className={`text-xs mt-0.5 ${selectedSize === size.nameAr ? "text-white/80" : "text-primary font-bold"}`}>
                      {size.price} ر.س
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {specificAddons.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground">إضافات خاصة</Label>
              <div className="flex flex-wrap gap-2">
                {specificAddons.map((addon) => (
                  <button
                    key={addon.id}
                    onClick={() => {
                      setSelectedAddons((prev) =>
                        prev.includes(addon.id)
                          ? prev.filter((id) => id !== addon.id)
                          : [...prev, addon.id]
                      );
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                      selectedAddons.includes(addon.id)
                        ? "bg-primary text-white shadow-md"
                        : "bg-secondary text-foreground border border-border hover:border-primary/50"
                    }`}
                  >
                    {addon.nameAr}
                    <span className={selectedAddons.includes(addon.id) ? "text-white/80" : "text-primary"}>
                      +{addon.price}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {generalAddons.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground">{specificAddons.length > 0 ? "إضافات عامة" : "إضافات"}</Label>
              <div className="flex flex-wrap gap-2">
                {generalAddons.slice(0, 6).map((addon) => (
                  <button
                    key={addon.id}
                    onClick={() => {
                      setSelectedAddons((prev) =>
                        prev.includes(addon.id)
                          ? prev.filter((id) => id !== addon.id)
                          : [...prev, addon.id]
                      );
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                      selectedAddons.includes(addon.id)
                        ? "bg-accent text-white shadow-md"
                        : "bg-secondary text-foreground border border-border hover:border-accent/50"
                    }`}
                  >
                    {addon.nameAr}
                    <span className={selectedAddons.includes(addon.id) ? "text-white/80" : "text-accent"}>
                      +{addon.price}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {drinkAddons.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground">إضافة مشروب</Label>
              <div className="flex flex-wrap gap-2">
                {drinkAddons.map((addon) => {
                  const linkedDrink = getLinkedDrinkInfo(addon);
                  return (
                    <button
                      key={addon.id}
                      onClick={() => {
                        setSelectedAddons((prev) =>
                          prev.includes(addon.id)
                            ? prev.filter((id) => id !== addon.id)
                            : [...prev, addon.id]
                        );
                      }}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
                        selectedAddons.includes(addon.id)
                          ? "bg-primary text-white shadow-md ring-2 ring-primary/50"
                          : "bg-secondary text-foreground border border-border hover:border-primary/50"
                      }`}
                    >
                      {linkedDrink?.imageUrl && (
                        <img 
                          src={linkedDrink.imageUrl.startsWith('/') ? linkedDrink.imageUrl : `/${linkedDrink.imageUrl}`}
                          alt={addon.nameAr}
                          className="w-6 h-6 rounded object-cover"
                        />
                      )}
                      <span>{addon.nameAr}</span>
                      <span className={selectedAddons.includes(addon.id) ? "text-white/80" : "text-primary font-bold"}>
                        +{addon.price}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between bg-secondary/50 rounded-xl p-3">
            <Label className="text-sm font-semibold text-foreground">الكمية</Label>
            <div className="flex items-center gap-3">
              <Button
                size="icon"
                variant="outline"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="h-8 w-8 rounded-lg border-border"
                data-testid="button-decrease-quantity"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="w-6 text-center font-bold text-lg text-foreground">{quantity}</span>
              <Button
                size="icon"
                variant="outline"
                onClick={() => setQuantity(quantity + 1)}
                className="h-8 w-8 rounded-lg border-border"
                data-testid="button-increase-quantity"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              <span className="text-xs text-muted-foreground">الإجمالي</span>
              <div className="text-2xl font-bold text-primary">
                {totalPrice.toFixed(2)} <span className="text-sm">ر.س</span>
              </div>
            </div>
            <Button
              onClick={handleAddToCart}
              className="bg-primary hover:bg-primary/90 text-white px-6 py-5 rounded-xl font-bold shadow-lg"
              data-testid="button-add-to-cart"
            >
              <ShoppingCart className="w-4 h-4 ml-2" />
              إضافة
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
