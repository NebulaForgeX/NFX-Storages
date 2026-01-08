import { memo, useState } from "react";
import { Package, Plus, X } from "@/assets/icons/lucide";
import * as LucideIcons from "@/assets/icons/lucide";
import { useNavigate } from "react-router-dom";

import { showConfirm, showInfo } from "@/stores/modalStore";
import QuickStore, { ALL_AVAILABLE_ITEMS, useQuickStore } from "@/stores/quickStore";

import styles from "./styles.module.css";

const QuickNavigation = memo(() => {
  const navigate = useNavigate();
  const items = useQuickStore((state) => state.items);
  const isEditMode = useQuickStore((state) => state.isEditMode);
  const removeItem = QuickStore.getState().removeItem;
  const addItem = QuickStore.getState().addItem;
  const [showAddMenu, setShowAddMenu] = useState(false);

  const handleNavigate = (route: string) => {
    if (!isEditMode) {
      navigate(route);
    }
  };

  const handleDelete = (id: string, title: string, event: React.MouseEvent) => {
    event.stopPropagation();
    showConfirm(
      {
        message: `确定要从快速导航中移除"${title}"吗？`,
        onConfirm: () => {
          removeItem(id);
        },
        title: "移除项目",
      }
    );
  };

  const handleAddItem = (item: (typeof ALL_AVAILABLE_ITEMS)[0]) => {
    const isAlreadyAdded = items.some((i) => i.id === item.id || i.route === item.route);
    if (isAlreadyAdded) {
      showInfo("该项目已在您的快速导航中", "已添加");
      return;
    }
    addItem(item);
    setShowAddMenu(false);
  };

  // 过滤掉已添加的项
  const filteredAvailableItems = ALL_AVAILABLE_ITEMS.filter(
    (item) => !items.some((i) => i.id === item.id || i.route === item.route),
  );

  const renderIcon = (iconName: string) => {
    const IconComponent = LucideIcons[iconName as keyof typeof LucideIcons] as React.ComponentType<{ size?: number }>;
    if (!IconComponent) {
      return <Package size={24} />;
    }
    return <IconComponent size={24} />;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>快速访问所有功能</h2>
      </div>

      <div className={styles.grid}>
        {items.map((item) => (
          <div key={item.id} className={styles.navCardWrapper}>
            <button
              className={styles.navCard}
              onClick={() => handleNavigate(item.route)}
              style={{ "--card-color": item.color } as React.CSSProperties}
              disabled={isEditMode}
            >
              <div className={styles.iconWrapper}>{renderIcon(item.icon)}</div>
              <div className={styles.content}>
                <h3 className={styles.cardTitle}>{item.title}</h3>
                <p className={styles.cardDescription}>{item.description}</p>
              </div>
            </button>
            {isEditMode && (
              <button
                type="button"
                className={styles.deleteButton}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDelete(item.id, item.title, e);
                }}
                aria-label={`删除 ${item.title}`}
                title={`删除 ${item.title}`}
              >
                <X size={16} />
              </button>
            )}
          </div>
        ))}

        {isEditMode && (
          <div className={styles.addCardWrapper}>
            {showAddMenu && filteredAvailableItems.length > 0 ? (
              <div className={styles.addMenu}>
                <div className={styles.addMenuHeader}>
                  <h4>添加到快速导航</h4>
                  <button
                    className={styles.closeMenuButton}
                    onClick={() => setShowAddMenu(false)}
                    aria-label="关闭菜单"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className={styles.addMenuItems}>
                  {filteredAvailableItems.map((item) => (
                    <button
                      key={item.id}
                      className={styles.addMenuItem}
                      onClick={() => handleAddItem(item)}
                      style={{ "--card-color": item.color } as React.CSSProperties}
                    >
                      <div className={styles.addMenuItemIcon}>{renderIcon(item.icon)}</div>
                      <div className={styles.addMenuItemContent}>
                        <div className={styles.addMenuItemTitle}>{item.title}</div>
                        <div className={styles.addMenuItemDescription}>{item.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <button
                className={styles.addButton}
                onClick={() => {
                  if (filteredAvailableItems.length > 0) {
                    setShowAddMenu(true);
                  } else {
                    showInfo("没有更多可添加的项目", "无项目");
                  }
                }}
                aria-label="添加新项目"
                title="添加新项目"
              >
                <div
                  className={styles.iconWrapper}
                  style={{ "--card-color": "var(--color-fg-muted)" } as React.CSSProperties}
                >
                  <Plus size={24} />
                </div>
                <div className={styles.content}>
                  <h3 className={styles.cardTitle} style={{ color: "var(--color-fg-muted)" }}>
                    添加项目
                  </h3>
                  <p className={styles.cardDescription}>添加新的导航项目</p>
                </div>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

QuickNavigation.displayName = "QuickNavigation";

export default QuickNavigation;
