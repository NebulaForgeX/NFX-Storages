package email

import (
	"bytes"
	"fmt"
	"html/template"
	"net/smtp"
	"path/filepath"
	"strings"
	"time"
)

/**
 ** SMTPConfig holds the configuration for SMTP email sending.
 ** SMTPConfig 包含 SMTP 邮件发送的配置。
 */
type SMTPConfig struct {
	Host     string // SMTP server host (SMTP 服务器主机)
	Port     int    // SMTP server port (SMTP 服务器端口)
	Username string // SMTP username (SMTP 用户名)
	Password string // SMTP password (SMTP 密码)
	From     string // Sender email address (发件人邮箱)
}

/**
 ** EmailService provides email sending functionality.
 ** EmailService 提供邮件发送功能。
 */
type EmailService struct {
	config SMTPConfig
}

/**
 ** NewEmailService creates a new email service instance.
 ** NewEmailService 创建新的邮件服务实例。
 */
func NewEmailService(config SMTPConfig) *EmailService {
	return &EmailService{
		config: config,
	}
}

/**
 ** EmailAttachment represents an email attachment.
 ** EmailAttachment 表示邮件附件。
 */
type EmailAttachment struct {
	Filename    string // File name (文件名)
	ContentType string // MIME type (MIME 类型)
	Data        []byte // File data (文件数据)
}

/**
 ** EmailMessage represents an email to be sent.
 ** EmailMessage 表示要发送的邮件。
 */
type EmailMessage struct {
	To          []string          // Recipients (收件人)
	Subject     string            // Email subject (邮件主题)
	Body        string            // Email body (plain text or HTML) (邮件正文，纯文本或 HTML)
	IsHTML      bool              // Whether body is HTML (正文是否为 HTML)
	Attachments []EmailAttachment // File attachments (文件附件)
}

/**
 ** Send sends an email via SMTP.
 ** Send 通过 SMTP 发送邮件。
 *
 * Parameters:
 *   !- msg: Email message to send (要发送的邮件消息)
 *
 * Returns:
 *   !- error: Error if sending fails (发送失败时的错误)
 *
 * Examples:
 *
 * 	// Example 1: Send plain text email (示例 1：发送纯文本邮件)
 * 	err := emailService.Send(EmailMessage{
 * 		To:      []string{"user@example.com"},
 * 		Subject: "Welcome!",
 * 		Body:    "Hello, welcome to our service!",
 * 		IsHTML:  false,
 * 	})
 *
 * 	// Example 2: Send HTML email (示例 2：发送 HTML 邮件)
 * 	err := emailService.Send(EmailMessage{
 * 		To:      []string{"user@example.com"},
 * 		Subject: "Welcome!",
 * 		Body:    "<h1>Welcome!</h1><p>Thank you for joining us.</p>",
 * 		IsHTML:  true,
 * 	})
 */
func (s *EmailService) Send(msg EmailMessage) error {
	auth := smtp.PlainAuth("", s.config.Username, s.config.Password, s.config.Host)

	// Build email message
	var message bytes.Buffer

	// Headers
	message.WriteString(fmt.Sprintf("From: nfxstorages <%s>\r\n", s.config.From))
	message.WriteString(fmt.Sprintf("To: %s\r\n", strings.Join(msg.To, ", ")))
	message.WriteString(fmt.Sprintf("Subject: %s\r\n", msg.Subject))
	message.WriteString(fmt.Sprintf("Date: %s\r\n", time.Now().Format(time.RFC1123Z)))
	message.WriteString(fmt.Sprintf("Message-ID: <%d.%s@nfxstorages.com>\r\n", time.Now().UnixNano(), msg.To[0]))
	message.WriteString("MIME-Version: 1.0\r\n")

	// Handle attachments
	if len(msg.Attachments) > 0 {
		boundary := "boundary-" + fmt.Sprintf("%d", len(msg.Attachments))
		message.WriteString(fmt.Sprintf("Content-Type: multipart/mixed; boundary=%s\r\n", boundary))
		message.WriteString("\r\n")

		// Body part
		message.WriteString(fmt.Sprintf("--%s\r\n", boundary))
		if msg.IsHTML {
			message.WriteString("Content-Type: text/html; charset=UTF-8\r\n")
		} else {
			message.WriteString("Content-Type: text/plain; charset=UTF-8\r\n")
		}
		message.WriteString("\r\n")
		message.WriteString(msg.Body)
		message.WriteString("\r\n")

		// Attachment parts
		for _, att := range msg.Attachments {
			message.WriteString(fmt.Sprintf("\r\n--%s\r\n", boundary))
			message.WriteString(fmt.Sprintf("Content-Type: %s\r\n", att.ContentType))
			message.WriteString("Content-Transfer-Encoding: base64\r\n")
			message.WriteString(fmt.Sprintf("Content-Disposition: attachment; filename=%s\r\n", att.Filename))
			message.WriteString("\r\n")
			message.WriteString(encodeBase64(att.Data))
			message.WriteString("\r\n")
		}

		message.WriteString(fmt.Sprintf("\r\n--%s--", boundary))
	} else {
		// Simple message without attachments
		if msg.IsHTML {
			message.WriteString("Content-Type: text/html; charset=UTF-8\r\n")
		} else {
			message.WriteString("Content-Type: text/plain; charset=UTF-8\r\n")
		}
		message.WriteString("\r\n")
		message.WriteString(msg.Body)
	}

	// Send email
	addr := fmt.Sprintf("%s:%d", s.config.Host, s.config.Port)
	return smtp.SendMail(addr, auth, s.config.From, msg.To, message.Bytes())
}

/**
 ** SendWithTemplate sends an email using an HTML template.
 ** SendWithTemplate 使用 HTML 模板发送邮件。
 */
func (s *EmailService) SendWithTemplate(to []string, subject string, templatePath string, data interface{}) error {
	tmpl, err := template.ParseFiles(templatePath)
	if err != nil {
		return fmt.Errorf("failed to parse template: %w", err)
	}

	var body bytes.Buffer
	if err := tmpl.Execute(&body, data); err != nil {
		return fmt.Errorf("failed to execute template: %w", err)
	}

	return s.Send(EmailMessage{
		To:      to,
		Subject: subject,
		Body:    body.String(),
		IsHTML:  true,
	})
}

// encodeBase64 encodes data to base64 string
func encodeBase64(data []byte) string {
	const base64Table = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
	var result bytes.Buffer

	for i := 0; i < len(data); i += 3 {
		chunk := data[i:]
		if len(chunk) > 3 {
			chunk = chunk[:3]
		}

		b1 := chunk[0]
		result.WriteByte(base64Table[b1>>2])

		if len(chunk) > 1 {
			b2 := chunk[1]
			result.WriteByte(base64Table[((b1&0x03)<<4)|(b2>>4)])

			if len(chunk) > 2 {
				b3 := chunk[2]
				result.WriteByte(base64Table[((b2&0x0F)<<2)|(b3>>6)])
				result.WriteByte(base64Table[b3&0x3F])
			} else {
				result.WriteByte(base64Table[(b2&0x0F)<<2])
				result.WriteByte('=')
			}
		} else {
			result.WriteByte(base64Table[(b1&0x03)<<4])
			result.WriteString("==")
		}
	}

	return result.String()
}

/**
 ** GetImageContentType returns the MIME type based on file extension.
 ** GetImageContentType 根据文件扩展名返回 MIME 类型。
 */
func GetImageContentType(filename string) string {
	ext := strings.ToLower(filepath.Ext(filename))
	switch ext {
	case ".jpg", ".jpeg":
		return "image/jpeg"
	case ".png":
		return "image/png"
	case ".gif":
		return "image/gif"
	case ".webp":
		return "image/webp"
	default:
		return "application/octet-stream"
	}
}
