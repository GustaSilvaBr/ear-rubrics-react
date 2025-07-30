export interface IStudent {
    name: string,
    studentId: string,
    studentDocId?: string, // Continua opcional, mas o email será o ID do documento no Firestore
    email: string, // Garante que é string e será o identificador principal
    gradeLevel: string,
}
