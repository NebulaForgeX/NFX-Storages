import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import ModalStore, { useModalStore } from "@/stores/modalStore";

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_MIN_OFFSET_DEFAULT = -500;
const YEAR_MAX_OFFSET_DEFAULT = 100;

export interface YearGroup {
  decade: number;
  years: number[];
}

export default function useYearSelection() {
  const modalType = useModalStore(state => state.modalType);
  const yearModal = useModalStore(state => state.yearSelectModal);
  const hideModal = ModalStore.getState().hideModal;

  const dialogRef = useRef<HTMLDialogElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);

  const [highlightedYear, setHighlightedYear] = useState<number | null>(null);

  const isOpen = modalType === "yearSelect" && yearModal.isOpen;
  const baseYear = CURRENT_YEAR;

  const years = useMemo(() => {
    const minOffset = yearModal.minOffset ?? YEAR_MIN_OFFSET_DEFAULT;
    const maxOffset = yearModal.maxOffset ?? YEAR_MAX_OFFSET_DEFAULT;
    const start = baseYear + minOffset;
    const end = baseYear + maxOffset;
    const list: number[] = [];
    for (let year = end; year >= start; year -= 1) list.push(year);
    return list;
  }, [baseYear, yearModal.maxOffset, yearModal.minOffset]);

  const decadeGroups: YearGroup[] = useMemo(() => {
    const groups = new Map<number, number[]>();
    years.forEach(year => {
      const decade = Math.floor(year / 10) * 10;
      if (!groups.has(decade)) groups.set(decade, []);
      groups.get(decade)!.push(year);
    });
    return Array.from(groups.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([decade, values]) => ({ decade, years: values }));
  }, [years]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) {
      dialog.showModal();
      setHighlightedYear(baseYear);
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen, baseYear]);

  const scrollToYear = useCallback(
    (year: number) => {
      if (!listContainerRef.current) return;
      const target = listContainerRef.current.querySelector<HTMLButtonElement>(`[data-year="${year}"]`);
      target?.scrollIntoView({ block: "center" });
    },
    [],
  );

  useEffect(() => {
    if (highlightedYear !== null) {
      scrollToYear(highlightedYear);
    }
  }, [highlightedYear, scrollToYear]);

  const handleClose = useCallback(() => {
    hideModal("yearSelect");
  }, [hideModal]);

  const handleSelect = useCallback(
    (year: number) => {
      yearModal.onSelect?.(year);
      hideModal("yearSelect");
    },
    [hideModal, yearModal],
  );

  const updateHighlight = useCallback(
    (delta: number) => {
      if (!years.length) return;
      const current = highlightedYear ?? baseYear;
      const target = current + delta;
      if (target < years[years.length - 1] || target > years[0]) return;
      setHighlightedYear(target);
    },
    [baseYear, highlightedYear, years],
  );

  const quickSet = useCallback(
    (target: number) => {
      if (target < years[years.length - 1] || target > years[0]) return;
      setHighlightedYear(target);
      scrollToYear(target);
    },
    [scrollToYear, years],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (!years.length) return;
      if (event.key === "Escape") {
        handleClose();
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        updateHighlight(1);
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        updateHighlight(-1);
      } else if (event.key === "Enter") {
        event.preventDefault();
        handleSelect(highlightedYear ?? baseYear);
      }
    },
    [baseYear, handleClose, handleSelect, highlightedYear, updateHighlight, years.length],
  );

  return {
    dialogRef,
    listContainerRef,
    isOpen,
    baseYear,
    decadeGroups,
    highlightedYear,
    setHighlightedYear,
    handleSelect,
    handleClose,
    handleKeyDown,
    updateHighlight,
    quickSet,
  };
}


