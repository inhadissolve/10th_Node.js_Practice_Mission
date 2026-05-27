export interface UserSignUpRequest {
  email: string;
  password?: string;
  name: string;
  gender: string;

  // JSON 요청에서는 날짜가 문자열로 들어오므로 string으로 받는 것이 안전합니다.
  // Service에서 new Date(data.birth)로 Date 객체로 변환합니다.
  birth: string;

  address?: string;
  detailAddress?: string;
  phoneNumber: string;
  preferences: number[];
}

export interface UserSignUpResponse {
  userId: number;
  preferences: string[];
}