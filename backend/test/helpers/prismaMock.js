const methodDefault = (method) => {
  if (method === 'findFirst' || method === 'findUnique') return null;
  if (method === 'count' || method === 'aggregate') return 0;
  if (method === 'findMany' || method === 'updateMany' || method === 'deleteMany' || method === 'createMany' || method === 'groupBy') return [];
  return {};
};

const makeModel = () =>
  new Proxy({}, {
    get: (_target, method) => {
      if (typeof method === 'symbol') return undefined;
      if (method === 'then') return undefined;
      return () => Promise.resolve(methodDefault(method));
    },
  });

const makeRoot = () =>
  new Proxy({}, {
    get: (_target, prop) => {
      if (typeof prop === 'symbol') return undefined;
      if (prop === 'then' || prop === '__esModule') return undefined;
      if (prop === '$transaction') {
        return (arg) => {
          if (typeof arg === 'function') return Promise.resolve(arg(makeRoot()));
          return Promise.resolve([]);
        };
      }
      return makeModel();
    },
  });

const createPrismaMock = () => makeRoot();

module.exports = { createPrismaMock };
