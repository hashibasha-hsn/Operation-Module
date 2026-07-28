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
    @Body() body: { email: string; password: string; rememberMe?: boolean },
    @Headers('user-agent') userAgent?: string,
    @Request() req?: any,
  ) {
    const ipAddress = req?.ip || req?.connection?.remoteAddress;
    const user = await this.authService.validateUser(
      body.email?.trim().toLowerCase() ?? '',
      body.password?.trim() ?? '',
    );
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.authService.login(user, ipAddress, userAgent, body.rememberMe !== false);
  }

  @Post('login/verify-otp')
  async verifyLoginOtp(
    @Body() body: { pendingToken: string; otp: string },
    @Headers('user-agent') userAgent?: string,
    @Request() req?: any,
  ) {
    const ipAddress = req?.ip || req?.connection?.remoteAddress;
    return this.authService.verifyLoginOtp(
      body.pendingToken ?? '',
      body.otp ?? '',
      ipAddress,
      userAgent,
    );
  }

  @Post('login/resend-otp')
  async resendLoginOtp(@Body() body: { pendingToken: string }) {
    return this.authService.resendLoginOtp(body.pendingToken ?? '');
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

  @UseGuards(JwtAuthGuard)
  @Get('two-factor-settings')
  async getTwoFactorSettings(@Request() req: any) {
    return this.authService.getTwoFactorSettings(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('two-factor-settings')
  async updateTwoFactorSettings(
    @Request() req: any,
    @Body() body: { enabled: boolean },
  ) {
    return this.authService.updateTwoFactorSettings(req.user.id, Boolean(body.enabled));
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(
    @Request() req: any,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    return this.authService.changePassword(
      req.user.id,
      body.currentPassword ?? '',
      body.newPassword ?? '',
    );
  }

  /** Platform password rotation policy (expiry days). */
  @Get('password-policy')
  async getPasswordPolicy() {
    return this.authService.getPasswordPolicy();
  }

  @UseGuards(JwtAuthGuard)
  @Post('password-policy')
  async updatePasswordPolicy(
    @Body() body: { passwordExpiryDays?: number; warnBeforeExpiryDays?: number },
  ) {
    return this.authService.updatePasswordPolicy(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('password-rotation-status')
  async getPasswordRotationStatus(@Request() req: any) {
    return this.authService.getPasswordRotationStatus(req.user.id);
  }

  @Post('setup-admin')
  async setupAdmin(@Body() body: { email: string; password: string; organizationName: string }) {
    return this.authService.setupAdmin(body.email, body.password, body.organizationName);
  }

  @Get('check-setup')
  async checkSetup() {
    return this.authService.checkSetup();
  }

  @Get('users/last-logins')
  async getLastLogins() {
    return this.authService.getLastLogins();
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') id: string) {
    return this.authService.deleteUser(id);
  }
}
