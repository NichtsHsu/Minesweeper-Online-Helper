document.addEventListener('DOMContentLoaded', function() {
    const button = document.getElementById('button5');
    setPopupButtonState(button, 'disabled');
    chrome.storage.local.get('pId', function (result) {
        const pId = result.pId;
        chrome.tabs.query({ active: true, currentWindow: true }, function (tab1) {
            if (tab1[0].url.includes('https://minesweeper.online/') && tab1[0].url.includes('statistics/' + pId)) {
                setPopupButtonState(button, 'ready');
                button.style.cursor = 'pointer'; // 鼠标指针样式
                button.addEventListener('click', function () {
                    setPopupButtonState(button, 'loading');
                    const tabId = tab1[0].id;
                    chrome.scripting.executeScript({
                        target: { tabId },
                        function: extractStatistics
                    });
                });
            } else {
                setPopupButtonState(button, 'disabled');
            }
        });
    });
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'sendStatistics') {
        let statistics = request.statistics;
        console.log('收到游戏数据：', statistics);
        chrome.storage.local.set({ statistics: statistics });
        /* 按日期保存 */
        chrome.storage.local.get(['statisticsMap'], function(result) {
            const stMap = result.statisticsMap || {}; // 确保存在数据，防止为 undefined
            const currentDate = new Date();
            const newDate = currentDate.getUTCFullYear() + String(currentDate.getUTCMonth() + 1).padStart(2, '0') + String(currentDate.getUTCDate()).padStart(2, '0');
            // 更新数据
            stMap[newDate] = statistics;
        
            // 保存更新后的数据
            chrome.storage.local.set({ statisticsMap: stMap });
        });

        setPopupButtonState('button5', 'success');
    } 
});