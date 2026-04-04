document.addEventListener('DOMContentLoaded', function() {
    const button = document.getElementById('buttonMonitor');
    const buttonStop = document.getElementById('buttonStopMonitor');
    chrome.tabs.query({ active: true, currentWindow: true }, function (tab1) {
        if (tab1[0].url == 'https://minesweeper.online/cn/marketplace' || tab1[0].url == 'https://minesweeper.online/marketplace') {
            document.getElementById('monitorSet').style = 'block';
            setPopupButtonState(button, 'ready');
            button.style.cursor = 'pointer'; // 鼠标指针样式
            button.addEventListener('click', function () {
                var pt = document.getElementById('priceThreshold').value;
                console.log(pt);
                if (pt) {
                    document.getElementById('monitorNotice').style.display = 'none';
                    setPopupButtonState(button, 'loading');
                    button.disabled = true; // 运行时不能再次点击
                    button.style.cursor = 'default'; // 鼠标指针样式
                    setPopupButtonState(buttonStop, 'ready'); // 停止按钮变蓝，可用
                    buttonStop.style.cursor = 'pointer'; // 鼠标指针样式
                    document.getElementById('flagMonitor').textContent = 0;
                    const tabId = tab1[0].id;
                    var t0 = 10000; // 多久查询一次
                    checkInterval = setInterval(() => {
                        var flag = document.getElementById('flagMonitor').textContent;
                        if (flag == 1) {
                            setPopupButtonState(button, 'success');
                            button.disabled = false; // 恢复可点击
                            button.style.cursor = 'pointer'; // 鼠标指针样式
                            clearInterval(checkInterval);
                        } else {
                            chrome.scripting.executeScript({
                                target: { tabId },
                                args: [pt],
                                function: function (pt) {
                                    var t1 = 100;
                                    var price = document.querySelector("#stat_table_body > tr:nth-child(1) > td:nth-child(3)").textContent;
                                    if (price && +price <= +pt) {
                                        console.log('发现低价：', price, ' 阈值：', pt);
                                        playAudio(523.2, 0.5, 0.5);
                                        window.alert('发现低价！');
                                        chrome.runtime.sendMessage({ action: 'monitorSuccess', monitorPrice: price });
                                        clearInterval(checkInterval);
                                    } else {
                                        console.log('当前最低价：', price, ' 阈值：', pt);
                                    }
                                    setTimeout(() => {
                                        var updateButton = document.querySelector("#market_search_filters_right > div > a");
                                        updateButton.click();
                                    }, t1);
 
                                    function playAudio(frequency, volume, time) {
                                        var audioCtx = new (window.AudioContext);
                                        // 创建一个振荡器节点
                                        var oscillator = audioCtx.createOscillator();
                                         // 设置波形类型
                                        oscillator.type = 'triangle';
                                        // 设置振荡器的频率
                                        oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
                                        // 创建一个增益节点来控制音量
                                        var gainNode = audioCtx.createGain();
                                        // 将振荡器连接到增益节点，然后将增益节点连接到音频上下文的输出
                                        oscillator.connect(gainNode);
                                        gainNode.connect(audioCtx.destination);
                                        // 设置音量并开始播放
                                        gainNode.gain.setValueAtTime(volume, audioCtx.currentTime); // 音量范围0到1
                                        oscillator.start(audioCtx.currentTime);
                                        // 设置停止播放的时间
                                        oscillator.stop(audioCtx.currentTime + time);
                                    }
                                }
                            });
                        }
                    }, t0);
                } else {
                    document.getElementById('monitorNotice').style.display = 'block';
                }
            });
            buttonStop.addEventListener('click', function () {
                document.getElementById('flagMonitor').textContent = 1;
                setPopupButtonState(buttonStop, 'loading');
                buttonStop.style.cursor = 'default'; // 鼠标指针样式
            });
            chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
                if (request.action === 'monitorSuccess') {
                    if (request.monitorPrice) {
                        document.getElementById('flagMonitor').textContent = 1;
                    }
                }
            });
        } else {
            setPopupButtonState(button, 'disabled');
            setPopupButtonState(buttonStop, 'disabled');
        }
    });
});
