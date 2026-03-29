function escapeHtml(input) {
	return String(input || "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/\"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

function buildVerifyEmailTemplate({ verifyUrl, fullName }) {
	const safeName = escapeHtml(fullName || "there");
	const safeUrl = escapeHtml(verifyUrl);
	return {
		subject: "Verify your email",
		text: `Hi ${fullName || "there"},\n\nPlease verify your email by opening this link:\n${verifyUrl}\n\nIf you did not create this account, you can ignore this email.`,
		html: `
			<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
				<h2 style="margin: 0 0 12px;">Verify your email</h2>
				<p>Hi ${safeName},</p>
				<p>Please verify your email to activate your account.</p>
				<p>
					<a href="${safeUrl}" style="display:inline-block;padding:10px 16px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:8px;">Verify Email</a>
				</p>
				<p style="font-size: 13px; color: #6b7280;">If the button does not work, use this link:<br/><a href="${safeUrl}">${safeUrl}</a></p>
				<p style="font-size: 13px; color: #6b7280;">If you did not create this account, you can ignore this email.</p>
			</div>
		`,
	};
}

function buildResetPasswordTemplate({ resetUrl, fullName }) {
	const safeName = escapeHtml(fullName || "there");
	const safeUrl = escapeHtml(resetUrl);
	return {
		subject: "Reset your password",
		text: `Hi ${fullName || "there"},\n\nUse this link to reset your password:\n${resetUrl}\n\nIf you did not request a password reset, you can ignore this email.`,
		html: `
			<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
				<h2 style="margin: 0 0 12px;">Reset your password</h2>
				<p>Hi ${safeName},</p>
				<p>We received a request to reset your password.</p>
				<p>
					<a href="${safeUrl}" style="display:inline-block;padding:10px 16px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:8px;">Reset Password</a>
				</p>
				<p style="font-size: 13px; color: #6b7280;">This link expires soon for security reasons.</p>
				<p style="font-size: 13px; color: #6b7280;">If you did not request this, you can ignore this email.</p>
			</div>
		`,
	};
}

module.exports = {
	buildVerifyEmailTemplate,
	buildResetPasswordTemplate,
};
