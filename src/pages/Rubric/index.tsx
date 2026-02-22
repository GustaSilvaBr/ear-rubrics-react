// src/pages/Rubric/index.tsx
import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate, useOutletContext } from "react-router-dom";
import { doc, getDoc, setDoc, collection, onSnapshot, query } from "firebase/firestore";
import { useFirebase } from "../../context/FirebaseContext";
import type { IRubric, IRubricLine, IStudentRubricGrade } from "../../interfaces/IRubric";
import type { IStudent } from "../../interfaces/IStudent";
import { RubricTable } from "./RubricTable";
import { StudentList } from "./StudentList";
import styles from "./Rubric.module.scss";

interface LayoutContextType {
  setHeaderTitle: (title: string) => void;
}

export function Rubric() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setHeaderTitle } = useOutletContext<LayoutContextType>();
  const { db, userId, teacherEmail, teacherName, isAuthReady } = useFirebase();

  const [rubric, setRubric] = useState<IRubric | null>(null);
  const [assignedStudents, setAssignedStudents] = useState<IStudent[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<IStudent | null>(null);
  const [editionMode, setEditionMode] = useState(false);
  const [maxGrade, setMaxGrade] = useState(0);
  const [gradableLineIds, setGradableLineIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allAvailableStudents, setAllAvailableStudents] = useState<IStudent[]>([]);

  useEffect(() => {
    if (rubric?.header.title) {
      setHeaderTitle(rubric.header.title);
    } else {
      setHeaderTitle("");
    }
    return () => setHeaderTitle("");
  }, [rubric?.header.title, setHeaderTitle]);

  useEffect(() => {
    if (!rubric) return;
    let tempValidLines = [...rubric.rubricLines];
    for (let i = tempValidLines.length - 1; i >= 0; i--) {
        const line = tempValidLines[i];
        if (line.categoryName.trim() === '' && line.possibleScores.every(score => score.text.trim() === '')) {
            tempValidLines.pop();
        } else {
            break;
        }
    }
    setMaxGrade(tempValidLines.length * 25);
    setGradableLineIds(tempValidLines.map(line => line.lineId));
  }, [rubric?.rubricLines]);

  useEffect(() => {
    if (!isAuthReady || !db || !userId) return;
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const studentsCollectionRef = collection(db, `artifacts/${appId}/students`);
    const q = query(studentsCollectionRef);
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedStudents: IStudent[] = [];
        snapshot.forEach((doc) => {
          fetchedStudents.push({ studentDocId: doc.id, ...doc.data() as Omit<IStudent, 'studentDocId'> });
        });
        setAllAvailableStudents(fetchedStudents);
      }, (err) => {
        console.error("Erro ao buscar estudantes:", err);
        setError("Falha ao carregar estudantes.");
      }
    );
    return () => unsubscribe();
  }, [db, userId, isAuthReady]);

  useEffect(() => {
    if (!rubric || allAvailableStudents.length === 0) {
      setAssignedStudents([]);
      return;
    }
    const currentAssigned = rubric.studentRubricGrade.map(srg => {
      return allAvailableStudents.find(s => s.email === srg.studentEmail);
    }).filter((s): s is IStudent => s !== undefined);
    setAssignedStudents(currentAssigned);
  }, [rubric?.studentRubricGrade, allAvailableStudents]);

  const generateLineId = () => `${Date.now()} - ${Math.floor(Math.random() * 1000) + 1}`;

  const initializeNewRubric = useCallback((currentTeacherEmail: string | null, currentTeacherName: string | null) => {
    const newRubric: IRubric = {
      teacherEmail: currentTeacherEmail || "unknown",
      teacherName: currentTeacherName || "Unknown Teacher",
      studentRubricGrade: [],
      header: { title: "Untitled Rubric", gradeLevels: [] },
      rubricLines: [{ lineId: generateLineId(), categoryName: "", possibleScores: [ { score: 25, text: "" }, { score: 20, text: "" }, { score: 15, text: "" }, { score: 10, text: "" } ] }],
    };
    setRubric(newRubric);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isAuthReady || !db || !userId) return;
    const rubricId = searchParams.get("id");
    const isNewParam = searchParams.get("isNew");
    const studentEmailParam = searchParams.get("student");
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const rubricDocRef = doc(db, `artifacts/${appId}/users/${userId}/rubrics`, rubricId || "new");

    if (rubricId) {
      const fetchRubric = async () => {
        try {
          const docSnap = await getDoc(rubricDocRef);
          if (docSnap.exists()) {
            const fetchedRubric = { id: docSnap.id, ...docSnap.data() } as IRubric;
            setRubric(fetchedRubric);
            setEditionMode(isNewParam === "true");
            setLoading(false);
            if (studentEmailParam && allAvailableStudents.length > 0) {
                const decodedStudentEmail = atob(studentEmailParam);
                const studentToSelect = allAvailableStudents.find(s => s.email === decodedStudentEmail);
                if (studentToSelect) setSelectedStudent(studentToSelect);
            }
          } else {
            initializeNewRubric(teacherEmail, teacherName);
            setEditionMode(true); 
          }
        } catch (err) {
          console.error("Erro ao buscar rubrica:", err);
          setError("Falha ao carregar rubrica.");
          setLoading(false);
        }
      };
      fetchRubric();
    } else {
      initializeNewRubric(teacherEmail, teacherName);
      setEditionMode(true); 
    }
  }, [searchParams, db, userId, teacherEmail, teacherName, isAuthReady, initializeNewRubric, allAvailableStudents]);

  const handleRubricLineChange = (lineId: string, field: "categoryName" | "scoreText", value: string, scoreIndex?: number) => {
    if (!rubric) return;
    const updatedLines = rubric.rubricLines.map((line) => {
      if (line.lineId === lineId) {
        const newLine = { ...line };
        if (field === "categoryName") newLine.categoryName = value;
        else if (field === "scoreText" && scoreIndex !== undefined) {
          const newScores = [...line.possibleScores];
          newScores[scoreIndex] = { ...newScores[scoreIndex], text: value } as typeof line.possibleScores[number];
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
      possibleScores: [ { score: 25, text: "" }, { score: 20, text: "" }, { score: 15, text: "" }, { score: 10, text: "" } ]
    };
    setRubric({ ...rubric, rubricLines: [...rubric.rubricLines, newCategory] });
  };

  const handleRemoveCategory = async (lineId: string) => {
    if (!rubric || !db || !userId) return;
    const removedLineIndex = rubric.rubricLines.findIndex(line => line.lineId === lineId);
    if (removedLineIndex === -1) return;
    const updatedRubricLines = rubric.rubricLines.filter((line) => line.lineId !== lineId);
    const updatedStudentRubricGrade = rubric.studentRubricGrade.map(studentGrade => {
        const newRubricGradesLocation = studentGrade.rubricGradesLocation
            .filter(grade => grade.categoryIndex !== removedLineIndex)
            .map(grade => ({
                categoryIndex: grade.categoryIndex > removedLineIndex ? grade.categoryIndex - 1 : grade.categoryIndex,
                gradingIndex: grade.gradingIndex,
            }));
        const newCurrentGrade = newRubricGradesLocation.reduce((total, grade) => {
            const line = updatedRubricLines[grade.categoryIndex];
            if (line && line.possibleScores[grade.gradingIndex] && gradableLineIds.includes(line.lineId)) {
                return total + line.possibleScores[grade.gradingIndex].score;
            }
            return total;
        }, 0);
        return { ...studentGrade, rubricGradesLocation: newRubricGradesLocation, currentGrade: newCurrentGrade };
    });
    const newRubricState = { ...rubric, rubricLines: updatedRubricLines, studentRubricGrade: updatedStudentRubricGrade };
    setRubric(newRubricState);
    await handleSaveChanges(newRubricState);
  };
  
  const handleAssignStudent = async (student: IStudent) => {
    if (!rubric || !db || !userId || !student.email) return;
    
    // If student is already assigned, just select them and return
    if (rubric.studentRubricGrade.some(srg => srg.studentEmail === student.email)) {
      setSelectedStudent(student);
      return;
    }

    const newStudentGradeEntry: IStudentRubricGrade = { studentEmail: student.email, rubricGradesLocation: [], currentGrade: 0 };
    const updatedStudentRubricGrade = [...rubric.studentRubricGrade, newStudentGradeEntry];
    const newRubricState = { ...rubric, studentRubricGrade: updatedStudentRubricGrade };
    setRubric(newRubricState);
    await handleSaveChanges(newRubricState);
    setSelectedStudent(student);
  };

  const handleRemoveStudent = async (studentEmail: string) => {
    if (!rubric || !db || !userId) return;
    if (selectedStudent?.email === studentEmail) setSelectedStudent(null);
    const updatedStudentRubricGrade = rubric.studentRubricGrade.filter((grade) => grade.studentEmail !== studentEmail);
    const newRubricState = { ...rubric, studentRubricGrade: updatedStudentRubricGrade };
    setRubric(newRubricState);
    await handleSaveChanges(newRubricState);
  };

  const handleGradeSelect = async (categoryIndex: number, gradingIndex: number) => {
    if (editionMode || !selectedStudent || !rubric || !db || !userId) return;
    const selectedLineId = rubric.rubricLines[categoryIndex]?.lineId;
    if (!gradableLineIds.includes(selectedLineId)) return;
    const newGrades = rubric.studentRubricGrade.map((studentGrade) => {
      if (studentGrade.studentEmail === selectedStudent.email) {
        const newRubricGradesLocation = [
          ...studentGrade.rubricGradesLocation.filter(grade => grade.categoryIndex !== categoryIndex),
          { categoryIndex, gradingIndex },
        ];
        const newCurrentGrade = newRubricGradesLocation.reduce((total, grade) => {
            const line = rubric.rubricLines[grade.categoryIndex];
            if (line && line.possibleScores[grade.gradingIndex] && gradableLineIds.includes(line.lineId)) {
                return total + line.possibleScores[grade.gradingIndex].score;
            }
            return total;
        }, 0);
        return { ...studentGrade, rubricGradesLocation: newRubricGradesLocation, currentGrade: newCurrentGrade };
      }
      return studentGrade;
    });
    const newRubricState = { ...rubric, studentRubricGrade: newGrades };
    setRubric(newRubricState);
    await handleSaveChanges(newRubricState);
  };

  const handleSaveChanges = async (rubricToSaveParam?: IRubric) => {
    const currentRubric = rubricToSaveParam || rubric;
    if (!db || !userId || !currentRubric || !teacherEmail || !teacherName) return;
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    try {
      const { id, ...restOfRubric } = currentRubric; 
      const finalRubricData = { ...restOfRubric, teacherEmail, teacherName };
      if (currentRubric.id) {
        const rubricDocRef = doc(db, `artifacts/${appId}/users/${userId}/rubrics`, currentRubric.id);
        await setDoc(rubricDocRef, finalRubricData);
      } else {
        const rubricsCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/rubrics`);
        const newDocRef = doc(rubricsCollectionRef);
        await setDoc(newDocRef, { ...finalRubricData, id: newDocRef.id });
        setRubric(prev => prev ? { ...prev, id: newDocRef.id } : null);
        navigate(`/rubric?id=${newDocRef.id}`);
      }
      setEditionMode(false);
    } catch (e) {
      console.error("Erro ao salvar rubrica: ", e);
      setError("Falha ao salvar rubrica.");
    }
  };

  if (loading) return <div className={styles.rubricPage}>Carregando rubrica...</div>;
  if (error) return <div className={styles.rubricPage} style={{ color: 'red' }}>Erro: {error}</div>;
  if (!rubric) return <div className={styles.rubricPage}>Nenhum dado de rubrica disponível.</div>;

  const selectedStudentGradeInfo = rubric.studentRubricGrade.find((g) => g.studentEmail === selectedStudent?.email);
  const selectedStudentGrades = selectedStudentGradeInfo?.rubricGradesLocation;

  return (
    <div className={styles.rubricPage}>
      <aside className={styles.studentListSidebar}>
        <StudentList 
          assignedStudents={assignedStudents}
          studentRubricGrades={rubric.studentRubricGrade}
          maxGrade={maxGrade}
          selectedStudent={selectedStudent}
          onAssignStudent={handleAssignStudent}
          onRemoveStudent={handleRemoveStudent}
          onSelectStudent={setSelectedStudent}
          allAvailableStudents={allAvailableStudents}
          rubricId={rubric.id}
          teacherUid={userId}
        />
      </aside>

      <div className={styles.rubricContent}>
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
    </div>
  );
}