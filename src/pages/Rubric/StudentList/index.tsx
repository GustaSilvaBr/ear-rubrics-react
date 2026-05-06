// src/pages/Rubric/StudentList/index.tsx
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
  onRemoveStudent: (studentEmail: string) => void;
  onToggleLockGrade: (studentEmail: string) => void;
  onSelectStudent: (student: IStudent) => void;
  onSaveNewStudent: (student: Omit<IStudent, "studentDocId">) => Promise<void>;
  allAvailableStudents: IStudent[];
}

export function StudentList({
  assignedStudents,
  studentRubricGrades,
  maxGrade,
  selectedStudent,
  onAssignStudent,
  onRemoveStudent,
  onToggleLockGrade,
  onSelectStudent,
  onSaveNewStudent,
  allAvailableStudents,
}: StudentListProps) {

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

  const handleSelectStudent = (student: IStudent) => {
    if (!assignedStudents.some((s) => s.email === student.email)) {
      onAssignStudent(student);
    } else {
        console.warn("Estudante já atribuído:", student.email);
    }
  };

  return (
    <aside className={styles.studentListContainer}>
      <h2 className={styles.title}>Assign Students</h2>
      
      <StudentAutocomplete
        allStudents={allAvailableStudents.filter(s => !s.disabled)}
        onStudentSelect={handleSelectStudent}
        onSaveNewStudent={onSaveNewStudent}
      />

      <div className={styles.assignedList}>
        {assignedStudents.length > 0 ? (
          assignedStudents.map((student) => {
            const isSelected = selectedStudent?.email === student.email;
            const studentGrade = studentRubricGrades.find(g => g.studentEmail === student.email);
            const currentGrade = studentGrade ? studentGrade.currentGrade : 0;
            const bonusPoints = studentGrade?.bonusSelectedIndices?.length ?? 0;

            const isLocked = studentGrade?.gradeLocked ?? false;

            return (
              <div
                key={student.email}
                className={`${styles.studentItem} ${isSelected ? styles.selected : ''} ${isLocked ? styles.locked : ''}`}
                onClick={() => onSelectStudent(student)}
              >
                <span className={styles.studentName}>{student.name}</span>
                <div className={styles.studentSecondRow}>
                  <span className={styles.studentGradeLevel}>{getGradeLevelWithSuffix(student.gradeLevel)}</span>
                  <span className={styles.studentGrade}>
                    {currentGrade + bonusPoints === 0
                      ? '-'
                      : `${currentGrade + bonusPoints} / ${maxGrade}`}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Remove ${student.name} from this rubric?`)) {
                        onRemoveStudent(student.email);
                      }
                    }}
                    className={styles.removeButton}
                  >
                    &times;
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isLocked) {
                        if (window.confirm(`Are you sure you want to unlock ${student.name}'s grade?`)) {
                          onToggleLockGrade(student.email);
                        }
                      } else {
                        onToggleLockGrade(student.email);
                      }
                    }}
                    className={`${styles.lockButton} ${isLocked ? styles.lockButtonLocked : ''}`}
                    title={isLocked ? 'Unlock grade' : 'Lock grade'}
                  >
                    {isLocked ? '🔒' : '🔓'}
                  </button>
                </div>
              </div>
            )
          })
        ) : (
          <p className={styles.noStudentsMessage}>Nenhum estudante atribuído ainda.</p>
        )}
      </div>
    </aside>
  );
}
