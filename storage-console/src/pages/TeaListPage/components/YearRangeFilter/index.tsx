import { memo, useEffect, useMemo, useState } from "react";

import styles from "./styles.module.css";

interface YearRangeFilterValue {
  from?: number;
  to?: number;
}

interface YearRangeFilterProps {
  value: YearRangeFilterValue;
  onChange: (value: YearRangeFilterValue) => void;
}

const YearRangeFilter = memo(({ value, onChange }: YearRangeFilterProps) => {
  const [draftFrom, setDraftFrom] = useState<string>("");
  const [draftTo, setDraftTo] = useState<string>("");

  useEffect(() => {
    setDraftFrom(value.from !== undefined ? String(value.from) : "");
    setDraftTo(value.to !== undefined ? String(value.to) : "");
  }, [value.from, value.to]);

  const displayRange = useMemo(
    () => ({
      from: draftFrom,
      to: draftTo,
    }),
    [draftFrom, draftTo],
  );

  const parseYear = (text: string): number | undefined => {
    const trimmed = text.trim();
    if (trimmed === "") return undefined;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  const handleApply = () => {
    const parsedFrom = parseYear(draftFrom);
    const parsedTo = parseYear(draftTo);
    onChange({
      from: parsedFrom,
      to: parsedTo,
    });
  };

  return (
    <div className={`${styles.container} year-range-filter`}>
      <div className={styles.inputGroup}>
        <div className={styles.inputs}>
          <input
            type="number"
            placeholder="起始年份"
            value={displayRange.from}
            onChange={(event) => setDraftFrom(event.target.value)}
          />
          <span className={styles.separator}>~</span>
          <input
            type="number"
            placeholder="结束年份"
            value={displayRange.to}
            onChange={(event) => setDraftTo(event.target.value)}
          />
        </div>
        <button type="button" className={styles.applyButton} onClick={handleApply}>
          搜索
        </button>
        <button
          type="button"
          className={styles.clearButton}
          onClick={() => {
            setDraftFrom("");
            setDraftTo("");
            onChange({ from: undefined, to: undefined });
          }}
        >
          清空
        </button>
      </div>
    </div>
  );
});

YearRangeFilter.displayName = "YearRangeFilter";

export type { YearRangeFilterValue };
export default YearRangeFilter;


