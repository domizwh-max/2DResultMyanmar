const https = require('https');
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

// Function to get current index.html content from GitHub
function getCurrentFileContent(owner, repo, filePath, token) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.github.com',
            path: `/repos/${owner}/${repo}/contents/${filePath}`,
            method: 'GET',
            headers: {
                'Authorization': `token ${token}`,
                'User-Agent': 'github-actions-market-data',
                'Accept': 'application/vnd.github.v3+json'
            }
        };
        
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve(JSON.parse(data));
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                }
            });
        });
        
        req.on('error', reject);
        req.end();
    });
}

// Function to update file on GitHub
function updateFileOnGitHub(owner, repo, filePath, content, sha, token, message) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.github.com',
            path: `/repos/${owner}/${repo}/contents/${filePath}`,
            method: 'PUT',
            headers: {
                'Authorization': `token ${token}`,
                'User-Agent': 'github-actions-market-data',
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            }
        };
        
        const postData = JSON.stringify({
            message: message,
            content: Buffer.from(content).toString('base64'),
            sha: sha
        });
        
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve(JSON.parse(data));
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                }
            });
        });
        
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

// Function to update history data
async function updateHistoryData() {
    try {
        const token = process.env.GITHUB_TOKEN;
        const repo = process.env.GITHUB_REPOSITORY;
        const owner = process.env.GITHUB_OWNER;
        
        if (!token || !repo || !owner) {
            console.log('Missing environment variables, running in local mode');
            return;
        }
        
        const [repoOwner, repoName] = repo.split('/');
        const filePath = 'index.html';
        
        console.log(`Fetching current ${filePath} from ${owner}/${repoName}`);
        
        // Get current file content
        const fileInfo = await getCurrentFileContent(repoOwner, repoName, filePath, token);
        let indexContent = Buffer.from(fileInfo.content, 'base64').toString('utf8');
        
        // Get today's date
        const today = new Date();
        const dateKey = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
        const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][today.getDay()];
        
        console.log('Today\'s date key:', dateKey);
        
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
        
        // Look for the historyData initialization
        const historyDataMatch = indexContent.match(/let historyData = JSON\.parse\(localStorage\.getItem\('marketHistoryData'\)\) \|\| ({[^}]*\}[^\}]*\}\);)/s);
        
        if (historyDataMatch) {
            console.log('Found historyData initialization');
            let historyData;
            try {
                const historyString = historyDataMatch[1].replace(/;$/, '');
                historyData = JSON.parse(historyString);
            } catch (e) {
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
                /let historyData = JSON\.parse\(localStorage\.getItem\('marketHistoryData'\)\) \|\| {[^}]*\}[^\}]*\};/s,
                `let historyData = JSON.parse(localStorage.getItem('marketHistoryData')) || ${newHistoryString};`
            );
            
            // Update file on GitHub
            console.log(`Updating ${filePath} on GitHub`);
            await updateFileOnGitHub(
                repoOwner, 
                repoName, 
                filePath, 
                updatedContent, 
                fileInfo.sha, 
                token, 
                "chore: update market history data"
            );
            
            console.log(`Updated history data for ${dateKey}`);
        } else {
            console.log('Could not find historyData initialization');
        }
    } catch (error) {
        console.error('Error updating history data:', error.message);
    }
}

// Run the update
updateHistoryData();
