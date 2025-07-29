// src/pages/Rubric/StudentList/index.tsx
import { useState, useEffect } from "react";
import { collection, query, onSnapshot } from "firebase/firestore";
import { useFirebase } from "../../../context/FirebaseContext";
import type { IStudent } from "../../../interfaces/IStudent";
import type { IStudentRubricGrade } from "../../../interfaces/IRubric";
import { StudentAutocomplete } from "./StudentAutocomplete";
import styles from "./StudentList.module.scss";

interface StudentListProps {
  assignedStudents: IStudent[];
  studentRubricGrades: IStudentRubricGrade[];
  maxGrade: number;
  selectedStudent: IStudent | null;
  onAssignStudent: (student: IStudent) => void;
  onRemoveStudent: (studentId: string) => void; // Changed to string
  onSelectStudent: (student: IStudent) => void;
}

export function StudentList({
  assignedStudents,
  studentRubricGrades,
  maxGrade,
  selectedStudent,
  onAssignStudent,
  onRemoveStudent,
  onSelectStudent,
}: StudentListProps) {
  const { db, userId, isAuthReady } = useFirebase();
  const [allAvailableStudents, setAllAvailableStudents] = useState<IStudent[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [errorLoadingStudents, setErrorLoadingStudents] = useState<string | null>(null);

  // Effect to load all available students from Firestore
  useEffect(() => {
    if (!isAuthReady || !db || !userId) {
      return;
    }

    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const studentsCollectionRef = collection(db, `artifacts/${appId}/students`); // Public collection
    const q = query(studentsCollectionRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedStudents: IStudent[] = [];
        snapshot.forEach((doc) => {
          // Corrected: Map doc.id to studentDocId and ensure data is of the correct type
          fetchedStudents.push({ studentDocId: doc.id, ...doc.data() as Omit<IStudent, 'studentDocId'> });
        });
        setAllAvailableStudents(fetchedStudents);
        setLoadingStudents(false);
      },
      (err) => {
        console.error("Error fetching all students for StudentList:", err);
        setErrorLoadingStudents("Failed to load available students.");
        setLoadingStudents(false);
      }
    );

    return () => unsubscribe();
  }, [db, userId, isAuthReady]);

  const handleSelectStudent = (student: IStudent) => {
    if (!assignedStudents.find((s) => s.studentDocId === student.studentDocId)) {
      onAssignStudent(student);
    }
  };

  if (loadingStudents) {
    return (
      <aside className={styles.studentListContainer}>
        <h2 className={styles.title}>Assign Students</h2>
        <p>Loading available students...</p>
      </aside>
    );
  }

  if (errorLoadingStudents) {
    return (
      <aside className={styles.studentListContainer}>
        <h2 className={styles.title}>Assign Students</h2>
        <p className={styles.errorMessage}>{errorLoadingStudents}</p>
      </aside>
    );
  }

  return (
    <aside className={styles.studentListContainer}>
      <h2 className={styles.title}>Assign Students</h2>
      
      <StudentAutocomplete
        allStudents={allAvailableStudents} // Pass the Firestore student list
        onStudentSelect={handleSelectStudent}
      />

      <div className={styles.assignedList}>
        {assignedStudents.length > 0 ? (
          assignedStudents.map((student) => {
            const isSelected = selectedStudent?.studentDocId === student.studentDocId;
            const studentGrade = studentRubricGrades.find(g => g.studentDocId === student.studentDocId);
            const currentGrade = studentGrade ? studentGrade.currentGrade : 0; // Corrected: studentGrade.currentGrade

            return (
              <div 
                key={student.studentDocId as string} // Ensure key is string
                className={`${styles.studentItem} ${isSelected ? styles.selected : ''}`}
                onClick={() => onSelectStudent(student)}
              >
                <span className={styles.studentName}>{student.name as string}</span>
                <span className={styles.studentGrade}>
                  {currentGrade === 0 ? '-' : `${currentGrade} / ${maxGrade}`}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation(); 
                    onRemoveStudent(student.studentDocId as string); // Ensure parameter is string
                  }}
                  className={styles.removeButton}
                >
                  &times;
                </button>
              </div>
            )
          })
        ) : (
          <p className={styles.noStudentsMessage}>No students assigned yet.</p>
        )}
      </div>
    </aside>
  );
}
