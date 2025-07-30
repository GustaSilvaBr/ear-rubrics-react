export interface IRubricLine {
    lineId: string, // DEVE SER 'string' (minúsculo)
    categoryName: string, // DEVE SER 'string' (minúsculo)
    possibleScores: [
        {
            score: 25,
            text: string, // DEVE SER 'string' (minúsculo)
        },
        {
            score: 20,
            text: string, // DEVE SER 'string' (minúsculo)
        },
        {
            score: 15,
            text: string, // DEVE SER 'string' (minúsculo)
        },
        {
            score: 10,
            text: string, // DEVE SER 'string' (minúsculo)
        }
    ]
}

export interface IStudentRubricGrade{
    studentEmail: string, // DEVE SER 'string' (minúsculo)
    rubricGradesLocation : {
        categoryIndex: number,
        gradingIndex: number,
    }[],
    currentGrade: number,
}

export interface IRubric{
    id?: string;
    teacherEmail: string; // DEVE SER 'string' (minúsculo)
    teacherName: string;  // DEVE SER 'string' (minúsculo)
    studentRubricGrade: IStudentRubricGrade[];
    rubricLines: IRubricLine[];
    header:{
        title: string, // DEVE SER 'string' (minúsculo)
        gradeLevels:string[], // DEVE SER 'string[]' (minúsculo)
    }
}
