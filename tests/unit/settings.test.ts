import { describe, it, expect } from 'vitest';
import {
  ProfileSettingsSchema,
  ChangePasswordSchema,
  AccountDataWipeSchema,
} from '@/lib/validations';

describe('Settings & Profile Validation Schemas', () => {
  describe('Profile Settings Schema', () => {
    it('accepts valid profile update with currency and timezone', () => {
      const valid = {
        name: 'Muneeb',
        preferredCurrency: 'USD',
        timezone: 'America/New_York',
      };

      const result = ProfileSettingsSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects profile with short name', () => {
      const short = {
        name: 'M',
        preferredCurrency: 'USD',
        timezone: 'UTC',
      };

      expect(ProfileSettingsSchema.safeParse(short).success).toBe(false);
    });
  });

  describe('Change Password Schema', () => {
    it('validates password update with minimum 8 characters', () => {
      const valid = {
        currentPassword: 'currentPassword123',
        newPassword: 'newSecurePassword456',
      };

      const result = ChangePasswordSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects short new password or missing current password', () => {
      const shortNew = {
        currentPassword: 'validPassword123',
        newPassword: 'short',
      };

      const missingCurrent = {
        currentPassword: '',
        newPassword: 'validNewPassword123',
      };

      expect(ChangePasswordSchema.safeParse(shortNew).success).toBe(false);
      expect(ChangePasswordSchema.safeParse(missingCurrent).success).toBe(false);
    });
  });

  describe('Account Data Wipe Double Confirmation Schema', () => {
    it('accepts the exact confirmation phrase DELETE MY DATA', () => {
      const valid = {
        confirmationPhrase: 'DELETE MY DATA',
      };

      const result = AccountDataWipeSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects inaccurate or lowercase confirmation phrases', () => {
      const lowercase = { confirmationPhrase: 'delete my data' };
      const partial = { confirmationPhrase: 'DELETE' };
      const empty = { confirmationPhrase: '' };

      expect(AccountDataWipeSchema.safeParse(lowercase).success).toBe(false);
      expect(AccountDataWipeSchema.safeParse(partial).success).toBe(false);
      expect(AccountDataWipeSchema.safeParse(empty).success).toBe(false);
    });
  });
});
