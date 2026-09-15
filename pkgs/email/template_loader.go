package email

import (
	"bytes"
	_ "embed"
	"fmt"
	"html/template"
)

//go:embed templates/verification.html
var verificationTemplateContent string

//go:embed templates/contact_admin.html
var contactAdminTemplateContent string

//go:embed templates/contact_confirmation.html
var contactConfirmationTemplateContent string

//go:embed templates/investor_contact.html
var investorContactTemplateContent string

//go:embed templates/report.html
var reportTemplateContent string

// loadTemplate 从嵌入的内容加载模板
func loadTemplate(name, content string) (*template.Template, error) {
	tmpl, err := template.New(name).Parse(content)
	if err != nil {
		return nil, fmt.Errorf("failed to parse template %s: %w", name, err)
	}
	return tmpl, nil
}

// executeTemplate 执行模板并返回 HTML 字符串
func executeTemplate(tmpl *template.Template, data interface{}) (string, error) {
	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, data); err != nil {
		return "", fmt.Errorf("failed to execute template: %w", err)
	}
	return buf.String(), nil
}
