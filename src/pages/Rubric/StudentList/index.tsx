// src/pages/Rubric/StudentList/index.tsx
import { useState, useEffect } from "react";
import { collection, query, onSnapshot } from "firebase/firestore";
import { useFirebase } from "../../../context/FirebaseContext";
import type { IStudent } from "../../../interfaces/IStudent";
import type { IStudentRubricGrade } from "../../../interfaces/IRubric";
import { StudentAutocomplete } from "./StudentAutocomplete";
import styles from "./StudentList.module.scss";

interface StudentListProps {
  assignedStudents: IStudent[]; // Agora esta lista é derivada do pai
  studentRubricGrades: IStudentRubricGrade[];
  maxGrade: number;
  selectedStudent: IStudent | null;
  onAssignStudent: (student: IStudent) => void;
  onRemoveStudent: (studentEmail: string) => void; // Alterado para studentEmail
  onSelectStudent: (student: IStudent) => void;
  allAvailableStudents: IStudent[]; // Nova prop: lista completa de estudantes
}

export function StudentList({
  assignedStudents,
  studentRubricGrades,
  maxGrade,
  selectedStudent,
  onAssignStudent,
  onRemoveStudent,
  onSelectStudent,
  allAvailableStudents, // Recebe a lista completa de estudantes
}: StudentListProps) {

  const handleSelectStudent = (student: IStudent) => {
    // A verificação se o estudante já está atribuído é feita aqui no StudentList
    // antes de chamar onAssignStudent no componente pai.
    if (!assignedStudents.some((s) => s.email === student.email)) { // Comparar por email
      onAssignStudent(student);
    } else {
        console.warn("Student already assigned:", student.email);
    }
  };

  // Removido o useEffect de carregamento de estudantes, pois agora allAvailableStudents vem do pai.
  // Os estados de loadingStudents e errorLoadingStudents também podem ser removidos daqui,
  // ou gerenciados no componente pai e passados como props se necessário para feedback visual.

  // Para simplificar, assumimos que allAvailableStudents já vem carregado do Rubric/index.tsx
  // Se houver necessidade de loading/error para allAvailableStudents aqui,
  // esses estados e lógica devem ser passados como props do Rubric/index.tsx.

  return (
    <aside className={styles.studentListContainer}>
      <h2 className={styles.title}>Assign Students</h2>
      
      <StudentAutocomplete
        allStudents={allAvailableStudents} // Passa a lista completa para o autocomplete
        onStudentSelect={handleSelectStudent}
      />

      <div className={styles.assignedList}>
        {assignedStudents.length > 0 ? (
          assignedStudents.map((student) => {
            const isSelected = selectedStudent?.email === student.email; // Comparar por email
            const studentGrade = studentRubricGrades.find(g => g.studentEmail === student.email); // Buscar por email
            const currentGrade = studentGrade ? studentGrade.currentGrade : 0;

            return (
              <div 
                key={student.email} // Usar email como key
                className={`${styles.studentItem} ${isSelected ? styles.selected : ''}`}
                onClick={() => onSelectStudent(student)}
              >
                <span className={styles.studentName}>{student.name}</span>
                <span className={styles.studentGrade}>
                  {currentGrade === 0 ? '-' : `${currentGrade} / ${maxGrade}`}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation(); 
                    onRemoveStudent(student.email); // Passar email para remover
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
