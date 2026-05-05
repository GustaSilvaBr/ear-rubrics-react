// src/pages/Rubric/StudentList/StudentAutocomplete/index.tsx
import { useState, useMemo } from "react";
import type { IStudent } from "../../../../interfaces/IStudent";
import styles from "./StudentAutocomplete.module.scss";

const GRADE_LEVELS = ["6", "7", "8", "9", "10", "11", "12"];

interface StudentAutocompleteProps {
  allStudents: IStudent[];
  onStudentSelect: (student: IStudent) => void;
  onSaveNewStudent: (student: Omit<IStudent, "studentDocId">) => Promise<void>;
}

export function StudentAutocomplete({
  allStudents,
  onStudentSelect,
  onSaveNewStudent,
}: StudentAutocompleteProps) {
  const [inputValue, setInputValue] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newGradeLevel, setNewGradeLevel] = useState("6");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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

  const filteredStudents = useMemo(() => {
    if (!inputValue) return [];
    const lower = inputValue.toLowerCase();
    return allStudents.filter(
      (s) =>
        s.name.toLowerCase().includes(lower) ||
        s.email.toLowerCase().includes(lower) ||
        s.gradeLevel.toLowerCase().includes(lower)
    );
  }, [inputValue, allStudents]);

  const handleSelect = (student: IStudent) => {
    onStudentSelect(student);
    setInputValue("");
  };

  const handleOpenModal = () => {
    setNewName(inputValue);
    setNewEmail("");
    setNewGradeLevel("6");
    setFormError(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) {
      setFormError("Name and email are required.");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await onSaveNewStudent({
        name: newName.trim(),
        email: newEmail.trim().toLowerCase(),
        gradeLevel: newGradeLevel,
        studentId: newEmail.trim().toLowerCase(),
      });
      setShowModal(false);
      setInputValue("");
    } catch {
      setFormError("Failed to save student. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.autocompleteWrapper}>
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        className={styles.input}
        placeholder="Search student..."
      />

      {inputValue && (
        <ul className={styles.dropdown}>
          {filteredStudents.map((student) => (
            <li
              key={student.email}
              onClick={() => handleSelect(student)}
              className={styles.dropdownItem}
            >
              {student.name} — {getGradeLevelWithSuffix(student.gradeLevel)}
            </li>
          ))}
          <li onClick={handleOpenModal} className={`${styles.dropdownItem} ${styles.addStudentItem}`}>
            + Add new student
          </li>
        </ul>
      )}

      {showModal && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Add New Student</h3>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label}>Full Name</label>
                <input
                  className={styles.fieldInput}
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Student full name"
                  required
                  autoFocus
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Grade Level</label>
                <select
                  className={styles.fieldSelect}
                  value={newGradeLevel}
                  onChange={(e) => setNewGradeLevel(e.target.value)}
                >
                  {GRADE_LEVELS.map((g) => (
                    <option key={g} value={g}>
                      {getGradeLevelWithSuffix(g)} Grade
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Email</label>
                <input
                  className={styles.fieldInput}
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="student@school.com"
                  required
                />
              </div>

              {formError && <p className={styles.formError}>{formError}</p>}

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelButton} onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className={styles.saveButton} disabled={saving}>
                  {saving ? "Saving…" : "Add Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
