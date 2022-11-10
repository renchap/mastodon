# frozen_string_literal: true

# Set OTEL_* environment variables according to OTel docs:
# https://opentelemetry.io/docs/concepts/sdk-configuration/
#
# Totally hypothetically, if one wanted to send traces to Honeycomb,
# OTEL_EXPORTER_OTLP_ENDPOINT=https://api.honeycomb.io
# OTEL_EXPORTER_OTLP_HEADERS="x-honeycomb-team=<apikey>"

# If an OTEL endpoint of some variety has been set,
# light things up.
if ENV.keys.any? {|name| name.match?(/OTEL_.*_ENDPOINT/)}
  # required for the crafting of telemetry
  require 'opentelemetry/sdk'
  # required for the sending of telemetry
  require 'opentelemetry/exporter/otlp'
  # convenience to include all auto-instrumentations
  # available from OTel Ruby contrib
  require 'opentelemetry/instrumentation/all'


  OpenTelemetry::SDK.configure do |c|
    # set a sensible service name if one wasn't provided
    # by environment variable
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

    # use_all() attempts to load ALL the auto-instrumentations
    # currently loaded by Ruby requires.
    #
    # Load attempts will emit an INFO or WARN to the console
    # about the success/failure to wire up an auto-instrumentation.
    # "WARN -- : Instrumentation: <X> failed to install" is most
    # likely caused by <X> not being a Ruby library loaded by
    # the application or the instrumentation has been explicitly
    # disabled.
    #
    # To disable an instrumentation, set an environment variable
    # along this pattern:
    #
    # OTEL_RUBY_INSTRUMENTATION_<X>_ENABLED=false
    #
    # For example, PostgreSQL and Redis produce a lot of child spans
    # in the course of this application doing its business. To turn
    # them off, set the env vars below, but recognize that you will
    # be missing details about what particular calls to the
    # datastores are slow.
    #
    # OTEL_RUBY_INSTRUMENTATION_PG_ENABLED=false
    # OTEL_RUBY_INSTRUMENTATION_REDIS_ENABLED=false
    # 
    c.use_all()
  end
end
