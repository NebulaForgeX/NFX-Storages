import { useQuery } from "@tanstack/react-query";
import {
  GetCategoriesCount,
  GetSubcategoriesCount,
  GetTeasCount,
  GetTeasViews,
} from "@/apis/stats.api";

/**
 * 获取分类总数
 */
export const useCategoriesCount = () => {
  return useQuery({
    queryKey: ["stats", "categories", "count"],
    queryFn: GetCategoriesCount,
    staleTime: 60000, // 1分钟
  });
};

/**
 * 获取子分类总数
 */
export const useSubcategoriesCount = () => {
  return useQuery({
    queryKey: ["stats", "subcategories", "count"],
    queryFn: GetSubcategoriesCount,
    staleTime: 60000,
  });
};

/**
 * 获取茶叶总数
 */
export const useTeasCount = () => {
  return useQuery({
    queryKey: ["stats", "teas", "count"],
    queryFn: GetTeasCount,
    staleTime: 60000,
  });
};

/**
 * 获取茶叶总浏览量
 */
export const useTeasViews = () => {
  return useQuery({
    queryKey: ["stats", "teas", "views"],
    queryFn: GetTeasViews,
    staleTime: 60000,
  });
};

