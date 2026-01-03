import { logger } from "@repo/observability";
import morgan from "morgan";

const morganStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

const httpLogger = morgan(
  ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version - :response-time ms" :status :res[content-length] ":referrer" ":user-agent"',
  { stream: morganStream },
);

export default httpLogger;
