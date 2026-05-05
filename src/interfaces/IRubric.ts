export interface IRubricColumn {
    name: string;
    score: number;
}

export interface IBonusColumn {
    name: string;
}

export interface IRubricLine {
    lineId: string;
    categoryName: string;
    possibleScores: { score: number; text: string }[];
}

export interface IStudentRubricGrade{
    studentEmail: string;
    rubricGradesLocation : {
        categoryIndex: number,
        gradingIndex: number,
    }[];
    currentGrade: number;
    bonusSelectedIndices?: number[];
}

export interface IRubric{
    id?: string;
    teacherEmail: string;
    teacherName: string;
    studentRubricGrade: IStudentRubricGrade[];
    rubricLines: IRubricLine[];
    columns: IRubricColumn[];
    bonusColumns?: IBonusColumn[];
    header:{
        title: string;
        gradeLevels: string[];
    }
}
