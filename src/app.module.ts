import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from './modules/auth/auth.module';
import { ProteinsModule } from './modules/proteins/proteins.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    AuthModule,
    ProteinsModule
  ],
})
export class AppModule { }
