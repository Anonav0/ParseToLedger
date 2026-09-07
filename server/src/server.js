import app from "./app.js";
import env, { validateEnv } from "./config/env.js";

// Validate environment before starting
validateEnv();

app.listen(env.PORT, () => {
  console.log(`[SERVER] Running on port ${env.PORT} (${env.NODE_ENV})`);
  console.log(`[SERVER] Accepting requests from ${env.CLIENT_URL}`);
});
