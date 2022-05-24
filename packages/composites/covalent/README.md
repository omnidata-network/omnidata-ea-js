# Chainlink Covalent Composite Adapter

This is the Covalent adapter that provides the ability to let developers and analytics to get on-chain or off-chain data from Covalent easily.

## How to use this in smart contracts

For the detailed info, please refer to the repo of [covalent-ea-contract](https://github.com/omnidata-network/covalent-ea-contract).

## Job Spec

```javascript

type = "directrequest"
schemaVersion = 1
name = "Covalent"
contractAddress = "<ORACLE_CONTRACT>"
maxTaskDuration = "0s"
observationSource = """
    decode_log   [type="ethabidecodelog"
                  abi="OracleRequest(bytes32 indexed specId, address requester, bytes32 requestId, uint256 payment, address callbackAddr, bytes4 callbackFunctionId, uint256 cancelExpiration, uint256 dataVersion, bytes data)"
                  data="$(jobRun.logData)"
                  topics="$(jobRun.logTopics)"]

    decode_cbor  [type="cborparse" data="$(decode_log.data)"]
    fetch        [type="bridge" name="ezy-bridge" requestData="{\\"id\\": $(jobSpec.externalJobID), \\"data\\": {\\"data\\": $(decode_cbor)}}"]
    parse        [type="jsonparse" path="data,result" data="$(fetch)"]
    encode_large [type="ethabiencode" abi="(bytes32 requestId, bytes _data)" data="{\\"requestId\\": $(decode_log.requestId), \\"_data\\": $(parse)}"]
    encode_tx    [type="ethabiencode"
                  abi="fulfillOracleRequest2(bytes32 requestId, uint256 payment, address callbackAddress, bytes4 callbackFunctionId, uint256 expiration, bytes calldata data)"
                  data="{\\"requestId\\": $(decode_log.requestId), \\"payment\\":   $(decode_log.payment), \\"callbackAddress\\": $(decode_log.callbackAddr), \\"callbackFunctionId\\": $(decode_log.callbackFunctionId), \\"expiration\\": $(decode_log.cancelExpiration), \\"data\\": $(encode_large)}"
                  ]
    submit_tx    [type="ethtx" to="<ORACLE_CONTRACT>" data="$(encode_tx)"]

    decode_log -> decode_cbor -> fetch -> parse -> encode_large -> encode_tx -> submit_tx
"""
```

> NOTE: replace `<ORACLE_CONTRACT>` with your oracle `Operator.sol` contract address.

## Configuration

The adapter takes the following environment variables:

| Required? |        Name         |      Description      | Options |         Defaults to          |
| :-------: | :-----------------: | :-------------------: | :-----: | :--------------------------: |
|    ✅     | `COVALENT_API_KEY`  |      The API KEY      |         |                              |
|           | `COVALENT_BASE_URL` | The Covalent base URL |         | `https://api.covalenthq.com` |

## Build

On Mac M1 chips machines:

### Build OS/ARCH to linux/amd64 to make the image be runnable in Ubuntu OS

#### Option 1:

Add `--platform=linux/amd64` to `From` images in the Dockerfile.

Then run `docker-compose -f docker-compose.generated.yaml build covalent-adapter`

#### Option 2:

`docker buildx create --use`

`docker buildx bake -f docker-compose.generated.yaml covalent-adapter --push --set covalent-adapter.platform=linux/amd64,linux/arm64`

## Running

See the [Composite Adapter README](../README.md) for more information on how to get started.

Or you can try below command out, DON'T forget to replace the value of `<COVALENT_API_KEY>` to yours.

`docker run -d --name covalent_ea -p 6080:8000 -e COVALENT_API_KEY=<COVALENT_API_KEY> -e EA_PORT=8000 -it <YOUR_DOCKER_HUB_ACCOUNT>/covalent-adapter:latest`

### Sample Input

```json
{
  "id": "1",
  "data": {
    "url": "v1/pricing/tickers/?tickers=ETH",
    "types": "uint256",
    "path": "data,items,0,quote_rate"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "result": "0x0000000000000000000000000000000000000000000000697feaaf3c3577c000",
  "debug": {
    "staleness": 0,
    "performance": 0.529316792,
    "providerCost": 1
  },
  "statusCode": 200,
  "data": {
    "result": "0x0000000000000000000000000000000000000000000000697feaaf3c3577c000"
  }
}
```
