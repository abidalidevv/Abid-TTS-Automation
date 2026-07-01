# Installation Guide

Follow these steps to install and run the **Abid TTS Automation** Chrome Extension:

## 1. Enable Chrome Developer Mode
1. Open Google Chrome.
2. Navigate to `chrome://extensions/` by typing it in the URL bar and pressing Enter.
3. In the top-right corner of the Extensions page, toggle the **Developer mode** switch to **ON**.

## 2. Load the Unpacked Extension
1. Download or clone this project folder to your local computer.
2. In `chrome://extensions/`, click the **Load unpacked** button in the top-left corner.
3. Select the folder containing `manifest.json` (the root of the extension folder).
4. The extension **Abid TTS Automation** will now appear in your list of active extensions.

## 3. Pin the Extension
1. Click the **Extensions puzzle piece icon** in the Chrome toolbar (next to your profile icon).
2. Find **Abid TTS Automation** in the dropdown list.
3. Click the **Pin icon** to pin it to your toolbar for easy access.

## 4. Setup and Run
1. Navigate to the MargVoice execute reading campaign page.
2. Click the pinned extension icon to open the popup.
3. **Choose Voice:** Click the voice dropdown selection to choose your preferred browser TTS voice (e.g. Google or Microsoft voices).
4. **Enable Auto Start (Optional):** Toggle the *Auto Start on page load* switch if you want the automation workflow to start automatically upon loading or reloading the campaign.
5. **Start Automation:** Click the **Start Automation** button. The extension will automatically detect the page, dismiss any overlay modals, select the campaign paragraph, record speech audio, and progress through tasks page by page (submitting on task 5).
