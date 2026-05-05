// src/pages/Admin/index.tsx
import { useState, useEffect, type ChangeEvent } from "react";
import { collection, query, onSnapshot, doc, setDoc, updateDoc } from "firebase/firestore";
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

  useEffect(() => {
    if (!isAuthReady || !db || !userId) return;

    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const studentsCollectionRef = collection(db, `artifacts/${appId}/students`);

    const unsubscribe = onSnapshot(
      query(studentsCollectionRef),
      (snapshot) => {
        const fetchedStudents: IStudent[] = [];
        snapshot.forEach((d) => {
          fetchedStudents.push({ studentDocId: d.id, ...d.data() as Omit<IStudent, 'studentDocId'> });
        });
        setStudents(fetchedStudents);
        setLoadingStudents(false);
      },
      (err) => {
        console.error("Erro ao buscar estudantes:", err);
        setStudentsError("Falha ao carregar estudantes. Por favor, verifique as permissões.");
        setLoadingStudents(false);
      }
    );

    return () => unsubscribe();
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
      setImportMessage("Por favor, selecione um arquivo CSV primeiro.");
      return;
    }
    if (!db || !userId) {
      setImportMessage("Banco de dados não pronto. Por favor, tente novamente.");
      return;
    }

    setImporting(true);
    setImportMessage("Importando estudantes...");
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const studentsCollectionRef = collection(db, `artifacts/${appId}/students`);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const studentsToImport: IStudent[] = [];
        let importSuccessCount = 0;
        let importErrorCount = 0;

        for (const row of results.data) {
          const email = String((row as any).email || '').trim();
          const name = String((row as any).full_name || 'N/A').trim();
          const studentId = String((row as any).student_id || `temp-${Date.now()}-${Math.random().toString(36).substring(7)}`).trim();
          const gradeLevel = String((row as any).grade_level || 'N/A').trim();

          if (email && name && gradeLevel) {
            studentsToImport.push({ studentDocId: email, name, studentId, email, gradeLevel });
          } else {
            console.warn("Pulando linha devido a dados obrigatórios ausentes:", row);
            importErrorCount++;
          }
        }

        if (studentsToImport.length === 0) {
          setImportMessage("Nenhum estudante válido encontrado no CSV para importar.");
          setImporting(false);
          return;
        }

        for (const student of studentsToImport) {
          try {
            const studentDocRef = doc(studentsCollectionRef, student.email);
            const { studentDocId, ...dataToSave } = student;
            await setDoc(studentDocRef, dataToSave);
            importSuccessCount++;
          } catch (error) {
            console.error("Erro ao adicionar/atualizar estudante:", student, error);
            importErrorCount++;
          }
        }

        setImportMessage(`Importação finalizada. ${importSuccessCount} importados com sucesso. ${importErrorCount} falharam.`);
        setImporting(false);
        setFile(null);
        const csvInput = document.getElementById('csvFileInput') as HTMLInputElement | null;
        if (csvInput) csvInput.value = '';
      },
      error: (err) => {
        console.error("Erro de parseamento CSV:", err);
        setImportMessage(`Erro ao parsear CSV: ${err.message}`);
        setImporting(false);
      }
    });
  };

  const handleDisableStudent = async (studentEmail: string) => {
    if (!db) return;
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const studentDocRef = doc(db, `artifacts/${appId}/students`, studentEmail);
    await updateDoc(studentDocRef, { disabled: true });
  };

  const handlePromoteAll = async () => {
    if (!db) return;
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const activeStudents = students.filter(s => !s.disabled);
    await Promise.all(
      activeStudents.map(s => {
        const num = parseInt(s.gradeLevel);
        const studentDocRef = doc(db, `artifacts/${appId}/students`, s.email);
        if (num >= 12) {
          return updateDoc(studentDocRef, { disabled: true });
        }
        return updateDoc(studentDocRef, { gradeLevel: `${num + 1}th` });
      })
    );
  };

  const getGradeLevelWithSuffix = (gradeLevel: string): string => {
    const num = parseInt(gradeLevel);
    if (isNaN(num)) return gradeLevel;
    const lastDigit = num % 10;
    const lastTwoDigits = num % 100;
    if (lastTwoDigits >= 11 && lastTwoDigits <= 13) return `${num}th`;
    switch (lastDigit) {
      case 1: return `${num}st`;
      case 2: return `${num}nd`;
      case 3: return `${num}rd`;
      default: return `${num}th`;
    }
  };

  return (
    <div className={styles.adminContainer}>
      <h1 className={styles.title}>Painel de Administração</h1>

      <section className={styles.importSection}>
        <h2>Importar Estudantes de CSV</h2>
        <p className={styles.importHint}>
          Colunas CSV esperadas: <strong>email</strong>, <strong>full_name</strong>, <strong>grade_level</strong> (e opcionalmente <strong>student_id</strong>).
          <br />
          A coluna 'email' será usada como identificador único para cada estudante.
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
          {importing ? "Importando..." : "Importar Estudantes"}
        </button>
        {importMessage && <p className={styles.importMessage}>{importMessage}</p>}
      </section>

      <section className={styles.studentListSection}>
        <div className={styles.sectionHeader}>
          <h2>Estudantes Atuais</h2>
          <button
            onClick={handlePromoteAll}
            disabled={!db || students.filter(s => !s.disabled).length === 0}
            className={styles.promoteButton}
          >
            Promover Todos
          </button>
        </div>
        {loadingStudents ? (
          <p>Carregando estudantes...</p>
        ) : studentsError ? (
          <p className={styles.errorMessage}>{studentsError}</p>
        ) : students.length === 0 ? (
          <p>Nenhum estudante encontrado. Importe alguns de um CSV!</p>
        ) : (
          <div className={styles.studentTableContainer}>
            <table className={styles.studentTable}>
              <thead>
                <tr>
                  <th>Nome Completo</th>
                  <th>Email</th>
                  <th>Nível de Ensino</th>
                  <th>ID do Estudante</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.studentDocId} className={student.disabled ? styles.disabledRow : ''}>
                    <td>{student.name}</td>
                    <td>{student.email}</td>
                    <td>{getGradeLevelWithSuffix(student.gradeLevel)}</td>
                    <td>{student.studentId}</td>
                    <td>
                      {student.disabled
                        ? <span className={styles.disabledBadge}>Desativado</span>
                        : <span className={styles.activeBadge}>Ativo</span>
                      }
                    </td>
                    <td>
                      {!student.disabled && (
                        <button
                          onClick={() => handleDisableStudent(student.email)}
                          className={styles.disableButton}
                        >
                          Desativar
                        </button>
                      )}
                    </td>
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
