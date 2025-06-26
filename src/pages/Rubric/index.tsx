// src/pages/Rubric/index.tsx
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import type { IRubric, IRubricLine } from "../../interfaces/IRubric";
import { RubricTable } from "./RubricTable"; // <-- Path updated
import styles from "./Rubric.module.scss";

export function Rubric() {
  const [searchParams] = useSearchParams();
  const [rubric, setRubric] = useState<IRubric | null>(null);

  useEffect(() => {
    // ... useEffect logic remains the same
    const rubricId = searchParams.get("id");
    if (rubricId) {
      // ... same as before
    } else {
      const newRubric: IRubric = {
        teacherDocId: "",
        studentRubricGrade: [],
        header: {
          title: "Create a New Rubric",
          gradeLevel: "Select Grade Level",
        },
        rubricLines: [
          {
            categoryName: "",
            possibleScores: [
              { score: 25, text: "" },
              { score: 20, text: "" },
              { score: 15, text: "" },
              { score: 10, text: "" },
            ],
          },
        ],
      };
      setRubric(newRubric);
    }
  }, [searchParams]);

  const handleAddCategory = () => {
    if (!rubric) return;

    const newCategory: IRubricLine = {
      categoryName: "",
      possibleScores: [
        { score: 25, text: "" },
        { score: 20, text: "" },
        { score: 15, text: "" },
        { score: 10, text: "" },
      ],
    };

    setRubric({
      ...rubric,
      rubricLines: [...rubric.rubricLines, newCategory],
    });
  };

  if (!rubric) {
    return <div>Loading...</div>;
  }

  return (
    <div className={styles.rubricContainer}>
      <header className={styles.header}>
        <h1 className={styles.title}>{String(rubric.header.title)}</h1>
        <span className={styles.separator}>|</span>
        <p className={styles.teacherInfo}>
          [Teacher Name] - {String(rubric.header.gradeLevel)}
        </p>
      </header>
      <hr className={styles.divider} />

      <RubricTable
        rubricLines={rubric.rubricLines}
        onAddCategory={handleAddCategory}
      />
    </div>
  );
}