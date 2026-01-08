import type { TeaImageEditable } from "@/apis/domain";

import { memo, useCallback, useRef, useState } from "react";
import { Upload, X, GripVertical, Loader2 } from "@/assets/icons/lucide";
import { v4 as uuidv4 } from "uuid";

import { UploadTempTeaImage } from "@/apis/tea.api";
import { showError } from "@/stores/modalStore";
import { buildImageUrl } from "@/utils/image";

import styles from "./styles.module.css";

interface TeaImageUploaderProps {
  images: TeaImageEditable[];
  onChange: (images: TeaImageEditable[]) => void;
  maxImages?: number;
  error?: string;
}

const TeaImageUploader = memo(({
  images,
  onChange,
  maxImages = 10,
  error,
}: TeaImageUploaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // 处理文件选择
  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      // 检查是否超出最大数量
      if (images.length + files.length > maxImages) {
        showError(`最多只能上传 ${maxImages} 张图片`);
        return;
      }

      const fileArray = Array.from(files);

      // 验证文件类型
      const validFiles = fileArray.filter((file) => file.type.startsWith("image/"));
      if (validFiles.length !== fileArray.length) {
        showError("请只选择图片文件");
      }

      if (validFiles.length === 0) return;

      try {
        setIsUploading(true);

        // 逐个上传图片到临时目录
        const uploadPromises = validFiles.map(async (file) => {
          try {
            const response = await UploadTempTeaImage(file);
            return {
              id: uuidv4(), // 前端生成的 UUID
              imageFile: response.tempFilename, // 临时文件名
              index: images.length, // 临时 index，后面会重新排序
              isTemp: true, // 新上传的图片标记为临时图片
            };
          } catch (error) {
            console.error("Upload failed for file:", file.name, error);
            return null;
          }
        });

        const uploadedImages = await Promise.all(uploadPromises);
        const successfulUploads = uploadedImages.filter((img): img is NonNullable<typeof img> => img !== null);

        if (successfulUploads.length === 0) {
          showError("所有图片上传失败，请重试");
          return;
        }

        // 合并图片并重新排序 index
        const newImages: TeaImageEditable[] = [...images, ...successfulUploads].map((img, idx) => ({
          ...img,
          index: idx,
        }));

        onChange(newImages);

        if (successfulUploads.length < validFiles.length) {
          showError(`${validFiles.length - successfulUploads.length} 张图片上传失败`);
        }
      } catch (error) {
        console.error("Upload error:", error);
        showError("上传失败，请重试");
      } finally {
        setIsUploading(false);
        // 重置 input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [images, maxImages, onChange]
  );

  // 删除图片
  const handleDeleteImage = useCallback(
    (index: number) => {
      const newImages = images.filter((_, idx) => idx !== index).map((img, idx) => ({
        ...img,
        index: idx, // 重新排序
      }));
      onChange(newImages);
    },
    [images, onChange]
  );

  // 拖拽开始
  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);

  // 拖拽结束
  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
  }, []);

  // 拖拽进入
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  // 放置
  const handleDrop = useCallback(
    (e: React.DragEvent, dropIndex: number) => {
      e.preventDefault();
      if (draggedIndex === null || draggedIndex === dropIndex) return;

      const newImages = [...images];
      const [draggedImage] = newImages.splice(draggedIndex, 1);
      newImages.splice(dropIndex, 0, draggedImage);

      // 重新排序 index
      const reorderedImages = newImages.map((img, idx) => ({
        ...img,
        index: idx,
      }));

      onChange(reorderedImages);
      setDraggedIndex(null);
    },
    [draggedIndex, images, onChange]
  );

  return (
    <div className={styles.container}>
      <label className={styles.label}>
        茶叶图片 <span className={styles.required}>*</span>
      </label>
      <p className={styles.hint}>至少上传 1 张，最多 {maxImages} 张。拖拽图片可调整顺序。</p>

      <div className={styles.imagesGrid}>
        {images.map((image, index) => (
          <div
            key={image.id}
            className={`${styles.imageItem} ${draggedIndex === index ? styles.dragging : ""}`}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
          >
            <img
              src={buildImageUrl(image.imageFile, "tea", image.isTemp ?? true)}
              alt={`Tea ${index + 1}`}
              className={styles.image}
            />
            <button
              type="button"
              className={styles.deleteBtn}
              onClick={() => handleDeleteImage(index)}
              aria-label="删除图片"
            >
              <X size={16} />
            </button>
            <div className={styles.dragHandle}>
              <GripVertical size={16} />
            </div>
            {index === 0 && <div className={styles.primaryBadge}>封面</div>}
          </div>
        ))}

        {images.length < maxImages && (
          <button
            type="button"
            className={styles.uploadBtn}
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className={styles.spinner} size={24} />
                <span>上传中...</span>
              </>
            ) : (
              <>
                <Upload size={24} />
                <span>上传图片</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: "none" }}
        onChange={handleFileChange}
        disabled={isUploading}
      />

      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
});

TeaImageUploader.displayName = "TeaImageUploader";

export default TeaImageUploader;

