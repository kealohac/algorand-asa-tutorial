import devConfig from './dev'

export interface AppConfig {
    algorand: {
        token: string
        server: string
        port: number
    }
    mnemonic: {
        account1: string
        account2: string
        account3: string
    }
}

const envType = process.env.NODE_ENV || 'development'

let env: AppConfig
switch (envType) {
    case 'development':
        env = devConfig
        break
    default:
        throw Error(`Invalid envType in NODE_ENV: ${envType}`)
}

export default env
