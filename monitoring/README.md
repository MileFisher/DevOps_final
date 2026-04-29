# Monitoring Stack

This project uses Prometheus and Grafana for Tier 2 runtime observability.

## Services

- Prometheus: collects metrics from the monitoring targets.
- Grafana: displays the provisioned `Tier 2 Runtime Overview` dashboard at `/grafana/`.
- node-exporter: exposes host CPU and memory metrics.
- cAdvisor: exposes Docker container CPU, memory, and last-seen metrics.

## Demo Checks

After deployment, verify the stack on the server:

```bash
cd /home/ubuntu/app
docker compose ps
curl -s http://127.0.0.1:9090/-/ready
```

Open Grafana through HTTPS:

```text
https://<your-domain>/grafana/
```

Use the dashboard to show:

- Host CPU usage.
- Host memory usage.
- Container CPU usage.
- Container memory usage.
- Prometheus target status.
- Container last-seen status during a failure simulation.
