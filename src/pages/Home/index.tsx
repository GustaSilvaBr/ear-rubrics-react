// src/pages/Home/index.tsx
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef, type ChangeEvent } from "react";
import { collection, query, onSnapshot, addDoc } from "firebase/firestore";
import Papa from "papaparse";
import { useFirebase } from "../../context/FirebaseContext";
import type { IRubric, IRubricColumn, IRubricLine } from "../../interfaces/IRubric";
import styles from "./Home.module.scss";

interface IRubricListing {
  id: string;
  title: string;
  numberOfAssignedStudents: number;
  gradeLevels: string[];
}

const DEFAULT_COLUMNS: IRubricColumn[] = [
  { name: "Excellent",         score: 25 },
  { name: "Good",              score: 20 },
  { name: "Average",           score: 15 },
  { name: "Needs Improvement", score: 10 },
];

export function Home() {
  const navigate = useNavigate();
  const { db, userId, teacherEmail, teacherName, isAuthReady } = useFirebase();
  const [rubrics, setRubrics] = useState<IRubricListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [csvStep, setCsvStep] = useState<"options" | "upload">("options");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAuthReady || !db || !userId) return;

    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const rubricsCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/rubrics`);
    const q = query(rubricsCollectionRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedRubrics: IRubricListing[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data() as IRubric;
          fetchedRubrics.push({
            id: doc.id,
            title: data.header.title,
            numberOfAssignedStudents: data.studentRubricGrade ? data.studentRubricGrade.length : 0,
            gradeLevels: data.header.gradeLevels || [],
          });
        });
        setRubrics(fetchedRubrics);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching rubrics:", err);
        setError("Failed to load rubrics. Please try again.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [db, userId, isAuthReady]);

  const generateLineId = () => `${Date.now()}-${Math.floor(Math.random() * 1000) + 1}`;

  const saveRubric = async (rubricData: Omit<IRubric, 'id'>) => {
    if (!db || !userId || !teacherEmail || !teacherName) {
      alert("User information not available. Please try logging in again.");
      return;
    }
    setLoading(true);
    setError(null);
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    try {
      const rubricsCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/rubrics`);
      const docRef = await addDoc(rubricsCollectionRef, rubricData);
      navigate(`/rubric?id=${docRef.id}&isNew=true`);
    } catch (e) {
      console.error("Error creating rubric:", e);
      setError("Failed to create rubric. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBlank = () => {
    saveRubric({
      teacherEmail: teacherEmail!,
      teacherName: teacherName!,
      studentRubricGrade: [],
      rubricLines: [
        { lineId: generateLineId(), categoryName: "", possibleScores: [
          { score: 25, text: "" }, { score: 20, text: "" },
          { score: 15, text: "" }, { score: 10, text: "" },
        ]},
      ],
      columns: DEFAULT_COLUMNS,
      bonusColumns: [{ name: "Participation" }, { name: "Effort" }, { name: "Creativity" }],
      header: { title: "Untitled Rubric", gradeLevels: [] },
    });
    setShowCreateModal(false);
  };

  const handleCreateTemplate = () => {
    saveRubric({
      teacherEmail: teacherEmail!,
      teacherName: teacherName!,
      studentRubricGrade: [],
      rubricLines: [
        { lineId: generateLineId(), categoryName: "Respect for other Team", possibleScores: [
          { score: 25, text: "All statements, body language, and responses were respectful and were in appropriate language." },
          { score: 20, text: "Statements and responses were respectful and used appropriate language, but once or twice body language was not." },
          { score: 15, text: "Most statements and responses were respectful and in appropriate language, but there was one sarcastic remark." },
          { score: 10, text: "Statements, responses and/or body language were consistently not respectful." },
        ]},
        { lineId: generateLineId(), categoryName: "Information", possibleScores: [
          { score: 25, text: "All information presented in the debate was clear, accurate and thorough." },
          { score: 20, text: "Most information presented in the debate was clear, accurate and thorough." },
          { score: 15, text: "Most information presented in the debate was clear and accurate, but was not usually thorough." },
          { score: 10, text: "Information had several inaccuracies OR was usually not clear." },
        ]},
        { lineId: generateLineId(), categoryName: "Rebuttal", possibleScores: [
          { score: 25, text: "All counter-arguments were accurate, relevant and strong." },
          { score: 20, text: "Most counter-arguments were accurate, relevant, and strong." },
          { score: 15, text: "Most counter-arguments were accurate and relevant, but several were weak." },
          { score: 10, text: "Counter-arguments were not accurate and/or relevant." },
        ]},
        { lineId: generateLineId(), categoryName: "", possibleScores: [
          { score: 25, text: "" }, { score: 20, text: "" },
          { score: 15, text: "" }, { score: 10, text: "" },
        ]},
      ],
      columns: DEFAULT_COLUMNS,
      bonusColumns: [{ name: "Participation" }, { name: "Effort" }, { name: "Creativity" }],
      header: { title: "Untitled Rubric", gradeLevels: [] },
    });
    setShowCreateModal(false);
  };

  const handleCsvFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCsvError(null);
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0]);
    } else {
      setCsvFile(null);
    }
  };

  const handleCreateFromCsv = () => {
    if (!csvFile) {
      setCsvError("Please select a CSV file first.");
      return;
    }

    Papa.parse(csvFile, {
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as string[][];

        if (rows.length < 2) {
          setCsvError("The CSV must have a header row and at least one data row.");
          return;
        }

        const headerRow = rows[0];
        if (headerRow.length !== 5) {
          setCsvError(`The CSV must have exactly 5 columns (category + 4 grade levels). Found ${headerRow.length}.`);
          return;
        }

        const columnNames = headerRow.slice(1).map((h) => h.trim());
        const defaultScores = [25, 20, 15, 10];
        const columns: IRubricColumn[] = columnNames.map((name, i) => ({
          name: name || `Column ${i + 1}`,
          score: defaultScores[i],
        }));

        const rubricLines: IRubricLine[] = rows.slice(1).map((row) => ({
          lineId: generateLineId(),
          categoryName: row[0]?.trim() ?? "",
          possibleScores: defaultScores.map((score, i) => ({
            score,
            text: row[i + 1]?.trim() ?? "",
          })),
        }));

        setShowCreateModal(false);
        setCsvFile(null);
        setCsvStep("options");

        saveRubric({
          teacherEmail: teacherEmail!,
          teacherName: teacherName!,
          studentRubricGrade: [],
          rubricLines,
          columns,
          bonusColumns: [{ name: "Participation" }, { name: "Effort" }, { name: "Creativity" }],
          header: { title: "Untitled Rubric", gradeLevels: [] },
        });
      },
      error: (err) => {
        setCsvError(`Failed to parse CSV: ${err.message}`);
      },
    });
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setCsvFile(null);
    setCsvError(null);
    setCsvStep("options");
  };

  if (loading) {
    return <div className={styles.homeContainer}>Loading rubrics...</div>;
  }

  if (error) {
    return <div className={styles.homeContainer} style={{ color: 'red' }}>{error}</div>;
  }

  return (
    <div className={styles.homeContainer}>
      <h1 className={styles.title}>My Rubrics</h1>
      <div className={styles.rubricGrid}>
        <div className={styles.addRubricCard} onClick={() => setShowCreateModal(true)}>
          <span className={styles.plusIcon}>+</span>
        </div>

        {rubrics.map((rubric) => (
          <Link
            key={rubric.id}
            to={`/rubric?id=${rubric.id}`}
            className={styles.rubricCard}
          >
            <h2 className={styles.rubricName}>
              {rubric.title}
              {rubric.gradeLevels && rubric.gradeLevels.length > 0 && (
                <span className={styles.rubricGradeLevels}> - {rubric.gradeLevels.join(', ')}</span>
              )}
            </h2>
            <p className={styles.studentCount}>
              {rubric.numberOfAssignedStudents} Students
            </p>
          </Link>
        ))}
      </div>

      {showCreateModal && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Create New Rubric</h2>

            {csvStep === "options" && (
              <div className={styles.createOptions}>
                <button className={styles.optionCard} onClick={handleCreateBlank}>
                  <span className={styles.optionIcon}>📄</span>
                  <span className={styles.optionLabel}>Blank Rubric</span>
                  <span className={styles.optionDescription}>Start with an empty rubric</span>
                </button>

                <button className={styles.optionCard} onClick={handleCreateTemplate}>
                  <span className={styles.optionIcon}>📋</span>
                  <span className={styles.optionLabel}>Template</span>
                  <span className={styles.optionDescription}>Use a pre-filled debate rubric</span>
                </button>

                <button className={styles.optionCard} onClick={() => setCsvStep("upload")}>
                  <span className={styles.optionIcon}>📥</span>
                  <span className={styles.optionLabel}>Import CSV</span>
                  <span className={styles.optionDescription}>Create from a CSV file</span>
                </button>
              </div>
            )}

            {csvStep === "upload" && (
              <div className={styles.csvUpload}>
                <p className={styles.csvInstructions}>
                  The CSV must have exactly <strong>5 columns</strong>: the first for the category name,
                  and the remaining four for each grade level. Headers can be anything.
                </p>
                <label className={styles.fileLabel}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleCsvFileChange}
                    className={styles.fileInput}
                  />
                  <span className={styles.fileButton}>Choose CSV File</span>
                  <span className={styles.fileName}>{csvFile ? csvFile.name : "No file chosen"}</span>
                </label>
                {csvError && <p className={styles.csvError}>{csvError}</p>}
                <div className={styles.csvActions}>
                  <button className={styles.backButton} onClick={() => { setCsvStep("options"); setCsvFile(null); setCsvError(null); }}>
                    Back
                  </button>
                  <button className={styles.importButton} onClick={handleCreateFromCsv} disabled={!csvFile}>
                    Create Rubric
                  </button>
                </div>
              </div>
            )}

            <button className={styles.modalClose} onClick={handleCloseModal}>✕</button>
          </div>
        </div>
      )}
    </div>
  );
}
