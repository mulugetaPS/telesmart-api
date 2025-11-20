import { registerAs } from '@nestjs/config';

export default registerAs('imou', () => ({
  appId: process.env.IMOU_APP_ID,
  appSecret: process.env.IMOU_APP_SECRET,
  dataCenter: process.env.IMOU_DATA_CENTER || 'fk',
}));
