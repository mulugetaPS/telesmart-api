import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface SendOtpResponse {
    success: boolean;
    sessionId?: string;
    message?: string;
}

interface VerifyOtpResponse {
    success: boolean;
    message?: string;
}

@Injectable()
export class ExternalOtpService {
    private readonly logger = new Logger(ExternalOtpService.name);
    private readonly otpApiBaseUrl: string;
    private readonly otpApiKey: string;

    constructor(
        private httpService: HttpService,
        private configService: ConfigService,
    ) {
        this.otpApiBaseUrl = this.configService.get<string>('auth.otp.otpBaseUrl') || "";
        this.otpApiKey = this.configService.get<string>('auth.otp.otpApiKey') || "";
    }

    /**
     * Send OTP via external API
     */
    async sendOtp(phone: string): Promise<SendOtpResponse> {
        try {
            this.logger.log(`Sending OTP to ${phone}`);

            const response = await firstValueFrom(
                this.httpService.post<SendOtpResponse>(
                    `${this.otpApiBaseUrl}/send`,
                    {
                        phone,
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${this.otpApiKey}`,
                            // Add any other required headers
                        },
                    },
                ),
            );

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to send OTP');
            }

            this.logger.log(`OTP sent successfully to ${phone}`);
            return response.data;
        } catch (error) {
            this.logger.error(`Failed to send OTP to ${phone}:`, error.message);
            throw new Error(
                error.response?.data?.message || 'Failed to send OTP',
            );
        }
    }

    /**
     * Verify OTP via external API
     */
    async verifyOtp(
        phone: string,
        code: string,
        sessionId?: string,
    ): Promise<boolean> {
        try {
            this.logger.log(`Verifying OTP for ${phone}`);

            const response = await firstValueFrom(
                this.httpService.post<VerifyOtpResponse>(
                    `${this.otpApiBaseUrl}/verify`,
                    {
                        phone,
                        code,
                        sessionId, // Include if your API uses session-based verification
                        // Add any additional parameters your API requires
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${this.otpApiKey}`,
                            // Add any other required headers
                        },
                    },
                ),
            );

            if (!response.data.success) {
                this.logger.warn(`OTP verification failed for ${phone}`);
                return false;
            }

            this.logger.log(`OTP verified successfully for ${phone}`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to verify OTP for ${phone}:`, error.message);

            // Handle specific error cases
            if (error.response?.status === 401 || error.response?.status === 400) {
                return false; // Invalid OTP
            }

            throw new Error(
                error.response?.data?.message || 'Failed to verify OTP',
            );
        }
    }

    /**
     * Optional: Resend OTP via external API
     */
    async resendOtp(phone: string, sessionId?: string): Promise<SendOtpResponse> {
        try {
            this.logger.log(`Resending OTP to ${phone}`);

            const response = await firstValueFrom(
                this.httpService.post<SendOtpResponse>(
                    `${this.otpApiBaseUrl}/resend`,
                    {
                        phone,
                        sessionId,
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${this.otpApiKey}`,
                        },
                    },
                ),
            );

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to resend OTP');
            }

            return response.data;
        } catch (error) {
            this.logger.error(`Failed to resend OTP to ${phone}:`, error.message);
            throw new Error(
                error.response?.data?.message || 'Failed to resend OTP',
            );
        }
    }
}