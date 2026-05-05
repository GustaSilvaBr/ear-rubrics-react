// src/pages/Rubric/BonusTable/index.tsx
import type { IBonusColumn } from "../../../interfaces/IRubric";
import styles from "./BonusTable.module.scss";

interface BonusTableProps {
  bonusColumns: IBonusColumn[];
  selectedIndices: number[];
  editionMode: boolean;
  hasStudentSelected: boolean;
  onToggle: (colIndex: number) => void;
  onColumnNameChange: (colIndex: number, name: string) => void;
}

export function BonusTable({
  bonusColumns,
  selectedIndices,
  editionMode,
  hasStudentSelected,
  onToggle,
  onColumnNameChange,
}: BonusTableProps) {
  return (
    <div className={styles.bonusContainer}>
      <p className={styles.bonusLabel}>
        Bonus Consideration (1 extra point each, up to {bonusColumns.length} pts):
      </p>

      <table className={styles.bonusTable}>
        <tbody>
          <tr>
            {bonusColumns.map((col, i) => {
              const isSelected = selectedIndices.includes(i);
              const isClickable = !editionMode && hasStudentSelected;
              return (
                <td
                  key={i}
                  className={`${styles.bonusTd} ${isSelected ? styles.selected : ""} ${isClickable ? styles.clickable : ""} ${!isClickable && !editionMode ? styles.disabled : ""}`}
                  onClick={() => isClickable && onToggle(i)}
                >
                  {editionMode ? (
                    <textarea
                      className={styles.bonusTextarea}
                      value={col.name}
                      onChange={(e) => onColumnNameChange(i, e.target.value)}
                      placeholder="Describe the bonus condition..."
                    />
                  ) : (
                    <p className={styles.bonusText}>{col.name}</p>
                  )}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
