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
  accessTokenValidity: process.env.ACCESS_TOKEN_VALIDITY || '1d',
  refreshTokenValidity: process.env.REFRESH_TOKEN_VALIDITY_SEC || '1d',
}));