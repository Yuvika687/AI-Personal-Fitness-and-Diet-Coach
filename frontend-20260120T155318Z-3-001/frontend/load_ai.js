// Add this line at the end of your existing app.js file to load AI features

// Load AI features after the main app is ready
setTimeout(function() {
    if (typeof initializeAIFeatures === "function") {
        initializeAIFeatures();
    }
}, 1000);
