// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  WEBHOOK_SECRET: "local-development-secret-123",
  firebaseConfig: {
    apiKey: "AIzaSyCCX5UztweG67eQJBX3hMjddzrFnrQOHUs",
    authDomain: "ussb-c8d8f.firebaseapp.com",
    projectId: "ussb-c8d8f",
    storageBucket: "ussb-c8d8f.appspot.com",
    messagingSenderId: "688825740425",
    appId: "1:688825740425:web:ca365bc25406874030ea58"
  },
  apiUrl: "http://localhost:8080",

  timeouts : {
    maxApiRetries: 3,
    baseRetryDelay: 2000,
    requestTimeout: 15000
  }
}

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
