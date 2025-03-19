package main

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestEncrypt(t *testing.T) {
	got := encrypt("haha")
	want := "haha"
	assert.Equal(t, got, want, "This should be the same")
}
