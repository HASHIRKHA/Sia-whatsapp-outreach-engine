import { Module } from '@nestjs/common';
import { AntibanModule } from '../antiban/antiban.module';
import { ContactsModule } from '../contacts/contacts.module';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { SessionsGateway } from './sessions.gateway';

@Module({
  imports: [AntibanModule, ContactsModule],
  controllers: [SessionsController],
  providers: [SessionsService, SessionsGateway],
  exports: [SessionsService, SessionsGateway],
})
export class SessionsModule {}
