// Avatar Upload Service - 后端支持头像上传（在 user register/update 中）
// 头像上传是通过 FormData 直接上传到后端的，不需要 presigned URL

/**
 * 压缩图片到指定尺寸 (Web环境)
 */
const compressImage = async (file: File, maxSize: number = 800): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      // 计算压缩后的尺寸
      let { width, height } = img;

      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // 绘制压缩后的图片
      ctx?.drawImage(img, 0, 0, width, height);

      // 转换为Blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to compress image"));
          }
        },
        "image/png",
        0.9,
      );
    };

    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };

    img.src = URL.createObjectURL(file);
  });
};

/**
 * 压缩头像图片（用于上传）
 * @param file - 用户选择的图片文件
 * @returns File - 压缩后的文件
 */
export const compressAvatarImage = async (file: File): Promise<File> => {
  try {
    const compressedBlob = await compressImage(file, 800);
    const fileName = `avatar_${Date.now()}.png`;
    return new File([compressedBlob], fileName, { type: "image/png" });
  } catch (error) {
    console.error("头像压缩失败:", error);
    throw error;
  }
};