/**
 * Example Local Configuration for JsonPowerDB
 * 
 * Instructions:
 * 1. Copy or rename this file to 'config.js':
 *      cp config.example.js config.js
 * 2. Replace 'YOUR_JPDB_CONNECTION_TOKEN' with your actual Connection Token from Login2Xplore.
 * 3. Never commit 'config.js' to Git or expose it in public repositories.
 * 
 * Note on Client-Side Security:
 * The connection token is loaded into the browser runtime to execute direct JPDB REST calls.
 * While kept out of Git tracking, it is accessible to users inspecting network traffic in the browser.
 */
window.JPDB_CONFIG = {
    connectionToken: "YOUR_JPDB_CONNECTION_TOKEN"
};

