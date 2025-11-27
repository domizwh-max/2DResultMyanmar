const fs = require('fs');
const path = require('path');

// Function to fetch market data (replace with actual API calls)
async function fetchMarketData() {
    // In a real implementation, you would fetch this data from SET
    // For now, using sample data that matches your timeslot cards
    return {
        set1201: "1,261.23",
        value1201: "13,522.14",
        lucky1201: "32",
        set1630: "1,252.71",
        value1630: "23,180.98",
        lucky1630: "10"
    };
}

// Function to update history data in index.html
function updateHistoryData() {
    // Read the current index.html file
    const indexPath = path.join(__dirname, '../../index.html');
    let indexContent = fs.readFileSync(indexPath, 'utf8');
    
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
    
    // Convert to string for regex matching
    const entryString = JSON.stringify(newEntry);
    
    // Look for the initializeSampleHistoryData function and update it
    const pattern = /(function initializeSampleHistoryData\(\) \{[^}]*historyData = \{)([^}]*\}[^\}]*\}\);)/s;
    
    if (pattern.test(indexContent)) {
        // Extract current history data
        const match = indexContent.match(/historyData = (\{[^}]*\}[^\}]*\}\);)/s);
        if (match) {
            let historyData;
            try {
                // Extract and parse the history data
                const historyString = match[1].replace(/;$/, '');
                historyData = JSON.parse(historyString);
            } catch (e) {
                // If parsing fails, initialize with empty object
                historyData = {};
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
            
            // Convert back to string
            const newHistoryString = JSON.stringify(historyData, null, 4);
            
            // Replace in the index.html
            indexContent = indexContent.replace(
                /historyData = \{[^}]*\}[^\}]*\};/s,
                `historyData = ${newHistoryString};`
            );
            
            // Write back to file
            fs.writeFileSync(indexPath, indexContent);
            console.log(`Updated history data for ${dateKey}`);
        }
    } else {
        console.log("Could not find initializeSampleHistoryData function");
    }
}

// Run the update
updateHistoryData().catch(console.error);
