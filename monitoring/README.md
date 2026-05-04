# Monitoring Stack

This project uses Prometheus and Grafana for Tier 2 runtime observability.

## Services

- Prometheus: collects metrics from the monitoring targets.
- Grafana: displays the provisioned `Tier 2 Runtime Overview` dashboard at `/grafana/`.
- node-exporter: exposes host CPU and memory metrics.
- cAdvisor: exposes Docker container CPU, memory, and last-seen metrics.
- web application: exposes custom application metrics from `/metrics`.

## Custom Application Metrics

The Node.js application exports Prometheus-format metrics at:

```text
http://web:3000/metrics
```

Prometheus scrapes this endpoint through the `web-application` job using Docker Compose DNS discovery, so scaled `web` replicas can be collected separately. The key custom metrics are:

- `app_http_requests_total`: request count by HTTP method, normalized route, status code, and status class.
- `app_http_errors_total`: 4xx/5xx response count by HTTP method, normalized route, status code, and status class.
- `app_http_request_duration_seconds`: request latency histogram for p95 latency queries.
- `app_http_requests_in_flight`: current number of requests being processed.

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
- Application request rate, error rate, p95 latency, and in-flight requests.

To generate application-level metrics during the demo, browse the site and call one not-found route:

```bash
curl -s http://127.0.0.1:3001/health
curl -s http://127.0.0.1:3001/products
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3001/products/not-found-id
```
