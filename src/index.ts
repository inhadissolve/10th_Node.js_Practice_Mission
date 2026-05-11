import dotenv from "dotenv";
import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";

import { handleUserSignUp } from "./modules/users/controllers/user.controller.js";
import { handleCreateStore } from "./modules/stores/controllers/store.controller.js";
import {
  handleCreateReview,
  handleListMyReviews,
} from "./modules/reviews/controllers/review.controller.js";
import {
  handleCreateMission,
  handleChallengeMission,
  handleListStoreMissions,
  handleListInProgressMissions,
  handleCompleteMission,
} from "./modules/missions/controllers/mission.controller.js";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

/**
 * 공통 미들웨어 설정
 */
app.use(cors());
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

/**
 * 기본 서버 확인용 API
 */
app.get("/", (req: Request, res: Response) => {
  res.send("Hello World! This is TypeScript Server!");
});

app.post("/api/v1/users/signup", handleUserSignUp);

app.post("/api/v1/regions/:regionId/stores", handleCreateStore);

app.post("/api/v1/stores/:storeId/reviews", handleCreateReview);

app.get("/api/v1/users/:userId/reviews", handleListMyReviews);

app.post("/api/v1/stores/:storeId/missions", handleCreateMission);
app.get("/api/v1/stores/:storeId/missions", handleListStoreMissions);
app.get(
  "/api/v1/users/:userId/missions/in-progress",
  handleListInProgressMissions
);
app.patch(
  "/api/v1/users/:userId/missions/:missionId/complete",
  handleCompleteMission
);
app.post("/api/v1/missions/:missionId/challenge", handleChallengeMission);

/**
 * 공통 에러 처리 미들웨어
 */
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("에러 발생:", err.message);

  res.status(400).json({
    error: err.message,
  });
});

/**
 * 서버 실행
 */
app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});