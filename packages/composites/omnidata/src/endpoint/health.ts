import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig } from '@chainlink/types'
import { Config } from '../config'

export const supportedEndpoints = ['health']

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request)

  const jobRunID = validator.validated.id

  return Requester.success(jobRunID, { data: { result: 'ok' } }, config.verbose)
}
