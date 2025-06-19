/**
 * POAS Analytics - Utility Functions
 * Statistical analysis and helper functions
 */

class POASUtils {
    /**
     * Calculate moving average for a given period
     */
    static calculateMovingAverage(data, field, periods) {
        const values = data.map(d => d[field]);
        const result = [];

        for (let i = periods - 1; i < values.length; i++) {
            const sum = values.slice(i - periods + 1, i + 1).reduce((a, b) => a + b, 0);
            result.push({
                index: i,
                month: data[i].month,
                value: sum / periods,
                originalValue: values[i]
            });
        }

        return result;
    }

    /**
     * Calculate trend using linear regression
     */
    static calculateTrend(data, field) {
        const values = data.map(d => d[field]);
        const n = values.length;
        
        if (n < 2) return { slope: 0, direction: 'insufficient_data', strength: 0 };

        // Simple linear regression
        const xValues = Array.from({ length: n }, (_, i) => i);
        const xMean = xValues.reduce((a, b) => a + b, 0) / n;
        const yMean = values.reduce((a, b) => a + b, 0) / n;

        let numerator = 0;
        let denominator = 0;

        for (let i = 0; i < n; i++) {
            numerator += (xValues[i] - xMean) * (values[i] - yMean);
            denominator += (xValues[i] - xMean) ** 2;
        }

        const slope = denominator === 0 ? 0 : numerator / denominator;
        
        // Calculate R-squared for trend strength
        const rSquared = this.calculateRSquared(xValues, values, slope, yMean - slope * xMean);
        
        return {
            slope,
            direction: slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable',
            strength: Math.abs(rSquared),
            rSquared,
            interpretation: this.interpretTrend(slope, rSquared, field)
        };
    }

    /**
     * Calculate R-squared value
     */
    static calculateRSquared(xValues, yValues, slope, intercept) {
        const yMean = yValues.reduce((a, b) => a + b, 0) / yValues.length;
        
        let totalSumSquares = 0;
        let residualSumSquares = 0;

        for (let i = 0; i < yValues.length; i++) {
            const predicted = slope * xValues[i] + intercept;
            totalSumSquares += (yValues[i] - yMean) ** 2;
            residualSumSquares += (yValues[i] - predicted) ** 2;
        }

        return totalSumSquares === 0 ? 0 : 1 - (residualSumSquares / totalSumSquares);
    }

    /**
     * Interpret trend results
     */
    static interpretTrend(slope, rSquared, field) {
        const strength = Math.abs(rSquared);
        const direction = slope > 0 ? 'improving' : slope < 0 ? 'declining' : 'stable';
        
        let strengthLabel;
        if (strength > 0.7) strengthLabel = 'strong';
        else if (strength > 0.4) strengthLabel = 'moderate';
        else if (strength > 0.2) strengthLabel = 'weak';
        else strengthLabel = 'no clear';

        return `${strengthLabel} ${direction} trend`;
    }

    /**
     * Calculate correlation between two arrays
     */
    static calculateCorrelation(x, y) {
        if (x.length !== y.length || x.length === 0) return 0;

        const n = x.length;
        const xMean = x.reduce((a, b) => a + b, 0) / n;
        const yMean = y.reduce((a, b) => a + b, 0) / n;

        let numerator = 0;
        let xSumSquares = 0;
        let ySumSquares = 0;

        for (let i = 0; i < n; i++) {
            const xDiff = x[i] - xMean;
            const yDiff = y[i] - yMean;
            
            numerator += xDiff * yDiff;
            xSumSquares += xDiff ** 2;
            ySumSquares += yDiff ** 2;
        }

        const denominator = Math.sqrt(xSumSquares * ySumSquares);
        return denominator === 0 ? 0 : numerator / denominator;
    }

    /**
     * Detect seasonal patterns in the data
     */
    static detectSeasonalPatterns(data) {
        // Group data by month (extract month from YYYY-MM format)
        const monthlyGroups = {};
        
        data.forEach(d => {
            const month = d.month.split('-')[1]; // Extract MM from YYYY-MM
            if (!monthlyGroups[month]) {
                monthlyGroups[month] = [];
            }
            monthlyGroups[month].push(d);
        });

        // Calculate averages for each month
        const monthlyAverages = {};
        Object.keys(monthlyGroups).forEach(month => {
            const monthData = monthlyGroups[month];
            monthlyAverages[month] = {
                count: monthData.length,
                avgPOAS: monthData.reduce((sum, d) => sum + d.poas, 0) / monthData.length,
                avgNetProfit: monthData.reduce((sum, d) => sum + d.netProfit, 0) / monthData.length,
                avgRevenue: monthData.reduce((sum, d) => sum + d.revenue, 0) / monthData.length,
                avgMarketingSpend: monthData.reduce((sum, d) => sum + d.marketingSpend, 0) / monthData.length
            };
        });

        // Find best and worst performing months
        const monthsWithData = Object.keys(monthlyAverages).filter(m => monthlyAverages[m].count > 0);
        
        const bestMonth = monthsWithData.reduce((best, month) => 
            monthlyAverages[month].avgNetProfit > monthlyAverages[best].avgNetProfit ? month : best
        );
        
        const worstMonth = monthsWithData.reduce((worst, month) => 
            monthlyAverages[month].avgNetProfit < monthlyAverages[worst].avgNetProfit ? month : worst
        );

        return {
            monthlyAverages,
            bestMonth: {
                month: bestMonth,
                ...monthlyAverages[bestMonth]
            },
            worstMonth: {
                month: worstMonth,
                ...monthlyAverages[worstMonth]
            },
            seasonalVariation: this.calculateSeasonalVariation(monthlyAverages),
            recommendations: this.generateSeasonalRecommendations(monthlyAverages)
        };
    }

    /**
     * Calculate seasonal variation coefficient
     */
    static calculateSeasonalVariation(monthlyAverages) {
        const netProfits = Object.values(monthlyAverages).map(m => m.avgNetProfit);
        const mean = netProfits.reduce((a, b) => a + b, 0) / netProfits.length;
        const variance = netProfits.reduce((sum, val) => sum + (val - mean) ** 2, 0) / netProfits.length;
        const stdDev = Math.sqrt(variance);
        
        return {
            mean,
            stdDev,
            coefficientOfVariation: mean === 0 ? 0 : stdDev / mean,
            interpretation: stdDev / mean > 0.2 ? 'high seasonal variation' : 'low seasonal variation'
        };
    }

    /**
     * Generate seasonal recommendations
     */
    static generateSeasonalRecommendations(monthlyAverages) {
        const recommendations = [];
        
        Object.keys(monthlyAverages).forEach(month => {
            const data = monthlyAverages[month];
            const monthName = this.getMonthName(month);
            
            if (data.avgPOAS > 3.5) {
                recommendations.push(`${monthName}: High POAS performance - consider increasing marketing spend`);
            } else if (data.avgPOAS < 2.5) {
                recommendations.push(`${monthName}: Low POAS performance - optimize campaigns or reduce spend`);
            }
        });

        return recommendations;
    }

    /**
     * Get month name from month number
     */
    static getMonthName(monthNum) {
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return months[parseInt(monthNum) - 1] || monthNum;
    }

    /**
     * Calculate confidence interval
     */
    static calculateConfidenceInterval(values, confidenceLevel = 0.95) {
        if (values.length === 0) return { lower: 0, upper: 0, margin: 0 };

        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / (values.length - 1);
        const stdError = Math.sqrt(variance / values.length);
        
        // Use t-distribution for small samples, normal for large
        const tValue = values.length < 30 ? this.getTValue(values.length - 1, confidenceLevel) : this.getZValue(confidenceLevel);
        const margin = tValue * stdError;

        return {
            mean,
            lower: mean - margin,
            upper: mean + margin,
            margin,
            stdError
        };
    }

    /**
     * Get t-value for confidence interval (simplified)
     */
    static getTValue(df, confidenceLevel) {
        // Simplified t-values for common confidence levels
        const tTable = {
            0.95: { 1: 12.706, 2: 4.303, 3: 3.182, 4: 2.776, 5: 2.571, 10: 2.228, 20: 2.086, 30: 2.042 }
        };
        
        const values = tTable[confidenceLevel] || tTable[0.95];
        
        if (df <= 5) return values[df] || values[5];
        if (df <= 10) return values[10];
        if (df <= 20) return values[20];
        return values[30];
    }

    /**
     * Get z-value for confidence interval
     */
    static getZValue(confidenceLevel) {
        const zTable = {
            0.90: 1.645,
            0.95: 1.96,
            0.99: 2.576
        };
        return zTable[confidenceLevel] || 1.96;
    }

    /**
     * Format number for display
     */
    static formatNumber(num, decimals = 0) {
        return new Intl.NumberFormat('sv-SE', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(num);
    }

    /**
     * Format currency for display
     */
    static formatCurrency(num) {
        return new Intl.NumberFormat('sv-SE', {
            style: 'currency',
            currency: 'SEK',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(num);
    }
}
