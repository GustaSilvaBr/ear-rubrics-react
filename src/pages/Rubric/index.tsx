// src/pages/Rubric/index.tsx
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import type { IRubric } from "../../interfaces/IRubric";

export function Rubric() {
  const [searchParams] = useSearchParams();
  const [rubric, setRubric] = useState<IRubric | null>(null);

  useEffect(() => {
    const rubricId = searchParams.get("id");
    if (rubricId) {
      // Option 2: Load existing rubric
      // For now, we'll use mock data.
      // In a real application, you would fetch this from Firestore.
      console.log(`Loading rubric with id: ${rubricId}`);
      const existingRubric: IRubric = {
        teacherDocId: "teacher-123",
        studentRubricGrade: [],
        header: {
          title: "Existing Rubric Title",
          gradeLevel: "10th Grade",
        },
        rubricLines: [
          {
            categoryName: "Category 1",
            possibleScores: [
              { score: 25, text: "Excellent" },
              { score: 20, text: "Good" },
              { score: 15, text: "Average" },
              { score: 10, text: "Needs Improvement" },
            ],
          },
        ],
      };
      setRubric(existingRubric);
    } else {
      // Option 1: Create a new rubric from scratch
      // Initialize with a default structure for a new rubric
      const newRubric: IRubric = {
        teacherDocId: "", // This would be set for the logged-in teacher
        studentRubricGrade: [],
        header: {
          title: "New Rubric Title",
          gradeLevel: "Select Grade Level",
        },
        rubricLines: [],
      };
      setRubric(newRubric);
    }
  }, [searchParams]);

  if (!rubric) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <header>
        <h1>{rubric.header.title}</h1>
        {/* In a real app, you'd fetch the teacher's name based on teacherDocId */}
        <p>Teacher: [Teacher Name]</p>
        <p>Grade Level: {rubric.header.gradeLevel}</p>
      </header>
      <hr />
      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th>Excellent (25)</th>
            <th>Good (20)</th>
            <th>Average (15)</th>
            <th>Needs Improvement (10)</th>
          </tr>
        </thead>
        <tbody>
          {rubric.rubricLines.map((line, index) => (
            <tr key={index}>
              <td>{line.categoryName}</td>
              {line.possibleScores.map((score, scoreIndex) => (
                <td key={scoreIndex}>{String(score.text)}</td>
              ))}
            </tr>
          ))}
          <tr>
            <td colSpan={5}>
              <button style={{ width: "100%", padding: "5px" }}>+</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}