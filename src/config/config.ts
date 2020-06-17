import { homedir } from 'os';

export const serverSettings = {
  id: '3801af0b-d385-4273-9a78-a4104d90f82b',
  name: 'Franselaan'
};

export const databasePath = {
  regular: `${homedir()}/Desktop/db.sqlite`,
  test: `${homedir()}/Desktop/db-test.sqlite`
};

// Generate certificates: openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout doorpi.key -out doorpi.pem -sha256
export const certificatePath = {
  key: `${homedir()}/Desktop/doorpi.key`,
  cert: `${homedir()}/Desktop/doorpi.pem`
};

export const logPath = `${homedir()}/Desktop/info.log`;

// 678affea-200c-4a9c-b428-487bd6fe6559 (DEV)
// d4b940f4-3602-42d9-a336-57309f91aba5
// 3801af0b-d385-4273-9a78-a4104d90f82b
// f36db045-7985-448e-9a37-0d7abc0fa811
