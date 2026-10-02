package ssh

import (
	"context"
	"fmt"
	"net"
	"nfxstorages/pkgs/logx"
	"nfxstorages/pkgs/retry"
	"os"
	"os/exec"
	"time"
)

type SSHConnectionConfig struct {
	PemPath  string
	Host     string
	Username string
}

type PortForwardingConfig struct {
	RemoteHost string
	RemotePort int
	LocalHost  string
	LocalPort  int
}

func OpenSSHTunnel(ctx context.Context, shConnCfg SSHConnectionConfig, portForwardingCfg PortForwardingConfig) (*exec.Cmd, error) {
	cmd := exec.CommandContext(ctx, "ssh",
		"-i", shConnCfg.PemPath,
		"-o", "StrictHostKeyChecking=no",
		"-N",
		"-L", fmt.Sprintf("%s:%d:%s:%d", portForwardingCfg.LocalHost, portForwardingCfg.LocalPort, portForwardingCfg.RemoteHost, portForwardingCfg.RemotePort),
		fmt.Sprintf("%s@%s", shConnCfg.Username, shConnCfg.Host),
	)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Start(); err != nil {
		return nil, err
	}
	return cmd, nil
}

func WaitUntilTCPReady(ctx context.Context, address string, tcpTimeout time.Duration, maxRetries uint) error {
	return retry.RetryVoid(
		ctx,
		func(ctx context.Context) error {
			conn, err := net.DialTimeout("tcp", address, tcpTimeout)
			if err != nil {
				return err
			}
			defer conn.Close()
			return nil
		},
		retry.Config{
			InitialInterval: 100 * time.Millisecond,
			MaxInterval:     500 * time.Millisecond,
			MaxTries:        uint(maxRetries),
			Notify: func(err error, attempt uint, duration time.Duration) {
				logx.S().Warnf("TCP connection attempt failed in attempt %d: %v, retrying in %s", attempt, err, duration)
			},
		})
}
