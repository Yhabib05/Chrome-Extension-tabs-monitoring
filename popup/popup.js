// leetcode = 'https://leetcode.com/';

let intervalId;

function updateButtonState(state){
    const toggleButton=document.getElementById("toggle-button");
    toggleButton.textContent = state;

    if (state === 'ON') {
        toggleButton.style.backgroundColor = "#4CAF50";    
    } else {
        toggleButton.style.backgroundColor = "#f44336"; 
    }
}

function updateTimer(tabId,accumulatedTime){
    const usageList = document.getElementById("usage-list");

    if(intervalId){
        clearInterval(intervalId);
    }

    intervalId = setInterval(()=>{
        chrome.storage.local.get([`startTime-${tabId}`], (data)=>{
            const startTime = data[`startTime-${tabId}`];
            if (startTime){
                const timeSpent = accumulatedTime+Math.floor((Date.now()-startTime)/1000);
                usageList.textContent = `Time Elapsed: ${timeSpent} seconds`;
            }
           
        });
    },1000);

}


document.addEventListener('DOMContentLoaded', () => {
    const usageList = document.getElementById("usage-list");
    const toggleButton = document.getElementById("toggle-button");
    
    //we get the current tab, and check the state on the extension badge and update the toggle button and the timer
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
        if (tabs.length > 0) {
            const currentTab = tabs[0];
            chrome.action.getBadgeText({ tabId: currentTab.id }, (currentState) => {
                updateButtonState(currentState || 'OFF');  // Default to OFF if no state is found

                //if current state is on we update the timer
                if (currentState === 'ON') {
                    chrome.storage.local.get(["timeSpent"],(data)=>{
                        const timeUntilNow = data.timeSpent &&  data.timeSpent[currentTab.url]?
                                Math.floor(data.timeSpent[currentTab.url]/ 1000):0;
                        updateTimer(currentTab.id,timeUntilNow);
    
                    })
                }
            });
        }
    });

    // Handle the toggle button to control ON/OFF state
    toggleButton.addEventListener('click', () => {
        chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
            // console.log(tabs);
            if (tabs.length > 0) {
                let tab = tabs[0];
                
            // if (tab.url && tab.url.startsWith(leetcode)) {
    
                chrome.action.getBadgeText({ tabId: tab.id }, (prevState) => {
                    const nextState = prevState === 'ON' ? 'OFF' : 'ON';

                    // Update badge text
                    chrome.action.setBadgeText({ tabId: tab.id, text: nextState });
                    
                    updateButtonState(nextState);

                    if (nextState === "ON") {
                        // Start tracking time
                        chrome.storage.local.set({ [`startTime-${tab.id}`]: Date.now() });
                        
                        chrome.storage.local.get(["timeSpent"],(data)=>{
                            const timeUntilNow = data.timeSpent &&  data.timeSpent[tab.url]?
                                    Math.floor(data.timeSpent[tab.url]/ 1000):0;
                        
                        updateTimer(tab.id,timeUntilNow);
                    });
                        
                    } else {
                        // Calculate time spent and store it
                        chrome.storage.local.get([`startTime-${tab.id}`, "timeSpent"], (data) => {
                            const startTime = data[`startTime-${tab.id}`] || Date.now();
                            const timeSpent = data.timeSpent || {};
                            const elapsedTime = Date.now() - startTime;

                            // Store accumulated time for this tab's URL
                            timeSpent[tab.url] = (timeSpent[tab.url] || 0) + elapsedTime;
                            chrome.storage.local.set({ timeSpent });

                            clearInterval(intervalId);

                            
                            const totalSeconds = Math.floor((timeSpent[tab.url]) / 1000);
                            usageList.textContent = `Total Time Spent: ${totalSeconds} seconds`;
                                
                            
                        });
                    }
                });   
            }
        });
    });
});
