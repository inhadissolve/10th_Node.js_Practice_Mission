import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import fs from "fs";
import path from "path";

import { handleUserSignUp } from "./modules/users/controllers/user.controller";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(morgan("dev"));
app.use(cookieParser());
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Swagger UI 연결
// TSOA가 생성한 dist/swagger.json을 읽어서 /docs에서 보여준다.
// 단, src/generated/routes.ts의 RegisterRoutes는 사용하지 않는다.
const swaggerPath = path.resolve("dist/swagger.json");

if (fs.existsSync(swaggerPath)) {
  const swaggerFile = JSON.parse(fs.readFileSync(swaggerPath, "utf8"));
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerFile));
}

// 기본 확인용 라우트
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// 기존 Express 핸들러 방식 유지
app.post("/api/v1/users/signup", handleUserSignUp);

app.listen(PORT, () => {
  console.log(`[server]: Server is running at http://localhost:${PORT}`);
});