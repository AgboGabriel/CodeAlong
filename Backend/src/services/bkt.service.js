class BKTService {
  calculatePosterior(priorKnown, isCorrect, pGuess, pSlip) {
    const priorUnknown = 1 - priorKnown;

    const pObservation = isCorrect
      ? priorKnown * (1 - pSlip) + priorUnknown * pGuess
      : priorKnown * pSlip + priorUnknown * (1 - pGuess);

    if (pObservation === 0) {
      return priorKnown;
    }

    const posteriorKnown = isCorrect
      ? (priorKnown * (1 - pSlip)) / pObservation
      : (priorKnown * pSlip) / pObservation;

    return posteriorKnown;
  }
  updateMasteryProbability(priorKnown, isCorrect, pGuess, pSlip, pLearn) {
    const posterior = this.calculatePosterior(priorKnown, isCorrect, pGuess, pSlip);
    return posterior + (1 - posterior) * pLearn;
  }

  computeScore(correctCount, totalCount) {
    if (!totalCount || totalCount <= 0) return 0;
    return correctCount / totalCount;
  }
  isMastered(masteryProbability, threshold = 0.8) {
    return masteryProbability >= threshold;
  }
}

export default new BKTService();