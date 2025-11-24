import { HealthController } from './modules/health/health.controller';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { BullModule } from '@nestjs/bull';

// Controllers
import { AppController } from './app.controller';

// Import all modules
import { AuthModule } from './modules/auth/auth.module';
import { AssetManagementModule } from './modules/asset-management/asset-management.module';
import { IncidentManagementModule } from './modules/incident-management/incident-management.module';
import { ChangeManagementModule } from './modules/change-management/change-management.module';
import { HelpdeskModule } from './modules/helpdesk/helpdesk.module';
import { DocumentManagementModule } from './modules/document-management/document-management.module';
import { HubModule } from './modules/hub/hub.module';
import { NocMonitoringModule } from './modules/noc-monitoring/noc-monitoring.module';
import { HrManagementModule } from './modules/hr-management/hr-management.module';
import { SimManagementModule } from './modules/sim-management/sim-management.module';
import { PolicyManagementModule } from './modules/policy-management/policy-management.module';
import { CommonModule } from './common/common.module';

import { getDatabaseConfig } from './config/database.config';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getDatabaseConfig,
    }),

    // Rate Limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ([{
        ttl: parseInt(config.get('RATE_LIMIT_TTL', '60')) * 1000,
        limit: parseInt(config.get('RATE_LIMIT_LIMIT', '100')),
      }]),
    }),

    // Cache
    CacheModule.register({
      isGlobal: true,
      ttl: 300,
    }),

    // Bull Queue
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        redis: {
          host: config.get('REDIS_HOST', 'localhost'),
          port: parseInt(config.get('REDIS_PORT', '6379')),
          password: config.get('REDIS_PASSWORD'),
        },
      }),
    }),

    // All Application Modules
    AuthModule,
    AssetManagementModule,
    IncidentManagementModule,
    ChangeManagementModule,
    HelpdeskModule,
    DocumentManagementModule,
    HubModule,
    NocMonitoringModule,
    HrManagementModule,
    SimManagementModule,
    PolicyManagementModule,
    CommonModule,
  ],
  controllers: [HealthController, AppController],
})
export class AppModule {}
