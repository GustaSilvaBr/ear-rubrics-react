// src/pages/RubricFeedback/index.tsx
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { doc, getDoc, collection, query, getDocs } from "firebase/firestore";
import { useFirebase } from "../../context/FirebaseContext";
import type { IRubric } from "../../interfaces/IRubric";
import type { IStudent } from "../../interfaces/IStudent";
import { RubricTable } from "../Rubric/RubricTable";
import styles from "./RubricFeedback.module.scss";

// ─── Cache ────────────────────────────────────────────────────────────────────

const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

interface CacheEntry {
  rubric: IRubric;
  student: IStudent;
  cachedAt: number;
}

function cacheKey(rubricId: string, encodedEmail: string, teacherUid: string): string {
  return `rfcache_${rubricId}_${encodedEmail}_${teacherUid}`;
}

function readCache(key: string): CacheEntry | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as CacheEntry;
  } catch {
    return null;
  }
}

function writeCache(key: string, entry: CacheEntry): void {
  try {
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // localStorage full or unavailable — silently skip
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGradeLevelWithSuffix(gradeLevel: string): string {
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
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RubricFeedback() {
  const [searchParams] = useSearchParams();
  const { db, isAuthReady } = useFirebase();

  const [rubric, setRubric] = useState<IRubric | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<IStudent | null>(null);
  const [maxGrade, setMaxGrade] = useState(0);
  const [gradableLineIds, setGradableLineIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Prevent double-fetch in React Strict Mode
  const hasFetched = useRef(false);

  // Derive maxGrade and gradableLineIds whenever rubric lines change
  useEffect(() => {
    if (!rubric) return;
    const validLines = [...rubric.rubricLines];
    for (let i = validLines.length - 1; i >= 0; i--) {
      const line = validLines[i];
      if (line.categoryName.trim() === '' && line.possibleScores.every(s => s.text.trim() === '')) {
        validLines.pop();
      } else {
        break;
      }
    }
    setMaxGrade(validLines.length * 25);
    setGradableLineIds(validLines.map(l => l.lineId));
  }, [rubric?.rubricLines]);

  // Main data-loading effect: cache-first with 1-hour TTL
  useEffect(() => {
    if (!isAuthReady || !db || hasFetched.current) return;

    const rubricId     = searchParams.get("id");
    const encodedEmail = searchParams.get("student"); // optional
    const teacherUid   = searchParams.get("teacherUid");

    if (!rubricId || !teacherUid) {
      setError("Missing required URL parameters (rubric ID or teacher).");
      setLoading(false);
      return;
    }

    // Rubric-only mode: no student parameter
    const rubricOnly = !encodedEmail;

    let decodedEmail = "";
    if (!rubricOnly) {
      try {
        decodedEmail = atob(encodedEmail!);
      } catch {
        setError("Invalid student link.");
        setLoading(false);
        return;
      }
    }

    const key = rubricOnly
      ? cacheKey(rubricId, "__rubric__", teacherUid)
      : cacheKey(rubricId, encodedEmail!, teacherUid);
    const cached = readCache(key);
    const now = Date.now();

    // Serve from cache if it's still fresh
    if (cached && now - cached.cachedAt < CACHE_TTL) {
      setRubric(cached.rubric);
      if (!rubricOnly) setSelectedStudent(cached.student);
      setLoading(false);
      hasFetched.current = true;
      return;
    }

    // Cache is stale or missing — fetch from Firestore
    hasFetched.current = true;

    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

    const fetchData = async () => {
      try {
        const rubricRef = doc(db, `artifacts/${appId}/users/${teacherUid}/rubrics`, rubricId);
        const rubricSnap = await getDoc(rubricRef);
        if (!rubricSnap.exists()) {
          setError("Rubric not found.");
          setLoading(false);
          return;
        }
        const fetchedRubric = { id: rubricSnap.id, ...rubricSnap.data() } as IRubric;

        if (rubricOnly) {
          const entry: CacheEntry = { rubric: fetchedRubric, student: null as unknown as IStudent, cachedAt: now };
          writeCache(key, entry);
          setRubric(fetchedRubric);
          setLoading(false);
          return;
        }

        // Fetch the matching student
        const studentsRef = collection(db, `artifacts/${appId}/students`);
        const studentsSnap = await getDocs(query(studentsRef));
        let foundStudent: IStudent | null = null;
        studentsSnap.forEach(d => {
          const s = { studentDocId: d.id, ...d.data() as Omit<IStudent, 'studentDocId'> };
          if (s.email === decodedEmail) foundStudent = s;
        });

        if (!foundStudent) {
          setError(`Student with email '${decodedEmail}' not found.`);
          setLoading(false);
          return;
        }

        const entry: CacheEntry = { rubric: fetchedRubric, student: foundStudent, cachedAt: now };
        writeCache(key, entry);

        setRubric(fetchedRubric);
        setSelectedStudent(foundStudent);
        setLoading(false);
      } catch (err) {
        console.error("Error loading rubric feedback:", err);
        setError("Failed to load rubric. Check the link and try again.");
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthReady, db, searchParams]);

  if (loading) return <div className={styles.feedbackContainer}>Loading rubric...</div>;
  if (error)   return <div className={styles.feedbackContainer} style={{ color: 'red' }}>Error: {error}</div>;
  if (!rubric)  return <div className={styles.feedbackContainer}>No rubric data available.</div>;

  const studentGradeInfo = selectedStudent
    ? rubric.studentRubricGrade.find(g => g.studentEmail === selectedStudent.email)
    : undefined;
  const selectedStudentGradesLocation = studentGradeInfo?.rubricGradesLocation ?? [];
  const currentGrade = studentGradeInfo?.currentGrade ?? 0;

  return (
    <div className={styles.feedbackContainer}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>{rubric.header.title}</h1>
          {selectedStudent && (
            <div className={styles.gradingStudentInfo}>
              {selectedStudent.name} - {getGradeLevelWithSuffix(selectedStudent.gradeLevel)}:{" "}
              <span className={styles.gradePill}>
                <strong>{currentGrade === 0 ? '-' : `${currentGrade} / ${maxGrade}`}</strong>
              </span>
            </div>
          )}
        </div>
      </header>
      <hr className={styles.divider} />

      <div className={styles.tableWrapper}>
        <RubricTable
          columns={rubric.columns ?? [
            { name: "Excellent", score: 25 },
            { name: "Good",      score: 20 },
            { name: "Average",   score: 15 },
            { name: "Needs Improvement", score: 10 },
          ]}
          rubricLines={rubric.rubricLines}
          selectedStudentGrades={selectedStudentGradesLocation}
          editionMode={false}
          onAddCategory={() => {}}
          onRemoveCategory={() => {}}
          onGradeSelect={() => {}}
          onRubricLineChange={() => {}}
          onColumnChange={() => {}}
          gradableLineIds={gradableLineIds}
        />
      </div>
    </div>
  );
}
