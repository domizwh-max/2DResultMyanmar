const fs = require('fs');
const path = require('path');

// Function to create market data files
function createMarketData() {
    // Create data directory if it doesn't exist
    const dataDir = path.join(__dirname, '../../data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir);
    }
    
    // Get today's date
    const today = new Date();
    const dateKey = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][today.getDay()];
    
    // Create new history entry
    const newEntry = {
        time: "20:00:00",
        set1201: "1,261.23",
        value1201: "13,522.14",
        lucky1201: "32",
        set1630: "1,252.71",
        value1630: "23,180.98",
        lucky1630: "10"
    };
    
    // Create/update JSON file with history data
    let historyData = {};
    
    // Try to read existing data
    try {
        const jsonPath = path.join(__dirname, '../../data/market-history.json');
        if (fs.existsSync(jsonPath)) {
            const jsonData = fs.readFileSync(jsonPath, 'utf8');
            historyData = JSON.parse(jsonData);
        }
    } catch (e) {
        console.log("Could not read existing JSON data, starting fresh");
    }
    
    // Add today's data
    if (!historyData[dateKey]) {
        historyData[dateKey] = {
            date: dateKey,
            dayName: dayName,
            entries: []
        };
    }
    
    // Add new entry
    historyData[dateKey].entries.push(newEntry);
    
    // Keep only last 5 entries per day
    if (historyData[dateKey].entries.length > 5) {
        historyData[dateKey].entries.shift();
    }
    
    // Save JSON data
    const jsonString = JSON.stringify(historyData, null, 2);
    fs.writeFileSync(path.join(__dirname, '../../data/market-history.json'), jsonString);
    console.log(`Saved JSON data for ${dateKey}`);
    
    // Create/update JavaScript file with history data
    const jsContent = `// Market history data updated at ${new Date().toISOString()}
const marketHistoryData = ${jsonString};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = marketHistoryData;
}`;
    
    fs.writeFileSync(path.join(__dirname, '../../data/market-history.js'), jsContent);
    console.log(`Saved JS data for ${dateKey}`);
}

// Run the function
createMarketData();
