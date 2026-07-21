import { create } from "zustand";

interface UiState {
  toast: string | null;
  /** 盤面で選択中のオブジェクト（シール／テキスト／写真／線）のID */
  selectedId: string | null;
  /** つなぎ線モード（notestyle）と、1つ目に選んだテキストID */
  connectMode: boolean;
  connectFromId: string | null;

  showToast: (message: string) => void;
  hideToast: () => void;
  select: (id: string | null) => void;
  toggleConnectMode: () => void;
  setConnectFrom: (id: string | null) => void;
  resetBoardUi: () => void;
}

let toastTimer: ReturnType<typeof setTimeout> | null = null;

export const useUi = create<UiState>()((set, get) => ({
  toast: null,
  selectedId: null,
  connectMode: false,
  connectFromId: null,

  showToast: (message) => {
    if (toastTimer) clearTimeout(toastTimer);
    set({ toast: message });
    toastTimer = setTimeout(() => set({ toast: null }), 1800);
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

  /** ページ切り替え・手帳を開閉したときに盤面UIの一時状態を消す */
  resetBoardUi: () => set({ selectedId: null, connectMode: false, connectFromId: null }),
}));
