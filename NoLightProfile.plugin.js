/**
* @name NoLightProfile
* @author blabdude
* @description strips user profiles of light themes and/or custom colours
* @source https://github.com/mchangrh/bd-plugin
* @updateUrl https://mchangrh.github.io/bd-plugin/NoLightProfile.plugin.js
* @version 0.0.1
*/

let removeAll = BdApi.loadData("NoLightProfile", "removeAll") ?? false;
const popoutClass = "div.userPopoutOuter-3AVBmJ";

function modifyProfile() {
  const selector = removeAll
    ? ":not(.noLightProfile-override)"
    : ".theme-light:not(.noLightProfile-override)";
  const profiles = document.querySelectorAll(popoutClass + selector);
  for (const elem of profiles) {
    elem.classList.replace("theme-light", "theme-dark");
    if (removeAll) elem.style = "";
    else {
      // remove background colour override
      elem.style.setProperty("--profile-body-background-color", "");
      // remove pill colour override
      elem.style.setProperty("--profile-role-pill-background-color", "");
    }
    elem.classList.add("NoLightProfile-override");
  }
}
const mutationCallback = (mutations) => {
  if (mutations.length === 0) return;
  modifyProfile();
};
const myObserver = new MutationObserver(mutationCallback);

module.exports = class MyPlugin {
  start() {
    removeAll = BdApi.loadData("NoLightProfile", "removeAll") ?? false;
    const layerContainer = document.querySelectorAll("div.layerContainer-2v_Sit")[1];
      const observerOptions = {
        childList: true,
        subtree: false,
      };
      myObserver.observe(layerContainer, observerOptions);
    }
    stop() {
      myObserver.disconnect();
    }
    getSettingsPanel() {
      const panel = document.createElement("div");
      panel.id = "settings";
      const oldInput = BdApi.loadData("NoLightProfile", "removeAll");
      
      const removeAllSetting = document.createElement("div");
      removeAllSetting.classList.add("setting");
      
      const removeAllLabel = document.createElement("span");
      removeAllLabel.textContent = "Strip custom profiles";
      removeAllLabel.style.color = "white";
      
      const removeAllInput = document.createElement("input");
      removeAllInput.type = "checkbox";
      removeAllInput.name = "removeAll";
      removeAllInput.checked = oldInput;
      removeAllInput.addEventListener("change", () => {
        const newValue = removeAllInput.checked;
        BdApi.saveData("NoLightProfile", "removeAll", newValue);
        removeAll = newValue;
      });
      
      panel.append(removeAllLabel, removeAllInput);
      return panel;
    }
  };
  