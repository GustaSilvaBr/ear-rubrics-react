// src/pages/Rubric/index.tsx
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import type { IRubric, IRubricLine } from "../../interfaces/IRubric";
import { RubricTable } from "./RubricTable";
import styles from "./Rubric.module.scss";

export function Rubric() {
  const [searchParams] = useSearchParams();
  const [rubric, setRubric] = useState<IRubric | null>(null);

  // Function to generate a unique ID
  const generateLineId = () => {
    return `${Date.now()} - ${Math.floor(Math.random() * 1000) + 1}`;
  };

  useEffect(() => {
    const rubricId = searchParams.get("id");
    if (rubricId) {
      // Logic for fetching an existing rubric would go here
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
            lineId: generateLineId(), // Assign an ID to the initial line
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
      lineId: generateLineId(), // Assign an ID when a new line is created
      categoryName: "",
      possibleScores: [
        { score: 25, text: "" },
        { score: 20, text: "" },
        { score: 15, text: "" },
        { score: 10, text: "" },
      ],
    };
    setRubric({ ...rubric, rubricLines: [...rubric.rubricLines, newCategory] });
  };

  // --- DELETE LOGIC UPDATED TO USE ID ---
  const handleRemoveCategory = (lineId: String) => {
    if (!rubric) return;

    // Filter by lineId instead of index
    const updatedLines = rubric.rubricLines.filter(
      (line) => line.lineId !== lineId
    );

    setRubric({
      ...rubric,
      rubricLines: updatedLines,
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
        onRemoveCategory={handleRemoveCategory}
      />
    </div>
  );
}