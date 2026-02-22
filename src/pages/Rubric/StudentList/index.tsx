// src/pages/Rubric/StudentList/index.tsx
import React, { useRef, useEffect } from 'react';
import type { IStudent } from "../../../interfaces/IStudent";
import type { IStudentRubricGrade } from "../../../interfaces/IRubric";
import { StudentAutocomplete } from "./StudentAutocomplete";
import styles from "./StudentList.module.scss";

const ShareIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"></path>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"></path>
  </svg>
);

interface StudentListProps {
  assignedStudents: IStudent[];
  studentRubricGrades: IStudentRubricGrade[];
  maxGrade: number;
  selectedStudent: IStudent | null;
  onAssignStudent: (student: IStudent) => void;
  onRemoveStudent: (studentEmail: string) => void;
  onSelectStudent: (student: IStudent) => void;
  allAvailableStudents: IStudent[];
  rubricId?: string;
  teacherUid?: string | null;
  rubricTitle?: string;
  onSave?: () => void;
}

export function StudentList({
  assignedStudents,
  studentRubricGrades,
  maxGrade,
  selectedStudent,
  onAssignStudent,
  onRemoveStudent,
  onSelectStudent,
  allAvailableStudents,
  rubricId,
  teacherUid,
  rubricTitle,
  onSave
}: StudentListProps) {
  // Use a map to store refs for each student item
  const studentRefs = useRef<Map<string, HTMLLIElement>>(new Map());

  // Scroll the selected student into view whenever the selection changes
  useEffect(() => {
    if (selectedStudent) {
      const element = studentRefs.current.get(selectedStudent.email);
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest', // Ensures it scrolls just enough to be visible
        });
      }
    }
  }, [selectedStudent]);

  const handleShare = (e: React.MouseEvent, studentEmail: string) => {
    e.stopPropagation();
    if (!rubricId || !teacherUid) {
      alert("Save the rubric before sharing.");
      return;
    }
    const encodedEmail = btoa(studentEmail);
    const shareableUrl = `${window.location.origin}/rubricFeedback?id=${rubricId}&student=${encodedEmail}&teacherUid=${teacherUid}`;

    const el = document.createElement('textarea');
    el.value = shareableUrl;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    alert("Link copied to clipboard!");
  };

  return (
    <div className={styles.studentListContainer}>
      <header className={styles.header}>
        <h2 className={styles.rubricTitle}>{rubricTitle || "Untitled Rubric"}</h2>
        <button className={styles.saveBtn} onClick={onSave}>
          Save Rubric
        </button>
      </header>

      <div className={styles.searchSection}>
        <label className={styles.label}>Students</label>
        <StudentAutocomplete
          allStudents={allAvailableStudents}
          onSelect={onAssignStudent}
        />
      </div>

      <ul className={styles.list}>
        {assignedStudents.map((student) => {
          const gradeInfo = studentRubricGrades.find(g => g.studentEmail === student.email);
          const isSelected = selectedStudent?.email === student.email;

          return (
            <li
              key={student.email}
              // Set the ref in our Map
              ref={(el) => {
                if (el) studentRefs.current.set(student.email, el);
                else studentRefs.current.delete(student.email);
              }}
              className={`${styles.listItem} ${isSelected ? styles.selected : ''}`}
              onClick={() => onSelectStudent(student)}
            >
              <div className={styles.studentInfo}>
                <span className={styles.name}>{student.name}</span>
              </div>

              <div className={styles.actions}>
                <span className={styles.grade}>
                  {gradeInfo ? `${gradeInfo.currentGrade}/${maxGrade}` : `0/${maxGrade}`}
                </span>
                <div>
                  <button
                    className={styles.shareBtn}
                    onClick={(e) => handleShare(e, student.email)}
                    title="Copy link"
                  >
                    <ShareIcon />
                  </button>
                  <button
                    className={styles.removeBtn}
                    onClick={(e) => { e.stopPropagation(); onRemoveStudent(student.email); }}
                  >
                    &times;
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}