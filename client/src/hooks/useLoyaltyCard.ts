import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCustomer } from "@/contexts/CustomerContext";
import { apiRequest } from "@/lib/queryClient";

export interface LoyaltyCard {
  id: string;
  _id?: string;
  customerName: string;
  phoneNumber: string;
  stamps: number;
  freeCupsEarned: number;
  freeCupsRedeemed: number;
  cardNumber: string;
  qrToken: string;
  points?: number;
  pendingPoints?: number;
  tier?: string;
  totalSpent?: number;
  discountCount?: number;
  createdAt: string;
  updatedAt?: string;
  lastSyncedAt?: string;
}

const STORAGE_KEY = "qahwa-loyalty-card";
const PROFILE_STORAGE_KEY = "qahwa-customer-profile";
const PENDING_SYNC_KEY = "qahwa-loyalty-pending-sync";
const QUERY_KEY_PREFIX = "/api/loyalty/cards/phone";

function syncAllStorages(card: LoyaltyCard | null, isServerData = false) {
  if (card) {
    const cardWithSync = {
      ...card,
      lastSyncedAt: isServerData ? new Date().toISOString() : card.lastSyncedAt,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cardWithSync));
    
    const profile = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (profile) {
      try {
        const parsed = JSON.parse(profile);
        const updated = {
          ...parsed,
          cardNumber: card.cardNumber,
          stamps: card.stamps,
          tier: card.tier,
          totalSpent: card.totalSpent,
          freeDrinks: Math.max(0, (card.freeCupsEarned || 0) - (card.freeCupsRedeemed || 0)),
        };
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to sync to profile:", e);
      }
    }
    
    if (isServerData) {
      localStorage.removeItem(PENDING_SYNC_KEY);
    }
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function markPendingSync(operation: { type: string; data: any }) {
  const pending = getPendingSyncOperations();
  pending.push({ ...operation, timestamp: new Date().toISOString() });
  localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(pending));
}

function getPendingSyncOperations(): Array<{ type: string; data: any; timestamp: string }> {
  try {
    const stored = localStorage.getItem(PENDING_SYNC_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function needsSync(): boolean {
  const pendingOps = getPendingSyncOperations();
  return pendingOps.length > 0;
}

function getFromLocalStorage(): LoyaltyCard | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function useLoyaltyCard(phoneNumber?: string) {
  const { customer } = useCustomer();
  const queryClient = useQueryClient();
  
  const phone = phoneNumber || customer?.phone;
  
  const {
    data: card,
    isLoading,
    error,
    refetch,
  } = useQuery<LoyaltyCard | null>({
    queryKey: ["/api/loyalty/cards/phone", phone],
    queryFn: async () => {
      if (!phone) {
        const cached = getFromLocalStorage();
        return cached;
      }
      
      try {
        const response = await fetch(`/api/loyalty/cards/phone/${phone}`);
        if (response.ok) {
          const data = await response.json();
          syncAllStorages(data, true);
          return data;
        }
        if (response.status === 404) {
          return null;
        }
        throw new Error("Failed to fetch card");
      } catch (error) {
        const cached = getFromLocalStorage();
        if (cached) {
          console.log("Using cached loyalty card data (offline mode)");
          return cached;
        }
        throw error;
      }
    },
    enabled: true,
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });

  const createCardMutation = useMutation({
    mutationFn: async (data: { customerName: string; phoneNumber: string }) => {
      const response = await apiRequest("POST", "/api/loyalty/cards", data);
      return await response.json();
    },
    onSuccess: (newCard) => {
      syncAllStorages(newCard, true);
      queryClient.setQueryData(["/api/loyalty/cards/phone", newCard.phoneNumber], newCard);
    },
  });

  const redeemCodeMutation = useMutation({
    mutationFn: async ({ code, cardId }: { code: string; cardId: string }) => {
      const response = await apiRequest("POST", "/api/loyalty/redeem-code", { code, cardId });
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.card) {
        syncAllStorages(data.card, true);
        queryClient.setQueryData(["/api/loyalty/cards/phone", data.card.phoneNumber], data.card);
      }
    },
  });

  const updateCardInCache = (updatedCard: LoyaltyCard, isServerData = false) => {
    syncAllStorages(updatedCard, isServerData);
    queryClient.setQueryData(["/api/loyalty/cards/phone", updatedCard.phoneNumber], updatedCard);
  };

  const hasPendingSync = needsSync();

  const availableFreeDrinks = card ? Math.max(0, (card.freeCupsEarned || 0) - (card.freeCupsRedeemed || 0)) : 0;
  const stampsToNextFreeDrink = card ? 6 - (card.stamps % 6) : 6;

  return {
    card,
    isLoading,
    error,
    refetch,
    createCard: createCardMutation.mutate,
    isCreating: createCardMutation.isPending,
    redeemCode: redeemCodeMutation.mutate,
    isRedeeming: redeemCodeMutation.isPending,
    updateCardInCache,
    availableFreeDrinks,
    stampsToNextFreeDrink,
    hasCard: !!card,
    hasPendingSync,
    lastSyncedAt: card?.lastSyncedAt,
  };
}

export function useLoyaltyCardByNumber(cardNumber?: string) {
  const queryClient = useQueryClient();
  
  const {
    data: card,
    isLoading,
    error,
  } = useQuery<LoyaltyCard | null>({
    queryKey: ["/api/loyalty/cards/number", cardNumber],
    queryFn: async () => {
      if (!cardNumber) return null;
      
      const response = await fetch(`/api/loyalty/cards/${cardNumber}`);
      if (response.ok) {
        return await response.json();
      }
      if (response.status === 404) {
        return null;
      }
      throw new Error("Failed to fetch card");
    },
    enabled: !!cardNumber,
    staleTime: 30000,
  });

  return { card, isLoading, error };
}
