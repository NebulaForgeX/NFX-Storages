import type { TeaImage } from "@/apis/domain";

import { memo, useState } from "react";
import { ChevronLeft, ChevronRight, Image } from "@/assets/icons/lucide";

import { buildImageUrl } from "@/utils/image";

import styles from "./styles.module.css";

interface TeaImagesProps {
  images: TeaImage[];
  name: string;
}

const TeaImages = memo(({ images, name }: TeaImagesProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className={styles.imageSection}>
        <h2 className={styles.sectionTitle}>茶叶图片</h2>
        <div className={styles.emptyImage}>
          <Image size={64} />
          <p>暂无图片</p>
        </div>
      </div>
    );
  }

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className={styles.imageSection}>
      <h2 className={styles.sectionTitle}>茶叶图片</h2>
      
      <div className={styles.mainImageContainer}>
        <img
          src={buildImageUrl(images[currentIndex].imageFile, "tea", false)}
          alt={`${name} - ${currentIndex + 1}`}
          className={styles.mainImage}
        />
        
        {images.length > 1 && (
          <>
            <button className={styles.navBtn} onClick={handlePrevious} aria-label="上一张">
              <ChevronLeft size={24} />
            </button>
            <button className={`${styles.navBtn} ${styles.navBtnNext}`} onClick={handleNext} aria-label="下一张">
              <ChevronRight size={24} />
            </button>
            <div className={styles.indicator}>
              {currentIndex + 1} / {images.length}
            </div>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className={styles.thumbnailList}>
          {images.map((image, index) => (
            <button
              key={image.id}
              className={`${styles.thumbnail} ${index === currentIndex ? styles.thumbnailActive : ""}`}
              onClick={() => setCurrentIndex(index)}
            >
              <img
                src={buildImageUrl(image.imageFile, "tea", false)}
                alt={`${name} - 缩略图 ${index + 1}`}
                className={styles.thumbnailImage}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

TeaImages.displayName = "TeaImages";

export default TeaImages;

