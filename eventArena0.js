document.addEventListener('DOMContentLoaded', function () {
    const button = document.getElementById('buttonEa');
    chrome.tabs.query({ active: true, currentWindow: true }, function (tab1) {
        if (tab1[0].url.includes('https://minesweeper.online/') && tab1[0].url.includes('marketplace')) {
            setPopupButtonState(button, 'ready');
            button.style.cursor = 'pointer'; // 鼠标指针样式
            button.addEventListener('click', function () {
                setPopupButtonState(button, 'loading');
                const tabId = tab1[0].id;
                chrome.scripting.executeScript({
                    target: { tabId },
                    function: extractEventArenaPrice
                });
            });
        } else {
            setPopupButtonState(button, 'disabled');
        }
    });
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    var LMax = 8;       // 最大等级
    if (request.action === 'sendEventArenaPrice') {
        console.log('收到活动门票价格：', request.eaPrice);
        let eaPrice = request.eaPrice;
        chrome.storage.local.get(['eaPriceMap'], function(result) { // 从存储中读出总数据
            const eapMap = result.eaPriceMap || {}; // 确保存在数据，防止为 undefined
            const currentDate = new Date();
            const date = currentDate.getUTCFullYear() + String(currentDate.getUTCMonth() + 1).padStart(2, '0') + String(currentDate.getUTCDate()).padStart(2, '0');
            if (!eapMap[date]) { // 如果当前日期无条目，先新建
                eapMap[date] = new Array(8).fill(0);
            }
            for (let i = 0; i < LMax; i++) {
                if (eaPrice[1][i]) {
                    eapMap[date][i] = eaPrice[1][i];
                }
            }
            chrome.storage.local.set({ eaPriceMap: eapMap }); // 保存更新后的数据
        });
        setPopupButtonState('buttonEa', 'success');
    } 
});

document.addEventListener('DOMContentLoaded', function() {
    const currentDate = new Date();
    if ((currentDate.getUTCMonth() + 1) % 4 != 1) {
        document.getElementById("event1").style.display = 'none';
    }
});