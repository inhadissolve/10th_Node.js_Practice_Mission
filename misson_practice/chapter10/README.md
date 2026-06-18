# 10주차 실습: GitHub Actions와 AWS EC2로 CI/CD 구축하기

## 1. 실습 목표

- `main` 브랜치 변경을 GitHub Actions가 감지하도록 한다.
- GitHub Actions에서 애플리케이션을 빌드하고 배포 아티팩트를 만든다.
- SSH와 `rsync`를 이용해 아티팩트를 EC2로 전송한다.
- systemd로 Node.js 서버를 실행하고 재시작한다.
- 배포 환경에서도 Google OAuth 로그인이 동작하도록 콜백 URL을 분리한다.
- 구축한 파이프라인의 각 단계를 설명할 수 있도록 기록한다.

## 2. 전체 배포 흐름

```text
main 브랜치 push
        ↓
GitHub Actions build job
  - npm ci
  - Prisma Client 및 TSOA 라우트 생성
  - TypeScript 컴파일
  - 운영 의존성만 남기기
  - artifact.tgz 생성
        ↓
GitHub Actions deploy job
  - SSH 설정
  - EC2로 아티팩트 전송
  - EC2에 .env 생성
  - current 디렉터리 교체
  - systemd 서비스 재시작
  - 서비스와 HTTP 응답 확인
```

## 3. 로컬 프로젝트를 배포 구조로 변경

### 3-1. 실행 스크립트 분리

개발 환경에서는 `tsx`로 TypeScript를 바로 실행하지만, 배포 환경에서는 먼저 JavaScript로 컴파일한 후 `node`로 실행한다.

```json
{
  "scripts": {
    "build": "prisma generate --schema=./prisma/schema.prisma && tsoa spec-and-routes && tsc",
    "start": "node dist/index.js",
    "dev": "prisma generate --schema=./prisma/schema.prisma && tsoa spec-and-routes && nodemon --exec tsx src/index.ts"
  }
}
```

모듈 형식은 TSOA가 생성하는 라우트와 맞도록 CommonJS로 통일했다.

### 3-2. 빌드 확인

```bash
npm ci
npm run build
```

`dist/index.js`가 생성되고 명령이 오류 없이 끝나는지 확인한다.

- [x] 의존성 잠금 파일 기준 설치
- [x] Prisma Client 생성
- [x] TSOA 라우트 생성
- [x] TypeScript 컴파일

## 4. Google OAuth 콜백 URL 환경변수화

로컬 주소를 코드에 고정하면 EC2 배포 후에도 Google이 `localhost`로 이동한다. 따라서 `src/auth.config.ts`에서 콜백 URL을 환경변수로 받도록 변경했다.

```ts
callbackURL:
  process.env.PASSPORT_GOOGLE_CALLBACK_URL ??
  "http://localhost:3000/oauth2/callback/google";
```

로컬 환경에서는 다음 값을 사용한다.

```dotenv
PASSPORT_GOOGLE_CALLBACK_URL=http://localhost:3000/oauth2/callback/google
```

배포 환경에서는 Google OAuth 정책에 맞춰 HTTPS 도메인을 사용한다.

```dotenv
PASSPORT_GOOGLE_CALLBACK_URL=https://<DOMAIN>/oauth2/callback/google
```

> 실제 서비스에서는 도메인과 HTTPS를 적용한 `https://api.example.com/oauth2/callback/google` 형태를 사용한다.

## 5. EC2 준비

### 5-1. 인스턴스와 네트워크

- [x] Ubuntu EC2 인스턴스 생성
- [x] 탄력적 IP 연결
- [x] 보안 그룹에서 SSH 22번 포트를 내 IP에만 허용
- [x] Nginx용 HTTP 80, HTTPS 443 포트 허용
- [x] 애플리케이션 3000번 외부 규칙 제거
- [x] SSH 접속 확인

운영 환경에서는 애플리케이션의 3000번 포트를 직접 공개하지 않고, Nginx가 80/443번 요청을 받아 내부 3000번 포트로 전달하도록 구성하는 것이 좋다.

### 5-2. Node.js 24 설치

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 24
nvm use 24
node -v
npm -v
```

### 5-3. MySQL 설치

워크북 실습에서는 비용과 구성을 단순화하기 위해 같은 EC2에 MySQL을 설치한다.

```bash
sudo apt update
sudo apt install -y mysql-server
sudo systemctl enable --now mysql
sudo mysql -u root
```

```sql
CREATE DATABASE umc_10th
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
CREATE USER 'umc_app'@'localhost' IDENTIFIED BY '<STRONG_PASSWORD>';
GRANT ALL PRIVILEGES ON umc_10th.* TO 'umc_app'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

- [x] MySQL 서비스가 `active`인지 확인
- [x] `umc_10th` 데이터베이스 생성
- [x] `umc_app` 전용 사용자 생성 및 접속 확인
- [x] 비밀번호를 공개 문서나 저장소에 기록하지 않기

메모리가 약 1GiB인 인스턴스에서 Prisma migration과 MySQL을 함께 실행할 수 있도록 1GiB swap을 추가했다.

```bash
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

## 6. GitHub Actions Secrets 설정

GitHub 저장소의 `Settings → Secrets and variables → Actions`에서 다음 Repository secrets를 등록한다.

| Secret | 값 |
| --- | --- |
| `EC2_HOST` | EC2 탄력적 IP |
| `EC2_PORT` | SSH 포트, 기본값 `22` |
| `EC2_USER` | Ubuntu AMI 기준 `ubuntu` |
| `EC2_SSH_KEY` | EC2 생성 시 받은 PEM 파일 전체 내용 |
| `EC2_DOT_ENV` | EC2에서 사용할 `.env` 전체 내용 |

`EC2_DOT_ENV` 예시:

```dotenv
PORT=3000
DATABASE_URL=mysql://umc_app:<PASSWORD>@localhost:3306/umc_10th
DB_HOST=localhost
DB_PORT=3306
DB_USER=umc_app
DB_PASSWORD=<PASSWORD>
DB_NAME=umc_10th
PASSPORT_GOOGLE_CLIENT_ID=<GOOGLE_CLIENT_ID>
PASSPORT_GOOGLE_CLIENT_SECRET=<GOOGLE_CLIENT_SECRET>
PASSPORT_GOOGLE_CALLBACK_URL=https://<DOMAIN>/oauth2/callback/google
JWT_SECRET=<LONG_RANDOM_SECRET>
```

주의 사항:

- 실제 Secret 값을 README, 커밋, Actions 로그에 붙이지 않는다.
- PEM 키는 시작 줄과 끝 줄을 포함한 전체 내용을 등록한다.
- DB 비밀번호에 URL 예약 문자가 있다면 `DATABASE_URL`에서 URL 인코딩한다.

## 7. GitHub Actions 워크플로

워크플로 파일은 `.github/workflows/deploy-main.yml`에 작성했다.

### build job

1. 저장소 checkout
2. Node.js 24 설정
3. `npm ci`로 잠금 파일과 같은 의존성 설치
4. 빌드용 `.env` 생성
5. `npm run build`
6. 개발 의존성 제거
7. `dist`, `node_modules`, 패키지 파일을 아티팩트로 압축

### deploy job

1. build job의 아티팩트 다운로드
2. SSH 개인 키와 known hosts 설정
3. `/opt/app/umc10th/incoming`으로 파일 전송
4. Secret을 이용해 런타임 `.env` 생성
5. Prisma migration 적용
6. 기존 `current`를 `previous`로 옮기고 새 릴리스를 `current`로 전환
7. `umc10th.service` 등록 및 재시작
8. systemd 상태와 `http://127.0.0.1:3000/` 응답 확인

## 8. 첫 배포

1. Chapter 10 변경사항을 원격 브랜치에 push한다.
2. Pull Request를 통해 `main`에 병합한다.
3. GitHub의 Actions 탭에서 `deploy-main`을 연다.
4. build와 deploy job이 모두 초록색인지 확인한다.
5. EC2에서 다음 명령으로 상태를 확인한다.

```bash
sudo systemctl status umc10th --no-pager
sudo journalctl -u umc10th -n 100 --no-pager
curl http://127.0.0.1:3000/
```

외부에서는 Nginx와 HTTPS 도메인을 통해 확인한다.

```text
https://<DOMAIN>/
```

- [x] Actions build 성공
- [x] Actions deploy 성공
- [x] EC2 systemd `active` 확인
- [x] 외부 HTTPS API 응답 확인

### Nginx와 HTTPS

DuckDNS 서브도메인을 탄력적 IP에 연결하고 Nginx가 80/443 요청을 내부 3000번 포트로 전달하도록 구성했다. Certbot으로 TLS 인증서를 발급했으며 `certbot renew --dry-run`도 성공했다.

```text
Client → HTTPS :443 → Nginx → HTTP 127.0.0.1:3000 → Node.js
```

## 9. 배포 환경에서 Google 로그인 수정

Google Cloud Console의 OAuth Client 설정에서 승인된 리디렉션 URI를 추가한다.

```text
https://<DOMAIN>/oauth2/callback/google
```

그다음 브라우저에서 아래 주소로 접속한다.

```text
https://<DOMAIN>/oauth2/login/google
```

- [x] Google 로그인 화면으로 이동
- [x] 로그인 후 HTTPS 콜백 주소로 복귀
- [x] Access Token과 Refresh Token 응답 확인
- [x] Access Token으로 `/mypage` 호출 성공

## 10. 실습 인증 이미지 계획

실제 진행 중 아래 이름으로 이미지를 추가한다.

```text
misson_practice/chapter10/images/
├── 01-ec2-instance.png
├── 02-elastic-ip.png
├── 03-node-mysql-install.png
├── 04-github-secrets.png
├── 05-actions-build-success.png
├── 06-actions-deploy-success.png
├── 07-systemd-active.png
├── 08-api-response.png
├── 09-google-callback-setting.png
└── 10-google-login-success.png
```

Secret 값, PEM 키, DB 비밀번호, 토큰은 반드시 가리고 캡처한다.

## 11. 트러블슈팅

### 이슈 1: 워크북 YAML의 `npm run build`가 실패함

**문제**

기존 프로젝트는 `tsx src/index.ts`로 바로 실행했으며 `build` 스크립트가 없었다. 워크북 예제는 `dist` 디렉터리가 이미 생성된다고 가정하고 있었다.

**해결**

`prisma generate → tsoa spec-and-routes → tsc` 순서의 build 스크립트를 만들고, start는 `node dist/index.js`를 실행하도록 분리했다.

### 이슈 2: TSOA 생성 라우트가 ESM 빌드에서 해석되지 않음

**문제**

TSOA가 생성한 import 경로에는 `.js` 확장자가 없어서 NodeNext 모듈 해석에서 컴파일 오류가 발생했다.

**해결**

현재 프로젝트의 TSOA 생성 방식에 맞춰 TypeScript 출력과 Node 런타임 모듈 형식을 CommonJS로 통일했다.

### 이슈 3: 배포 후 Google 로그인이 localhost로 이동함

**문제**

Google Strategy의 callback URL이 `http://localhost:3000`으로 하드코딩되어 있었다.

**해결**

`PASSPORT_GOOGLE_CALLBACK_URL` 환경변수를 추가하고 Google Cloud Console에도 HTTPS 도메인 콜백 URI를 등록했다.

### 이슈 4: Repository secrets가 없어 빌드 환경변수가 비어 있음

**문제**

GitHub Actions의 Prisma generate 단계에서 `DATABASE_URL`을 찾을 수 없었다. 확인 결과 Repository secrets가 등록되지 않은 상태였다.

**해결**

실습 저장소의 Repository secrets에 `EC2_HOST`, `EC2_PORT`, `EC2_USER`, `EC2_SSH_KEY`, `EC2_DOT_ENV`를 등록했다.

### 이슈 5: Prisma가 MySQL 인증 오류를 다른 plugin 오류로 표시함

**문제**

DB 비밀번호 불일치 상황에서 Prisma가 `Unknown authentication plugin sha256_password`를 출력해 원인 파악이 어려웠다.

**해결**

`umc_app` 비밀번호를 재설정하고 같은 값을 `DATABASE_URL`, `DB_PASSWORD`에 반영했다. MySQL 인증 방식은 `mysql_native_password`로 통일했다.

### 이슈 6: 작은 EC2에서 migration 중 DB 연결 실패

**문제**

MySQL과 Node.js가 실행 중인 약 1GiB 인스턴스의 가용 메모리가 100MiB 미만이었고 swap도 없었다. Prisma migration 중 일시적으로 `P1001` 연결 실패가 발생했다.

**해결**

기존 EBS 볼륨에 1GiB swap을 만들고 migration을 다시 실행했다. 이후 migration, systemd 재시작, HTTP 검증이 모두 통과했다.

### 이슈 7: Google OAuth는 공인 IP 기반 HTTP callback을 허용하지 않음

**문제**

Google OAuth는 localhost를 제외한 HTTP callback과 원시 IP host를 허용하지 않는다.

**해결**

DuckDNS 도메인, Nginx, Certbot을 적용하고 Google Cloud Console에 HTTPS callback URI를 등록했다.

## 12. 시니어 미션: 무중단 배포

현재 systemd의 `restart` 방식은 짧은 다운타임이 생긴다. 기본 미션을 완료한 후 PM2 cluster mode와 `pm2 reload`를 적용하면 기존 프로세스가 요청을 처리하는 동안 새 프로세스를 띄워 다운타임을 줄일 수 있다.

추가로 확인할 항목:

- `ecosystem.config.cjs` 작성
- PM2 cluster mode 적용
- `pm2 startup`과 `pm2 save` 설정
- Actions 배포 단계에서 `pm2 reload` 실행
- 연속 요청 중 실패가 없는지 검증

## 13. 회고

이번 실습에서 CI와 CD를 하나의 막연한 자동화가 아니라 build와 deploy라는 서로 다른 책임으로 나누어 이해할 수 있었다. 특히 GitHub Actions에서 한 번 만든 아티팩트를 EC2로 전달하므로, 작은 EC2 인스턴스가 직접 의존성을 설치하고 TypeScript를 컴파일하는 부담을 줄일 수 있었다.

또한 로컬에서 정상 동작하던 OAuth도 배포 주소와 Google Console 설정이 함께 바뀌어야 한다는 점을 확인했다. 코드, 인프라, 외부 서비스 설정이 모두 일치해야 실제 배포가 완성된다.
