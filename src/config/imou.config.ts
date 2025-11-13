import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  appId: process.env.IMOU_APP_ID,
  appSecret: process.env.IMOU_APP_SECRET,
}));
