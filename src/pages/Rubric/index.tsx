// src/pages/Rubric/index.tsx
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import type { IRubric, IRubricLine, IStudentRubricGrade } from "../../interfaces/IRubric";
import type { IStudent } from "../../interfaces/IStudent";
import { RubricTable } from "./RubricTable";
import { StudentList } from "./StudentList";
import { DropdownMenu } from "../../components/DropdownMenu";
import styles from "./Rubric.module.scss";

// --- ICONS (unchanged) ---
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
  // 1. Add state to track the currently selected student
  const [selectedStudent, setSelectedStudent] = useState<IStudent | null>(null);

  const generateLineId = () => {
    return `${Date.now()} - ${Math.floor(Math.random() * 1000) + 1}`;
  };

  useEffect(() => {
    // ... (useEffect content is unchanged)
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
    const updatedLines = rubric.rubricLines.filter(
      (line) => line.lineId !== lineId
    );
    setRubric({ ...rubric, rubricLines: updatedLines });
  };
  
  const handleAssignStudent = (student: IStudent) => {
    if (!rubric) return;
    setAssignedStudents([...assignedStudents, student]);
    const newStudentGrade: IStudentRubricGrade = {
      studentDocId: student.studentDocId,
      rubricGradesLocation: [],
    };
    setRubric({
      ...rubric,
      studentRubricGrade: [...rubric.studentRubricGrade, newStudentGrade],
    });
  };

  const handleRemoveStudent = (studentDocId: String) => {
    if (!rubric) return;
    // If the student being removed is the currently selected one, deselect them.
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

  // 2. Add the handler for grading a cell
  const handleGradeSelect = (categoryIndex: number, gradingIndex: number) => {
    // Rule 3: The teacher can only give grades after selecting a student
    if (!selectedStudent || !rubric) {
      alert("Please select a student before assigning grades.");
      return;
    }

    const newGrades = rubric.studentRubricGrade.map((studentGrade) => {
      // Find the currently selected student's grade object
      if (studentGrade.studentDocId === selectedStudent.studentDocId) {
        // Rule 2: Remove any existing grade for this category
        const filteredGrades = studentGrade.rubricGradesLocation.filter(
          (grade) => grade.categoryIndex !== categoryIndex
        );
        
        // Add the new grade
        return {
          ...studentGrade,
          rubricGradesLocation: [
            ...filteredGrades,
            { categoryIndex, gradingIndex },
          ],
        };
      }
      return studentGrade;
    });
    setRubric({ ...rubric, studentRubricGrade: newGrades });
  };

  // ... (handleShare, handleEdit, handleDelete are unchanged)
    const handleShare = () => {
    alert("Share action!");
  };

  const handleEdit = () => {
    alert("Edit action!");
  };

  const handleDelete = () => {
    // A custom modal would be better than window.confirm in a real app
    if (confirm("Are you sure you want to delete this rubric?")) {
        alert("Delete action confirmed!");
    }
  };


  if (!rubric) {
    return <div>Loading...</div>;
  }

  // Find the grades for the currently selected student to pass to the table
  const selectedStudentGrades = rubric.studentRubricGrade.find(
    (g) => g.studentDocId === selectedStudent?.studentDocId
  )?.rubricGradesLocation;

  return (
    <div className={styles.rubricPage}>
      <div className={styles.rubricContent}>
        {/* ... (header is unchanged) ... */}
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <input
              type="text"
              value={String(rubric.header.title)}
              onChange={handleTitleChange}
              className={styles.titleInput}
              placeholder="Untitled Rubric"
            />
          </div>
          
          <div className={styles.headerActions}>
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
          </div>
        </header>
        <hr className={styles.divider} />

        <RubricTable
          rubricLines={rubric.rubricLines}
          selectedStudentGrades={selectedStudentGrades}
          onAddCategory={handleAddCategory}
          onRemoveCategory={handleRemoveCategory}
          // 3. Pass the new handler to the table
          onGradeSelect={handleGradeSelect}
        />
      </div>
      
      <div className={styles.studentListSidebar}>
        <StudentList 
          assignedStudents={assignedStudents}
          selectedStudent={selectedStudent}
          onAssignStudent={handleAssignStudent}
          onRemoveStudent={handleRemoveStudent}
          // 4. Pass the student selection handler
          onSelectStudent={setSelectedStudent}
        />
      </div>
    </div>
  );
}