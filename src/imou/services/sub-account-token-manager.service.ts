import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ImouSubAccountService } from './imou-sub-account.service';

/**
 * Sub Account Token Manager Service
 * Handles retrieval and caching of sub-account tokens
 */
@Injectable()
export class SubAccountTokenManagerService {
    private readonly logger = new Logger(SubAccountTokenManagerService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly subAccountService: ImouSubAccountService,
    ) { }

    /**
     * Get valid token for a user by openid
     * Retrieves from cache or fetches new token if expired
     * @param openid User's IMOU openid
     * @returns Valid access token
     */
    async getTokenByOpenId(openid: string): Promise<string> {
        // Find user by openid
        const user = await this.prisma.user.findUnique({
            where: { openid },
            select: {
                id: true,
                openid: true,
                accessToken: true,
                tokenExpireTime: true,
            },
        });

        if (!user) {
            throw new Error(`User not found with openid: ${openid}`);
        }

        if (!user.openid) {
            throw new Error('User does not have an IMOU sub-account');
        }

        // Check if cached token is valid
        if (this.isTokenValid(user.accessToken, user.tokenExpireTime)) {
            this.logger.log(`Using cached token for openid: ${openid}`);
            return user.accessToken!;
        }

        // Fetch new token from IMOU
        this.logger.log(`Fetching new token for openid: ${openid}`);
        const tokenResult = await this.subAccountService.getSubAccountToken(
            user.openid,
        );

        // Calculate expiration time (current time + expireTime in seconds)
        const expireTime = BigInt(Date.now()) + BigInt(tokenResult.data.expireTime * 1000);

        // Update cache in database
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                accessToken: tokenResult.data.accessToken,
                tokenExpireTime: expireTime,
            },
        });
        this.logger.log(`Token refreshed and cached for openid: ${openid}`);
        return tokenResult.data.accessToken;
    }

    /**
     * Check if cached token is still valid
     * @param token Cached access token
     * @param expireTime Token expiration timestamp
     * @returns true if token exists and is not expired
     */
    private isTokenValid(
        token: string | null,
        expireTime: bigint | null,
    ): boolean {
        if (!token || !expireTime) {
            return false;
        }

        // Add 5-minute buffer before expiration
        const bufferMs = 5 * 60 * 1000;
        const now = BigInt(Date.now()) + BigInt(bufferMs);

        return now < expireTime;
    }
}
