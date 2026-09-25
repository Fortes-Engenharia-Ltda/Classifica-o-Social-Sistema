import { create } from 'zustand';

export type DashboardFilterPlacement = 'header' | 'menu-side';

interface UIStore {
  sidebarOpen: boolean;
  darkMode: boolean;
  dashboardFilterPlacement: DashboardFilterPlacement;
  dashboardSideFilterExpanded: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleDarkMode: () => void;
  setDashboardFilterPlacement: (placement: DashboardFilterPlacement) => void;
  toggleDashboardSideFilterExpanded: () => void;
}

const savedPlacement = localStorage.getItem('dashboardFilterPlacement');
const initialPlacement: DashboardFilterPlacement = savedPlacement === 'menu-side' ? 'menu-side' : 'header';
const savedSideFilterExpanded = localStorage.getItem('dashboardSideFilterExpanded');
const initialSideFilterExpanded = savedSideFilterExpanded ? savedSideFilterExpanded === 'true' : true;

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  darkMode: localStorage.getItem('darkMode') === 'true',
  dashboardFilterPlacement: initialPlacement,
  dashboardSideFilterExpanded: initialSideFilterExpanded,

  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  toggleDarkMode: () =>
    set((state) => {
      const newDarkMode = !state.darkMode;
      localStorage.setItem('darkMode', newDarkMode.toString());
      if (newDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return { darkMode: newDarkMode };
    }),

  setDashboardFilterPlacement: (placement) =>
    set(() => {
      localStorage.setItem('dashboardFilterPlacement', placement);
      return { dashboardFilterPlacement: placement };
    }),

  toggleDashboardSideFilterExpanded: () =>
    set((state) => {
      const nextExpanded = !state.dashboardSideFilterExpanded;
      localStorage.setItem('dashboardSideFilterExpanded', String(nextExpanded));
      return { dashboardSideFilterExpanded: nextExpanded };
    }),
}));
