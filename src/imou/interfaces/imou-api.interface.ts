/**
 * IMOU API Response Interfaces
 */

// Base API response structure (matches IMOU official format)
export interface ImouApiResponse<T = any> {
  id: string;
  result: {
    code: string;
    msg: string;
    data: T;
  };
}

// Access Token Response
export interface AccessTokenResult {
  accessToken: string;
  expireTime: number; // Unix timestamp in milliseconds
}

// Create Sub-Account Response
export interface CreateSubAccountResult {
  openid: string;
}

// Sub-Account Token Response
export interface SubAccountTokenResult {
  accessToken: string;
  expireTime: number; // Seconds until token expires
}

// Device Information
export interface DeviceInfo {
  deviceId: string;
  name: string;
  deviceModel: string;
  status: 'online' | 'offline';
  channels: number;
  capability?: string;
  sleepable?: boolean;
}

// Channel Permission
export interface ChannelPermission {
  channelId: string;
  permission: string; // e.g., "UPDATE", "REAL", "GET"
}

// Device Policy (Permission)
export interface DevicePolicy {
  deviceId: string;
  permission: string; // e.g., "GET", "UPDATE", "REAL" or comma-separated
  channelIds: ChannelPermission[];
}

// Sub-Account Device List Response
export interface SubAccountDeviceListResult {
  policy: DevicePolicy[];
  pageNo: number;
  pageSize: number;
  total: number;
}

// Live Stream URL Response
export interface LiveStreamResult {
  hls: string;
  rtmp?: string;
  rtsp?: string;
  flv?: string;
}

// Channel Online Status
export interface ChannelOnlineStatus {
  channelId: string;
  onLine: string; // "0" = offline, "1" = online, "3" = upgrading, "4" = sleeping
}

// Device Online Status Response
export interface DeviceOnlineResult {
  deviceId: string;
  onLine: string; // "0" = offline, "1" = online, "3" = upgrading, "4" = sleeping
  channels: ChannelOnlineStatus[];
}

// Device Binding Status Response
export interface DeviceBindingStatusResult {
  isBind: boolean; // true if device is bound to some account
  isMine: boolean; // true if device is bound to current account
}

// PTZ Control Result
export interface PtzControlResult {
  success: boolean;
}

// Sub-Account Information
export interface SubAccountInfo {
  account: string;
  openid: string;
  create_time: string; // Format: "YYYY-MM-DD HH:MM:SS"
}

// Sub-Account List Response
export interface SubAccountListResult {
  accounts: SubAccountInfo[];
  pageNo: number;
  pageSize: number;
  total: number;
}

// Unbind Device Result
export interface UnbindDeviceResult {
  msg: string;
  code: string;
}

// Bind Device Result
export interface BindDeviceResult {
  msg: string;
  code: string;
}

/**
 * Internal Token Cache Interface
 */
export interface TokenCache {
  token: string;
  expireTime: number;
}
