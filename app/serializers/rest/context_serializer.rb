# frozen_string_literal: true

class REST::ContextSerializer < ActiveModel::Serializer
  # Please update `app/javascript/mastodon/api_types/statuses.ts` when making changes to the attributes

  has_many :ancestors,   serializer: REST::StatusSerializer
  has_many :descendants, serializer: REST::StatusSerializer
end
