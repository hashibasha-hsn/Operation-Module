import { Controller, Post, Body, Get, Request, UseGuards, Headers, UnauthorizedException, Delete, Param, Query, Res } from '@nestjs/common';
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

  @Post('activate-account')
  async activateAccount(@Body() body: { token?: string }) {
    return this.authService.activateAccount(body.token ?? '');
  }

  @Get('activate-account')
  async activateAccountLink(@Query('token') token: string, @Res() res) {
    const result = await this.authService.activateAccount(token ?? '');
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const loginUrl = `${frontendUrl.replace(/\/$/, '')}/login?activated=1`;
    const html = `<!doctype html><html><body style="font-family:sans-serif;background:#f8fafc;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;">
      <div style="text-align:center;padding:40px;background:#fff;border-radius:12px;border:1px solid #e2e8f0;">
        <h2 style="color:#059669;margin:0 0 12px;">✓ Account activated</h2>
        <p style="color:#475569;margin:0 0 24px;">${result.message}</p>
        <a href="${loginUrl}" style="background:#0284c7;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;">Go to login</a>
      </div></body></html>`;
    res.type('html').send(html);
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
