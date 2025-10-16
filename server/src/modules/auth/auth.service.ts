import { RegisterData } from "../../common/interface/auth.interface";

export class AuthService {
  public async register(registerData: RegisterData) {
    const { name, email, password, userAgent } = registerData;
  }
}
