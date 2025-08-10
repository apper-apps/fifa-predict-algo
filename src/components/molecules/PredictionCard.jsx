import { useState, useEffect } from "react";
import Card from "@/components/atoms/Card";
import ApperIcon from "@/components/ApperIcon";

const PredictionCard = ({ prediction, isLoading }) => {
const [displayConfidence, setDisplayConfidence] = useState(0);
  const [showAlternatives, setShowAlternatives] = useState(false);

  useEffect(() => {
    if (prediction?.confidence && !isLoading) {
      const timer = setTimeout(() => {
        setDisplayConfidence(prediction.confidence);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [prediction?.confidence, isLoading]);

  useEffect(() => {
    if (prediction?.alternativeScores && prediction.alternativeScores.length > 0) {
      const timer = setTimeout(() => {
        setShowAlternatives(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [prediction?.alternativeScores]);
  if (isLoading) {
    return (
      <Card className="h-[200px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin mx-auto mb-4">
            <ApperIcon name="Loader2" size={32} className="text-primary" />
          </div>
          <p className="text-gray-300">Analyse IA en cours...</p>
          <p className="text-sm text-gray-500 mt-2">Traitement des données des bookmakers</p>
        </div>
      </Card>
    );
  }

  if (!prediction) {
    return (
      <Card className="h-[200px] flex items-center justify-center border-dashed border-primary/30">
        <div className="text-center">
          <ApperIcon name="Brain" size={48} className="mx-auto mb-4 text-gray-500" />
          <p className="text-gray-400 font-medium">Prédiction IA</p>
          <p className="text-sm text-gray-500 mt-2">
            Remplissez le formulaire pour obtenir une prédiction
          </p>
        </div>
      </Card>
    );
  }

const getConfidenceColor = () => {
    if (displayConfidence >= 90) return "text-primary drop-shadow-[0_0_10px_rgba(0,255,135,0.8)]";
    if (displayConfidence >= 80) return "text-primary";
    if (displayConfidence >= 70) return "text-accent";
    if (displayConfidence >= 60) return "text-warning";
    return "text-gray-400";
  };

  const getConfidenceGlow = () => {
    if (displayConfidence >= 90) return "shadow-neon-strong animate-pulse-neon";
    if (displayConfidence >= 80) return "shadow-neon";
    if (displayConfidence >= 70) return "shadow-gold";
    return "";
  };

  const getRiskColor = () => {
    if (!prediction?.riskLevel) return "text-gray-400";
    const risk = prediction.riskLevel.toLowerCase();
    if (risk.includes('très faible')) return "text-success";
    if (risk.includes('faible')) return "text-primary";
    if (risk.includes('modéré')) return "text-accent";
    if (risk.includes('élevé')) return "text-warning";
    return "text-error";
  };

return (
    <Card className={`relative overflow-hidden ${getConfidenceGlow()}`}>
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 opacity-50" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <ApperIcon name="Target" size={20} className="text-primary" />
              Prédiction IA
            </h3>
            {prediction?.algorithmUsed && (
              <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full border border-primary/20">
                {prediction.algorithmUsed}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <ApperIcon name="Zap" size={16} className="text-accent" />
            <span className="text-xs text-gray-400">Mi-temps</span>
          </div>
        </div>

        <div className="text-center mb-6">
          <div className="text-4xl font-display font-bold gradient-text mb-2 animate-glow">
            {prediction.predictedScore}
          </div>
          <p className="text-sm text-gray-400">Score exact prédit (1ère mi-temps)</p>
          {prediction?.riskLevel && (
            <div className="mt-2">
              <span className={`text-sm font-medium ${getRiskColor()}`}>
                Risque: {prediction.riskLevel}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="text-center">
            <div className={`text-2xl font-bold ${getConfidenceColor()}`}>
              {displayConfidence}%
            </div>
            <p className="text-xs text-gray-500">Confiance IA</p>
          </div>
          
          <div className="h-16 w-16 relative">
            <svg className="transform -rotate-90 w-16 h-16">
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="4"
                fill="transparent"
                className="text-gray-700"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="4"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 28}`}
                strokeDashoffset={`${2 * Math.PI * 28 * (1 - displayConfidence / 100)}`}
                className={`${getConfidenceColor()} transition-all duration-1500 ease-out`}
                style={{
                  filter: displayConfidence >= 70 ? "drop-shadow(0 0 8px currentColor)" : "none"
                }}
              />
            </svg>
          </div>

          <div className="text-center">
            <div className="text-lg font-semibold text-white">
              {prediction.scoreOdds?.length || 0}/20
            </div>
            <p className="text-xs text-gray-500">Scores analysés</p>
          </div>
        </div>

        {/* High-confidence alternatives section */}
        {showAlternatives && prediction?.alternativeScores && prediction.alternativeScores.length > 0 && (
          <div className="mb-4 p-3 bg-gradient-to-r from-success/10 to-primary/10 rounded-lg border border-success/30">
            <div className="flex items-center gap-2 mb-2">
              <ApperIcon name="TrendingUp" size={16} className="text-success" />
              <span className="text-sm font-medium text-success">Alternatives 90%+</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {prediction.alternativeScores.map((alt, index) => (
                <div
                  key={index}
                  className="px-3 py-2 bg-success/20 rounded-lg text-sm border border-success/30"
                >
                  <div className="font-semibold text-success">{alt.score}</div>
                  <div className="text-xs text-gray-300">Cote: {alt.coefficient}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {prediction.topPredictions && (
          <div className="mt-4 pt-4 border-t border-primary/20">
            <p className="text-xs text-gray-400 mb-3">Top prédictions IA:</p>
            <div className="grid grid-cols-3 gap-2">
              {prediction.topPredictions.slice(1, 4).map((score, index) => (
                <div
                  key={index}
                  className="px-2 py-2 bg-surface/50 rounded text-center border border-primary/10 hover:border-primary/30 transition-colors"
                >
                  <div className="text-sm font-semibold text-gray-200">{score.score}</div>
                  <div className="text-xs text-gray-400">{score.probability}%</div>
                  {score.finalScore && (
                    <div className="text-xs text-primary">Score: {score.finalScore}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {prediction?.marketAnalysis && (
          <div className="mt-4 pt-4 border-t border-accent/20">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="text-center p-2 bg-surface/30 rounded">
                <div className="text-accent font-semibold">{prediction.marketAnalysis.totalScoresAnalyzed}</div>
                <div className="text-gray-400">Scores analysés</div>
              </div>
              <div className="text-center p-2 bg-surface/30 rounded">
                <div className="text-info font-semibold">{prediction.marketAnalysis.marketSentiment}</div>
                <div className="text-gray-400">Sentiment marché</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default PredictionCard;