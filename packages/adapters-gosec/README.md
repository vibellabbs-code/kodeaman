# adapters-gosec

gosec adapter for Go SAST. It runs `gosec -fmt=json ./...`, normalizes findings, and includes bilingual remediation coaching. Projects are detected from `go.mod` or `go.sum`.
