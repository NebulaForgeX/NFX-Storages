package tokenx

type Tokenx struct {
	generator *Generator
	verifier  *Verifier
	cfg       Config
}

func New(cfg Config) *Tokenx {
	return &Tokenx{
		generator: NewGenerator(cfg),
		verifier:  NewVerifier(cfg),
		cfg:       cfg,
	}
}

func (t *Tokenx) GenerateAccessToken(accountID, profileID, username, email, phone, profileScope string) (string, error) {
	return t.generator.GenerateAccessToken(accountID, profileID, username, email, phone, profileScope)
}

func (t *Tokenx) GenerateRefreshToken(accountID, profileID, username, email, phone, profileScope string) (string, error) {
	return t.generator.GenerateRefreshToken(accountID, profileID, username, email, phone, profileScope)
}

func (t *Tokenx) GenerateTokenPair(accountID, profileID, username, email, phone, profileScope string) (accessToken, refreshToken string, err error) {
	return t.generator.GenerateTokenPair(accountID, profileID, username, email, phone, profileScope)
}

func (t *Tokenx) GenerateTokenPairWithRefreshID(
	accountID, profileID, username, email, phone, profileScope, refreshTokenID string,
) (accessToken, refreshToken string, err error) {
	return t.generator.GenerateTokenPairWithRefreshID(accountID, profileID, username, email, phone, profileScope, refreshTokenID)
}

func (t *Tokenx) VerifyAccessToken(tokenString string) (*TokenClaims, error) {
	return t.verifier.VerifyAccessToken(tokenString)
}

func (t *Tokenx) VerifyRefreshToken(tokenString string) (*TokenClaims, error) {
	return t.verifier.VerifyRefreshToken(tokenString)
}

func (t *Tokenx) VerifyToken(tokenString string) (*TokenClaims, error) {
	return t.verifier.VerifyToken(tokenString)
}

func (t *Tokenx) RefreshTokenPair(refreshToken string) (accessToken, newRefreshToken string, err error) {
	return t.verifier.RefreshTokenPair(refreshToken, t.generator)
}
