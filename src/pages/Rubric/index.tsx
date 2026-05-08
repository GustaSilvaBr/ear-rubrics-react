// src/pages/Rubric/index.tsx
import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { doc, getDoc, setDoc, deleteDoc, collection, query, onSnapshot } from "firebase/firestore";
import { useFirebase } from "../../context/FirebaseContext";
import type { IRubric, IRubricColumn, IBonusColumn, IRubricLine, IStudentRubricGrade } from "../../interfaces/IRubric";
import type { IStudent } from "../../interfaces/IStudent";
import { RubricTable } from "./RubricTable";
import { BonusTable } from "./BonusTable";
import { StudentList } from "./StudentList";
import { DropdownMenu } from "../../components/DropdownMenu";
import styles from "./Rubric.module.scss";

// --- ÍCONES ---
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

const DEFAULT_COLUMNS: IRubricColumn[] = [
  { name: "Excellent",         score: 25 },
  { name: "Good",              score: 20 },
  { name: "Average",           score: 15 },
  { name: "Needs Improvement", score: 10 },
];

const DEFAULT_BONUS_COLUMNS: IBonusColumn[] = [
  { name: "Participation" },
  { name: "Effort" },
  { name: "Creativity" },
];

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
  const [gradableLineIds, setGradableLineIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true); // Apenas para carregamento inicial da rubrica
  const [error, setError] = useState<string | null>(null);
  const [allAvailableStudents, setAllAvailableStudents] = useState<IStudent[]>([]); // Nova lista para todos os estudantes
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Função auxiliar para adicionar sufixos ao nível de ensino
  const getGradeLevelWithSuffix = (gradeLevel: string): string => {
    const num = parseInt(gradeLevel);
    if (isNaN(num)) return gradeLevel; // Retorna o original se não for um número

    const lastDigit = num % 10;
    const lastTwoDigits = num % 100;

    if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
      return `${gradeLevel}th`;
    }

    switch (lastDigit) {
      case 1:
        return `${gradeLevel}st`;
      case 2:
        return `${gradeLevel}nd`;
      case 3:
        return `${gradeLevel}rd`;
      default:
        return `${gradeLevel}th`;
    }
  };

  // Effect to calculate maxGrade and gradableLineIds
  useEffect(() => {
    if (!rubric) return;

    let tempValidLines = [...rubric.rubricLines];
    for (let i = tempValidLines.length - 1; i >= 0; i--) {
        const line = tempValidLines[i];
        const isCategoryEmpty = line.categoryName.trim() === '';
        const areScoresEmpty = line.possibleScores.every(score => score.text.trim() === '');
        
        if (isCategoryEmpty && areScoresEmpty) {
            tempValidLines.pop();
        } else {
            break;
        }
    }

    const maxColScore = rubric.columns?.length
      ? Math.max(...rubric.columns.map(c => c.score))
      : 25;
    setMaxGrade(tempValidLines.length * maxColScore);
    setGradableLineIds(tempValidLines.map(line => line.lineId));
  }, [rubric?.rubricLines, rubric?.columns]);

  // Efeito para carregar todos os estudantes disponíveis do Firestore (para autocomplete e derivação)
  useEffect(() => {
    if (!isAuthReady || !db || !userId) {
      return;
    }

    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const studentsCollectionRef = collection(db, `artifacts/${appId}/students`);
    const q = query(studentsCollectionRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedStudents: IStudent[] = [];
        snapshot.forEach((doc) => {
          fetchedStudents.push({ studentDocId: doc.id, ...doc.data() as Omit<IStudent, 'studentDocId'> });
        });
        setAllAvailableStudents(fetchedStudents);
      },
      (err) => {
        console.error("Erro ao buscar todos os estudantes para a página de Rubrica:", err);
        setError("Falha ao carregar estudantes disponíveis para atribuição.");
      }
    );

    return () => unsubscribe();
  }, [db, userId, isAuthReady]);


  // Efeito para derivar assignedStudents a partir de rubric.studentRubricGrade e allAvailableStudents
  useEffect(() => {
    if (!rubric || allAvailableStudents.length === 0) {
      setAssignedStudents([]);
      return;
    }

    const currentAssigned = rubric.studentRubricGrade.map(srg => {
      // Encontra o estudante completo na lista de todos os estudantes
      const student = allAvailableStudents.find(s => s.email === srg.studentEmail);
      return student;
    }).filter((s): s is IStudent => s !== undefined); // Filtra estudantes não encontrados

    setAssignedStudents(currentAssigned);
  }, [rubric?.studentRubricGrade, allAvailableStudents]);


  const generateLineId = () => {
    return `${Date.now()} - ${Math.floor(Math.random() * 1000) + 1}`;
  };

  // Função para inicializar uma nova rubrica
  const initializeNewRubric = useCallback((currentTeacherEmail: string | null, currentTeacherName: string | null) => {
    const newRubric: IRubric = {
      teacherEmail: currentTeacherEmail || "unknown",
      teacherName: currentTeacherName || "Unknown Teacher",
      studentRubricGrade: [],
      columns: DEFAULT_COLUMNS,
      bonusColumns: DEFAULT_BONUS_COLUMNS,
      header: {
        title: "Untitled Rubric",
        gradeLevels: [],
      },
      rubricLines: [
        { lineId: generateLineId(), categoryName: "", possibleScores: DEFAULT_COLUMNS.map(c => ({ score: c.score, text: "" })) }
      ],
    };
    setRubric(newRubric);
    setLoading(false);
  }, []);

  // Efeito para carregar a rubrica do Firestore ou inicializar uma nova
  useEffect(() => {
    if (!isAuthReady || !db || !userId) {
      return;
    }

    const rubricId = searchParams.get("id");
    const isNewParam = searchParams.get("isNew");
    const studentEmailParam = searchParams.get("student"); // Captura o parâmetro 'student'
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const rubricDocRef = doc(db, `artifacts/${appId}/users/${userId}/rubrics`, rubricId || "new");

    if (rubricId) {
      const fetchRubric = async () => {
        try {
          const docSnap = await getDoc(rubricDocRef);
          if (docSnap.exists()) {
            const raw = { id: docSnap.id, ...docSnap.data() } as IRubric;
            // Backward compat: add defaults for fields added after initial release
            const fetchedRubric: IRubric = {
              ...raw,
              columns: raw.columns?.length ? raw.columns : DEFAULT_COLUMNS,
              bonusColumns: raw.bonusColumns?.length ? raw.bonusColumns : DEFAULT_BONUS_COLUMNS,
            };
            setRubric(fetchedRubric);
            setEditionMode(isNewParam === "true");
            setLoading(false);

            // Tenta selecionar o estudante se o parâmetro 'student' estiver presente e a rubrica for carregada
            if (studentEmailParam && allAvailableStudents.length > 0) {
                // Decodifica o e-mail do estudante do Base64
                const decodedStudentEmail = atob(studentEmailParam);
                const studentToSelect = allAvailableStudents.find(s => s.email === decodedStudentEmail);
                if (studentToSelect) {
                    setSelectedStudent(studentToSelect);
                } else {
                    console.warn(`Estudante com e-mail ${decodedStudentEmail} não encontrado.`);
                }
            }
          } else {
            console.warn("Nenhum documento encontrado! Inicializando nova rubrica.");
            initializeNewRubric(teacherEmail, teacherName);
            setEditionMode(true); 
          }
        } catch (err) {
          console.error("Erro ao buscar rubrica:", err);
          setError("Falha ao carregar rubrica. Por favor, tente novamente.");
          setLoading(false);
        }
      };
      fetchRubric();
    } else {
      initializeNewRubric(teacherEmail, teacherName);
      setEditionMode(true); 
    }
  }, [searchParams, db, userId, teacherEmail, teacherName, isAuthReady, initializeNewRubric, allAvailableStudents]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!rubric) return;
    setRubric({
      ...rubric,
      header: { ...rubric.header, title: e.target.value },
    });
  };

  const handleRubricLineChange = (
    lineId: string,
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
          const newScores = [...line.possibleScores];
          newScores[scoreIndex] = { ...newScores[scoreIndex], text: value };
          newLine.possibleScores = newScores;
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
      possibleScores: rubric.columns.map(c => ({ score: c.score, text: "" })),
    };
    setRubric({ ...rubric, rubricLines: [...rubric.rubricLines, newCategory] });
  };

  const handleColumnChange = (colIndex: number, field: "name" | "score", value: string) => {
    if (!rubric) return;
    const newScore = field === "score" ? (Number(value) || 0) : null;
    const updatedColumns = rubric.columns.map((col, i) =>
      i === colIndex
        ? { ...col, [field]: newScore !== null ? newScore : value }
        : col
    );
    // Propagate score change to every row's possibleScores
    const updatedLines = newScore !== null
      ? rubric.rubricLines.map(line => {
          const newScores = line.possibleScores.map((s, i) =>
            i === colIndex ? { ...s, score: newScore } : s
          );
          return { ...line, possibleScores: newScores };
        })
      : rubric.rubricLines;
    // Recalculate every student's currentGrade
    const updatedGrades = rubric.studentRubricGrade.map(sg => {
      const currentGrade = sg.rubricGradesLocation.reduce((total, g) => {
        const line = updatedLines[g.categoryIndex];
        if (line?.possibleScores[g.gradingIndex]) {
          return total + line.possibleScores[g.gradingIndex].score;
        }
        return total;
      }, 0);
      return { ...sg, currentGrade };
    });
    setRubric({ ...rubric, columns: updatedColumns, rubricLines: updatedLines, studentRubricGrade: updatedGrades });
  };

  const handleBonusToggle = async (colIndex: number) => {
    if (!rubric || !selectedStudent) return;
    const selectedEntry = rubric.studentRubricGrade.find(g => g.studentEmail === selectedStudent.email);
    if (selectedEntry?.gradeLocked) return;
    const updatedGrades = rubric.studentRubricGrade.map(sg => {
      if (sg.studentEmail !== selectedStudent.email) return sg;
      const current = sg.bonusSelectedIndices ?? [];
      const bonusSelectedIndices = current.includes(colIndex)
        ? current.filter(i => i !== colIndex)
        : [...current, colIndex];
      return { ...sg, bonusSelectedIndices };
    });
    const newRubricState = { ...rubric, studentRubricGrade: updatedGrades };
    setRubric(newRubricState);
    await handleSaveChanges(newRubricState);
  };

  const handleBonusColumnNameChange = (colIndex: number, name: string) => {
    if (!rubric) return;
    const bonusColumns = (rubric.bonusColumns ?? DEFAULT_BONUS_COLUMNS).map((col, i) =>
      i === colIndex ? { ...col, name } : col
    );
    setRubric({ ...rubric, bonusColumns });
  };

  const handleRemoveCategory = async (lineId: string) => {
    if (!rubric || !db || !userId) return;

    const removedLineIndex = rubric.rubricLines.findIndex(line => line.lineId === lineId);
    if (removedLineIndex === -1) return;

    const updatedRubricLines = rubric.rubricLines.filter(
      (line) => line.lineId !== lineId
    );

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

        return {
            ...studentGrade,
            rubricGradesLocation: newRubricGradesLocation,
            currentGrade: newCurrentGrade,
        };
    });

    const newRubricState = {
        ...rubric,
        rubricLines: updatedRubricLines,
        studentRubricGrade: updatedStudentRubricGrade,
    };
    setRubric(newRubricState);

    await handleSaveChanges(newRubricState);
  };
  
  const handleAssignStudent = async (student: IStudent) => {
    if (!rubric || !db || !userId) return;
    
    if (!student.email) {
        console.error("Tentativa de atribuir estudante sem e-mail:", student);
        setError("Não é possível atribuir estudante: E-mail do estudante ausente.");
        return;
    }

    if (rubric.studentRubricGrade.some(srg => srg.studentEmail === student.email)) {
      console.warn("Estudante já atribuído:", student.email);
      return;
    }

    const newStudentGradeEntry: IStudentRubricGrade = {
      studentEmail: student.email,
      rubricGradesLocation: [],
      currentGrade: 0,
    };

    const updatedStudentRubricGrade = [...rubric.studentRubricGrade, newStudentGradeEntry];
    
    const newRubricState = {
      ...rubric,
      studentRubricGrade: updatedStudentRubricGrade,
    };
    
    setRubric(newRubricState);

    await handleSaveChanges(newRubricState);

    setSelectedStudent(student);
  };

  const handleRemoveStudent = async (studentEmail: string) => {
    if (!rubric || !db || !userId) return;

    if (selectedStudent?.email === studentEmail) {
      setSelectedStudent(null);
    }

    const updatedStudentRubricGrade = rubric.studentRubricGrade.filter(
      (grade) => grade.studentEmail !== studentEmail
    );

    const newRubricState = {
      ...rubric,
      studentRubricGrade: updatedStudentRubricGrade,
    };
    setRubric(newRubricState);

    await handleSaveChanges(newRubricState);
  };

  const handleToggleLockGrade = async (studentEmail: string) => {
    if (!rubric || !db || !userId) return;

    const updatedStudentRubricGrade = rubric.studentRubricGrade.map((grade) =>
      grade.studentEmail === studentEmail
        ? { ...grade, gradeLocked: !grade.gradeLocked }
        : grade
    );

    const newRubricState = {
      ...rubric,
      studentRubricGrade: updatedStudentRubricGrade,
    };
    setRubric(newRubricState);

    await handleSaveChanges(newRubricState);
  };

  const handleGradeSelect = async (categoryIndex: number, gradingIndex: number) => {
    if (editionMode || !selectedStudent || !rubric || !db || !userId) {
      if (!selectedStudent) alert("Por favor, selecione um estudante antes de atribuir notas.");
      return;
    }
    if (selectedStudent.disabled) return;

    const selectedStudentGradeEntry = rubric.studentRubricGrade.find(
      (g) => g.studentEmail === selectedStudent.email
    );
    if (selectedStudentGradeEntry?.gradeLocked) return;

    const selectedLineId = rubric.rubricLines[categoryIndex]?.lineId;
    if (!gradableLineIds.includes(selectedLineId)) {
        return;
    }

    const newGrades = rubric.studentRubricGrade.map((studentGrade) => {
      if (studentGrade.studentEmail === selectedStudent.email) {
        const existing = studentGrade.rubricGradesLocation.find(
          g => g.categoryIndex === categoryIndex && g.gradingIndex === gradingIndex
        );
        const newRubricGradesLocation = existing
          ? studentGrade.rubricGradesLocation.filter(g => g.categoryIndex !== categoryIndex)
          : [
              ...studentGrade.rubricGradesLocation.filter(g => g.categoryIndex !== categoryIndex),
              { categoryIndex, gradingIndex },
            ];

        const newCurrentGrade = newRubricGradesLocation.reduce((total, grade) => {
            const line = rubric.rubricLines[grade.categoryIndex];
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

    const newRubricState = {
      ...rubric,
      studentRubricGrade: newGrades,
    };
    setRubric(newRubricState);

    await handleSaveChanges(newRubricState);
  };

  const handleSaveNewStudent = async (studentData: Omit<IStudent, "studentDocId">) => {
    if (!db) throw new Error("Database not available");
    const appId = typeof __app_id !== "undefined" ? __app_id : "default-app-id";
    const studentDocRef = doc(db, `artifacts/${appId}/students`, studentData.email);
    const newStudent: IStudent = { ...studentData, studentDocId: studentData.email };
    await setDoc(studentDocRef, newStudent);
    await handleAssignStudent(newStudent);
  };

  const handleEdit = () => {
    setOriginalRubric(rubric);
    setEditionMode(true);
  };

  // Função de salvar agora aceita a rubrica a ser salva como parâmetro
  const handleSaveChanges = async (rubricToSaveParam?: IRubric) => {
    const currentRubric = rubricToSaveParam || rubric;

    if (!db || !userId || !currentRubric || !teacherEmail || !teacherName) {
      setError("Informações do usuário (e-mail/nome) não disponíveis ou dados da rubrica ausentes. Não é possível salvar.");
      return;
    }

    setError(null);
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

    try {
      const { id, ...restOfRubric } = currentRubric; 

      const finalRubricData = {
        ...restOfRubric,
        teacherEmail: teacherEmail,
        teacherName: teacherName,
      };

      if (currentRubric.id) {
        const rubricDocRef = doc(db, `artifacts/${appId}/users/${userId}/rubrics`, currentRubric.id);
        await setDoc(rubricDocRef, finalRubricData);
        // alert("Rubrica atualizada com sucesso!"); // Removido para evitar múltiplos alertas em saves automáticos
      } else {
        const rubricsCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/rubrics`);
        const newDocRef = doc(rubricsCollectionRef);
        await setDoc(newDocRef, { ...finalRubricData, id: newDocRef.id });
        setRubric(prev => prev ? { ...prev, id: newDocRef.id } : null);
        navigate(`/rubric?id=${newDocRef.id}`);
        // alert("Rubrica criada com sucesso!"); // Removido para evitar múltiplos alertas em saves automáticos
      }
      setEditionMode(false); // Garante que o modo de edição seja desativado
      setOriginalRubric(null);
    } catch (e) {
      console.error("Erro ao salvar rubrica: ", e);
      setError("Falha ao salvar rubrica. Por favor, tente novamente.");
    } finally {
      // Removido setLoading(false) daqui para evitar flicker
    }
  };

  const handleDelete = () => {
    if (!db || !userId || !rubric || !rubric.id) return;
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!db || !userId || !rubric || !rubric.id) return;
    setShowDeleteConfirm(false);
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    try {
      const rubricDocRef = doc(db, `artifacts/${appId}/users/${userId}/rubrics`, rubric.id);
      await deleteDoc(rubricDocRef);
      navigate("/");
    } catch (e) {
      console.error("Erro ao excluir rubrica: ", e);
      setError("Falha ao excluir rubrica. Por favor, tente novamente.");
    }
  };

  // Função para gerar o link de compartilhamento
  const handleShare = () => {
    if (!rubric || !rubric.id) {
      alert("Por favor, salve a rubrica antes de compartilhar.");
      return;
    }
    if (!selectedStudent || !selectedStudent.email || !userId) { // userId do professor é necessário
      alert("Por favor, selecione um estudante e certifique-se de que o professor está logado para compartilhar a rubrica.");
      return;
    }

    // Codifica o e-mail do estudante em Base64 para ofuscação
    const encodedStudentEmail = btoa(selectedStudent.email);
    // Constrói a URL de compartilhamento, incluindo o userId do professor e o e-mail codificado
    const shareableUrl = `${window.location.origin}/rubricFeedback?id=${rubric.id}&student=${encodedStudentEmail}&teacherUid=${userId}`;
    
    // Copia para a área de transferência (usando document.execCommand para compatibilidade em iframes)
    const el = document.createElement('textarea');
    el.value = shareableUrl;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);

    alert(`Link de compartilhamento copiado! \n${shareableUrl}`);
  };

  const handleShareRubric = () => {
    if (!rubric?.id || !userId) {
      alert("Save the rubric before sharing.");
      return;
    }
    const url = `${window.location.origin}/rubricFeedback?id=${rubric.id}&teacherUid=${userId}`;
    navigator.clipboard.writeText(url).catch(() => {
      const el = document.createElement('textarea');
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    });
    alert(`Rubric link copied!\n${url}`);
  };

  const handleCancel = () => {
    if (originalRubric) {
      setRubric(originalRubric);
    }
    setEditionMode(false);
    setOriginalRubric(null);
  };

  if (loading) {
    return <div className={styles.rubricPage}>Carregando rubrica...</div>;
  }

  if (error) {
    return <div className={styles.rubricPage} style={{ color: 'red' }}>Erro: {error}</div>;
  }

  if (!rubric) {
    return <div className={styles.rubricPage}>Nenhum dado de rubrica disponível.</div>;
  }

  const selectedStudentGradeInfo = rubric.studentRubricGrade.find(
    (g) => g.studentEmail === selectedStudent?.email
  );
  const selectedStudentGrades = selectedStudentGradeInfo?.rubricGradesLocation;


  return (
    <div className={styles.rubricPage}>
      <div className={styles.studentListSidebar}>
        <StudentList
          rubricId={rubric.id ?? ''}
          teacherUid={userId ?? ''}
          assignedStudents={assignedStudents}
          studentRubricGrades={rubric.studentRubricGrade}
          maxGrade={maxGrade}
          selectedStudent={selectedStudent}
          onAssignStudent={handleAssignStudent}
          onRemoveStudent={handleRemoveStudent}
          onToggleLockGrade={handleToggleLockGrade}
          onSelectStudent={setSelectedStudent}
          onSaveNewStudent={handleSaveNewStudent}
          allAvailableStudents={allAvailableStudents}
        />
      </div>
      <div className={styles.rubricContent}>
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <input
              type="text"
              value={rubric.header.title}
              onChange={handleTitleChange}
              className={styles.titleInput}
              placeholder="Rubrica sem título"
              readOnly={!editionMode}
            />
            {selectedStudent && selectedStudentGradeInfo && !editionMode && (
              <div className={styles.gradingStudentInfo}>
                {selectedStudent.name} - {getGradeLevelWithSuffix(selectedStudent.gradeLevel)}:{" "}
                <span className={styles.gradePill}>
                  <strong>
                    {(() => {
                      const bonus = selectedStudentGradeInfo.bonusSelectedIndices?.length ?? 0;
                      const total = selectedStudentGradeInfo.currentGrade + bonus;
                      return total === 0 ? "-" : `${total} / ${maxGrade}`;
                    })()}
                  </strong>
                </span>
                {(selectedStudentGradeInfo.bonusSelectedIndices?.length ?? 0) > 0 && (
                  <span className={styles.bonusPill}>
                    +{selectedStudentGradeInfo.bonusSelectedIndices!.length} added
                  </span>
                )}
              </div>
            )}
          </div>
          
          <div className={styles.headerActions}>
            {editionMode ? (
              <>
                <button onClick={() => handleSaveChanges()} className={styles.saveButton}>
                  Salvar Alterações
                </button>
                <button onClick={handleCancel} className={styles.cancelButton}>
                  Cancelar
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={handleShare} 
                  className={styles.shareButton} 
                  aria-label="Compartilhar Rubrica"
                  disabled={!rubric.id || !selectedStudent || !userId} 
                >
                  <ShareIcon />
                </button>
                <DropdownMenu
                  trigger={
                    <button className={styles.optionsButton} aria-label="Opções da Rubrica">
                      <OptionsIcon />
                    </button>
                  }
                >
                  <button onClick={handleEdit}>Edit</button>
                  <button onClick={handleShareRubric}>Share Rubric</button>
                  <button onClick={handleDelete}>Delete</button>
                </DropdownMenu>
              </>
            )}
          </div>
        </header>
        <hr className={styles.divider} />

        <RubricTable
          columns={rubric.columns ?? DEFAULT_COLUMNS}
          rubricLines={rubric.rubricLines}
          selectedStudentGrades={selectedStudentGrades}
          editionMode={editionMode}
          onAddCategory={handleAddCategory}
          onRemoveCategory={handleRemoveCategory}
          onGradeSelect={handleGradeSelect}
          onRubricLineChange={handleRubricLineChange}
          onColumnChange={handleColumnChange}
          gradableLineIds={gradableLineIds}
        />

        <BonusTable
          bonusColumns={rubric.bonusColumns ?? DEFAULT_BONUS_COLUMNS}
          selectedIndices={selectedStudentGradeInfo?.bonusSelectedIndices ?? []}
          editionMode={editionMode}
          hasStudentSelected={!!selectedStudent}
          onToggle={handleBonusToggle}
          onColumnNameChange={handleBonusColumnNameChange}
        />
      </div>
      
      {showDeleteConfirm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <p>Tem certeza que deseja excluir esta rubrica?</p>
            <div className={styles.modalActions}>
              <button onClick={() => setShowDeleteConfirm(false)} className={styles.cancelButton}>
                Cancelar
              </button>
              <button onClick={handleConfirmDelete} className={styles.deleteButton}>
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
