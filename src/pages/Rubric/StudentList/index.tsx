// src/pages/Rubric/StudentList/index.tsx
import type { IStudent } from "../../../interfaces/IStudent";
import { mockStudents } from "../../../data/mockStudents";
import { StudentAutocomplete } from "./StudentAutocomplete";
import styles from "./StudentList.module.scss";

interface StudentListProps {
  assignedStudents: IStudent[];
  // Add selectedStudent and a handler to set it
  selectedStudent: IStudent | null;
  onAssignStudent: (student: IStudent) => void;
  onRemoveStudent: (studentId: String) => void;
  onSelectStudent: (student: IStudent) => void;
}

export function StudentList({
  assignedStudents,
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
            // Check if the current student is the selected one
            const isSelected = selectedStudent?.studentDocId === student.studentDocId;
            return (
              <div 
                key={String(student.studentDocId)} 
                // Add the 'selected' class conditionally
                className={`${styles.studentItem} ${isSelected ? styles.selected : ''}`}
                // Add onClick to select the student
                onClick={() => onSelectStudent(student)}
              >
                <span>{student.name}</span>
                <button
                  // Stop click propagation to prevent selecting when removing
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