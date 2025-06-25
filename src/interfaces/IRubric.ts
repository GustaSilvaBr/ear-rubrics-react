interface IPossibleScore{
    score: Number,
    text: String
}

export interface IRubricLine {
    categoryName: String,
    possibleScores: IPossibleScore[],//Max of 4 = 25, 20, 15, 10
}

export interface IRubric{
    rubricLines: IRubricLine[],
    author: String,
    rubricDocId: String,
}