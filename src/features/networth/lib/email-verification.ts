// ─── Email Verification Logic (Supabase Built-in) ─────────────────────────
// Uses Supabase's native email confirmation flow instead of custom tokens.
// - Signup with "Confirm email" enabled → Supabase sends confirmation email
// - We use admin.generateLink() for custom email templates
// - Verification status is checked via email_confirmed_at

import { createSupabaseAdminClient } from "./supabase-server";
import { sendEmail } from "./email";

// ─── Types ────────────────────────────────────────────────────────────────────

type VerificationResult =
  | { success: true; provider: string }
  | { success: false; error: string };

// ─── Send Verification Email ──────────────────────────────────────────────────

/**
 * Generates a Supabase email confirmation link and sends it via our custom email.
 * Uses admin.generateLink() to get the OTP link, then sends with our template.
 */
export async function createAndSendVerification(
  userId: string
): Promise<VerificationResult> {
  const admin = createSupabaseAdminClient();

  // 1. Get user email from DB
  const { data: userData, error: userError } =
    await admin.auth.admin.getUserById(userId);

  if (userError || !userData?.user?.email) {
    console.error("[EMAIL_VERIFY] Failed to fetch user", {
      userId,
      hasError: Boolean(userError),
    });
    return { success: false, error: "User not found" };
  }

  const email = userData.user.email;

  // 2. Generate a confirmation link via Supabase admin API
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const redirectTo = `${appUrl}/api/networth/verify-email/callback`;

  const { data: linkData, error: linkError } =
    await admin.auth.admin.generateLink({
      type: "signup",
      email,
      password: "placeholder-not-used", // Required by API but user already exists
      options: { redirectTo },
    });

  if (linkError || !linkData?.properties?.action_link) {
    // Fallback: try magiclink type (works for existing users)
    const { data: magicData, error: magicError } =
      await admin.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: { redirectTo },
      });

    if (magicError || !magicData?.properties?.action_link) {
      console.error("[EMAIL_VERIFY] Failed to generate link", {
        userId,
        signupError: linkError?.message,
        magicError: magicError?.message,
      });
      return { success: false, error: "Failed to generate verification link" };
    }

    // Use the magic link as verification link
    const verifyLink = magicData.properties.action_link;

    const emailResult = await sendEmail({
      to: email,
      subject: "Verify your email — OnEasy",
      html: buildVerificationEmail(verifyLink),
    });

    if (!emailResult.success) {
      return { success: false, error: "Failed to send verification email" };
    }

    return { success: true, provider: emailResult.provider };
  }

  const verifyLink = linkData.properties.action_link;

  // 3. Send email with our custom template
  const emailResult = await sendEmail({
    to: email,
    subject: "Verify your email — OnEasy",
    html: buildVerificationEmail(verifyLink),
  });

  if (!emailResult.success) {
    console.error("[EMAIL_VERIFY] Email send failed", { userId });
    return { success: false, error: "Failed to send verification email" };
  }

  console.log("[EMAIL_VERIFY] Verification email sent", {
    userId,
    provider: emailResult.provider,
  });

  return { success: true, provider: emailResult.provider };
}

// ─── Check Verification Status ────────────────────────────────────────────────

/**
 * Checks if a user's email is confirmed via Supabase's email_confirmed_at field.
 */
export async function isEmailVerified(userId: string): Promise<boolean> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.getUserById(userId);

  if (error || !data?.user) return false;

  return data.user.email_confirmed_at != null;
}

// ─── Confirm Email (admin) ────────────────────────────────────────────────────

/**
 * Manually confirms a user's email via admin API.
 * Used by the verify-email callback route after token exchange.
 */
export async function confirmUserEmail(userId: string): Promise<boolean> {
  const admin = createSupabaseAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, {
    email_confirm: true,
  });

  if (error) {
    console.error("[EMAIL_VERIFY] Failed to confirm user email", {
      userId,
      error: error.message,
    });
    return false;
  }

  console.log("[EMAIL_VERIFY] Email verified successfully", { userId });
  return true;
}

// ─── Email Template ───────────────────────────────────────────────────────────

function buildVerificationEmail(verifyLink: string): string {
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
              <h1 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#0f172a;">Verify your email address</h1>
              <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#64748b;">
                Click the button below to verify your email and activate your account. This link expires in 15 minutes.
              </p>
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${verifyLink}" style="display:inline-block;background-color:#0f172a;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 32px;border-radius:8px;">
                      Verify Email
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#94a3b8;">
                If you didn't create an account on OnEasy, you can safely ignore this email.
              </p>
              <p style="margin:12px 0 0;font-size:11px;line-height:1.6;color:#cbd5e1;word-break:break-all;">
                If the button doesn't work, copy and paste this link: ${verifyLink}
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
