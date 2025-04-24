// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAZduAxjb9XSANbarCJubRp2k25o1C94AU",
    authDomain: "exchangekaro-23f66.firebaseapp.com",
    projectId: "exchangekaro-23f66",
    storageBucket: "exchangekaro-23f66.firebasestorage.app",
    messagingSenderId: "803391037038",
    appId: "1:803391037038:web:044dfa4ff9872477e1107f"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Authentication and Firestore
const auth = firebase.auth();
const db = firebase.firestore();

// Set persistence to local to keep the user logged in even after page refresh
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    .catch((error) => {
        console.error("Error setting authentication persistence:", error);
    });

// This function will be called to check if the user is already logged in
function checkAuthState() {
    const loadingOverlay = document.getElementById('loading-overlay');
    loadingOverlay.classList.add('visible');
    
    auth.onAuthStateChanged(user => {
        const loginLink = document.getElementById('login-link');
        const signupLink = document.getElementById('signup-link');
        const logoutLink = document.getElementById('logout-link');

        if (user) {
            // User is signed in
            console.log("User is signed in:", user.email);
            
            if (loginLink) loginLink.classList.add('hidden');
            if (signupLink) signupLink.classList.add('hidden');
            if (logoutLink) logoutLink.classList.remove('hidden');
            
            // Add event listener for logout button
            const logoutButton = document.getElementById('logout-button');
            if (logoutButton) {
                logoutButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    logout();
                });
            }
            
            // Hide login prompt if on converter page
            const loginPrompt = document.getElementById('login-prompt');
            if (loginPrompt) {
                loginPrompt.classList.add('hidden');
            }
            
            // Load user's conversion history if on converter page
            if (window.location.pathname.includes('converter.html')) {
                loadConversionHistory();
            }
        } else {
            // User is signed out
            console.log("User is signed out");
            
            if (loginLink) loginLink.classList.remove('hidden');
            if (signupLink) signupLink.classList.remove('hidden');
            if (logoutLink) logoutLink.classList.add('hidden');
            
            // Show login prompt if on converter page
            const loginPrompt = document.getElementById('login-prompt');
            if (loginPrompt) {
                loginPrompt.classList.remove('hidden');
            }
            
            // Redirect if on pages that require auth
            const restrictedPages = ['account.html'];
            const currentPage = window.location.pathname.split('/').pop();
            
            if (restrictedPages.includes(currentPage)) {
                window.location.href = 'login.html';
            }
        }
        
        loadingOverlay.classList.remove('visible');
    });
}

// Save a conversion to Firestore
function saveConversion(conversion) {
    const user = auth.currentUser;
    
    if (!user) {
        console.log("No user logged in to save conversion");
        return Promise.reject("No user logged in");
    }
    
    // Add conversion to Firestore with timestamp
    return db.collection('users').doc(user.uid).collection('conversions').add({
        ...conversion,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
}

// Load user's conversion history
function loadConversionHistory() {
    const user = auth.currentUser;
    const historyList = document.getElementById('history-list');
    const emptyHistoryMessage = document.getElementById('empty-history-message');
    
    if (!user || !historyList) {
        return;
    }
    
    const loadingOverlay = document.getElementById('loading-overlay');
    loadingOverlay.classList.add('visible');
    
    // Get the 5 most recent conversions
    db.collection('users').doc(user.uid).collection('conversions')
        .orderBy('timestamp', 'desc')
        .limit(5)
        .get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                // No conversions found
                if (emptyHistoryMessage) {
                    emptyHistoryMessage.textContent = "You haven't made any conversions yet.";
                }
            } else {
                // Conversions found - hide empty message and display conversions
                if (emptyHistoryMessage) {
                    emptyHistoryMessage.style.display = 'none';
                }
                
                historyList.innerHTML = '';
                
                querySnapshot.forEach((doc) => {
                    const conversion = doc.data();
                    const date = conversion.timestamp ? conversion.timestamp.toDate() : new Date();
                    const formattedDate = date.toLocaleString();
                    
                    const historyItem = document.createElement('div');
                    historyItem.className = 'history-item';
                    historyItem.innerHTML = `
                        <p><strong>${conversion.amount} ${conversion.fromCurrency} to ${conversion.toCurrency}</strong></p>
                        <p>${conversion.amountFrom} ${conversion.fromCurrency} = ${conversion.amountTo} ${conversion.toCurrency}</p>
                        <p class="history-date">${formattedDate}</p>
                    `;
                    
                    historyList.appendChild(historyItem);
                });
            }
            
            loadingOverlay.classList.remove('visible');
        })
        .catch((error) => {
            console.error("Error loading conversion history: ", error);
            if (emptyHistoryMessage) {
                emptyHistoryMessage.textContent = "Error loading your conversion history.";
            }
            loadingOverlay.classList.remove('visible');
        });
}
