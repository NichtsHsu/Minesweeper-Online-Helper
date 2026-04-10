/* 共享 UI 工具 —— Toast 通知 & 按钮状态管理 */

/* === Toast 通知 === */
function createToastNotifier(config) {
    var hostId = config.hostId;
    var cssClass = config.cssClass;
    var displayMs = config.displayMs || 2400;
    var closeMs = config.closeMs || 200;
    var maxToasts = config.maxToasts || 4;

    return function showToast(message, tone) {
        var host = document.getElementById(hostId);
        if (!host || !message) {
            return;
        }

        while (host.children.length >= maxToasts) {
            host.removeChild(host.firstElementChild);
        }

        var toast = document.createElement('div');
        toast.className = cssClass + ' ' + (tone || 'info');
        toast.setAttribute('role', 'status');
        toast.textContent = message;
        host.appendChild(toast);

        setTimeout(function () {
            toast.classList.add('closing');
            setTimeout(function () {
                if (toast.parentElement === host) {
                    host.removeChild(toast);
                }
            }, closeMs);
        }, displayMs);
    };
}

/* === 按钮状态管理 === */
var UI_STATE_CLASSES = [
    'ui-btn-disabled',
    'ui-btn-ready',
    'ui-btn-loading',
    'ui-btn-success',
    'ui-btn-error',
    'ui-btn-idle'
];

function createButtonStateManager(config) {
    var showToast = config.showToast || function () {};
    var labelMap = config.labelMap || null;
    var loadingTimeoutMs = config.loadingTimeoutMs || 0;
    var normalizeLabel = config.normalizeLabel || function (text) { return text; };
    var loadingTimeoutMap = new WeakMap();

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
        UI_STATE_CLASSES.forEach(function (cls) {
            button.classList.remove(cls);
        });
    }

    function getActionLabel(button, buttonOrId) {
        if (labelMap && typeof buttonOrId === 'string' && labelMap[buttonOrId]) {
            return labelMap[buttonOrId];
        }
        return normalizeLabel(button.textContent || '');
    }

    function notifyState(button, buttonOrId, nextState, previousState) {
        if (!button || nextState === previousState) {
            return;
        }
        var actionName = getActionLabel(button, buttonOrId);
        if (!actionName) {
            return;
        }
        if (nextState === 'success') {
            showToast(actionName + '完成', 'success');
        } else if (nextState === 'error') {
            showToast(actionName + '失败或超时', 'error');
        }
    }

    function clearLoadingTimeout(button) {
        var timerId = loadingTimeoutMap.get(button);
        if (timerId) {
            clearTimeout(timerId);
            loadingTimeoutMap.delete(button);
        }
    }

    function armLoadingTimeout(button) {
        if (!loadingTimeoutMs) {
            return;
        }
        clearLoadingTimeout(button);
        var timerId = setTimeout(function () {
            if (button.dataset.uiState === 'loading') {
                setState(button, 'error');
            }
        }, loadingTimeoutMs);
        loadingTimeoutMap.set(button, timerId);
    }

    function setState(buttonOrId, state) {
        var button = resolveButton(buttonOrId);
        if (!button) {
            return;
        }

        var previousState = button.dataset.uiState || getState(button);
        clearLoadingTimeout(button);
        clearStateClasses(button);
        var nextState = state || 'idle';

        if (nextState === 'disabled') {
            button.classList.add('ui-btn-disabled');
            button.disabled = true;
            button.dataset.uiState = 'disabled';
            notifyState(button, buttonOrId, 'disabled', previousState);
            return;
        }

        button.disabled = false;
        button.classList.add('ui-btn-' + nextState);

        if (nextState === 'loading') {
            armLoadingTimeout(button);
        }

        button.dataset.uiState = nextState;
        notifyState(button, buttonOrId, nextState, previousState);
    }

    function getState(buttonOrId) {
        var button = resolveButton(buttonOrId);
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

    return { setState: setState, getState: getState };
}
