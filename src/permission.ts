import { rule, shield } from 'graphql-shield';

const hasScope = (key) =>
  rule()(async (_parent, _args, ctx) => {
    return ctx.scope.indexOf(key) > -1;
  });

const permissions = shield(
  {
    Query: {
      appConfig: hasScope('appconfig:read'),
    },
    AppConfig: {
      ios: hasScope('ios:read'),
    },
  },
  {
    debug: true,
  },
);

export default permissions;
