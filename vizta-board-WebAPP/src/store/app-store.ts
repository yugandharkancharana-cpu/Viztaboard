/**
 * Zustand global store — only truly global UI state lives here.
 * Server data belongs in React Query; local component state stays in useState.
 */

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface SidebarState {
  collapsed: boolean
  toggleCollapsed: () => void
  setCollapsed: (v: boolean) => void
}

interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  description?: string
}

interface ToastState {
  toasts: ToastMessage[]
  addToast: (toast: Omit<ToastMessage, 'id'>) => void
  removeToast: (id: string) => void
}

interface AppState extends SidebarState, ToastState {}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        // ── Sidebar ────────────────────────────────────────────────────────
        collapsed: false,
        toggleCollapsed: () => set((s) => ({ collapsed: !s.collapsed })),
        setCollapsed: (v) => set({ collapsed: v }),

        // ── Toasts ─────────────────────────────────────────────────────────
        toasts: [],
        addToast: (toast) => {
          const id = crypto.randomUUID()
          set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }))
          // Auto-dismiss after 5 s
          setTimeout(() => get().removeToast(id), 5_000)
        },
        removeToast: (id) =>
          set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
      }),
      {
        name: 'vizta-board-ui',
        partialize: (state) => ({ collapsed: state.collapsed }), // only persist sidebar pref
      },
    ),
    { name: 'ViztraBoard' },
  ),
)

// Convenience selectors
export const useSidebar = () =>
  useAppStore((s) => ({ collapsed: s.collapsed, toggle: s.toggleCollapsed }))

export const useToast = () =>
  useAppStore((s) => ({ toasts: s.toasts, add: s.addToast, remove: s.removeToast }))
