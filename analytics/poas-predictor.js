/**
 * POAS Predictor - Advanced Prediction Engine
 * Core algorithms for POAS optimization and net profit prediction
 */

class POASPredictor {
    /**
     * Main prediction function - answers "Will lower POAS = more profit?"
     */
    static predictNetProfit(targetPOAS, historicalData, options = {}) {
        const {
            currentAnalysis,
            useSeasonalAdjustment = true,
            confidenceLevel = 0.95,
            monthsToPredict = 1
        } = options;

        try {
            // Step 1: Get baseline data for prediction
            const baseline = this.getBaselineData(historicalData);
            
            // Step 2: Predict the 3 core inputs for target POAS
            const prediction = this.predictCoreMetrics(targetPOAS, baseline, historicalData, useSeasonalAdjustment);
            
            // Step 3: Calculate all derived metrics using same formulas as main app
            const calculatedMetrics = this.calculateDerivedMetrics(prediction);
            
            // Step 4: Calculate confidence intervals and risk assessment
            const confidence = this.calculatePredictionConfidence(targetPOAS, historicalData, prediction);
            
            // Step 5: Compare with current performance
            const comparison = this.compareWithCurrent(calculatedMetrics, baseline);
            
            return {
                targetPOAS,
                prediction: {
                    ...prediction,
                    ...calculatedMetrics
                },
                confidence,
                comparison,
                recommendation: this.generateRecommendation(calculatedMetrics, baseline, confidence),
                riskAssessment: this.assessRisk(targetPOAS, baseline.avgPOAS, confidence)
            };

        } catch (error) {
            console.error('Prediction error:', error);
            return {
                error: true,
                message: error.message,
                targetPOAS
            };
        }
    }

    /**
     * Get baseline data from optimal historical performance and recent trends
     */
    static getBaselineData(historicalData) {
        // Find the month with highest net profit for optimal performance reference
        const bestMonth = historicalData.reduce((best, current) =>
            current.netProfit > best.netProfit ? current : best
        );

        // Use last 6 months for recent trends
        const recentData = historicalData.slice(-6);
        const recentCount = recentData.length;

        // Calculate recent averages
        const recentAverages = {
            avgRevenue: recentData.reduce((sum, d) => sum + d.revenue, 0) / recentCount,
            avgGrossProfit: recentData.reduce((sum, d) => sum + d.grossprofit, 0) / recentCount,
            avgMarketingSpend: recentData.reduce((sum, d) => sum + d.marketingSpend, 0) / recentCount,
            avgNetProfit: recentData.reduce((sum, d) => sum + d.netProfit, 0) / recentCount,
            avgPOAS: recentData.reduce((sum, d) => sum + d.poas, 0) / recentCount,
            avgROAS: recentData.reduce((sum, d) => sum + d.roas, 0) / recentCount,
            avgGrossMarginPercent: recentData.reduce((sum, d) => sum + d.grossMarginPercent, 0) / recentCount
        };

        // Calculate all-time averages for comparison
        const allTimeCount = historicalData.length;
        const allTimeAverages = {
            avgRevenue: historicalData.reduce((sum, d) => sum + d.revenue, 0) / allTimeCount,
            avgGrossProfit: historicalData.reduce((sum, d) => sum + d.grossprofit, 0) / allTimeCount,
            avgMarketingSpend: historicalData.reduce((sum, d) => sum + d.marketingSpend, 0) / allTimeCount,
            avgNetProfit: historicalData.reduce((sum, d) => sum + d.netProfit, 0) / allTimeCount,
            avgPOAS: historicalData.reduce((sum, d) => sum + d.poas, 0) / allTimeCount,
            avgROAS: historicalData.reduce((sum, d) => sum + d.roas, 0) / allTimeCount,
            avgGrossMarginPercent: historicalData.reduce((sum, d) => sum + d.grossMarginPercent, 0) / allTimeCount
        };

        return {
            // Use blend of recent and all-time performance, weighted toward better performance
            avgRevenue: Math.max(recentAverages.avgRevenue, allTimeAverages.avgRevenue * 0.8),
            avgGrossProfit: Math.max(recentAverages.avgGrossProfit, allTimeAverages.avgGrossProfit * 0.8),
            avgMarketingSpend: (recentAverages.avgMarketingSpend + allTimeAverages.avgMarketingSpend) / 2,
            avgNetProfit: Math.max(recentAverages.avgNetProfit, allTimeAverages.avgNetProfit * 0.8),
            avgPOAS: (recentAverages.avgPOAS + allTimeAverages.avgPOAS) / 2,
            avgROAS: Math.max(recentAverages.avgROAS, allTimeAverages.avgROAS * 0.8),
            avgGrossMarginPercent: (recentAverages.avgGrossMarginPercent + allTimeAverages.avgGrossMarginPercent) / 2,

            // Add optimal performance reference
            bestPerformance: {
                netProfit: bestMonth.netProfit,
                poas: bestMonth.poas,
                revenue: bestMonth.revenue,
                grossprofit: bestMonth.grossprofit,
                marketingSpend: bestMonth.marketingSpend,
                month: bestMonth.month
            },

            // Add recent vs all-time comparison
            recentAverages,
            allTimeAverages,
            latestMonth: recentData[recentData.length - 1]
        };
    }

    /**
     * Predict the 3 core metrics (revenue, grossprofit, marketingSpend) for target POAS
     */
    static predictCoreMetrics(targetPOAS, baseline, historicalData, useSeasonalAdjustment) {
        // NEW APPROACH: Use historical POAS-performance correlation

        // Step 1: Find historical months with similar POAS for reference
        const similarPOASData = this.findSimilarPOASPerformance(targetPOAS, historicalData);

        // Step 2: If we have good historical data at this POAS level, use it as primary reference
        if (similarPOASData.length > 0) {
            const avgSimilar = {
                revenue: similarPOASData.reduce((sum, d) => sum + d.revenue, 0) / similarPOASData.length,
                grossprofit: similarPOASData.reduce((sum, d) => sum + d.grossprofit, 0) / similarPOASData.length,
                marketingSpend: similarPOASData.reduce((sum, d) => sum + d.marketingSpend, 0) / similarPOASData.length,
                netProfit: similarPOASData.reduce((sum, d) => sum + d.netProfit, 0) / similarPOASData.length
            };

            // Adjust for current scale (blend with baseline)
            const scaleFactor = baseline.avgRevenue / avgSimilar.revenue;
            const adjustedPrediction = {
                revenue: avgSimilar.revenue * scaleFactor,
                grossprofit: avgSimilar.grossprofit * scaleFactor,
                marketingSpend: avgSimilar.marketingSpend * scaleFactor
            };

            // Ensure POAS target is met: marketingSpend = grossprofit / targetPOAS
            adjustedPrediction.marketingSpend = adjustedPrediction.grossprofit / targetPOAS;

            return this.validateAndAdjustPredictions(adjustedPrediction, baseline);
        }

        // Step 3: Fallback to original method if no similar POAS data
        // Method 1: Start with gross profit prediction based on historical patterns
        const predictedGrossProfit = this.predictGrossProfit(baseline, historicalData);

        // Method 2: Calculate required marketing spend for target POAS
        // Formula: marketingSpend = grossprofit / targetPOAS
        const predictedMarketingSpend = predictedGrossProfit / targetPOAS;

        // Method 3: Predict revenue based on historical ROAS patterns and marketing spend
        const predictedRevenue = this.predictRevenue(predictedMarketingSpend, baseline, historicalData);

        // Validate and adjust predictions for consistency
        const adjustedPredictions = this.validateAndAdjustPredictions({
            revenue: predictedRevenue,
            grossprofit: predictedGrossProfit,
            marketingSpend: predictedMarketingSpend
        }, baseline);

        return adjustedPredictions;
    }

    /**
     * Find historical months with similar POAS performance
     */
    static findSimilarPOASPerformance(targetPOAS, historicalData) {
        // Look for POAS within ±0.3 range
        return historicalData.filter(d =>
            Math.abs(d.poas - targetPOAS) <= 0.3
        ).sort((a, b) => b.netProfit - a.netProfit); // Sort by net profit descending
    }

    /**
     * Predict gross profit based on historical trends and revenue correlation
     */
    static predictGrossProfit(baseline, historicalData) {
        // Calculate historical gross margin stability
        const grossMargins = historicalData.map(d => d.grossMarginPercent);
        const avgGrossMargin = grossMargins.reduce((a, b) => a + b, 0) / grossMargins.length;
        
        // Use trend analysis to adjust baseline
        const grossProfitTrend = POASUtils.calculateTrend(historicalData, 'grossprofit');
        
        let predictedGrossProfit = baseline.avgGrossProfit;
        
        // Apply trend adjustment
        if (grossProfitTrend.strength > 0.3) {
            const trendAdjustment = grossProfitTrend.slope * 0.5; // Conservative trend application
            predictedGrossProfit += trendAdjustment;
        }
        
        return Math.max(predictedGrossProfit, baseline.avgGrossProfit * 0.8); // Minimum 80% of baseline
    }

    /**
     * Predict revenue based on marketing spend and historical ROAS patterns
     */
    static predictRevenue(marketingSpend, baseline, historicalData) {
        // Analyze historical ROAS at different marketing spend levels
        const roasAnalysis = this.analyzeROASBySpendLevel(historicalData, marketingSpend);
        
        // Use the most relevant ROAS for prediction
        const predictedROAS = roasAnalysis.predictedROAS;
        
        // Calculate revenue: revenue = marketingSpend * ROAS
        const predictedRevenue = marketingSpend * predictedROAS;
        
        return predictedRevenue;
    }

    /**
     * Analyze ROAS performance at different marketing spend levels
     */
    static analyzeROASBySpendLevel(historicalData, targetSpend) {
        // Group data by marketing spend ranges
        const spendRanges = this.createSpendRanges(historicalData);
        
        // Find the range that best matches target spend
        const relevantRange = spendRanges.find(range => 
            targetSpend >= range.min && targetSpend <= range.max
        ) || spendRanges[Math.floor(spendRanges.length / 2)]; // Default to middle range
        
        return {
            predictedROAS: relevantRange.avgROAS,
            confidence: relevantRange.count >= 3 ? 'high' : relevantRange.count >= 2 ? 'medium' : 'low',
            dataPoints: relevantRange.count
        };
    }

    /**
     * Create marketing spend ranges for analysis
     */
    static createSpendRanges(historicalData) {
        const spends = historicalData.map(d => d.marketingSpend).sort((a, b) => a - b);
        const min = spends[0];
        const max = spends[spends.length - 1];
        const rangeSize = (max - min) / 5; // Create 5 ranges
        
        const ranges = [];
        for (let i = 0; i < 5; i++) {
            const rangeMin = min + (i * rangeSize);
            const rangeMax = min + ((i + 1) * rangeSize);
            
            const dataInRange = historicalData.filter(d => 
                d.marketingSpend >= rangeMin && d.marketingSpend < rangeMax
            );
            
            if (dataInRange.length > 0) {
                ranges.push({
                    min: rangeMin,
                    max: rangeMax,
                    count: dataInRange.length,
                    avgROAS: dataInRange.reduce((sum, d) => sum + d.roas, 0) / dataInRange.length,
                    avgPOAS: dataInRange.reduce((sum, d) => sum + d.poas, 0) / dataInRange.length
                });
            }
        }
        
        return ranges;
    }

    /**
     * Validate and adjust predictions for consistency
     */
    static validateAndAdjustPredictions(predictions, baseline) {
        let { revenue, grossprofit, marketingSpend } = predictions;
        
        // Ensure gross profit doesn't exceed revenue
        if (grossprofit > revenue * 0.8) { // Max 80% gross margin
            grossprofit = revenue * 0.8;
        }
        
        // Ensure minimum gross margin of 20%
        if (grossprofit < revenue * 0.2) {
            grossprofit = revenue * 0.2;
        }
        
        // Ensure marketing spend is reasonable (max 30% of revenue)
        if (marketingSpend > revenue * 0.3) {
            marketingSpend = revenue * 0.3;
        }
        
        return { revenue, grossprofit, marketingSpend };
    }

    /**
     * Calculate all derived metrics using the same formulas as main app
     */
    static calculateDerivedMetrics(coreMetrics) {
        const { revenue, grossprofit, marketingSpend } = coreMetrics;
        
        // Calculate using exact same formulas as main app
        const roas = revenue / marketingSpend;
        const poas = grossprofit / marketingSpend;
        const grossMarginPercent = (grossprofit / revenue) * 100;
        const netProfitPercent = ((grossprofit - marketingSpend) / revenue) * 100;
        const netProfit = grossprofit - marketingSpend;
        const marketingPercent = (marketingSpend / revenue) * 100;
        const poasRoasRatio = poas / roas;
        
        return {
            roas,
            poas,
            grossMarginPercent,
            netProfitPercent,
            netProfit,
            marketingPercent,
            poasRoasRatio
        };
    }

    /**
     * Calculate prediction confidence based on historical data variance and best performance analysis
     */
    static calculatePredictionConfidence(targetPOAS, historicalData, prediction) {
        // Find historical data points with similar POAS
        const similarPOAS = historicalData.filter(d =>
            Math.abs(d.poas - targetPOAS) <= 0.5
        );

        // Find the best performing month for comparison
        const bestMonth = historicalData.reduce((best, current) =>
            current.netProfit > best.netProfit ? current : best
        );

        if (similarPOAS.length === 0) {
            // Check if target POAS is close to best performance POAS
            const distanceFromBest = Math.abs(targetPOAS - bestMonth.poas);
            if (distanceFromBest <= 0.2) {
                return {
                    level: 'medium',
                    percentage: 75,
                    reason: `Target POAS (${targetPOAS.toFixed(2)}) is close to best performance POAS (${bestMonth.poas.toFixed(2)})`,
                    dataPoints: 1,
                    bestPerformanceReference: true
                };
            }

            return {
                level: 'low',
                percentage: 60,
                reason: 'No historical data with similar POAS',
                dataPoints: 0
            };
        }

        // Calculate variance in net profit for similar POAS levels
        const netProfits = similarPOAS.map(d => d.netProfit);
        const confidence = POASUtils.calculateConfidenceInterval(netProfits);

        // Check if any similar POAS data includes high-performing months
        const hasHighPerformance = similarPOAS.some(d => d.netProfit > bestMonth.netProfit * 0.8);

        // Determine confidence level
        const variance = confidence.margin / confidence.mean;
        let level, percentage;

        if (variance < 0.1 && hasHighPerformance) {
            level = 'high';
            percentage = 90;
        } else if (variance < 0.2 || hasHighPerformance) {
            level = 'medium';
            percentage = 75;
        } else {
            level = 'low';
            percentage = 60;
        }

        // Boost confidence if target POAS is close to historically successful levels
        const distanceFromBest = Math.abs(targetPOAS - bestMonth.poas);
        if (distanceFromBest <= 0.1 && level !== 'high') {
            level = 'high';
            percentage = 85;
        }

        return {
            level,
            percentage,
            variance,
            dataPoints: similarPOAS.length,
            confidenceInterval: confidence,
            reason: `Based on ${similarPOAS.length} similar historical data points`,
            bestPerformanceDistance: distanceFromBest,
            hasHighPerformance
        };
    }

    /**
     * Compare prediction with current performance and best historical performance
     */
    static compareWithCurrent(prediction, baseline) {
        const netProfitChange = prediction.netProfit - baseline.avgNetProfit;
        const netProfitChangePercent = (netProfitChange / baseline.avgNetProfit) * 100;
        const marketingSpendChange = prediction.marketingSpend - baseline.avgMarketingSpend;
        const revenueChange = prediction.revenue - baseline.avgRevenue;

        // Also compare with best historical performance
        const bestPerformanceComparison = {
            netProfitVsBest: prediction.netProfit - baseline.bestPerformance.netProfit,
            netProfitVsBestPercent: ((prediction.netProfit - baseline.bestPerformance.netProfit) / baseline.bestPerformance.netProfit) * 100,
            poasVsBest: prediction.poas - baseline.bestPerformance.poas
        };

        return {
            netProfitChange,
            netProfitChangePercent,
            marketingSpendChange,
            revenueChange,
            isImprovement: netProfitChange > 0,
            summary: netProfitChange > 0 ?
                `Predicted ${POASUtils.formatCurrency(netProfitChange)} increase in net profit` :
                `Predicted ${POASUtils.formatCurrency(Math.abs(netProfitChange))} decrease in net profit`,
            bestPerformanceComparison
        };
    }

    /**
     * Generate recommendation based on prediction and historical performance analysis
     */
    static generateRecommendation(prediction, baseline, confidence) {
        const netProfitChange = prediction.netProfit - baseline.avgNetProfit;
        const changePercent = Math.abs((netProfitChange / baseline.avgNetProfit) * 100);

        // Check if target POAS is close to best historical performance
        const distanceFromBest = Math.abs(prediction.poas - baseline.bestPerformance.poas);
        const isNearBestPOAS = distanceFromBest <= 0.2;

        // Check if predicted net profit is close to best historical performance
        const predictedVsBest = (prediction.netProfit / baseline.bestPerformance.netProfit) * 100;

        if (confidence.level === 'low' && !isNearBestPOAS) {
            return {
                action: 'caution',
                message: 'Low confidence in prediction. Consider gathering more data before making changes.',
                reasoning: confidence.reason
            };
        }

        // Special case: If target POAS is very close to historically best POAS
        if (isNearBestPOAS) {
            return {
                action: 'recommend',
                message: `Strong recommendation: Target POAS (${prediction.poas.toFixed(2)}) is close to your best performing POAS (${baseline.bestPerformance.poas.toFixed(2)}) which achieved ${POASUtils.formatCurrency(baseline.bestPerformance.netProfit)} net profit`,
                reasoning: `Historical evidence shows excellent performance at similar POAS levels`
            };
        }

        if (netProfitChange > baseline.avgNetProfit * 0.05) { // >5% improvement
            return {
                action: 'recommend',
                message: `Strong recommendation: Target POAS could increase net profit by ${changePercent.toFixed(1)}%`,
                reasoning: 'Significant profit improvement with acceptable confidence'
            };
        } else if (netProfitChange > 0) {
            return {
                action: 'consider',
                message: `Moderate improvement: Target POAS could increase net profit by ${changePercent.toFixed(1)}%`,
                reasoning: 'Small but positive profit improvement'
            };
        } else {
            // Check if we're moving away from proven successful POAS levels
            if (baseline.bestPerformance.poas < prediction.poas) {
                return {
                    action: 'caution',
                    message: `Caution: Target POAS (${prediction.poas.toFixed(2)}) is higher than your best performing POAS (${baseline.bestPerformance.poas.toFixed(2)}). Consider lowering POAS instead.`,
                    reasoning: 'Historical data suggests lower POAS performed better'
                };
            }

            return {
                action: 'avoid',
                message: `Not recommended: Target POAS could decrease net profit by ${changePercent.toFixed(1)}%`,
                reasoning: 'Predicted negative impact on profitability'
            };
        }
    }

    /**
     * Assess risk of changing POAS
     */
    static assessRisk(targetPOAS, currentPOAS, confidence) {
        const poasChange = Math.abs(targetPOAS - currentPOAS);
        const changePercent = (poasChange / currentPOAS) * 100;
        
        let riskLevel, riskFactors = [];
        
        if (changePercent > 30) {
            riskLevel = 'high';
            riskFactors.push('Large POAS change (>30%)');
        } else if (changePercent > 15) {
            riskLevel = 'medium';
            riskFactors.push('Moderate POAS change (15-30%)');
        } else {
            riskLevel = 'low';
            riskFactors.push('Small POAS change (<15%)');
        }
        
        if (confidence.level === 'low') {
            riskLevel = riskLevel === 'low' ? 'medium' : 'high';
            riskFactors.push('Low prediction confidence');
        }
        
        if (confidence.dataPoints < 3) {
            riskFactors.push('Limited historical data');
        }
        
        return {
            level: riskLevel,
            factors: riskFactors,
            changePercent,
            recommendation: this.getRiskRecommendation(riskLevel)
        };
    }

    /**
     * Get risk-based recommendation
     */
    static getRiskRecommendation(riskLevel) {
        switch (riskLevel) {
            case 'low':
                return 'Safe to implement. Monitor results closely.';
            case 'medium':
                return 'Proceed with caution. Consider testing with smaller budget first.';
            case 'high':
                return 'High risk. Consider smaller incremental changes or gather more data.';
            default:
                return 'Assess carefully before implementing.';
        }
    }
}
