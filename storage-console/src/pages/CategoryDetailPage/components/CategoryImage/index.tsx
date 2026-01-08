import { memo } from "react";
import { Image as ImageIcon } from "@/assets/icons/lucide";

import { buildImageUrl } from "@/utils/image";

import styles from "./styles.module.css";

interface CategoryImageProps {
  image?: string;
  name: string;
}

const CategoryImage = memo(({ image, name }: CategoryImageProps) => {
  return (
    <div className={styles.imageSection}>
      {image ? (
        <img
          src={buildImageUrl(image, "category")}
          alt={name}
          className={styles.categoryImage}
        />
      ) : (
        <div className={styles.imagePlaceholder}>
          <ImageIcon size={64} />
          <p>暂无图片</p>
        </div>
      )}
    </div>
  );
});

CategoryImage.displayName = "CategoryImage";

export default CategoryImage;

