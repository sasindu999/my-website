// ================================================================
// CONFIG.JS - FRONTEND CONFIGURATION
// ================================================================

const CONFIG = {
    // Backend API URL - UPDATE THIS AFTER DEPLOYING BACKEND
    // For local development: 'http://localhost:3000/api'
    // For production: 'https://your-backend-url.railway.app/api'
    API_URL: 'http://localhost:3000/api', // Change this to your deployed backend URL
    
    // Firebase Configuration (Public - Safe for frontend)
    // These are PUBLIC keys and safe to expose
    FIREBASE: {
        apiKey: "AIzaSyAqkBoMYwOt05xFDxyOSq86HLOoS5H_7mI",
        authDomain: "myweb-34b05.firebaseapp.com",
        projectId: "myweb-34b05",
        storageBucket: "myweb-34b05.firebasestorage.app",
        messagingSenderId: "G-258FZVWGRZ",
        appId: "1:483598535729:web:5477af7d53f0aa201c9910"
    }
};

// Export config
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}

console.log('✅ Configuration loaded');
console.log('🔗 Backend API:', CONFIG.API_URL);
console.log('⚠️  Remember to update API_URL after deploying backend!');