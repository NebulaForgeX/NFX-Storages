package mongodbx

import "go.mongodb.org/mongo-driver/mongo"

// IsDuplicateKey checks whether the error is a duplicate key violation.
func IsDuplicateKey(err error) bool {
	if err == nil {
		return false
	}
	if we, ok := err.(mongo.WriteException); ok {
		for _, e := range we.WriteErrors {
			if e.Code == 11000 {
				return true
			}
		}
	}
	if ce, ok := err.(mongo.CommandError); ok && ce.Code == 11000 {
		return true
	}
	return false
}
