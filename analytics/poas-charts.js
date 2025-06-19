/**
 * POAS Analytics - Specialized Charts
 * Advanced charts and visualizations for POAS optimization
 */

class POASCharts {
    constructor() {
        this.charts = {};
        this.colors = {
            primary: 'rgb(37, 99, 235)',
            success: 'rgb(34, 197, 94)',
            warning: 'rgb(245, 158, 11)',
            danger: 'rgb(239, 68, 68)',
            info: 'rgb(14, 165, 233)',
            secondary: 'rgb(107, 114, 128)'
        };
    }

    /**
     * Create POAS Optimization Chart
     * Shows net profit prediction across different POAS values
     */
    createPOASOptimizationChart(containerId, historicalData, currentPOAS) {
        const ctx = document.getElementById(containerId);
        if (!ctx) return null;

        // Destroy existing chart
        if (this.charts[containerId]) {
            this.charts[containerId].destroy();
        }

        // Generate POAS range data (1.5 to 5.0)
        const poasRange = [];
        const netProfitPredictions = [];
        const confidenceLevels = [];

        for (let poas = 1.5; poas <= 5.0; poas += 0.1) {
            poasRange.push(poas);
            
            try {
                const prediction = window.poasAnalytics.predictNetProfit(poas);
                netProfitPredictions.push(prediction.prediction.netProfit);
                confidenceLevels.push(prediction.confidence.percentage);
            } catch (error) {
                netProfitPredictions.push(0);
                confidenceLevels.push(0);
            }
        }

        // Find optimal point
        const maxProfitIndex = netProfitPredictions.indexOf(Math.max(...netProfitPredictions));
        const optimalPOAS = poasRange[maxProfitIndex];

        this.charts[containerId] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: poasRange.map(p => p.toFixed(1)),
                datasets: [{
                    label: 'Förutsagd Nettovinst (SEK)',
                    data: netProfitPredictions,
                    borderColor: this.colors.primary,
                    backgroundColor: this.colors.primary + '20',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }, {
                    label: 'Nuvarande POAS',
                    data: new Array(poasRange.length).fill(null),
                    borderColor: this.colors.warning,
                    backgroundColor: this.colors.warning,
                    borderWidth: 2,
                    pointRadius: 0,
                    showLine: false,
                    // Add vertical line at current POAS
                    pointBackgroundColor: poasRange.map(p => 
                        Math.abs(p - currentPOAS) < 0.05 ? this.colors.warning : 'transparent'
                    ),
                    pointRadius: poasRange.map(p => 
                        Math.abs(p - currentPOAS) < 0.05 ? 8 : 0
                    )
                }, {
                    label: 'Optimal POAS',
                    data: new Array(poasRange.length).fill(null),
                    borderColor: this.colors.success,
                    backgroundColor: this.colors.success,
                    borderWidth: 2,
                    pointRadius: 0,
                    showLine: false,
                    pointBackgroundColor: poasRange.map(p => 
                        Math.abs(p - optimalPOAS) < 0.05 ? this.colors.success : 'transparent'
                    ),
                    pointRadius: poasRange.map(p => 
                        Math.abs(p - optimalPOAS) < 0.05 ? 8 : 0
                    )
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'POAS Optimering - Nettovinst Förutsägelse',
                        font: { size: 16, weight: 'bold' }
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                if (context.datasetIndex === 0) {
                                    return `Nettovinst: ${POASUtils.formatCurrency(context.parsed.y)}`;
                                }
                                return context.dataset.label;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'POAS Värde'
                        },
                        grid: {
                            display: true,
                            color: 'rgba(0,0,0,0.1)'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Nettovinst (SEK)'
                        },
                        ticks: {
                            callback: function(value) {
                                return POASUtils.formatNumber(value, 0);
                            }
                        },
                        grid: {
                            display: true,
                            color: 'rgba(0,0,0,0.1)'
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });

        return this.charts[containerId];
    }

    /**
     * Create Scenario Comparison Chart
     * Compares current vs predicted scenarios
     */
    createScenarioComparisonChart(containerId, currentData, predictions) {
        const ctx = document.getElementById(containerId);
        if (!ctx) return null;

        // Destroy existing chart
        if (this.charts[containerId]) {
            this.charts[containerId].destroy();
        }

        const scenarios = ['Nuvarande', 'POAS 2.5', 'POAS 3.0', 'POAS 3.5', 'POAS 4.0'];
        const netProfits = [
            currentData.avgNetProfit,
            predictions['2.5']?.prediction.netProfit || 0,
            predictions['3.0']?.prediction.netProfit || 0,
            predictions['3.5']?.prediction.netProfit || 0,
            predictions['4.0']?.prediction.netProfit || 0
        ];

        const marketingSpends = [
            currentData.avgMarketingSpend,
            predictions['2.5']?.prediction.marketingSpend || 0,
            predictions['3.0']?.prediction.marketingSpend || 0,
            predictions['3.5']?.prediction.marketingSpend || 0,
            predictions['4.0']?.prediction.marketingSpend || 0
        ];

        this.charts[containerId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: scenarios,
                datasets: [{
                    label: 'Nettovinst (SEK)',
                    data: netProfits,
                    backgroundColor: this.colors.primary + '80',
                    borderColor: this.colors.primary,
                    borderWidth: 2,
                    yAxisID: 'y'
                }, {
                    label: 'Marknadsföring (SEK)',
                    data: marketingSpends,
                    backgroundColor: this.colors.warning + '80',
                    borderColor: this.colors.warning,
                    borderWidth: 2,
                    yAxisID: 'y1'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Scenariojämförelse - Olika POAS Mål',
                        font: { size: 16, weight: 'bold' }
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${POASUtils.formatCurrency(context.parsed.y)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Scenario'
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Nettovinst (SEK)'
                        },
                        ticks: {
                            callback: function(value) {
                                return POASUtils.formatNumber(value, 0);
                            }
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Marknadsföring (SEK)'
                        },
                        ticks: {
                            callback: function(value) {
                                return POASUtils.formatNumber(value, 0);
                            }
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                    }
                }
            }
        });

        return this.charts[containerId];
    }

    /**
     * Create Historical Pattern Analysis Chart
     * Shows seasonal POAS performance and trends
     */
    createHistoricalPatternChart(containerId, historicalData) {
        const ctx = document.getElementById(containerId);
        if (!ctx) return null;

        // Destroy existing chart
        if (this.charts[containerId]) {
            this.charts[containerId].destroy();
        }

        // Prepare data
        const labels = historicalData.map(d => {
            const date = new Date(d.month + '-01');
            return date.toLocaleDateString('sv-SE', { year: 'numeric', month: 'short' });
        });

        const poasData = historicalData.map(d => d.poas);
        const netProfitData = historicalData.map(d => d.netProfit);

        // Calculate trend lines
        const poasTrend = POASUtils.calculateTrend(historicalData, 'poas');
        const trendLine = labels.map((_, index) => {
            return poasTrend.slope * index + (poasData[0] - poasTrend.slope * 0);
        });

        this.charts[containerId] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'POAS Historik',
                    data: poasData,
                    borderColor: this.colors.primary,
                    backgroundColor: this.colors.primary + '20',
                    borderWidth: 3,
                    fill: false,
                    tension: 0.4,
                    yAxisID: 'y'
                }, {
                    label: 'POAS Trend',
                    data: trendLine,
                    borderColor: this.colors.secondary,
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    pointRadius: 0,
                    fill: false,
                    yAxisID: 'y'
                }, {
                    label: 'Nettovinst (SEK)',
                    data: netProfitData,
                    borderColor: this.colors.success,
                    backgroundColor: this.colors.success + '20',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4,
                    yAxisID: 'y1'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Historisk POAS Prestanda & Trender',
                        font: { size: 16, weight: 'bold' }
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Månad'
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'POAS Värde'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Nettovinst (SEK)'
                        },
                        ticks: {
                            callback: function(value) {
                                return POASUtils.formatNumber(value, 0);
                            }
                        },
                        grid: {
                            drawOnChartArea: false,
                        }
                    }
                }
            }
        });

        return this.charts[containerId];
    }

    /**
     * Destroy all charts
     */
    destroyAll() {
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
        this.charts = {};
    }

    /**
     * Destroy specific chart
     */
    destroy(containerId) {
        if (this.charts[containerId]) {
            this.charts[containerId].destroy();
            delete this.charts[containerId];
        }
    }
}

// Global instance
window.poasCharts = new POASCharts();
