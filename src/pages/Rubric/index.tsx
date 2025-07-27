// src/pages/Rubric/index.tsx
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import type { IRubric, IRubricLine, IStudentRubricGrade } from "../../interfaces/IRubric";
import type { IStudent } from "../../interfaces/IStudent";
import { RubricTable } from "./RubricTable";
import { StudentList } from "./StudentList";
import { DropdownMenu } from "../../components/DropdownMenu";
import styles from "./Rubric.module.scss";

// --- ICONS ---
const ShareIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"></path>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"></path>
    </svg>
);
const OptionsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="1"></circle>
        <circle cx="19" cy="12" r="1"></circle>
        <circle cx="5" cy="12" r="1"></circle>
    </svg>
);

export function Rubric() {
  const [searchParams] = useSearchParams();
  const [rubric, setRubric] = useState<IRubric | null>(null);
  const [assignedStudents, setAssignedStudents] = useState<IStudent[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<IStudent | null>(null);
  const [editionMode, setEditionMode] = useState(false);
  const [originalRubric, setOriginalRubric] = useState<IRubric | null>(null);
  const [maxGrade, setMaxGrade] = useState(0);
  const [gradableLineIds, setGradableLineIds] = useState<String[]>([]);

  useEffect(() => {
    if (!rubric) return;

    let tempValidLines = [...rubric.rubricLines];
    for (let i = tempValidLines.length - 1; i >= 0; i--) {
        const line = tempValidLines[i];
        const isCategoryEmpty = String(line.categoryName).trim() === '';
        const areScoresEmpty = (line.possibleScores as {text: String}[]).every(score => String(score.text).trim() === '');
        
        if (isCategoryEmpty && areScoresEmpty) {
            tempValidLines.pop();
        } else {
            break;
        }
    }

    setMaxGrade(tempValidLines.length * 25);
    setGradableLineIds(tempValidLines.map(line => line.lineId));
  }, [rubric?.rubricLines]);


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
          title: "Oral Project - Class debate",
          gradeLevels: [],
        },
        rubricLines: [
          { lineId: generateLineId(), categoryName: "Respect for other Team", possibleScores: [ { score: 25, text: "All statements, body language, and responses were respectful and were in appropriate language." }, { score: 20, text: "Statements and responses were respectful and used appropriate language, but once or twice body language was not." }, { score: 15, text: "Most statements and responses were respectful and in appropriate language, but there was one sarcastic remark." }, { score: 10, text: "Statements, responses and/or body language were consistently not respectful." }] },
          { lineId: generateLineId(), categoryName: "Information", possibleScores: [ { score: 25, text: "All information presented in the debate was clear, accurate and thorough." }, { score: 20, text: "Most information presented in the debate was clear, accurate and thorough." }, { score: 15, text: "Most information presented in the debate was clear and accurate, but was not usually thorough." }, { score: 10, text: "Information had several inaccuracies OR was usually not clear." }] },
          { lineId: generateLineId(), categoryName: "Rebuttal", possibleScores: [ { score: 25, text: "All counter-arguments were accurate, relevant and strong." }, { score: 20, text: "Most counter-arguments were accurate, relevant, and strong." }, { score: 15, text: "Most counter-arguments were accurate and relevant, but several were weak." }, { score: 10, text: "Counter-arguments were not accurate and/or relevant" }] },
          { lineId: generateLineId(), categoryName: "", possibleScores: [ { score: 25, text: "" }, { score: 20, text: "" }, { score: 15, text: "" }, { score: 10, text: "" } ] }
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

  const handleRubricLineChange = (
    lineId: String,
    field: "categoryName" | "scoreText",
    value: string,
    scoreIndex?: number
  ) => {
    if (!rubric) return;
  
    const updatedLines = rubric.rubricLines.map((line) => {
      if (line.lineId === lineId) {
        const newLine = { ...line };
        if (field === "categoryName") {
          newLine.categoryName = value;
        } else if (field === "scoreText" && scoreIndex !== undefined) {
          const newScores = [...line.possibleScores] as { score: number; text: String }[];
          newScores[scoreIndex] = { ...newScores[scoreIndex], text: value };
          newLine.possibleScores = newScores as IRubricLine['possibleScores'];
        }
        return newLine;
      }
      return line;
    });
  
    setRubric({ ...rubric, rubricLines: updatedLines });
  };

  const handleAddCategory = () => {
    if (!rubric) return;
    const newCategory: IRubricLine = {
      lineId: generateLineId(),
      categoryName: "",
      possibleScores: [ { score: 25, text: "" }, { score: 20, text: "" }, { score: 15, text: "" }, { score: 10, text: "" } ],
    };
    setRubric({ ...rubric, rubricLines: [...rubric.rubricLines, newCategory] });
  };

  const handleRemoveCategory = (lineId: String) => {
    if (!rubric) return;

    // Find the index of the line to be removed
    const removedLineIndex = rubric.rubricLines.findIndex(line => line.lineId === lineId);
    if (removedLineIndex === -1) return;

    // Filter out the removed line from rubricLines
    const updatedRubricLines = rubric.rubricLines.filter(
      (line) => line.lineId !== lineId
    );

    // Update studentRubricGrade
    const updatedStudentRubricGrade = rubric.studentRubricGrade.map(studentGrade => {
        const newRubricGradesLocation = studentGrade.rubricGradesLocation
            .filter(grade => grade.categoryIndex !== removedLineIndex) // Remove grades from the deleted line
            .map(grade => ({
                // Adjust categoryIndex for lines after the removed one
                categoryIndex: grade.categoryIndex > removedLineIndex ? grade.categoryIndex - 1 : grade.categoryIndex,
                gradingIndex: grade.gradingIndex,
            }));

        // Recalculate currentGrade based on updated grades and new rubricLines structure
        const newCurrentGrade = newRubricGradesLocation.reduce((total, grade) => {
            const line = updatedRubricLines[grade.categoryIndex]; // Use updatedRubricLines
            if (line && line.possibleScores[grade.gradingIndex] && gradableLineIds.includes(line.lineId)) {
                return total + line.possibleScores[grade.gradingIndex].score;
            }
            return total;
        }, 0);

        return {
            ...studentGrade,
            rubricGradesLocation: newRubricGradesLocation,
            currentGrade: newCurrentGrade,
        };
    });

    setRubric({ 
        ...rubric, 
        rubricLines: updatedRubricLines,
        studentRubricGrade: updatedStudentRubricGrade, // Update student grades as well
    });
  };
  
  const handleAssignStudent = (student: IStudent) => {
    if (!rubric || assignedStudents.find(s => s.studentDocId === student.studentDocId)) return;
    setAssignedStudents([...assignedStudents, student]);
    const newStudentGrade: IStudentRubricGrade = {
      studentDocId: student.studentDocId,
      rubricGradesLocation: [],
      currentGrade: 0,
    };
    setRubric({
      ...rubric,
      studentRubricGrade: [...rubric.studentRubricGrade, newStudentGrade],
    });
  };

  const handleRemoveStudent = (studentDocId: String) => {
    if (!rubric) return;
    if (selectedStudent?.studentDocId === studentDocId) {
      setSelectedStudent(null);
    }
    setAssignedStudents(
      assignedStudents.filter((s) => s.studentDocId !== studentDocId)
    );
    const updatedGrades = rubric.studentRubricGrade.filter(
      (grade) => grade.studentDocId !== studentDocId
    );
    setRubric({ ...rubric, studentRubricGrade: updatedGrades });
  };

  const handleGradeSelect = (categoryIndex: number, gradingIndex: number) => {
    if (editionMode || !selectedStudent || !rubric) {
      if (!selectedStudent) alert("Please select a student before assigning grades.");
      return;
    }

    // Verificar se a linha selecionada é avaliável antes de prosseguir
    const selectedLineId = rubric.rubricLines[categoryIndex]?.lineId;
    if (!gradableLineIds.includes(selectedLineId)) {
        return; // Não faça nada se a linha não for avaliável
    }

    const newGrades = rubric.studentRubricGrade.map((studentGrade) => {
      if (studentGrade.studentDocId === selectedStudent.studentDocId) {
        const newRubricGradesLocation = [
          ...studentGrade.rubricGradesLocation.filter(grade => grade.categoryIndex !== categoryIndex),
          { categoryIndex, gradingIndex },
        ];

        const newCurrentGrade = newRubricGradesLocation.reduce((total, grade) => {
            const line = rubric.rubricLines[grade.categoryIndex];
            // Também verificar aqui se a linha é avaliável ao calcular currentGrade
            if (line && line.possibleScores[grade.gradingIndex] && gradableLineIds.includes(line.lineId)) {
                return total + line.possibleScores[grade.gradingIndex].score;
            }
            return total;
        }, 0);
        
        return {
          ...studentGrade,
          rubricGradesLocation: newRubricGradesLocation,
          currentGrade: newCurrentGrade,
        };
      }
      return studentGrade;
    });
    setRubric({ ...rubric, studentRubricGrade: newGrades });
  };

  const handleEdit = () => {
    setOriginalRubric(rubric);
    setEditionMode(true);
  };

  const handleSaveChanges = () => {
    setEditionMode(false);
    setOriginalRubric(null);
    alert("Changes saved!");
  };

  const handleCancel = () => {
    if (originalRubric) {
      setRubric(originalRubric);
    }
    setEditionMode(false);
    setOriginalRubric(null);
  };

  const handleShare = () => alert("Share action!");
  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this rubric?")) {
        alert("Delete action confirmed!");
    }
  };

  if (!rubric) {
    return <div>Loading...</div>;
  }

  const selectedStudentGrades = rubric.studentRubricGrade.find(
    (g) => g.studentDocId === selectedStudent?.studentDocId
  )?.rubricGradesLocation;

  const selectedStudentGradeInfo = rubric.studentRubricGrade.find(
    (g) => g.studentDocId === selectedStudent?.studentDocId
  );

  return (
    <div className={styles.rubricPage}>
      <div className={styles.rubricContent}>
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <input
              type="text"
              value={String(rubric.header.title)}
              onChange={handleTitleChange}
              className={styles.titleInput}
              placeholder="Untitled Rubric"
              readOnly={!editionMode}
            />
            {selectedStudent && selectedStudentGradeInfo && !editionMode && (
              <div className={styles.gradingStudentInfo}>
              {selectedStudent.name + ": "}
                <span className={styles.gradePill}>
                  <strong>{selectedStudentGradeInfo.currentGrade === 0 ? '-' : `${selectedStudentGradeInfo.currentGrade} / ${maxGrade}`}</strong>
                </span>
              </div>
            )}
          </div>
          
          <div className={styles.headerActions}>
            {editionMode ? (
              <>
                <button onClick={handleSaveChanges} className={styles.saveButton}>
                  Save Changes
                </button>
                <button onClick={handleCancel} className={styles.cancelButton}>
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button onClick={handleShare} className={styles.shareButton} aria-label="Share Rubric">
                  <ShareIcon />
                </button>
                <DropdownMenu
                  trigger={
                    <button className={styles.optionsButton} aria-label="Rubric Options">
                      <OptionsIcon />
                    </button>
                  }
                >
                  <button onClick={handleEdit}>Edit</button>
                  <button onClick={handleDelete}>Delete</button>
                </DropdownMenu>
              </>
            )}
          </div>
        </header>
        <hr className={styles.divider} />

        <RubricTable
          rubricLines={rubric.rubricLines}
          selectedStudentGrades={selectedStudentGrades}
          editionMode={editionMode}
          onAddCategory={handleAddCategory}
          onRemoveCategory={handleRemoveCategory}
          onGradeSelect={handleGradeSelect}
          onRubricLineChange={handleRubricLineChange}
          gradableLineIds={gradableLineIds}
        />
      </div>
      
      <div className={styles.studentListSidebar}>
        <StudentList 
          assignedStudents={assignedStudents}
          studentRubricGrades={rubric.studentRubricGrade}
          maxGrade={maxGrade}
          selectedStudent={selectedStudent}
          onAssignStudent={handleAssignStudent}
          onRemoveStudent={handleRemoveStudent}
          onSelectStudent={setSelectedStudent}
        />
      </div>
    </div>
  );
}