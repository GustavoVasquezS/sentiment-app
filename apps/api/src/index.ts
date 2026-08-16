import { env } from "./config/env.js";
import { createApp } from "./app.js";

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`✅ API escuchando en :${env.PORT} (base path /project/api/v2)`);
});
