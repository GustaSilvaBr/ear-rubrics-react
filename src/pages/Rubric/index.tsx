// src/pages/Rubric/index.tsx
import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { doc, getDoc, setDoc, deleteDoc, collection } from "firebase/firestore";
import { useFirebase } from "../../context/FirebaseContext";
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
  const navigate = useNavigate();
  const { db, userId, teacherEmail, teacherName, isAuthReady } = useFirebase();

  const [rubric, setRubric] = useState<IRubric | null>(null);
  const [assignedStudents, setAssignedStudents] = useState<IStudent[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<IStudent | null>(null);
  const [editionMode, setEditionMode] = useState(false);
  const [originalRubric, setOriginalRubric] = useState<IRubric | null>(null);
  const [maxGrade, setMaxGrade] = useState(0);
  const [gradableLineIds, setGradableLineIds] = useState<String[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Effect to calculate maxGrade and gradableLineIds
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

  // Função para inicializar uma nova rubrica (agora sem o isNewRubricFlag para linhas pré-preenchidas)
  const initializeNewRubric = useCallback((currentTeacherEmail: string | null, currentTeacherName: string | null) => {
    const newRubric: IRubric = {
      teacherEmail: currentTeacherEmail || "unknown",
      teacherName: currentTeacherName || "Unknown Teacher",
      studentRubricGrade: [],
      header: {
        title: "Untitled Rubric", // Título padrão em inglês
        gradeLevels: [],
      },
      rubricLines: [ // Sempre inicia com uma linha em branco se não vier do DB
        { lineId: generateLineId(), categoryName: "", possibleScores: [ { score: 25, text: "" }, { score: 20, text: "" }, { score: 15, text: "" }, { score: 10, text: "" } ] }
      ],
    };
    setRubric(newRubric);
    setLoading(false);
  }, []);

  // Efeito para carregar a rubrica do Firestore ou inicializar uma nova
  useEffect(() => {
    if (!isAuthReady || !db || !userId) {
      return; // Espera o Firebase estar pronto
    }

    const rubricId = searchParams.get("id");
    const isNewParam = searchParams.get("isNew"); // Captura o parâmetro isNew
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const rubricDocRef = doc(db, `artifacts/${appId}/users/${userId}/rubrics`, rubricId || "new");

    if (rubricId) {
      // Carregar rubrica existente
      const fetchRubric = async () => {
        try {
          const docSnap = await getDoc(rubricDocRef);
          if (docSnap.exists()) {
            setRubric({ id: docSnap.id, ...docSnap.data() } as IRubric);
            // Define o modo de edição com base no parâmetro isNew
            setEditionMode(isNewParam === "true"); // Abre em edição se isNew for 'true'
            setLoading(false);
          } else {
            console.warn("No such document! Initializing new rubric.");
            initializeNewRubric(teacherEmail, teacherName); // Se não encontrar, inicializa como nova
            setEditionMode(true); 
          }
        } catch (err) {
          console.error("Error fetching rubric:", err);
          setError("Failed to load rubric. Please try again.");
          setLoading(false);
        }
      };
      fetchRubric();
    } else {
      // Inicializar nova rubrica (se não há ID na URL)
      initializeNewRubric(teacherEmail, teacherName); // Abre em modo de edição para novas rubricas sem ID
      setEditionMode(true); 
    }
  }, [searchParams, db, userId, teacherEmail, teacherName, isAuthReady, initializeNewRubric]);

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
    
    // Adicionado verificação para student.studentDocId
    if (!student.studentDocId) {
        console.error("Attempted to assign student without studentDocId:", student);
        setError("Cannot assign student: Missing student ID.");
        return;
    }

    setAssignedStudents([...assignedStudents, student]);
    const newStudentGrade: IStudentRubricGrade = {
      studentDocId: student.studentDocId, // Agora studentDocId é garantido como String
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

    // Check if the selected line is gradable before proceeding
    const selectedLineId = rubric.rubricLines[categoryIndex]?.lineId;
    if (!gradableLineIds.includes(selectedLineId)) {
        return; // Do nothing if the line is not gradable
    }

    const newGrades = rubric.studentRubricGrade.map((studentGrade) => {
      if (studentGrade.studentDocId === selectedStudent.studentDocId) {
        const newRubricGradesLocation = [
          ...studentGrade.rubricGradesLocation.filter(grade => grade.categoryIndex !== categoryIndex),
          { categoryIndex, gradingIndex },
        ];

        const newCurrentGrade = newRubricGradesLocation.reduce((total, grade) => {
            const line = rubric.rubricLines[grade.categoryIndex];
            // Also check here if the line is gradable when calculating currentGrade
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

  const handleSaveChanges = async () => {
    if (!db || !userId || !rubric || !teacherEmail || !teacherName) {
      setError("User information (email/name) not available. Please try logging in again.");
      return;
    }

    setLoading(true);
    setError(null);
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

    try {
      const { id, ...restOfRubric } = rubric; 

      const rubricToSave = {
        ...restOfRubric,
        teacherEmail: teacherEmail,
        teacherName: teacherName,
      };

      if (rubric.id) {
        const rubricDocRef = doc(db, `artifacts/${appId}/users/${userId}/rubrics`, rubric.id);
        await setDoc(rubricDocRef, rubricToSave);
        alert("Rubric updated successfully!");
      } else {
        const rubricsCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/rubrics`);
        const newDocRef = doc(rubricsCollectionRef);
        await setDoc(newDocRef, { ...rubricToSave, id: newDocRef.id });
        setRubric(prev => prev ? { ...prev, id: newDocRef.id } : null);
        navigate(`/rubric?id=${newDocRef.id}`);
        alert("Rubric created successfully!");
      }
      setEditionMode(false);
      setOriginalRubric(null);
    } catch (e) {
      console.error("Error saving rubric: ", e);
      setError("Failed to save rubric. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!db || !userId || !rubric || !rubric.id) return;

    if (window.confirm("Are you sure you want to delete this rubric?")) {
      setLoading(true);
      setError(null);
      const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

      try {
        const rubricDocRef = doc(db, `artifacts/${appId}/users/${userId}/rubrics`, rubric.id);
        await deleteDoc(rubricDocRef);
        alert("Rubric deleted successfully!");
        navigate("/");
      } catch (e) {
        console.error("Error deleting rubric: ", e);
        setError("Failed to delete rubric. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCancel = () => {
    if (originalRubric) {
      setRubric(originalRubric);
    }
    setEditionMode(false);
    setOriginalRubric(null);
  };

  const handleShare = () => alert("Share action!");

  if (loading) {
    return <div className={styles.rubricPage}>Loading rubric...</div>;
  }

  if (error) {
    return <div className={styles.rubricPage} style={{ color: 'red' }}>{error}</div>;
  }

  if (!rubric) {
    return <div className={styles.rubricPage}>No rubric data available.</div>;
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
