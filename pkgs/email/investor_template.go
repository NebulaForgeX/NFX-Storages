package email

import (
	"fmt"
)

/**
 ** BuildInvestorContactEmailHTML builds HTML content for investor contact emails.
 ** BuildInvestorContactEmailHTML 构建投资人联系邮件的 HTML 内容。
 *
 * Parameters:
 *   !- name: Investor name (投资人姓名)
 *   !- email: Investor email (投资人邮箱)
 *   !- subject: Message subject (消息标题)
 *   !- message: Message content (消息内容)
 *
 * Returns:
 *   !- string: HTML email content (HTML 邮件内容)
 *
 * Examples:
 *
 * 	htmlBody := email.BuildInvestorContactEmailHTML("John Investor", "john@investment.com", "Investment Inquiry", "I am interested...")
 * 	err := emailService.Send(email.EmailMessage{
 * 		To:      []string{"admin@example.com"},
 * 		Subject: "Investor Contact",
 * 		Body:    htmlBody,
 * 		IsHTML:  true,
 * 	})
 */
func BuildInvestorContactEmailHTML(name, email, subject, message string) string {
	tmpl, err := loadTemplate("investor-contact", investorContactTemplateContent)
	if err != nil {
		return fmt.Sprintf("Error loading template: %v", err)
	}

	data := struct {
		Name    string
		Email   string
		Subject string
		Message string
	}{
		Name:    name,
		Email:   email,
		Subject: subject,
		Message: message,
	}

	html, err := executeTemplate(tmpl, data)
	if err != nil {
		return fmt.Sprintf("Error executing template: %v", err)
	}

	return html
}
