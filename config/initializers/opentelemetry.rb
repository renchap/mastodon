# frozen_string_literal: true

# Set OTEL_* environment variables according to OTel docs:
# https://opentelemetry.io/docs/concepts/sdk-configuration/

if ENV.keys.any? { |name| name.match?(/OTEL_.*_ENDPOINT/) }
  require 'opentelemetry/sdk'
  require 'opentelemetry/exporter/otlp'

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
  c.use_all

  OpenTelemetry::SDK.configure do |c|
    c.use_all

    c.service_name =  case $PROGRAM_NAME
                      when /puma/ then 'mastodon/web'
                      else
                        "mastodon/#{$PROGRAM_NAME.split('/').last}"
                      end
  end

  # Create spans for some ActiveRecord activity (queries, but not callbacks)
  # by subscribing OTel's ActiveSupport instrument to `sql.active_record` events
  # https://guides.rubyonrails.org/active_support_instrumentation.html#active-record
  OpenTelemetry::Instrumentation::ActiveSupport.subscribe(
    OpenTelemetry.tracer_provider.tracer('ActiveRecord'),
    'sql.active_record'
  )
end
