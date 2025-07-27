// src/data/mockRubrics.ts
export interface IMockRubric {
  id: string;
  title: string;
  numberOfAssignedStudents: number;
}

export const mockRubrics: IMockRubric[] = [
  {
    id: "rubric-1",
    title: "Oral Project - Class debate",
    numberOfAssignedStudents: 15,
  },
  {
    id: "rubric-2",
    title: "Science Fair Presentation",
    numberOfAssignedStudents: 22,
  },
  {
    id: "rubric-3",
    title: "Essay Writing - Argumentative",
    numberOfAssignedStudents: 18,
  },
  {
    id: "rubric-4",
    title: "Group Project - Historical Event",
    numberOfAssignedStudents: 10,
  },
  {
    id: "rubric-5",
    title: "Math Problem Solving",
    numberOfAssignedStudents: 25,
  },
];