# Screenshots

Images in this folder are captures of Storybook stories. The components are the ones the app uses. The numbers are the fixture rows in those stories, not a live export and not a claim about harvest results.

Storybook must be running (`pnpm storybook`, port 6006). Capture with the `agent-browser` CLI at a 1280×1400 viewport. `&full=true` is the story URL this repo uses. The file is a shot of `#storybook-preview-iframe`, so the Storybook toolbar is not in the image. Empty margin below the story was cropped afterward. The pixels of the UI were not edited.

Pond stories show toasts when today's weight, deaths, and actual feed are missing. Those toasts were closed before the shot so the log stays readable. They are still part of the app.

```bash
agent-browser close
agent-browser set viewport 1280 1400
agent-browser open "http://localhost:6006/?path=/story/<id>&full=true"
agent-browser wait --load networkidle
agent-browser screenshot "#storybook-preview-iframe" docs/screenshots/<file>.png
```

| File                                             | Story                          | What it shows                                                                                                                          |
| ------------------------------------------------ | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| [pond-log-treatment.png](pond-log-treatment.png) | `pakan-pondlog--treatment-tab` | Pond A3 treatment timeline, planned-treatment chips, and the empty date filter.                                                        |
| [pond-log-harian.png](pond-log-harian.png)       | `pakan-pondlog--two-ponds`     | Harian log. The story opens the cycle info control; that popover was closed before the shot. The table scrolls sideways at this width. |
| [pond-log-grafik.png](pond-log-grafik.png)       | `pakan-pondlog--grafik`        | Biomass and deaths. The story applies 2–3 Okt 2026 before the shot.                                                                    |
| [login.png](login.png)                           | `auth-loginform--default`      | Username and password form. No sign-up control.                                                                                        |
| [feed-names.png](feed-names.png)                 | `pakan-feedmanager--default`   | Feed-name list. A used feed cannot be deleted.                                                                                         |

Recapture a file when the story's layout changes. Do not edit an image to add a control the story does not render. If Storybook is down, leave the old file and say so in the pull request instead of drawing a replacement.
