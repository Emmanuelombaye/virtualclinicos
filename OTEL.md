# OpenTelemetry

Full OTel SDK is deferred. Use structured JSON logging via `src/lib/infra/logger.ts` and `x-request-id` headers for correlation.

When adding OTel later: install `@opentelemetry/sdk-node` + HTTP/Prisma instrumentation; gate on `OTEL_EXPORTER_OTLP_ENDPOINT`.
