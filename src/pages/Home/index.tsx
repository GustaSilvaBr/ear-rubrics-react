// src/pages/Home/index.tsx
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { collection, query, onSnapshot, addDoc } from "firebase/firestore"; // Importe addDoc
import { useFirebase } from "../../context/FirebaseContext";
import type { IRubric } from "../../interfaces/IRubric";
import type { ITeacher } from "../../interfaces/ITeacher"; // Importe ITeacher
import type { IStudent } from "../../interfaces/IStudent"; // Importe IStudent
import styles from "./Home.module.scss";

// Interface para a listagem simplificada da rubrica na Home
interface IRubricListing {
  id: string;
  title: String;
  numberOfAssignedStudents: number;
}

export function Home() {
  const { db, userId, isAuthReady } = useFirebase();
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

  // Função para criar dados fake no banco de dados
  const createFakeData = async () => {
    if (!db || !userId) {
      alert("Firebase is not initialized or user is not authenticated.");
      return;
    }

    setLoading(true);
    setError(null);
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

    try {
      // 1. Criar um Teacher
      const teachersCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/teachers`);
      const teacherData: Omit<ITeacher, 'teacherDocId'> = { // Omitir teacherDocId, pois addDoc irá gerá-lo
        name: "Gustavo Silva",
        email: "gustavo.silva@ear.com.br",
      };
      const teacherDocRef = await addDoc(teachersCollectionRef, teacherData);
      const teacherDocId = teacherDocRef.id;
      console.log("Teacher created with ID:", teacherDocId);

      // 2. Criar um Student
      const studentsCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/students`);
      const studentData: Omit<IStudent, 'studentDocId'> = { // Omitir studentDocId
        name: "John Doe",
        studentId: "1020/1",
        email: "john.doe@ear.com.br",
        gradeLevel: "11th",
      };
      const studentDocRef = await addDoc(studentsCollectionRef, studentData);
      const studentDocId = studentDocRef.id;
      console.log("Student created with ID:", studentDocId);

      // 3. Criar uma Rubric
      const rubricsCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/rubrics`);
      const rubricData: Omit<IRubric, 'id'> = { // Omitir id, pois addDoc irá gerá-lo
        teacherDocId: teacherDocId, // Usar o ID do professor recém-criado
        studentRubricGrade: [
          {
            studentDocId: studentDocId, // Usar o ID do estudante recém-criado
            rubricGradesLocation: [],
            currentGrade: 0,
          }
        ],
        rubricLines: [
            { lineId: "line-1", categoryName: "Category 1", possibleScores: [{ score: 25, text: "Desc 1" }, { score: 20, text: "Desc 2" }, { score: 15, text: "Desc 3" }, { score: 10, text: "Desc 4" }] },
            { lineId: "line-2", categoryName: "Category 2", possibleScores: [{ score: 25, text: "Desc A" }, { score: 20, text: "Desc B" }, { score: 15, text: "Desc C" }, { score: 10, text: "Desc D" }] },
        ],
        header: {
          title: "Teste Rubrica Fake",
          gradeLevels: ["9th"],
        },
      };
      await addDoc(rubricsCollectionRef, rubricData);
      console.log("Rubric created successfully!");

      alert("Fake data created successfully!");
    } catch (e) {
      console.error("Error creating fake data: ", e);
      setError("Failed to create fake data. Please check console for details.");
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
      <button onClick={createFakeData} style={{ marginBottom: '20px', padding: '10px 15px', fontSize: '16px' }}>
        Create Fake Data
      </button>
      <div className={styles.rubricGrid}>
        {/* Card para Adicionar Nova Rúbrica */}
        <Link to="/rubric" className={styles.addRubricCard}>
          <span className={styles.plusIcon}>+</span>
        </Link>

        {/* Cards de Rúbricas Existentes */}
        {rubrics.map((rubric) => (
          <Link
            key={rubric.id}
            to={`/rubric?id=${rubric.id}`}
            className={styles.rubricCard}
          >
            <h2 className={styles.rubricName}>{rubric.title}</h2>
            <p className={styles.studentCount}>
              {rubric.numberOfAssignedStudents} Students
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
