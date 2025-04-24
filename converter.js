// Global variables
let currencies = {};
let conversionRates = {};
let lastUpdateTime = null;

// Exchange Rate API endpoint (using ExchangeRate-API free tier)
const API_URL = 'https://open.er-api.com/v6/latest/';

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the currency converter
    initCurrencyConverter();
    
    // Check auth state for nav menu
    checkAuthState();
});

// Initialize the currency converter
function initCurrencyConverter() {
    const loadingOverlay = document.getElementById('loading-overlay');
    loadingOverlay.classList.add('visible');
    
    // Fetch default currency rates (USD as base)
    fetchExchangeRates('USD')
        .then(() => {
            // Populate currency dropdowns
            populateCurrencyDropdowns();
            
            // Set up event listeners
            setupEventListeners();
            
            loadingOverlay.classList.remove('visible');
        })
        .catch(error => {
            console.error('Error initializing converter:', error);
            alert('Failed to load currency data. Please refresh the page.');
            loadingOverlay.classList.remove('visible');
        });
}

// Fetch exchange rates from API
function fetchExchangeRates(baseCurrency) {
    return fetch(`${API_URL}${baseCurrency}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Store the rates and update time
            conversionRates = data.rates;
            lastUpdateTime = new Date(data.time_last_update_utc);
            
            // Create currencies object with names (for future use)
            currencies = Object.keys(conversionRates).reduce((acc, code) => {
                acc[code] = code; // In a real app, we'd have full names
                return acc;
            }, {});
            
            return data;
        });
}

// Populate currency select dropdowns
function populateCurrencyDropdowns() {
    const fromCurrencySelect = document.getElementById('from-currency');
    const toCurrencySelect = document.getElementById('to-currency');
    
    if (!fromCurrencySelect || !toCurrencySelect) return;
    
    // Clear existing options
    fromCurrencySelect.innerHTML = '';
    toCurrencySelect.innerHTML = '';
    
    // Sort currency codes alphabetically
    const sortedCurrencies = Object.keys(currencies).sort();
    
    // Add options to both dropdowns
    sortedCurrencies.forEach(currencyCode => {
        const fromOption = new Option(currencyCode, currencyCode);
        const toOption = new Option(currencyCode, currencyCode);
        
        fromCurrencySelect.add(fromOption);
        toCurrencySelect.add(toOption);
    });
    
    // Set default values (USD to EUR)
    fromCurrencySelect.value = 'USD';
    toCurrencySelect.value = 'EUR';
}

// Setup event listeners
function setupEventListeners() {
    const conversionForm = document.getElementById('conversion-form');
    const swapButton = document.getElementById('swap-button');
    
    // Form submission for conversion
    if (conversionForm) {
        conversionForm.addEventListener('submit', function(e) {
            e.preventDefault();
            performConversion();
        });
    }
    
    // Swap currencies button
    if (swapButton) {
        swapButton.addEventListener('click', function() {
            const fromCurrencySelect = document.getElementById('from-currency');
            const toCurrencySelect = document.getElementById('to-currency');
            
            const temp = fromCurrencySelect.value;
            fromCurrencySelect.value = toCurrencySelect.value;
            toCurrencySelect.value = temp;
        });
    }
}

// Perform the currency conversion
function performConversion() {
    const amount = parseFloat(document.getElementById('amount').value);
    const fromCurrency = document.getElementById('from-currency').value;
    const toCurrency = document.getElementById('to-currency').value;
    
    const loadingOverlay = document.getElementById('loading-overlay');
    loadingOverlay.classList.add('visible');
    
    // If the base currency isn't the same as what we have stored rates for,
    // we need to fetch new rates with the selected 'from' currency as base
    if (!conversionRates[fromCurrency] || conversionRates[fromCurrency] !== 1) {
        fetchExchangeRates(fromCurrency)
            .then(() => {
                calculateAndDisplayResult(amount, fromCurrency, toCurrency);
                loadingOverlay.classList.remove('visible');
            })
            .catch(error => {
                console.error('Error fetching exchange rates:', error);
                alert('Failed to get current exchange rates. Please try again.');
                loadingOverlay.classList.remove('visible');
            });
    } else {
        // We already have the right rates
        calculateAndDisplayResult(amount, fromCurrency, toCurrency);
        loadingOverlay.classList.remove('visible');
    }
}

// Calculate and display conversion result
function calculateAndDisplayResult(amount, fromCurrency, toCurrency) {
    // Get the conversion rate
    const rate = conversionRates[toCurrency];
    
    if (!rate) {
        alert(`Could not find conversion rate for ${toCurrency}`);
        return;
    }
    
    // Calculate the converted amount
    const convertedAmount = amount * rate;
    
    // Format the amounts
    const formattedOriginal = formatCurrency(amount, fromCurrency);
    const formattedConverted = formatCurrency(convertedAmount, toCurrency);
    
    // Display the result
    const resultContainer = document.getElementById('result-container');
    const conversionResult = document.getElementById('conversion-result');
    const rateInfo = document.getElementById('rate-info');
    const lastUpdated = document.getElementById('last-updated');
    
    conversionResult.textContent = `${formattedOriginal} = ${formattedConverted}`;
    rateInfo.textContent = `1 ${fromCurrency} = ${rate.toFixed(6)} ${toCurrency}`;
    lastUpdated.textContent = `Last updated: ${lastUpdateTime.toLocaleString()}`;
    
    resultContainer.classList.remove('hidden');
    
    // Save the conversion to history if user is logged in
    const user = auth.currentUser;
    if (user) {
        const conversionData = {
            amount: amount,
            fromCurrency: fromCurrency,
            toCurrency: toCurrency,
            amountFrom: formattedOriginal,
            amountTo: formattedConverted,
            rate: rate,
            date: new Date()
        };
        
        saveConversion(conversionData)
            .then(() => {
                // Reload the conversion history
                loadConversionHistory();
            })
            .catch(error => {
                console.error('Error saving conversion:', error);
            });
    }
}

// Format currency value
function formatCurrency(amount, currencyCode) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
        currencyDisplay: 'code',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount).replace(currencyCode, '').trim() + ' ' + currencyCode;
}
