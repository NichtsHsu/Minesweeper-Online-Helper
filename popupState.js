(function () {
    const LOADING_TIMEOUT_MS = 25000;
    const STATE_CLASSES = [
        'ui-btn-disabled',
        'ui-btn-ready',
        'ui-btn-loading',
        'ui-btn-success',
        'ui-btn-error',
        'ui-btn-idle'
    ];
    const loadingTimeoutMap = new WeakMap();

    function applyPopupThemeVars(themeVars) {
        if (!themeVars || typeof themeVars !== 'object') {
            return;
        }
        const root = document.documentElement;
        for (const [key, value] of Object.entries(themeVars)) {
            if (key !== 'themeName' && key !== 'introduce' && Array.isArray(value)) {
                root.style.setProperty(`--${key}`, value[0]);
            } else if (key !== 'themeName' && key !== 'introduce' && typeof value === 'string') {
                root.style.setProperty(`--${key}`, value);
            }
        }
    }

    function initPopupTheme() {
        if (!chrome || !chrome.storage || !chrome.storage.local) {
            return;
        }
        chrome.storage.local.get(['activeThemeVars', 'themeMap', 'theme'], function(result) {
            const themeEntry = resolveThemeEntry(result);
            applyPopupThemeVars(themeEntry);
        });

        if (chrome.storage.onChanged) {
            chrome.storage.onChanged.addListener(function(changes, areaName) {
                if (areaName !== 'local') {
                    return;
                }
                if (changes.activeThemeVars || changes.theme || changes.themeMap) {
                    chrome.storage.local.get(['activeThemeVars', 'themeMap', 'theme'], function(result) {
                        const themeEntry = resolveThemeEntry(result);
                        applyPopupThemeVars(themeEntry);
                    });
                }
            });
        }
    }

    function resolveThemeEntry(result) {
        if (result && result.activeThemeVars && typeof result.activeThemeVars === 'object') {
            return result.activeThemeVars;
        }

        const themeMap = result && result.themeMap && typeof result.themeMap === 'object' ? result.themeMap : {};
        const themeName = result && result.theme ? result.theme : '默认';
        return themeMap[themeName] || themeMap['默认'] || null;
    }

    function clearLoadingTimeout(button) {
        const timerId = loadingTimeoutMap.get(button);
        if (timerId) {
            clearTimeout(timerId);
            loadingTimeoutMap.delete(button);
        }
    }

    function armLoadingTimeout(button) {
        clearLoadingTimeout(button);
        const timerId = setTimeout(() => {
            if (button.dataset.uiState === 'loading') {
                setPopupButtonState(button, 'error');
            }
        }, LOADING_TIMEOUT_MS);
        loadingTimeoutMap.set(button, timerId);
    }

    function showPopupToast(message, tone) {
        const host = document.getElementById('popupToastHost');
        if (!host || !message) {
            return;
        }

        while (host.children.length >= 4) {
            host.removeChild(host.firstElementChild);
        }

        const toast = document.createElement('div');
        toast.className = `popupToast ${tone || 'info'}`;
        toast.setAttribute('role', 'status');
        toast.textContent = message;
        host.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('closing');
            setTimeout(() => {
                if (toast.parentElement === host) {
                    host.removeChild(toast);
                }
            }, 180);
        }, 2200);
    }

    function normalizeActionLabel(text) {
        if (!text) {
            return '';
        }
        return text.replace(/（500页）/g, '').trim();
    }

    function notifyPopupButtonState(button, nextState, previousState) {
        if (!button || nextState === previousState) {
            return;
        }

        const actionName = normalizeActionLabel(button.textContent);
        if (!actionName) {
            return;
        }

        if (nextState === 'success') {
            showPopupToast(`${actionName}完成`, 'success');
        } else if (nextState === 'error') {
            showPopupToast(`${actionName}失败或超时`, 'error');
        }
    }

    function resolveButton(buttonOrId) {
        if (!buttonOrId) {
            return null;
        }
        if (typeof buttonOrId === 'string') {
            return document.getElementById(buttonOrId);
        }
        return buttonOrId;
    }

    function clearStateClasses(button) {
        STATE_CLASSES.forEach((className) => button.classList.remove(className));
    }

    function setPopupButtonState(buttonOrId, state) {
        const button = resolveButton(buttonOrId);
        if (!button) {
            return;
        }

        const previousState = button.dataset.uiState || getPopupButtonState(button);
        clearLoadingTimeout(button);

        clearStateClasses(button);
        const nextState = state || 'idle';

        if (nextState === 'disabled') {
            button.classList.add('ui-btn-disabled');
            button.disabled = true;
            button.dataset.uiState = 'disabled';
            notifyPopupButtonState(button, 'disabled', previousState);
            return;
        }

        button.disabled = false;

        if (nextState === 'ready') {
            button.classList.add('ui-btn-ready');
        } else if (nextState === 'loading') {
            button.classList.add('ui-btn-loading');
            armLoadingTimeout(button);
        } else if (nextState === 'success') {
            button.classList.add('ui-btn-success');
        } else if (nextState === 'error') {
            button.classList.add('ui-btn-error');
        } else {
            button.classList.add('ui-btn-idle');
        }

        button.dataset.uiState = nextState;
        notifyPopupButtonState(button, nextState, previousState);
    }

    function getPopupButtonState(buttonOrId) {
        const button = resolveButton(buttonOrId);
        if (!button) {
            return '';
        }

        if (button.classList.contains('ui-btn-loading')) {
            return 'loading';
        }
        if (button.classList.contains('ui-btn-success')) {
            return 'success';
        }
        if (button.classList.contains('ui-btn-error')) {
            return 'error';
        }
        if (button.classList.contains('ui-btn-disabled')) {
            return 'disabled';
        }
        if (button.classList.contains('ui-btn-ready')) {
            return 'ready';
        }
        return 'idle';
    }

    window.setPopupButtonState = setPopupButtonState;
    window.getPopupButtonState = getPopupButtonState;
    window.showPopupToast = showPopupToast;

    document.addEventListener('DOMContentLoaded', function() {
        initPopupTheme();
    });
})();
