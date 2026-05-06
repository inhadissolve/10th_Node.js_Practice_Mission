# 6주차 실습 README

이번 6주차 실습에서는 기존에 `mysql2`와 직접 SQL을 사용하던 Repository 코드를 Prisma ORM 기반으로 변경했다.  
Prisma 설정, Migration, Prisma Client 생성, Repository 리팩토링, 목록 API 구현까지 진행했다.

---

## 1. 실습 목표

- Prisma ORM 설치 및 초기 설정
- `schema.prisma`를 이용한 테이블 모델 정의
- Prisma Migration으로 DB 테이블 생성
- 기존 `mysql2` 기반 Repository를 Prisma 기반으로 변경
- Cursor 기반 목록 API 구현
- Postman으로 API 요청 및 응답 확인

---

## 2. Prisma 설치

### 설치 명령어

```bash
npm install @prisma/client @prisma/adapter-mariadb dotenv
npm install -D prisma
```

### 초기 설정

```bash
npm exec prisma init
```

Prisma 초기 설정 후 `prisma/schema.prisma` 파일이 생성되었다.

### 사진 첨부

<img src="images/1.png">

---

## 3. Prisma 설정 파일 작성

Prisma 7에서는 DB 연결 URL을 `schema.prisma`에 직접 작성하지 않고 `prisma.config.ts`에서 관리한다.

```ts
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
```

`.env`에는 DB 연결 정보를 작성했다.

```env
PORT=3000

DATABASE_URL="mysql://root:root1234!@localhost:3306/umc_week6"

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root1234!
DB_NAME=umc_week6
```

> 실제 `.env` 파일은 GitHub에 올리지 않도록 `.gitignore`에 포함했다.

---

## 4. Prisma Schema 작성

`prisma/schema.prisma`에 실습에 필요한 모델을 정의했다.

사용한 주요 모델은 다음과 같다.

```text
User
FoodCategory
UserFavorCategory
Region
Store
Review
Mission
UserMission
```

| 모델 | 역할 |
| --- | --- |
| `User` | 사용자 정보 |
| `Store` | 가게 정보 |
| `Review` | 사용자가 작성한 리뷰 |
| `Mission` | 가게에 등록된 미션 |
| `UserMission` | 사용자가 도전 중이거나 완료한 미션 |

### UserMission 예시

```prisma
model UserMission {
  id          Int       @id @default(autoincrement())
  userId      Int       @map("user_id")
  missionId   Int       @map("mission_id")
  status      String    @default("IN_PROGRESS") @db.VarChar(20)
  startedAt   DateTime  @default(now()) @map("started_at")
  completedAt DateTime? @map("completed_at")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @default(now()) @map("updated_at")

  user    User    @relation(fields: [userId], references: [id])
  mission Mission @relation(fields: [missionId], references: [id])

  @@index([userId], map: "user_id")
  @@index([missionId], map: "mission_id")
  @@map("user_missions")
}
```

### 정리

- `@map`은 DB 컬럼명과 Prisma 필드명을 연결한다.
- `@@map`은 DB 테이블명과 Prisma 모델명을 연결한다.
- `@relation`은 테이블 간 관계를 정의한다.

---

## 5. Migration 실행

Prisma Schema 작성 후 Migration을 실행해 DB 테이블을 생성했다.

```bash
npx prisma migrate dev --name init_chapter06
```

Prisma Client도 생성했다.

```bash
npx prisma generate
```

DataGrip에서 테이블이 정상 생성된 것을 확인했다.

생성된 테이블은 다음과 같다.

```text
_prisma_migrations
food_category
missions
regions
reviews
stores
user
user_favor_category
user_missions
```

### 사진 첨부

<img src="images/2.png">
<img src="images/3.png">

---

## 6. Prisma Client 설정

기존 `mysql2` 기반 DB 연결 대신 Prisma Client를 사용하도록 `src/db.config.ts`를 수정했다.

```ts
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const adapter = new PrismaMariaDb({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
  connectionLimit: 10,
});

export const prisma = new PrismaClient({
  adapter,
  log: ["query", "info", "error", "warn"],
});
```

### 변경한 점

기존에는 `pool`을 사용했다.

```ts
import { pool } from "../../../db.config.js";
```

6주차에서는 Prisma Client를 사용하도록 변경했다.

```ts
import { prisma } from "../../../db.config.js";
```

---

## 7. Repository 리팩토링

기존 Repository에서 직접 SQL을 작성하던 방식을 Prisma ORM 방식으로 변경했다.

### 기존 방식

```ts
const [rows] = await conn.query(
  "SELECT * FROM stores WHERE id = ?",
  [storeId]
);
```

### Prisma 방식

```ts
export const findStoreById = async (storeId: number) => {
  return await prisma.store.findFirst({
    where: {
      id: storeId,
    },
  });
};
```

### 정리

Prisma를 사용하니 SQL 문자열을 직접 작성하지 않고도 DB 조회가 가능했다.  
또 모델명과 필드명을 기준으로 자동완성을 받을 수 있어 코드 작성이 더 편해졌다.

---

## 8. 실행 중 발생한 오류와 해결

### 문제

`db.config.ts`에서 `pool`을 제거했는데, 일부 Repository에서 아직 `pool`을 import하고 있어 서버가 실행되지 않았다.

```text
SyntaxError: The requested module '../../../db.config.js' does not provide an export named 'pool'
```

### 원인

`user.repository.ts`, `store.repository.ts`, `review.repository.ts`, `mission.repository.ts` 일부가 아직 `mysql2` 기반 코드였다.

### 해결

아래 명령어로 남아 있는 `pool` 사용 위치를 찾았다.

```powershell
Get-ChildItem -Path .\src -Recurse -Filter *.ts | Select-String -Pattern "pool"
```

이후 모든 Repository에서 `pool` 대신 `prisma`를 사용하도록 수정했다.

```ts
import { prisma } from "../../../db.config.js";
```

### 사진 첨부

<img src="images/4.png">

---

## 9. 서버 실행 확인

`package.json`의 `dev` 스크립트는 Prisma Client를 생성한 뒤 서버를 실행하도록 구성했다.

```json
{
  "scripts": {
    "dev": "nodemon --ext ts,prisma --ignore src/generated/prisma --exec \"npx prisma generate && tsx src/index.ts\""
  }
}
```

실행 명령어는 다음과 같다.

```bash
npm run dev
```

정상 실행 로그를 확인했다.

```text
Generated Prisma Client
[server]: Server is running at http://localhost:3000
```

### 사진 첨부

<img src="images/5.png">

---

## 10. 테스트 데이터 삽입

API 테스트를 위해 기본 데이터를 삽입했다.

```sql
INSERT INTO user
(email, password, name, gender, birth, address, detail_address, phone_number)
VALUES
('test@example.com', '$2b$10$dummyhashedpassword', '테스트유저', '남성', '2000-01-01', '인천광역시', '상세주소', '010-1234-5678');

INSERT INTO regions (name)
VALUES ('인하대 후문');

INSERT INTO stores (region_id, name, address)
VALUES (1, '인하 맛집', '인천 미추홀구 인하로 100');

INSERT INTO reviews (user_id, store_id, rating, content)
VALUES
(1, 1, 5, '가게 분위기가 좋았습니다.'),
(1, 1, 4, '음식이 맛있었습니다.'),
(1, 1, 3, '무난했습니다.');

INSERT INTO missions (store_id, title, description, reward_point)
VALUES
(1, '가게 방문하기', '가게에 방문한 뒤 인증하기', 500),
(1, '리뷰 작성하기', '방문 후 리뷰 작성하기', 300);

INSERT INTO user_missions (user_id, mission_id, status)
VALUES
(1, 1, 'IN_PROGRESS'),
(1, 2, 'IN_PROGRESS');
```

### 사진 첨부

<img src="images/6.png">

---

## 11. 구현한 API 테스트

### 11-1. 내가 작성한 리뷰 목록

```text
GET /api/v1/users/1/reviews
```

응답에서 리뷰 목록과 가게 정보, cursor가 정상 반환되는 것을 확인했다.

<img src="images/7.png">

---

### 11-2. 특정 가게의 미션 목록

```text
GET /api/v1/stores/1/missions
```

응답에서 해당 가게의 미션 목록과 cursor가 정상 반환되는 것을 확인했다.

<img src="images/8.png">

---

### 11-3. 내가 진행 중인 미션 목록

```text
GET /api/v1/users/1/missions/in-progress
```

응답에서 `IN_PROGRESS` 상태의 미션 목록이 정상 반환되는 것을 확인했다.

<img src="images/9.png">

---

### 11-4. 진행 중인 미션 완료 처리

```text
PATCH /api/v1/users/1/missions/1/complete
```

응답에서 `status`가 `COMPLETED`로 변경되고, `completedAt` 값이 저장되는 것을 확인했다.

<img src="images/10.png">

---

## 12. mysql2 제거

모든 Repository를 Prisma 기반으로 변경한 뒤 사용하지 않는 `mysql2`를 제거했다.

```bash
npm uninstall mysql2
```

확인 명령어도 실행했다.

```bash
npm list mysql2
```

`mysql2`가 직접 의존성에서는 제거되었지만, Prisma 내부 의존성으로는 표시될 수 있음을 확인했다.

```text
prisma
└── mysql2
```

이는 프로젝트에서 직접 사용하는 `mysql2`가 아니라 Prisma가 내부적으로 사용하는 의존성이므로 문제없다고 판단했다.

---

## 13. 느낀 점

이번 실습을 통해 SQL을 직접 작성하는 방식과 ORM을 사용하는 방식의 차이를 체감할 수 있었다.

5주차에는 `mysql2`와 SQL문을 직접 사용했기 때문에 쿼리가 길어지면 읽기 어렵고, 오타가 발생하면 원인을 찾기 어려웠다.  
반면 Prisma를 사용하니 `prisma.review.findMany()`처럼 객체 기반으로 DB에 접근할 수 있어 코드가 더 읽기 쉬웠다.

또한 Migration을 통해 테이블 생성 과정을 코드로 관리할 수 있다는 점이 인상적이었다.  
다만 ORM을 사용하더라도 실제로 어떤 SQL이 실행되는지 이해해야 하고, 관계 설정이나 Migration 관리도 신중하게 해야 한다는 점을 배웠다.
