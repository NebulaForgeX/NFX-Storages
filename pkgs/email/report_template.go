package email

import (
	"fmt"
)

/**
 ** BuildReportEmailHTML builds HTML content for report emails.
 ** BuildReportEmailHTML 构建举报邮件的 HTML 内容。
 *
 * Parameters:
 *   !- reportType: Type of report (user/message/chatroom) (举报类型)
 *   !- targetID: ID of the reported item (被举报对象的 ID)
 *   !- reportCategory: Category of report (举报类别)
 *   !- details: Report details (举报详情)
 *   !- hasEvidence: Whether evidence files are attached (是否有证据附件)
 *
 * Returns:
 *   !- string: HTML email content (HTML 邮件内容)
 *
 * Examples:
 *
 * 	htmlBody := email.BuildReportEmailHTML("user", "user-123", "harassment", "Details here", true)
 * 	err := emailService.Send(email.EmailMessage{
 * 		To:      []string{"admin@example.com"},
 * 		Subject: "New Report",
 * 		Body:    htmlBody,
 * 		IsHTML:  true,
 * 	})
 */
func BuildReportEmailHTML(reportType, targetID, reportCategory, details string, hasEvidence bool) string {
	tmpl, err := loadTemplate("report", reportTemplateContent)
	if err != nil {
		return fmt.Sprintf("Error loading template: %v", err)
	}

	data := struct {
		ReportType     string
		TargetID       string
		ReportCategory string
		Details        string
		HasEvidence    bool
	}{
		ReportType:     reportType,
		TargetID:       targetID,
		ReportCategory: reportCategory,
		Details:        details,
		HasEvidence:    hasEvidence,
	}

	html, err := executeTemplate(tmpl, data)
	if err != nil {
		return fmt.Sprintf("Error executing template: %v", err)
	}

	return html
}
