import { getExtensionSettings, saveExtensionSettings } from "../../../../../../script.js";
import { extension_settings } from "../../../../../extensions.js";
import { EXT_ID } from "../../core/constants.js";
import { setGlobalExt } from "../../../../../variables.js"; // For setting global variables in ST

const MODULE_KEY = 'un';

let isModuleEnabled = false;

export function getUnSettings() {
    if (!extension_settings[EXT_ID][MODULE_KEY]) {
        extension_settings[EXT_ID][MODULE_KEY] = {
            enabled: false,
            plotPref: "",
            writingStyle: "",
            artStyle: ""
        };
    }
    return extension_settings[EXT_ID][MODULE_KEY];
}

export async function saveUnSettings() {
    const s = getUnSettings();
    extension_settings[EXT_ID][MODULE_KEY] = s;
    await saveExtensionSettings();
}

/**
 * Update global macro variables so users can use {{getglobalvar::un_plot_pref}} in their prompts if they want.
 */
function updateGlobalVariables(s) {
    if (typeof setGlobalExt === 'function') {
        setGlobalExt("un_plot_pref", s.plotPref || "");
        setGlobalExt("un_writing_style", s.writingStyle || "");
        setGlobalExt("un_art_style", s.artStyle || "");
    }
}

export function initUserNarrative() {
    if (window?.isXiaobaixEnabled === false) return;

    const settings = getUnSettings();
    isModuleEnabled = settings.enabled === true;

    // Default macro values setup
    updateGlobalVariables(settings);

    // Initial populating of saved values in UI
    const plotInput = document.getElementById("un_plot_pref");
    const writeInput = document.getElementById("un_writing_style");
    const artInput = document.getElementById("un_art_style");
    const saveBtn = document.getElementById("un_save_btn");

    if (plotInput) plotInput.value = settings.plotPref || "";
    if (writeInput) writeInput.value = settings.writingStyle || "";
    if (artInput) artInput.value = settings.artStyle || "";

    // Unbind and rebind save button to avoid duplicates
    if (saveBtn) {
        $(saveBtn).off('click').on('click', async () => {
            const s = getUnSettings();
            s.plotPref = plotInput?.value || "";
            s.writingStyle = writeInput?.value || "";
            s.artStyle = artInput?.value || "";

            await saveUnSettings();
            updateGlobalVariables(s);

            const statusText = document.getElementById("un_save_status");
            if (statusText) {
                statusText.style.display = "inline";
                setTimeout(() => {
                    statusText.style.display = "none";
                }, 2000);
            }
        });
    }

    console.log('[LittleWhiteBox - UN] User Narrative 模块已初始化');
}

export function injectUserNarrative(req, messages) {
    const s = getUnSettings();
    if (!s.enabled) return;

    if (!s.plotPref && !s.writingStyle) {
        return;
    }

    let injectionText = "";

    if (s.plotPref) {
        injectionText += `\n[Plot Preference/Direction: ${s.plotPref}]\n`;
    }
    if (s.writingStyle) {
        injectionText += `\n[Writing Style: ${s.writingStyle}]\n`;
    }

    if (injectionText.length > 0 && Array.isArray(messages)) {
        messages.push({
            role: "system",
            content: `[System Note: The user has requested the following preferences for the current narrative. Please adhere to them strictly in your next response.]${injectionText}`
        });
        console.log("[LittleWhiteBox - UN] 已注入用户剧情偏好/文风");
    }
}

export function cleanupUserNarrative() {
    isModuleEnabled = false;
    const saveBtn = document.getElementById("un_save_btn");
    if (saveBtn) {
        $(saveBtn).off('click');
    }
}
