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

interface IStudentRubricGrade{
    studentDocId: String, //Ref,
    rubricGradesLocation : {
        categoryIndex: number,
        gradingIndex: number,
    }[]
}

export interface IRubric{
    teacherDocId: String,//Ref
    studentRubricGrade: IStudentRubricGrade[]
    rubricLines: IRubricLine[],
    header:{
        title: String,
        gradeLevel:string,
    }
}