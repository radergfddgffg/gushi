import { extension_settings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";

const extensionName = "gushi";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

// Default settings
const defaultSettings = {
    plotPref: "",
    writingStyle: "",
    artStyle: ""
};

// Initialize settings
if (!extension_settings[extensionName]) {
    extension_settings[extensionName] = defaultSettings;
}
const settings = extension_settings[extensionName];

/**
 * Handle UI setup and click events.
 */
function setupUI(html) {
    const extContainer = document.getElementById("extensions_settings");
    if (!extContainer) return;

    extContainer.insertAdjacentHTML('beforeend', html);

    const plotInput = document.getElementById("st-plot-pref");
    const writeInput = document.getElementById("st-writing-style");
    const artInput = document.getElementById("st-art-style");

    if (plotInput) plotInput.value = settings.plotPref || "";
    if (writeInput) writeInput.value = settings.writingStyle || "";
    if (artInput) artInput.value = settings.artStyle || "";

    const saveBtn = document.getElementById("st-save-btn");
    if (saveBtn) {
        saveBtn.addEventListener("click", () => {
            if (plotInput) settings.plotPref = plotInput.value;
            if (writeInput) settings.writingStyle = writeInput.value;
            if (artInput) settings.artStyle = artInput.value;

            extension_settings[extensionName] = settings;
            saveSettingsDebounced();

            const statusText = document.getElementById("st-save-status");
            if (statusText) {
                statusText.style.display = "inline";
                setTimeout(() => {
                    statusText.style.display = "none";
                }, 2000);
            }
        });
    }
}

/**
 * The Interceptor function explicitly required by our manifest.
 */
export async function storyTailorGenerateInterceptor(req) {
    if (!settings.plotPref && !settings.writingStyle) {
        return;
    }

    let injectionText = "";

    if (settings.plotPref) {
        injectionText += `\n[Plot/Story Preference: ${settings.plotPref}]\n`;
    }
    if (settings.writingStyle) {
        injectionText += `\n[Writing Style/Tone requirement: ${settings.writingStyle}]\n`;
    }

    if (injectionText.length > 0) {
        req.messages.push({
            role: "system",
            content: `[System Note: The user has requested the following preferences for the current narrative. Please adhere to them strictly in your next response.]${injectionText}`
        });
    }
}

// Ensure init execution like LittleWhiteBox
jQuery(async () => {
    try {
        const fetchHtml = await fetch(`${extensionFolderPath}/index.html`);
        if (fetchHtml.ok) {
            const htmlText = await fetchHtml.text();
            setupUI(htmlText);
        } else {
            console.warn(`[Story Tailor] Could not fetch UI html from ${extensionFolderPath}`);
        }
    } catch (e) {
        console.warn(`[Story Tailor] Error loading UI: \n`, e);
    }
});
