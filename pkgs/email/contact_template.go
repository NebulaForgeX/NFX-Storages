package email

type ContactUsEmailData struct {
	Name    string
	Email   string
	Phone   *string
	Wechat  *string
	Message string
}

func BuildContactUsAdminEmailHTML(data ContactUsEmailData) string {
	tmpl, err := loadTemplate("contact-admin", contactAdminTemplateContent)
	if err != nil {
		return "New contact message received.\n\n" +
			"Name: " + data.Name + "\n" +
			"Email: " + data.Email + "\n" +
			maybeLine("Phone", data.Phone) +
			maybeLine("Wechat", data.Wechat) +
			"Message:\n" + data.Message
	}

	html, err := executeTemplate(tmpl, data)
	if err != nil {
		return "New contact message received.\n\n" +
			"Name: " + data.Name + "\n" +
			"Email: " + data.Email + "\n" +
			maybeLine("Phone", data.Phone) +
			maybeLine("Wechat", data.Wechat) +
			"Message:\n" + data.Message
	}

	return html
}

func maybeLine(label string, value *string) string {
	if value == nil || *value == "" {
		return ""
	}
	return label + ": " + *value + "\n"
}

type ContactUsConfirmationData struct {
	Name       string
	AdminEmail string
}

func BuildContactUsConfirmationEmailHTML(data ContactUsConfirmationData) string {
	tmpl, err := loadTemplate("contact-confirmation", contactConfirmationTemplateContent)
	if err != nil {
		return "我们已经收到您的留言，会尽快联系您。\n\nNebulaForgeX Identity 团队"
	}

	html, err := executeTemplate(tmpl, data)
	if err != nil {
		return "我们已经收到您的留言，会尽快联系您。\n\nNebulaForgeX Identity 团队"
	}

	return html
}
