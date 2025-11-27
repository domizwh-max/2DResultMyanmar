const fs = require('fs');
const path = require('path');

// Function to update history data in a separate JSON file
function updateHistoryData() {
    try {
        // Define the data file path
        const dataDir = path.join(__dirname, '../../data');
        const dataFile = path.join(dataDir, 'market-history.json');
        
        // Create data directory if it doesn't exist
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        // Get today's date
        const today = new Date();
        const dateKey = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
        const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][today.getDay()];
        
        console.log('Today\'s date key:', dateKey);
        
        // Create new history entry with your exact timeslot data
        const newEntry = {
            time: "20:00:00",
            set1201: "1,261.23",
            value1201: "13,522.14",
            lucky1201: "32",
            set1630: "1,252.71",
            value1630: "23,180.98",
            lucky1630: "10"
        };
        
        // Load existing history data
        let historyData = {};
        if (fs.existsSync(dataFile)) {
            try {
                const fileContent = fs.readFileSync(dataFile, 'utf8');
                historyData = JSON.parse(fileContent);
            } catch (e) {
                console.log('Could not parse existing history data, starting fresh');
                historyData = {};
            }
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
        
        // Save to file
        fs.writeFileSync(dataFile, JSON.stringify(historyData, null, 2));
        console.log(`Updated history data for ${dateKey}`);
        
        // Also update a JavaScript file that can be included in index.html
        const jsDataFile = path.join(dataDir, 'market-history.js');
        const jsContent = `// Auto-generated market history data
window.marketHistoryData = ${JSON.stringify(historyData, null, 2)};
`;
        fs.writeFileSync(jsDataFile, jsContent);
        console.log('Updated JavaScript data file');
        
    } catch (error) {
        console.error('Error updating history data:', error.message);
    }
}

// Run the update
updateHistoryData();
