// src/pages/Home/index.tsx
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { collection, query, onSnapshot, addDoc } from "firebase/firestore";
import { useFirebase } from "../../context/FirebaseContext";
import type { IRubric, IRubricLine } from "../../interfaces/IRubric";
import styles from "./Home.module.scss";

// Interface para a listagem simplificada da rubrica na Home
interface IRubricListing {
  id: string;
  title: string;
  numberOfAssignedStudents: number;
  gradeLevels: string[];
}

export function Home() {
  const navigate = useNavigate();
  const { db, userId, teacherEmail, teacherName, isAuthReady } = useFirebase();
  const [rubrics, setRubrics] = useState<IRubricListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthReady || !db || !userId) {
      return;
    }

    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const rubricsCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/rubrics`);
    const q = query(rubricsCollectionRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedRubrics: IRubricListing[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data() as IRubric;
          const numberOfAssignedStudents = data.studentRubricGrade ? data.studentRubricGrade.length : 0;
          fetchedRubrics.push({
            id: doc.id,
            title: data.header.title,
            numberOfAssignedStudents: numberOfAssignedStudents,
            gradeLevels: data.header.gradeLevels || [],
          });
        });
        setRubrics(fetchedRubrics);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching rubrics:", err);
        setError("Failed to load rubrics. Please try again.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [db, userId, isAuthReady]);

  // Helper para gerar IDs de linha
  const generateLineId = () => {
    return `${Date.now()} - ${Math.floor(Math.random() * 1000) + 1}`;
  };

  // Função para criar uma nova rubrica no Firestore e redirecionar
  const handleCreateNewRubric = async () => {
    if (!db || !userId || !teacherEmail || !teacherName) {
      alert("User information (email/name) not available. Please try logging in again.");
      return;
    }

    setLoading(true);
    setError(null);
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

    try {
      const rubricsCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/rubrics`);
      
      // Linhas de exemplo pré-preenchidas para a nova rubrica
      const prefilledRubricLines: IRubricLine[] = [
        { lineId: generateLineId(), categoryName: "Respect for other Team", possibleScores: [ { score: 25, text: "All statements, body language, and responses were respectful and were in appropriate language." }, { score: 20, text: "Statements and responses were respectful and used appropriate language, but once or twice body language was not." }, { score: 15, text: "Most statements and responses were respectful and in appropriate language, but there was one sarcastic remark." }, { score: 10, text: "Statements, responses and/or body language were consistently not respectful." }] },
        { lineId: generateLineId(), categoryName: "Information", possibleScores: [ { score: 25, text: "All information presented in the debate was clear, accurate and thorough." }, { score: 20, text: "Most information presented in the debate was clear, accurate and thorough." }, { score: 15, text: "Most information presented in the debate was clear and accurate, but was not usually thorough." }, { score: 10, text: "Information had several inaccuracies OR was usually not clear." }] },
        { lineId: generateLineId(), categoryName: "Rebuttal", possibleScores: [ { score: 25, text: "All counter-arguments were accurate, relevant and strong." }, { score: 20, text: "Most counter-arguments were accurate, relevant, and strong." }, { score: 15, text: "Most counter-arguments were accurate and relevant, but several were weak." }, { score: 10, text: "Counter-arguments were not accurate and/or relevant" }] },
        { lineId: generateLineId(), categoryName: "", possibleScores: [ { score: 25, text: "" }, { score: 20, text: "" }, { score: 15, text: "" }, { score: 10, text: "" } ] } // Quarta linha em branco
      ];

      // Criar um objeto de rubrica com valores padrão e as linhas pré-preenchidas
      const newRubricData: Omit<IRubric, 'id'> = {
        teacherEmail: teacherEmail,
        teacherName: teacherName,
        studentRubricGrade: [],
        rubricLines: prefilledRubricLines, // Usa as linhas pré-preenchidas
        header: {
          title: "Untitled Rubric", // Título padrão em inglês
          gradeLevels: [], // Pode ser vazio ou preenchido com padrões se desejar
        },
      };

      const docRef = await addDoc(rubricsCollectionRef, newRubricData); // Adiciona a rubrica ao Firestore
      // Redireciona para a página da rubrica com o novo ID e o parâmetro isNew=true
      navigate(`/rubric?id=${docRef.id}&isNew=true`);
    } catch (e) {
      console.error("Error creating new rubric: ", e);
      setError("Failed to create new rubric. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className={styles.homeContainer}>Loading rubrics...</div>;
  }

  if (error) {
    return <div className={styles.homeContainer} style={{ color: 'red' }}>{error}</div>;
  }

  return (
    <div className={styles.homeContainer}>
      <h1 className={styles.title}>My Rubrics</h1>
      {/* Removido o botão "Create Fake Data" */}
      <div className={styles.rubricGrid}>
        {/* Card para Adicionar Nova Rúbrica - AGORA CRIA E REDIRECIONA */}
        <div className={styles.addRubricCard} onClick={handleCreateNewRubric}>
          <span className={styles.plusIcon}>+</span>
        </div>

        {/* Cards de Rúbricas Existentes */}
        {rubrics.map((rubric) => (
          <Link
            key={rubric.id}
            to={`/rubric?id=${rubric.id}`}
            className={styles.rubricCard}
          >
            <h2 className={styles.rubricName}>
              {rubric.title} 
              {rubric.gradeLevels && rubric.gradeLevels.length > 0 && (
                <span className={styles.rubricGradeLevels}> - {rubric.gradeLevels.join(', ')}</span>
              )}
            </h2>
            <p className={styles.studentCount}>
              {rubric.numberOfAssignedStudents} Students
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
