// src/pages/Rubric/RubricTable/index.tsx
import { useState, useRef, useEffect } from "react";
import type { IRubricColumn, IRubricLine, IStudentRubricGrade } from "../../../interfaces/IRubric";
import styles from "./RubricTable.module.scss";

const ACTION_COL_WIDTH = 40;
const MIN_COL_WIDTH    = 60;
const MIN_ROW_HEIGHT   = 50;
const DEFAULT_ROW_H    = 130;

interface RubricTableProps {
  columns: IRubricColumn[];
  rubricLines: IRubricLine[];
  selectedStudentGrades?: IStudentRubricGrade['rubricGradesLocation'];
  editionMode: boolean;
  onAddCategory: () => void;
  onRemoveCategory: (lineId: string) => void;
  onGradeSelect: (categoryIndex: number, gradingIndex: number) => void;
  onRubricLineChange: (lineId: string, field: "categoryName" | "scoreText", value: string, scoreIndex?: number) => void;
  onColumnChange: (colIndex: number, field: "name" | "score", value: string) => void;
  gradableLineIds: string[];
}

export function RubricTable({
  columns,
  rubricLines,
  selectedStudentGrades = [],
  editionMode,
  onAddCategory,
  onRemoveCategory,
  onGradeSelect,
  onRubricLineChange,
  onColumnChange,
  gradableLineIds,
}: RubricTableProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const initialized  = useRef(false);

  // colWidths: [categoryCol, ...scoreCols, actionCol]
  const [colWidths, setColWidths]   = useState<number[]>([]);
  const [rowHeights, setRowHeights] = useState<number[]>([]);

  const dragging = useRef<{
    type: "col" | "row";
    index: number;
    startPos: number;
    startSize: number;
  } | null>(null);

  // ── Initialize pixel sizes proportionally from the container on first paint ──
  useEffect(() => {
    if (initialized.current || !containerRef.current) return;
    initialized.current = true;
    const w      = containerRef.current.clientWidth - 2;
    const catW   = Math.round(w * 0.15);
    const scoreW = Math.max(MIN_COL_WIDTH, Math.round((w - catW - ACTION_COL_WIDTH) / columns.length));
    setColWidths([catW, ...columns.map(() => scoreW), ACTION_COL_WIDTH]);
    setRowHeights(rubricLines.map(() => DEFAULT_ROW_H));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Keep rowHeights in sync when rows are added / removed ──────────────
  useEffect(() => {
    if (!initialized.current) return;
    setRowHeights(prev => {
      if (prev.length === rubricLines.length) return prev;
      if (rubricLines.length > prev.length)
        return [...prev, ...new Array(rubricLines.length - prev.length).fill(DEFAULT_ROW_H)];
      return prev.slice(0, rubricLines.length);
    });
  }, [rubricLines.length]);

  // ── Global mouse events for resize ────────────────────────────────────
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const { type, index, startPos, startSize } = dragging.current;
      if (type === "col") {
        const next = Math.max(MIN_COL_WIDTH, startSize + e.clientX - startPos);
        setColWidths(p => p.map((w, i) => (i === index ? next : w)));
      } else {
        const next = Math.max(MIN_ROW_HEIGHT, startSize + e.clientY - startPos);
        setRowHeights(p => p.map((h, i) => (i === index ? next : h)));
      }
    };
    const onUp = () => {
      if (!dragging.current) return;
      dragging.current = null;
      document.body.style.cursor    = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
    };
  }, []);

  const startColResize = (e: React.MouseEvent, i: number) => {
    e.preventDefault();
    e.stopPropagation();
    dragging.current = { type: "col", index: i, startPos: e.clientX, startSize: colWidths[i] };
    document.body.style.cursor    = "col-resize";
    document.body.style.userSelect = "none";
  };

  const startRowResize = (e: React.MouseEvent, i: number) => {
    e.preventDefault();
    e.stopPropagation();
    dragging.current = { type: "row", index: i, startPos: e.clientY, startSize: rowHeights[i] };
    document.body.style.cursor    = "row-resize";
    document.body.style.userSelect = "none";
  };

  const hasWidths  = colWidths.length > 0;
  const hasHeights = rowHeights.length > 0;
  const tableWidth = hasWidths ? colWidths.reduce((a, b) => a + b, 0) : undefined;
  const thStyle    = (i: number) => (hasWidths  ? { width:  colWidths[i]  } : undefined);
  const tdStyle    = (i: number) => (hasHeights ? { height: rowHeights[i] } : undefined);

  return (
    <div className={styles.tableContainer} ref={containerRef}>
      <table className={styles.rubricTable} style={tableWidth ? { width: tableWidth } : undefined}>
        <thead>
          <tr>
            <th className={styles.categoryHeader} style={thStyle(0)}>
              Category
              <div className={styles.resizeColHandle} onMouseDown={(e) => startColResize(e, 0)} />
            </th>

            {columns.map((col, i) =>
              editionMode ? (
                <th key={i} className={`${styles.scoreHeader} ${styles.editableHeader}`} style={thStyle(i + 1)}>
                  <input
                    className={styles.headerNameInput}
                    value={col.name}
                    onChange={(e) => onColumnChange(i, "name", e.target.value)}
                    placeholder="Column name"
                  />
                  <div className={styles.scoreInputWrapper}>
                    <input
                      className={styles.headerScoreInput}
                      type="number"
                      min={0}
                      value={col.score}
                      onChange={(e) => onColumnChange(i, "score", e.target.value)}
                    />
                    <span className={styles.scoreUnit}>pts</span>
                  </div>
                  <div className={styles.resizeColHandle} onMouseDown={(e) => startColResize(e, i + 1)} />
                </th>
              ) : (
                <th key={i} className={styles.scoreHeader} style={thStyle(i + 1)}>
                  {col.name} ({col.score})
                  <div className={styles.resizeColHandle} onMouseDown={(e) => startColResize(e, i + 1)} />
                </th>
              )
            )}

            <th className={styles.actionHeader} style={thStyle(colWidths.length - 1)} />
          </tr>
        </thead>

        <tbody>
          {rubricLines.map((line, rowIndex) => {
            const isLineGradable = gradableLineIds.includes(line.lineId);
            const h = tdStyle(rowIndex);
            return (
              <tr key={line.lineId}>
                <td
                  className={`${styles.tableCell} ${styles.categoryTd} ${!editionMode ? styles.gradingMode : styles.editingMode}`}
                  style={h}
                >
                  <textarea
                    className={styles.cellInput}
                    value={line.categoryName}
                    onChange={(e) => onRubricLineChange(line.lineId, "categoryName", e.target.value)}
                    placeholder="Category Name..."
                    readOnly={!editionMode}
                  />
                  <div className={styles.resizeColHandle} onMouseDown={(e) => startColResize(e, 0)} />
                  <div className={styles.resizeRowHandle} onMouseDown={(e) => startRowResize(e, rowIndex)} />
                </td>

                {line.possibleScores.map((score, gradingIndex) => {
                  const isSelected = selectedStudentGrades.some(
                    g => g.categoryIndex === rowIndex && g.gradingIndex === gradingIndex
                  );
                  return (
                    <td
                      key={gradingIndex}
                      className={`${styles.tableCell} ${isSelected ? styles.selected : ""} ${!editionMode ? styles.gradingMode : styles.editingMode} ${!isLineGradable && !editionMode ? styles.disabledForGrading : ""}`}
                      style={h}
                      onClick={() => { if (isLineGradable && !editionMode) onGradeSelect(rowIndex, gradingIndex); }}
                    >
                      <textarea
                        className={styles.cellInput}
                        value={score.text}
                        onChange={(e) => onRubricLineChange(line.lineId, "scoreText", e.target.value, gradingIndex)}
                        placeholder="Description..."
                        readOnly={!editionMode}
                      />
                      <div className={styles.resizeColHandle} onMouseDown={(e) => startColResize(e, gradingIndex + 1)} />
                      <div className={styles.resizeRowHandle} onMouseDown={(e) => startRowResize(e, rowIndex)} />
                    </td>
                  );
                })}

                <td className={styles.actionCell} style={h}>
                  {editionMode && (
                    <button onClick={() => onRemoveCategory(line.lineId)} className={styles.deleteButton}>
                      -
                    </button>
                  )}
                  <div className={styles.resizeRowHandle} onMouseDown={(e) => startRowResize(e, rowIndex)} />
                </td>
              </tr>
            );
          })}
        </tbody>

        {editionMode && (
          <tfoot>
            <tr>
              <td colSpan={columns.length + 2} className={styles.addCategoryRow}>
                <button onClick={onAddCategory} className={styles.addButton}>
                  + Add Category
                </button>
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
