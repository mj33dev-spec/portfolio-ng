export const environment = {
  service: { key: 'portfolio', kr: 'MJ  포트폴리오', en: 'mj' },

  production: false,
  env: 'dev',
  serverUrl: 'http://localhost:3010',
  socketUrl: 'https://pms-api.alicerabbit.space:3010',
  storageUrl: 'https://alice-pms-storage.s3.ap-northeast-2.amazonaws.com',

  commonServerURL: 'http://localhost:3010/api/portfolio',
  commonServerSocketURL: 'http://localhost:3010/api/portfolio',

  // 사용자 정보 암호화 키
  encryptionKey: 'portfolio-user-info-encryption-key',

  firebaseConfig: {
    apiKey: "AIzaSyDeriTD22ZIoWEeW1pnLv1yojBdZKm1vgE",
    authDomain: "mj-portfolio-2b0e7.firebaseapp.com",
    projectId: "mj-portfolio-2b0e7",
    storageBucket: "mj-portfolio-2b0e7.firebasestorage.app",
    messagingSenderId: "975706213125",
    appId: "1:975706213125:web:ed793b964aae4f3bac856c",
    measurementId: "G-BEJMBLHMPD"
  }
};