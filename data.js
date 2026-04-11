document.addEventListener('DOMContentLoaded', function() {
    const button = document.getElementById('button3');
    setPopupButtonState(button, 'disabled');
    chrome.storage.local.get('pId', function (result) {
        const pId = result.pId;
        chrome.tabs.query({ active: true, currentWindow: true }, function (tab1) {
            if (tab1[0].url.includes('https://minesweeper.online/') && tab1[0].url.includes('player/' + pId)) {
                setPopupButtonState(button, 'ready');
                button.style.cursor = 'pointer'; // 鼠标指针样式
                button.addEventListener('click', function () {
                    setPopupButtonState(button, 'loading');
                    const tabId = tab1[0].id;
                    chrome.scripting.executeScript({
                        target: { tabId },
                        function: extractPersonalData
                    });
                });
            } else {
                setPopupButtonState(button, 'disabled');
            }
        });
    });
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === 'sendPersonalData') {
        let personalData = request.personalData;
        console.log('收到个人数据：', personalData);
        chrome.storage.local.set({ personalData: personalData });
        /* 按日期保存 */
        chrome.storage.local.get(['personalDataMap'], function (result) {
            const pdMap = result.personalDataMap || {}; // 确保存在数据，防止为 undefined
            const currentDate = new Date();
            const newDate = currentDate.getUTCFullYear() + String(currentDate.getUTCMonth() + 1).padStart(2, '0') + String(currentDate.getUTCDate()).padStart(2, '0');
            // 更新数据
            pdMap[newDate] = personalData;

            // 保存更新后的数据
            chrome.storage.local.set({ personalDataMap: pdMap });
        });

        setPopupButtonState('button3', 'success');
    }
});