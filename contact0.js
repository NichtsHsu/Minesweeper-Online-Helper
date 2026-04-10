document.addEventListener('DOMContentLoaded', function() {
    const button = document.getElementById('buttonAddFriend');
    chrome.tabs.query({ active: true, currentWindow: true }, function (tab1) {
        const url1 = tab1[0].url;
        if (url1.includes('https://minesweeper.online/') && url1.includes('player/')) {
            var uid = url1.match(/player\/(\d+)/)[1];
            setPopupButtonState(button, 'ready');
            button.style.cursor = 'pointer'; // 鼠标指针样式
            button.addEventListener('click', function () {
                setPopupButtonState(button, 'loading');
                const tabId = tab1[0].id;
                chrome.scripting.executeScript({
                    target: { tabId },
                    args: [uid],
                    function: extractFriendInfo
                });
            });
        } else {
            setPopupButtonState(button, 'disabled');
        }
    });
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === 'sendFriendInfo') {
        let friendInfo = request.friendInfo;
        console.log('收到好友信息：', friendInfo);
        chrome.storage.local.get(['contactsList'], function(result) {
            const contactsList = result.contactsList || {}; // 确保存在数据，防止为 undefined
            var index = Object.keys(contactsList).length;
            if (contactsList[friendInfo[0]]) {
                contactsList[friendInfo[0]][0] = friendInfo[1];
            } else {
                contactsList[friendInfo[0]] = [friendInfo[1], index];
            }
        
            // 保存更新后的数据
            chrome.storage.local.set({ contactsList: contactsList });
        });

        setPopupButtonState('buttonAddFriend', 'success');
    }
});