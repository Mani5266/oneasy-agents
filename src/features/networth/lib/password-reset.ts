// ─── Password Reset Logic (Supabase Built-in) ────────────────────────────
// Uses Supabase's native password reset flow:
// - resetPasswordForEmail() sends a reset email via Supabase
// - User clicks link → lands on app with auth code
// - Frontend exchanges code for session, then calls auth.updateUser({ password })
//
// For the admin-side route (reset-password API), we use admin.updateUserById.

import { createSupabaseAdminClient } from "./supabase-server";
import { sendEmail } from "./email";

// ─── Types ────────────────────────────────────────────────────────────────────

type ResetResult =
  | { success: true; provider: string }
  | { success: false; error: string };

type VerifyResetResult =
  | { success: true }
  | { success: false; error: string };

// ─── Create & Send Password Reset ─────────────────────────────────────────────

/**
 * Generates a Supabase password reset link and sends it via our custom email.
 * Uses admin.generateLink() to get the reset link, then sends with our template.
 *
 * Returns success even if user doesn't exist (prevents email enumeration).
 */
export async function createAndSendPasswordReset(
  email: string
): Promise<ResetResult> {
  const admin = createSupabaseAdminClient();
  const t0 = Date.now();

  // Minimum response time to prevent timing-based user enumeration
  const MIN_RESPONSE_MS = 800;

  async function ensureMinTime<T>(result: T): Promise<T> {
    const elapsed = Date.now() - t0;
    if (elapsed < MIN_RESPONSE_MS) {
      await new Promise((r) => setTimeout(r, MIN_RESPONSE_MS - elapsed));
    }
    return result;
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Generate a password reset link via Supabase admin API
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const redirectTo = `${appUrl}/reset-password`;

  const { data: linkData, error: linkError } =
    await admin.auth.admin.generateLink({
      type: "recovery",
      email: normalizedEmail,
      options: { redirectTo },
    });

  if (linkError || !linkData?.properties?.action_link) {
    // Could be "user not found" — return success to prevent enumeration
    console.log("[PASSWORD_RESET] generateLink failed (safe noop)", {
      error: linkError?.message,
    });
    return ensureMinTime({ success: true as const, provider: "noop" });
  }

  const resetLink = linkData.properties.action_link;

  // Send email with our custom template
  const emailResult = await sendEmail({
    to: normalizedEmail,
    subject: "Reset your password — OnEasy",
    html: buildResetEmail(resetLink),
  });

  if (!emailResult.success) {
    console.error("[PASSWORD_RESET] Email send failed");
    return { success: false, error: "Failed to send reset email" };
  }

  console.log("[PASSWORD_RESET] Reset email sent", {
    provider: emailResult.provider,
  });

  return ensureMinTime({ success: true, provider: emailResult.provider });
}

// ─── Verify Token & Update Password ──────────────────────────────────────────

/**
 * Verifies a password reset by looking up the user from the token (via Supabase's
 * built-in OTP verification) and updating their password.
 *
 * With Supabase built-in flow, the token exchange happens on the frontend via
 * supabase.auth.exchangeCodeForSession(). Once the user has a session, the
 * frontend calls auth.updateUser({ password }).
 *
 * This function is kept for backward compatibility with the API route contract.
 * It uses the admin API to verify the OTP and update the password.
 */
export async function verifyResetAndUpdatePassword(
  token: string,
  newPassword: string
): Promise<VerifyResetResult> {
  const admin = createSupabaseAdminClient();

  // Use Supabase's verifyOtp to validate the recovery token
  const { data, error } = await admin.auth.verifyOtp({
    token_hash: token,
    type: "recovery",
  });

  if (error || !data?.user) {
    console.error("[PASSWORD_RESET] Token verification failed", {
      error: error?.message,
    });
    return { success: false, error: "Invalid or expired reset link." };
  }

  // Update the user's password via admin API
  const { error: updateError } = await admin.auth.admin.updateUserById(
    data.user.id,
    { password: newPassword }
  );

  if (updateError) {
    console.error("[PASSWORD_RESET] Failed to update password", {
      userId: data.user.id,
      error: updateError.message,
    });
    return { success: false, error: "Failed to update password. Please try again." };
  }

  console.log("[PASSWORD_RESET] Password updated successfully", {
    userId: data.user.id,
  });

  return { success: true };
}

// ─── Email Template ───────────────────────────────────────────────────────────

function buildResetEmail(resetLink: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color:#0f172a;padding:24px 32px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:32px;height:32px;background-color:#f0b929;border-radius:8px;text-align:center;vertical-align:middle;font-weight:900;color:#0f172a;font-size:14px;">O</td>
                  <td style="padding-left:12px;color:#ffffff;font-size:16px;font-weight:800;letter-spacing:-0.02em;">OnEasy</td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#0f172a;">Reset your password</h1>
              <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#64748b;">
                We received a request to reset your password. Click the button below to set a new password. This link expires in 15 minutes.
              </p>
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${resetLink}" style="display:inline-block;background-color:#0f172a;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 32px;border-radius:8px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#94a3b8;">
                If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
              </p>
              <p style="margin:12px 0 0;font-size:11px;line-height:1.6;color:#cbd5e1;word-break:break-all;">
                If the button doesn't work, copy and paste this link: ${resetLink}
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px;border-top:1px solid #f1f5f9;">
              <p style="margin:0;font-size:11px;color:#cbd5e1;text-align:center;">
                &copy; 2026 OnEasy. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}
