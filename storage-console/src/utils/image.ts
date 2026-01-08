import { API_ENDPOINTS } from "@/apis/types";

/**
 * 构建图片的完整 URL
 * 如果已经是完整 URL，直接返回
 * 如果是相对路径（如 "ca0376be-5690-4b0e-a18f-daab1ab80aec.png"），构建为完整 URL
 * @param imagePath - 图片路径（可能是相对路径或完整 URL）
 * @param type - 图片类型，默认为 "avatar"（可能是 "avatar"、"tea"、"category" 等）
 * @param isTemp - 是否是临时图片（临时图片使用 tmp/${type} 前缀）
 * @returns 完整的图片 URL
 */
export const buildImageUrl = (
  imagePath: string | null | undefined,
  type: "avatar" | "tea" | "category" | string = "avatar",
  isTemp: boolean = false,
): string => {
  if (!imagePath) return "";

  // 如果已经是完整 URL（http:// 或 https://），直接返回
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  // 如果是相对路径，构建完整 URL
  const baseUrl = API_ENDPOINTS.IMAGE.replace(/\/$/, ""); // 移除末尾斜杠
  const cleanPath = imagePath.startsWith("/") ? imagePath.slice(1) : imagePath; // 移除开头的斜杠
  
  // 临时图片使用 tmp/${type}/ 前缀
  const prefix = isTemp ? `tmp/${type}` : type;
  
  return `${baseUrl}/images/${prefix}/${cleanPath}`;
};

