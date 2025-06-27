// src/pages/Rubric/StudentList/StudentAutocomplete/index.tsx
import { useState, useMemo } from "react";
import type { IStudent } from "../../../../interfaces/IStudent";
import styles from "./StudentAutocomplete.module.scss";

interface StudentAutocompleteProps {
  allStudents: IStudent[];
  onStudentSelect: (student: IStudent) => void;
}

export function StudentAutocomplete({
  allStudents,
  onStudentSelect,
}: StudentAutocompleteProps) {
  const [inputValue, setInputValue] = useState("");

  const filteredStudents = useMemo(() => {
    if (!inputValue) {
      return [];
    }
    return allStudents.filter((student) =>
      String(student.name).toLowerCase().startsWith(inputValue.toLowerCase())
    );
  }, [inputValue, allStudents]);

  const handleSelect = (student: IStudent) => {
    onStudentSelect(student);
    setInputValue(""); // Clear input after selection
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
      {filteredStudents.length > 0 && (
        <ul className={styles.dropdown}>
          {filteredStudents.map((student) => (
            <li
              key={String(student.studentDocId)}
              onClick={() => handleSelect(student)}
              className={styles.dropdownItem}
            >
              {student.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}