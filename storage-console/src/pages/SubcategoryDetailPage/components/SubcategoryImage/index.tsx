import { memo } from "react";
import { Image as ImageIcon } from "@/assets/icons/lucide";

import { buildImageUrl } from "@/utils/image";

import styles from "./styles.module.css";

interface SubcategoryImageProps {
  image?: string;
  name: string;
}

const SubcategoryImage = memo(({ image, name }: SubcategoryImageProps) => {
  return (
    <div className={styles.imageSection}>
      {image ? (
        <img
          src={buildImageUrl(image, "category")}
          alt={name}
          className={styles.subcategoryImage}
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

SubcategoryImage.displayName = "SubcategoryImage";

export default SubcategoryImage;

