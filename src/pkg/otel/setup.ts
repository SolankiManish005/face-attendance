import { appEnv } from "@/pkg/env/env";
import { logs } from "@opentelemetry/api-logs";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { UndiciInstrumentation } from "@opentelemetry/instrumentation-undici";
import { WinstonInstrumentation } from "@opentelemetry/instrumentation-winston";
import { CompressionAlgorithm } from "@opentelemetry/otlp-exporter-base";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { BatchLogRecordProcessor, LoggerProvider } from "@opentelemetry/sdk-logs";
import { BatchSpanProcessor, NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
// import { diag, DiagConsoleLogger, DiagLogLevel } from "@opentelemetry/api";

// diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ALL);
export const setupOpenTelemetry = ({
  name,
  version,
}: {
  name: string;
  version: string;
}) => {
  console.info("Setting up OpenTelemetry", { name, version });
  const resource = resourceFromAttributes({
    "service.name": name,
    "service.version": version,
  });

  const traceProvider = new NodeTracerProvider({
    resource,
    spanProcessors: [
      new BatchSpanProcessor(
        new OTLPTraceExporter({
          compression: CompressionAlgorithm.GZIP,
          url: appEnv.OTEL_EXPORTER_TRACES_ENDPOINT,
          headers: appEnv.OTEL_EXPORTER_TRACES_HEADERS as Record<string, string>,
        }),
      ),
    ],
  });
  traceProvider.register();

  const loggerProvider = new LoggerProvider({
    resource,
    processors: [
      new BatchLogRecordProcessor(
        new OTLPLogExporter({
          url: appEnv.OTEL_EXPORTER_LOGS_ENDPOINT,
          headers: appEnv.OTEL_EXPORTER_LOGS_HEADERS as Record<string, string>,
        }),
      ),
    ],
  });
  logs.setGlobalLoggerProvider(loggerProvider);

  registerInstrumentations({
    instrumentations: [
      new HttpInstrumentation(),
      new UndiciInstrumentation(),
      new WinstonInstrumentation({
        disableLogCorrelation: false,
        logHook: (span, record) => {
          console.info("logHook", { span, record });
        },
      }),
    ],
  });
};
