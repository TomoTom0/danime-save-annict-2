// Type definitions
interface WebhookSetting {
  postUrl: string;
  webhookNoMatched: boolean;
  webhookNoWorkId: boolean;
  webhookSuccess: boolean;
  webhookContentChanged: boolean;
  webhookContent: Record<string, string>;
}

interface WebhookSettings {
  [key: string]: WebhookSetting;
}

// Simple message display function (replacement for iziToast)
function showSimpleMessage(title: string, message: string): void {
    alert(`${title}: ${message}`);
}

const webhookDefaultSetting = {
    postUrl: "", webhookNoMatched: true,
    webhookNoWorkId: false, webhookSuccess: false, webhookContentChanged: false, webhookContent: {}
};
const webhookDefaultString = JSON.stringify({ [Date.now()]: webhookDefaultSetting });

const webhookKeys = {
    check: ["webhookNoMatched", "webhookNoWorkId", "webhookSuccess", "webhookContentChanged"],
    input: ["postUrl"]
};

const amazonAbemaDefaults: any[] = ["amazon", "abema"].map(key => ({ [`valid_${key}`]: false }));
const checkValid1 = Object.assign({ "valid_danime": true }, ...amazonAbemaDefaults);
const vodDefaults: any[] = ["danime","amazon", "abema"].map(key =>
        ({[`valid_${key}Annict`]:true, [`valid_${key}Webhook`]:true, [`valid_${key}Genre`]:false}));
const checkValid2 = Object.assign({}, ...vodDefaults);
const checkValid = Object.assign(checkValid1, checkValid2);
const otherKeys = {
    input: { token: "", sendingTime: 300 },
    check: Object.assign({ annictSend: true, withTwitter:false, withFacebook:false}, checkValid)
};

// Initialize when DOM is ready
(function () {
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

function init() {
    //------ not webhook ---------
    // set value
    chrome.storage.sync.get(otherKeys.input, items =>
        Object.entries(items).forEach(kv => {
            const elem = document.querySelector<HTMLInputElement>(`#input_${kv[0]}`);
            if (elem) elem.value = kv[1] as string;
        })
    );
    chrome.storage.sync.get(otherKeys.check, items => {
        //console.log(items)
        Object.entries(items).forEach(kv => {
            const elem = document.querySelector<HTMLInputElement>(`#check_${kv[0]}`);
            if (elem) elem.checked = kv[1] as boolean;
        })
    });
    //-------------- webhook ---------------
    // set value
    chrome.storage.sync.get({ webhookSettings: webhookDefaultString }, items => {
        const webhookSettings = checkWebhookSettings(items.webhookSettings);
        let firstBlock = true;
        Object.keys(webhookSettings).forEach(webhookNum => {
            if (firstBlock) {
                const firstWebhook = document.querySelector("#webhook_0");
                if (firstWebhook) firstWebhook.id = `webhook_${webhookNum}`;
                firstBlock = !firstBlock;
            } else addWebhookBlock(webhookNum);
            const webhook_now = document.querySelector(`#webhook_${webhookNum}`);
            const webhookArea = webhook_now?.querySelector(".webhookContent");
            for (const key of webhookKeys.check) {
                const val = webhookSettings[webhookNum][key as keyof WebhookSetting];
                if (val === "") continue;
                const elem = webhook_now?.querySelector<HTMLInputElement>(`.check_${key}`);
                if (elem) elem.checked = val as boolean;
            }
            for (const key of webhookKeys.input) {
                const val = webhookSettings[webhookNum][key as keyof WebhookSetting];
                const elem = webhook_now?.querySelector<HTMLInputElement>(`.input_${key}`);
                if (elem) elem.value = val as string;
            }
            const webhookContent = webhookSettings[webhookNum].webhookContent;
            //console.log(webhookContent);
            Object.entries(webhookContent).forEach((kv: [string, string], ind) => {
                //console.log(kv, ind)
                if (ind > 0) {
                    const keyButtonNumber = ind;
                    const div_webhook = document.createElement("div");
                    div_webhook.className = `div_webhook_${keyButtonNumber}`;

                    const inputKey = document.createElement("input");
                    inputKey.type = "text";
                    inputKey.className = "webhookKey form-control";
                    inputKey.placeholder = "key";
                    inputKey.value = kv[0];

                    const inputValue = document.createElement("input");
                    inputValue.type = "text";
                    inputValue.className = "webhookValue form-control";
                    inputValue.placeholder = "value";
                    inputValue.value = kv[1];

                    const deleteButton = document.createElement("button");
                    deleteButton.className = `btn_webhookContentDelete_${keyButtonNumber} deleteButton btn btn-primary`;
                    deleteButton.type = "button";
                    deleteButton.textContent = "削除";

                    div_webhook.appendChild(inputKey);
                    div_webhook.appendChild(inputValue);
                    div_webhook.appendChild(deleteButton);
                    webhookArea?.appendChild(div_webhook);
                } else {
                    const div_webhook = webhookArea?.querySelector(`.div_webhook_0`);
                    const inputKey = div_webhook?.querySelector<HTMLInputElement>(".webhookKey");
                    const inputValue = div_webhook?.querySelector<HTMLInputElement>(".webhookValue");
                    //console.log(div_webhook, inputKey, inputValue)
                    if (inputKey) inputKey.value = kv[0];
                    if (inputValue) inputValue.value = kv[1];
                    if (div_webhook) div_webhook.className = `.div_webhook_${webhookNum}`;
                }
            })
        })
    });
    setTimeout(()=>{
        ([].concat(["danime", "amazon", "abema"].map(vod=>
            [`valid_${vod}`, [`valid_${vod}Annict`, `valid_${vod}Webhook`, `valid_${vod}Genre`]]
        ), [[`annictSend`, ["danime", "amazon", "abema"]
        .map(vod => `valid_${vod}Annict`).concat(["withTwitter", "withFacebook"])]]))
        .map(d=>[document.querySelector(`#check_${d[0]}`), d[1].map(dd=>document.querySelector(`#check_${dd}`))])
        .forEach(d=>chainCheckBox(d[0], d[1]))
    }, 10)


}
})();

document.addEventListener("click", function (e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (!target) return;
    const webhook_now = target.closest("[id^=webhook_]");
    const clicked_class = target.className;
    //console.log(e.target)
    if (!clicked_class) return;
    //----------- not webhook ------------
    //get value
    if (!webhook_now) {
        if (clicked_class.indexOf("saveButton") != -1) {
            const inputKeyMatch = target.id.match(/(?<=btn_)\S+/);
            if (!inputKeyMatch) return;
            const inputKey = inputKeyMatch[0];
            const inputElem = document.querySelector<HTMLInputElement>(`#input_${inputKey}`);
            const inputContent = inputElem?.value || "";
            chrome.storage.sync.set({ [inputKey]: inputContent });
            showSimpleMessage("OK", "保存しました");
        }
        else if (clicked_class.indexOf("check_settings") != -1) {
            const inputKeyMatch = target.id.match(/(?<=check_)\S+/);
            if (!inputKeyMatch) return;
            const inputKey = inputKeyMatch[0];
            chrome.storage.sync.set({ [inputKey]: (target as HTMLInputElement).checked });
        }  // add or delete block
        else if (clicked_class.indexOf("btn_webhookBlockAdd") != -1) {
            chrome.storage.sync.get({ webhookSettings: webhookDefaultString }, items => {
                let webhookSettings = checkWebhookSettings(items.webhookSettings);
                const webhookNewKey = Date.now();
                webhookSettings[webhookNewKey] = webhookDefaultSetting;
                chrome.storage.sync.set({ webhookSettings: JSON.stringify(webhookSettings) });
                addWebhookBlock(webhookNewKey);
            })
        } else if (clicked_class.indexOf("btn_webhookBlockDelete") != -1) {
            //const webhook_now = target.closest("[id^=webhook_]");
            //if (webhook_now) return;
            const webhookNumMatch = target.id.match(/(?<=btn_webhookBlockDelete_)\d+/);
            if (!webhookNumMatch) return;
            const webhookNum = webhookNumMatch[0];
            const deleted_block = document.querySelector(`#webhook_${webhookNum}`);
            deleted_block?.remove();
            target.remove();
            chrome.storage.sync.get({ webhookSettings: webhookDefaultString }, items => {
                let webhookSettings = checkWebhookSettings(items.webhookSettings);

                delete webhookSettings[webhookNum];
                chrome.storage.sync.set({ webhookSettings: JSON.stringify(webhookSettings) });
            });
        };
        ([].concat(["danime", "amazon", "abema"].map(vod=>
            [`valid_${vod}`, [`valid_${vod}Annict`, `valid_${vod}Webhook`, `valid_${vod}Genre`]]
        ), [[`annictSend`, ["danime", "amazon", "abema"]
        .map(vod => `valid_${vod}Annict`).concat(["withTwitter", "withFacebook"])]]))
        .map(d=>[document.querySelector(`#check_${d[0]}`), d[1].map(dd=>document.querySelector(`#check_${dd}`))])
        .forEach(d=>chainCheckBox(d[0], d[1]))
    
        
    } //----------- webhook content ------------
    else {
        const webhookNum = webhook_now.id.match(/(?<=webhook_)\d+/)[0];
        const webhookArea = webhook_now.querySelector(".webhookContent");
        // add or delete webhook content
        if (clicked_class.indexOf("deleteButton") != -1) {
            const keyButtonNumberMatch = clicked_class.match(/(?<=btn_webhookContentDelete_)\d+/);
            if (!keyButtonNumberMatch) return;
            const keyButtonNumber = keyButtonNumberMatch[0];
            const div_deleted = webhookArea?.querySelector(`.div_webhook_${keyButtonNumber}`);
            div_deleted?.remove();
        }
        else if (clicked_class.indexOf("btn_webhookContentAdd") != -1) {
            const webhookKeys = webhookArea?.querySelectorAll<HTMLInputElement>(".webhookKey");
            const oldKey = webhookKeys?.[webhookKeys.length - 1];
            if (!oldKey || oldKey.value == "") return;
            const keyButtonNumber = webhookKeys?.length || 0;

            const div_webhook = document.createElement("div");
            div_webhook.className = `div_webhook_${keyButtonNumber}`;

            const inputKey = document.createElement("input");
            inputKey.type = "text";
            inputKey.className = "webhookKey form-control";
            inputKey.placeholder = "key";
            inputKey.style.cssText = "width: 15%; display: inline;";

            const inputValue = document.createElement("input");
            inputValue.type = "text";
            inputValue.className = "webhookValue form-control";
            inputValue.placeholder = "value";
            inputValue.style.cssText = "width: 60%; display: inline;";

            const deleteButton = document.createElement("button");
            deleteButton.className = `btn_webhookContentDelete_${keyButtonNumber} deleteButton btn btn-primary`;
            deleteButton.type = "button";
            deleteButton.textContent = "削除";

            div_webhook.appendChild(inputKey);
            div_webhook.appendChild(inputValue);
            div_webhook.appendChild(deleteButton);
            webhookArea?.appendChild(div_webhook);
        }    // get value
        else if (clicked_class.indexOf("btn_webhookSave") != -1) {
            const Keys = Array.from(webhookArea?.querySelectorAll<HTMLInputElement>(".webhookKey") || []).map(el => el.value);
            const Values = Array.from(webhookArea?.querySelectorAll<HTMLInputElement>(".webhookValue") || []).map(el => el.value);
            const webhookContent = Object.assign({}, ...[...Array(Keys.length).keys()].map(ind => ({ [Keys[ind]]: Values[ind] })) as [object, ...object[]]);
            const inputObjs = Object.assign({}, ...webhookKeys.input.map(key => {
                const elem = webhook_now?.querySelector<HTMLInputElement>(`.input_${key}`);
                return { [key]: elem?.value || "" };
            }) as [object, ...object[]]);
            chrome.storage.sync.get({ webhookSettings: webhookDefaultString }, items => {
                let webhookSettings = checkWebhookSettings(items.webhookSettings);
                webhookSettings[webhookNum].webhookContent = webhookContent;
                Object.entries(inputObjs).forEach(kv => webhookSettings[webhookNum][kv[0]] = kv[1]);
                chrome.storage.sync.set({ webhookSettings: JSON.stringify(webhookSettings) });
            });
            showSimpleMessage("OK", "保存しました");
        }
        else if (clicked_class.indexOf("custom-control-webhook-input") != -1) {
            const checkKeyMatch = clicked_class.match(/(?<=check_)webhook\S+/);
            if (!checkKeyMatch) return;
            const checkKey = checkKeyMatch[0];
            const checkVal = (target as HTMLInputElement).checked;
            chrome.storage.sync.get({ webhookSettings: webhookDefaultString }, items => {
                let webhookSettings = checkWebhookSettings(items.webhookSettings);
                webhookSettings[webhookNum][checkKey] = checkVal;
                chrome.storage.sync.set({ webhookSettings: JSON.stringify(webhookSettings) });
            });
        }
    }
});

function chainCheckBox(fromCheckbox: HTMLInputElement | null, toCheckboxesIn: NodeListOf<Element> | Element[], reverse=false){

    //console.log({fromCheckbox, toCheckboxesIn, reverse})
    if (!fromCheckbox) return;
    const toCheckboxes = Array.from(toCheckboxesIn);
    toCheckboxes.forEach(checkbox=>{
        (checkbox as HTMLInputElement).disabled= (fromCheckbox.checked == reverse)
    })
}


function addWebhookBlock(webhookNum) {
    //console.log(webhookNum)
    if (document.querySelector(`#webhook_${webhookNum}`)) return;

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "btn_webhookBlockDelete btn btn-primary";
    deleteButton.id = `btn_webhookBlockDelete_${webhookNum}`;
    deleteButton.textContent = "Webhook設定を削除";
    const webhook_blockHtml = `<div class="well bs-component" id="webhook_${webhookNum}">
    <form class="form-horizontal">
        <div class="form-group">
            <label class="col-lg-2 control-label">Webhook Post URL</label>
            <div class="col-lg-10">
                <input type="text" class="form-control input_postUrl" placeholder="">
            </div>
        </div>

        <div class="form-group">
            <div class="custom-control custom-checkbox">
                <input type="checkbox" class="custom-control-webhook-input check_webhookNoMatched" checked>
                <label class="custom-control-label">作品/エピソードが見つからなかった時</label>
            </div>
            <div class="custom-control custom-webhook-checkbox">
                <input type="checkbox" class="custom-control-webhook-input check_webhookNoWorkId">
                <label class="custom-control-label">Annict DBにdアニメストアのWork IDが登録されていなかった時</label>
            </div>
            <div class="custom-control custom-webhook-checkbox">
                <input type="checkbox" class="custom-control-webhook-input check_webhookSuccess">
                <label class="custom-control-label">エラーが起きなかった時 (上記以外の場合)</label>
            </div>
        </div>
        <div class="form-group">
            <div class="col-lg-10 col-lg-offset-2">
                <button type="button" class="btn_postUrl btn_webhookSave btn btn-primary">保存</button>
            </div>
        </div>
    </form>
    <hr>
    <h3>Webhookの送信内容</h3>
    <form class="form-horizontal">
        <div class="form-group">
            <div class="custom-control custom-webhook-checkbox">
                <input type="checkbox" class="custom-control-webhook-input check_webhookContentChanged">
                <label class="custom-control-label">送信する内容をデフォルトから変更する</label>
            </div>
        </div>
        <div class="form-group">
            <div class="col-lg-10 webhookContent">
                <div class="div_webhook_0">
                    <input type="text" class="webhookKey form-control" placeholder="key" style="width: 15%; display: inline;">
                    <input type="text" class="webhookValue form-control" placeholder="value" style="width: 60%; display: inline;">
                </div>
            </div>
        </div>

        <div class="form-group">
            <div class="col-lg-10 col-lg-offset-2">
                <button type="button" class="btn_webhookContentAdd btn btn-primary">追加</button>
                <button type="button" class="btn_webhookSave btn btn-primary">保存</button>
            </div>
        </div>
    </form>
</div>`

    const optionMenu = document.querySelector("#extraWebhook");
    optionMenu?.appendChild(deleteButton);

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = webhook_blockHtml;
    const webhookBlock = tempDiv.firstElementChild;
    optionMenu?.appendChild(webhookBlock);
}

function checkWebhookSettings(webhookSettingsTmp: string | any): any {
    let webhookSettings: any = {};
    try { webhookSettings = JSON.parse(webhookSettingsTmp); }
    catch (e) {
        try {
            webhookSettings = Object.assign({}, ...[...Array(webhookSettingsTmp.length).keys()]
                .map(key => ({ [key]: webhookSettingsTmp[key] })) as [object, ...object[]]);
        } catch (e) { webhookSettings = JSON.parse(webhookDefaultString); }
    }
    return webhookSettings;
}export {};
