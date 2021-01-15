import { Requester, Validator } from '@chainlink/external-adapter'
import { Config, ExecuteWithConfig, ExecuteFactory } from '@chainlink/types'
import { makeConfig, DEFAULT_ENDPOINT } from './config'
import { util } from '@chainlink/ea-bootstrap'

const customParams = {
  blockchain: ['blockchain', 'coin'],
  endpoint: false,
}

const endpointToApiFunctionName: { [key: string]: string } = {
  difficulty: 'getdifficulty',
  height: 'getblockcount',
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  Requester.logConfig(config)

  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || DEFAULT_ENDPOINT
  const blockchain = validator.validated.data.blockchain.toLowerCase()

  const key = util.getRandomRequiredEnv('API_KEY')
  const apiFunctionName = endpointToApiFunctionName[endpoint]
  const params = { key, q: apiFunctionName }

  const reqConfig = {
    ...config.api,
    params,
    baseURL: `https://${blockchain}.cryptoid.info/${blockchain}/api.dws`,
  }
  const response = await Requester.request(reqConfig)
  const result = response.data

  return Requester.success(jobRunID, {
    data: { result },
    result,
    status: 200,
  })
}

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request) => execute(request, config || makeConfig())
}
