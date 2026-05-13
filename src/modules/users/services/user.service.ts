import { UserSignUpRequest, UserSignUpResponse } from "../dtos/user.dto.js";
import {
  addUser,
  getUser,
  getUserPreferencesByUserId,
  setPreference,
} from "../repositories/user.repository.js";
import { DuplicateUserEmailError } from "../../../common/errors/user.error.js";

export const userSignUp = async (
  data: UserSignUpRequest
): Promise<UserSignUpResponse> => {
  const joinUserId = await addUser({
    email: data.email,
    password: data.password,
    name: data.name,
    gender: data.gender,

    // 요청 body에서는 birth가 문자열로 들어오기 때문에 Date 객체로 변환합니다.
    birth: new Date(data.birth),

    // 선택값은 undefined로 들어올 수 있으므로 기본값을 넣어줍니다.
    address: data.address ?? "",
    detailAddress: data.detailAddress ?? "",
    phoneNumber: data.phoneNumber,
  });

  // addUser에서 이메일 중복이면 null을 반환하도록 되어 있으므로,
  // 이 경우 커스텀 에러를 던집니다.
  if (joinUserId === null) {
    throw new DuplicateUserEmailError(data);
  }

  // 사용자가 선택한 음식 선호 카테고리를 저장합니다.
  for (const preference of data.preferences) {
    await setPreference(joinUserId, preference);
  }

  // 생성된 사용자 정보를 다시 조회합니다.
  const user = await getUser(joinUserId);

  // 사용자의 선호 카테고리 이름 목록을 조회합니다.
  const preferences = (await getUserPreferencesByUserId(joinUserId)).map(
    (obj) => obj.foodCategory.name
  );

  return {
    userId: user.id,
    preferences,
  };
};