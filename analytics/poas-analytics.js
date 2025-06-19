/**
 * POAS Analytics - Main Controller
 * Advanced predictive analytics for POAS optimization
 */

class POASAnalytics {
    constructor() {
        this.historicalData = [];
        this.currentAnalysis = null;
        this.predictions = {};
        this.isInitialized = false;
    }

    /**
     * Initialize the analytics system
     */
    async initialize() {
        try {
            console.log('Initializing POAS Analytics...');
            
            // Load historical data from the main app
            await this.loadHistoricalData();
            
            // Perform initial analysis
            this.performInitialAnalysis();
            
            this.isInitialized = true;
            console.log('POAS Analytics initialized successfully');
            
            return true;
        } catch (error) {
            console.error('Failed to initialize POAS Analytics:', error);
            return false;
        }
    }

    /**
     * Load historical data from the main application
     */
    async loadHistoricalData() {
        // Use the existing loadData function from the main app
        if (typeof monthlyData !== 'undefined' && monthlyData.length > 0) {
            this.historicalData = [...monthlyData];
        } else {
            // If monthlyData is not available, try to load it
            if (typeof loadData === 'function') {
                await loadData();
                this.historicalData = [...monthlyData];
            } else {
                throw new Error('Unable to access historical data');
            }
        }

        console.log(`Loaded ${this.historicalData.length} months of historical data`);
        
        // Validate data structure
        this.validateDataStructure();
    }

    /**
     * Validate that the data has the expected structure
     */
    validateDataStructure() {
        if (this.historicalData.length === 0) {
            throw new Error('No historical data available');
        }

        const requiredFields = ['month', 'revenue', 'grossprofit', 'marketingSpend'];
        const calculatedFields = ['poas', 'netProfit', 'roas', 'grossMarginPercent'];
        const sampleData = this.historicalData[0];

        // Check for required base fields
        for (const field of requiredFields) {
            if (!(field in sampleData)) {
                throw new Error(`Missing required field: ${field}`);
            }
        }

        // Check if calculated fields exist, if not log warning but don't fail
        const missingCalculatedFields = calculatedFields.filter(field => !(field in sampleData));
        if (missingCalculatedFields.length > 0) {
            console.warn('Missing calculated fields:', missingCalculatedFields);
            console.warn('These will be calculated automatically');
        }

        console.log('Data structure validation passed');
        console.log('Sample data:', sampleData);
    }

    /**
     * Perform initial analysis of historical data
     */
    performInitialAnalysis() {
        this.currentAnalysis = {
            dataRange: this.getDataRange(),
            averages: this.calculateAverages(),
            trends: this.calculateTrends(),
            seasonality: this.detectSeasonality(),
            correlations: this.calculateCorrelations(),
            optimalRanges: this.findOptimalRanges()
        };

        console.log('Initial analysis completed:', this.currentAnalysis);
    }

    /**
     * Get data range information
     */
    getDataRange() {
        const months = this.historicalData.map(d => d.month).sort();
        return {
            startMonth: months[0],
            endMonth: months[months.length - 1],
            totalMonths: months.length,
            latestData: this.historicalData[this.historicalData.length - 1]
        };
    }

    /**
     * Calculate key averages
     */
    calculateAverages() {
        const data = this.historicalData;
        const count = data.length;

        return {
            avgRevenue: data.reduce((sum, d) => sum + d.revenue, 0) / count,
            avgGrossProfit: data.reduce((sum, d) => sum + d.grossprofit, 0) / count,
            avgMarketingSpend: data.reduce((sum, d) => sum + d.marketingSpend, 0) / count,
            avgPOAS: data.reduce((sum, d) => sum + d.poas, 0) / count,
            avgROAS: data.reduce((sum, d) => sum + d.roas, 0) / count,
            avgNetProfit: data.reduce((sum, d) => sum + d.netProfit, 0) / count,
            avgGrossMarginPercent: data.reduce((sum, d) => sum + d.grossMarginPercent, 0) / count
        };
    }

    /**
     * Calculate trend information
     */
    calculateTrends() {
        // Use utility functions for trend calculation
        return {
            poasTrend: POASUtils.calculateTrend(this.historicalData, 'poas'),
            netProfitTrend: POASUtils.calculateTrend(this.historicalData, 'netProfit'),
            revenueTrend: POASUtils.calculateTrend(this.historicalData, 'revenue'),
            marketingSpendTrend: POASUtils.calculateTrend(this.historicalData, 'marketingSpend')
        };
    }

    /**
     * Detect seasonal patterns
     */
    detectSeasonality() {
        return POASUtils.detectSeasonalPatterns(this.historicalData);
    }

    /**
     * Calculate correlations between metrics
     */
    calculateCorrelations() {
        return {
            poasVsNetProfit: POASUtils.calculateCorrelation(
                this.historicalData.map(d => d.poas),
                this.historicalData.map(d => d.netProfit)
            ),
            marketingSpendVsRevenue: POASUtils.calculateCorrelation(
                this.historicalData.map(d => d.marketingSpend),
                this.historicalData.map(d => d.revenue)
            ),
            poasVsMarketingSpend: POASUtils.calculateCorrelation(
                this.historicalData.map(d => d.poas),
                this.historicalData.map(d => d.marketingSpend)
            )
        };
    }

    /**
     * Find optimal POAS ranges based on historical performance
     */
    findOptimalRanges() {
        // Group data by POAS ranges and analyze net profit
        const poasRanges = [
            { min: 1.5, max: 2.0, label: 'Low POAS (1.5-2.0)' },
            { min: 2.0, max: 2.5, label: 'Medium-Low POAS (2.0-2.5)' },
            { min: 2.5, max: 3.0, label: 'Medium POAS (2.5-3.0)' },
            { min: 3.0, max: 3.5, label: 'Medium-High POAS (3.0-3.5)' },
            { min: 3.5, max: 4.0, label: 'High POAS (3.5-4.0)' },
            { min: 4.0, max: 5.0, label: 'Very High POAS (4.0-5.0)' }
        ];

        const rangeAnalysis = poasRanges.map(range => {
            const dataInRange = this.historicalData.filter(d => 
                d.poas >= range.min && d.poas < range.max
            );

            if (dataInRange.length === 0) {
                return { ...range, avgNetProfit: 0, count: 0, avgRevenue: 0 };
            }

            return {
                ...range,
                count: dataInRange.length,
                avgNetProfit: dataInRange.reduce((sum, d) => sum + d.netProfit, 0) / dataInRange.length,
                avgRevenue: dataInRange.reduce((sum, d) => sum + d.revenue, 0) / dataInRange.length,
                avgMarketingSpend: dataInRange.reduce((sum, d) => sum + d.marketingSpend, 0) / dataInRange.length
            };
        });

        // Find the range with highest average net profit
        const optimalRange = rangeAnalysis
            .filter(r => r.count > 0)
            .sort((a, b) => b.avgNetProfit - a.avgNetProfit)[0];

        return {
            rangeAnalysis,
            optimalRange,
            recommendation: optimalRange ? 
                `Optimal POAS range: ${optimalRange.min}-${optimalRange.max} (Avg Net Profit: ${Math.round(optimalRange.avgNetProfit).toLocaleString()} SEK)` :
                'Insufficient data for optimal range analysis'
        };
    }

    /**
     * Predict net profit for a given POAS target
     */
    predictNetProfit(targetPOAS, options = {}) {
        if (!this.isInitialized) {
            throw new Error('Analytics system not initialized');
        }

        return POASPredictor.predictNetProfit(targetPOAS, this.historicalData, {
            ...options,
            currentAnalysis: this.currentAnalysis
        });
    }

    /**
     * Get current analysis data
     */
    getAnalysis() {
        return this.currentAnalysis;
    }

    /**
     * Get historical data
     */
    getHistoricalData() {
        return this.historicalData;
    }

    /**
     * Refresh data and re-run analysis
     */
    async refresh() {
        await this.loadHistoricalData();
        this.performInitialAnalysis();
        console.log('POAS Analytics refreshed');
    }
}

// Analytics initialization is now handled by the main script.js
// when the predictive analytics tab is activated
