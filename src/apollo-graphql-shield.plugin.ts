import {
  ApolloServerPlugin,
  GraphQLRequestListener,
  GraphQLServerListener,
} from '@apollo/server';
import { addMocksToSchema } from '@graphql-tools/mock';
import { Plugin } from '@nestjs/apollo';
import { execute } from 'graphql';
import { applyMiddleware } from 'graphql-middleware';
import { GraphQLSchemaWithFragmentReplacements } from 'graphql-middleware/dist/types';
import permissions from './permission';

@Plugin()
export class ApolloGraphqlShieldPlugin implements ApolloServerPlugin {
  shieldedSchema: GraphQLSchemaWithFragmentReplacements;
  async serverWillStart(): Promise<GraphQLServerListener | void> {
    return {
      schemaDidLoadOrUpdate: ({ apiSchema }) => {
        this.shieldedSchema = applyMiddleware(
          addMocksToSchema({
            schema: apiSchema,
            mocks: {
              Timestamp: () => 0, // Custom Scalar
            },
          }),
          permissions,
        );
      },
    };
  }

  async requestDidStart(): Promise<GraphQLRequestListener<{
    scope: string[];
    headers: Map<string, string>;
  }> | void> {
    return {
      responseForOperation: async ({
        document,
        contextValue,
        operationName,
      }) => {
        contextValue.scope = (contextValue?.headers['x-jwt-scope'] || '').split(
          ' ',
        );

        const singleResult = await execute({
          schema: this.shieldedSchema,
          document,
          contextValue,
          operationName,
        });

        if ((singleResult?.errors || []).length === 0) {
          return undefined;
        }

        return {
          body: { kind: 'single', singleResult },
          http: {
            status: undefined,
            headers: undefined,
          },
        };
      },
    };
  }
}
