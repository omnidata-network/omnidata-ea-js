import { Requester, Validator, AdapterError } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { ethers } from 'ethers'
import { Config } from '../config'

export const supportedEndpoints = ['collection', 'nft']

export const inputParameters: InputParameters = {
  chainId: {
    aliases: ['chain'],
    type: 'string' || 'number',
    required: true,
    description: 'The chainId',
  },
  dataSource: {
    aliases: ['source'],
    type: 'string',
    required: true,
    description: 'The data fetch from',
    default: 'CQT',
  },
  collection: {
    aliases: ['contract'],
    type: 'string',
    required: true,
    description: 'The NFT collection contract address',
  },
  tokenId: {
    aliases: ['assetId'],
    type: 'string' || 'number',
    description: 'The token ID',
  },
}

interface NFT {
  tokenId: string
  originalOwner: string
  owner: string
  ownerAddress: string
  tokenPriceWei?: string
  tokenQuoteRateEth?: string
}

interface Item {
  contractName: string
  contractAdress: string
  nftData: NFT[]
}

export interface NFTResponseSchema {
  items: Item[]
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const data = validator.validated.data
  switch (data?.dataSource) {
    case 'CQT':
    case 'cqt':
      break
    default:
      throw new AdapterError({
        jobRunID,
        message: `Data source ${data.dataSource} not supported.`,
        statusCode: 400,
      })
  }

  try {
    const endpoint = request.data?.endpoint

    let response
    switch (endpoint) {
      case 'collection':
        response = await getCollectionInfo(data, config)
        break
      case 'nft':
        const nftInfo = await getNFTInfo(data, config)
        const tokenPrice = 0
        const ownerAddress = nftInfo.data.data.items[0].nft_data[0].owner_address
        const abiCoder = new ethers.utils.AbiCoder()
        response = {
          data: {
            result: abiCoder.encode(
              ['uint256', 'address', 'uint256', 'uint256', 'address'],
              [`${data.chainId}`, data.collection, `${data.tokenId}`, tokenPrice, ownerAddress],
            ),
          },
        }
        break
      default:
        throw new AdapterError({
          jobRunID,
          message: `Endpoint ${endpoint} not supported.`,
          statusCode: 400,
        })
    }

    return Requester.success(jobRunID, response, config.verbose)
  } catch (err: any) {
    console.log('error:', err)
    throw Requester.errored(jobRunID, err?.cause?.response?.statusText || err?.message || err)
  }
}

const getCollectionInfo = async (data: any, config: any) => {
  console.log('Collection Info')
  const chainId = data.chainId
  const collection = data.collection
  const url = `/${chainId}/tokens/${collection}/nft_metadata/`
  const options = { ...config.api, url }

  return Requester.request(options)
}

const getNFTInfo = async (data: any, config: any) => {
  console.log('NFT Info')
  const chainId = data.chainId
  const collection = data.collection
  const tokenId = data.tokenId
  const url = `/${chainId}/tokens/${collection}/nft_metadata/${tokenId}/`
  const options = { ...config.api, url }

  return Requester.request(options)
}
