import { connectDB } from "./libs/db";
import logger from "./config/logger";
import { server } from "./app";

const PORT = Number(process.env.PORT);
connectDB();

server.listen(PORT, () => {
  logger.info(`Server running on PORT: ${PORT}`);
});

server.on("error", (error) => {
  logger.error("Failed running server", {
    error: error.message || "server error",
  });
});
