/**
 * POAS Analytics - Specialized Charts
 * Advanced charts and visualizations for POAS optimization
 */

// Register Chart.js annotation plugin
if (typeof Chart !== 'undefined' && typeof window.chartjsPluginAnnotation !== 'undefined') {
    Chart.register(window.chartjsPluginAnnotation);
}

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
     * Get chart colors based on current theme
     */
    getChartColors() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

        return {
            background: isDark ? '#1e293b' : '#f8fafc',
            gridColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            textColor: isDark ? '#e2e8f0' : '#0f172a',
            mutedTextColor: isDark ? '#a1a9b8' : '#64748b'
        };
    }

    /**
     * Get theme-aware data colors
     */
    getDataColors() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

        if (isDark) {
            return {
                primary: '#60a5fa',
                success: '#4ade80',
                warning: '#fbbf24',
                danger: '#f87171',
                info: '#38bdf8',
                secondary: '#94a3b8'
            };
        } else {
            return this.colors;
        }
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

        const chartColors = this.getChartColors();
        const dataColors = this.getDataColors();

        this.charts[containerId] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: poasRange.map(p => p.toFixed(1)),
                datasets: [{
                    label: 'Nettovinst',
                    data: netProfitPredictions,
                    borderColor: dataColors.primary,
                    backgroundColor: dataColors.primary + '20',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'POAS Optimeringsanalys',
                        font: { size: 16, weight: 'bold' },
                        color: chartColors.textColor
                    },
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            color: chartColors.textColor
                        }
                    },
                    tooltip: {
                        backgroundColor: chartColors.background,
                        titleColor: chartColors.textColor,
                        bodyColor: chartColors.textColor,
                        borderColor: chartColors.gridColor,
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                if (context.datasetIndex === 0) {
                                    return `Nettovinst: ${POASUtils.formatCurrency(context.parsed.y)}`;
                                }
                                return context.dataset.label;
                            }
                        }
                    },
                    annotation: {
                        annotations: {
                            currentPOAS: {
                                type: 'line',
                                xMin: currentPOAS,
                                xMax: currentPOAS,
                                borderColor: dataColors.warning,
                                borderWidth: 3,
                                borderDash: [5, 5],
                                label: {
                                    content: `Nuvarande: ${currentPOAS.toFixed(1)}`,
                                    enabled: true,
                                    position: 'top',
                                    backgroundColor: dataColors.warning,
                                    color: '#ffffff',
                                    font: {
                                        size: 11,
                                        weight: 'bold'
                                    }
                                }
                            },
                            optimalPOAS: {
                                type: 'line',
                                xMin: optimalPOAS,
                                xMax: optimalPOAS,
                                borderColor: dataColors.success,
                                borderWidth: 3,
                                borderDash: [5, 5],
                                label: {
                                    content: `Optimal: ${optimalPOAS.toFixed(1)}`,
                                    enabled: true,
                                    position: 'top',
                                    backgroundColor: dataColors.success,
                                    color: '#ffffff',
                                    font: {
                                        size: 11,
                                        weight: 'bold'
                                    }
                                }
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'POAS Värde',
                            color: chartColors.textColor
                        },
                        ticks: {
                            color: chartColors.mutedTextColor
                        },
                        grid: {
                            display: true,
                            color: chartColors.gridColor
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Nettovinst (SEK)',
                            color: chartColors.textColor
                        },
                        ticks: {
                            color: chartColors.mutedTextColor,
                            callback: function(value) {
                                return POASUtils.formatNumber(value, 0);
                            }
                        },
                        grid: {
                            display: true,
                            color: chartColors.gridColor
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

        // Extract data with better error handling
        const netProfits = [
            currentData.avgNetProfit || 0,
            predictions['2.5']?.prediction?.netProfit || 0,
            predictions['3.0']?.prediction?.netProfit || 0,
            predictions['3.5']?.prediction?.netProfit || 0,
            predictions['4.0']?.prediction?.netProfit || 0
        ];

        const marketingSpends = [
            currentData.avgMarketingSpend || 0,
            predictions['2.5']?.prediction?.marketingSpend || 0,
            predictions['3.0']?.prediction?.marketingSpend || 0,
            predictions['3.5']?.prediction?.marketingSpend || 0,
            predictions['4.0']?.prediction?.marketingSpend || 0
        ];

        console.log('Scenario chart data:', {
            scenarios,
            netProfits,
            marketingSpends,
            currentData,
            predictions
        });

        // Validate data
        const hasValidData = netProfits.some(val => val > 0) && marketingSpends.some(val => val > 0);
        if (!hasValidData) {
            console.warn('No valid data for scenario chart');
            return null;
        }

        const chartColors = this.getChartColors();
        const dataColors = this.getDataColors();

        this.charts[containerId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: scenarios,
                datasets: [{
                    label: 'Nettovinst (SEK)',
                    data: netProfits,
                    backgroundColor: dataColors.primary + '80',
                    borderColor: dataColors.primary,
                    borderWidth: 2,
                    yAxisID: 'y'
                }, {
                    label: 'Marknadsföring (SEK)',
                    data: marketingSpends,
                    backgroundColor: dataColors.warning + '80',
                    borderColor: dataColors.warning,
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
                        font: { size: 16, weight: 'bold' },
                        color: chartColors.textColor
                    },
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            color: chartColors.textColor
                        }
                    },
                    tooltip: {
                        backgroundColor: chartColors.background,
                        titleColor: chartColors.textColor,
                        bodyColor: chartColors.textColor,
                        borderColor: chartColors.gridColor,
                        borderWidth: 1,
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
                            text: 'Scenario',
                            color: chartColors.textColor
                        },
                        ticks: {
                            color: chartColors.mutedTextColor
                        },
                        grid: {
                            color: chartColors.gridColor
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Nettovinst (SEK)',
                            color: chartColors.textColor
                        },
                        ticks: {
                            color: chartColors.mutedTextColor,
                            callback: function(value) {
                                return POASUtils.formatNumber(value, 0);
                            }
                        },
                        grid: {
                            color: chartColors.gridColor
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Marknadsföring (SEK)',
                            color: chartColors.textColor
                        },
                        ticks: {
                            color: chartColors.mutedTextColor,
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

        const chartColors = this.getChartColors();
        const dataColors = this.getDataColors();

        this.charts[containerId] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'POAS Historik',
                    data: poasData,
                    borderColor: dataColors.primary,
                    backgroundColor: dataColors.primary + '20',
                    borderWidth: 3,
                    fill: false,
                    tension: 0.4,
                    yAxisID: 'y'
                }, {
                    label: 'POAS Trend',
                    data: trendLine,
                    borderColor: dataColors.secondary,
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    pointRadius: 0,
                    fill: false,
                    yAxisID: 'y'
                }, {
                    label: 'Nettovinst (SEK)',
                    data: netProfitData,
                    borderColor: dataColors.success,
                    backgroundColor: dataColors.success + '20',
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
                        font: { size: 16, weight: 'bold' },
                        color: chartColors.textColor
                    },
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            color: chartColors.textColor
                        }
                    },
                    tooltip: {
                        backgroundColor: chartColors.background,
                        titleColor: chartColors.textColor,
                        bodyColor: chartColors.textColor,
                        borderColor: chartColors.gridColor,
                        borderWidth: 1
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Månad',
                            color: chartColors.textColor
                        },
                        ticks: {
                            color: chartColors.mutedTextColor
                        },
                        grid: {
                            color: chartColors.gridColor
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'POAS Värde',
                            color: chartColors.textColor
                        },
                        ticks: {
                            color: chartColors.mutedTextColor
                        },
                        grid: {
                            color: chartColors.gridColor
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Nettovinst (SEK)',
                            color: chartColors.textColor
                        },
                        ticks: {
                            color: chartColors.mutedTextColor,
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
