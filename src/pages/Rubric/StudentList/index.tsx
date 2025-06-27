// src/pages/Rubric/StudentList/index.tsx
import { useState } from "react";
import type { IStudent } from "../../../interfaces/IStudent";
import { mockStudents } from "../../../data/mockStudents";
import { StudentAutocomplete } from "./StudentAutocomplete";
import styles from "./StudentList.module.scss";

export function StudentList() {
  const [assignedStudents, setAssignedStudents] = useState<IStudent[]>([]);

  const handleSelectStudent = (student: IStudent) => {
    // Prevent adding the same student twice
    if (!assignedStudents.find((s) => s.studentDocId === student.studentDocId)) {
      setAssignedStudents([...assignedStudents, student]);
    }
  };

  const handleRemoveStudent = (studentId: String) => {
    setAssignedStudents(
      assignedStudents.filter((s) => s.studentDocId !== studentId)
    );
  };

  return (
    <aside className={styles.studentListContainer}>
      <h2 className={styles.title}>Assign Students</h2>
      
      {/* Autocomplete Search Component */}
      <StudentAutocomplete
        allStudents={mockStudents}
        onStudentSelect={handleSelectStudent}
      />

      {/* List of Assigned Students */}
      <div className={styles.assignedList}>
        {assignedStudents.length > 0 ? (
          assignedStudents.map((student) => (
            <div key={String(student.studentDocId)} className={styles.studentItem}>
              <span>{student.name}</span>
              <button
                onClick={() => handleRemoveStudent(student.studentDocId)}
                className={styles.removeButton}
              >
                &times;
              </button>
            </div>
          ))
        ) : (
          <p className={styles.noStudentsMessage}>No students assigned yet.</p>
        )}
      </div>
    </aside>
  );
}
