import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config as BaseConfig } from '@chainlink/types'
import 'dotenv/config'
import { CustomConfig } from '../index.d'

export const DEFAULT_ENDPOINT = 'write'
export const NAME = 'OMNIDATA'
export const DEFAULT_COVALENT_BASE_URL = 'https://api.covalenthq.com/v1'
export const DEFAULT_IPFS_URL = 'https://api.thegraph.com/ipfs/api/v0'

export type Config = BaseConfig & CustomConfig

export const makeConfig = (prefix?: string): Config => {
  const config: CustomConfig = Requester.getDefaultConfig(prefix, true)
  config.ipfsURL = util.getEnv('IPFS_URL') || DEFAULT_IPFS_URL
  config.projectId = util.getEnv('INFURA_PROJECT_ID') || ''
  config.projectSecret = util.getEnv('INFURA_PROJECT_SECRET') || ''
  config.verbose = util.parseBool(util.getEnv('VERBOSE')) || true
  config.pinningServiceUrl = util.getEnv('PINNING_SERVICE_URL') || ''
  config.pinningServiceApiKey = util.getEnv('PINNING_SERVICE_API_KEY') || ''
  config.covalentApiKey = util.getEnv('COVALENT_API_KEY') || ''
  config.defaultEndpoint = DEFAULT_ENDPOINT
  config.api = {
    baseURL: config.api.baseURL || util.getEnv('COVALENT_BASE_URL') || DEFAULT_COVALENT_BASE_URL,
    auth: {
      username: util.getEnv('COVALENT_API_KEY'),
      password: '',
    },
  }
  return {
    ...Requester.getDefaultConfig(prefix),
    ...config,
  }
}
