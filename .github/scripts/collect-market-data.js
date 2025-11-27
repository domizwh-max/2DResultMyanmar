const fs = require('fs');
const path = require('path');

// Function to fetch market data (replace with actual API calls)
function fetchMarketData() {
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
    try {
        // Read the current index.html file
        const indexPath = path.join(__dirname, '../../index.html');
        console.log('Looking for index.html at:', indexPath);
        
        if (!fs.existsSync(indexPath)) {
            console.error('index.html not found at:', indexPath);
            return;
        }
        
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
        
        console.log('Today\'s date key:', dateKey);
        console.log('New entry:', newEntry);
        
        // Check if we have the sample data initialization function
        if (indexContent.includes('initializeSampleHistoryData')) {
            console.log('Found initializeSampleHistoryData function');
            
            // Extract the current history data from the function
            const functionMatch = indexContent.match(/function initializeSampleHistoryData\(\)[\s\S]*?historyData = ({[\s\S]*?});/);
            
            if (functionMatch) {
                console.log('Found historyData assignment');
                let historyDataString = functionMatch[1];
                
                // Try to parse the history data
                let historyData;
                try {
                    historyData = JSON.parse(historyDataString);
                } catch (parseError) {
                    console.log('Could not parse existing history data, starting fresh');
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
                const updatedContent = indexContent.replace(
                    /historyData = {[\s\S]*?};/,
                    `historyData = ${newHistoryString};`
                );
                
                // Write back to file
                fs.writeFileSync(indexPath, updatedContent);
                console.log(`Updated history data for ${dateKey}`);
            } else {
                console.log('Could not extract history data from function');
            }
        } else {
            console.log('initializeSampleHistoryData function not found, creating new one');
            
            // If the function doesn't exist, we'll add the data directly to the historyData initialization
            const historyDataMatch = indexContent.match(/let historyData = JSON\.parse\(localStorage\.getItem\('marketHistoryData'\)\) \|\| ({.*?});/);
            
            if (historyDataMatch) {
                console.log('Found historyData initialization');
                let historyData = {};
                
                try {
                    historyData = JSON.parse(historyDataMatch[1]);
                } catch (e) {
                    console.log('Could not parse existing history data');
                }
                
                // Add today's data
                if (!historyData[dateKey]) {
                    historyData[dateKey] = {
                        date: dateKey,
                        dayName: dayName,
                        entries: [{
                            time: "20:00:00",
                            set1201: "1,261.23",
                            value1201: "13,522.14",
                            lucky1201: "32",
                            set1630: "1,252.71",
                            value1630: "23,180.98",
                            lucky1630: "10"
                        }]
                    };
                } else {
                    historyData[dateKey].entries.push({
                        time: "20:00:00",
                        set1201: "1,261.23",
                        value1201: "13,522.14",
                        lucky1201: "32",
                        set1630: "1,252.71",
                        value1630: "23,180.98",
                        lucky1630: "10"
                    });
                    
                    // Keep only last 5 entries per day
                    if (historyData[dateKey].entries.length > 5) {
                        historyData[dateKey].entries.shift();
                    }
                }
                
                const newHistoryString = JSON.stringify(historyData, null, 4);
                const updatedContent = indexContent.replace(
                    /let historyData = JSON\.parse\(localStorage\.getItem\('marketHistoryData'\)\) \|\| {.*?};/,
                    `let historyData = JSON.parse(localStorage.getItem('marketHistoryData')) || ${newHistoryString};`
                );
                
                fs.writeFileSync(indexPath, updatedContent);
                console.log(`Updated history data for ${dateKey}`);
            } else {
                console.log('Could not find historyData initialization');
            }
        }
    } catch (error) {
        console.error('Error updating history data:', error);
    }
}

// Run the update
updateHistoryData();
