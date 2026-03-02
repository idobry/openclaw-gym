import type { VercelRequest, VercelResponse } from "@vercel/node";

let appPromise: Promise<any> | null = null;
let loadedApp: any = null;
let loadError: any = null;

function loadApp() {
  if (!appPromise) {
    appPromise = import("../src/index")
      .then((mod) => {
        loadedApp = mod.default;
      })
      .catch((err) => {
        loadError = {
          message: err.message,
          stack: err.stack?.split("\n").slice(0, 15),
        };
      });
  }
  return appPromise;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await loadApp();
  if (loadError) {
    return res.status(500).json({ loadError });
  }
  loadedApp(req, res);
}
