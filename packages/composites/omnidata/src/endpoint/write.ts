import { Requester, Validator, Logger } from '@chainlink/ea-bootstrap'
import {
  AdapterRequest,
  AdapterResponse,
  Config,
  ExecuteWithConfig,
  InputParameters,
} from '@chainlink/types'
import { create, IPFSHTTPClient } from 'ipfs-http-client'
import axios from 'axios'

export const supportedEndpoints = ['write']

export const inputParameters: InputParameters = {
  data: {
    required: true,
    description: 'The data to write',
  },
  destChain: {
    aliases: ['targetChain'],
    description: 'The target chain id',
  },
  contractAddr: {
    aliases: ['targetAddress', 'contractAddress'],
    description: 'The contract address will be interacted',
  },
  funcSig: {
    aliases: ['function'],
    description: 'Function to be called',
    required: false,
  },
  cidVersion: {
    required: false,
    description: 'The CID version to be returned',
    type: 'number',
  },
}

export const execute: ExecuteWithConfig<Config> = async (
  request: AdapterRequest,
  _: any,
  config: any,
): Promise<AdapterResponse> => {
  const validator = new Validator(request, inputParameters)

  if (validator.error) throw validator.error

  const jobRunID = validator.validated.jobRunID
  const data = validator.validated.data.data
  const cidVersion = validator.validated.data.cidVersion

  const projectId = config.projectId
  const projectSecret = config.projectSecret
  if (config.ipfsURL.includes('infura') && (!projectId || !projectSecret)) {
    throw Error('You MUST config the infura project id and secret')
  }

  const client = create({ url: config.ipfsURL })
  const options = { cidVersion }

  const cid = await putFile(serialize({ jobRunID, ...data, ...options }), client, options)
  const response = {
    data: {
      result: { cid },
    },
  }

  // pin the cid to web3.storage, estuary or other pinning services
  if (config.pinningServiceUrl) {
    axios
      .post(
        config.pinningServiceUrl,
        { cid },
        {
          headers: {
            Accept: '*/*',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.pinningServiceApiKey}`,
          },
        },
      )
      .catch((error: any) =>
        Logger.error(
          `Failed to pin the cid ${cid} to web3.storage, error ${error.messge || error}`,
        ),
      )
  }

  return Requester.success(jobRunID, response, config.verbose)
}

const putFile = async (
  data: string | Uint8Array,
  client: IPFSHTTPClient,
  options: Record<string, unknown>,
) => {
  const { cid } = await client.add(data, options)
  return cid.toString()
}

const serialize = (data: string | object): string | Uint8Array => {
  if (typeof data === 'string') return data

  return Buffer.from(JSON.stringify(data))
}
