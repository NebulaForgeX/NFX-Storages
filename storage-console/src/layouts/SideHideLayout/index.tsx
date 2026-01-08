import type { ReactNode } from "react";

import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { useLayoutEffect, useRef, useState, useCallback } from "react";
import { Footer, Header, Sidebar } from "@/components";
import LayoutStore, { useLayoutStore } from "@/stores/layoutStore";
import { ROUTES } from "@/types/navigation";

import styles from "./styles.module.css";

interface SideHideLayoutProps {
  children: ReactNode;
}

function useElementHeight<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new ResizeObserver(([entry]) => {
      const nextHeight = entry?.contentRect.height ?? 0;
      setHeight((prev) => (prev !== nextHeight ? nextHeight : prev));
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const callbackRef = useCallback((instance: T | null) => {
    if (instance) {
      ref.current = instance;
    }
  }, []);

  return [callbackRef, height] as const;
}

const SideHideLayout = memo(({ children }: SideHideLayoutProps) => {
  const navigate = useNavigate();
  const sidebarOpen = useLayoutStore((state) => state.sidebarOpen);
  const toggleSidebar = LayoutStore.getState().toggleSidebar;
  const closeSidebar = LayoutStore.getState().closeSidebar;
  
  const [headerRef, headerHeight] = useElementHeight<HTMLDivElement>();
  const [footerRef, footerHeight] = useElementHeight<HTMLDivElement>();

  const handleNavigateHome = useCallback(() => {
    navigate(ROUTES.DASHBOARD);
  }, [ navigate ]);

  const handleBackdropClick = useCallback(() => {
    closeSidebar();
  }, [ closeSidebar ]);

  console.log("headerHeight", headerHeight);
  console.log("footerHeight", footerHeight);


  return (
    <div className={styles.layout}>

      {/* Header */}
      <header ref={headerRef} className={styles.header}>
        <Header onToggleSidebar={toggleSidebar} onNavigateHome={handleNavigateHome} />
      </header>

      {/* Main Content Area with Sidebar */}
      <main className={styles.mainWrapper} style={{ 
        marginTop: `${headerHeight}px`,
        marginBottom: `${footerHeight}px`,
      }}>
      {/* Sidebar */}
      <Sidebar
        toggled={sidebarOpen}
        onBackdropClick={handleBackdropClick}
        breakPoint="all"
        className={styles.sidebar}
      />

        {/* Content */}
        <div className={styles.content}>{children}</div>
      </main>

      {/* Footer */}
      <footer ref={footerRef} className={styles.footer}>
        <Footer />
      </footer>
    </div>
  );
});

SideHideLayout.displayName = "SideHideLayout";

export default SideHideLayout;
