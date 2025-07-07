// src/pages/Rubric/StudentList/index.tsx
import type { IStudent } from "../../../interfaces/IStudent";
import type { IStudentRubricGrade } from "../../../interfaces/IRubric";
import { mockStudents } from "../../../data/mockStudents";
import { StudentAutocomplete } from "./StudentAutocomplete";
import styles from "./StudentList.module.scss";

interface StudentListProps {
  assignedStudents: IStudent[];
  studentRubricGrades: IStudentRubricGrade[];
  maxGrade: number; // Receive maxGrade
  selectedStudent: IStudent | null;
  onAssignStudent: (student: IStudent) => void;
  onRemoveStudent: (studentId: String) => void;
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

  const handleSelectStudent = (student: IStudent) => {
    if (!assignedStudents.find((s) => s.studentDocId === student.studentDocId)) {
      onAssignStudent(student);
    }
  };

  return (
    <aside className={styles.studentListContainer}>
      <h2 className={styles.title}>Assign Students</h2>
      
      <StudentAutocomplete
        allStudents={mockStudents}
        onStudentSelect={handleSelectStudent}
      />

      <div className={styles.assignedList}>
        {assignedStudents.length > 0 ? (
          assignedStudents.map((student) => {
            const isSelected = selectedStudent?.studentDocId === student.studentDocId;
            const studentGrade = studentRubricGrades.find(g => g.studentDocId === student.studentDocId);
            const currentGrade = studentGrade ? studentGrade.currentGrade : 0;

            return (
              <div 
                key={String(student.studentDocId)} 
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
                    onRemoveStudent(student.studentDocId);
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