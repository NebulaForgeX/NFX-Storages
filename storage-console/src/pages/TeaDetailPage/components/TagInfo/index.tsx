import { memo } from "react";
import { Tag } from "@/assets/icons/lucide";

import styles from "./styles.module.css";

interface TagInfoProps {
  tags: string[];
}

const TagInfo = memo(({ tags }: TagInfoProps) => {
  if (!tags.length) return null;

  return (
    <div className={styles.infoSection}>
      <h2 className={styles.sectionTitle}>标签</h2>
      <div className={styles.tagRow}>
        <div className={styles.iconWrapper}>
          <Tag size={18} />
        </div>
        <div className={styles.tagList}>
          {tags.map(tag => (
            <span className={styles.tagChip} key={tag}>
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
});

TagInfo.displayName = "TagInfo";

export default TagInfo;


