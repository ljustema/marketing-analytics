// Global variables
let monthlyData = [];
let trendsChart = null;
let simulationChart = null;
let roasChart = null;
let poasChart = null;
let grossMarginPercentChart = null;
let netProfitPercentChart = null;
let marketingPercentChart = null;
let revenueChart = null;
let grossprofitChart = null;
let marketingSpendChart = null;
let nettovinstChart = null;
let lostMarginChart = null;
let marketingShareOfGrossprofitChart = null;
let netProfitPerAdCrownChart = null;
let thresholds = {
    roas: { low: 1.5, high: 2.0 },
    poas: { low: 1.0, high: 1.5 },
    grossMarginPercent: { low: 15, high: 20 },
    netProfitPercent: { low: 5, high: 10 },
    marketingPercent: { low: 10, high: 15 },
    revenue: { low: 50000, high: 100000 },
    grossprofit: { low: 25000, high: 50000 },
    marketingSpend: { low: 10000, high: 25000 },
    nettovinst: { low: 15000, high: 30000 },
    lostMargin: { low: 70, high: 80 },
    marketingShareOfGrossprofit: { low: 30, high: 50 },
    netProfitPerAdCrown: { low: 0.5, high: 1.0 }
};

// Authentication functions
async function checkAuth() {
    try {
        const response = await fetch('api/auth.php');
        const result = await response.json();

        if (!result.logged_in) {
            window.location.href = '/login';
            return false;
        }

        // Update user interface
        document.getElementById('currentUsername').textContent = result.user.username;
        document.getElementById('userMenuName').textContent = result.user.username;

        return true;
    } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '/login';
        return false;
    }
}

async function logout() {
    try {
        const response = await fetch('api/auth.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ action: 'logout' })
        });

        if (response.ok) {
            window.location.href = '/login';
        }
    } catch (error) {
        console.error('Logout failed:', error);
        window.location.href = '/login';
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', async function() {
    // Check authentication first
    const isAuthenticated = await checkAuth();
    if (!isAuthenticated) {
        return;
    }

    await loadData();
    await loadThresholds();
    initializeEventListeners();
    updateAnalytics();
    setDefaultSimulatorValues();
    initializeDarkMode();
    updateFormulaThresholds(); // Initialize formula thresholds
});

// Initialize POAS Analytics system
async function initializePOASAnalytics() {
    try {
        console.log('Initializing POAS Analytics...');
        console.log('Available monthlyData:', monthlyData ? monthlyData.length : 0, 'entries');

        // Ensure data is loaded and processed
        if (!monthlyData || monthlyData.length === 0) {
            console.log('No data available for POAS Analytics');
            const statusElement = document.getElementById('analyticsStatus');
            if (statusElement) {
                statusElement.innerHTML =
                    '<i class="fas fa-exclamation-triangle me-2 text-warning"></i>Ingen data tillgänglig för analys. Lägg till data i Data Manager först.';
            }
            return;
        }

        // Debug: Check if data has all required fields
        const sampleData = monthlyData[0];
        console.log('Sample data structure:', Object.keys(sampleData));
        console.log('Sample data values:', sampleData);

        // Initialize the analytics system
        if (!window.poasAnalytics) {
            window.poasAnalytics = new POASAnalytics();
        }

        // Initialize with current data
        await window.poasAnalytics.initialize();

        // Initialize the interface
        if (!window.poasInterface) {
            window.poasInterface = new POASInterface();
        }

        if (!window.poasInterface.isInitialized) {
            await window.poasInterface.initialize();
        }

        console.log('POAS Analytics initialized successfully');

        // Test a prediction to verify everything is working
        try {
            const testPrediction = window.poasAnalytics.predictNetProfit(2.4);
            console.log('Test prediction for POAS 2.4:', testPrediction);
        } catch (testError) {
            console.warn('Test prediction failed:', testError);
        }

    } catch (error) {
        console.error('Error initializing POAS Analytics:', error);
        console.error('Error stack:', error.stack);

        // Show error in the interface
        const statusElement = document.getElementById('analyticsStatus');
        if (statusElement) {
            statusElement.innerHTML =
                '<i class="fas fa-exclamation-triangle me-2 text-danger"></i>Fel vid initialisering av analysmotor: ' + error.message;
        }
    }
}

// Load data from CSV via API
async function loadData() {
    try {
        const response = await fetch('api/data.php');
        if (response.ok) {
            monthlyData = await response.json();
            if (Array.isArray(monthlyData)) {
                monthlyData = monthlyData.map(row => {
                    // Ensure all values are properly parsed as numbers
                    const revenue = parseFloat(row.revenue) || 0;
                    const grossprofit = parseFloat(row.grossprofit) || 0;
                    const marketingSpend = parseFloat(row.marketingSpend || row.marknadsföring) || 0;
                    
                    // Calculate metrics
                    const roas = marketingSpend ? revenue / marketingSpend : 0;
                    const poas = marketingSpend ? grossprofit / marketingSpend : 0;
                    const grossMarginPercent = revenue ? (grossprofit / revenue) * 100 : 0;
                    const marketingPercent = revenue ? (marketingSpend / revenue) * 100 : 0;
                    const netProfit = grossprofit - marketingSpend;
                    const netProfitPercent = revenue ? (netProfit / revenue) * 100 : 0;
                    const poasRoasRatio = roas ? poas / roas : 0;

                    return {
                        month: row.month,
                        revenue: revenue,
                        grossprofit: grossprofit,
                        marketingSpend: marketingSpend,
                        roas: roas,
                        poas: poas,
                        grossMarginPercent: grossMarginPercent,
                        marketingPercent: marketingPercent,
                        netProfit: netProfit,
                        netProfitPercent: netProfitPercent,
                        poasRoasRatio: poasRoasRatio
                    };
                });
            } else {
                monthlyData = [];
            }
        } else {
            console.error('Failed to load data:', response.status);
            monthlyData = [];
        }
    } catch (error) {
        console.error('Error loading data:', error);
        monthlyData = [];
    }
    updateDataTable();
    updateAnalytics();
    updateTrendsChart();
    updateIndividualCharts();
}

// Load thresholds from JSON file via API
async function loadThresholds() {
    try {
        const response = await fetch('api/thresholds.php');
        if (response.ok) {
            const savedThresholds = await response.json();
            // Merge saved thresholds with defaults to ensure all properties exist
            thresholds = {
                ...thresholds,
                ...savedThresholds,
                // Ensure netProfitPercent exists with defaults if not in saved data
                netProfitPercent: savedThresholds.netProfitPercent || { low: 5, high: 10 },
                // Ensure nettovinst exists with defaults if not in saved data
                nettovinst: savedThresholds.nettovinst || { low: 15000, high: 30000 },
                // Ensure lostMargin exists with defaults if not in saved data
                lostMargin: savedThresholds.lostMargin || { low: 70, high: 80 },
                // Ensure new metrics exist with defaults if not in saved data
                marketingShareOfGrossprofit: savedThresholds.marketingShareOfGrossprofit || { low: 30, high: 50 },
                netProfitPerAdCrown: savedThresholds.netProfitPerAdCrown || { low: 0.5, high: 1.0 }
            };
            // Update form with saved thresholds
            document.getElementById('roasThresholdLow').value = thresholds.roas.low;
            document.getElementById('roasThresholdHigh').value = thresholds.roas.high;
            document.getElementById('poasThresholdLow').value = thresholds.poas.low;
            document.getElementById('poasThresholdHigh').value = thresholds.poas.high;
            document.getElementById('grossMarginPercentThresholdLow').value = thresholds.grossMarginPercent.low;
            document.getElementById('grossMarginPercentThresholdHigh').value = thresholds.grossMarginPercent.high;
            document.getElementById('netProfitPercentThresholdLow').value = thresholds.netProfitPercent?.low || 5;
            document.getElementById('netProfitPercentThresholdHigh').value = thresholds.netProfitPercent?.high || 10;
            document.getElementById('marketingPercentThresholdLow').value = thresholds.marketingPercent.low;
            document.getElementById('marketingPercentThresholdHigh').value = thresholds.marketingPercent.high;
            document.getElementById('revenueThresholdLow').value = thresholds.revenue.low;
            document.getElementById('revenueThresholdHigh').value = thresholds.revenue.high;
            document.getElementById('grossprofitThresholdLow').value = thresholds.grossprofit.low;
            document.getElementById('grossprofitThresholdHigh').value = thresholds.grossprofit.high;
            document.getElementById('marketingSpendThresholdLow').value = thresholds.marketingSpend.low;
            document.getElementById('marketingSpendThresholdHigh').value = thresholds.marketingSpend.high;
            document.getElementById('nettovinstThresholdLow').value = thresholds.nettovinst?.low || 15000;
            document.getElementById('nettovinstThresholdHigh').value = thresholds.nettovinst?.high || 30000;
            document.getElementById('lostMarginThresholdLow').value = thresholds.lostMargin?.low || 70;
            document.getElementById('lostMarginThresholdHigh').value = thresholds.lostMargin?.high || 80;
            document.getElementById('marketingShareOfGrossprofitThresholdLow').value = thresholds.marketingShareOfGrossprofit?.low || 30;
            document.getElementById('marketingShareOfGrossprofitThresholdHigh').value = thresholds.marketingShareOfGrossprofit?.high || 50;
            document.getElementById('netProfitPerAdCrownThresholdLow').value = thresholds.netProfitPerAdCrown?.low || 0.5;
            document.getElementById('netProfitPerAdCrownThresholdHigh').value = thresholds.netProfitPerAdCrown?.high || 1.0;
        }
    } catch (error) {
        console.error('Error loading thresholds:', error);
        // Keep default thresholds if loading fails
    }
    // Update formula thresholds after loading
    updateFormulaThresholds();
}

// Save data to CSV via PHP API
async function saveData(newData) {
    try {
        const response = await fetch('api/data.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newData)
        });
        if (!response.ok) {
            throw new Error('Failed to save data');
        }
        return await response.json();
    } catch (error) {
        console.error('Error saving data:', error);
        throw error;
    }
}

// Save thresholds to JSON file via API
async function saveThresholds() {
    try {
        const response = await fetch('api/thresholds.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(thresholds)
        });
        if (!response.ok) {
            throw new Error('Failed to save thresholds');
        }
        return await response.json();
    } catch (error) {
        console.error('Error saving thresholds:', error);
        throw error;
    }
}

// CSV Download/Upload Functions
function downloadCSVTemplate() {
    // Create CSV content with sample data
    const csvContent = `month,revenue,grossprofit,marketingSpend
2024-01,100000,40000,15000
2024-02,120000,48000,18000
2024-03,110000,44000,16000`;

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'marketing_data_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showAlert('CSV-mall har laddats ner. Redigera filen och ladda upp den igen.', 'success');
}

async function handleCSVUpload() {
    const fileInput = document.getElementById('csvFileInput');
    const file = fileInput.files[0];
    if (!file) {
        showAlert('Välj en CSV-fil först.', 'warning');
        return;
    }

    let statusDiv = document.getElementById('csvUploadStatus');
    if (!statusDiv) {
        console.error('csvUploadStatus element not found, creating one');
        // Create the status div if it doesn't exist
        statusDiv = document.createElement('div');
        statusDiv.id = 'csvUploadStatus';
        statusDiv.className = 'alert';
        statusDiv.style.display = 'none';

        // Try to insert it after the CSV upload button
        const uploadButton = document.getElementById('csvUploadButton');
        if (uploadButton && uploadButton.parentNode) {
            uploadButton.parentNode.insertBefore(statusDiv, uploadButton.nextSibling);
        } else {
            // Fallback: just show an alert
            showAlert('CSV upload status element not found. Please refresh the page.', 'warning');
            return;
        }
    }
    statusDiv.style.display = 'block';
    statusDiv.className = 'alert alert-info';
    statusDiv.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Laddar upp CSV-fil...';

    try {
        const text = await file.text();
        const lines = text.trim().split('\n');

        if (lines.length < 2) {
            throw new Error('CSV-filen måste innehålla minst en rubrikrad och en datarad');
        }

        // Parse header
        const header = lines[0].split(',').map(col => col.trim());
        const expectedColumns = ['month', 'revenue', 'grossprofit', 'marketingSpend'];

        // Validate header
        for (const col of expectedColumns) {
            if (!header.includes(col)) {
                throw new Error(`Saknad kolumn: ${col}. Förväntade kolumner: ${expectedColumns.join(', ')}`);
            }
        }

        // Parse data for bulk upload
        const bulkData = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(val => val.trim());
            if (values.length !== header.length) continue;

            const rowData = {};
            header.forEach((col, index) => {
                rowData[col] = values[index];
            });

            // Validate and convert data
            const monthData = {
                month: rowData.month,
                revenue: parseFloat(rowData.revenue) || 0,
                grossprofit: parseFloat(rowData.grossprofit) || 0,
                marketingSpend: parseFloat(rowData.marketingSpend) || 0
            };

            bulkData.push(monthData);
        }

        // Upload all data in one request
        const response = await fetch('api/data.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'bulk_upload',
                data: bulkData
            })
        });

        if (!response.ok) {
            throw new Error('Failed to upload CSV data');
        }

        const result = await response.json();
        const successCount = result.successCount || 0;
        const errorCount = result.errorCount || 0;

        // Update UI
        await loadData();
        updateDataTable();
        updateAnalytics();

        // Show results
        if (errorCount === 0) {
            statusDiv.className = 'alert alert-success';
            statusDiv.innerHTML = `<i class="fas fa-check me-2"></i>Framgångsrikt! ${successCount} rader importerade.`;
        } else {
            statusDiv.className = 'alert alert-warning';
            statusDiv.innerHTML = `<i class="fas fa-exclamation-triangle me-2"></i>Delvis framgång: ${successCount} rader importerade, ${errorCount} fel.`;
        }

        // Clear file input and disable button
        fileInput.value = '';
        document.getElementById('csvUploadButton').disabled = true;

    } catch (error) {
        console.error('CSV upload error:', error);
        statusDiv.className = 'alert alert-danger';
        statusDiv.innerHTML = `<i class="fas fa-times me-2"></i>Fel: ${error.message}`;
    }
}

// Initialize event listeners
function initializeEventListeners() {
    // Data form submission
    document.getElementById('dataForm').addEventListener('submit', handleDataSubmission);

    // Threshold form submission
    document.getElementById('thresholdForm').addEventListener('submit', handleThresholdUpdate);

    // CSV file input change
    document.getElementById('csvFileInput').addEventListener('change', function(event) {
        const uploadButton = document.getElementById('csvUploadButton');
        uploadButton.disabled = !event.target.files[0];
    });
    
    // Chart control checkboxes
    document.getElementById('showROAS').addEventListener('change', updateTrendsChart);
    document.getElementById('showPOAS').addEventListener('change', updateTrendsChart);
    document.getElementById('showLostMargin').addEventListener('change', updateTrendsChart);
    document.getElementById('showMarketingShareOfGrossprofit').addEventListener('change', updateTrendsChart);
    document.getElementById('showNetProfitPerAdCrown').addEventListener('change', updateTrendsChart);
    document.getElementById('showgrossMarginPercent').addEventListener('change', updateTrendsChart);
    document.getElementById('showNetProfitPercent').addEventListener('change', updateTrendsChart);
    document.getElementById('showMarketingPercent').addEventListener('change', updateTrendsChart);
    document.getElementById('showrevenue').addEventListener('change', updateTrendsChart);
    document.getElementById('showgrossprofit').addEventListener('change', updateTrendsChart);
    document.getElementById('showMarknadsföring').addEventListener('change', updateTrendsChart);
    document.getElementById('showNettovinst').addEventListener('change', updateTrendsChart);

    // Period selection
    document.getElementById('analysisPeriod').addEventListener('change', updateAnalytics);
    
    // Tab change event
    document.querySelectorAll('[data-bs-toggle="tab"]').forEach(tab => {
        tab.addEventListener('shown.bs.tab', function(event) {
            if (event.target.id === 'analytics-tab') {
                setTimeout(() => {
                    updateTrendsChart();
                    updateIndividualCharts();
                }, 100);
            } else if (event.target.id === 'predictive-analytics-tab') {
                // Initialize POAS Analytics when tab is shown
                setTimeout(async () => {
                    await initializePOASAnalytics();
                }, 100);
            }
        });
    });
}

// Handle data form submission
async function handleDataSubmission(event) {
    event.preventDefault();
    
    const month = document.getElementById('monthInput').value;
    const revenue = parseFloat(document.getElementById('revenueInput').value);
    const grossprofit = parseFloat(document.getElementById('grossprofitInput').value);
    const marketingSpend = parseFloat(document.getElementById('marketingSpendInput').value);
    
    // Validation
    if (!month || revenue < 0 || grossprofit < 0 || marketingSpend < 0) {
        showAlert('Vänligen fyll i alla fält med giltiga värden.', 'danger');
        return;
    }
    
    if (grossprofit > revenue) {
        showAlert('Bruttovinst efter produkt och frakt kan inte vara högre än omsättning.', 'warning');
        return;
    }
    
    const newData = {
        month: month,
        revenue: revenue,
        grossprofit: grossprofit,
        marketingSpend: marketingSpend
    };
    
    try {
        await saveData(newData);
        showAlert('Data för ' + formatMonth(month) + ' har sparats.', 'success');
        await loadData();
        updateAnalytics();
        document.getElementById('dataForm').reset();
    } catch (error) {
        showAlert('Ett fel uppstod när data skulle sparas.', 'danger');
    }
}

// Handle threshold form submission
async function handleThresholdUpdate(event) {
    event.preventDefault();

    thresholds.roas.low = parseFloat(document.getElementById('roasThresholdLow').value);
    thresholds.roas.high = parseFloat(document.getElementById('roasThresholdHigh').value);
    thresholds.poas.low = parseFloat(document.getElementById('poasThresholdLow').value);
    thresholds.poas.high = parseFloat(document.getElementById('poasThresholdHigh').value);
    thresholds.grossMarginPercent.low = parseFloat(document.getElementById('grossMarginPercentThresholdLow').value);
    thresholds.grossMarginPercent.high = parseFloat(document.getElementById('grossMarginPercentThresholdHigh').value);
    thresholds.netProfitPercent.low = parseFloat(document.getElementById('netProfitPercentThresholdLow').value);
    thresholds.netProfitPercent.high = parseFloat(document.getElementById('netProfitPercentThresholdHigh').value);
    thresholds.marketingPercent.low = parseFloat(document.getElementById('marketingPercentThresholdLow').value);
    thresholds.marketingPercent.high = parseFloat(document.getElementById('marketingPercentThresholdHigh').value);
    thresholds.revenue.low = parseFloat(document.getElementById('revenueThresholdLow').value);
    thresholds.revenue.high = parseFloat(document.getElementById('revenueThresholdHigh').value);
    thresholds.grossprofit.low = parseFloat(document.getElementById('grossprofitThresholdLow').value);
    thresholds.grossprofit.high = parseFloat(document.getElementById('grossprofitThresholdHigh').value);
    thresholds.marketingSpend.low = parseFloat(document.getElementById('marketingSpendThresholdLow').value);
    thresholds.marketingSpend.high = parseFloat(document.getElementById('marketingSpendThresholdHigh').value);
    thresholds.nettovinst.low = parseFloat(document.getElementById('nettovinstThresholdLow').value);
    thresholds.nettovinst.high = parseFloat(document.getElementById('nettovinstThresholdHigh').value);
    thresholds.lostMargin.low = parseFloat(document.getElementById('lostMarginThresholdLow').value);
    thresholds.lostMargin.high = parseFloat(document.getElementById('lostMarginThresholdHigh').value);
    thresholds.marketingShareOfGrossprofit.low = parseFloat(document.getElementById('marketingShareOfGrossprofitThresholdLow').value);
    thresholds.marketingShareOfGrossprofit.high = parseFloat(document.getElementById('marketingShareOfGrossprofitThresholdHigh').value);
    thresholds.netProfitPerAdCrown.low = parseFloat(document.getElementById('netProfitPerAdCrownThresholdLow').value);
    thresholds.netProfitPerAdCrown.high = parseFloat(document.getElementById('netProfitPerAdCrownThresholdHigh').value);

    try {
        await saveThresholds();
        updateDataTable(); // Refresh table to show updated status indicators
        updateAnalytics(); // Refresh all charts with new thresholds
        updateFormulaThresholds(); // Update formula page with new thresholds
        showAlert('Tröskelvärden har uppdaterats och sparats.', 'success');
    } catch (error) {
        showAlert('Ett fel uppstod när tröskelvärden skulle sparas.', 'danger');
    }
}

// Update data table
function updateDataTable() {
    const tbody = document.querySelector('#dataTable tbody');
    const noDataMessage = document.getElementById('noDataMessage');
    
    if (monthlyData.length === 0) {
        tbody.innerHTML = '';
        noDataMessage.style.display = 'block';
        return;
    }
    
    noDataMessage.style.display = 'none';

    // Sort data by month in descending order (newest first)
    const sortedData = [...monthlyData].sort((a, b) => {
        return new Date(b.month + '-01') - new Date(a.month + '-01');
    });

    tbody.innerHTML = sortedData.map((data) => {
        // Find original index for delete function
        const originalIndex = monthlyData.findIndex(item => item.month === data.month);
        // Ensure all required properties exist and are numbers
        const row = {
            month: data.month || '',
            revenue: parseFloat(data.revenue) || 0,
            grossprofit: parseFloat(data.grossprofit) || 0,
            marketingSpend: parseFloat(data.marketingSpend || data.marknadsföring) || 0
        };
        
        // Calculate metrics if not already present
        const roas = row.marketingSpend ? row.revenue / row.marketingSpend : 0;
        const poas = row.marketingSpend ? row.grossprofit / row.marketingSpend : 0;
        const grossMarginPercent = row.revenue ? (row.grossprofit / row.revenue) * 100 : 0;
        const marketingPercent = row.revenue ? (row.marketingSpend / row.revenue) * 100 : 0;
        
        return `
            <tr>
                <td><strong>${formatMonth(row.month)}</strong></td>
                <td>${formatCurrency(row.revenue)}</td>
                <td>${formatCurrency(row.grossprofit)}</td>
                <td>${formatCurrency(row.marketingSpend)}</td>
                <td class="${getStatusClass(roas, thresholds.roas)}">${roas.toFixed(2)}</td>
                <td class="${getStatusClass(poas, thresholds.poas)}">${poas.toFixed(2)}</td>
                <td class="${getStatusClass(grossMarginPercent, thresholds.grossMarginPercent)}">${grossMarginPercent.toFixed(1)}%</td>
                <td>${marketingPercent.toFixed(1)}%</td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="deleteData(${originalIndex})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Delete data entry
async function deleteData(index) {
    if (confirm('Är du säker på att du vill ta bort denna post?')) {
        const month = monthlyData[index].month;
        try {
            const response = await fetch(`api/data.php?month=${month}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                showAlert('Data har tagits bort.', 'success');
                await loadData();
                updateAnalytics();
            } else {
                throw new Error('Failed to delete data');
            }
        } catch (error) {
            showAlert('Ett fel uppstod när data skulle tas bort.', 'danger');
        }
    }
}

// Filter data by selected period
function getFilteredData() {
    const period = document.getElementById('analysisPeriod').value;
    const now = new Date();

    if (period === 'all') {
        return monthlyData;
    }

    return monthlyData.filter(data => {
        const dataDate = new Date(data.month + '-01');

        switch (period) {
            case 'currentYear':
                return dataDate.getFullYear() === now.getFullYear();
            case 'lastYear':
                return dataDate.getFullYear() === now.getFullYear() - 1;
            case 'last3Months':
                const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
                return dataDate >= threeMonthsAgo;
            case 'last6Months':
                const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
                return dataDate >= sixMonthsAgo;
            default:
                return true;
        }
    });
}

// Get comparison period data
function getComparisonData() {
    const period = document.getElementById('analysisPeriod').value;
    const now = new Date();

    if (period === 'all') {
        return []; // No comparison for "all time"
    }

    return monthlyData.filter(data => {
        const dataDate = new Date(data.month + '-01');

        switch (period) {
            case 'currentYear':
                return dataDate.getFullYear() === now.getFullYear() - 1;
            case 'lastYear':
                return dataDate.getFullYear() === now.getFullYear() - 2;
            case 'last3Months':
                const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
                const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
                return dataDate >= sixMonthsAgo && dataDate < threeMonthsAgo;
            case 'last6Months':
                const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 12, 1);
                const sixMonthsAgoEnd = new Date(now.getFullYear(), now.getMonth() - 6, 1);
                return dataDate >= twelveMonthsAgo && dataDate < sixMonthsAgoEnd;
            default:
                return false;
        }
    });
}

// Update analytics dashboard
function updateAnalytics() {
    const filteredData = getFilteredData();
    const comparisonData = getComparisonData();

    if (filteredData.length === 0) {
        // Clear first row cards
        document.getElementById('avgROAS').textContent = '-';
        document.getElementById('avgPOAS').textContent = '-';
        document.getElementById('avggrossMarginPercent').textContent = '-';
        document.getElementById('avgNetProfitPercent').textContent = '-';
        document.getElementById('avgMarketingPercent').textContent = '-';
        document.getElementById('avgNetProfit').textContent = '-';

        // Clear second row cards
        document.getElementById('avgRevenue').textContent = '-';
        document.getElementById('avgGrossprofit').textContent = '-';
        document.getElementById('avgMarketingSpend').textContent = '-';
        document.getElementById('avgLostMargin').textContent = '-';
        document.getElementById('avgMarketingShareOfGrossprofit').textContent = '-';
        document.getElementById('avgNetProfitPerAdCrown').textContent = '-';

        // Clear comparison texts - first row
        document.getElementById('roasComparison').textContent = '-';
        document.getElementById('poasComparison').textContent = '-';
        document.getElementById('grossMarginPercentComparison').textContent = '-';
        document.getElementById('netProfitPercentComparison').textContent = '-';
        document.getElementById('marketingPercentComparison').textContent = '-';
        document.getElementById('netProfitComparison').textContent = '-';

        // Clear comparison texts - second row
        document.getElementById('revenueComparison').textContent = '-';
        document.getElementById('grossprofitComparison').textContent = '-';
        document.getElementById('marketingSpendComparison').textContent = '-';
        document.getElementById('lostMarginComparison').textContent = '-';
        document.getElementById('marketingShareOfGrossprofitComparison').textContent = '-';
        document.getElementById('netProfitPerAdCrownComparison').textContent = '-';
        return;
    }

    // Calculate averages - first row
    const avgROAS = filteredData.reduce((sum, data) => sum + data.roas, 0) / filteredData.length;
    const avgPOAS = filteredData.reduce((sum, data) => sum + data.poas, 0) / filteredData.length;
    const avggrossMarginPercent = filteredData.reduce((sum, data) => sum + data.grossMarginPercent, 0) / filteredData.length;
    const avgNetProfitPercent = filteredData.reduce((sum, data) => sum + data.netProfitPercent, 0) / filteredData.length;
    const avgMarketingPercent = filteredData.reduce((sum, data) => sum + data.marketingPercent, 0) / filteredData.length;
    const avgNetProfit = filteredData.reduce((sum, data) => {
        const netProfit = data.grossprofit - data.marketingSpend;
        return sum + netProfit;
    }, 0) / filteredData.length;

    // Calculate averages - second row
    const avgRevenue = filteredData.reduce((sum, data) => sum + data.revenue, 0) / filteredData.length;
    const avgGrossprofit = filteredData.reduce((sum, data) => sum + data.grossprofit, 0) / filteredData.length;
    const avgMarketingSpend = filteredData.reduce((sum, data) => sum + data.marketingSpend, 0) / filteredData.length;
    const avgLostMargin = filteredData.reduce((sum, data) => {
        if (data.roas === 0) return sum;
        return sum + ((data.roas - data.poas) / data.roas) * 100;
    }, 0) / filteredData.length;
    const avgMarketingShareOfGrossprofit = filteredData.reduce((sum, data) => {
        if (data.grossprofit === 0) return sum;
        return sum + (data.marketingSpend / data.grossprofit) * 100;
    }, 0) / filteredData.length;
    const avgNetProfitPerAdCrown = filteredData.reduce((sum, data) => {
        if (data.marketingSpend === 0) return sum;
        const netProfit = data.grossprofit - data.marketingSpend;
        return sum + (netProfit / data.marketingSpend);
    }, 0) / filteredData.length;

    // Update display - first row
    document.getElementById('avgROAS').textContent = avgROAS.toFixed(2);
    document.getElementById('avgPOAS').textContent = avgPOAS.toFixed(2);
    document.getElementById('avggrossMarginPercent').textContent = avggrossMarginPercent.toFixed(1) + '%';
    document.getElementById('avgNetProfitPercent').textContent = avgNetProfitPercent.toFixed(1) + '%';
    document.getElementById('avgMarketingPercent').textContent = avgMarketingPercent.toFixed(1) + '%';
    document.getElementById('avgNetProfit').textContent = formatCurrency(avgNetProfit);

    // Update display - second row
    document.getElementById('avgRevenue').textContent = formatCurrency(avgRevenue);
    document.getElementById('avgGrossprofit').textContent = formatCurrency(avgGrossprofit);
    document.getElementById('avgMarketingSpend').textContent = formatCurrency(avgMarketingSpend);
    document.getElementById('avgLostMargin').textContent = avgLostMargin.toFixed(1) + '%';
    document.getElementById('avgMarketingShareOfGrossprofit').textContent = avgMarketingShareOfGrossprofit.toFixed(1) + '%';
    document.getElementById('avgNetProfitPerAdCrown').textContent = avgNetProfitPerAdCrown.toFixed(2);

    // Update comparisons
    if (comparisonData.length > 0) {
        // Calculate comparison averages - first row
        const compAvgROAS = comparisonData.reduce((sum, data) => sum + data.roas, 0) / comparisonData.length;
        const compAvgPOAS = comparisonData.reduce((sum, data) => sum + data.poas, 0) / comparisonData.length;
        const compAvggrossMarginPercent = comparisonData.reduce((sum, data) => sum + data.grossMarginPercent, 0) / comparisonData.length;
        const compAvgNetProfitPercent = comparisonData.reduce((sum, data) => sum + data.netProfitPercent, 0) / comparisonData.length;
        const compAvgMarketingPercent = comparisonData.reduce((sum, data) => sum + data.marketingPercent, 0) / comparisonData.length;
        const compAvgNetProfit = comparisonData.reduce((sum, data) => {
            const netProfit = data.grossprofit - data.marketingSpend;
            return sum + netProfit;
        }, 0) / comparisonData.length;

        // Calculate comparison averages - second row
        const compAvgRevenue = comparisonData.reduce((sum, data) => sum + data.revenue, 0) / comparisonData.length;
        const compAvgGrossprofit = comparisonData.reduce((sum, data) => sum + data.grossprofit, 0) / comparisonData.length;
        const compAvgMarketingSpend = comparisonData.reduce((sum, data) => sum + data.marketingSpend, 0) / comparisonData.length;
        const compAvgLostMargin = comparisonData.reduce((sum, data) => {
            if (data.roas === 0) return sum;
            return sum + ((data.roas - data.poas) / data.roas) * 100;
        }, 0) / comparisonData.length;
        const compAvgMarketingShareOfGrossprofit = comparisonData.reduce((sum, data) => {
            if (data.grossprofit === 0) return sum;
            return sum + (data.marketingSpend / data.grossprofit) * 100;
        }, 0) / comparisonData.length;
        const compAvgNetProfitPerAdCrown = comparisonData.reduce((sum, data) => {
            if (data.marketingSpend === 0) return sum;
            const netProfit = data.grossprofit - data.marketingSpend;
            return sum + (netProfit / data.marketingSpend);
        }, 0) / comparisonData.length;

        // Update comparison displays - first row
        document.getElementById('roasComparison').innerHTML = getComparisonText(avgROAS, compAvgROAS, ' %-enheter');
        document.getElementById('poasComparison').innerHTML = getComparisonText(avgPOAS, compAvgPOAS, ' %-enheter');
        document.getElementById('grossMarginPercentComparison').innerHTML = getComparisonText(avggrossMarginPercent, compAvggrossMarginPercent, ' %-enheter');
        document.getElementById('netProfitPercentComparison').innerHTML = getComparisonText(avgNetProfitPercent, compAvgNetProfitPercent, ' %-enheter');
        document.getElementById('marketingPercentComparison').innerHTML = getComparisonText(avgMarketingPercent, compAvgMarketingPercent, ' %-enheter', true);
        document.getElementById('netProfitComparison').innerHTML = getComparisonText(avgNetProfit, compAvgNetProfit, ' kr');

        // Update comparison displays - second row
        document.getElementById('revenueComparison').innerHTML = getComparisonText(avgRevenue, compAvgRevenue, ' kr');
        document.getElementById('grossprofitComparison').innerHTML = getComparisonText(avgGrossprofit, compAvgGrossprofit, ' kr');
        document.getElementById('marketingSpendComparison').innerHTML = getComparisonText(avgMarketingSpend, compAvgMarketingSpend, ' kr', true);
        document.getElementById('lostMarginComparison').innerHTML = getComparisonText(avgLostMargin, compAvgLostMargin, ' %-enheter', true);
        document.getElementById('marketingShareOfGrossprofitComparison').innerHTML = getComparisonText(avgMarketingShareOfGrossprofit, compAvgMarketingShareOfGrossprofit, ' %-enheter', true);
        document.getElementById('netProfitPerAdCrownComparison').innerHTML = getComparisonText(avgNetProfitPerAdCrown, compAvgNetProfitPerAdCrown, ' %-enheter');
    } else {
        // Clear comparison displays - first row
        document.getElementById('roasComparison').textContent = '-';
        document.getElementById('poasComparison').textContent = '-';
        document.getElementById('grossMarginPercentComparison').textContent = '-';
        document.getElementById('netProfitPercentComparison').textContent = '-';
        document.getElementById('marketingPercentComparison').textContent = '-';
        document.getElementById('netProfitComparison').textContent = '-';

        // Clear comparison displays - second row
        document.getElementById('revenueComparison').textContent = '-';
        document.getElementById('grossprofitComparison').textContent = '-';
        document.getElementById('marketingSpendComparison').textContent = '-';
        document.getElementById('lostMarginComparison').textContent = '-';
        document.getElementById('marketingShareOfGrossprofitComparison').textContent = '-';
        document.getElementById('netProfitPerAdCrownComparison').textContent = '-';
    }

    updateTrendsChart();
    updateIndividualCharts();
}

// Generate comparison text with appropriate styling
function getComparisonText(current, previous, suffix = '', isLowerBetter = false) {
    const diff = current - previous;
    const percentChange = (diff / previous) * 100;
    const isPositive = diff > 0;
    const isBetter = isLowerBetter ? !isPositive : isPositive;

    const arrow = isPositive ? '↗' : '↘';
    const color = isBetter ? 'text-success' : 'text-danger';
    const sign = isPositive ? '+' : '';

    // Handle currency and percentage unit formatting
    let diffText;
    if (suffix === ' kr' || suffix === ' SEK') {
        diffText = new Intl.NumberFormat('sv-SE', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(Math.abs(diff)) + ' kr';
    } else if (suffix === ' %-enheter') {
        diffText = Math.abs(diff).toFixed(1) + ' %-enheter';
    } else {
        diffText = Math.abs(diff).toFixed(suffix === '%' ? 1 : 2) + suffix;
    }

    return `<span class="${color}">${arrow} ${sign}${diffText} (${sign}${percentChange.toFixed(1)}%)</span>`;
}

// Update trends chart
function updateTrendsChart() {
    const ctx = document.getElementById('trendsChart');
    if (!ctx) return;

    if (trendsChart) {
        trendsChart.destroy();
    }

    const filteredData = getFilteredData();
    if (filteredData.length === 0) return;
    
    const showROAS = document.getElementById('showROAS').checked;
    const showPOAS = document.getElementById('showPOAS').checked;
    const showLostMargin = document.getElementById('showLostMargin').checked;
    const showMarketingShareOfGrossprofit = document.getElementById('showMarketingShareOfGrossprofit').checked;
    const showNetProfitPerAdCrown = document.getElementById('showNetProfitPerAdCrown').checked;
    const showgrossMarginPercent = document.getElementById('showgrossMarginPercent').checked;
    const showNetProfitPercent = document.getElementById('showNetProfitPercent').checked;
    const showMarketingPercent = document.getElementById('showMarketingPercent').checked;
    const showrevenue = document.getElementById('showrevenue').checked;
    const showgrossprofit = document.getElementById('showgrossprofit').checked;
    const showmarketingSpend = document.getElementById('showMarknadsföring').checked;
    const showNettovinst = document.getElementById('showNettovinst').checked;
    
    const labels = filteredData.map(data => formatMonth(data.month));
    const datasets = [];

    if (showROAS) {
        datasets.push({
            label: 'ROAS',
            data: filteredData.map(data => data.roas),
            borderColor: 'rgb(37, 99, 235)',
            backgroundColor: 'rgba(37, 99, 235, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            yAxisID: 'y'
        });
    }

    if (showPOAS) {
        datasets.push({
            label: 'POAS',
            data: filteredData.map(data => data.poas),
            borderColor: 'rgb(22, 163, 74)',
            backgroundColor: 'rgba(22, 163, 74, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            yAxisID: 'y'
        });
    }
    
    if (showLostMargin) {
        datasets.push({
            label: 'Förlorad marginal (%)',
            data: filteredData.map(data => {
                // Calculate lost margin: ((ROAS - POAS) / ROAS) × 100
                if (data.roas === 0) return 0;
                return ((data.roas - data.poas) / data.roas) * 100;
            }),
            borderColor: 'rgb(239, 68, 68)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            yAxisID: 'y1'
        });
    }

    if (showMarketingShareOfGrossprofit) {
        datasets.push({
            label: 'Marknadsföringens andel av bruttovinsten (%)',
            data: filteredData.map(data => {
                // Calculate marketing share of gross profit: (Marketing / Gross Profit) × 100
                if (data.grossprofit === 0) return 0;
                return (data.marketingSpend / data.grossprofit) * 100;
            }),
            borderColor: 'rgb(168, 85, 247)',
            backgroundColor: 'rgba(168, 85, 247, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            yAxisID: 'y1'
        });
    }

    if (showNetProfitPerAdCrown) {
        datasets.push({
            label: 'Nettovinst per annonskrona',
            data: filteredData.map(data => {
                // Calculate net profit per ad crown: (Gross Profit - Marketing) / Marketing
                if (data.marketingSpend === 0) return 0;
                const netProfit = data.grossprofit - data.marketingSpend;
                return netProfit / data.marketingSpend;
            }),
            borderColor: 'rgb(14, 165, 233)',
            backgroundColor: 'rgba(14, 165, 233, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            yAxisID: 'y'
        });
    }

    if (showgrossMarginPercent) {
        datasets.push({
            label: 'Bruttovinst (%)',
            data: filteredData.map(data => data.grossMarginPercent),
            borderColor: 'rgb(234, 179, 8)',
            backgroundColor: 'rgba(234, 179, 8, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            yAxisID: 'y1'
        });
    }

    if (showNetProfitPercent) {
        datasets.push({
            label: 'Nettovinst (%)',
            data: filteredData.map(data => data.netProfitPercent),
            borderColor: 'rgb(220, 38, 127)',
            backgroundColor: 'rgba(220, 38, 127, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            yAxisID: 'y1'
        });
    }

    if (showMarketingPercent) {
        datasets.push({
            label: 'Marknadsföring (%)',
            data: filteredData.map(data => data.marketingPercent),
            borderColor: 'rgb(14, 165, 233)',
            backgroundColor: 'rgba(14, 165, 233, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            yAxisID: 'y1'
        });
    }

    if (showrevenue) {
        datasets.push({
            label: 'Omsättning (SEK)',
            data: filteredData.map(data => data.revenue),
            borderColor: 'rgb(168, 85, 247)',
            backgroundColor: 'rgba(168, 85, 247, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            yAxisID: 'y2'
        });
    }

    if (showgrossprofit) {
        datasets.push({
            label: 'Bruttovinst (SEK)',
            data: filteredData.map(data => data.grossprofit),
            borderColor: 'rgb(34, 197, 94)',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            yAxisID: 'y2'
        });
    }

    if (showmarketingSpend) {
        datasets.push({
            label: 'Marknadsföring (SEK)',
            data: filteredData.map(data => data.marketingSpend),
            borderColor: 'rgb(239, 68, 68)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            yAxisID: 'y2'
        });
    }

    if (showNettovinst) {
        datasets.push({
            label: 'Nettovinst (SEK)',
            data: filteredData.map(data => data.grossprofit - data.marketingSpend),
            borderColor: 'rgb(217, 119, 6)',
            backgroundColor: 'rgba(217, 119, 6, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            yAxisID: 'y2'
        });
    }
    
    trendsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                x: {
                    display: true,
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
                        text: 'ROAS / POAS'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Procent (%)'
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                },
                y2: {
                    type: 'linear',
                    display: false,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'SEK'
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        afterLabel: function(context) {
                            const dataIndex = context.dataIndex;
                            const data = filteredData[dataIndex];
                            return [
                                `Omsättning: ${formatCurrency(data.revenue)}`,
                                `Bruttovinst: ${formatCurrency(data.grossprofit)}`,
                                `Marknadsföring: ${formatCurrency(data.marketingSpend)}`
                            ];
                        }
                    }
                }
            }
        }
    });
}

// Update individual metric charts
function updateIndividualCharts() {
    const filteredData = getFilteredData();
    if (filteredData.length === 0) return;

    const labels = filteredData.map(data => formatMonth(data.month));
    
    // ROAS Chart
    updateROASChart(labels);
    
    // POAS Chart
    updatePOASChart(labels);
    
    // Profit Margin Chart (Bruttovinst)
    updategrossMarginPercentChart(labels);

    // Net Profit Percent Chart (Nettovinst %)
    updateNetProfitPercentChart(labels);

    // Marketing Percent Chart
    updateMarketingPercentChart(labels);

    // Revenue Charts
    updaterevenueChart(labels);
    updategrossprofitChart(labels);
    updatemarketingSpendChart(labels);
    updateNettovinstChart(labels);
    updateLostMarginChart(labels);
    updateMarketingShareOfGrossprofitChart(labels);
    updateNetProfitPerAdCrownChart(labels);
}

function updateROASChart(labels) {
    const ctx = document.getElementById('roasChart');
    if (!ctx) return;

    if (roasChart) {
        roasChart.destroy();
    }

    const filteredData = getFilteredData();
    const data = filteredData.map(data => data.roas);
    
    roasChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'ROAS',
                data: data,
                borderColor: 'rgb(37, 99, 235)',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }, {
                label: 'Hög Tröskel',
                data: new Array(data.length).fill(thresholds.roas.high),
                borderColor: 'rgba(34, 197, 94, 0.8)',
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false
            }, {
                label: 'Låg Tröskel',
                data: new Array(data.length).fill(thresholds.roas.low),
                borderColor: 'rgba(239, 68, 68, 0.8)',
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderDash: [10, 5],
                pointRadius: 0,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                },
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'ROAS'
                    },
                    min: function(context) {
                        const data = context.chart.data.datasets[0].data;
                        const minValue = Math.min(...data);
                        const thresholdLow = thresholds.roas.low;
                        // Start axis at 0.2 below the lower of: minimum data value or low threshold
                        return Math.max(0, Math.min(minValue, thresholdLow) - 0.2);
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            }
        }
    });
}

function updatePOASChart(labels) {
    const ctx = document.getElementById('poasChart');
    if (!ctx) return;

    if (poasChart) {
        poasChart.destroy();
    }

    const filteredData = getFilteredData();
    const data = filteredData.map(data => data.poas);
    
    poasChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'POAS',
                data: data,
                borderColor: 'rgb(22, 163, 74)',
                backgroundColor: 'rgba(22, 163, 74, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }, {
                label: 'Hög Tröskel',
                data: new Array(data.length).fill(thresholds.poas.high),
                borderColor: 'rgba(34, 197, 94, 0.8)',
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false
            }, {
                label: 'Låg Tröskel',
                data: new Array(data.length).fill(thresholds.poas.low),
                borderColor: 'rgba(239, 68, 68, 0.8)',
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderDash: [10, 5],
                pointRadius: 0,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    bottom: 0
                }
            },
            scales: {
                x: {
                    ticks: {
                        padding: 0
                    }
                },
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'POAS'
                    },
                    min: function(context) {
                        const data = context.chart.data.datasets[0].data;
                        const minValue = Math.min(...data);
                        const thresholdLow = thresholds.poas.low;
                        // Start axis at 0.2 below the lower of: minimum data value or low threshold
                        return Math.max(0, Math.min(minValue, thresholdLow) - 0.2);
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            }
        }
    });
}

function updategrossMarginPercentChart(labels) {
    const ctx = document.getElementById('grossMarginPercentChart');
    if (!ctx) return;

    if (grossMarginPercentChart) {
        grossMarginPercentChart.destroy();
    }

    const filteredData = getFilteredData();
    const data = filteredData.map(data => data.grossMarginPercent);
    
    grossMarginPercentChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Bruttovinst (%)',
                data: data,
                borderColor: 'rgb(234, 179, 8)',
                backgroundColor: 'rgba(234, 179, 8, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }, {
                label: 'Hög Tröskel',
                data: new Array(data.length).fill(thresholds.grossMarginPercent.high),
                borderColor: 'rgba(34, 197, 94, 0.8)',
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false
            }, {
                label: 'Låg Tröskel',
                data: new Array(data.length).fill(thresholds.grossMarginPercent.low),
                borderColor: 'rgba(239, 68, 68, 0.8)',
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderDash: [10, 5],
                pointRadius: 0,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    bottom: 0
                }
            },
            scales: {
                x: {
                    ticks: {
                        padding: 0
                    }
                },
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Bruttovinst (%)'
                    },
                    min: function(context) {
                        const data = context.chart.data.datasets[0].data;
                        const minValue = Math.min(...data);
                        const thresholdLow = thresholds.grossMarginPercent.low;
                        // Start axis at 2% below the lower of: minimum data value or low threshold
                        return Math.max(0, Math.min(minValue, thresholdLow) - 2);
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            }
        }
    });
}

function updateNetProfitPercentChart(labels) {
    const ctx = document.getElementById('netProfitPercentChart');
    if (!ctx) return;

    if (netProfitPercentChart) {
        netProfitPercentChart.destroy();
    }

    const filteredData = getFilteredData();
    const data = filteredData.map(data => data.netProfitPercent);

    netProfitPercentChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Nettovinst (%)',
                data: data,
                borderColor: 'rgb(220, 38, 127)',
                backgroundColor: 'rgba(220, 38, 127, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }, {
                label: 'Hög Tröskel',
                data: new Array(data.length).fill(thresholds.netProfitPercent?.high || 10),
                borderColor: 'rgba(34, 197, 94, 0.8)',
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false
            }, {
                label: 'Låg Tröskel',
                data: new Array(data.length).fill(thresholds.netProfitPercent?.low || 5),
                borderColor: 'rgba(239, 68, 68, 0.8)',
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderDash: [10, 5],
                pointRadius: 0,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    bottom: 0
                }
            },
            scales: {
                x: {
                    ticks: {
                        padding: 0
                    }
                },
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Nettovinst (%)'
                    },
                    min: function(context) {
                        const data = context.chart.data.datasets[0].data;
                        const minValue = Math.min(...data);
                        const thresholdLow = thresholds.netProfitPercent?.low || 5;
                        // Start axis at 2% below the lower of: minimum data value or low threshold
                        // Allow negative values since net profit can be negative
                        return Math.min(minValue, thresholdLow) - 2;
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            }
        }
    });
}

function updateMarketingPercentChart(labels) {
    const ctx = document.getElementById('marketingPercentChart');
    if (!ctx) return;

    if (marketingPercentChart) {
        marketingPercentChart.destroy();
    }

    const filteredData = getFilteredData();
    const data = filteredData.map(data => data.marketingPercent);
    
    marketingPercentChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Marknadsföring (%)',
                data: data,
                borderColor: 'rgb(14, 165, 233)',
                backgroundColor: 'rgba(14, 165, 233, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }, {
                label: 'Hög Tröskel',
                data: new Array(data.length).fill(thresholds.marketingPercent.high),
                borderColor: 'rgba(239, 68, 68, 0.8)',
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderDash: [10, 5],
                pointRadius: 0,
                fill: false
            }, {
                label: 'Låg Tröskel',
                data: new Array(data.length).fill(thresholds.marketingPercent.low),
                borderColor: 'rgba(34, 197, 94, 0.8)',
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    bottom: 0
                }
            },
            scales: {
                x: {
                    ticks: {
                        padding: 0
                    }
                },
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Marknadsföring (%)'
                    },
                    min: function(context) {
                        const data = context.chart.data.datasets[0].data;
                        const minValue = Math.min(...data);
                        const thresholdLow = thresholds.marketingPercent.low;
                        // Start axis at 1% below the lower of: minimum data value or low threshold
                        return Math.max(0, Math.min(minValue, thresholdLow) - 1);
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            }
        }
    });
}

function updaterevenueChart(labels) {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;

    if (revenueChart) {
        revenueChart.destroy();
    }

    const filteredData = getFilteredData();
    const data = filteredData.map(data => data.revenue);

    revenueChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Omsättning (SEK)',
                data: data,
                borderColor: 'rgb(168, 85, 247)',
                backgroundColor: 'rgba(168, 85, 247, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }, {
                label: 'Hög Tröskel',
                data: new Array(data.length).fill(thresholds.revenue.high),
                borderColor: 'rgba(34, 197, 94, 0.8)',
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false
            }, {
                label: 'Låg Tröskel',
                data: new Array(data.length).fill(thresholds.revenue.low),
                borderColor: 'rgba(239, 68, 68, 0.8)',
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderDash: [10, 5],
                pointRadius: 0,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    bottom: 0
                }
            },
            scales: {
                x: {
                    ticks: {
                        padding: 0
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Omsättning (SEK)'
                    },
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            }
        }
    });
}

function updategrossprofitChart(labels) {
    const ctx = document.getElementById('grossprofitChart');
    if (!ctx) return;

    if (grossprofitChart) {
        grossprofitChart.destroy();
    }

    const filteredData = getFilteredData();
    const data = filteredData.map(data => data.grossprofit);

    grossprofitChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Bruttovinst (SEK)',
                data: data,
                borderColor: 'rgb(34, 197, 94)',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }, {
                label: 'Hög Tröskel',
                data: new Array(data.length).fill(thresholds.grossprofit.high),
                borderColor: 'rgba(34, 197, 94, 0.8)',
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false
            }, {
                label: 'Låg Tröskel',
                data: new Array(data.length).fill(thresholds.grossprofit.low),
                borderColor: 'rgba(239, 68, 68, 0.8)',
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderDash: [10, 5],
                pointRadius: 0,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    bottom: 0
                }
            },
            scales: {
                x: {
                    ticks: {
                        padding: 0
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Intäkt (SEK)'
                    },
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            }
        }
    });
}

function updatemarketingSpendChart(labels) {
    const ctx = document.getElementById('marketingSpendChart');
    if (!ctx) return;

    if (marketingSpendChart) {
        marketingSpendChart.destroy();
    }

    const filteredData = getFilteredData();
    const data = filteredData.map(data => data.marketingSpend);

    marketingSpendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Marknadsföring (SEK)',
                data: data,
                borderColor: 'rgb(239, 68, 68)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }, {
                label: 'Hög Tröskel (varning)',
                data: new Array(data.length).fill(thresholds.marketingSpend.high),
                borderColor: 'rgba(239, 68, 68, 0.8)',
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderDash: [10, 5],
                pointRadius: 0,
                fill: false
            }, {
                label: 'Låg Tröskel (bra)',
                data: new Array(data.length).fill(thresholds.marketingSpend.low),
                borderColor: 'rgba(34, 197, 94, 0.8)',
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    bottom: 0
                }
            },
            scales: {
                x: {
                    ticks: {
                        padding: 0
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Marknadsföring (SEK)'
                    },
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            }
        }
    });
}

function updateNettovinstChart(labels) {
    const filteredData = getFilteredData();
    const data = filteredData.map(data => data.grossprofit - data.marketingSpend);

    const ctx = document.getElementById('nettovinstChart');
    if (!ctx) return;

    if (nettovinstChart) {
        nettovinstChart.destroy();
    }

    nettovinstChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Nettovinst (SEK)',
                data: data,
                borderColor: 'rgb(168, 85, 247)',
                backgroundColor: 'rgba(168, 85, 247, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }, {
                label: 'Hög Tröskel',
                data: new Array(data.length).fill(thresholds.nettovinst.high),
                borderColor: 'rgba(34, 197, 94, 0.8)',
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false
            }, {
                label: 'Låg Tröskel',
                data: new Array(data.length).fill(thresholds.nettovinst.low),
                borderColor: 'rgba(239, 68, 68, 0.8)',
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderDash: [10, 5],
                pointRadius: 0,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    bottom: 0
                }
            },
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                x: {
                    ticks: {
                        padding: 0
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Nettovinst (SEK)'
                    },
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + formatCurrency(context.raw);
                        }
                    }
                }
            }
        }
    });
}

function updateLostMarginChart(labels) {
    const filteredData = getFilteredData();
    const data = filteredData.map(data => {
        // Calculate lost margin: ((ROAS - POAS) / ROAS) × 100
        if (data.roas === 0) return 0;
        return ((data.roas - data.poas) / data.roas) * 100;
    });

    const ctx = document.getElementById('lostMarginChart');
    if (!ctx) return;

    if (lostMarginChart) {
        lostMarginChart.destroy();
    }

    const thresholdData = data.map(() => thresholds.lostMargin);

    lostMarginChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Förlorad marginal',
                data: data,
                borderColor: 'rgb(239, 68, 68)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }, {
                label: 'Bra tröskel',
                data: thresholdData.map(t => t.low),
                borderColor: 'rgba(34, 197, 94, 0.8)',
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false
            }, {
                label: 'Varning tröskel',
                data: thresholdData.map(t => t.high),
                borderColor: 'rgba(239, 68, 68, 0.8)',
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderDash: [10, 5],
                pointRadius: 0,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    bottom: 0
                }
            },
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                x: {
                    ticks: {
                        padding: 0
                    }
                },
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Förlorad marginal (%)'
                    },
                    ticks: {
                        callback: function(value) {
                            return value.toFixed(1) + '%';
                        }
                    },
                    min: function(context) {
                        const data = context.chart.data.datasets[0].data;
                        const minValue = Math.min(...data);
                        const thresholdLow = thresholds.lostMargin.low;
                        // Start axis at 5% below the lower of: minimum data value or low threshold
                        return Math.max(0, Math.min(minValue, thresholdLow) - 5);
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            if (context.datasetIndex === 0) {
                                return context.dataset.label + ': ' + context.raw.toFixed(1) + '%';
                            }
                            return context.dataset.label + ': ' + context.raw.toFixed(1) + '%';
                        },
                        afterLabel: function(context) {
                            if (context.datasetIndex === 0) {
                                const dataIndex = context.dataIndex;
                                const data = filteredData[dataIndex];
                                return [
                                    `ROAS: ${data.roas.toFixed(2)}`,
                                    `POAS: ${data.poas.toFixed(2)}`,
                                    `Skillnad: ${(data.roas - data.poas).toFixed(2)}`
                                ];
                            }
                            return '';
                        }
                    }
                }
            }
        }
    });
}

function updateMarketingShareOfGrossprofitChart(labels) {
    const filteredData = getFilteredData();
    const data = filteredData.map(data => {
        // Calculate Marknadsföringens andel av bruttovinsten: (Marknadsföring ÷ Bruttovinst) × 100
        if (data.grossprofit === 0) return 0;
        return (data.marketingSpend / data.grossprofit) * 100;
    });

    const ctx = document.getElementById('marketingShareOfGrossprofitChart');
    if (!ctx) return;

    if (marketingShareOfGrossprofitChart) {
        marketingShareOfGrossprofitChart.destroy();
    }

    const thresholdData = data.map(() => thresholds.marketingShareOfGrossprofit);

    marketingShareOfGrossprofitChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Marknadsföringens andel av bruttovinsten',
                data: data,
                borderColor: 'rgb(168, 85, 247)',
                backgroundColor: 'rgba(168, 85, 247, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }, {
                label: 'Låg tröskel (bra)',
                data: thresholdData.map(t => t.low),
                borderColor: 'rgba(34, 197, 94, 0.8)',
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false
            }, {
                label: 'Hög tröskel (varning)',
                data: thresholdData.map(t => t.high),
                borderColor: 'rgba(239, 68, 68, 0.8)',
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderDash: [10, 5],
                pointRadius: 0,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    bottom: 0
                }
            },
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                x: {
                    ticks: {
                        padding: 0
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Marknadsföringens andel (%)'
                    },
                    ticks: {
                        callback: function(value) {
                            return value.toFixed(1) + '%';
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            if (context.datasetIndex === 0) {
                                return context.dataset.label + ': ' + context.raw.toFixed(1) + '%';
                            }
                            return context.dataset.label + ': ' + context.raw.toFixed(1) + '%';
                        },
                        afterLabel: function(context) {
                            if (context.datasetIndex === 0) {
                                const dataIndex = context.dataIndex;
                                const data = filteredData[dataIndex];
                                const netProfit = data.grossprofit - data.marketingSpend;
                                return [
                                    `Bruttovinst: ${formatCurrency(data.grossprofit)}`,
                                    `Marknadsföring: ${formatCurrency(data.marketingSpend)}`,
                                    `Nettovinst: ${formatCurrency(netProfit)}`
                                ];
                            }
                            return '';
                        }
                    }
                }
            }
        }
    });
}

function updateNetProfitPerAdCrownChart(labels) {
    const filteredData = getFilteredData();
    const data = filteredData.map(data => {
        // Calculate Nettovinst per annonskrona (Nettovinst SEK ÷ Marknadsföring SEK)
        if (data.marketingSpend === 0) return 0;
        const netProfit = data.grossprofit - data.marketingSpend;
        return netProfit / data.marketingSpend;
    });

    const ctx = document.getElementById('netProfitPerAdCrownChart');
    if (!ctx) return;

    if (netProfitPerAdCrownChart) {
        netProfitPerAdCrownChart.destroy();
    }

    const thresholdData = data.map(() => thresholds.netProfitPerAdCrown);

    netProfitPerAdCrownChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Nettovinst per annonskrona',
                data: data,
                borderColor: 'rgb(14, 165, 233)',
                backgroundColor: 'rgba(14, 165, 233, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }, {
                label: 'Hög tröskel',
                data: thresholdData.map(t => t.high),
                borderColor: 'rgba(34, 197, 94, 0.8)',
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false
            }, {
                label: 'Låg tröskel',
                data: thresholdData.map(t => t.low),
                borderColor: 'rgba(239, 68, 68, 0.8)',
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderDash: [10, 5],
                pointRadius: 0,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    bottom: 0
                }
            },
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                x: {
                    ticks: {
                        padding: 0
                    }
                },
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Nettovinst per annonskrona (SEK)'
                    },
                    min: function(context) {
                        const data = context.chart.data.datasets[0].data;
                        const minValue = Math.min(...data);
                        const thresholdLow = thresholds.netProfitPerAdCrown.low;
                        // Start axis at 0.2 below the lower of: minimum data value or low threshold
                        // Allow negative values since net profit per ad crown can be negative
                        return Math.min(minValue, thresholdLow) - 0.2;
                    },
                    ticks: {
                        callback: function(value) {
                            return value.toFixed(2) + ' SEK';
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            if (context.datasetIndex === 0) {
                                return context.dataset.label + ': ' + context.raw.toFixed(2) + ' SEK';
                            }
                            return context.dataset.label + ': ' + context.raw.toFixed(2);
                        },
                        afterLabel: function(context) {
                            if (context.datasetIndex === 0) {
                                const dataIndex = context.dataIndex;
                                const data = filteredData[dataIndex];
                                const netProfit = data.grossprofit - data.marketingSpend;
                                return [
                                    `Nettovinst: ${formatCurrency(netProfit)}`,
                                    `Marknadsföring: ${formatCurrency(data.marketingSpend)}`
                                ];
                            }
                            return '';
                        }
                    }
                }
            }
        }
    });
}

// Set default simulator values
function setDefaultSimulatorValues() {
    if (monthlyData.length > 0) {
        const latestData = monthlyData[monthlyData.length - 1];
        document.getElementById('currentrevenue').value = latestData.revenue;
        document.getElementById('currentgrossprofit').value = latestData.grossprofit;
        document.getElementById('currentMarknadsföring').value = latestData.marketingSpend;
    }
}

// Run simulation
function runSimulation() {
    const currentrevenue = parseFloat(document.getElementById('currentrevenue').value);
    const currentgrossprofit = parseFloat(document.getElementById('currentgrossprofit').value);
    const currentMarknadsföring = parseFloat(document.getElementById('currentMarknadsföring').value);
    const targetROAS = parseFloat(document.getElementById('targetROAS').value);
    const targetPOAS = parseFloat(document.getElementById('targetPOAS').value);
    
    if (!currentrevenue || !currentgrossprofit || !currentMarknadsföring || !targetROAS || !targetPOAS) {
        showAlert('Vänligen fyll i alla värden för simuleringen.', 'warning');
        return;
    }
    
    // Calculate recommended marketing spend for target ROAS and POAS
    const recommendedMarketingROAS = currentrevenue / targetROAS;
    const recommendedMarketingPOAS = currentgrossprofit / targetPOAS;
    
    // Update results
    document.getElementById('recommendedMarketingROAS').textContent = formatCurrency(recommendedMarketingROAS);
    document.getElementById('recommendedMarketingPOAS').textContent = formatCurrency(recommendedMarketingPOAS);
    
    // Show results
    document.getElementById('simulationPlaceholder').style.display = 'none';
    document.getElementById('simulationResults').style.display = 'block';
    
    // Update simulation chart
    updateSimulationChart(currentMarknadsföring, recommendedMarketingROAS, recommendedMarketingPOAS, targetROAS, targetPOAS);
}

// Update simulation chart
function updateSimulationChart(current, roasRec, poasRec, targetROAS, targetPOAS) {
    const ctx = document.getElementById('simulationChart');
    if (!ctx) return;
    
    if (simulationChart) {
        simulationChart.destroy();
    }
    
    simulationChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Nuvarande', 'Rekommenderat (ROAS)', 'Rekommenderat (POAS)'],
            datasets: [{
                label: 'Marknadsföringsbudget (SEK)',
                data: [current, roasRec, poasRec],
                backgroundColor: [
                    'rgba(100, 116, 139, 0.8)',
                    'rgba(37, 99, 235, 0.8)',
                    'rgba(22, 163, 74, 0.8)'
                ],
                borderColor: [
                    'rgb(100, 116, 139)',
                    'rgb(37, 99, 235)',
                    'rgb(22, 163, 74)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    bottom: 0
                }
            },
            scales: {
                x: {
                    ticks: {
                        padding: 0
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Marknadsföringsbudget (SEK)'
                    },
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return formatCurrency(context.raw);
                        },
                        afterLabel: function(context) {
                            if (context.dataIndex === 1) {
                                return `För mål ROAS: ${targetROAS}`;
                            } else if (context.dataIndex === 2) {
                                return `För mål POAS: ${targetPOAS}`;
                            }
                            return '';
                        }
                    }
                }
            }
        }
    });
}

// Export data to JSON
function exportData() {
    if (monthlyData.length === 0) {
        showAlert('Ingen data att exportera.', 'warning');
        return;
    }
    
    const exportData = {
        monthlyData: monthlyData,
        thresholds: thresholds,
        exportDate: new Date().toISOString(),
        note: "Tröskelvärden sparas automatiskt i thresholds.json filen"
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `marketing-analytics-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    showAlert('Data har exporterats.', 'success');
}

// Clear all data
async function clearAllData() {
    if (monthlyData.length === 0) {
        showAlert('Ingen data att rensa.', 'warning');
        return;
    }
    
    if (confirm('Är du säker på att du vill rensa all data? Detta kan inte ångras.')) {
        try {
            // Delete all entries one by one
            for (const data of monthlyData) {
                await fetch(`api/data.php?month=${data.month}`, {
                    method: 'DELETE'
                });
            }
            await loadData();
            updateAnalytics();
            document.getElementById('simulationPlaceholder').style.display = 'block';
            document.getElementById('simulationResults').style.display = 'none';
            showAlert('All data har rensats.', 'success');
        } catch (error) {
            showAlert('Ett fel uppstod när data skulle rensas.', 'danger');
        }
    }
}

// Utility functions
function formatCurrency(value) {
    return new Intl.NumberFormat('sv-SE', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value) + ' kr';
}

function formatMonth(monthString) {
    const date = new Date(monthString + '-01');
    return date.toLocaleDateString('sv-SE', { year: 'numeric', month: 'long' });
}

function getStatusClass(value, thresholdObj) {
    if (value >= thresholdObj.high) return 'status-good';
    if (value >= thresholdObj.low) return 'status-warning';
    return 'status-bad';
}

function showAlert(message, type) {
    // Remove existing alerts
    const existingAlerts = document.querySelectorAll('.custom-alert');
    existingAlerts.forEach(alert => alert.remove());

    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show custom-alert`;
    alertDiv.style.position = 'fixed';
    alertDiv.style.top = '20px';
    alertDiv.style.right = '20px';
    alertDiv.style.zIndex = '99999';
    alertDiv.style.minWidth = '350px';
    alertDiv.style.maxWidth = '500px';
    alertDiv.style.backgroundColor = type === 'success' ? '#d4edda' : type === 'danger' ? '#f8d7da' : type === 'warning' ? '#fff3cd' : '#d1ecf1';
    alertDiv.style.border = type === 'success' ? '1px solid #c3e6cb' : type === 'danger' ? '1px solid #f5c6cb' : type === 'warning' ? '1px solid #ffeaa7' : '1px solid #bee5eb';
    alertDiv.style.color = type === 'success' ? '#155724' : type === 'danger' ? '#721c24' : type === 'warning' ? '#856404' : '#0c5460';
    alertDiv.style.fontWeight = '500';
    alertDiv.style.fontSize = '14px';
    alertDiv.style.padding = '12px 16px';
    alertDiv.style.borderRadius = '8px';
    alertDiv.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    alertDiv.style.backdropFilter = 'blur(10px)';

    alertDiv.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center;">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'danger' ? 'fa-exclamation-triangle' : type === 'warning' ? 'fa-exclamation-circle' : 'fa-info-circle'}" style="margin-right: 8px; font-size: 16px;"></i>
                <span>${message}</span>
            </div>
            <button type="button" class="btn-close" onclick="this.parentElement.parentElement.remove()" style="margin-left: 12px; background: none; border: none; font-size: 18px; cursor: pointer; opacity: 0.7;" aria-label="Close">&times;</button>
        </div>
    `;

    document.body.appendChild(alertDiv);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

// Dark mode functionality
function initializeDarkMode() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        updateThemeToggle(true);
    }
}

function toggleDarkMode() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    if (newTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        updateThemeToggle(true);
    } else {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
        updateThemeToggle(false);
    }
    
    // Refresh all charts to update colors
    setTimeout(() => {
        updateAnalytics();
    }, 100);
}

function updateThemeToggle(isDark) {
    const toggleButton = document.getElementById('themeToggle');
    if (isDark) {
        toggleButton.innerHTML = '<i class="fas fa-sun me-2"></i>Ljust Läge';
    } else {
        toggleButton.innerHTML = '<i class="fas fa-moon me-2"></i>Mörkt Läge';
    }
}

// Update formula threshold text based on current threshold values
function updateFormulaThresholds() {
    const thresholdElements = document.querySelectorAll('.threshold-text');

    thresholdElements.forEach(element => {
        const metric = element.getAttribute('data-metric');
        const threshold = thresholds[metric];

        if (!threshold) return;

        let text = '';
        let recommendations = '';

        switch (metric) {
            case 'roas':
                text = `<strong>Bra värden:</strong> ${threshold.high}+ | <strong>Varning under:</strong> ${threshold.low}`;
                recommendations = `<br><strong>Om under ${threshold.low}:</strong> Optimera annonser, förbättra konvertering, höj priser`;
                break;
            case 'poas':
                text = `<strong>Bra värden:</strong> ${threshold.high}+ | <strong>Varning under:</strong> ${threshold.low}`;
                recommendations = `<br><strong>Om under ${threshold.low}:</strong> Förbättra produktmarginaler, optimera annonser`;
                break;
            case 'grossMarginPercent':
                text = `<strong>Bra värden:</strong> ${threshold.high}%+ | <strong>Varning under:</strong> ${threshold.low}%`;
                recommendations = `<br><strong>Om under ${threshold.low}%:</strong> Förhandla bättre inköpspriser, höj produktpriser`;
                break;
            case 'netProfitPercent':
                text = `<strong>Bra värden:</strong> ${threshold.high}%+ | <strong>Varning under:</strong> ${threshold.low}%`;
                recommendations = `<br><strong>Om under ${threshold.low}%:</strong> Balansera marknadsföring vs. marginaler`;
                break;
            case 'marketingPercent':
                text = `<strong>Bra värden:</strong> ${threshold.low}-${threshold.high}% | <strong>Varning över:</strong> ${threshold.high}%`;
                recommendations = `<br><strong>Om över ${threshold.high}%:</strong> Optimera annonser, höj produktpriser`;
                break;
            case 'lostMargin':
                text = `<strong>Bra värden:</strong> Under ${threshold.low}% | <strong>Varning över:</strong> ${threshold.high}%`;
                recommendations = `<br><strong>Om över ${threshold.high}%:</strong> Kritiskt låg bruttovinst! Förbättra marginaler`;
                break;
            case 'marketingShareOfGrossprofit':
                text = `<strong>Bra värden:</strong> ${threshold.low}-${threshold.high}% | <strong>Varning över:</strong> ${threshold.high}%`;
                recommendations = `<br><strong>Om över ${threshold.high}%:</strong> Optimera annonser, höj marginaler`;
                break;
            case 'netProfitPerAdCrown':
                text = `<strong>Bra värden:</strong> ${threshold.high}+ | <strong>Varning under:</strong> ${threshold.low}`;
                recommendations = `<br><strong>Om under ${threshold.low}:</strong> Kritiskt läge! Minska marknadsföring eller förbättra marginaler`;
                break;
            case 'revenue':
                text = `<strong>Bra värden:</strong> ${formatCurrency(threshold.high)}+ | <strong>Varning under:</strong> ${formatCurrency(threshold.low)}`;
                recommendations = `<br><strong>Om under ${formatCurrency(threshold.low)}:</strong> Öka marknadsföring, förbättra försäljning`;
                break;
            case 'grossprofit':
                text = `<strong>Bra värden:</strong> ${formatCurrency(threshold.high)}+ | <strong>Varning under:</strong> ${formatCurrency(threshold.low)}`;
                recommendations = `<br><strong>Om under ${formatCurrency(threshold.low)}:</strong> Förbättra marginaler, höj priser`;
                break;
            case 'marketingSpend':
                text = `<strong>Bra värden:</strong> ${formatCurrency(threshold.low)}-${formatCurrency(threshold.high)} | <strong>Varning över:</strong> ${formatCurrency(threshold.high)}`;
                recommendations = `<br><strong>Om över ${formatCurrency(threshold.high)}:</strong> Optimera annonser, minska kostnader`;
                break;
            case 'nettovinst':
                text = `<strong>Bra värden:</strong> ${formatCurrency(threshold.high)}+ | <strong>Varning under:</strong> ${formatCurrency(threshold.low)}`;
                recommendations = `<br><strong>Om under ${formatCurrency(threshold.low)}:</strong> Balansera marknadsföring vs. marginaler`;
                break;
        }

        element.innerHTML = text + recommendations;
    });
}
