import { Validator } from '@chainlink/ea-bootstrap'
import type { Config, ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'
import { makeOptions } from '../config'
import { Indexer, runBalanceAdapter } from '../utils/balance'
import { runProtocolAdapter } from '../utils/protocol'
import { runReduceAdapter } from '../utils/reduce'

export const supportedEndpoints = ['reserves']

const paramOptions = makeOptions()

export type TInputParameters = {
  protocol: string
  indexer: string
  confirmations?: number
  addresses?: string[]
}

const inputParameters: InputParameters<TInputParameters> = {
  protocol: {
    required: true,
    type: 'string',
    description: 'The protocol external adapter to use',
    options: paramOptions.protocol,
  },
  indexer: {
    required: true,
    type: 'string',
    description: 'The indexer external adapter to use',
    options: paramOptions.indexer,
  },
  confirmations: {
    required: false,
    type: 'number',
    description:
      'The number of confirmations required for a transaction to be counted when getting an address balance',
    default: 6,
  },
  addresses: {
    required: false,
    type: 'array',
    description: 'An array of addresses to get the balance from, when `protocol` is set to `list`',
  },
}

export const execute: ExecuteWithConfig<Config> = async (input, context, config) => {
  const validator = new Validator<TInputParameters>(input, inputParameters, paramOptions)

  const jobRunID = validator.validated.id
  const protocol = validator.validated.data.protocol.toUpperCase()
  const indexer: Indexer = validator.validated.data.indexer.toUpperCase()
  // TODO: defaults fill as non-nullable
  const confirmations = validator.validated.data.confirmations as number

  // TODO: type input
  const protocolOutput = await runProtocolAdapter(
    jobRunID,
    context,
    protocol,
    input.data as any,
    config,
  )
  const balanceOutput = await runBalanceAdapter(
    indexer,
    context,
    confirmations,
    config,
    protocolOutput,
  )
  const reduceOutput = await runReduceAdapter(indexer, context, balanceOutput)
  return reduceOutput
}
