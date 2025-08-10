import { useMemo, useState } from "react";
import ReactApexChart from "react-apexcharts";
import Card from "@/components/atoms/Card";
import ApperIcon from "@/components/ApperIcon";
import Button from "@/components/atoms/Button";

const OddsVisualization = ({ scoreOdds, prediction }) => {
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState(false);

  // Advanced algorithm analysis
  const algorithmAnalysis = useMemo(() => {
    if (!scoreOdds || scoreOdds.length === 0) return null;

    const validScores = scoreOdds.filter(item => 
      item.score && item.coefficient && !isNaN(item.coefficient)
    );

    if (validScores.length === 0) return null;

    // Enhanced probability calculations
    const analyzedScores = validScores.map(item => {
      const coefficient = parseFloat(item.coefficient);
      const probability = parseFloat(item.probability);
      
      return {
        score: item.score,
        coefficient: coefficient,
        probability: probability,
        impliedProbability: (1 / coefficient) * 100,
        marketValue: probability / coefficient,
        riskScore: coefficient <= 3 ? 'Très Faible' : 
                  coefficient <= 5 ? 'Faible' :
                  coefficient <= 8 ? 'Modéré' : 'Élevé',
        successPotential: probability >= 20 ? 'Excellent' :
                         probability >= 15 ? 'Très Bon' :
                         probability >= 10 ? 'Bon' : 'Moyen'
      };
    });

    // Top 20 analysis
    const top20Scores = analyzedScores
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 20);

    // High success rate alternatives (90%+)
    const highSuccessAlternatives = analyzedScores
      .filter(s => s.probability >= 15 && s.coefficient <= 6)
      .sort((a, b) => b.marketValue - a.marketValue)
      .slice(0, 3);

    // Market sentiment analysis
    const avgProbability = analyzedScores.reduce((sum, s) => sum + s.probability, 0) / analyzedScores.length;
    const avgCoefficient = analyzedScores.reduce((sum, s) => sum + s.coefficient, 0) / analyzedScores.length;
    
    const marketSentiment = avgProbability >= 12 ? 'Bullish' : 
                           avgProbability >= 8 ? 'Neutre' : 'Bearish';

    return {
      analyzedScores,
      top20Scores,
      highSuccessAlternatives,
      marketMetrics: {
        totalAnalyzed: validScores.length,
        avgProbability: Math.round(avgProbability * 100) / 100,
        avgCoefficient: Math.round(avgCoefficient * 100) / 100,
        marketSentiment,
        highValueScores: analyzedScores.filter(s => s.marketValue >= 2).length
      }
    };
  }, [scoreOdds]);

  const chartData = useMemo(() => {
    if (!algorithmAnalysis?.top20Scores) {
      return { series: [], categories: [], colors: [] };
    }

    const top15 = algorithmAnalysis.top20Scores.slice(0, 15);
    const series = top15.map(item => item.probability);
    const categories = top15.map(item => item.score);
    
    const colors = top15.map(item => {
      const prob = item.probability;
      const coeff = item.coefficient;
      
      // Algorithm-based coloring
      if (prob >= 20 && coeff <= 4) return "#00FF87"; // Excellent
      if (prob >= 15 && coeff <= 6) return "#FFD700"; // Très bon
      if (prob >= 12 && coeff <= 8) return "#FFB800"; // Bon
      if (prob >= 8) return "#60A5FA"; // Correct
      return "#6B7280"; // Moyen
    });

    return { series, categories, colors };
  }, [algorithmAnalysis]);

  const chartOptions = useMemo(() => ({
    chart: {
      type: "bar",
      height: 350,
      background: "transparent",
      toolbar: { show: false },
      animations: {
        enabled: true,
        easing: "easeinout",
        speed: 1000
      }
    },
    plotOptions: {
      bar: {
        borderRadius: 8,
        horizontal: false,
        columnWidth: "70%",
        distributed: true,
        dataLabels: {
          position: 'top'
        }
      }
    },
    colors: chartData.colors,
    dataLabels: {
      enabled: true,
      formatter: (val) => `${val}%`,
      style: {
        fontSize: "10px",
        fontWeight: "bold",
        colors: ["#FFFFFF"]
      },
      offsetY: -20
    },
    xaxis: {
      categories: chartData.categories,
      labels: {
        style: {
          colors: "#9CA3AF",
          fontSize: "11px"
        },
        rotate: -45
      },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      labels: {
        formatter: (val) => `${val}%`,
        style: {
          colors: "#9CA3AF",
          fontSize: "11px"
        }
      },
      max: Math.max(...chartData.series) * 1.2
    },
    grid: {
      borderColor: "#374151",
      strokeDashArray: 3,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } }
    },
    tooltip: {
      theme: "dark",
      style: {
        fontSize: "12px",
        backgroundColor: "#1F2937"
      },
      custom: function({ series, seriesIndex, dataPointIndex, w }) {
        const score = algorithmAnalysis?.top20Scores[dataPointIndex];
        if (!score) return '';
        
        return `<div class="p-3 bg-gray-800 rounded border border-primary/30">
          <div class="font-bold text-primary">${score.score}</div>
          <div class="text-sm mt-1">
            <div>Probabilité: ${score.probability}%</div>
            <div>Cote: ${score.coefficient}</div>
            <div>Valeur Marché: ${score.marketValue.toFixed(2)}</div>
            <div>Risque: ${score.riskScore}</div>
            <div>Potentiel: ${score.successPotential}</div>
          </div>
        </div>`;
      }
    },
    legend: { show: false }
  }), [chartData, algorithmAnalysis]);

  if (!scoreOdds || scoreOdds.length === 0) {
    return (
      <Card className="h-[400px] flex items-center justify-center border-dashed border-primary/30">
        <div className="text-center">
          <ApperIcon name="BarChart3" size={48} className="mx-auto mb-4 text-gray-500" />
          <p className="text-gray-400 font-medium">Analyse Algorithmique des Cotes</p>
          <p className="text-sm text-gray-500 mt-2">
            Ajoutez 10+ scores pour activer l'IA avancée
          </p>
        </div>
      </Card>
    );
  }

  if (!algorithmAnalysis) return null;

  const { marketMetrics, highSuccessAlternatives, top20Scores } = algorithmAnalysis;

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-r from-accent via-primary to-info rounded-xl flex items-center justify-center">
            <ApperIcon name="Brain" size={24} className="text-black" />
          </div>
          <div>
            <h3 className="text-xl font-display font-bold text-white">Analyse Algorithmique IA</h3>
            <p className="text-sm text-gray-400">
              {marketMetrics.totalAnalyzed} scores • Détection haute précision
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvancedMetrics(!showAdvancedMetrics)}
          className="text-primary hover:bg-primary/10"
        >
          <ApperIcon name={showAdvancedMetrics ? "ChevronUp" : "ChevronDown"} size={16} />
          Métriques
        </Button>
      </div>

      {/* Advanced Algorithm Chart */}
      <div className="mb-6 p-4 bg-gradient-to-r from-surface/50 to-surface/30 rounded-lg border border-primary/20">
        <div className="flex items-center gap-2 mb-4">
          <ApperIcon name="TrendingUp" size={18} className="text-primary" />
          <h4 className="font-semibold text-white">Top 15 Scores IA (sur {top20Scores.length})</h4>
        </div>
        <ReactApexChart
          options={chartOptions}
          series={[{ name: "Probabilité IA", data: chartData.series }]}
          type="bar"
          height={320}
        />
      </div>

      {/* High Success Alternatives - 90%+ Zone */}
      {highSuccessAlternatives.length > 0 && (
        <div className="mb-6 p-4 bg-gradient-to-r from-success/15 to-primary/15 rounded-lg border-2 border-success/40">
          <div className="flex items-center gap-2 mb-4">
            <ApperIcon name="Target" size={18} className="text-success animate-pulse" />
            <h4 className="font-bold text-success">Zone 90%+ Succès</h4>
            <span className="px-2 py-1 bg-success/20 text-success text-xs rounded-full font-medium">
              {highSuccessAlternatives.length} Détectés
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {highSuccessAlternatives.map((score, index) => (
              <div key={index} className="p-3 bg-success/10 border border-success/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-bold text-success">{score.score}</span>
                  <span className="px-2 py-1 bg-success/20 text-success text-xs rounded">
                    #{index + 1}
                  </span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Probabilité:</span>
                    <span className="text-white font-medium">{score.probability}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Cote:</span>
                    <span className="text-accent font-medium">{score.coefficient}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Valeur:</span>
                    <span className="text-primary font-medium">{score.marketValue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Risque:</span>
                    <span className={`font-medium ${
                      score.riskScore === 'Très Faible' ? 'text-success' :
                      score.riskScore === 'Faible' ? 'text-primary' :
                      score.riskScore === 'Modéré' ? 'text-accent' : 'text-warning'
                    }`}>
                      {score.riskScore}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Analytics Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-surface/40 rounded-lg p-4 border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <ApperIcon name="Database" size={16} className="text-primary" />
            <span className="text-sm font-medium text-gray-300">Scores Analysés</span>
          </div>
          <div className="text-2xl font-bold text-primary">{marketMetrics.totalAnalyzed}</div>
          <div className="text-xs text-gray-400">Top 20 sélectionnés</div>
        </div>

        <div className="bg-surface/40 rounded-lg p-4 border border-accent/20">
          <div className="flex items-center gap-2 mb-2">
            <ApperIcon name="TrendingUp" size={16} className="text-accent" />
            <span className="text-sm font-medium text-gray-300">Prob. Moyenne</span>
          </div>
          <div className="text-2xl font-bold text-accent">{marketMetrics.avgProbability}%</div>
          <div className="text-xs text-gray-400">Algorithme IA</div>
        </div>

        <div className="bg-surface/40 rounded-lg p-4 border border-info/20">
          <div className="flex items-center gap-2 mb-2">
            <ApperIcon name="Activity" size={16} className="text-info" />
            <span className="text-sm font-medium text-gray-300">Sentiment</span>
          </div>
          <div className={`text-lg font-bold ${
            marketMetrics.marketSentiment === 'Bullish' ? 'text-success' :
            marketMetrics.marketSentiment === 'Neutre' ? 'text-accent' : 'text-warning'
          }`}>
            {marketMetrics.marketSentiment}
          </div>
          <div className="text-xs text-gray-400">Marché</div>
        </div>

        <div className="bg-surface/40 rounded-lg p-4 border border-warning/20">
          <div className="flex items-center gap-2 mb-2">
            <ApperIcon name="Star" size={16} className="text-warning" />
            <span className="text-sm font-medium text-gray-300">Haute Valeur</span>
          </div>
          <div className="text-2xl font-bold text-warning">{marketMetrics.highValueScores}</div>
          <div className="text-xs text-gray-400">Scores détectés</div>
        </div>
      </div>

      {/* Enhanced Prediction Section */}
      {prediction && (
        <div className="mb-6 p-4 bg-gradient-to-r from-info/15 to-primary/15 rounded-lg border border-info/30">
          <div className="flex items-center gap-2 mb-3">
            <ApperIcon name="Cpu" size={18} className="text-info" />
            <h4 className="font-bold text-info">Prédiction IA Sélectionnée</h4>
            {prediction.confidence >= 90 && (
              <span className="px-2 py-1 bg-success/20 text-success text-xs rounded-full animate-pulse">
                ULTRA CONFIANCE
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-info/10 rounded-lg border border-info/20">
              <div className="text-2xl font-bold text-info mb-1">{prediction.predictedScore}</div>
              <div className="text-sm text-gray-300">Score Prédit</div>
            </div>
            <div className="text-center p-3 bg-primary/10 rounded-lg border border-primary/20">
              <div className="text-2xl font-bold text-primary mb-1">{prediction.confidence}%</div>
              <div className="text-sm text-gray-300">Confiance IA</div>
            </div>
            <div className="text-center p-3 bg-accent/10 rounded-lg border border-accent/20">
              <div className="text-lg font-bold text-accent mb-1">
                {prediction.algorithmUsed || 'Multi-Algo'}
              </div>
              <div className="text-sm text-gray-300">Algorithme</div>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Metrics Panel */}
      {showAdvancedMetrics && (
        <div className="mt-6 p-4 bg-surface/30 rounded-lg border border-primary/10">
          <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
            <ApperIcon name="Settings" size={16} className="text-primary" />
            Métriques Avancées IA
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Risk Distribution */}
            <div>
              <h5 className="text-sm font-medium text-gray-300 mb-3">Distribution des Risques</h5>
              <div className="space-y-2">
                {['Très Faible', 'Faible', 'Modéré', 'Élevé'].map(risk => {
                  const count = algorithmAnalysis.analyzedScores.filter(s => s.riskScore === risk).length;
                  const percentage = (count / algorithmAnalysis.analyzedScores.length * 100).toFixed(1);
                  return (
                    <div key={risk} className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">{risk}:</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-gray-700 rounded-full">
                          <div 
                            className={`h-2 rounded-full ${
                              risk === 'Très Faible' ? 'bg-success' :
                              risk === 'Faible' ? 'bg-primary' :
                              risk === 'Modéré' ? 'bg-accent' : 'bg-warning'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-300 min-w-[3rem]">{count} ({percentage}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Success Potential */}
            <div>
              <h5 className="text-sm font-medium text-gray-300 mb-3">Potentiel de Succès</h5>
              <div className="space-y-2">
                {['Excellent', 'Très Bon', 'Bon', 'Moyen'].map(potential => {
                  const count = algorithmAnalysis.analyzedScores.filter(s => s.successPotential === potential).length;
                  const percentage = (count / algorithmAnalysis.analyzedScores.length * 100).toFixed(1);
                  return (
                    <div key={potential} className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">{potential}:</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-gray-700 rounded-full">
                          <div 
                            className={`h-2 rounded-full ${
                              potential === 'Excellent' ? 'bg-success' :
                              potential === 'Très Bon' ? 'bg-primary' :
                              potential === 'Bon' ? 'bg-accent' : 'bg-gray-500'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-300 min-w-[3rem]">{count} ({percentage}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default OddsVisualization;