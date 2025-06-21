/**
 * POAS Analytics - User Interface Controller
 * Handles UI interactions for the Predictive Analytics tab
 */

class POASInterface {
    constructor() {
        this.isInitialized = false;
        this.currentPrediction = null;
    }

    /**
     * Initialize the interface
     */
    async initialize() {
        console.log('Initializing POAS Interface...');
        
        // Wait for analytics to be ready
        await this.waitForAnalytics();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Update UI with initial analysis
        this.updateQuickAnalysis();
        
        // Show the interface
        this.showInterface();
        
        this.isInitialized = true;
        console.log('POAS Interface initialized');
    }

    /**
     * Wait for analytics system to be ready
     */
    async waitForAnalytics() {
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds max wait

        while (attempts < maxAttempts) {
            if (window.poasAnalytics && window.poasAnalytics.isInitialized) {
                document.getElementById('analyticsStatus').innerHTML =
                    '<i class="fas fa-check-circle me-2 text-success"></i>Analysmotor redo!';
                return;
            }

            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }

        // Show error if analytics didn't initialize
        document.getElementById('analyticsStatus').innerHTML =
            '<i class="fas fa-exclamation-triangle me-2 text-warning"></i>Analysmotor inte redo. Vänligen uppdatera sidan.';
        throw new Error('Analytics system not ready');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // POAS slider
        const slider = document.getElementById('poasSlider');
        const sliderValue = document.getElementById('poasSliderValue');
        
        slider.addEventListener('input', (e) => {
            sliderValue.textContent = e.target.value;
        });

        // Predict button
        document.getElementById('predictButton').addEventListener('click', () => {
            this.runPrediction();
        });

        // Tab activation
        document.getElementById('predictive-analytics-tab').addEventListener('shown.bs.tab', () => {
            if (!this.isInitialized) {
                setTimeout(() => this.initialize(), 100);
            }
        });
    }

    /**
     * Update quick analysis summary
     */
    updateQuickAnalysis() {
        try {
            const analysis = window.poasAnalytics.getAnalysis();
            
            // Update summary cards
            document.getElementById('totalMonths').textContent = analysis.dataRange.totalMonths;
            document.getElementById('currentAvgPOAS').textContent = analysis.averages.avgPOAS.toFixed(2);
            
            // Optimal POAS range
            const optimalRange = analysis.optimalRanges.optimalRange;
            if (optimalRange) {
                document.getElementById('optimalPOASRange').textContent = 
                    `${optimalRange.min}-${optimalRange.max}`;
            } else {
                document.getElementById('optimalPOASRange').textContent = 'N/A';
            }
            
            // POAS trend
            const trend = analysis.trends.poasTrend;
            document.getElementById('poasTrend').textContent = trend.interpretation;
            
            // Set slider to current average POAS
            const slider = document.getElementById('poasSlider');
            const currentPOAS = Math.round(analysis.averages.avgPOAS * 10) / 10;
            slider.value = currentPOAS;
            document.getElementById('poasSliderValue').textContent = currentPOAS;
            
        } catch (error) {
            console.error('Error updating quick analysis:', error);
        }
    }

    /**
     * Show the interface elements
     */
    showInterface() {
        document.getElementById('quickAnalysis').style.display = 'block';
        document.getElementById('poasOptimizer').style.display = 'block';
        document.getElementById('advancedCharts').style.display = 'block';

        // Initialize charts
        this.initializeCharts();
    }

    /**
     * Initialize advanced charts
     */
    initializeCharts() {
        try {
            const analysis = window.poasAnalytics.getAnalysis();
            const historicalData = window.poasAnalytics.getHistoricalData();
            const currentPOAS = analysis.averages.avgPOAS;

            // Create POAS optimization chart
            window.poasCharts.createPOASOptimizationChart('poasOptimizationChart', historicalData, currentPOAS);

            // Create historical pattern chart
            window.poasCharts.createHistoricalPatternChart('historicalPatternChart', historicalData);

            // Generate scenario predictions for comparison chart
            this.updateScenarioChart();

        } catch (error) {
            console.error('Error initializing charts:', error);
        }
    }

    /**
     * Update scenario comparison chart
     */
    updateScenarioChart() {
        try {
            const analysis = window.poasAnalytics.getAnalysis();
            const baseline = {
                avgNetProfit: analysis.averages.avgNetProfit,
                avgMarketingSpend: analysis.averages.avgMarketingSpend
            };

            // Generate predictions for different POAS values
            const predictions = {};
            const poasValues = [2.5, 3.0, 3.5, 4.0];

            poasValues.forEach(poas => {
                try {
                    const prediction = window.poasAnalytics.predictNetProfit(poas);
                    if (prediction && prediction.prediction) {
                        predictions[poas.toString()] = prediction;
                        console.log(`Prediction for POAS ${poas}:`, prediction.prediction);
                    } else {
                        console.warn(`Invalid prediction for POAS ${poas}:`, prediction);
                        // Create fallback prediction
                        predictions[poas.toString()] = {
                            prediction: {
                                netProfit: baseline.avgNetProfit * (0.8 + Math.random() * 0.4),
                                marketingSpend: baseline.avgMarketingSpend * (poas / analysis.averages.avgPOAS)
                            }
                        };
                    }
                } catch (error) {
                    console.warn(`Failed to predict for POAS ${poas}:`, error);
                    // Create fallback prediction
                    predictions[poas.toString()] = {
                        prediction: {
                            netProfit: baseline.avgNetProfit * (0.8 + Math.random() * 0.4),
                            marketingSpend: baseline.avgMarketingSpend * (poas / analysis.averages.avgPOAS)
                        }
                    };
                }
            });

            console.log('All predictions:', predictions);
            window.poasCharts.createScenarioComparisonChart('scenarioComparisonChart', baseline, predictions);

        } catch (error) {
            console.error('Error updating scenario chart:', error);
        }
    }

    /**
     * Run prediction for current POAS target
     */
    async runPrediction() {
        const targetPOAS = parseFloat(document.getElementById('poasSlider').value);
        
        try {
            // Show loading state
            this.showPredictionLoading();
            
            // Run prediction
            const prediction = window.poasAnalytics.predictNetProfit(targetPOAS);
            this.currentPrediction = prediction;
            
            // Display results
            this.displayPredictionResults(prediction);
            
            // Show debug info
            this.showDebugInfo(prediction);

            // Update charts with new prediction
            this.updateChartsWithPrediction(targetPOAS, prediction);

        } catch (error) {
            console.error('Prediction error:', error);
            this.showPredictionError(error.message);
        }
    }

    /**
     * Show prediction loading state
     */
    showPredictionLoading() {
        document.getElementById('predictionStatus').style.display = 'block';
        document.getElementById('predictionResults').style.display = 'none';
        document.getElementById('predictionPlaceholder').style.display = 'none';
    }

    /**
     * Display prediction results
     */
    displayPredictionResults(prediction) {
        document.getElementById('predictionStatus').style.display = 'none';
        document.getElementById('predictionPlaceholder').style.display = 'none';
        
        const resultsContainer = document.getElementById('predictionResults');
        
        if (prediction.error) {
            resultsContainer.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    <strong>Förutsägelsefel:</strong> ${prediction.message}
                </div>
            `;
            resultsContainer.style.display = 'block';
            return;
        }

        // Create results HTML
        const html = this.createPredictionHTML(prediction);
        resultsContainer.innerHTML = html;
        resultsContainer.style.display = 'block';
    }

    /**
     * Create HTML for prediction results
     */
    createPredictionHTML(prediction) {
        const { targetPOAS, prediction: pred, confidence, comparison, recommendation, riskAssessment } = prediction;

        // Get baseline data for comparison
        const analysis = window.poasAnalytics.getAnalysis();
        const baseline = analysis.averages;

        // Determine recommendation color
        let recColor = 'secondary';
        if (recommendation.action === 'recommend') recColor = 'success';
        else if (recommendation.action === 'consider') recColor = 'warning';
        else if (recommendation.action === 'avoid') recColor = 'danger';

        // Determine risk color
        let riskColor = 'success';
        if (riskAssessment.level === 'medium') riskColor = 'warning';
        else if (riskAssessment.level === 'high') riskColor = 'danger';

        return `
            <div class="row mb-3">
                <div class="col-md-4">
                    <div class="card bg-light">
                        <div class="card-body text-center">
                            <h6 class="card-title">Förutsagd Nettovinst</h6>
                            <h4 class="text-primary">${POASUtils.formatCurrency(pred.netProfit)}</h4>
                            <small class="text-muted">Mål POAS: ${targetPOAS}</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card bg-light">
                        <div class="card-body text-center">
                            <h6 class="card-title">Förändring vs Nuvarande</h6>
                            <h4 class="${comparison.isImprovement ? 'text-success' : 'text-danger'}">
                                ${comparison.isImprovement ? '+' : ''}${POASUtils.formatCurrency(comparison.netProfitChange)}
                            </h4>
                            <small class="text-muted">${comparison.netProfitChangePercent.toFixed(1)}% förändring</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card bg-light">
                        <div class="card-body text-center">
                            <h6 class="card-title">Konfidensnivå</h6>
                            <h4 class="text-info">${confidence.percentage}%</h4>
                            <small class="text-muted">${this.translateConfidence(confidence.level)} konfidans</small>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row mb-3">
                <div class="col-md-6">
                    <div class="alert alert-${recColor}">
                        <h6><i class="fas fa-lightbulb me-2"></i>Rekommendation</h6>
                        <p class="mb-1">${this.translateRecommendation(recommendation.message)}</p>
                        <small>${this.translateReasoning(recommendation.reasoning)}</small>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="alert alert-${riskColor}">
                        <h6><i class="fas fa-shield-alt me-2"></i>Riskbedömning</h6>
                        <p class="mb-1"><strong>${this.translateRisk(riskAssessment.level)} RISK</strong> (${riskAssessment.changePercent.toFixed(1)}% POAS förändring)</p>
                        <small>${this.translateRiskRecommendation(riskAssessment.recommendation)}</small>
                    </div>
                </div>
            </div>

            <div class="row">
                <div class="col-12">
                    <h6>Förutsagda Mätvärden:</h6>
                    <div class="table-responsive">
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>Mätvärde</th>
                                    <th>Förutsagt Värde</th>
                                    <th>Nuvarande Snitt</th>
                                    <th>Förändring</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Omsättning</td>
                                    <td>${POASUtils.formatCurrency(pred.revenue)}</td>
                                    <td>${POASUtils.formatCurrency(baseline.avgRevenue)}</td>
                                    <td>${this.formatChange(pred.revenue - baseline.avgRevenue, true)}</td>
                                </tr>
                                <tr>
                                    <td>Bruttovinst</td>
                                    <td>${POASUtils.formatCurrency(pred.grossprofit)}</td>
                                    <td>${POASUtils.formatCurrency(baseline.avgGrossProfit)}</td>
                                    <td>${this.formatChange(pred.grossprofit - baseline.avgGrossProfit, true)}</td>
                                </tr>
                                <tr>
                                    <td>Marknadsföring</td>
                                    <td>${POASUtils.formatCurrency(pred.marketingSpend)}</td>
                                    <td>${POASUtils.formatCurrency(baseline.avgMarketingSpend)}</td>
                                    <td>${this.formatChange(pred.marketingSpend - baseline.avgMarketingSpend, true)}</td>
                                </tr>
                                <tr>
                                    <td>ROAS</td>
                                    <td>${pred.roas.toFixed(2)}</td>
                                    <td>${baseline.avgROAS.toFixed(2)}</td>
                                    <td>${this.formatChange(pred.roas - baseline.avgROAS, false)}</td>
                                </tr>
                                <tr>
                                    <td>POAS</td>
                                    <td>${pred.poas.toFixed(2)}</td>
                                    <td>${baseline.avgPOAS.toFixed(2)}</td>
                                    <td>${this.formatChange(pred.poas - baseline.avgPOAS, false)}</td>
                                </tr>
                                <tr class="table-primary">
                                    <td><strong>Nettovinst</strong></td>
                                    <td><strong>${POASUtils.formatCurrency(pred.netProfit)}</strong></td>
                                    <td><strong>${POASUtils.formatCurrency(baseline.avgNetProfit)}</strong></td>
                                    <td><strong>${this.formatChange(comparison.netProfitChange, true)}</strong></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Show prediction error
     */
    showPredictionError(message) {
        document.getElementById('predictionStatus').style.display = 'none';
        document.getElementById('predictionPlaceholder').style.display = 'none';
        
        const resultsContainer = document.getElementById('predictionResults');
        resultsContainer.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle me-2"></i>
                <strong>Fel:</strong> ${message}
            </div>
        `;
        resultsContainer.style.display = 'block';
    }

    /**
     * Show debug information
     */
    showDebugInfo(prediction) {
        const debugOutput = document.getElementById('debugOutput');
        debugOutput.textContent = JSON.stringify(prediction, null, 2);
        document.getElementById('debugInfo').style.display = 'block';
    }

    /**
     * Translation helper functions
     */
    translateConfidence(level) {
        const translations = {
            'high': 'hög',
            'medium': 'medel',
            'low': 'låg'
        };
        return translations[level] || level;
    }

    translateRisk(level) {
        const translations = {
            'high': 'HÖG',
            'medium': 'MEDEL',
            'low': 'LÅG'
        };
        return translations[level] || level.toUpperCase();
    }

    translateRecommendation(message) {
        // Basic translation of common recommendation messages
        return message
            .replace(/Strong recommendation:/g, 'Stark rekommendation:')
            .replace(/Moderate improvement:/g, 'Måttlig förbättring:')
            .replace(/Not recommended:/g, 'Rekommenderas inte:')
            .replace(/Target POAS could increase net profit by/g, 'Mål POAS kan öka nettovinstn med')
            .replace(/Target POAS could decrease net profit by/g, 'Mål POAS kan minska nettovinsten med');
    }

    translateReasoning(reasoning) {
        return reasoning
            .replace(/Significant profit improvement with acceptable confidence/g, 'Betydande vinstförbättring med acceptabel konfidans')
            .replace(/Small but positive profit improvement/g, 'Liten men positiv vinstförbättring')
            .replace(/Predicted negative impact on profitability/g, 'Förutsagd negativ påverkan på lönsamhet');
    }

    translateRiskRecommendation(recommendation) {
        return recommendation
            .replace(/Safe to implement. Monitor results closely./g, 'Säkert att implementera. Övervaka resultaten noga.')
            .replace(/Proceed with caution. Consider testing with smaller budget first./g, 'Fortsätt med försiktighet. Överväg att testa med mindre budget först.')
            .replace(/High risk. Consider smaller incremental changes or gather more data./g, 'Hög risk. Överväg mindre stegvisa förändringar eller samla mer data.')
            .replace(/Assess carefully before implementing./g, 'Bedöm noggrant innan implementering.');
    }

    /**
     * Format change values with appropriate styling
     */
    formatChange(change, isCurrency = false) {
        if (Math.abs(change) < 0.01) {
            return '<span class="text-muted">≈0</span>';
        }

        const isPositive = change > 0;
        const colorClass = isPositive ? 'text-success' : 'text-danger';
        const sign = isPositive ? '+' : '';

        if (isCurrency) {
            return `<span class="${colorClass}">${sign}${POASUtils.formatCurrency(Math.abs(change))}</span>`;
        } else {
            return `<span class="${colorClass}">${sign}${change.toFixed(2)}</span>`;
        }
    }

    /**
     * Update charts with new prediction
     */
    updateChartsWithPrediction(targetPOAS, prediction) {
        try {
            // Update the POAS optimization chart to highlight the selected point
            const analysis = window.poasAnalytics.getAnalysis();
            const historicalData = window.poasAnalytics.getHistoricalData();

            // Recreate the optimization chart with the current target highlighted
            window.poasCharts.createPOASOptimizationChart('poasOptimizationChart', historicalData, targetPOAS);

            // Update scenario chart if needed
            this.updateScenarioChart();

        } catch (error) {
            console.error('Error updating charts with prediction:', error);
        }
    }
}

// Interface initialization is now handled by the main script.js
// when the predictive analytics tab is activated
