import { Requester, Validator } from '@chainlink/ea-bootstrap'
import {
  AdapterContext,
  AdapterRequest,
  AdapterResponse,
  Config,
  Execute,
  ExecuteWithConfig,
  ExecuteFactory,
  InputParameters,
} from '@chainlink/types'
import { utils } from 'ethers'
import { makeConfig } from './config'

export const inputParameters: InputParameters = {
  url: {
    aliases: ['uri'],
    required: true,
    description:
      'The Covalent URL path, e.g. "v1/1/block_v2/latest/" to get the latest block height of Ethereum Mainnet.',
  },
  types: {
    required: true,
    description: 'the data decode types e.g. "(uint256)"',
  },
  path: {
    required: true,
    description:
      'the path to find the desired data in the API response, uses a JSONPath expression with comma(,) delimited string for nested objects. For example: "RAW,ETH,USD,VOLUME24HOUR"',
  },
}

interface CovalentResponse {
  data: {
    result: any
  }
}

export const execute: ExecuteWithConfig<Config> = async (
  request: AdapterRequest,
  _: any,
  config: any,
): Promise<AdapterResponse> => {
  const validator = new Validator(request, inputParameters)

  if (validator.error) throw validator.error

  const jobRunID = validator.validated.jobRunID
  let url = validator.validated.data.url
  url = url.startsWith('/') ? url : `/${url}`
  url = url.includes('?') ? url : `${url}/`
  const types = validator.validated.data.types
  const path = validator.validated.data.path
  console.log('validated data:', url, types, path)

  const options = { ...config.api, url }
  const ret = await Requester.request(options)

  const data: any = await Requester.getResult(ret.data, path.split(','))
  let response: CovalentResponse = { data: { result: data } }
  if (types && types.trim() !== '') {
    const abiCoder = new utils.AbiCoder()
    response = {
      data: {
        result: abiCoder.encode(
          types.split(','),
          typeof data === 'object'
            ? extractValues(data)
            : typeof data === 'number'
            ? [utils.parseEther(`${data}`).toString()]
            : [`${data}`],
        ),
      },
    }
  }

  return Requester.success(jobRunID, response, config.verbose)
}

export const makeExecute: ExecuteFactory<Config> = (config?: Config): Execute => {
  return async (request: AdapterRequest, context: AdapterContext) =>
    execute(request, context, config || makeConfig())
}

const extractValues = (data: any) => {
  if (!Array.isArray(data)) {
    const res = Object.values(data).map((item: any) =>
      item === null || item === undefined
        ? ''
        : typeof item === 'number'
        ? utils.parseEther(`${item}`)
        : item,
    )
    return res
  }

  return data
}
