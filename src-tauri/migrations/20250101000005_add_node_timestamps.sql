ALTER TABLE nodes ADD COLUMN created_at TEXT;
ALTER TABLE nodes ADD COLUMN updated_at TEXT;
UPDATE nodes
SET created_at = COALESCE(created_at, datetime('now')),
    updated_at = COALESCE(updated_at, datetime('now'));
CREATE TRIGGER IF NOT EXISTS nodes_set_timestamps_on_insert
AFTER INSERT ON nodes
FOR EACH ROW
WHEN NEW.created_at IS NULL OR NEW.updated_at IS NULL
BEGIN
    UPDATE nodes
    SET created_at = COALESCE(NEW.created_at, datetime('now')),
        updated_at = COALESCE(NEW.updated_at, datetime('now'))
    WHERE id = NEW.id;
END;
CREATE TRIGGER IF NOT EXISTS nodes_touch_updated_at
AFTER UPDATE OF name, content ON nodes
FOR EACH ROW
BEGIN
    UPDATE nodes
    SET updated_at = datetime('now')
    WHERE id = NEW.id;
END;
