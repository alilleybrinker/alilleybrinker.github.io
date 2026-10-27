import { defineConfig, devices } from '@playwright/test';

// Browser checks run against the built site (npm run build first). CI runs
// them on every pull request (.github/workflows/build.yml).
export default defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  // Timing checks share the CPU with nothing else: they run after the rest,
  // one at a time, since other browsers running beside them slow them down.
  projects: [
    { name: 'checks', testIgnore: /performance\.spec\.ts/ },
    { name: 'performance', testMatch: /performance\.spec\.ts/, dependencies: ['checks'], fullyParallel: false },
  ],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://localhost:4399',
    trace: 'retain-on-failure',
    // Without a GPU, Chromium draws the WebGL dither field in software.
    launchOptions: { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] },
  },
  // A plain static server, as GitHub Pages serves the site.
  webServer: {
    command: 'python3 -m http.server 4399 --directory dist',
    url: 'http://localhost:4399',
    reuseExistingServer: !process.env.CI,
    // It logs every request to stderr.
    stderr: 'ignore',
  },
});
