export interface StoragePlan {
  name: string;
  quotaSize: bigint; // in bytes
  uploadBandwidth: number; // KB/s, 0 = unlimited
  downloadBandwidth: number; // KB/s, 0 = unlimited
  maxDevices: number;
  price: number; // monthly price
}

export const STORAGE_PLANS: Record<string, StoragePlan> = {
  free: {
    name: 'Free Plan',
    quotaSize: BigInt(10 * 1024 * 1024 * 1024), // 10GB
    uploadBandwidth: 512, // 512 KB/s
    downloadBandwidth: 1024, // 1 MB/s
    maxDevices: 2,
    price: 0,
  },
  basic: {
    name: 'Basic Plan',
    quotaSize: BigInt(50 * 1024 * 1024 * 1024), // 50GB
    uploadBandwidth: 2048, // 2 MB/s
    downloadBandwidth: 4096, // 4 MB/s
    maxDevices: 5,
    price: 9.99,
  },
  premium: {
    name: 'Premium Plan',
    quotaSize: BigInt(200 * 1024 * 1024 * 1024), // 200GB
    uploadBandwidth: 0, // unlimited
    downloadBandwidth: 0, // unlimited
    maxDevices: 15,
    price: 29.99,
  },
  enterprise: {
    name: 'Enterprise Plan',
    quotaSize: BigInt(1024 * 1024 * 1024 * 1024), // 1TB
    uploadBandwidth: 0, // unlimited
    downloadBandwidth: 0, // unlimited
    maxDevices: 100,
    price: 99.99,
  },
};

export function getStoragePlan(planName: string): StoragePlan {
  return STORAGE_PLANS[planName] || STORAGE_PLANS.free;
}
