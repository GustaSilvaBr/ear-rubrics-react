// src/pages/Rubric/StudentList/StudentAutocomplete/index.tsx
import { useState, useEffect, useMemo, useRef, type ChangeEvent } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import type { IStudent } from "../../../../interfaces/IStudent";
import { useFirebase } from "../../../../context/FirebaseContext";
import styles from "./StudentAutocomplete.module.scss";

const GRADE_LEVELS = ["6", "7", "8", "9", "10", "11", "12"];

interface StudentAutocompleteProps {
  allStudents: IStudent[];
  onStudentSelect: (student: IStudent) => void;
  onSaveNewStudent: (student: Omit<IStudent, "studentDocId">) => Promise<void>;
}

function initials(name: string) {
  return name.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
}

function Avatar({ student, size = 28 }: { student: IStudent; size?: number }) {
  return (
    <span className={styles.avatar} style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {student.photoUrl
        ? <img src={student.photoUrl} alt={student.name} className={styles.avatarImg} />
        : initials(student.name)
      }
    </span>
  );
}

export function StudentAutocomplete({
  allStudents,
  onStudentSelect,
  onSaveNewStudent,
}: StudentAutocompleteProps) {
  const { storage } = useFirebase();

  const [inputValue, setInputValue] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newGradeLevel, setNewGradeLevel] = useState("6");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Accept pasted images while the modal is open
  useEffect(() => {
    if (!showModal) return;
    const handlePaste = (e: ClipboardEvent) => {
      const item = Array.from(e.clipboardData?.items ?? []).find(i => i.type.startsWith('image/'));
      if (!item) return;
      const file = item.getAsFile();
      if (!file) return;
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [showModal]);

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
    setPhotoFile(null);
    setPhotoPreview(null);
    setFormError(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setPhotoFile(null);
    setPhotoPreview(null);
    setFormError(null);
  };

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setPhotoFile(file);
    if (file) {
      setPhotoPreview(URL.createObjectURL(file));
    } else {
      setPhotoPreview(null);
    }
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
      const email = newEmail.trim().toLowerCase();
      let photoUrl: string | undefined;

      if (photoFile && storage) {
        const storageRef = ref(storage, `studentPhotos/${email}`);
        await uploadBytes(storageRef, photoFile);
        photoUrl = await getDownloadURL(storageRef);
      }

      await onSaveNewStudent({
        name: newName.trim(),
        email,
        gradeLevel: newGradeLevel,
        studentId: email,
        ...(photoUrl ? { photoUrl } : {}),
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
              <Avatar student={student} size={26} />
              <span>{student.name} — {getGradeLevelWithSuffix(student.gradeLevel)}</span>
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

              {/* Photo upload */}
              <div className={styles.photoField}>
                <div
                  className={styles.photoPreview}
                  onClick={() => fileInputRef.current?.click()}
                  title="Click to upload photo"
                >
                  {photoPreview
                    ? <img src={photoPreview} alt="Preview" className={styles.photoPreviewImg} />
                    : <span className={styles.photoPlaceholder}>📷</span>
                  }
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className={styles.hiddenFileInput}
                />
                <span className={styles.photoHint}>
                  {photoFile ? photoFile.name : "Click to upload or paste (optional)"}
                </span>
              </div>

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
