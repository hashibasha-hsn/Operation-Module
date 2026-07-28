export type PasswordRuleId =
  | "minLength"
  | "hasLowercase"
  | "hasDigit"
  | "hasSpecial";

export type PasswordRule = {
  id: PasswordRuleId;
  label: string;
  test: (password: string) => boolean;
};

/** 8+ chars, 1 lowercase, 1 digit, 1 special character */
export const PASSWORD_RULES: PasswordRule[] = [
  {
    id: "minLength",
    label: "At least 8 characters",
    test: (password) => password.length >= 8,
  },
  {
    id: "hasLowercase",
    label: "At least one lowercase letter",
    test: (password) => /[a-z]/.test(password),
  },
  {
    id: "hasDigit",
    label: "At least one number",
    test: (password) => /\d/.test(password),
  },
  {
    id: "hasSpecial",
    label: "At least one special character",
    test: (password) => /[^A-Za-z0-9]/.test(password),
  },
];

export const PASSWORD_POLICY_MESSAGE =
  "Password must be at least 8 characters and include 1 lowercase letter, 1 number, and 1 special character";

export function getPasswordRuleResults(password: string) {
  return PASSWORD_RULES.map((rule) => ({
    ...rule,
    passed: rule.test(password),
  }));
}

export function isPasswordValid(password: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(password));
}

export function validatePassword(password: string): string | null {
  if (!password) {
    return "Password is required";
  }
  if (!isPasswordValid(password)) {
    return PASSWORD_POLICY_MESSAGE;
  }
  return null;
}
