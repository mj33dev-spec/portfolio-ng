export const environment = {
    service : { key : 'keepr', kr : '키퍼', en : 'keepr' },
  
    production: false,
    env : 'dev',
    serverUrl: 'http://localhost:3010',
    socketUrl : 'https://pms-api.alicerabbit.space:3010',
    storageUrl : 'https://alice-pms-storage.s3.ap-northeast-2.amazonaws.com',  
  
    commonServerURL: 'http://localhost:3010/api/keepr',
    commonServerSocketURL : 'http://localhost:3010/api/keepr',
    
    // 사용자 정보 암호화 키
    encryptionKey: 'keepr-user-info-encryption-key'
    
  };