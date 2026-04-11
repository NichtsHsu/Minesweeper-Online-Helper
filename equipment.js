document.addEventListener('DOMContentLoaded', function() {
    const button = document.getElementById('buttonEquip');
    chrome.tabs.query({ active: true, currentWindow: true }, function (tab1) {
        if (tab1[0].url.includes('https://minesweeper.online/') && tab1[0].url.includes('equipment')) {
            setPopupButtonState(button, 'ready');
            button.style.cursor = 'pointer'; // 鼠标指针样式
            button.addEventListener('click', function () {
                setPopupButtonState(button, 'loading');
                const tabId = tab1[0].id;
                chrome.scripting.executeScript({
                    target: { tabId },
                    function: extractEquipStats
                });
            });
        } else {
            setPopupButtonState(button, 'disabled');
        }
    });
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === 'sendEquipStats') {
        let equipStats = request.equipStats;
        console.log('收到装备加成：', equipStats);
        chrome.storage.local.set({ equipStats: equipStats });
        /* 按日期保存 */
        chrome.storage.local.get(['equipStatsMap'], function(result) {
            const equipStatsMap = result.equipStatsMap || {}; // 确保存在数据，防止为 undefined
            const currentDate = new Date();
            const newDate = currentDate.getUTCFullYear() + String(currentDate.getUTCMonth() + 1).padStart(2, '0') + String(currentDate.getUTCDate()).padStart(2, '0');
            // 更新数据
            equipStatsMap[newDate] = equipStats;

            // 保存更新后的数据
            chrome.storage.local.set({ equipStatsMap: equipStatsMap });
        });

        setPopupButtonState('buttonEquip', 'success');
    }
});
