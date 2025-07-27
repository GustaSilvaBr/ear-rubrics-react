// src/pages/Home/index.tsx
import { Link } from "react-router-dom"; // Importe Link
import { mockRubrics } from "../../data/mockRubrics"; // Importe os dados fictícios
import styles from "./Home.module.scss"; // Importe os estilos

export function Home() {
  return (
    <div className={styles.homeContainer}>
      <h1 className={styles.title}>My Rubrics</h1>
      <div className={styles.rubricGrid}>
        {/* Card para Adicionar Nova Rúbrica */}
        <Link to="/rubric" className={styles.addRubricCard}>
          <span className={styles.plusIcon}>+</span>
        </Link>

        {/* Cards de Rúbricas Existentes */}
        {mockRubrics.map((rubric) => (
          <Link
            key={rubric.id}
            to={`/rubric?id=${rubric.id}`} // Exemplo: passar ID via query param
            className={styles.rubricCard}
          >
            <h2 className={styles.rubricName}>{rubric.title}</h2>
            <p className={styles.studentCount}>
              {rubric.numberOfAssignedStudents} Students
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}