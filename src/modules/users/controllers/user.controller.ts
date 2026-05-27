import {
  Body,
  Controller,
  Get,
  Middlewares,
  Post,
  Request,
  Route,
  Tags,
} from "tsoa";
import { Request as ExpressRequest } from "express";

import { UserSignUpRequest, UserSignUpResponse } from "../dtos/user.dto.js";
import { userSignUp } from "../services/user.service.js";
import { ApiResponse, success } from "../../../common/responses/response.js";
import { authorizeUser } from "../../../common/middlewares/auth.middleware.js";

@Route("users")
@Tags("Users")
export class UserController extends Controller {
  @Post("signup")
  public async handleUserSignUp(
    @Body() body: UserSignUpRequest
  ): Promise<ApiResponse<UserSignUpResponse>> {
    console.log("회원가입을 요청했습니다!");
    console.log("body:", body);

    const user = await userSignUp(body);

    return success(user);
  }

  @Get("guest")
  public async handleGuestPage(): Promise<string> {
    return `
      <h1>게스트 페이지</h1>
      <p>이 페이지는 로그인이 필요 없습니다.</p>
      <ul>
        <li><a href="/api/v1/users/mypage">마이페이지로 이동</a></li>
      </ul>
    `;
  }

  @Get("login")
  public async handleLoginPage(): Promise<string> {
    return `
      <h1>로그인 페이지</h1>
      <p>로그인이 필요한 페이지에서 이동합니다.</p>
      <a href="/api/v1/users/set-login">로그인 쿠키 생성하기</a>
    `;
  }

  @Get("mypage")
  @Middlewares(authorizeUser())
  public async handleMypage(
    @Request() req: ExpressRequest
  ): Promise<string> {
    return `
      <h1>마이페이지</h1>
      <p>환영합니다, ${req.cookies.username}님!</p>
      <p>이 페이지는 로그인한 사람만 볼 수 있습니다.</p>
      <a href="/api/v1/users/set-logout">로그아웃</a>
    `;
  }

  @Get("set-login")
  public async handleSetLogin(
    @Request() req: ExpressRequest
  ): Promise<string> {
    req.res!.cookie("username", "UMC10th", {
      maxAge: 3600000,
      httpOnly: true,
    });

    return `
      <h1>로그인 쿠키 생성 완료</h1>
      <p>username=UMC10th 쿠키가 생성되었습니다.</p>
      <a href="/api/v1/users/mypage">마이페이지로 이동</a>
    `;
  }

  @Get("set-logout")
  public async handleSetLogout(
    @Request() req: ExpressRequest
  ): Promise<string> {
    req.res!.clearCookie("username");

    return `
      <h1>로그아웃 완료</h1>
      <p>쿠키가 삭제되었습니다.</p>
      <a href="/api/v1/users/guest">게스트 페이지로 이동</a>
    `;
  }
}