import { Controller, Post, Get, Param, Body, Query, Put, Patch, Delete } from '@nestjs/common';
import { CheckcleAuthService } from './checkcle-auth.service';

@Controller('checkcle-auth')
export class CheckcleAuthController {
  constructor(private readonly checkcleAuthService: CheckcleAuthService) {}

  @Post('login')
  async login() {
    await this.checkcleAuthService.login();
    return { message: 'Login attempt completed. Check logs for details.' };
  }

  @Get('token')
  async getToken() {
    const tokenInfo = await this.checkcleAuthService.getTokenWithExpiry();
    return { 
      message: 'Token retrieved successfully',
      tokenExists: !!tokenInfo.token,
      tokenLength: tokenInfo.token.length,
      expiresAt: tokenInfo.expiry.toISOString(),
      expiresAtUTC: tokenInfo.expiry.toUTCString()
    };
  }

@Get('call/*endpoint')
async callCheckCleGet(@Param('endpoint') endpoint: string | string[], @Query() queryParams: any) {
  // Garante que vira string com "/"
  const endpointPath = Array.isArray(endpoint) ? endpoint.join('/') : endpoint;

  const fullEndpoint = `/${endpointPath}${Object.keys(queryParams).length ? '?' + new URLSearchParams(queryParams).toString() : ''}`;

  console.log('Calling CheckCle API (GET):', fullEndpoint);

  return await this.checkcleAuthService.callCheckCle(fullEndpoint, 'GET');
}



  @Post('call/*endpoint')
  async callCheckClePost(@Param('endpoint') endpoint: string | string[], @Body() body: any) {
    // Garante que vira string com "/"
    const endpointPath = Array.isArray(endpoint) ? endpoint.join('/') : endpoint;

    const fullEndpoint = `/${endpointPath}`;
    const result = await this.checkcleAuthService.callCheckCle(fullEndpoint, 'POST', body);
    return result;
  }

  @Patch('call/*endpoint')
  async callCheckClePatch(@Param('endpoint') endpoint: string | string[], @Body() body: any) {
    // Garante que vira string com "/"
    const endpointPath = Array.isArray(endpoint) ? endpoint.join('/') : endpoint;

    const fullEndpoint = `/${endpointPath}`;
    const result = await this.checkcleAuthService.callCheckCle(fullEndpoint, 'PATCH', body);
    return result;
  }

  @Delete('call/*endpoint')
  async callCheckCleDelete(@Param('endpoint') endpoint: string | string[]) {
    // Garante que vira string com "/"
    const endpointPath = Array.isArray(endpoint) ? endpoint.join('/') : endpoint;

    const fullEndpoint = `/${endpointPath}`;
    const result = await this.checkcleAuthService.callCheckCle(fullEndpoint, 'DELETE');
    return result;
  }
}
