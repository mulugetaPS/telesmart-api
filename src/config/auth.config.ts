import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  otp: {
    otpBaseUrl: process.env.OTP_API_BASE_URL,
    otpApiKey: process.env.OTP_API_KEY
  }
}));
