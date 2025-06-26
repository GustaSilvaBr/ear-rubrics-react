// src/pages/Rubric/RubricTable/index.tsx
import type { IRubricLine } from "../../../interfaces/IRubric";
import styles from "./RubricTable.module.scss";

interface RubricTableProps {
  rubricLines: IRubricLine[];
  onAddCategory: () => void;
}

export function RubricTable({
  rubricLines,
  onAddCategory,
}: RubricTableProps) {
  return (
    <>
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
          {rubricLines.map((line, lineIndex) => (
            <tr key={lineIndex}>
              {/* Category cell now has a specific class */}
              <td className={styles.categoryCell}>
                <textarea
                  className={styles.cellInput}
                  defaultValue={String(line.categoryName)}
                  placeholder="Category Name..."
                />
              </td>
              {/* Score Description Cells */}
              {line.possibleScores.map((score, scoreIndex) => (
                <td key={scoreIndex} className={styles.tableCell}>
                  <textarea
                    className={styles.cellInput}
                    defaultValue={String(score.text)}
                    placeholder="Description..."
                  />
                </td>
              ))}
              {/* Delete Action Cell */}
              <td className={styles.actionCell}>
                <button className={styles.deleteButton} disabled>
                  -
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={onAddCategory} className={styles.addButton}>
        + Add Category
      </button>
    </>
  );
}