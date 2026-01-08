import { memo } from "react";
import { DollarSign, Package } from "@/assets/icons/lucide";

import styles from "./styles.module.css";

interface PriceInfoProps {
  price: number;
  originalPrice?: number | null;
  stock: number;
}

const PriceInfo = memo(({ price, originalPrice, stock }: PriceInfoProps) => {
  const discountPercentage =
    originalPrice && originalPrice > 0 && price > 0 && originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : 0;

  return (
    <div className={styles.infoSection}>
      <h2 className={styles.sectionTitle}>价格与库存</h2>

      <div className={styles.infoGrid}>
        <div className={styles.infoItem}>
          <div className={styles.infoLabel}>
            <DollarSign size={18} />
            <span>当前价格</span>
          </div>
          <div className={styles.priceValue}>¥{price.toFixed(2)}</div>
        </div>

        {originalPrice && originalPrice > 0 && (
          <div className={styles.infoItem}>
            <div className={styles.infoLabel}>
              <DollarSign size={18} />
              <span>原价</span>
            </div>
            <div className={styles.originalPrice}>¥{originalPrice.toFixed(2)}</div>
          </div>
        )}

        <div className={styles.infoItem}>
          <div className={styles.infoLabel}>
            <Package size={18} />
            <span>库存数量</span>
          </div>
          <div className={styles.infoValue}>{stock} 件</div>
        </div>
      </div>

      {discountPercentage > 0 && (
        <div className={styles.discountBanner}>
          <span className={styles.discountLabel}>限时折扣</span>
          <span className={styles.discountValue}>{discountPercentage}% OFF</span>
        </div>
      )}
    </div>
  );
});

PriceInfo.displayName = "PriceInfo";

export default PriceInfo;

