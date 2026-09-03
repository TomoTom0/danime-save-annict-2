"use strict";
(() => {
  // src/scripts/options.ts
  function showSimpleMessage(title, message) {
    alert(`${title}: ${message}`);
  }
  var webhookDefaultSetting = {
    postUrl: "",
    webhookNoMatched: true,
    webhookNoWorkId: false,
    webhookSuccess: false,
    webhookContentChanged: false,
    webhookContent: {}
  };
  var webhookDefaultString = JSON.stringify({ [Date.now()]: webhookDefaultSetting });
  var webhookKeys = {
    check: ["webhookNoMatched", "webhookNoWorkId", "webhookSuccess", "webhookContentChanged"],
    input: ["postUrl"]
  };
  var amazonAbemaDefaults = ["amazon", "abema"].map((key) => ({ [`valid_${key}`]: false }));
  var checkValid1 = Object.assign({ "valid_danime": true }, ...amazonAbemaDefaults);
  var vodDefaults = ["danime", "amazon", "abema"].map((key) => ({ [`valid_${key}Annict`]: true, [`valid_${key}Webhook`]: true, [`valid_${key}Genre`]: false }));
  var checkValid2 = Object.assign({}, ...vodDefaults);
  var checkValid = Object.assign(checkValid1, checkValid2);
  var otherKeys = {
    input: { token: "", sendingTime: 300 },
    check: Object.assign({ annictSend: true, withTwitter: false, withFacebook: false }, checkValid)
  };
  (function() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }
    function loadInputSettings() {
      chrome.storage.sync.get(
        otherKeys.input,
        (items) => Object.entries(items).forEach((kv) => {
          const elem = document.querySelector(`#input_${kv[0]}`);
          if (elem) elem.value = kv[1];
        })
      );
    }
    function loadCheckboxSettings() {
      chrome.storage.sync.get(otherKeys.check, (items) => {
        Object.entries(items).forEach((kv) => {
          const elem = document.querySelector(`#check_${kv[0]}`);
          if (elem) elem.checked = kv[1];
        });
      });
    }
    function loadWebhookSettings() {
      chrome.storage.sync.get({ webhookSettings: webhookDefaultString }, (items) => {
        const webhookSettings = checkWebhookSettings(items.webhookSettings);
        let firstBlock = true;
        Object.keys(webhookSettings).forEach((webhookNum) => {
          if (firstBlock) {
            const firstWebhook = document.querySelector("#webhook_0");
            if (firstWebhook) firstWebhook.id = `webhook_${webhookNum}`;
            firstBlock = !firstBlock;
          } else addWebhookBlock(webhookNum);
          const webhook_now = document.querySelector(`#webhook_${webhookNum}`);
          const webhookArea = webhook_now?.querySelector(".webhookContent");
          for (const key of webhookKeys.check) {
            const val = webhookSettings[webhookNum][key];
            if (val === "") continue;
            const elem = webhook_now?.querySelector(`.check_${key}`);
            if (elem) elem.checked = val;
          }
          for (const key of webhookKeys.input) {
            const val = webhookSettings[webhookNum][key];
            const elem = webhook_now?.querySelector(`.input_${key}`);
            if (elem) elem.value = val;
          }
          const webhookContent = webhookSettings[webhookNum].webhookContent;
          Object.entries(webhookContent).forEach((kv, ind) => {
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
              deleteButton.textContent = "\u524A\u9664";
              div_webhook.appendChild(inputKey);
              div_webhook.appendChild(inputValue);
              div_webhook.appendChild(deleteButton);
              webhookArea?.appendChild(div_webhook);
            } else {
              const div_webhook = webhookArea?.querySelector(`.div_webhook_0`);
              const inputKey = div_webhook?.querySelector(".webhookKey");
              const inputValue = div_webhook?.querySelector(".webhookValue");
              if (inputKey) inputKey.value = kv[0];
              if (inputValue) inputValue.value = kv[1];
              if (div_webhook) div_webhook.className = `.div_webhook_${webhookNum}`;
            }
          });
        });
      });
    }
    function setupCheckboxChains() {
      setTimeout(() => {
        [].concat(["danime", "amazon", "abema"].map(
          (vod) => [`valid_${vod}`, [`valid_${vod}Annict`, `valid_${vod}Webhook`, `valid_${vod}Genre`]]
        ), [[`annictSend`, ["danime", "amazon", "abema"].map((vod) => `valid_${vod}Annict`).concat(["withTwitter", "withFacebook"])]]).map((d) => [document.querySelector(`#check_${d[0]}`), d[1].map((dd) => document.querySelector(`#check_${dd}`))]).forEach((d) => chainCheckBox(d[0], d[1]));
      }, 10);
    }
    function init() {
      loadInputSettings();
      loadCheckboxSettings();
      loadWebhookSettings();
      setupCheckboxChains();
    }
  })();
  document.addEventListener("click", function(e) {
    const target = e.target;
    if (!target) return;
    const webhook_now = target.closest("[id^=webhook_]");
    const clicked_class = target.className;
    if (!clicked_class) return;
    if (!webhook_now) {
      if (clicked_class.indexOf("saveButton") != -1) {
        const inputKeyMatch = target.id.match(/(?<=btn_)\S+/);
        if (!inputKeyMatch) return;
        const inputKey = inputKeyMatch[0];
        const inputElem = document.querySelector(`#input_${inputKey}`);
        const inputContent = inputElem?.value || "";
        chrome.storage.sync.set({ [inputKey]: inputContent });
        showSimpleMessage("OK", "\u4FDD\u5B58\u3057\u307E\u3057\u305F");
      } else if (clicked_class.indexOf("check_settings") != -1) {
        const inputKeyMatch = target.id.match(/(?<=check_)\S+/);
        if (!inputKeyMatch) return;
        const inputKey = inputKeyMatch[0];
        chrome.storage.sync.set({ [inputKey]: target.checked });
      } else if (clicked_class.indexOf("btn_webhookBlockAdd") != -1) {
        chrome.storage.sync.get({ webhookSettings: webhookDefaultString }, (items) => {
          let webhookSettings = checkWebhookSettings(items.webhookSettings);
          const webhookNewKey = Date.now();
          webhookSettings[webhookNewKey] = webhookDefaultSetting;
          chrome.storage.sync.set({ webhookSettings: JSON.stringify(webhookSettings) });
          addWebhookBlock(webhookNewKey);
        });
      } else if (clicked_class.indexOf("btn_webhookBlockDelete") != -1) {
        const webhookNumMatch = target.id.match(/(?<=btn_webhookBlockDelete_)\d+/);
        if (!webhookNumMatch) return;
        const webhookNum = webhookNumMatch[0];
        const deleted_block = document.querySelector(`#webhook_${webhookNum}`);
        deleted_block?.remove();
        target.remove();
        chrome.storage.sync.get({ webhookSettings: webhookDefaultString }, (items) => {
          let webhookSettings = checkWebhookSettings(items.webhookSettings);
          delete webhookSettings[webhookNum];
          chrome.storage.sync.set({ webhookSettings: JSON.stringify(webhookSettings) });
        });
      }
      ;
      [].concat(["danime", "amazon", "abema"].map(
        (vod) => [`valid_${vod}`, [`valid_${vod}Annict`, `valid_${vod}Webhook`, `valid_${vod}Genre`]]
      ), [[`annictSend`, ["danime", "amazon", "abema"].map((vod) => `valid_${vod}Annict`).concat(["withTwitter", "withFacebook"])]]).map((d) => [document.querySelector(`#check_${d[0]}`), d[1].map((dd) => document.querySelector(`#check_${dd}`))]).forEach((d) => chainCheckBox(d[0], d[1]));
    } else {
      const webhookNumMatch = webhook_now.id.match(/(?<=webhook_)\d+/);
      if (!webhookNumMatch) return;
      const webhookNum = webhookNumMatch[0];
      const webhookArea = webhook_now.querySelector(".webhookContent");
      if (clicked_class.indexOf("deleteButton") != -1) {
        const keyButtonNumberMatch = clicked_class.match(/(?<=btn_webhookContentDelete_)\d+/);
        if (!keyButtonNumberMatch) return;
        const keyButtonNumber = keyButtonNumberMatch[0];
        const div_deleted = webhookArea?.querySelector(`.div_webhook_${keyButtonNumber}`);
        div_deleted?.remove();
      } else if (clicked_class.indexOf("btn_webhookContentAdd") != -1) {
        const webhookKeys2 = webhookArea?.querySelectorAll(".webhookKey");
        const oldKey = webhookKeys2?.[webhookKeys2.length - 1];
        if (!oldKey || oldKey.value == "") return;
        const keyButtonNumber = webhookKeys2?.length || 0;
        const div_webhook = document.createElement("div");
        div_webhook.className = `div_webhook_${keyButtonNumber}`;
        const inputKey = document.createElement("input");
        inputKey.type = "text";
        inputKey.className = "webhookKey form-control";
        inputKey.placeholder = "key";
        const inputValue = document.createElement("input");
        inputValue.type = "text";
        inputValue.className = "webhookValue form-control";
        inputValue.placeholder = "value";
        const deleteButton = document.createElement("button");
        deleteButton.className = `btn_webhookContentDelete_${keyButtonNumber} deleteButton btn btn-primary`;
        deleteButton.type = "button";
        deleteButton.textContent = "\u524A\u9664";
        div_webhook.appendChild(inputKey);
        div_webhook.appendChild(inputValue);
        div_webhook.appendChild(deleteButton);
        webhookArea?.appendChild(div_webhook);
      } else if (clicked_class.indexOf("btn_webhookSave") != -1) {
        const Keys = Array.from(webhookArea?.querySelectorAll(".webhookKey") || []).map((el) => el.value);
        const Values = Array.from(webhookArea?.querySelectorAll(".webhookValue") || []).map((el) => el.value);
        const webhookContent = Object.assign({}, ...[...Array(Keys.length).keys()].map((ind) => ({ [Keys[ind]]: Values[ind] })));
        const inputObjs = Object.assign({}, ...webhookKeys.input.map((key) => {
          const elem = webhook_now?.querySelector(`.input_${key}`);
          return { [key]: elem?.value || "" };
        }));
        chrome.storage.sync.get({ webhookSettings: webhookDefaultString }, (items) => {
          let webhookSettings = checkWebhookSettings(items.webhookSettings);
          webhookSettings[webhookNum].webhookContent = webhookContent;
          Object.entries(inputObjs).forEach((kv) => webhookSettings[webhookNum][kv[0]] = kv[1]);
          chrome.storage.sync.set({ webhookSettings: JSON.stringify(webhookSettings) });
        });
        showSimpleMessage("OK", "\u4FDD\u5B58\u3057\u307E\u3057\u305F");
      } else if (clicked_class.indexOf("custom-control-webhook-input") != -1) {
        const checkKeyMatch = clicked_class.match(/(?<=check_)webhook\S+/);
        if (!checkKeyMatch) return;
        const checkKey = checkKeyMatch[0];
        const checkVal = target.checked;
        chrome.storage.sync.get({ webhookSettings: webhookDefaultString }, (items) => {
          let webhookSettings = checkWebhookSettings(items.webhookSettings);
          webhookSettings[webhookNum][checkKey] = checkVal;
          chrome.storage.sync.set({ webhookSettings: JSON.stringify(webhookSettings) });
        });
      }
    }
  });
  function chainCheckBox(fromCheckbox, toCheckboxesIn, reverse = false) {
    if (!fromCheckbox) return;
    const toCheckboxes = Array.from(toCheckboxesIn);
    toCheckboxes.forEach((checkbox) => {
      checkbox.disabled = fromCheckbox.checked == reverse;
    });
  }
  function createDeleteButton(webhookNum) {
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "btn_webhookBlockDelete btn btn-primary";
    deleteButton.id = `btn_webhookBlockDelete_${webhookNum}`;
    deleteButton.textContent = "Webhook\u8A2D\u5B9A\u3092\u524A\u9664";
    return deleteButton;
  }
  function getWebhookBlockHtml(webhookNum) {
    return `<div class="well bs-component" id="webhook_${webhookNum}">
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
                <label class="custom-control-label">\u4F5C\u54C1/\u30A8\u30D4\u30BD\u30FC\u30C9\u304C\u898B\u3064\u304B\u3089\u306A\u304B\u3063\u305F\u6642</label>
            </div>
            <div class="custom-control custom-webhook-checkbox">
                <input type="checkbox" class="custom-control-webhook-input check_webhookNoWorkId">
                <label class="custom-control-label">Annict DB\u306Bd\u30A2\u30CB\u30E1\u30B9\u30C8\u30A2\u306EWork ID\u304C\u767B\u9332\u3055\u308C\u3066\u3044\u306A\u304B\u3063\u305F\u6642</label>
            </div>
            <div class="custom-control custom-webhook-checkbox">
                <input type="checkbox" class="custom-control-webhook-input check_webhookSuccess">
                <label class="custom-control-label">\u30A8\u30E9\u30FC\u304C\u8D77\u304D\u306A\u304B\u3063\u305F\u6642 (\u4E0A\u8A18\u4EE5\u5916\u306E\u5834\u5408)</label>
            </div>
        </div>
        <div class="form-group">
            <div class="col-lg-10 col-lg-offset-2">
                <button type="button" class="btn_postUrl btn_webhookSave btn btn-primary">\u4FDD\u5B58</button>
            </div>
        </div>
    </form>
    <hr>
    <h3>Webhook\u306E\u9001\u4FE1\u5185\u5BB9</h3>
    <form class="form-horizontal">
        <div class="form-group">
            <div class="custom-control custom-webhook-checkbox">
                <input type="checkbox" class="custom-control-webhook-input check_webhookContentChanged">
                <label class="custom-control-label">\u9001\u4FE1\u3059\u308B\u5185\u5BB9\u3092\u30C7\u30D5\u30A9\u30EB\u30C8\u304B\u3089\u5909\u66F4\u3059\u308B</label>
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
                <button type="button" class="btn_webhookContentAdd btn btn-primary">\u8FFD\u52A0</button>
                <button type="button" class="btn_webhookSave btn btn-primary">\u4FDD\u5B58</button>
            </div>
        </div>
    </form>
</div>`;
  }
  function addWebhookBlock(webhookNum) {
    if (document.querySelector(`#webhook_${webhookNum}`)) return;
    const optionMenu = document.querySelector("#extraWebhook");
    const deleteButton = createDeleteButton(webhookNum);
    optionMenu?.appendChild(deleteButton);
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = getWebhookBlockHtml(webhookNum);
    const webhookBlock = tempDiv.firstElementChild;
    if (webhookBlock) optionMenu?.appendChild(webhookBlock);
  }
  function checkWebhookSettings(webhookSettingsTmp) {
    let webhookSettings = {};
    try {
      webhookSettings = JSON.parse(webhookSettingsTmp);
    } catch (e) {
      try {
        webhookSettings = Object.assign({}, ...[...Array(webhookSettingsTmp.length).keys()].map((key) => ({ [key]: webhookSettingsTmp[key] })));
      } catch (e2) {
        webhookSettings = JSON.parse(webhookDefaultString);
      }
    }
    return webhookSettings;
  }
})();
//# sourceMappingURL=options.js.map
