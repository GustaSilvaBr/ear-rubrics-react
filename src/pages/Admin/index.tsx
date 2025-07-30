// src/pages/Admin/index.tsx
import { useState, useEffect, useCallback, type ChangeEvent } from "react";
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
      return;
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
        console.error("Erro ao buscar estudantes:", err);
        setStudentsError("Falha ao carregar estudantes. Por favor, verifique as permissões.");
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
      header: true, // Assume que a primeira linha contém os cabeçalhos
      skipEmptyLines: true,
      complete: async (results) => {
        const studentsToImport: IStudent[] = [];
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
            console.warn("Pulando linha devido a dados obrigatórios ausentes (email, full_name, ou grade_level):", row);
            importErrorCount++;
          }
        }

        if (studentsToImport.length === 0) {
          setImportMessage("Nenhum estudante válido encontrado no CSV para importar.");
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
            console.error("Erro ao adicionar/atualizar estudante no Firestore:", student, error);
            importErrorCount++;
          }
        }

        setImportMessage(`Importação finalizada. ${importSuccessCount} estudantes importados com sucesso. ${importErrorCount} estudantes falharam na importação.`);
        setImporting(false);
        setFile(null); // Limpa o arquivo selecionado
        if (document.getElementById('csvFileInput')) {
            (document.getElementById('csvFileInput') as HTMLInputElement).value = ''; // Limpa o input file
        }
      },
      error: (err) => {
        console.error("Erro de parseamento CSV:", err);
        setImportMessage(`Erro ao parsear CSV: ${err.message}`);
        setImporting(false);
      }
    });
  };

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
        <h2>Estudantes Atuais</h2>
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
                  <th>Email</th>
                  <th>Nome Completo</th>
                  <th>Nível de Ensino</th>
                  <th>ID do Estudante</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.studentDocId}>
                    <td>{student.email}</td>
                    <td>{student.name}</td>
                    <td>{getGradeLevelWithSuffix(student.gradeLevel)}</td> {/* Aplicando a função aqui */}
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
