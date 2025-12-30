import { Module } from '@nestjs/common';
import { SystemConfigService } from './system-config.service.js';
import { SystemConfigController } from './system-config.controller.js';
import { UsersModule } from '../users/users.module.js';

@Module({
    imports: [UsersModule],
    providers: [SystemConfigService],
    controllers: [SystemConfigController],
    exports: [SystemConfigService],
})
export class SystemConfigModule { }
