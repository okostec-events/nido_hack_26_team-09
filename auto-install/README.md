# Auto Install (optional, recommended)

Get your computer ready for Nido Hack '26 in ~5 minutes with one double-click,
instead of manually installing 4 separate apps.

## What it installs

- **VS Code** — code editor
- **Node.js LTS** — JavaScript runtime
- **GitHub Desktop** — for saving and sharing your code
- **Git** — version control
- **Cline** — AI helper extension for VS Code

It then **clones your team's repo** to `~/Documents/GitHub/<team-name>/` so your whole team can collaborate on the same code.

## How to use it

1. **Make sure you have internet** — the script will download ~400 MB of apps
2. **Double-click the script for your computer**:
   - **Mac**: `setup-mac.command`
   - **Windows**: `setup-windows.bat`
3. **If you see a security warning on Mac** (*"Apple could not verify ... is free of malware"*), that's expected — our script is unsigned. It is safe. To run it anyway:
   1. Click **Done** on the warning (do NOT click "Move to Trash")
   2. Open **System Settings → Privacy & Security**
   3. Scroll down to the **Security** section — you'll see *"setup-mac.command was blocked..."* with an **Open Anyway** button — click it
   4. Enter your Mac password if asked, then double-click `setup-mac.command` again. This time it runs.
4. **Wait ~5 minutes**. You'll see progress in the terminal window that opens.
   The script will ask for your Mac password once (to install Homebrew) — that is normal.
5. **VS Code opens automatically** when it's done, with your team's cloned repo loaded. Double-click `index.html` in the left sidebar to start the Hackathon Clicker game.

> **Note for advanced users**: if the click-based path above doesn't work or you'd prefer to skip the Privacy & Security prompt entirely, open Terminal (press `Cmd+Space`, type "terminal", hit Enter) and paste this command (replace `XX` with your team number, e.g. `02`):
>
> ```
> bash -c "$(curl -fsSL https://raw.githubusercontent.com/okostec-events/nido_hack_26_team-01/main/auto-install/setup-mac-bootstrap.sh)" "" XX
> ```
>
> This downloads + runs the same installer without any security prompts (Terminal-downloaded files are not quarantined by macOS).

## Which team repo does the script clone?

The script reads `TEAM_URL.txt` (in this folder) to know which repo belongs to your team. **Don't edit or delete that file.**

If `TEAM_URL.txt` is missing for any reason, the script falls back to guessing your team from the folder name — but the config file is the reliable path.

> ⚠️ **If a friend on a different team gives you their ZIP**, your script will clone *their* team's repo (not yours). If that happens, ask an organizer to fix it manually in GitHub Desktop, or just download a fresh ZIP from your own welcome email.

## Running it at home before the event (recommended)

40 students downloading ~400 MB each at the venue = a lot of wifi.
**If you can, run this script at home the night before the event** so you arrive ready to build.

## If the script fails

Follow the original manual install steps in the main `ReadMe.md` at the top of this folder.
The manual path still works exactly as it always did — this script is just a faster alternative.

## What the script doesn't touch

This script only INSTALLS apps — it doesn't modify any files in the project or anywhere else.
If you uninstall the apps later, nothing in the project is affected.
