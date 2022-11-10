# frozen_string_literal: true

# Set OTEL_* environment variables according to OTel docs:
# https://opentelemetry.io/docs/concepts/sdk-configuration/
#
# Totally hypothetically, if one wanted to send traces to Honeycomb,
# OTEL_EXPORTER_OTLP_ENDPOINT=https://api.honeycomb.io
# OTEL_EXPORTER_OTLP_HEADERS="x-honeycomb-team=<apikey>"
#
if ENV.keys.any? {|name| name.start_with?('OTEL_')}
  require 'opentelemetry/sdk'
  require 'opentelemetry/exporter/otlp'
  require 'opentelemetry/instrumentation/all'
  OpenTelemetry::SDK.configure do |c|
    unless ENV['OTEL_SERVICE_NAME'].present?
      c.service_name = case $PROGRAM_NAME
                        when /puma/
                          "web"
                        when /sidekiq/
                          "sidekiq"
                        else
                          $PROGRAM_NAME.split("/").last
                        end
    end
    c.use_all() # enables all instrumentation!
  end
end
