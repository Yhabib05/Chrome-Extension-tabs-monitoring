leetcode = 'https://leetcode.com/';

function updateButtonState(state){
    const toggleButton=document.getElementById("toggle-button");
    toggleButton.textContent = state;

    if (state === 'ON') {
        toggleButton.style.backgroundColor = "#4CAF50";    
    } else {
        toggleButton.style.backgroundColor = "#f44336"; 
    }
}


document.addEventListener('DOMContentLoaded', () => {

    chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
        if (tabs.length > 0) {
            const currentTab = tabs[0];
            chrome.action.getBadgeText({ tabId: currentTab.id }, (currentState) => {
                updateButtonState(currentState || 'OFF');  // Default to OFF if no state is found
            });
        }
    });

    // Get and display usage data from local storage
    chrome.storage.local.get(["timeSpent"], (data) => {
        const usageList = document.getElementById("usage-list");
        usageList.innerHTML = "";

        const timeData = data.timeSpent || {};
        if (Object.keys(timeData).length === 0) {
            usageList.innerHTML = "No usage data yet...";
            return;
        }

        // Display time for each tab
        for (const [tabUrl, time] of Object.entries(timeData)) {
            const seconds = Math.floor(time / 1000);
            usageList.innerHTML += `<div class="usage-item"><b>${tabUrl}</b>: ${seconds} seconds</div>`;
        }
    });

    // Handle the toggle button to control ON/OFF state
    const toggleButton = document.getElementById("toggle-button");
    toggleButton.addEventListener('click', () => {
        chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
            console.log(tabs);
            if (tabs.length > 0) {
                let tab = tabs[0];
                
                if (tab.url && tab.url.startsWith(leetcode)) {
    
                    chrome.action.getBadgeText({ tabId: tab.id }, (prevState) => {
                        const nextState = prevState === 'ON' ? 'OFF' : 'ON';

                        // Update badge text
                        chrome.action.setBadgeText({ tabId: tab.id, text: nextState });
                       
                        updateButtonState(nextState);

                        if (nextState === "ON") {
                            // Start tracking time
                            chrome.storage.local.set({ [`startTime-${tab.id}`]: Date.now() });
                        } else {
                            // Calculate time spent and store it
                            chrome.storage.local.get([`startTime-${tab.id}`, "timeSpent"], (data) => {
                                const startTime = data[`startTime-${tab.id}`] || Date.now();
                                const timeSpent = (data.timeSpent || {});
                                const elapsedTime = Date.now() - startTime;

                                // Store accumulated time for this tab's URL
                                timeSpent[tab.url] = (timeSpent[tab.url] || 0) + elapsedTime;
                                chrome.storage.local.set({ timeSpent });

                                alert(`Stopped monitoring. Time added: ${Math.floor(elapsedTime / 1000)} seconds`);
                            });
                        }
                    });
                }
            }
        });
    });
});
