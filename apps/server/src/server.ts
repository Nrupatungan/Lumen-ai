import { connectDB } from "@repo/db";
import { logger } from "@repo/observability";
import { server } from "./app.js";

const PORT = Number(process.env.PORT);
connectDB(process.env.MONGO_URI!, process.env.MONGO_DB_NAME!);

server.listen(PORT, () => {
  logger.info(`Server running on PORT: ${PORT}`);
});

server.on("error", (error) => {
  logger.error("Failed running server", {
    error: error.message || "server error",
  });
});
