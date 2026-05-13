import dotenv from "dotenv";
import express, { Express, NextFunction, Request, Response } from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import { RegisterRoutes } from "./generated/routes.js";
import { AppError } from "./common/errors/app.error.js";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

/**
 * 공통 미들웨어 설정
 */
app.use(cors());
app.use(morgan("dev"));
app.use(cookieParser());
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

/**
 * 기본 서버 확인용 API
 */
app.get("/", (req: Request, res: Response) => {
  res.send("Hello World! This is TypeScript Server!");
});

/**
 * Tsoa가 자동 생성한 routes 등록
 */
const router = express.Router();

RegisterRoutes(router);

app.use("/api/v1", router);

/**
 * 전역 에러 핸들러
 */
app.use((err: AppError, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    return next(err);
  }

  res.status(err.statusCode || 500).json({
    resultType: "FAIL",
    error: {
      errorCode: err.errorCode || "UNKNOWN",
      reason: err.message || "서버 오류가 발생했습니다.",
      data: err.data || null,
    },
    success: null,
  });
});

/**
 * 서버 실행
 */
app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});