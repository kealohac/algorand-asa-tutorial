import algosdk, { signTransaction } from 'algosdk'
import config from './config/index'
import AlgorandService, {  AlgorandAccount, AlograndPendingTransaction } from './utils/alogorand'



const run = async () => {

    const recoveredAccount1 = AlgorandService.retrieveAccountAddress(config.mnemonic.account1)
    const recoveredAccount2 = AlgorandService.retrieveAccountAddress(config.mnemonic.account2)
    const recoveredAccount3 = AlgorandService.retrieveAccountAddress(config.mnemonic.account3)

    const algodClient = new algosdk.Algodv2(config.algorand.token, config.algorand.server, config.algorand.port);
    const account1Address = recoveredAccount1[AlgorandAccount.ADDRESS];
    const account2Address = recoveredAccount2[AlgorandAccount.ADDRESS];

    const createdAsset = await AlgorandService.createAsset(algodClient, {
        customFee: {
            fee: 1000,
            flatFee: true
        },
        note: algosdk.encodeObj({ hello: "showing prefix"}),
        address: account1Address,
        defaultFrozen: false,
        decimals: 0,
        totalIssuance: 1000,
        unitName: "LATINUM",
        assetName: "latinum",
        assetURL: 'http://someurl',
        assetMetadataHash: '16efaa3924a6fd9d3a4824799a4ac65d',
        managerAddress: account2Address,
        reserveAddress: account2Address,
        freezeAddress: account2Address,
        clawbackAddress: account2Address
    });

    const rawSignedTransaction = AlgorandService.signTransaction(recoveredAccount1, createdAsset)

    const transaction = await AlgorandService.sendRawSignedTransaction(algodClient, rawSignedTransaction)

    // let assetId = null

    await AlgorandService.waitForConfirmation(algodClient, transaction.txId)

    const pendingTransaction = await AlgorandService.getPendingAssetInfo(algodClient, transaction)

    const assetId = pendingTransaction[AlograndPendingTransaction.ASSET_INDEX]

    await AlgorandService.printCreatedAsset(algodClient, account1Address, assetId)

    await AlgorandService.printAssetHolding(algodClient, account1Address, assetId)

}


run()