import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { QueryBus } from '@nestjs/cqrs';
import { GetMovementsHistoryQuery } from './application/cqrs/inventory/queries/get-movements-history/get-movements-history.query';

async function test() {
  const app = await NestFactory.createApplicationContext(AppModule);
  console.log('App context initialized successfully');
  
  try {
    const queryBus = app.get(QueryBus);

    console.log('Dispatching GetMovementsHistoryQuery...');
    const result = await queryBus.execute(
      new GetMovementsHistoryQuery({ page: 1, limit: 20 }, undefined, 'eedc4a98-bb7e-4814-91d4-92506bc8139a')
    );
    console.log('Query result:', JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('Error during test execution:', error);
  } finally {
    await app.close();
  }
}

test();
