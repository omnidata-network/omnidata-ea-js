# Chainlink Omnidata Composite Adapter

Stores the dApps data from on-chain to IPFS/Filecoin to make the data tamper-proof and verifiable. Also, the dApps can query those data directly on the UI via GraphQL.

Queries any kind of NFT-related data from Covalent across supported blockchains, e.g. the data of the NFT creator, the latest price, and the current owner etc.

> All numeric data will be multplied by 1e18

## Configuration

The adapter takes the following environment variables:

| Required? |           Name            |         Description         | Options |              Defaults to               |
| :-------: | :-----------------------: | :-------------------------: | :-----: | :------------------------------------: |
|    ✅     |    `COVALENT_API_KEY`     |    The Covalent API key     |         |                                        |
|           |        `IPFS_URL`         |        The IPFS URL         |         | `https://api.thegraph.com/ipfs/api/v0` |
|           |    `COVALENT_BASE_URL`    |    The Covalent base URL    |         |    `https://api.covalenthq.com/v1/`    |
|           |   `PINNING_SERVICE_URL`   |   The pinning service URL   |         |                                        |
|           | `PINNING_SERVICE_API_KEY` | The pinning service API key |         |                                        |

## Running

See the [Composite Adapter README](../README.md) for more information on how to get started.

Or you can try below command out, DON'T forget to replace `<IPFS_URI>` and `<IPFS_PORT>` to yours.

`docker run -d --name omnidata_ea -p 6080:8000 -e IPFS_URI=<IPFS_URI> -e IPFS_PORT=<IPFS_PORT> -e EA_PORT=8000 -it <YOUR_DOCKER_HUB>/omnidata-adapter:latest`

## Write Endpoint

Writes on-chain data from various supported chains to IPFS/Filecoin, so as a smart contract developer you won't see any `Staks too deep` or constraints by the events limitation to query data.

### Input Params

| Required? |             Name              |                 Description                  |       Options       | Defaults to |
| :-------: | :---------------------------: | :------------------------------------------: | :-----------------: | :---------: |
|    ✅     |            `data`             |      The data you want to save to IPFS       |                     |             |
|           | `destChain`, or `targetChain` | The destination chain to be interactive with | `0x1`, `ETH`, `USD` |             |

```
type = "directrequest"
schemaVersion = 1
name = "omnidata-ea"
maxTaskDuration = "0s"
contractAddress = "<ORACLE_OPERATOR_CONTRACT>"
minIncomingConfirmations = 0
observationSource = """
    decode_log   [type="ethabidecodelog"
                  abi="OracleRequest(bytes32 indexed specId, address requester, bytes32 requestId, uint256 payment, address callbackAddr, bytes4 callbackFunctionId, uint256 cancelExpiration, uint256 dataVersion, bytes data)"
                  data="$(jobRun.logData)"
                  topics="$(jobRun.logTopics)"]

    decode_cbor  [type="cborparse" data="$(decode_log.data)"]
    fetch        [type="bridge" name="omnidata-write" requestData="{\\"id\\": $(jobSpec.externalJobID), \\"data\\": {\\"data\\": $(decode_cbor)}}"]
    parse        [type="jsonparse" path="data,result" data="$(fetch)"]
    encode_data  [type="ethabiencode" abi="(bytes32 requestId, string cid)" data="{ \\"requestId\\": $(decode_log.requestId), \\"cid\\": $(parse.cid) }"]
    encode_tx    [type="ethabiencode"
                  abi="fulfillOracleRequest2(bytes32 requestId, uint256 payment, address callbackAddress, bytes4 callbackFunctionId, uint256 expiration, bytes calldata data)"
                  data="{\\"requestId\\": $(decode_log.requestId), \\"payment\\":   $(decode_log.payment), \\"callbackAddress\\": $(decode_log.callbackAddr), \\"callbackFunctionId\\": $(decode_log.callbackFunctionId), \\"expiration\\": $(decode_log.cancelExpiration), \\"data\\": $(encode_data)}"
                  ]
    submit_tx    [type="ethtx" to="<ORACLE_OPERATOR_CONTRACT>" data="$(encode_tx)"]

    decode_log -> decode_cbor -> fetch -> parse -> encode_data -> encode_tx -> submit_tx
"""
```

> NOTE: replace `<ORACLE_OPERATOR_CONTRACT>` with your oracle contract address.

### Sample Input

```json
{
  "id": "1",
  "data": {
    "data": {
      "key": "gm-hall"
    }
  }
}
```

### Sample Output

```json
{
  "jobRunID": "0958814163394e14afca5f5dba90eec5",
  "result": "0x0155171c279b3a5712e75806c397c13d9fb577a1a7a28a28b8e9643c423fa870",
  "statusCode": 200,
  "data": {
    "result": "0x0155171c279b3a5712e75806c397c13d9fb577a1a7a28a28b8e9643c423fa870",
    "cid": "bafkrohbhtm5foexhladmhf6bhwp3k55bu6riukfy5fsdyqr7vbya"
  }
}
```
