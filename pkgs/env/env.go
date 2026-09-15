package env

type Env string

const (
	Dev  Env = "dev"
	Prod Env = "prod"
)

func (e Env) IsProd() bool {
	return e == Prod
}

func (e Env) IsDev() bool {
	return e == Dev
}

func (e Env) String() string {
	return string(e)
}
