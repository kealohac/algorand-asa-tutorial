import algosdk, { Account, Algodv2, Transaction } from "algosdk";

export enum AlgorandAccount {
  ADDRESS = "addr",
  SECRET_KEY = "sk",
}

export enum AlgorandStatus {
  LAST_ROUND = "last-round",
  CONFIRMED_ROUND = "confirmed-round",
}

export enum AlgorandAccountInfo {
  CREATED_ASSETS = "created-assets",
  ASSET_HOLDINGS = "assets",
}

export enum AlgorandAssetHolding {
  ASSET_INDEX = "asset-id",
}

export enum AlograndPendingTransaction {
  ASSET_INDEX = "asset-index",
}

export enum AlgorandCreatedAsset {
  INDEX = "index",
  PARAMS = "params",
}
const generateAccount = (): Account => {
  const account = algosdk.generateAccount();
  console.log("Account Address: ", account[AlgorandAccount.ADDRESS]);
  return account;
};

const retrievePrivateKeyMnemonic = (account: Account) => {
  const mnemonic = algosdk.secretKeyToMnemonic(
    account[AlgorandAccount.SECRET_KEY]
  );
  console.log("Account Mnemonic", mnemonic);
  return mnemonic;
};

const retrieveAccountAddress = (mnemonic: string) => {
  const address = algosdk.mnemonicToSecretKey(mnemonic);
  console.log("Account address: ", address);
  return address;
};

// Function used to wait for a tx confirmation
const waitForConfirmation = async (algodClient: Algodv2, txId: string) => {
  const status = await algodClient.status().do();
  let lastRound = status[AlgorandStatus.LAST_ROUND] as number;
  while (true) {
    const pendingInfo = await algodClient
      .pendingTransactionInformation(txId)
      .do();
    if (
      pendingInfo[AlgorandStatus.CONFIRMED_ROUND] !== null &&
      pendingInfo[AlgorandStatus.CONFIRMED_ROUND] > 0
    ) {
      //Got the completed Transaction
      console.log(
        `Transaction ${txId} confirmed in round ${
          pendingInfo[AlgorandStatus.CONFIRMED_ROUND]
        }`
      );
      break;
    }
    lastRound++;
    await algodClient.statusAfterBlock(lastRound).do();
  }
};

// Function used to print created asset for account and assetid
const printCreatedAsset = async (
  algodClient: Algodv2,
  accountAddress: string,
  assetId: string
) => {
  const accountInfo = await algodClient.accountInformation(accountAddress).do();
  const createdAssets = accountInfo[AlgorandAccountInfo.CREATED_ASSETS];

  const foundAsset = createdAssets.find(
    (asset) => asset[AlgorandCreatedAsset.INDEX] === assetId
  );

  if (foundAsset) {
    console.log("Asset Index: ", foundAsset[AlgorandCreatedAsset.INDEX]);
    console.log(
      "Params: ",
      JSON.stringify(foundAsset[AlgorandCreatedAsset.PARAMS], null, 2)
    );
    return;
  }

  console.log(`No created asset found for ${assetId}`);

  // note: if you have an indexer instance available it is easier to just use this
  //     let accountInfo = await indexerClient.searchAccounts()
  //    .assetID(assetIndex).do();
  // and in the loop below use this to extract the asset for a particular account
  // accountInfo['accounts'][idx][account]);
  // for (let idx = 0; idx < accountInfo['created-assets'].length; idx++) {
  //     const scrutinizedAsset = accountInfo['created-assets'][idx];

  //     if (scrutinizedAsset['index'] == assetId) {
  //         console.log("AssetID = " + scrutinizedAsset['index']);
  //         let myParams = JSON.stringify(scrutinizedAsset['params'], undefined, 2);
  //         console.log("parms = " + myParams);
  //         break;
  //     }
  // }
};

// Function used to print asset holding for account and assetid
const printAssetHolding = async (
  algodClient: Algodv2,
  accountAddress: string,
  assetId: string
) => {
  const accountInfo = await algodClient.accountInformation(accountAddress).do();
  const assetHoldings = accountInfo[AlgorandAccountInfo.ASSET_HOLDINGS];

  const foundAsset = assetHoldings.find(
    (asset) => asset[AlgorandAssetHolding.ASSET_INDEX] === assetId
  );

  if (foundAsset) {
    console.log("Asset Holding Info: ", JSON.stringify(foundAsset, null, 2));
    return;
  }

  console.log(`No asset holding found for ${assetId}`);

  // note: if you have an indexer instance available it is easier to just use this
  //     let accountInfo = await indexerClient.searchAccounts()
  //    .assetID(assetIndex).do();
  // and in the loop below use this to extract the asset for a particular account
  // accountInfo['accounts'][idx][account]);
  // for (let idx = 0; idx < accountInfo['assets'].length; idx++) {
  //     let scrutinizedAsset = accountInfo['assets'][idx];
  //     if (scrutinizedAsset['asset-id'] == assetId) {
  //         let myassetholding = JSON.stringify(scrutinizedAsset, undefined, 2);
  //         console.log("assetholdinginfo = " + myassetholding);
  //         break;
  //     }
  // }
};

export interface AlgorandCreateAssetOptions {
  customFee: {
    fee?: number;
    flatFee?: boolean;
  };
  fromAddress: string;
  note: Uint8Array;
  totalIssuance: number;
  decimals: number;
  defaultFrozen: boolean;
  managerAddress: string;
  reserveAddress: string;
  freezeAddress: string;
  clawbackAddress: string;
  unitName: string;
  assetName: string;
  assetURL: string;
  assetMetadataHash: string;
}
const createAsset = async (
  algodClient: Algodv2,
  options: AlgorandCreateAssetOptions
) => {
  const {
    customFee: { fee, flatFee },
    fromAddress,
    note,
    totalIssuance,
    decimals,
    defaultFrozen,
    managerAddress,
    reserveAddress,
    freezeAddress,
    clawbackAddress,
    unitName,
    assetName,
    assetURL,
    assetMetadataHash,
  } = options;

  let params = await algodClient.getTransactionParams().do();

  if (fee && flatFee) {
    console.log(`Using custom fee: ${fee} w/flatFee ${flatFee}`);
    params = {
      ...params,
      fee,
      flatFee,
    };
  }

  // let note = algosdk.encodeObj("showing prefix");

  console.log("Create asset params:", params);
  return algosdk.makeAssetCreateTxnWithSuggestedParams(
    fromAddress,
    note,
    totalIssuance,
    decimals,
    defaultFrozen,
    managerAddress,
    reserveAddress,
    freezeAddress,
    clawbackAddress,
    unitName,
    assetName,
    assetURL,
    assetMetadataHash,
    params
  );
};

const signTransaction = (account: Account, transaction: Transaction) => {
  return transaction.signTxn(account[AlgorandAccount.SECRET_KEY]);
};

export interface AlgorandTransaction {
  txId: string;
}
const sendRawSignedTransaction = async (
  algodClient: Algodv2,
  rawTransaction: Uint8Array
) => {
  const transaction = (await algodClient
    .sendRawTransaction(rawTransaction)
    .do()) as AlgorandTransaction;
  console.log(`Transaction: ${transaction.txId}`);
  return transaction;
};

const getPendingAssetInfo = async (
  algodClient: Algodv2,
  transaction: AlgorandTransaction
) => {
  const pendingTransaction = await algodClient
    .pendingTransactionInformation(transaction.txId)
    .do();
  console.log("pending txn", pendingTransaction);
  return pendingTransaction;
};

export interface AlgorandConfigureAssetOptions {
  customFee: {
    fee?: number;
    flatFee?: boolean;
  };
  fromAddress: string;
  note: Uint8Array;
  assetId: number;
  managerAddress: string;
  reserveAddress: string;
  freezeAddress: string;
  clawbackAddress: string;
}

const configureAsset = async (
  algodClient: Algodv2,
  options: AlgorandConfigureAssetOptions
) => {
  const {
    customFee: { fee, flatFee },
    fromAddress,
    note,
    assetId,
    managerAddress,
    reserveAddress,
    freezeAddress,
    clawbackAddress,
  } = options;
  let params = await algodClient.getTransactionParams().do();

  if (fee && flatFee) {
    console.log(`Using custom fee: ${fee} w/flatFee ${flatFee}`);
    params = {
      ...params,
      fee,
      flatFee,
    };
  }

  const configTransaction = algosdk.makeAssetConfigTxnWithSuggestedParams(
    fromAddress,
    note,
    assetId,
    managerAddress,
    reserveAddress,
    freezeAddress,
    clawbackAddress,
    params
  );

  return configTransaction
};

const AlgorandService = {
  generateAccount,
  retrievePrivateKeyMnemonic,
  retrieveAccountAddress,
  waitForConfirmation,
  printCreatedAsset,
  printAssetHolding,
  createAsset,
  signTransaction,
  sendRawSignedTransaction,
  getPendingAssetInfo,
  configureAsset
};

export default AlgorandService;
