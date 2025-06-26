// src/components/RubricTable/index.tsx
import type { IRubricLine } from "../../../interfaces/IRubric";
import styles from "./RubricTable.module.scss";

interface RubricTableProps {
  rubricLines: IRubricLine[];
  onAddCategory: () => void;
  // We will add more props later for editing and deleting
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
            <th className={styles.tableHeader}>Category</th>
            <th className={styles.tableHeader}>Excellent (25)</th>
            <th className={styles.tableHeader}>Good (20)</th>
            <th className={styles.tableHeader}>Average (15)</th>
            <th className={styles.tableHeader}>Needs Improvement (10)</th>
            <th className={styles.tableHeader}></th> {/* Header for the delete button */}
          </tr>
        </thead>
        <tbody>
          {rubricLines.map((line, lineIndex) => (
            <tr key={lineIndex}>
              {/* Category Name Cell */}
              <td className={styles.tableCell}>
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
              <td className={styles.tableCell}>
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