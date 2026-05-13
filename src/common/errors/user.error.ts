import { AppError } from "./app.error.js";

export class DuplicateUserEmailError extends AppError {
  constructor(data?: unknown) {
    super({
      errorCode: "U001",
      message: "이미 존재하는 이메일입니다.",
      statusCode: 409,
      data,
    });
  }
}