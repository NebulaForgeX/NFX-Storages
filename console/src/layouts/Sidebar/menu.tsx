import type { ReactNode } from "react";
import type { MenuItemProps, SubMenuProps } from "react-pro-sidebar";

import { createContext, isValidElement, useContext, useEffect, useRef, useState } from "react";
import { IconButton, Popover, Tooltip } from "@radix-ui/themes";
import { Menu, MenuItem as ProMenuItem, SubMenu as ProSubMenu } from "react-pro-sidebar";

import styles from "./s.module.css";

const CollapsedContext = createContext(false);
const NestedContext = createContext(false);

export function SidebarMenuState({ collapsed, children }: { collapsed: boolean; children: ReactNode }) {
  return <CollapsedContext.Provider value={collapsed}>{children}</CollapsedContext.Provider>;
}

function labelText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(labelText).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return labelText(node.props.children);
  return "";
}

export function MenuItem(props: MenuItemProps) {
  const collapsed = useContext(CollapsedContext);
  const nested = useContext(NestedContext);
  const label = labelText(props.children);
  const hasUnread = nested && isValidElement<{ showDot?: boolean }>(props.icon) && props.icon.props.showDot;
  const item = (
    <ProMenuItem
      {...props}
      suffix={props.suffix ?? (hasUnread ? <span className={styles.menuDot} /> : undefined)}
      aria-label={props["aria-label"] ?? label}
      aria-current={props.active ? "page" : undefined}
    />
  );
  return collapsed && !nested ? (
    <Tooltip content={label} side="right" sideOffset={14} delayDuration={150}>
      {item}
    </Tooltip>
  ) : (
    item
  );
}

function CollapsedSubMenu({ children, label, icon, active }: SubMenuProps) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pointerOpened = useRef(false);
  const content = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const cancelClose = () => clearTimeout(closeTimer.current);
  const scheduleClose = () => {
    if (!pointerOpened.current) return;
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 180);
  };
  useEffect(() => () => clearTimeout(closeTimer.current), []);
  return (
    <li className="ps-menuitem-root">
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger>
          <IconButton
            ref={trigger}
            type="button"
            variant="ghost"
            className={`${styles.collapsedSubmenuTrigger} ${active ? styles.collapsedSubmenuCurrent : open ? styles.collapsedSubmenuActive : ""}`}
            aria-label={labelText(label)}
            aria-expanded={open}
            onPointerEnter={() => {
              cancelClose();
              pointerOpened.current = true;
              setOpen(true);
            }}
            onPointerLeave={scheduleClose}
            onClick={(event) => {
              // Hover may already have opened the panel. A click should keep it open.
              event.preventDefault();
              cancelClose();
              pointerOpened.current = false;
              setOpen(true);
              content.current?.querySelector<HTMLAnchorElement>("a[href]")?.focus();
            }}
          >
            {icon}
          </IconButton>
        </Popover.Trigger>
        <Popover.Content
          ref={content}
          side="right"
          align="start"
          sideOffset={12}
          collisionPadding={12}
          className={styles.flyout}
          aria-label={labelText(label)}
          onPointerEnter={cancelClose}
          onPointerLeave={scheduleClose}
          onOpenAutoFocus={(event) => {
            if (pointerOpened.current) event.preventDefault();
          }}
          onCloseAutoFocus={(event) => {
            if (pointerOpened.current) event.preventDefault();
          }}
        >
          <NestedContext.Provider value={true}>
            <Menu
              menuItemStyles={{
                button: ({ active }) => ({
                  height: "34px",
                  margin: "3px 7px",
                  padding: "0 11px",
                  borderRadius: "var(--radius-chip)",
                  font: "14px Arial, sans-serif",
                  color: active ? "var(--accent-11)" : "var(--gray-11)",
                  backgroundColor: active ? "var(--accent-a3)" : "transparent",
                  "&:hover": {
                    backgroundColor: active ? "var(--accent-a3)" : "var(--gray-a3)",
                    color: active ? "var(--accent-11)" : "var(--gray-12)",
                  },
                  "&:focus-visible": {
                    outline: "2px solid var(--accent-8)",
                    outlineOffset: "-2px",
                  },
                }),
                icon: { display: "none" },
              }}
              onClick={(event) => {
                if ((event.target as HTMLElement).closest("a[href]")) setOpen(false);
              }}
            >
              {children}
            </Menu>
          </NestedContext.Provider>
        </Popover.Content>
      </Popover.Root>
    </li>
  );
}

export function SubMenu({ children, ...props }: SubMenuProps) {
  const collapsed = useContext(CollapsedContext);
  if (collapsed) return <CollapsedSubMenu {...props}>{children}</CollapsedSubMenu>;
  return (
    <ProSubMenu {...props} aria-label={labelText(props.label)} aria-expanded={props.open}>
      <NestedContext.Provider value={true}>{children}</NestedContext.Provider>
    </ProSubMenu>
  );
}
