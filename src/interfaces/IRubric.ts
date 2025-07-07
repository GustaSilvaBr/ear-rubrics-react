export interface IRubricLine {
    lineId: String,
    categoryName: String,
    possibleScores: [
        {
            score: 25,
            text: String,
        },
        {
            score: 20,
            text: String,
        },
        {
            score: 15,
            text: String,
        },
        {
            score: 10,
            text: String,
        }
    ]
}

export interface IStudentRubricGrade{
    studentDocId: String, //Ref,
    rubricGradesLocation : {
        categoryIndex: number,
        gradingIndex: number,
    }[],
    currentGrade: number,
}

export interface IRubric{
    teacherDocId: String,
    studentRubricGrade: IStudentRubricGrade[],
    rubricLines: IRubricLine[],
    header:{
        title: String,
        gradeLevels:String[],
    }
}