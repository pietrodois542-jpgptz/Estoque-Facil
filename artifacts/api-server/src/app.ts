import express, { type Express } from "express";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import { fileURLToPath } from "node:url";
import path from "node:path";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();
app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cookieParser());
app.use(express.json({ limit: "32kb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

if (process.env.SCPE_SERVE_WEB === "1") {
  const webRoot = fileURLToPath(
    new URL("../../estoque-facil/dist/public/", import.meta.url),
  );
  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "Rota não encontrada." });
  });
  app.use(express.static(webRoot));
  app.get(/.*/, (req, res, next) => {
    if (path.extname(req.path) || !req.accepts("html")) return next();
    return res.sendFile("index.html", { root: webRoot });
  });
}

export default app;
