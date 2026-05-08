// src/pages/Rubric/StudentList/index.tsx
import { useState, useEffect, useRef } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, updateDoc } from "firebase/firestore";
import type { IStudent } from "../../../interfaces/IStudent";
import type { IStudentRubricGrade } from "../../../interfaces/IRubric";
import { useFirebase } from "../../../context/FirebaseContext";
import { StudentAutocomplete } from "./StudentAutocomplete";
import styles from "./StudentList.module.scss";

interface StudentListProps {
  rubricId: string;
  teacherUid: string;
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

function initials(name: string) {
  return name.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
}

export function StudentList({
  rubricId,
  teacherUid,
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
  const { storage, db } = useFirebase();
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [uploadingEmail, setUploadingEmail] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTargetEmail = useRef<string | null>(null);

  const getGradeLevelWithSuffix = (gradeLevel: string): string => {
    const num = parseInt(gradeLevel);
    if (isNaN(num)) return gradeLevel;
    const lastDigit = num % 10;
    const lastTwoDigits = num % 100;
    if (lastTwoDigits >= 11 && lastTwoDigits <= 13) return `${gradeLevel}th`;
    switch (lastDigit) {
      case 1: return `${gradeLevel}st`;
      case 2: return `${gradeLevel}nd`;
      case 3: return `${gradeLevel}rd`;
      default: return `${gradeLevel}th`;
    }
  };

  const handleSelectStudent = (student: IStudent) => {
    if (!assignedStudents.some((s) => s.email === student.email)) {
      onAssignStudent(student);
    }
  };

  const handleCopyLink = (e: React.MouseEvent, student: IStudent) => {
    e.stopPropagation();
    const encodedEmail = btoa(student.email);
    const url = `${window.location.origin}/rubricFeedback?id=${rubricId}&student=${encodedEmail}&teacherUid=${teacherUid}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedEmail(student.email);
      setTimeout(() => setCopiedEmail(null), 2000);
    });
  };

  const uploadPhoto = async (email: string, file: File) => {
    if (!storage || !db) return;
    setUploadingEmail(email);
    try {
      const storageRef = ref(storage, `studentPhotos/${email}`);
      await uploadBytes(storageRef, file);
      const photoUrl = await getDownloadURL(storageRef);
      const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
      await updateDoc(doc(db, `artifacts/${appId}/students`, email), { photoUrl });
    } catch (err) {
      console.error("Failed to upload student photo:", err);
    } finally {
      setUploadingEmail(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAvatarClick = (e: React.MouseEvent, email: string) => {
    e.stopPropagation();
    uploadTargetEmail.current = email;
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const email = uploadTargetEmail.current;
    if (file && email) uploadPhoto(email, file);
  };

  // Paste listener: applies to the last avatar clicked, or the currently selected student
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const email = uploadTargetEmail.current ?? selectedStudent?.email;
      if (!email) return;
      const item = Array.from(e.clipboardData?.items ?? []).find(i => i.type.startsWith('image/'));
      if (!item) return;
      const file = item.getAsFile();
      if (file) uploadPhoto(email, file);
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStudent?.email, storage, db]);

  return (
    <aside className={styles.studentListContainer}>
      <h2 className={styles.title}>Assign Students</h2>

      {/* Hidden file input shared across all student avatars */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className={styles.hiddenInput}
        onChange={handleFileChange}
      />

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
            const isCopied = copiedEmail === student.email;
            const isUploading = uploadingEmail === student.email;

            return (
              <div
                key={student.email}
                className={`${styles.studentItem} ${isSelected ? styles.selected : ''} ${isLocked ? styles.locked : ''}`}
                onClick={() => onSelectStudent(student)}
              >
                <div className={styles.studentFirstRow}>
                  <button
                    className={`${styles.avatarButton} ${isUploading ? styles.avatarUploading : ''}`}
                    onClick={(e) => handleAvatarClick(e, student.email)}
                    title="Click to upload photo"
                  >
                    {student.photoUrl && !isUploading
                      ? <img src={student.photoUrl} alt={student.name} className={styles.avatarImg} />
                      : <span className={styles.avatarInitials}>
                          {isUploading ? '…' : initials(student.name)}
                        </span>
                    }
                  </button>
                  <span className={styles.studentName}>{student.name}</span>
                </div>

                <div className={styles.studentSecondRow}>
                  <span className={styles.studentGradeLevel}>{getGradeLevelWithSuffix(student.gradeLevel)}</span>
                  <span className={styles.studentGrade}>
                    {currentGrade + bonusPoints === 0
                      ? '-'
                      : `${currentGrade + bonusPoints} / ${maxGrade}`}
                  </span>
                  <button
                    onClick={(e) => handleCopyLink(e, student)}
                    className={`${styles.shareButton} ${isCopied ? styles.shareButtonCopied : ''}`}
                    title="Copy student link"
                  >
                    {isCopied ? '✓' : '🔗'}
                  </button>
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
            );
          })
        ) : (
          <p className={styles.noStudentsMessage}>No students assigned yet.</p>
        )}
      </div>
    </aside>
  );
}
