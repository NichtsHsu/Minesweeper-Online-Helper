document.addEventListener('DOMContentLoaded', function() {
    const button = document.getElementById('button1');
    chrome.tabs.query({ active: true, currentWindow: true }, function (tab1) {
        if (tab1[0].url.includes('https://minesweeper.online/') && tab1[0].url.includes('marketplace')) {
            setPopupButtonState(button, 'ready');
            button.style.cursor = 'pointer'; // 鼠标指针样式
            button.addEventListener('click', function () {
                setPopupButtonState(button, 'loading');
                const tabId = tab1[0].id;
                chrome.scripting.executeScript({
                    target: { tabId },
                    function: extractGemsPrice
                });
            });
        } else {
            setPopupButtonState(button, 'disabled');
        }
    });
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'sendGemsPrice') {
        let gemsPrice = request.gemsPrice;
        console.log('收到价格：', gemsPrice);   // 在控制台打出结果
        chrome.storage.local.set({ gemsPrice: gemsPrice });     // 保存数据
        /* 按日期保存 */
        chrome.storage.local.get(['gemsPriceMap'], function(result) {
            const gpMap = result.gemsPriceMap || {}; // 确保存在数据，防止为 undefined
            const currentDate = new Date();
            const newDate = currentDate.getUTCFullYear() + String(currentDate.getUTCMonth() + 1).padStart(2, '0') + String(currentDate.getUTCDate()).padStart(2, '0');
            // 更新数据
            gpMap[newDate] = gemsPrice;

            // 保存更新后的数据
            chrome.storage.local.set({ gemsPriceMap: gpMap });
        });

        setPopupButtonState('button1', 'success');
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const button = document.getElementById('button0');
    setPopupButtonState(button, 'ready');
    button.style.cursor = 'pointer'; // 鼠标指针样式
    button.addEventListener('click', function() {
        chrome.tabs.create({ url: chrome.runtime.getURL('index.html') }); // 打开主页
    });
});
