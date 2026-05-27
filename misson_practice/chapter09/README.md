좋아. 이제 **9주차 실습**으로 넘어가자.
이번 실습은 `10th_Node.js_Practice_Mission` 레포에서 진행하면 되고, 핵심은 **Google OAuth 로그인 구현 → JWT 발급 → Bearer Token으로 보호 라우트 테스트**야. 워크북도 Google 로그인 구현과 JWT 인증 흐름을 실습 목표로 잡고 있어. 

---

# 9주차 실습 진행 순서

## 0. 실습 목표

이번 실습에서 최종적으로 확인해야 하는 것은 아래 3가지야.

```text
1. /oauth2/login/google 접속 시 Google 로그인 화면으로 이동
2. Google 로그인 성공 후 accessToken, refreshToken 발급
3. 발급받은 accessToken을 Bearer Token으로 사용해 보호 라우트 접근
```

실습 결과물은 `misson_practice/chapter09` 또는 기존 레포 구조에 맞는 실습 폴더에 정리하면 돼.
너희 레포가 이전 주차에서 `misson_practice`를 쓰고 있었으면 그 흐름을 따르는 게 좋아.

---

# 1. 브랜치 생성

```bash
cd /c/Project/10th_Node.js_Practice_Mission
git status
git switch main
git pull origin main
git switch -c feature/chapter-09
```

실습 폴더 생성:

```bash
mkdir -p misson_practice/chapter09/images
touch misson_practice/chapter09/README.md
```

스크린샷은 여기부터 찍을 필요는 없고, 실제 Google 설정/실행 결과 위주로 찍으면 돼.

---

# 2. 패키지 설치

9주차 실습에서 필요한 인증 관련 패키지를 설치해.

```bash
npm install passport passport-google-oauth20 jsonwebtoken passport-jwt
npm install --save-dev @types/passport @types/passport-google-oauth20 @types/jsonwebtoken @types/passport-jwt
```

각 패키지 역할은 다음과 같아.

| 패키지                       | 역할                  |
| ------------------------- | ------------------- |
| `passport`                | 인증 처리 프레임워크         |
| `passport-google-oauth20` | Google OAuth 로그인 전략 |
| `jsonwebtoken`            | JWT 생성              |
| `passport-jwt`            | JWT 검증              |
| `@types/...`              | TypeScript 타입 지원    |

설치 후 확인:

```bash
cat package.json
```

---

# 3. Google Cloud OAuth Client 생성

이번 실습에서 가장 중요한 설정 단계야.

## 3-1. Google Cloud Console 접속

Google Cloud Console에서 프로젝트를 생성하거나 기존 프로젝트를 선택해.

이후 이동:

```text
APIs & Services → Credentials
```

그리고:

```text
Create Credentials → OAuth client ID
```

## 3-2. OAuth Client 설정

Application type은 보통 아래로 선택해.

```text
Web application
```

Authorized JavaScript origins:

```text
http://localhost:3000
```

Authorized redirect URIs:

```text
http://localhost:3000/oauth2/callback/google
```

중요한 건 이 주소가 코드의 `callbackURL`과 정확히 일치해야 한다는 점이야.

```ts
callbackURL: "/oauth2/callback/google"
```

서버가 `localhost:3000`에서 실행되므로 Google Cloud에는 전체 주소로 등록해야 해.

```text
http://localhost:3000/oauth2/callback/google
```

## 스크린샷 1
![OAuth Client 설정](./images/01-google-oauth-client-setting.png)

---

# 4. `.env` 설정

프로젝트 루트의 `.env`에 아래 값을 추가해.

```env
PORT=3000
DATABASE_URL="mysql://root:비밀번호@127.0.0.1:3306/umc_week9"

PASSPORT_GOOGLE_CLIENT_ID="발급받은 Client ID"
PASSPORT_GOOGLE_CLIENT_SECRET="발급받은 Client Secret"

JWT_SECRET="my-very-secret-jwt-key"
```

주의할 점:

```text
.env는 절대 GitHub에 올리면 안 됨
Client Secret은 스크린샷에서도 가려야 함
JWT_SECRET은 임의의 긴 문자열로 설정
```

## 스크린샷 2
![.env 설정 화면](images/02-env-setting.png)

---

# 5. `src/auth.config.ts` 생성

이제 인증 설정 파일을 만들자.

```bash
touch src/auth.config.ts
```

아래 코드를 넣어줘.

```ts
import dotenv from "dotenv";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import jwt from "jsonwebtoken";
import { prisma } from "./db.config.js";

dotenv.config();

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

export const googleStrategy = new GoogleStrategy(
  {
    clientID: process.env.PASSPORT_GOOGLE_CLIENT_ID!,
    clientSecret: process.env.PASSPORT_GOOGLE_CLIENT_SECRET!,
    callbackURL: "/oauth2/callback/google",
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

export const jwtStrategy = new JwtStrategy(
  {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET!,
  },
  async (payload, done) => {
    try {
      const user = await prisma.user.findFirst({
        where: { id: payload.id },
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
```

주의할 부분은 `prisma` import 경로야.

```ts
import { prisma } from "./db.config.js";
```

만약 네 프로젝트에서 `db.config.ts`의 export 이름이 다르면 여기를 맞춰야 해.

---

# 6. `src/index.ts`에 Passport 등록

`src/index.ts` 상단에 import 추가:

```ts
import passport from "passport";
import { googleStrategy, jwtStrategy } from "./auth.config.js";
```

`app` 생성 전후 흐름에 아래 코드 추가:

```ts
passport.use(googleStrategy);
passport.use(jwtStrategy);
```

미들웨어 부분에 추가:

```ts
app.use(passport.initialize());
```

전체 흐름은 대략 이렇게 돼.

```ts
passport.use(googleStrategy);
passport.use(jwtStrategy);

const app = express();

app.use(cors());
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(passport.initialize());
```

---

# 7. Google 로그인 라우트 추가

`src/index.ts`에 아래 라우트를 추가해.

```ts
app.get(
  "/oauth2/login/google",
  passport.authenticate("google", { session: false })
);

app.get(
  "/oauth2/callback/google",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login-failed",
  }),
  (req, res) => {
    res.status(200).json({
      success: true,
      tokens: req.user,
    });
  }
);

app.get("/login-failed", (req, res) => {
  res.status(401).json({
    success: false,
    message: "Google 로그인에 실패했습니다.",
  });
});
```

이제 브라우저에서 아래 주소로 접속하면 Google 로그인 화면으로 이동해야 해.

```text
http://localhost:3000/oauth2/login/google
```

---

# 8. 보호 라우트 만들기

JWT 인증이 되는지 확인하기 위해 `/mypage` 테스트 라우트를 추가해.

```ts
const isLogin = passport.authenticate("jwt", { session: false });

app.get("/mypage", isLogin, (req, res) => {
  res.status(200).json({
    success: true,
    message: "인증 성공! 마이페이지에 접근했습니다.",
    user: req.user,
  });
});
```

이 라우트는 Access Token이 있어야 접근할 수 있어.

---

# 9. 서버 실행

```bash
npm run dev
```

정상 실행 로그:

```text
[server]: Server is running at http://localhost:3000
```

## 스크린샷 3
![npm run dev 서버 정상 실행 화면](images/03-server-running.png)


---

# 10. Google 로그인 테스트

브라우저에서 접속:
```text
http://localhost:3000/oauth2/login/google
```

정상이라면 Google 로그인 화면으로 이동해.

## 스크린샷 4
![Google 로그인 화면](images/04-google-login-page.png)

로그인 후 권한 동의 화면이 나오면 확인해.

## 스크린샷 5
![Google 권한 동의 화면](images/05-google-consent-page.png)

로그인이 성공하면 callback으로 돌아오고, 브라우저에 JSON 형태로 토큰이 보여야 해.

예시:

```json
{
  "success": true,
  "tokens": {
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

## 스크린샷 6
![accessToken, refreshToken 응답 화면](images/06-google-login-token-response.png)

---

# 11. Postman에서 Bearer Token 테스트

발급받은 `accessToken`을 복사해.

Postman에서 새 요청 생성:

```text
GET http://localhost:3000/mypage
```

Headers에 추가:

```text
Authorization: Bearer <accessToken>
```

정상 응답:

```json
{
  "success": true,
  "message": "인증 성공! 마이페이지에 접근했습니다.",
  "user": {
    ...
  }
}
```

## 스크린샷 7

![Postman에서 Bearer Token을 넣고 /mypage 성공한 화면](images/07-mypage-with-bearer-token.png)


---

# 12. 토큰 없이 접근 테스트

이번에는 Authorization 헤더를 제거하고 다시 요청해.

```text
GET http://localhost:3000/mypage
```

정상이라면 인증 실패가 떠야 해.

```text
Unauthorized
```

또는 401 응답이 나와야 해.

## 스크린샷 8
![토큰 없이 /mypage 요청 시 실패 화면](images/08-mypage-without-token.png)

---

# 13. 실습 README에 넣을 내용

`misson_practice/chapter09/README.md`에는 다음 구조로 작성하면 돼.

````md
# 9주차 실습 README

## 1. 실습 목표

9주차 실습의 목표는 Google OAuth 로그인을 구현하고, 로그인 성공 후 JWT를 발급받아 Bearer Token 방식으로 보호된 API에 접근하는 것이다.

## 2. 설치한 패키지

```bash
npm install passport passport-google-oauth20 jsonwebtoken passport-jwt
npm install --save-dev @types/passport @types/passport-google-oauth20 @types/jsonwebtoken @types/passport-jwt
````

## 3. Google OAuth Client 설정

Google Cloud Console에서 OAuth Client ID를 발급받고, Redirect URI를 다음과 같이 설정하였다.

```text
http://localhost:3000/oauth2/callback/google
```

![Google OAuth 설정](./images/01-google-oauth-client-setting.png)

## 4. 환경변수 설정

`.env`에 Google Client ID, Client Secret, JWT Secret을 추가하였다.

![환경변수 설정](./images/02-env-setting.png)

## 5. Google 로그인 구현

`src/auth.config.ts`에서 Google Strategy와 JWT 생성 함수를 작성하였다.

## 6. 로그인 라우트 추가

```ts
app.get(
  "/oauth2/login/google",
  passport.authenticate("google", { session: false })
);
```

## 7. 로그인 성공 후 토큰 발급 확인

Google 로그인 성공 후 accessToken과 refreshToken이 응답되는 것을 확인하였다.

![토큰 응답](./images/06-google-login-token-response.png)

## 8. 보호 라우트 테스트

`/mypage` 라우트에 JWT 인증 미들웨어를 적용하였다.

```ts
const isLogin = passport.authenticate("jwt", { session: false });
```

Bearer Token을 넣고 요청했을 때는 성공하였다.

![Bearer Token 성공](./images/07-mypage-with-bearer-token.png)

토큰 없이 요청했을 때는 인증에 실패하였다.

![토큰 없이 실패](./images/08-mypage-without-token.png)

## 9. 느낀 점

이번 실습을 통해 Google OAuth 로그인은 외부 서비스에서 사용자를 인증받는 과정이고, 이후 우리 서버가 자체 JWT를 발급해야 우리 서비스의 API 인증에 사용할 수 있다는 점을 이해할 수 있었다.

또한 JWT를 발급받는 것만으로는 인증이 끝나는 것이 아니라, API 요청 시 Authorization 헤더에 Bearer Token 형식으로 토큰을 담아 보내야 보호된 API를 사용할 수 있다는 점을 확인하였다.

````

---

# 14. 실습 커밋

실습 완료 후 커밋:

```bash
git status
git add package.json package-lock.json
git add src/auth.config.ts src/index.ts
git add misson_practice/chapter09/README.md misson_practice/chapter09/images/
git commit -m "feat: 9주차 Google OAuth 로그인 실습"
git push -u origin feature/chapter-09
````

---

# 15. 시니어 미션 판단

이번 주 공통 미션만 해도 구현량이 많아.

공통 미션 핵심:

```text
1. 하드코딩된 사용자 정보 제거
2. 내 정보 수정 API 또는 기존 회원가입 API 수정
3. 기존 API에 JWT 인증 미들웨어 적용
```

시니어 미션 중 추가로 할 만한 것은 이론 정리 정도야.

추천:

```text
세션 기반 인증과 JWT 인증 비교 정리
```

비추천:

```text
다른 소셜 로그인 추가
이메일/비밀번호 로그인 추가
가입 방식 제한 로직 구현
```

이유는 DB 모델 변경과 인증 전략 추가가 필요해서 이번 주 공통 미션과 같이 하기에는 범위가 꽤 커.

---

## 다음 단계

이제 실제 실습을 시작할 때는 이 순서로 가면 돼.

```bash
cd /c/Project/10th_Node.js_Practice_Mission
git switch main
git pull origin main
git switch -c feature/chapter-09
```

그다음 패키지 설치부터 시작하면 돼.
