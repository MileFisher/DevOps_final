# DevOps Final Project

![CI](https://github.com/MileFisher/DevOps_final/actions/workflows/ci.yml/badge.svg)
![CD](https://github.com/MileFisher/DevOps_final/actions/workflows/cd.yml/badge.svg)

## Tier 2 Observability

The application exposes custom Prometheus metrics at `/metrics` for Advanced Observability:

- `app_http_requests_total` for request rates.
- `app_http_errors_total` for 4xx/5xx error counts.
- `app_http_request_duration_seconds` for latency percentiles.
- `app_http_requests_in_flight` for live request concurrency.
