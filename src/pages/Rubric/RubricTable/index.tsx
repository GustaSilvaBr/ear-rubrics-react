// src/pages/Rubric/RubricTable/index.tsx
import type { IRubricColumn, IRubricLine, IStudentRubricGrade } from "../../../interfaces/IRubric";
import styles from "./RubricTable.module.scss";

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
  return (
    <div className={styles.tableContainer}>
      <table className={styles.rubricTable}>
        <thead>
          <tr>
            <th className={styles.categoryHeader}>Category</th>
            {columns.map((col, i) =>
              editionMode ? (
                <th key={i} className={`${styles.scoreHeader} ${styles.editableHeader}`}>
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
                </th>
              ) : (
                <th key={i} className={styles.scoreHeader}>
                  {col.name} ({col.score})
                </th>
              )
            )}
            <th className={styles.actionHeader}></th>
          </tr>
        </thead>
        <tbody>
          {rubricLines.map((line, categoryIndex) => {
            const isLineGradable = gradableLineIds.includes(line.lineId);
            return (
              <tr key={line.lineId}>
                <td className={`${styles.tableCell} ${!editionMode ? styles.gradingMode : styles.editingMode}`}>
                  <textarea
                    className={styles.cellInput}
                    value={line.categoryName}
                    onChange={(e) => onRubricLineChange(line.lineId, "categoryName", e.target.value)}
                    placeholder="Category Name..."
                    readOnly={!editionMode}
                  />
                </td>
                {line.possibleScores.map((score, gradingIndex) => {
                  const isSelected = selectedStudentGrades.some(
                    g => g.categoryIndex === categoryIndex && g.gradingIndex === gradingIndex
                  );
                  return (
                    <td
                      key={gradingIndex}
                      className={`${styles.tableCell} ${isSelected ? styles.selected : ''} ${!editionMode ? styles.gradingMode : styles.editingMode} ${!isLineGradable && !editionMode ? styles.disabledForGrading : ''}`}
                      onClick={() => {
                        if (isLineGradable && !editionMode) {
                          onGradeSelect(categoryIndex, gradingIndex);
                        }
                      }}
                    >
                      <textarea
                        className={styles.cellInput}
                        value={score.text}
                        onChange={(e) => onRubricLineChange(line.lineId, "scoreText", e.target.value, gradingIndex)}
                        placeholder="Description..."
                        readOnly={!editionMode}
                      />
                    </td>
                  );
                })}
                <td className={styles.actionCell}>
                  {editionMode && (
                    <button
                      onClick={() => onRemoveCategory(line.lineId)}
                      className={styles.deleteButton}
                    >
                      -
                    </button>
                  )}
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
