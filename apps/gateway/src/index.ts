import { createApp } from "./app.js";

const port = 8080;
const app = createApp();

app.listen(port, () => {
  console.log(`Gateway listening on port ${port}`);
});