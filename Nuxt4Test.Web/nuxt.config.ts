import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// Read API URL from C# project's launchSettings.json for development
function getDevApiUrl(): string {
  try {
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const launchSettingsPath = resolve(
      __dirname,
      "../Nuxt4Test.Api/Properties/launchSettings.json"
    );
    const launchSettings = JSON.parse(
      readFileSync(launchSettingsPath, "utf-8")
    );
    // Use the http profile's applicationUrl
    const httpProfile = launchSettings.profiles?.http;
    if (httpProfile?.applicationUrl) {
      return httpProfile.applicationUrl;
    }
  } catch {
    console.warn("Could not read launchSettings.json, using default API URL");
  }
  return "http://localhost:5054";
}

const devApiUrl = getDevApiUrl();

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: ["@nuxt/eslint", "vuetify-nuxt-module"],
  vuetify: {
    /* module options */
  },
  runtimeConfig: {
    public: {
      apiBaseUrl:
        process.env.NUXT_PUBLIC_API_BASE_URL ||
        "https://nuxt4test.azurewebsites.net",
    },
  },
  nitro: {
    devProxy: {
      "/api/": {
        target: `${devApiUrl}/`,
        changeOrigin: true,
      },
    },
  },
});
