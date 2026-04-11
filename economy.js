document.addEventListener('DOMContentLoaded', function() {
    const button = document.getElementById('buttonEco');
    chrome.tabs.query({ active: true, currentWindow: true }, function (tab1) {
        if (tab1[0].url.includes('https://minesweeper.online/') && tab1[0].url.includes('economy')) {
            setPopupButtonState(button, 'ready');
            button.style.cursor = 'pointer'; // 鼠标指针样式
            button.addEventListener('click', function () {
                setPopupButtonState(button, 'loading');
                const tabId = tab1[0].id;
                chrome.scripting.executeScript({
                    target: { tabId },
                    function: extractEconomy
                });
            });
        } else {
            setPopupButtonState(button, 'disabled');
        }
    });
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'personalEconomy') {
        let personalEco = request.personalEco;
        console.log('收到财产估值更新：', personalEco);   // 在控制台打出结果
        chrome.storage.local.set({ personalEco: personalEco });     // 保存数据
        /* 按日期保存 */
        chrome.storage.local.get(['personalEcoMap'], function(result) {
            const peMap = result.personalEcoMap || {}; // 确保存在数据，防止为 undefined
            const currentDate = new Date();
            const newDate = currentDate.getUTCFullYear() + String(currentDate.getUTCMonth() + 1).padStart(2, '0') + String(currentDate.getUTCDate()).padStart(2, '0');
            // 更新数据
            peMap[newDate] = personalEco;

            // 保存更新后的数据
            chrome.storage.local.set({ personalEcoMap: peMap });
        });

        setPopupButtonState('buttonEco', 'success');
    }
});
