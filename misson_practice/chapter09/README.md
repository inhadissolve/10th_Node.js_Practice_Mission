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