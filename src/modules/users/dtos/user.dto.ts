export interface UserSignUpRequest {
  email: string;
  name: string;
  gender: string;
  birth: string;
  address?: string;
  detailAddress?: string;
  phoneNumber: string;
  preferences: number[];
}

export const bodyToUser = (body: UserSignUpRequest) => {
  return {
    email: body.email,
    password: body.password,
    name: body.name,
    gender: body.gender,
    birth: new Date(body.birth),
    address: body.address || "",
    detailAddress: body.detailAddress || "",
    phoneNumber: body.phoneNumber,
    preferences: body.preferences,
  };
};

export const responseFromUser = ({
  user,
  preferences,
}: {
  user: any;
  preferences: any[];
}) => {
  return {
    email: user.email,
    name: user.name,
    preferCategory: preferences.map((preference) => preference.name),
  };
};

export interface UserSignUpRequest {
  email: string;
  password: string;
  name: string;
  gender: string;
  birth: string;
  address?: string;
  detailAddress?: string;
  phoneNumber: string;
  preferences: number[];
}

