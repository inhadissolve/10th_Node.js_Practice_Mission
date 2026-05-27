import dotenv from "dotenv";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import jwt from "jsonwebtoken";
import { prisma } from "./db.config.js";

dotenv.config();

/**
 * Access Token 생성
 *
 * Access Token은 일반 API 요청에 사용하는 짧은 수명의 토큰입니다.
 * Payload에는 사용자를 식별할 수 있는 최소 정보만 담습니다.
 */
export const generateAccessToken = (user: { id: number; email: string }) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
    },
    process.env.JWT_SECRET!,
    {
      expiresIn: "1h",
    }
  );
};

/**
 * Refresh Token 생성
 *
 * Refresh Token은 Access Token을 재발급받기 위한 긴 수명의 토큰입니다.
 * 여기서는 최소 정보인 user id만 담습니다.
 */
export const generateRefreshToken = (user: { id: number }) => {
  return jwt.sign(
    {
      id: user.id,
    },
    process.env.JWT_SECRET!,
    {
      expiresIn: "14d",
    }
  );
};

/**
 * Google 로그인 후 사용자 조회 또는 생성
 *
 * Google에서 전달받은 profile 정보 중 이메일을 기준으로
 * 기존 사용자가 있으면 조회하고, 없으면 새로 생성합니다.
 */
const googleVerify = async (profile: Profile) => {
  const email = profile.emails?.[0]?.value;

  if (!email) {
    throw new Error("Google 프로필에 이메일이 없습니다.");
  }

  let user = await prisma.user.findFirst({
    where: { email },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name: profile.displayName,
        gender: "추후 수정",
        birth: new Date(1970, 0, 1),
        address: "추후 수정",
        detailAddress: "추후 수정",
        phoneNumber: "추후 수정",
      },
    });
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
  };
};

/**
 * Google OAuth Strategy
 *
 * /oauth2/login/google 로 접속하면 Google 로그인 화면으로 이동하고,
 * 로그인 성공 후 /oauth2/callback/google 로 돌아옵니다.
 */
export const googleStrategy = new GoogleStrategy(
  {
    clientID: process.env.PASSPORT_GOOGLE_CLIENT_ID!,
    clientSecret: process.env.PASSPORT_GOOGLE_CLIENT_SECRET!,
    callbackURL: "http://localhost:3000/oauth2/callback/google",
    scope: ["email", "profile"],
  },
  async (_accessToken, _refreshToken, profile, cb) => {
    try {
      const user = await googleVerify(profile);

      const tokens = {
        accessToken: generateAccessToken(user),
        refreshToken: generateRefreshToken(user),
      };

      return cb(null, tokens);
    } catch (err) {
      return cb(err as Error);
    }
  }
);

/**
 * JWT Strategy
 *
 * Authorization 헤더에 담긴 Bearer Token을 검증합니다.
 * 토큰이 유효하면 req.user에 사용자 정보를 넣어줍니다.
 */
export const jwtStrategy = new JwtStrategy(
  {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET!,
  },
  async (payload: { id: number; email?: string }, done) => {
    try {
      const user = await prisma.user.findFirst({
        where: {
          id: payload.id,
        },
      });

      if (!user) {
        return done(null, false);
      }

      return done(null, user);
    } catch (err) {
      return done(err, false);
    }
  }
);