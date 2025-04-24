// Global variables for the chart
let rateChart = null;
let chartData = {};
let historicalRates = {};

// ExchangeRate-API endpoints
const LATEST_RATES_API = 'https://open.er-api.com/v6/latest/';
// Note: For historical rates, in a real application, we would use a paid API service
// For this demo, we'll generate mock historical data based on the latest rates

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the chart page
    initChartPage();
    
    // Check auth state for nav menu
    checkAuthState();
});

// Initialize the chart page
function initChartPage() {
    const loadingOverlay = document.getElementById('loading-overlay');
    loadingOverlay.classList.add('visible');
    
    // Fetch default currency rates (USD as base)
    fetch(LATEST_RATES_API + 'USD')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Store the rates
            chartData.rates = data.rates;
            
            // Populate currency dropdowns
            populateCurrencyDropdowns();
            
            // Set up event listeners
            setupEventListeners();
            
            // Initialize chart with default values (USD to EUR)
            updateChart('USD', 'EUR', 30);
            
            loadingOverlay.classList.remove('visible');
        })
        .catch(error => {
            console.error('Error initializing chart page:', error);
            alert('Failed to load currency data. Please refresh the page.');
            loadingOverlay.classList.remove('visible');
        });
}

// Populate currency select dropdowns
function populateCurrencyDropdowns() {
    const baseCurrencySelect = document.getElementById('chart-base-currency');
    const targetCurrencySelect = document.getElementById('chart-target-currency');
    
    if (!baseCurrencySelect || !targetCurrencySelect) return;
    
    // Clear existing options
    baseCurrencySelect.innerHTML = '';
    targetCurrencySelect.innerHTML = '';
    
    // Sort currency codes alphabetically
    const sortedCurrencies = Object.keys(chartData.rates).sort();
    
    // Add options to both dropdowns
    sortedCurrencies.forEach(currencyCode => {
        const baseOption = new Option(currencyCode, currencyCode);
        const targetOption = new Option(currencyCode, currencyCode);
        
        baseCurrencySelect.add(baseOption);
        targetCurrencySelect.add(targetOption);
    });
    
    // Set default values (USD to EUR)
    baseCurrencySelect.value = 'USD';
    targetCurrencySelect.value = 'EUR';
}

// Setup event listeners
function setupEventListeners() {
    const updateChartBtn = document.getElementById('update-chart-btn');
    
    if (updateChartBtn) {
        updateChartBtn.addEventListener('click', function() {
            const baseCurrency = document.getElementById('chart-base-currency').value;
            const targetCurrency = document.getElementById('chart-target-currency').value;
            const period = parseInt(document.getElementById('chart-period').value);
            
            updateChart(baseCurrency, targetCurrency, period);
        });
    }
}

// Update the chart with new data
function updateChart(baseCurrency, targetCurrency, days) {
    const loadingOverlay = document.getElementById('loading-overlay');
    loadingOverlay.classList.add('visible');
    
    // Fetch latest rates for the base currency
    fetch(LATEST_RATES_API + baseCurrency)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Store the current rate
            const currentRate = data.rates[targetCurrency];
            
            if (!currentRate) {
                throw new Error(`Could not find rate for ${targetCurrency}`);
            }
            
            // Generate mock historical data
            // In a real application, we would fetch this from a historical rates API
            const historicalData = generateMockHistoricalData(currentRate, days);
            
            // Create chart
            createOrUpdateChart(baseCurrency, targetCurrency, historicalData);
            
            // Update current rate and change display
            updateRateInfo(baseCurrency, targetCurrency, currentRate, historicalData);
            
            loadingOverlay.classList.remove('visible');
        })
        .catch(error => {
            console.error('Error updating chart:', error);
            alert('Failed to update chart data. Please try again.');
            loadingOverlay.classList.remove('visible');
        });
}

// Generate mock historical data for the chart
// In a real application, this would come from an API
function generateMockHistoricalData(currentRate, days) {
    const data = [];
    const today = new Date();
    
    // Generate a realistic looking rate curve with some volatility
    for (let i = days; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        
        // Add some randomness to create a realistic looking chart
        // Base rate is current rate with random fluctuation of up to ±5%
        const volatility = 0.05; // 5% max change
        const randomFactor = 1 + (Math.random() * volatility * 2 - volatility);
        const trend = 1 + ((days - i) / days * 0.03); // Small trend over time
        
        const rate = currentRate * randomFactor / trend;
        
        data.push({
            date: date.toISOString().split('T')[0],
            rate: parseFloat(rate.toFixed(6))
        });
    }
    
    return data;
}

// Create or update the chart
function createOrUpdateChart(baseCurrency, targetCurrency, historicalData) {
    const ctx = document.getElementById('rate-chart').getContext('2d');
    
    // Extract data for Chart.js
    const labels = historicalData.map(item => item.date);
    const rates = historicalData.map(item => item.rate);
    
    // Destroy existing chart if it exists
    if (rateChart) {
        rateChart.destroy();
    }
    
    // Create new chart
    rateChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `${baseCurrency} to ${targetCurrency} Exchange Rate`,
                data: rates,
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `1 ${baseCurrency} = ${context.raw} ${targetCurrency}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: function(value) {
                            return value.toFixed(4);
                        }
                    }
                }
            }
        }
    });
}

// Update rate information display
function updateRateInfo(baseCurrency, targetCurrency, currentRate, historicalData) {
    const currentRateValue = document.getElementById('current-rate-value');
    const rateChangeValue = document.getElementById('rate-change-value');
    
    // Display current rate
    currentRateValue.textContent = `1 ${baseCurrency} = ${currentRate.toFixed(6)} ${targetCurrency}`;
    
    // Calculate and display rate change
    const oldestRate = historicalData[0].rate;
    const change = currentRate - oldestRate;
    const percentChange = (change / oldestRate) * 100;
    
    const changeText = `${change >= 0 ? '+' : ''}${change.toFixed(6)} (${percentChange.toFixed(2)}%)`;
    rateChangeValue.textContent = changeText;
    
    // Add color class based on change direction
    rateChangeValue.className = 'change-value';
    if (change > 0) {
        rateChangeValue.classList.add('positive-change');
    } else if (change < 0) {
        rateChangeValue.classList.add('negative-change');
    }
}
