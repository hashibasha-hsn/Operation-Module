import { Controller, Post, Body, Get, Request, UseGuards, Headers, UnauthorizedException, Delete, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('users')
  async createUser(@Body() body: { id: string; email: string; password: string; verificationStatus: string }) {
    return this.authService.createUser(body);
  }

  @Post('check-email')
  async checkEmail(@Body() body: { email: string }) {
    return this.authService.checkEmail(body.email);
  }

  @Post('verify-email/initiate')
  async initiateEmailVerification(@Body() body: { email: string }) {
    return this.authService.initiateEmailVerification(body.email);
  }

  @Post('verify-email/complete')
  async completeEmailVerification(@Body() body: { token: string; password: string }) {
    return this.authService.verifyEmail(body.token, body.password);
  }

  @Post('login')
  async login(
    @Body() body: { email: string; password: string },
    @Headers('user-agent') userAgent?: string,
    @Request() req?: any,
  ) {
    const ipAddress = req?.ip || req?.connection?.remoteAddress;
    const user = await this.authService.validateUser(body.email, body.password);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.authService.login(user, ipAddress, userAgent);
  }

  @Post('refresh')
  async refresh(@Body() body: { refreshToken: string }) {
    return this.authService.refreshToken(body.refreshToken);
  }

  @Post('logout')
  async logout(@Body() body: { refreshToken: string }) {
    return this.authService.logout(body.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }

  @Post('setup-admin')
  async setupAdmin(@Body() body: { email: string; password: string; organizationName: string }) {
    return this.authService.setupAdmin(body.email, body.password, body.organizationName);
  }

  @Get('check-setup')
  async checkSetup() {
    return this.authService.checkSetup();
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') id: string) {
    return this.authService.deleteUser(id);
  }
}
