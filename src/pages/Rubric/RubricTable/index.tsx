// src/pages/Rubric/RubricTable/index.tsx
import type { IRubricLine, IStudentRubricGrade } from "../../../interfaces/IRubric";
import styles from "./RubricTable.module.scss";

interface RubricTableProps {
  rubricLines: IRubricLine[];
  selectedStudentGrades?: IStudentRubricGrade['rubricGradesLocation'];
  editionMode: boolean;
  onAddCategory: () => void;
  onRemoveCategory: (lineId: string) => void; // DEVE SER 'string' (minúsculo)
  onGradeSelect: (categoryIndex: number, gradingIndex: number) => void;
  onRubricLineChange: (lineId: string, field: "categoryName" | "scoreText", value: string, scoreIndex?: number) => void; // DEVE SER 'string' (minúsculo)
  gradableLineIds: string[]; // DEVE SER 'string[]' (minúsculo)
}

export function RubricTable({
  rubricLines,
  selectedStudentGrades = [],
  editionMode,
  onAddCategory,
  onRemoveCategory,
  onGradeSelect,
  onRubricLineChange,
  gradableLineIds,
}: RubricTableProps) {
  return (
    <div className={styles.tableContainer}>
      <table className={styles.rubricTable}>
        <thead>
          <tr>
            <th className={styles.categoryHeader}>Category</th>
            <th className={styles.scoreHeader}>Excellent (25)</th>
            <th className={styles.scoreHeader}>Good (20)</th>
            <th className={styles.scoreHeader}>Average (15)</th>
            <th className={styles.scoreHeader}>Needs Improvement (10)</th>
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
                  )
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
            )
          })}
        </tbody>
        {editionMode && (
          <tfoot>
            <tr>
              <td colSpan={6} className={styles.addCategoryRow}>
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
