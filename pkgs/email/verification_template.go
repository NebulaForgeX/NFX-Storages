package email

import (
	"fmt"
)

/**
 ** BuildVerificationEmailHTML builds a beautiful HTML email for verification code.
 ** BuildVerificationEmailHTML 构建验证码邮件的精美 HTML 内容。
 *
 * Parameters:
 *   !- code: Verification code (验证码)
 *
 * Returns:
 *   !- string: HTML email content (HTML 邮件内容)
 *
 * Examples:
 *
 * 	htmlBody := email.BuildVerificationEmailHTML("123456")
 * 	err := emailService.Send(email.EmailMessage{
 * 		To:      []string{"user@example.com"},
 * 		Subject: "Your Verification Code",
 * 		Body:    htmlBody,
 * 		IsHTML:  true,
 * 	})
 */
func BuildVerificationEmailHTML(code string) string {
	tmpl, err := loadTemplate("verification", verificationTemplateContent)
	if err != nil {
		return fmt.Sprintf("Your verification code is: %s\n\nThis code will expire in 5 minutes.", code)
	}

	data := struct {
		Code string
	}{
		Code: code,
	}

	html, err := executeTemplate(tmpl, data)
	if err != nil {
		return fmt.Sprintf("Your verification code is: %s\n\nThis code will expire in 5 minutes.", code)
	}

	return html
}
