// src/pages/Admin/index.tsx
import { useState, useEffect, useCallback, ChangeEvent } from "react";
import { collection, addDoc, query, onSnapshot, doc, setDoc } from "firebase/firestore";
import Papa from "papaparse";
import { useFirebase } from "../../context/FirebaseContext";
import type { IStudent } from "../../interfaces/IStudent";
import styles from "./Admin.module.scss";

export function Admin() {
  const { db, userId, isAuthReady } = useFirebase();
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [students, setStudents] = useState<IStudent[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [studentsError, setStudentsError] = useState<string | null>(null);

  // Efeito para carregar a lista de estudantes do Firestore
  useEffect(() => {
    if (!isAuthReady || !db || !userId) {
      return; // Espera o Firebase estar pronto
    }

    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    // Acessa a coleção de estudantes no nível público
    const studentsCollectionRef = collection(db, `artifacts/${appId}/students`);
    const q = query(studentsCollectionRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedStudents: IStudent[] = [];
        snapshot.forEach((doc) => {
          // Mapear doc.id para studentDocId e garantir que os dados são do tipo correto
          fetchedStudents.push({ studentDocId: doc.id, ...doc.data() as Omit<IStudent, 'studentDocId'> });
        });
        setStudents(fetchedStudents);
        setLoadingStudents(false);
      },
      (err) => {
        console.error("Error fetching students:", err);
        setStudentsError("Failed to load students. Please check permissions.");
        setLoadingStudents(false);
      }
    );

    return () => unsubscribe(); // Limpeza do listener
  }, [db, userId, isAuthReady]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setImportMessage(null);
    } else {
      setFile(null);
    }
  };

  const handleImportStudents = async () => {
    if (!file) {
      setImportMessage("Please select a CSV file first.");
      return;
    }
    if (!db || !userId) {
      setImportMessage("Database not ready. Please try again.");
      return;
    }

    setImporting(true);
    setImportMessage("Importing students...");
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const studentsCollectionRef = collection(db, `artifacts/${appId}/students`);

    Papa.parse(file, {
      header: true, // Assume que a primeira linha contém os cabeçalhos
      skipEmptyLines: true,
      complete: async (results) => {
        const studentsToImport: IStudent[] = []; // Alterado para IStudent[] para incluir studentDocId
        let importSuccessCount = 0;
        let importErrorCount = 0;

        for (const row of results.data) {
          const email = String((row as any).email || '').trim(); // O email será o ID do documento
          const name = String((row as any).full_name || 'N/A').trim();
          const studentId = String((row as any).student_id || `temp-${Date.now()}-${Math.random().toString(36).substring(7)}`).trim();
          const gradeLevel = String((row as any).grade_level || 'N/A').trim();

          // Validação básica: email é obrigatório para ser a chave primária
          if (email && name && gradeLevel) {
            studentsToImport.push({
              studentDocId: email, // O email será o ID do documento Firestore
              name: name,
              studentId: studentId,
              email: email,
              gradeLevel: gradeLevel,
            });
          } else {
            console.warn("Skipping row due to missing required data (email, full_name, or grade_level):", row);
            importErrorCount++;
          }
        }

        if (studentsToImport.length === 0) {
          setImportMessage("No valid students found in the CSV to import.");
          setImporting(false);
          return;
        }

        // Adiciona/Atualiza os estudantes no Firestore usando o email como ID do documento
        for (const student of studentsToImport) {
          try {
            // Usa setDoc com o email como ID do documento para upsert
            const studentDocRef = doc(studentsCollectionRef, student.email);
            // Omitimos studentDocId do objeto de dados, pois ele já é o ID do documento
            const { studentDocId, ...dataToSave } = student;
            await setDoc(studentDocRef, dataToSave);
            importSuccessCount++;
          } catch (error) {
            console.error("Error adding/updating student to Firestore:", student, error);
            importErrorCount++;
          }
        }

        setImportMessage(`Import finished. Successfully imported ${importSuccessCount} students. Failed to import ${importErrorCount} students.`);
        setImporting(false);
        setFile(null); // Limpa o arquivo selecionado
        if (document.getElementById('csvFileInput')) {
            (document.getElementById('csvFileInput') as HTMLInputElement).value = ''; // Limpa o input file
        }
      },
      error: (err) => {
        console.error("CSV parsing error:", err);
        setImportMessage(`Error parsing CSV: ${err.message}`);
        setImporting(false);
      }
    });
  };

  return (
    <div className={styles.adminContainer}>
      <h1 className={styles.title}>Admin Panel</h1>

      <section className={styles.importSection}>
        <h2>Import Students from CSV</h2>
        <p className={styles.importHint}>
          Expected CSV columns: <strong>email</strong>, <strong>full_name</strong>, <strong>grade_level</strong> (and optionally <strong>student_id</strong>).
          <br />
          The 'email' column will be used as the unique identifier for each student.
        </p>
        <input
          type="file"
          id="csvFileInput"
          accept=".csv"
          onChange={handleFileChange}
          className={styles.fileInput}
        />
        <button
          onClick={handleImportStudents}
          disabled={importing || !file || !isAuthReady || !db}
          className={styles.importButton}
        >
          {importing ? "Importing..." : "Import Students"}
        </button>
        {importMessage && <p className={styles.importMessage}>{importMessage}</p>}
      </section>

      <section className={styles.studentListSection}>
        <h2>Current Students</h2>
        {loadingStudents ? (
          <p>Loading students...</p>
        ) : studentsError ? (
          <p className={styles.errorMessage}>{studentsError}</p>
        ) : students.length === 0 ? (
          <p>No students found. Import some from CSV!</p>
        ) : (
          <div className={styles.studentTableContainer}> {/* Adicionado container para tabela */}
            <table className={styles.studentTable}>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Full Name</th>
                  <th>Grade Level</th>
                  <th>Student ID</th> {/* Mantido para visualização, se for um campo distinto */}
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.studentDocId}> {/* studentDocId é o email agora */}
                    <td>{student.email}</td>
                    <td>{student.name}</td>
                    <td>{student.gradeLevel}</td>
                    <td>{student.studentId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
