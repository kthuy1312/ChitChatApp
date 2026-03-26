import { create } from "zustand";

interface ConversationInfoState {
    showInfo: boolean;
    toggleInfo: () => void;
    closeInfo: () => void;
    openInfo: () => void;
}

export const useConversationInfoStore = create<ConversationInfoState>((set) => ({
    showInfo: false,
    toggleInfo: () => set((state) => ({ showInfo: !state.showInfo })),
    closeInfo: () => set({ showInfo: false }),
    openInfo: () => set({ showInfo: true }),
}));
