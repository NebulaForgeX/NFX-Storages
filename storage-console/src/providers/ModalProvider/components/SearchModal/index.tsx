import type { LucideIcon } from "@/assets/icons/lucide";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Edit,
  Home,
  Search,
  Shield,
  User,
  X,
} from "@/assets/icons/lucide";
import { useNavigate } from "react-router-dom";

import ModalStore, { useModalStore } from "@/stores/modalStore";
import { ROUTES } from "@/types/navigation";

import styles from "./styles.module.css";

interface SearchItem {
  title: string;
  description: string;
  icon: LucideIcon;
  route: string;
  keywords: string[];
}

const SearchModal = memo(() => {
  const navigate = useNavigate();
  const isOpen = useModalStore((state) => state.searchModal.isOpen);
  const hideModal = ModalStore.getState().hideModal;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  // 定义所有可搜索的功能
  const searchItems: SearchItem[] = useMemo(
    () => [
      {
        title: "仪表盘",
        description: "查看仪表盘和概览",
        icon: Home,
        route: ROUTES.DASHBOARD,
        keywords: ["dashboard", "home", "overview", "仪表盘", "首页", "概览"],
      },
      {
        title: "个人资料",
        description: "查看和管理您的个人资料",
        icon: User,
        route: ROUTES.PROFILE,
        keywords: ["profile", "my profile", "account", "个人资料", "资料", "账户"],
      },
      {
        title: "编辑资料",
        description: "更新您的个人资料信息",
        icon: Edit,
        route: ROUTES.EDIT_PROFILE,
        keywords: ["edit", "profile", "update", "编辑", "资料", "更新"],
      },
      {
        title: "账户安全",
        description: "管理密码和安全设置",
        icon: Shield,
        route: ROUTES.ACCOUNT_SECURITY,
        keywords: ["security", "password", "account", "安全", "密码", "账户"],
      },
    ],
    [],
  );

  // 搜索过滤
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return searchItems;

    const query = searchQuery.toLowerCase();
    return searchItems.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.keywords.some((keyword) => keyword.includes(query)),
    );
  }, [searchQuery, searchItems]);

  // 选择项目
  const handleSelect = useCallback(
    (item: SearchItem) => {
      if (item.route) {
        navigate(item.route);
      }
      hideModal("search");
      setSearchQuery("");
      setSelectedIndex(0);
    },
    [navigate, hideModal],
  );

  // 键盘导航
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : prev));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          handleSelect(filteredItems[selectedIndex]);
        }
      } else if (e.key === "Escape") {
        hideModal("search");
      }
    },
    [filteredItems, selectedIndex, handleSelect, hideModal],
  );

  // Dialog 管理
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  // 焦点管理
  useEffect(() => {
    if (isOpen && inputRef.current) {
      // 延迟确保 dialog 已完全打开
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  }, [isOpen]);

  // 处理 dialog 关闭事件
  const handleDialogClose = useCallback(() => {
    hideModal("search");
  }, [hideModal]);

  // 重置选中索引 - 当搜索查询改变时
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  return (
    <dialog ref={dialogRef} className={styles.modal} onClose={handleDialogClose}>
        <div className={styles.searchBox}>
          <Search size={20} className={styles.searchIcon} />
          <input
            ref={inputRef}
            type="text"
            placeholder="搜索功能、页面..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className={styles.searchInput}
          />
          {searchQuery && (
            <button className={styles.clearBtn} onClick={() => setSearchQuery("")}>
              <X size={16} />
            </button>
          )}
        </div>

        <div className={styles.results}>
          {filteredItems.length > 0 ? (
            filteredItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={index}
                  className={`${styles.resultItem} ${index === selectedIndex ? styles.selected : ""}`}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className={styles.resultIcon}>
                    <Icon size={20} />
                  </div>
                  <div className={styles.resultContent}>
                    <div className={styles.resultTitle}>{item.title}</div>
                    <div className={styles.resultDescription}>{item.description}</div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className={styles.noResults}>
              <p>未找到 &quot;{searchQuery}&quot; 相关结果</p>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <span className={styles.hint}>
            <kbd>↑</kbd> <kbd>↓</kbd> 导航
          </span>
          <span className={styles.hint}>
            <kbd>Enter</kbd> 选择
          </span>
          <span className={styles.hint}>
            <kbd>Esc</kbd> 关闭
          </span>
        </div>
    </dialog>
  );
});

SearchModal.displayName = "SearchModal";
export default SearchModal;
