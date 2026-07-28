import { BadRequestException } from '@nestjs/common';

export const PASSWORD_POLICY_MESSAGE =
  'Password must be at least 8 characters and include 1 lowercase letter, 1 number, and 1 special character';

export function isPasswordValid(password: string): boolean {
  if (!password || password.length < 8) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/\d/.test(password)) return false;
  if (!/[^A-Za-z0-9]/.test(password)) return false;
  return true;
}

export function assertPasswordValid(password: string): void {
  if (!isPasswordValid(password)) {
    throw new BadRequestException(PASSWORD_POLICY_MESSAGE);
  }
}
