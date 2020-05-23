export const mongodb = {
  uri: 'mongodb://localhost:27017/doorpi',
  testUri: 'mongodb://localhost:27017/doorpi_test'
};

export const jwtOptions = {
  secret: 'aaa-secret',
  signOptions: {
    expiresIn: '1h',
    issuer: 'DoorPi'
  },
  verifyOptions: {
    issuer: 'DoorPi',
    maxAge: '1h'
  }
};

export const serverSettings = {
  id: '678affea-200c-4a9c-b428-487bd6fe6559',
  name: 'Franselaan'
};
