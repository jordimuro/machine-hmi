import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import config from '../config/index.js';
import logger from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * HistoryStore - SQLite persistence for historical data
 *
 * HistorySample: {
 *   timestamp: number,
 *   data: { [tagName: string]: number }
 * }
 */
class HistoryStore {
  constructor(dbPath = join(__dirname, '../../data/history.db')) {
    this.dbPath = dbPath;
    this.db = null;
    this.insertStmt = null;
  }

  /**
   * Initialize database and create tables
   */
  init() {
    try {
      // Ensure data directory exists
      const dataDir = dirname(this.dbPath);
      if (!existsSync(dataDir)) {
        mkdirSync(dataDir, { recursive: true });
      }

      this.db = new Database(this.dbPath);

      // Create history table
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          timestamp INTEGER NOT NULL,
          tag_name TEXT NOT NULL,
          value REAL NOT NULL,
          quality TEXT DEFAULT 'good'
        );

        CREATE INDEX IF NOT EXISTS idx_timestamp ON history(timestamp);
        CREATE INDEX IF NOT EXISTS idx_tag_name ON history(tag_name);
        CREATE INDEX IF NOT EXISTS idx_tag_timestamp ON history(tag_name, timestamp);
      `);

      // Prepare insert statement
      this.insertStmt = this.db.prepare(`
        INSERT INTO history (timestamp, tag_name, value, quality)
        VALUES (?, ?, ?, ?)
      `);

      logger.info({ dbPath: this.dbPath }, 'History database initialized');

      // Schedule cleanup
      this.scheduleCleanup();
    } catch (error) {
      logger.error({ err: error }, 'Failed to initialize history database');
      throw error;
    }
  }

  /**
   * Log multiple tags at once
   */
  logTags(tags) {
    if (!this.db || !this.insertStmt) {
      logger.warn('History database not initialized');
      return;
    }

    const timestamp = Date.now();
    const transaction = this.db.transaction((tagsToLog) => {
      for (const tag of tagsToLog) {
        // Only log numeric values
        if (typeof tag.value === 'number') {
          this.insertStmt.run(timestamp, tag.name, tag.value, tag.quality);
        }
      }
    });

    try {
      transaction(tags);
      logger.debug({ count: tags.length, timestamp }, 'Tags logged to history');
    } catch (error) {
      logger.error({ err: error }, 'Failed to log tags to history');
    }
  }

  /**
   * Query history for a specific tag
   */
  query(tagName, fromTimestamp, toTimestamp) {
    if (!this.db) {
      logger.warn('History database not initialized');
      return [];
    }

    try {
      const stmt = this.db.prepare(`
        SELECT timestamp, value, quality
        FROM history
        WHERE tag_name = ? AND timestamp >= ? AND timestamp <= ?
        ORDER BY timestamp ASC
      `);

      const rows = stmt.all(tagName, fromTimestamp, toTimestamp);
      return rows.map(row => ({
        timestamp: row.timestamp,
        value: row.value,
        quality: row.quality,
      }));
    } catch (error) {
      logger.error({ err: error, tagName }, 'Failed to query history');
      return [];
    }
  }

  /**
   * Get available tags in history
   */
  getAvailableTags() {
    if (!this.db) {
      return [];
    }

    try {
      const stmt = this.db.prepare(`
        SELECT DISTINCT tag_name FROM history ORDER BY tag_name
      `);
      return stmt.all().map(row => row.tag_name);
    } catch (error) {
      logger.error({ err: error }, 'Failed to get available tags');
      return [];
    }
  }

  /**
   * Clean up old data based on retention policy
   */
  cleanup() {
    if (!this.db) {
      return;
    }

    const retentionMs = config.history.retentionHours * 60 * 60 * 1000;
    const cutoffTimestamp = Date.now() - retentionMs;

    try {
      const stmt = this.db.prepare('DELETE FROM history WHERE timestamp < ?');
      const result = stmt.run(cutoffTimestamp);

      if (result.changes > 0) {
        logger.info({ deletedRows: result.changes, cutoffTimestamp }, 'History cleanup completed');
      }
    } catch (error) {
      logger.error({ err: error }, 'Failed to cleanup history');
    }
  }

  /**
   * Schedule periodic cleanup
   */
  scheduleCleanup() {
    // Run cleanup every hour
    setInterval(() => this.cleanup(), 60 * 60 * 1000);

    // Run initial cleanup after 1 minute
    setTimeout(() => this.cleanup(), 60 * 1000);
  }

  /**
   * Close database connection
   */
  close() {
    if (this.db) {
      this.db.close();
      logger.info('History database closed');
    }
  }
}

// Singleton instance
const historyStore = new HistoryStore();

export default historyStore;
