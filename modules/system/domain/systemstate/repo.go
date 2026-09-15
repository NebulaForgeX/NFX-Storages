package systemstate

import "context"

type Repo struct{ Create Create }
type Create interface {
	New(ctx context.Context, s *State) error
}
