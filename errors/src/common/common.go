package common

import "nfxstorages/pkgs/errx"

const (
	CodeInvalidCredentials = "INVALID_CREDENTIALS"
	CodeEmailTaken          = "EMAIL_TAKEN"
	CodeSourceNotFound      = "SOURCE_NOT_FOUND"
	CodeNewsNotFound        = "NEWS_NOT_FOUND"
	CodeReportNotFound      = "REPORT_NOT_FOUND"
)

var (
	ErrInvalidCredentials = errx.Unauthorized(CodeInvalidCredentials, "invalid email or password")
	ErrEmailTaken        = errx.Conflict(CodeEmailTaken, "email already registered")
	ErrSourceNotFound    = errx.NotFound(CodeSourceNotFound, "source not found")
	ErrNewsNotFound      = errx.NotFound(CodeNewsNotFound, "news item not found")
	ErrReportNotFound    = errx.NotFound(CodeReportNotFound, "report not found")
)

/*
!INVALID_CREDENTIALS
*en<invalid email or password>
*zh<邮箱或密码错误>
*fr<e-mail ou mot de passe invalide>

!EMAIL_TAKEN
*en<email already registered>
*zh<邮箱已被注册>
*fr<e-mail déjà enregistré>

!SOURCE_NOT_FOUND
*en<source not found>
*zh<来源不存在>
*fr<source introuvable>

!NEWS_NOT_FOUND
*en<news item not found>
*zh<新闻不存在>
*fr<actualité introuvable>

!REPORT_NOT_FOUND
*en<report not found>
*zh<报告不存在>
*fr<rapport introuvable>
*/
