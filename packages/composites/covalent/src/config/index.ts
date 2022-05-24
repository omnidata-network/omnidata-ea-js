import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'
import 'dotenv/config'

export const NAME = 'COVALENT'
export const DEFAULT_COVALENT_BASE_URL = 'https://api.covalenthq.com'

export const makeConfig = (prefix?: string): Config => {
  const config: Config = Requester.getDefaultConfig(prefix)
  config.api = {
    baseURL: config.api.baseURL || util.getEnv('COVALENT_BASE_URL') || DEFAULT_COVALENT_BASE_URL,
    auth: {
      username: util.getEnv('COVALENT_API_KEY') || '',
      password: '',
    },
  }
  config.verbose = util.parseBool(util.getEnv('VERBOSE')) || false
  return config
}
