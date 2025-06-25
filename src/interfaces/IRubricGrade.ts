//TeacherDocId
//RubricDocId
//List of StudentGrade (+ grade Location)
interface IRubricGradeLocation{
    categoryIndex: number,
    gradingIndex: number,
}

interface IStudentRubricGrade{
    studentDocId: String, //Ref,
    rubricGradesLocation : IRubricGradeLocation[]
}

export interface IRubricGrade{
    rubricDocId: String,//Ref
    teacherDocId: String,//Ref
    studentRubricGrade: IStudentRubricGrade[]
    header:{
        title: String,
        gradeLevel:string,
    }
}