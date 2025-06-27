// src/pages/Rubric/RubricTable/index.tsx
import type { IRubricLine, IStudentRubricGrade } from "../../../interfaces/IRubric";
import styles from "./RubricTable.module.scss";

interface RubricTableProps {
  rubricLines: IRubricLine[];
  // Receive the grades for the selected student
  selectedStudentGrades?: IStudentRubricGrade['rubricGradesLocation'];
  onAddCategory: () => void;
  onRemoveCategory: (lineId: String) => void;
  // Receive the grading handler
  onGradeSelect: (categoryIndex: number, gradingIndex: number) => void;
}

export function RubricTable({
  rubricLines,
  selectedStudentGrades = [], // Default to an empty array
  onAddCategory,
  onRemoveCategory,
  onGradeSelect,
}: RubricTableProps) {
  return (
    <div className={styles.tableContainer}>
      <table className={styles.rubricTable}>
        {/* ... (thead is unchanged) ... */}
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
          {rubricLines.map((line, categoryIndex) => (
            <tr key={String(line.lineId)}>
              <td className={styles.categoryCell}>
                <textarea
                  className={styles.cellInput}
                  defaultValue={String(line.categoryName)}
                  placeholder="Category Name..."
                />
              </td>
              {line.possibleScores.map((score, gradingIndex) => {
                // Check if this cell is the selected grade for this category
                const isSelected = selectedStudentGrades.some(
                  g => g.categoryIndex === categoryIndex && g.gradingIndex === gradingIndex
                );
                return (
                  <td 
                    key={gradingIndex} 
                    // Add the 'selected' class if it is
                    className={`${styles.tableCell} ${isSelected ? styles.selected : ''}`}
                    // Add the onClick handler
                    onClick={() => onGradeSelect(categoryIndex, gradingIndex)}
                  >
                    <textarea
                      className={styles.cellInput}
                      defaultValue={String(score.text)}
                      placeholder="Description..."
                      readOnly // Make the textareas read-only during grading
                    />
                  </td>
                )
              })}
              <td className={styles.actionCell}>
                <button
                  onClick={() => onRemoveCategory(line.lineId)}
                  className={styles.deleteButton}
                >
                  -
                </button>
              </td>
            </tr>
          ))}
        </tbody>
        {/* ... (tfoot is unchanged) ... */}
        <tfoot>
          <tr>
            <td colSpan={6} className={styles.addCategoryRow}>
              <button onClick={onAddCategory} className={styles.addButton}>
                + Add Category
              </button>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}