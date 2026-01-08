import { memo } from "react";

import useYearSelection from "./useYearSelection";

import styles from "./styles.module.css";

const YearSelectModal = memo(() => {
  const {
    dialogRef,
    isOpen,
    baseYear,
    decadeGroups,
    highlightedYear,
    handleSelect,
    handleClose,
    handleKeyDown,
    listContainerRef,
    updateHighlight,
    quickSet,
  } = useYearSelection();

  if (!isOpen) return null;

  return (
    <dialog ref={dialogRef} className={styles.modal} onCancel={handleClose}>
      <div className={styles.header}>
        <h2 className={styles.title}>选择年份</h2>
        <span className={styles.subtitle}>当前年份：{baseYear}</span>
        <button type="button" className={styles.closeButton} onClick={handleClose} aria-label="关闭">
          ✕
        </button>
      </div>
      <div className={styles.quickActions}>
        <button type="button" onClick={() => quickSet(baseYear)} className={styles.quickButton}>
          返回 {baseYear}
        </button>
        <div className={styles.quickGroup}>
          <button type="button" onClick={() => updateHighlight(10)} className={styles.quickButton}>
            +10
          </button>
          <button type="button" onClick={() => updateHighlight(1)} className={styles.quickButton}>
            +1
          </button>
          <button type="button" onClick={() => updateHighlight(-1)} className={styles.quickButton}>
            -1
          </button>
          <button type="button" onClick={() => updateHighlight(-10)} className={styles.quickButton}>
            -10
          </button>
        </div>
      </div>
      <div
        className={styles.content}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        ref={listContainerRef}
        aria-label="年份列表"
      >
        <div className={styles.yearSections}>
          {decadeGroups.map(group => (
            <section key={group.decade} className={styles.decadeSection}>
              <header className={styles.decadeHeader}>{group.decade}s</header>
              <div className={styles.yearList}>
                {group.years.map(year => (
                  <button
                    key={year}
                    type="button"
                    data-year={year}
                    className={`${styles.yearButton} ${highlightedYear === year ? styles.highlighted : ""}`}
                    onClick={() => handleSelect(year)}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </dialog>
  );
});

YearSelectModal.displayName = "YearSelectModal";

export default YearSelectModal;


