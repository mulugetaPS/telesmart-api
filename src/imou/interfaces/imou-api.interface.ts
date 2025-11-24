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

// Job Schedule for Live Stream
export interface JobSchedule {
  period: string; // e.g., "always"
  status: boolean; // true = active, false = inactive
}

// Stream Information
export interface StreamInfo {
  hls: string; // HLS URL (HTTP) for the stream
  streamId: number; // Stream type (0 = HD, 1 = SD)
  coverUrl: string; // URL of the thumbnail/cover image
}

// Bind Device Live Result
export interface BindDeviceLiveResult {
  liveToken: string; // Authorization token for this live stream
  liveStatus: number; // 1 = open, 2 = paused, 3 = insufficient traffic
  liveType: number; // 1 = device
  deviceId: string; // Device serial number
  channelId: string; // Channel number
  coverUpdate: number; // Frequency (in seconds) of video cover updates
  streams: StreamInfo[]; // Array of stream objects
  job: JobSchedule[]; // Array of scheduling items for the live plan
}

// Policy Statement for Sub-Account Permissions
export interface PolicyStatement {
  permission: string; // Comma-separated: e.g., "Ptz,Talk,Config" or "Real"
  resource: string[]; // Array of resources: "dev:<deviceId>" or "cam:<deviceId>:<channelId>"
}

// Policy Object for Add Policy Request
export interface PolicyObject {
  statement: PolicyStatement[];
}

// Add Policy Parameters
export interface AddPolicyParams {
  openid: string; // Sub-account's unique ID
  policy: PolicyObject; // Policy object with statements
}

/**
 * Internal Token Cache Interface
 */
export interface TokenCache {
  token: string;
  expireTime: number;
}
