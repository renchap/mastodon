# frozen_string_literal: true

class DropPgheroSpaceStats < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  def up
    drop_table :pghero_space_stats
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end
