// src/pages/RubricFeedback/index.tsx
import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { doc, getDoc, collection, query, onSnapshot } from "firebase/firestore";
import { useFirebase } from "../../context/FirebaseContext";
import type { IRubric, IRubricLine, IStudentRubricGrade } from "../../interfaces/IRubric";
import type { IStudent } from "../../interfaces/IStudent";
import { RubricTable } from "../Rubric/RubricTable"; // Reutiliza o componente RubricTable
import styles from "./RubricFeedback.module.scss"; // Estilos específicos para esta página

export function RubricFeedback() {
  const [searchParams] = useSearchParams();
  const { db, isAuthReady } = useFirebase(); // userId não é usado diretamente para o path aqui, mas sim teacherUid da URL
  
  const [rubric, setRubric] = useState<IRubric | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<IStudent | null>(null);
  const [maxGrade, setMaxGrade] = useState(0);
  const [gradableLineIds, setGradableLineIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allAvailableStudents, setAllAvailableStudents] = useState<IStudent[]>([]); // Para encontrar o estudante pelo email

  // Função auxiliar para adicionar sufixos ao nível de ensino (copiada de Rubric/index.tsx)
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

  // Efeito para calcular maxGrade e gradableLineIds (copiado de Rubric/index.tsx)
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

    setMaxGrade(tempValidLines.length * 25);
    setGradableLineIds(tempValidLines.map(line => line.lineId));
  }, [rubric?.rubricLines]);

  // Efeito para carregar todos os estudantes disponíveis do Firestore (para encontrar o aluno pelo email)
  useEffect(() => {
    if (!isAuthReady || !db) {
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
        console.error("Erro ao buscar todos os estudantes para a página de feedback:", err);
        setError("Falha ao carregar informações de estudantes.");
      }
    );

    return () => unsubscribe();
  }, [db, isAuthReady]);

  // Efeito principal para carregar a rubrica e selecionar o estudante
  useEffect(() => {
    if (!isAuthReady || !db || allAvailableStudents.length === 0) {
      return;
    }

    const rubricId = searchParams.get("id");
    const studentEmailParam = searchParams.get("student");
    const teacherUidParam = searchParams.get("teacherUid");

    if (!rubricId || !studentEmailParam || !teacherUidParam) {
      setError("ID da rubrica, e-mail do estudante ou UID do professor ausente na URL.");
      setLoading(false);
      return;
    }

    // Decodifica o e-mail do estudante do Base64
    let decodedStudentEmail: string | null = null;
    try {
        decodedStudentEmail = atob(studentEmailParam);
    } catch (e) {
        console.error("Erro ao decodificar e-mail do estudante:", e);
        setError("Link de estudante inválido.");
        setLoading(false);
        return;
    }

    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const rubricDocRef = doc(db, `artifacts/${appId}/users/${teacherUidParam}/rubrics`, rubricId);

    const fetchFeedbackRubric = async () => {
      try {
        const docSnap = await getDoc(rubricDocRef);
        if (docSnap.exists()) {
          const fetchedRubric = { id: docSnap.id, ...docSnap.data() } as IRubric;
          setRubric(fetchedRubric);

          const studentToDisplay = allAvailableStudents.find(s => s.email === decodedStudentEmail);
          if (studentToDisplay) {
            setSelectedStudent(studentToDisplay);
          } else {
            setError(`Estudante com e-mail '${decodedStudentEmail}' não encontrado.`);
          }
          setLoading(false);
        } else {
          setError("Rubrica não encontrada.");
          setLoading(false);
        }
      } catch (err) {
        console.error("Erro ao buscar rubrica para feedback:", err);
        setError("Falha ao carregar rubrica. Verifique o link e as permissões.");
        setLoading(false);
      }
    };
    fetchFeedbackRubric();
  }, [searchParams, db, isAuthReady, allAvailableStudents]);

  if (loading) {
    return <div className={styles.feedbackContainer}>Carregando feedback da rubrica...</div>;
  }

  if (error) {
    return <div className={styles.feedbackContainer} style={{ color: 'red' }}>Erro: {error}</div>;
  }

  if (!rubric || !selectedStudent) {
    return <div className={styles.feedbackContainer}>Nenhum feedback de rubrica disponível para o estudante selecionado.</div>;
  }

  // Encontra a nota específica do estudante na rubrica
  const studentGradeInfo = rubric.studentRubricGrade.find(
    (g) => g.studentEmail === selectedStudent.email
  );
  const selectedStudentGradesLocation = studentGradeInfo?.rubricGradesLocation || [];
  const currentGrade = studentGradeInfo?.currentGrade || 0;

  return (
    <div className={styles.feedbackContainer}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>{rubric.header.title}</h1>
          {selectedStudent && (
            <div className={styles.gradingStudentInfo}>
              {/* Exibe o nome do estudante e o nível de ensino com sufixo */}
              {selectedStudent.name} - {getGradeLevelWithSuffix(selectedStudent.gradeLevel)}: {" "}
              <span className={styles.gradePill}>
                <strong>{currentGrade === 0 ? '-' : `${currentGrade} / ${maxGrade}`}</strong>
              </span>
            </div>
          )}
        </div>
      </header>
      <hr className={styles.divider} />

      <RubricTable
        rubricLines={rubric.rubricLines}
        selectedStudentGrades={selectedStudentGradesLocation}
        editionMode={false} // Sempre em modo de visualização
        onAddCategory={() => {}} // Funções vazias, pois não há edição
        onRemoveCategory={() => {}}
        onGradeSelect={() => {}}
        onRubricLineChange={() => {}}
        gradableLineIds={gradableLineIds}
      />
    </div>
  );
}
