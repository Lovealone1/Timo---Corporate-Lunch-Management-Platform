import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from './modules/auth/auth.module';
import { ProteinsModule } from './modules/proteins/proteins.module';
import { SideDishesModule } from './modules/side-dishes/side-dishes.module';
import { SoupsModule } from './modules/soups/soups.module';
import { DrinksModule } from './modules/drinks/drinks.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    AuthModule,
    ProteinsModule,
    SideDishesModule,
    SoupsModule,
    DrinksModule,
  ],
})
export class AppModule { }
