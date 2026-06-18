import dotenv from "dotenv";
import express, { Express, NextFunction, Request, Response } from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import passport from "passport";

import { RegisterRoutes } from "./generated/routes.js";
import { AppError } from "./common/errors/app.error.js";
import { googleStrategy, jwtStrategy } from "./auth.config.js";

dotenv.config();

/**
 * Passport Strategy 등록
 *
 * googleStrategy: Google OAuth 로그인 처리
 * jwtStrategy: Bearer Token 기반 JWT 인증 처리
 */
passport.use(googleStrategy);
passport.use(jwtStrategy);

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
 * Passport 초기화
 *
 * session: false 방식으로 사용할 예정이기 때문에
 * express-session은 따로 사용하지 않습니다.
 */
app.use(passport.initialize());

/**
 * 기본 서버 확인용 API
 */
app.get("/", (req: Request, res: Response) => {
  res.send("Hello World! This is TypeScript Server!");
});

/**
 * Google 로그인 시작 라우트
 *
 * 브라우저에서 아래 주소로 접속하면 Google 로그인 화면으로 이동합니다.
 * http://localhost:3000/oauth2/login/google
 */
app.get(
  "/oauth2/login/google",
  passport.authenticate("google", { session: false })
);

/**
 * Google 로그인 Callback 라우트
 *
 * Google 로그인이 성공하면 이 주소로 돌아옵니다.
 * 성공 시 accessToken, refreshToken을 JSON으로 응답합니다.
 */
app.get(
  "/oauth2/callback/google",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login-failed",
  }),
  (req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      tokens: req.user,
    });
  }
);

/**
 * Google 로그인 실패 라우트
 */
app.get("/login-failed", (req: Request, res: Response) => {
  res.status(401).json({
    success: false,
    message: "Google 로그인에 실패했습니다.",
  });
});

/**
 * JWT 인증 미들웨어
 *
 * Authorization: Bearer <accessToken>
 * 형식으로 토큰을 보내야 통과할 수 있습니다.
 */
const isLogin = passport.authenticate("jwt", { session: false });

/**
 * JWT 인증 테스트용 보호 라우트
 *
 * accessToken이 있으면 성공하고,
 * 없거나 잘못된 토큰이면 401 Unauthorized가 발생합니다.
 */
app.get("/mypage", isLogin, (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "인증 성공! 마이페이지에 접근했습니다.",
    user: req.user,
  });
});

/**
 * Tsoa가 자동 생성한 routes 등록
 *
 * 기존 API들은 /api/v1 경로 아래에서 동작합니다.
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