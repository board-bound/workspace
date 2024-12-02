import { enableDevEnv, disableDevEnv, isDevEnvEnabled } from "./linker.js";

if (process.argv[2] === 'enable-dev') enableDevEnv();
else if (process.argv[2] === 'disable-dev') disableDevEnv();
else if (process.argv[2] === 'is-dev-enabled') console.log(isDevEnvEnabled());
else console.error('Invalid command.');
