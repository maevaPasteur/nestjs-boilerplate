import { registerAs } from '@nestjs/config';

export const AuthConfigName = 'auth';

export interface AuthConfigConfig {
  jwtSecret: string;
  jwtRefresh: string;
  accessTokenValidity: number;
  refreshTokenValidity: number;
}

export default registerAs(AuthConfigName, () => ({
  jwtSecret: process.env.JWT_SECRET,
  jwtRefresh: process.env.JWT_REFRESH,
  accessTokenValidity: parseInt(process.env.ACCESS_TOKEN_VALIDITY_SEC || '0'),
  refreshTokenValidity: parseInt(process.env.REFRESH_TOKEN_VALIDITY_SEC || '0'),
}));