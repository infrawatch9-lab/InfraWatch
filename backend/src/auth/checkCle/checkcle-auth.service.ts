import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { firstValueFrom } from 'rxjs';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class CheckcleAuthService {
  private readonly logger = new Logger(CheckcleAuthService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
  ) {}

  async login(): Promise<void> {
    try {
      const checkcleUrl = this.configService.get<string>('CHECKCLE_URL');
      const checkcleUser = this.configService.get<string>('CHECKCLE_USER');
      const checkclePass = this.configService.get<string>('CHECKCLE_PASS');

      if (!checkcleUrl || !checkcleUser || !checkclePass) {
        throw new Error('Missing Checkcle configuration environment variables');
      }

      const loginPayload = {
        identity: checkcleUser,
        password: checkclePass,
      };

      const response = await firstValueFrom(
        this.httpService.post(
          `${checkcleUrl}/collections/_superusers/auth-with-password`,
          loginPayload,
        ),
      );

      const token = response.data.token;
      if (!token) {
        throw new Error('No token received from Checkcle API');
      }

      // Decode the JWT to get the expiration claim
      const decodedToken = jwt.decode(token) as any;
      if (!decodedToken || !decodedToken.exp) {
        throw new Error('Invalid token format or missing expiration claim');
      }

      // Convert Unix timestamp to Date
      const expiryDate = new Date(decodedToken.exp * 1000);

      // // Save token to database
      await this.prismaService.checkcleToken.create({
        data: {
          token,
          expiry: expiryDate,
        },
      });

      console.log('Token stored successfully');

      this.logger.log(
        `New Checkcle token stored. Expires at: ${expiryDate.toUTCString()}`,
      );
    } catch (error) {
      this.logger.error('Failed to login to Checkcle API', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  async getValidToken(): Promise<string> {
    try {
      // Get the latest token from the database
      const latestToken = await this.prismaService.checkcleToken.findFirst({
        orderBy: { createdAt: 'desc' },
      });

      const currentTimeUnix = Math.floor(Date.now() / 1000);

      // Check if we have a valid token
      if (latestToken && latestToken.expiry) {
        const expiryTimeUnix = Math.floor(latestToken.expiry.getTime() / 1000);
        
        if (expiryTimeUnix > currentTimeUnix) {
          // Token is still valid
          this.logger.log(
            `Using cached Checkcle token (expires at ${latestToken.expiry.toUTCString()})`
          );
          return latestToken.token;
        } else {
          // Token has expired
          this.logger.log('Checkcle token expired. Logging in again...');
        }
      } else {
        // No token found
        this.logger.log('No Checkcle token found. Logging in...');
      }

      // Login to get a new token
      await this.login();

      // Fetch the newly created token
      const newToken = await this.prismaService.checkcleToken.findFirst({
        orderBy: { createdAt: 'desc' },
      });

      if (!newToken) {
        throw new Error('Failed to retrieve token after login');
      }

      return newToken.token;
    } catch (error) {
      this.logger.error('Failed to get valid Checkcle token', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  async getTokenWithExpiry(): Promise<{ token: string; expiry: Date }> {
    try {
      const token = await this.getValidToken();
      
      // Get the token with expiry from database
      const tokenRecord = await this.prismaService.checkcleToken.findFirst({
        where: { token },
        orderBy: { createdAt: 'desc' },
      });

      if (!tokenRecord) {
        throw new Error('Token record not found');
      }

      return {
        token: tokenRecord.token,
        expiry: tokenRecord.expiry,
      };
    } catch (error) {
      this.logger.error('Failed to get token with expiry', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  async callCheckCle(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET', body: any = null): Promise<any> {
    try {
      const checkcleUrl = this.configService.get<string>('CHECKCLE_URL');
      if (!checkcleUrl) {
        throw new Error('CHECKCLE_URL not configured');
      }

      if (!endpoint) {
        throw new Error('Invalid endpoint format. Must start with "/"');
      }
      console.log(endpoint);

      let token = await this.getValidToken();
      const url = `${checkcleUrl}${endpoint}`;

      const makeRequest = async (authToken: string) => {
        const config: any = {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        };

        if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
          config.data = body;
        }

        console.log('Making request to CheckCle:', { method, url, body: body ? JSON.stringify(body) : null });

        return await firstValueFrom(
          this.httpService.request({
            method,
            url,
            ...config,
          })
        );
      };

      try {
        // First attempt with current token
        const response = await makeRequest(token);
        this.logger.log(`CheckCle API call successful: ${method} ${endpoint}`);
        return response.data;
      } catch (error: any) {
        // Check if it's a 401 Unauthorized error
        if (error.response && error.response.status === 401) {
          this.logger.log('CheckCle API returned 401. Refreshing token and retrying...');
          
          // Refresh token by logging in again
          await this.login();
          token = await this.getValidToken();
          
          // Retry the request with new token
          const retryResponse = await makeRequest(token);
          this.logger.log(`CheckCle API call successful after token refresh: ${method} ${endpoint}`);
          return retryResponse.data;
        }
        
        // If it's not a 401, re-throw the error
        throw error;
      }
    } catch (error) {
      this.logger.error(`Failed to call CheckCle API: ${method} ${endpoint}`, error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }
}
