import { ApolloServerPlugin, GraphQLRequestListener } from '@apollo/server';
import { Plugin } from '@nestjs/apollo';
import { Logger } from '@nestjs/common';

@Plugin()
export class ApolloLoggingPlugin implements ApolloServerPlugin {
  private readonly logger = new Logger(ApolloLoggingPlugin.name, {
    timestamp: true,
  });
  async requestDidStart({
    contextValue,
  }): Promise<GraphQLRequestListener<any>> {
    this.logger.log({ body: contextValue.req.body });
    const logger = this.logger;
    return {
      async didEncounterErrors({ request, errors }) {
        logger.error({ body: request.http.body, errors });
      },
    };
  }
}
