import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create all schemas
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS asset_management`);
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS incident_management`);
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS change_management`);
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS helpdesk`);
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS document_management`);
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS hub`);
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS noc_monitoring`);
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS hr_management`);
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS sim_management`);
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS policy_management`);
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS auth`);
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS audit`);

    // Create assets table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS asset_management.assets (
        id SERIAL PRIMARY KEY,
        asset_id VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        category VARCHAR(100),
        manufacturer VARCHAR(100),
        model VARCHAR(100),
        serial_number VARCHAR(100),
        status VARCHAR(50) NOT NULL,
        location VARCHAR(255),
        assigned_to INTEGER,
        purchase_date DATE,
        purchase_cost DECIMAL(10,2),
        warranty_expiry DATE,
        specifications JSONB,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create incidents table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS incident_management.incidents (
        id SERIAL PRIMARY KEY,
        incident_number VARCHAR(50) UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        priority VARCHAR(50) NOT NULL,
        severity VARCHAR(10) NOT NULL,
        status VARCHAR(50) NOT NULL,
        category VARCHAR(100) NOT NULL,
        subcategory VARCHAR(100),
        reported_by INTEGER NOT NULL,
        assigned_to INTEGER,
        assigned_group VARCHAR(100),
        resolution TEXT,
        root_cause TEXT,
        resolved_at TIMESTAMP,
        closed_at TIMESTAMP,
        attachments JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create tickets table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS helpdesk.tickets (
        id SERIAL PRIMARY KEY,
        ticket_number VARCHAR(50) UNIQUE NOT NULL,
        subject VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        priority VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL,
        category VARCHAR(100) NOT NULL,
        request_type VARCHAR(50) NOT NULL,
        requester_id INTEGER NOT NULL,
        assigned_to INTEGER,
        assigned_team VARCHAR(100),
        due_date TIMESTAMP,
        resolved_at TIMESTAMP,
        satisfaction DECIMAL(3,2),
        comments JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes
    await queryRunner.query(`CREATE INDEX idx_assets_status ON asset_management.assets(status)`);
    await queryRunner.query(`CREATE INDEX idx_assets_assigned ON asset_management.assets(assigned_to)`);
    await queryRunner.query(`CREATE INDEX idx_incidents_status ON incident_management.incidents(status)`);
    await queryRunner.query(`CREATE INDEX idx_incidents_priority ON incident_management.incidents(priority)`);
    await queryRunner.query(`CREATE INDEX idx_tickets_status ON helpdesk.tickets(status)`);
    await queryRunner.query(`CREATE INDEX idx_tickets_priority ON helpdesk.tickets(priority)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS asset_management.assets`);
    await queryRunner.query(`DROP TABLE IF EXISTS incident_management.incidents`);
    await queryRunner.query(`DROP TABLE IF EXISTS helpdesk.tickets`);

    // Drop schemas
    await queryRunner.query(`DROP SCHEMA IF EXISTS asset_management CASCADE`);
    await queryRunner.query(`DROP SCHEMA IF EXISTS incident_management CASCADE`);
    await queryRunner.query(`DROP SCHEMA IF EXISTS change_management CASCADE`);
    await queryRunner.query(`DROP SCHEMA IF EXISTS helpdesk CASCADE`);
    await queryRunner.query(`DROP SCHEMA IF EXISTS document_management CASCADE`);
    await queryRunner.query(`DROP SCHEMA IF EXISTS hub CASCADE`);
    await queryRunner.query(`DROP SCHEMA IF EXISTS noc_monitoring CASCADE`);
    await queryRunner.query(`DROP SCHEMA IF EXISTS hr_management CASCADE`);
    await queryRunner.query(`DROP SCHEMA IF EXISTS sim_management CASCADE`);
    await queryRunner.query(`DROP SCHEMA IF EXISTS policy_management CASCADE`);
  }
}
