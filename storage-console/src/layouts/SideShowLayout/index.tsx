import type { ReactNode } from "react";

import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { useLayoutEffect, useRef, useState, useCallback } from "react";
import { Footer, Header, Sidebar } from "@/components";
import LayoutStore, { useLayoutStore } from "@/stores/layoutStore";
import { ROUTES } from "@/types/navigation";

import styles from "./styles.module.css";

interface SideShowLayoutProps {
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

function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new ResizeObserver(([entry]) => {
      const nextWidth = entry?.contentRect.width ?? 0;
      setWidth((prev) => (prev !== nextWidth ? nextWidth : prev));
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const callbackRef = useCallback((instance: T | null) => {
    if (instance) {
      ref.current = instance;
    }
  }, []);

  return [callbackRef, width] as const;
}

const SideShowLayout = memo(({ children }: SideShowLayoutProps) => {
  const navigate = useNavigate();
  const sidebarOpen = useLayoutStore((state) => state.sidebarOpen);
  const toggleSidebar = LayoutStore.getState().toggleSidebar;
  const closeSidebar = LayoutStore.getState().closeSidebar;
  const [footerRef, footerHeight] = useElementHeight<HTMLDivElement>();
  const [headerRef, headerHeight] = useElementHeight<HTMLDivElement>();
  const [sidebarRef, sidebarWidth] = useElementWidth<HTMLDivElement>();
  const handleNavigateHome = () => {
    navigate(ROUTES.DASHBOARD);
  };

  const handleBackdropClick = () => {
    closeSidebar();
  };

  return (
    <div className={styles.layout}>


      {/* Header */}
      <header ref={headerRef} className={styles.header}>
        <Header onToggleSidebar={toggleSidebar} onNavigateHome={handleNavigateHome} />
      </header>
      {/* Sidebar */}      
      <div
        ref={sidebarRef}
        className={styles.sidebarContainer}
        style={{
          top: `${headerHeight}px`,
          height: `calc(100vh - ${headerHeight + footerHeight}px)`
        }}
      >
        <Sidebar
          collapsed={sidebarOpen}
          toggled={sidebarOpen}
          onBackdropClick={handleBackdropClick}
          breakPoint="xs"
          className={styles.sidebar}
        />
      </div>
      {/* Main Content Area with Sidebar */}
      <main className={styles.mainWrapper} style={{ 
        marginTop: `${headerHeight}px`,
        marginBottom: `${footerHeight}px`,
        // transform: `translateX(${sidebarWidth}px)`,
        marginLeft: `${sidebarWidth}px`,
        width: `calc(100% - ${sidebarWidth}px)`,
      }}>
        {/* Content */}
        <div className={styles.content}>
          {children}
        </div>
      </main>

      {/* Footer */}
      {/* Footer */}
      <footer ref={footerRef} className={styles.footer}>
        <Footer />
      </footer>
    </div>
  );
});

SideShowLayout.displayName = "SideShowLayout";

export default SideShowLayout;
