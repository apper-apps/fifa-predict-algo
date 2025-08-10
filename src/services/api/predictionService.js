import { scoresService } from "./scoresService";
import React from "react";
import Error from "@/components/ui/Error";
import predictionsData from "@/services/mockData/predictions.json";

class PredictionService {
  constructor() {
    this.predictions = [...predictionsData];
  }

  async getAll() {
    await new Promise(resolve => setTimeout(resolve, 300));
    return [...this.predictions];
  }

  async getById(id) {
    await new Promise(resolve => setTimeout(resolve, 200));
    const prediction = this.predictions.find(p => p.Id === parseInt(id));
    if (!prediction) {
      throw new Error(`Prédiction avec l'ID ${id} non trouvée`);
    }
    return { ...prediction };
  }

  async create(predictionData) {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const highestId = this.predictions.reduce((max, p) => Math.max(max, p.Id), 0);
    const newPrediction = {
      Id: highestId + 1,
      ...predictionData,
      timestamp: predictionData.timestamp || new Date().toISOString()
    };
    
    this.predictions.push(newPrediction);
    return { ...newPrediction };
  }

  async update(id, updateData) {
    await new Promise(resolve => setTimeout(resolve, 350));
    
    const index = this.predictions.findIndex(p => p.Id === parseInt(id));
    if (index === -1) {
      throw new Error(`Prédiction avec l'ID ${id} non trouvée`);
    }
    
    this.predictions[index] = {
      ...this.predictions[index],
      ...updateData,
      Id: parseInt(id)
    };
    
    return { ...this.predictions[index] };
  }

  async delete(id) {
    await new Promise(resolve => setTimeout(resolve, 250));
    
    const index = this.predictions.findIndex(p => p.Id === parseInt(id));
    if (index === -1) {
      throw new Error(`Prédiction avec l'ID ${id} non trouvée`);
    }
    
    const deletedPrediction = this.predictions.splice(index, 1)[0];
    return { ...deletedPrediction };
  }

  async getByTeams(homeTeam, awayTeam) {
    await new Promise(resolve => setTimeout(resolve, 300));
    return this.predictions.filter(p => 
      p.homeTeam.toLowerCase().includes(homeTeam.toLowerCase()) ||
      p.awayTeam.toLowerCase().includes(awayTeam.toLowerCase())
    ).map(p => ({ ...p }));
  }

  async getByDateRange(startDate, endDate) {
    await new Promise(resolve => setTimeout(resolve, 350));
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return this.predictions.filter(p => {
      const matchDate = new Date(p.matchDateTime);
      return matchDate >= start && matchDate <= end;
    }).map(p => ({ ...p }));
  }

  async updateResult(id, actualScore) {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const index = this.predictions.findIndex(p => p.Id === parseInt(id));
    if (index === -1) {
      throw new Error(`Prédiction avec l'ID ${id} non trouvée`);
    }
    
    const prediction = this.predictions[index];
    const isCorrect = prediction.predictedScore === actualScore;
    
    this.predictions[index] = {
      ...prediction,
      actualResult: {
        actualScore,
        correct: isCorrect
      }
    };
    
    return { ...this.predictions[index] };
  }

  async getAccuracyStats() {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const completedPredictions = this.predictions.filter(p => p.actualResult);
    const totalPredictions = completedPredictions.length;
    const correctPredictions = completedPredictions.filter(p => p.actualResult.correct).length;
    
    return {
      totalPredictions: this.predictions.length,
      completedPredictions: totalPredictions,
      correctPredictions,
      accuracyRate: totalPredictions > 0 ? Math.round((correctPredictions / totalPredictions) * 100) : 0,
      pendingPredictions: this.predictions.length - totalPredictions
    };
}

  // Enhanced AI validation for predictions
  async validatePredictionAccuracy(prediction) {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const { scoreOdds, predictedScore, confidence } = prediction;
    
    // Multi-algorithm validation
    const validationMetrics = {
      scoreOddsQuality: this.assessScoreOddsQuality(scoreOdds),
      predictionRealism: this.assessPredictionRealism(predictedScore, scoreOdds),
      confidenceAccuracy: this.assessConfidenceAccuracy(confidence, scoreOdds),
      marketConsistency: this.assessMarketConsistency(scoreOdds)
    };
    
    const overallValidation = Object.values(validationMetrics)
      .reduce((sum, score) => sum + score, 0) / 4;
    
    return {
      isValid: overallValidation >= 70,
      validationScore: Math.round(overallValidation),
      metrics: validationMetrics,
      recommendation: this.getValidationRecommendation(overallValidation)
    };
  }

  assessScoreOddsQuality(scoreOdds) {
    if (!scoreOdds || scoreOdds.length === 0) return 0;
    
    const validOdds = scoreOdds.filter(item => 
      item.score && item.coefficient && !isNaN(item.coefficient)
    );
    
    let score = 0;
    
    // Quantity bonus
    if (validOdds.length >= 20) score += 40;
    else if (validOdds.length >= 15) score += 30;
    else if (validOdds.length >= 10) score += 20;
    else if (validOdds.length >= 5) score += 10;
    
    // Quality bonus - coefficient range diversity
    const coefficients = validOdds.map(o => parseFloat(o.coefficient));
    const minCoeff = Math.min(...coefficients);
    const maxCoeff = Math.max(...coefficients);
    const range = maxCoeff - minCoeff;
    
    if (range >= 15) score += 30; // Good range
    else if (range >= 10) score += 20;
    else if (range >= 5) score += 10;
    
    // Probability consistency
    const probabilities = validOdds.map(o => parseFloat(o.probability || 0));
    const totalProb = probabilities.reduce((sum, p) => sum + p, 0);
    
    if (totalProb >= 80 && totalProb <= 120) score += 30; // Realistic total
    
    return Math.min(100, score);
  }

  assessPredictionRealism(predictedScore, scoreOdds) {
    if (!predictedScore || !scoreOdds) return 50;
    
    const matchingOdd = scoreOdds.find(odd => odd.score === predictedScore);
    if (!matchingOdd) return 30; // Prediction not in provided odds
    
    const coefficient = parseFloat(matchingOdd.coefficient);
    const probability = parseFloat(matchingOdd.probability || 0);
    
    let score = 50; // Base score
    
    // Realistic coefficient range
    if (coefficient >= 1.5 && coefficient <= 15) score += 30;
    else if (coefficient <= 25) score += 15;
    
    // Good probability
    if (probability >= 15) score += 20;
    else if (probability >= 10) score += 15;
    else if (probability >= 5) score += 10;
    
    return Math.min(100, score);
  }

  assessConfidenceAccuracy(confidence, scoreOdds) {
    if (!confidence || !scoreOdds) return 50;
    
    const validOdds = scoreOdds.filter(item => 
      item.score && item.coefficient && !isNaN(item.coefficient)
    );
    
    let expectedConfidence = 50; // Base
    
    // More data should increase confidence
    if (validOdds.length >= 20) expectedConfidence += 25;
    else if (validOdds.length >= 15) expectedConfidence += 20;
    else if (validOdds.length >= 10) expectedConfidence += 15;
    
    // Lower coefficients should increase confidence
    const avgCoeff = validOdds.reduce((sum, o) => sum + parseFloat(o.coefficient), 0) / validOdds.length;
    if (avgCoeff <= 5) expectedConfidence += 15;
    else if (avgCoeff <= 8) expectedConfidence += 10;
    
    // Compare actual vs expected
    const difference = Math.abs(confidence - expectedConfidence);
    
    if (difference <= 10) return 100;
    if (difference <= 20) return 80;
    if (difference <= 30) return 60;
    return 40;
  }

  assessMarketConsistency(scoreOdds) {
    if (!scoreOdds || scoreOdds.length < 3) return 50;
    
    const validOdds = scoreOdds.filter(item => 
      item.score && item.coefficient && !isNaN(item.coefficient) && item.probability
    );
    
    if (validOdds.length < 3) return 40;
    
    let consistencyScore = 0;
    let checks = 0;
    
    validOdds.forEach(odd => {
      const coefficient = parseFloat(odd.coefficient);
      const probability = parseFloat(odd.probability);
      const impliedProb = (1 / coefficient) * 100;
      
      // Check if probability is reasonably close to implied probability
      const difference = Math.abs(probability - impliedProb);
      const tolerance = 15; // 15% tolerance
      
      if (difference <= tolerance) {
        consistencyScore += 100;
      } else if (difference <= tolerance * 2) {
        consistencyScore += 60;
      } else {
        consistencyScore += 20;
      }
      checks++;
    });
    
    return checks > 0 ? consistencyScore / checks : 50;
  }

  getValidationRecommendation(score) {
    if (score >= 90) return "Excellente prédiction - Très haute fiabilité";
    if (score >= 80) return "Bonne prédiction - Fiabilité élevée";  
    if (score >= 70) return "Prédiction correcte - Fiabilité modérée";
    if (score >= 60) return "Prédiction acceptable - Fiabilité limitée";
    return "Prédiction à risque - Données insuffisantes";
  }

  // Enhanced accuracy tracking with AI metrics
  async getEnhancedAccuracyStats() {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const completedPredictions = this.predictions.filter(p => p.actualResult);
    const totalPredictions = completedPredictions.length;
    const correctPredictions = completedPredictions.filter(p => p.actualResult.correct).length;
    
    // Advanced metrics
    const highConfidencePredictions = completedPredictions.filter(p => p.confidence >= 80);
    const highConfidenceCorrect = highConfidencePredictions.filter(p => p.actualResult.correct).length;
    
    const lowRiskPredictions = completedPredictions.filter(p => p.riskLevel && 
      ['Très Faible', 'Faible'].includes(p.riskLevel));
    const lowRiskCorrect = lowRiskPredictions.filter(p => p.actualResult.correct).length;
    
    // Algorithm performance
    const algorithmPerformance = {};
    completedPredictions.forEach(p => {
      const algo = p.algorithmUsed || 'Standard';
      if (!algorithmPerformance[algo]) {
        algorithmPerformance[algo] = { total: 0, correct: 0 };
      }
      algorithmPerformance[algo].total++;
      if (p.actualResult.correct) algorithmPerformance[algo].correct++;
    });
    
    return {
      totalPredictions: this.predictions.length,
      completedPredictions: totalPredictions,
      correctPredictions,
      accuracyRate: totalPredictions > 0 ? Math.round((correctPredictions / totalPredictions) * 100) : 0,
      pendingPredictions: this.predictions.length - totalPredictions,
      
      // Enhanced metrics
      highConfidenceAccuracy: highConfidencePredictions.length > 0 ? 
        Math.round((highConfidenceCorrect / highConfidencePredictions.length) * 100) : 0,
      lowRiskAccuracy: lowRiskPredictions.length > 0 ?
        Math.round((lowRiskCorrect / lowRiskPredictions.length) * 100) : 0,
      
      // Algorithm breakdown
      algorithmPerformance: Object.entries(algorithmPerformance).map(([name, stats]) => ({
        name,
        total: stats.total,
        correct: stats.correct,
        accuracy: Math.round((stats.correct / stats.total) * 100)
      })),
      
      // Success rates by confidence levels
      confidenceBrackets: {
        '90+%': this.getAccuracyByConfidenceRange(completedPredictions, 90, 100),
        '80-89%': this.getAccuracyByConfidenceRange(completedPredictions, 80, 89),
        '70-79%': this.getAccuracyByConfidenceRange(completedPredictions, 70, 79),
        '60-69%': this.getAccuracyByConfidenceRange(completedPredictions, 60, 69),
        '<60%': this.getAccuracyByConfidenceRange(completedPredictions, 0, 59)
      }
    };
  }

  getAccuracyByConfidenceRange(predictions, minConf, maxConf) {
    const inRange = predictions.filter(p => p.confidence >= minConf && p.confidence <= maxConf);
    const correct = inRange.filter(p => p.actualResult.correct).length;
    return {
      total: inRange.length,
      correct,
      accuracy: inRange.length > 0 ? Math.round((correct / inRange.length) * 100) : 0
    };
  }

  async checkScoresWith1XBET(predictionId) {
    const prediction = this.predictions.find(p => p.Id === parseInt(predictionId));
    if (!prediction) {
      throw new Error(`Prédiction avec l'ID ${predictionId} non trouvée`);
    }

    try {
      const scoreResult = await scoresService.verifyPredictionResult(prediction);
      
      if (scoreResult.actualScore) {
        // Match terminé - mettre à jour le résultat avec validation IA
        await this.updateResult(predictionId, scoreResult.actualScore);
        
        // Validate AI prediction accuracy
        const validation = await this.validatePredictionAccuracy(prediction);
        
        return {
          status: 'terminé',
          actualScore: scoreResult.actualScore,
          correct: scoreResult.correct,
          aiValidation: validation,
          message: scoreResult.correct ? 
            `🎯 Prédiction IA correcte ! Score: ${validation.validationScore}/100` : 
            `❌ Prédiction incorrecte. Score réel: ${scoreResult.actualScore} | Validation IA: ${validation.validationScore}/100`
        };
      } else if (scoreResult.currentScore) {
        // Match en cours
        return {
          status: 'en_cours',
          currentScore: scoreResult.currentScore,
          minute: scoreResult.minute,
          message: `⚽ Match en cours: ${scoreResult.currentScore} (${scoreResult.minute}') | IA surveillant...`
        };
      } else {
        // Match à venir
        return {
          status: 'a_venir',
          message: '⏳ Match à venir - Algorithmes IA en attente'
        };
      }
    } catch (error) {
      return {
        status: 'erreur',
        message: `🔴 Erreur API 1XBET: ${error.message}`
      };
    }
  }

  async checkAllPendingScores() {
    const pendingPredictions = this.predictions.filter(p => !p.actualResult);
    const results = [];

    for (const prediction of pendingPredictions) {
      try {
        const result = await this.checkScoresWith1XBET(prediction.Id);
        results.push({
          predictionId: prediction.Id,
          homeTeam: prediction.homeTeam,
          awayTeam: prediction.awayTeam,
          predictedScore: prediction.predictedScore,
          confidence: prediction.confidence,
          algorithmUsed: prediction.algorithmUsed,
          ...result
        });
      } catch (error) {
        results.push({
          predictionId: prediction.Id,
          homeTeam: prediction.homeTeam,
          awayTeam: prediction.awayTeam,
          error: error.message
        });
      }
    }

    return {
      totalChecked: results.length,
      completed: results.filter(r => r.status === 'terminé').length,
      inProgress: results.filter(r => r.status === 'en_cours').length,
      pending: results.filter(r => r.status === 'a_venir').length,
      errors: results.filter(r => r.error).length,
      results
    };
  }

  // Advanced pattern detection among 20+ scores
  async detectBestScorePatterns(scoreOdds) {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    if (!scoreOdds || scoreOdds.length < 10) {
      throw new Error("Minimum 10 scores requis pour la détection avancée");
    }

    const validScores = scoreOdds.filter(item => 
      item.score && item.coefficient && !isNaN(item.coefficient)
    );

    if (validScores.length < 10) {
      throw new Error("Données insuffisantes pour l'analyse IA");
    }

    // Multi-algorithm pattern detection
    const patterns = {
      lowScoring: this.detectLowScoringPattern(validScores),
      highValue: this.detectHighValuePattern(validScores),
      safeBets: this.detectSafeBetPattern(validScores),
      upsets: this.detectUpsetPotential(validScores),
      marketInefficiency: this.detectMarketInefficiencies(validScores)
    };

    // Generate recommendations based on patterns
    const recommendations = this.generatePatternRecommendations(patterns, validScores);
    
    return {
      totalScoresAnalyzed: validScores.length,
      patternsDetected: Object.keys(patterns).filter(p => patterns[p].strength > 0.6).length,
      patterns,
      recommendations,
      confidence: this.calculatePatternConfidence(patterns),
      riskAssessment: this.assessPatternRisks(patterns)
    };
  }

  detectLowScoringPattern(scores) {
    const lowScoreMatches = scores.filter(s => {
      const [home, away] = s.score.split('-').map(Number);
      return (home + away) <= 2;
    });

    const strength = lowScoreMatches.length / scores.length;
    const avgCoeff = lowScoreMatches.reduce((sum, s) => sum + parseFloat(s.coefficient), 0) / lowScoreMatches.length;

    return {
      detected: strength > 0.4,
      strength: Math.round(strength * 100) / 100,
      count: lowScoreMatches.length,
      avgCoefficient: Math.round(avgCoeff * 100) / 100,
      topScores: lowScoreMatches
        .sort((a, b) => parseFloat(b.probability) - parseFloat(a.probability))
        .slice(0, 3)
    };
  }

  detectHighValuePattern(scores) {
    const highValueScores = scores.filter(s => {
      const probability = parseFloat(s.probability || 0);
      const coefficient = parseFloat(s.coefficient);
      const value = probability / coefficient;
      return value >= 2; // High value threshold
    });

    return {
      detected: highValueScores.length > 0,
      strength: Math.min(1, highValueScores.length / 5), // Up to 5 high-value scores
      count: highValueScores.length,
      topScores: highValueScores
        .sort((a, b) => (parseFloat(b.probability) / parseFloat(b.coefficient)) - 
                       (parseFloat(a.probability) / parseFloat(a.coefficient)))
        .slice(0, 3)
    };
  }

  detectSafeBetPattern(scores) {
    const safeScores = scores.filter(s => {
      const coefficient = parseFloat(s.coefficient);
      const probability = parseFloat(s.probability || 0);
      return coefficient <= 4 && probability >= 20; // Safe bet criteria
    });

    return {
      detected: safeScores.length > 0,
      strength: Math.min(1, safeScores.length / 3),
      count: safeScores.length,
      topScores: safeScores
        .sort((a, b) => parseFloat(b.probability) - parseFloat(a.probability))
        .slice(0, 2)
    };
  }

  detectUpsetPotential(scores) {
    const upsetScores = scores.filter(s => {
      const coefficient = parseFloat(s.coefficient);
      const probability = parseFloat(s.probability || 0);
      return coefficient >= 8 && probability >= 8; // Potential upset
    });

    return {
      detected: upsetScores.length > 0,
      strength: Math.min(0.8, upsetScores.length / 4), // Lower strength for upsets
      count: upsetScores.length,
      topScores: upsetScores
        .sort((a, b) => parseFloat(b.probability) - parseFloat(a.probability))
        .slice(0, 2)
    };
  }

  detectMarketInefficiencies(scores) {
    const inefficiencies = scores.filter(s => {
      const coefficient = parseFloat(s.coefficient);
      const probability = parseFloat(s.probability || 0);
      const impliedProb = (1 / coefficient) * 100;
      const difference = probability - impliedProb;
      return Math.abs(difference) >= 10; // Significant market inefficiency
    });

    return {
      detected: inefficiencies.length > 0,
      strength: Math.min(1, inefficiencies.length / scores.length * 2),
      count: inefficiencies.length,
      topScores: inefficiencies
        .sort((a, b) => parseFloat(b.probability) - parseFloat(a.probability))
        .slice(0, 3)
    };
  }

  generatePatternRecommendations(patterns, scores) {
    const recommendations = [];

    if (patterns.safeBets.detected && patterns.safeBets.strength > 0.7) {
      recommendations.push({
        type: 'SAFE_BET',
        priority: 'HIGH',
        message: `${patterns.safeBets.count} paris sûrs détectés - Recommandation forte`,
        scores: patterns.safeBets.topScores,
        confidence: 95
      });
    }

    if (patterns.highValue.detected && patterns.highValue.strength > 0.6) {
      recommendations.push({
        type: 'HIGH_VALUE',
        priority: 'MEDIUM',
        message: `${patterns.highValue.count} opportunités haute valeur identifiées`,
        scores: patterns.highValue.topScores,
        confidence: 85
      });
    }

    if (patterns.lowScoring.detected && patterns.lowScoring.strength > 0.6) {
      recommendations.push({
        type: 'LOW_SCORING_MATCH',
        priority: 'MEDIUM',
        message: 'Match à faible score probable - Favoriser 0-0, 1-0, 0-1',
        scores: patterns.lowScoring.topScores,
        confidence: 80
      });
    }

    if (patterns.upsets.detected && patterns.upsets.strength > 0.5) {
      recommendations.push({
        type: 'UPSET_POTENTIAL',
        priority: 'LOW',
        message: `Potentiels upsets détectés - Paris risqués mais rentables`,
        scores: patterns.upsets.topScores,
        confidence: 60
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  calculatePatternConfidence(patterns) {
    const weights = {
      safeBets: 0.4,
      highValue: 0.25,
      lowScoring: 0.15,
      marketInefficiency: 0.15,
      upsets: 0.05
    };

    let totalConfidence = 0;
    Object.entries(patterns).forEach(([pattern, data]) => {
      if (data.detected) {
        totalConfidence += (data.strength * weights[pattern]) * 100;
      }
    });

    return Math.min(95, Math.round(totalConfidence));
  }

  assessPatternRisks(patterns) {
    let riskScore = 50; // Base risk

    if (patterns.safeBets.detected && patterns.safeBets.strength > 0.7) {
      riskScore -= 20; // Lower risk
    }

    if (patterns.upsets.detected && patterns.upsets.strength > 0.6) {
      riskScore += 15; // Higher risk
    }

    if (patterns.marketInefficiency.detected && patterns.marketInefficiency.strength > 0.7) {
      riskScore += 10; // Market uncertainty
    }

    return {
      score: Math.max(10, Math.min(90, riskScore)),
      level: riskScore <= 30 ? 'Très Faible' :
             riskScore <= 45 ? 'Faible' :
             riskScore <= 60 ? 'Modéré' :
             riskScore <= 75 ? 'Élevé' : 'Très Élevé'
    };
  }
}

export const predictionService = new PredictionService();