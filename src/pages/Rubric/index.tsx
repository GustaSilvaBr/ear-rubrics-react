// src/pages/Rubric/index.tsx
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import type { IRubric, IRubricLine } from "../../interfaces/IRubric";
import { RubricTable } from "./RubricTable";
import styles from "./Rubric.module.scss";
const GRADE_LEVEL_OPTIONS = ["6th", "7th", "8th", "9th", "10th", "11th", "12th"];

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
          title: "Untitled Rubric",
          gradeLevels: [],
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

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!rubric) return;
    setRubric({
      ...rubric,
      header: { ...rubric.header, title: e.target.value },
    });
  };

  const handleGradeLevelChange = (grade: string) => {
    if (!rubric) return;
    const currentGrades = rubric.header.gradeLevels;
    const newGrades = currentGrades.includes(grade)
      ? currentGrades.filter((g) => g !== grade)
      : [...currentGrades, grade];

    setRubric({
      ...rubric,
      header: { ...rubric.header, gradeLevels: newGrades },
    });
  };

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

  const handleRemoveCategory = (lineId: String) => {
    if (!rubric) return;
    const updatedLines = rubric.rubricLines.filter(
      (line) => line.lineId !== lineId
    );

    setRubric({
      ...rubric,
      rubricLines: updatedLines,
    });
  };

  const handleSaveRubric = () => {
    if (!rubric) return;
    const savedRubricsRaw = localStorage.getItem("rubrics");
    const savedRubrics = savedRubricsRaw ? JSON.parse(savedRubricsRaw) : [];
    const updatedRubrics = [...savedRubrics, rubric];
    localStorage.setItem("rubrics", JSON.stringify(updatedRubrics));
    alert("Rubric saved to localStorage!");
    console.log("Updated list of rubrics in localStorage:", updatedRubrics);
  };

  if (!rubric) {
    return <div>Loading...</div>;
  }

  return (
    <div className={styles.rubricContainer}>
      {/* --- UPDATED ---: The header structure was refactored significantly. */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          {/* Title is now an input field */}
          <input
            type="text"
            value={String(rubric.header.title)}
            onChange={handleTitleChange}
            className={styles.titleInput}
            placeholder="Untitled Rubric"
          />
          {/* Grade level selector was added */}
          <div className={styles.gradeSelector}>
            <span className={styles.gradeLabel}>Grade Levels:</span>
            {GRADE_LEVEL_OPTIONS.map((grade) => (
              <label key={grade} className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={rubric.header.gradeLevels.includes(grade)}
                  onChange={() => handleGradeLevelChange(grade)}
                />
                {grade}
              </label>
            ))}
          </div>
        </div>
        {/* Save button was added to the header */}
        <button onClick={handleSaveRubric} className={styles.saveButton}>
          Save Rubric
        </button>
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