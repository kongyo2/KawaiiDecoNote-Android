import { create } from "zustand";

interface UiState {
  toast: string | null;
  selectedId: string | null;
  connectMode: boolean;
  connectFromId: string | null;
  // 追加したばかりの工程・テキストの id。マウント時にキーボードを開くために使う。
  focusId: string | null;

  showToast: (message: string) => void;
  hideToast: () => void;
  select: (id: string | null) => void;
  toggleConnectMode: () => void;
  setConnectFrom: (id: string | null) => void;
  setFocus: (id: string | null) => void;
  resetBoardUi: () => void;
}

const TOAST_MS = 1800;

let toastTimer: ReturnType<typeof setTimeout> | null = null;

export const useUi = create<UiState>()((set, get) => ({
  toast: null,
  selectedId: null,
  connectMode: false,
  connectFromId: null,
  focusId: null,

  showToast: (message) => {
    if (toastTimer) clearTimeout(toastTimer);
    set({ toast: message });
    toastTimer = setTimeout(() => set({ toast: null }), TOAST_MS);
  },

  hideToast: () => {
    if (toastTimer) clearTimeout(toastTimer);
    set({ toast: null });
  },

  select: (id) => {
    if (get().selectedId !== id) set({ selectedId: id });
  },

  toggleConnectMode: () => set({ connectMode: !get().connectMode, connectFromId: null }),
  setConnectFrom: (id) => set({ connectFromId: id }),

  setFocus: (id) => {
    if (get().focusId !== id) set({ focusId: id });
  },

  resetBoardUi: () => set({ selectedId: null, connectMode: false, connectFromId: null, focusId: null }),
}));
