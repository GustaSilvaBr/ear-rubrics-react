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

  const filteredStudents = useMemo(() => {
    if (!inputValue) {
      return [];
    }
    const lowerCaseInput = inputValue.toLowerCase();
    return allStudents.filter((student) =>
      student.name.toLowerCase().includes(lowerCaseInput) || // Usar includes para pesquisa mais flexível
      student.email.toLowerCase().includes(lowerCaseInput) ||
      student.gradeLevel.toLowerCase().includes(lowerCaseInput) // Incluir gradeLevel na pesquisa
    );
  }, [inputValue, allStudents]);

  const handleSelect = (student: IStudent) => {
    onStudentSelect(student);
    setInputValue(""); // Limpar input após seleção
  };

  return (
    <div className={styles.autocompleteWrapper}>
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        className={styles.input}
        placeholder="Pesquisar estudante por nome, e-mail ou nível..." // Atualizar placeholder
      />
      {filteredStudents.length > 0 && (
        <ul className={styles.dropdown}>
          {filteredStudents.map((student) => (
            <li
              key={student.email}
              onClick={() => handleSelect(student)}
              className={styles.dropdownItem}
            >
              {/* Exibe o nome do estudante e o nível de ensino com sufixo */}
              {student.name} - {getGradeLevelWithSuffix(student.gradeLevel)} ({student.email})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
