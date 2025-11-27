const fs = require('fs');
const path = require('path');

// GitHub API update function using Node.js built-in https module
async function updateFileViaGitHubAPI(filePath, content, token, repoOwner, repoName) {
    const https = require('https');
    const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`;
    
    // Promise wrapper for https requests
    function httpsRequest(options, data) {
        return new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
                let responseBody = '';
                
                res.on('data', (chunk) => {
                    responseBody += chunk;
                });
                
                res.on('end', () => {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: responseBody
                    });
                });
            });
            
            req.on('error', (err) => {
                reject(err);
            });
            
            if (data) {
                req.write(data);
            }
            
            req.end();
        });
    }
    
    // Get the current file SHA (needed for update)
    let sha = null;
    try {
        const getOptions = {
            hostname: 'api.github.com',
            path: `/repos/${repoOwner}/${repoName}/contents/${filePath}`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'Node.js'
            }
        };
        
        const response = await httpsRequest(getOptions);
        
        if (response.statusCode === 200) {
            const fileInfo = JSON.parse(response.body);
            sha = fileInfo.sha;
        }
    } catch (error) {
        console.log(`File ${filePath} does not exist yet or error fetching SHA: ${error.message}`);
    }
    
    // Update or create the file
    const updateData = JSON.stringify({
        message: 'chore: update market history data',
        content: Buffer.from(content).toString('base64'),
        sha: sha // null for new files
    });
    
    const putOptions = {
        hostname: 'api.github.com',
        path: `/repos/${repoOwner}/${repoName}/contents/${filePath}`,
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(updateData),
            'User-Agent': 'Node.js'
        }
    };
    
    const response = await httpsRequest(putOptions, updateData);
    
    if (response.statusCode !== 200 && response.statusCode !== 201) {
        throw new Error(`Failed to update ${filePath}: ${response.statusCode} ${response.body}`);
    }
    
    console.log(`Successfully updated ${filePath}`);
}

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

// Function to update history data and save to separate files
async function updateHistoryData() {
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
    
    // Create data directory if it doesn't exist
    const dataDir = path.join(__dirname, '../../data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir);
    }
    
    // Create/update JSON file with history data
    const jsonFilePath = 'data/market-history.json';
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
    
    // Now update files via GitHub API
    const token = process.env.GITHUB_TOKEN;
    const repoOwner = process.env.REPO_OWNER;
    const repoName = process.env.REPO_NAME;
    
    if (!token || !repoOwner || !repoName) {
        console.log("Missing environment variables, skipping GitHub API update");
        return;
    }
    
    try {
        // Update JSON file via API
        await updateFileViaGitHubAPI(
            'data/market-history.json',
            jsonString,
            token,
            repoOwner,
            repoName
        );
        
        // Update JS file via API
        await updateFileViaGitHubAPI(
            'data/market-history.js',
            jsContent,
            token,
            repoOwner,
            repoName
        );
        
        console.log("Successfully updated files via GitHub API");
    } catch (error) {
        console.error("Error updating files via GitHub API:", error);
    }
}

// Run the update
updateHistoryData().catch(console.error);
