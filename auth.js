// Login with email and password
function loginWithEmail(email, password) {
    const loadingOverlay = document.getElementById('loading-overlay');
    const errorMessage = document.getElementById('error-message');
    
    loadingOverlay.classList.add('visible');
    errorMessage.textContent = '';
    
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Redirect to converter page on successful login
            window.location.href = 'converter.html';
        })
        .catch((error) => {
            // Handle errors
            errorMessage.textContent = getReadableErrorMessage(error);
            loadingOverlay.classList.remove('visible');
        });
}

// Sign up with email and password
function signupWithEmail(email, password, name) {
    const loadingOverlay = document.getElementById('loading-overlay');
    const errorMessage = document.getElementById('error-message');
    
    loadingOverlay.classList.add('visible');
    errorMessage.textContent = '';
    
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Update profile with display name
            return userCredential.user.updateProfile({
                displayName: name
            }).then(() => {
                // Create user document in Firestore
                return db.collection('users').doc(userCredential.user.uid).set({
                    name: name,
                    email: email,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }).then(() => {
                // Redirect to converter page on successful sign up
                window.location.href = 'converter.html';
            });
        })
        .catch((error) => {
            // Handle errors
            errorMessage.textContent = getReadableErrorMessage(error);
            loadingOverlay.classList.remove('visible');
        });
}

// Login with Google
function loginWithGoogle() {
    const loadingOverlay = document.getElementById('loading-overlay');
    const errorMessage = document.getElementById('error-message');
    
    loadingOverlay.classList.add('visible');
    if (errorMessage) errorMessage.textContent = '';
    
    const provider = new firebase.auth.GoogleAuthProvider();
    
    auth.signInWithPopup(provider)
        .then((result) => {
            // Check if this is a new user
            const isNewUser = result.additionalUserInfo.isNewUser;
            
            if (isNewUser) {
                // Create user document in Firestore for new Google sign-ins
                return db.collection('users').doc(result.user.uid).set({
                    name: result.user.displayName,
                    email: result.user.email,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                }).then(() => {
                    // Redirect to converter page
                    window.location.href = 'converter.html';
                });
            } else {
                // Redirect to converter page for existing users
                window.location.href = 'converter.html';
            }
        })
        .catch((error) => {
            // Handle errors
            if (errorMessage) errorMessage.textContent = getReadableErrorMessage(error);
            loadingOverlay.classList.remove('visible');
        });
}

// Logout function
function logout() {
    const loadingOverlay = document.getElementById('loading-overlay');
    loadingOverlay.classList.add('visible');
    
    auth.signOut()
        .then(() => {
            // Redirect to home page after logout
            window.location.href = 'index.html';
        })
        .catch((error) => {
            console.error("Error signing out:", error);
            loadingOverlay.classList.remove('visible');
        });
}

// Helper function to get readable error messages
function getReadableErrorMessage(error) {
    console.error(error);
    
    switch (error.code) {
        case 'auth/user-not-found':
            return 'No user found with this email address.';
        case 'auth/wrong-password':
            return 'Incorrect password.';
        case 'auth/email-already-in-use':
            return 'This email address is already in use.';
        case 'auth/weak-password':
            return 'Password is too weak. It should be at least 6 characters.';
        case 'auth/invalid-email':
            return 'The email address is not valid.';
        case 'auth/operation-not-allowed':
            return 'This type of account is not enabled.';
        case 'auth/popup-closed-by-user':
            return 'Sign-in cancelled. The popup was closed before completing authentication.';
        default:
            return error.message || 'An error occurred. Please try again.';
    }
}
