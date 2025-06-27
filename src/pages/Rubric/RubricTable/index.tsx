// src/pages/Rubric/RubricTable/index.tsx
import type { IRubricLine } from "../../../interfaces/IRubric";
import styles from "./RubricTable.module.scss";

interface RubricTableProps {
  rubricLines: IRubricLine[];
  onAddCategory: () => void;
  onRemoveCategory: (lineId: String) => void; // Prop now expects a String (the ID)
}

export function RubricTable({
  rubricLines,
  onAddCategory,
  onRemoveCategory,
}: RubricTableProps) {
  return (
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
        {rubricLines.map((line) => (
          <tr key={String(line.lineId)}>
            <td className={styles.categoryCell}>
              <textarea
                className={styles.cellInput}
                defaultValue={String(line.categoryName)}
                placeholder="Category Name..."
              />
            </td>
            {line.possibleScores.map((score, scoreIndex) => (
              <td key={scoreIndex} className={styles.tableCell}>
                <textarea
                  className={styles.cellInput}
                  defaultValue={String(score.text)}
                  placeholder="Description..."
                />
              </td>
            ))}
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
      {/* --- The "Add Category" button is now in the table footer --- */}
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
  );
}
