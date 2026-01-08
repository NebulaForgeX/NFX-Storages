import { memo } from "react";
import { FolderTree, Layers, Leaf, TrendingUp } from "@/assets/icons/lucide";

import {
  useCategoriesCount,
  useSubcategoriesCount,
  useTeasCount,
  useTeasViews,
} from "@/hooks/useStats";

import styles from "./styles.module.css";

interface StatCard {
  title: string;
  icon: React.ReactNode;
  color: string;
  route?: string;
}

const StatsCardsContent = memo(() => {
  const { data: categoriesCount = 0 } = useCategoriesCount();
  const { data: subcategoriesCount = 0 } = useSubcategoriesCount();
  const { data: teasCount = 0 } = useTeasCount();
  const { data: totalViews = 0 } = useTeasViews();

  const stats: (StatCard & { value: number })[] = [
    {
      title: "分类总数",
      value: categoriesCount,
      icon: <FolderTree size={32} />,
      color: "var(--color-fg-highlight)",
      route: "/categories",
    },
    {
      title: "子分类总数",
      value: subcategoriesCount,
      icon: <Layers size={32} />,
      color: "var(--color-info)",
      route: "/subcategories",
    },
    {
      title: "茶叶总数",
      value: teasCount,
      icon: <Leaf size={32} />,
      color: "var(--color-success)",
      route: "/teas",
    },
    {
      title: "总浏览量",
      value: totalViews,
      icon: <TrendingUp size={32} />,
      color: "var(--color-warning)",
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>数据概览</h2>
        <p className={styles.subtitle}>系统核心数据统计</p>
      </div>

      <div className={styles.grid}>
        {stats.map((stat, index) => (
          <div
            key={index}
            className={styles.statCard}
            style={{ "--stat-color": stat.color } as React.CSSProperties}
          >
            <div className={styles.iconWrapper}>{stat.icon}</div>
            <div className={styles.content}>
              <div className={styles.value}>{stat.value.toLocaleString()}</div>
              <div className={styles.label}>{stat.title}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

StatsCardsContent.displayName = "StatsCardsContent";

export default StatsCardsContent;

