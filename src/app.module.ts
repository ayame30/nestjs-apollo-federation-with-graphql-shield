/* eslint-disable @typescript-eslint/no-unused-vars */
import { Module, RequestMethod } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloGatewayDriver, ApolloGatewayDriverConfig } from '@nestjs/apollo';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { ApolloLoggingPlugin } from './apollo-logging.plugin';
import { RemoteGraphQLDataSource } from '@apollo/gateway';
import { readFileSync } from 'fs';
import { join } from 'path';
import { ApolloGraphqlShieldPlugin } from './apollo-logging.plugin copy';

const supergraphSdl = readFileSync(
  join(process.cwd(), './src/supergraph.graphql'),
).toString();

class AuthenticatedDataSource extends RemoteGraphQLDataSource {
  override willSendRequest({ request, context }) {
    for (const [headerKey, headerValue] of Object.entries(context.headers)) {
      request.http?.headers.set(headerKey, headerValue);
    }
  }
}

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot(),
    LoggerModule.forRoot({
      exclude: [{ method: RequestMethod.ALL, path: 'health-check' }],
    }),
    GraphQLModule.forRoot<ApolloGatewayDriverConfig>({
      driver: ApolloGatewayDriver,
      server: {
        context: ({ req }) => {
          return { headers: req.headers };
        },
      },
      gateway: {
        supergraphSdl,
        buildService({ url }) {
          return new AuthenticatedDataSource({ url });
        },
      },
    }),
  ],
  providers: [ApolloLoggingPlugin, ApolloGraphqlShieldPlugin],
})
export class AppModule {}
