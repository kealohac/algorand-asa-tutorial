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

const getTransactionParams = async (
  algodClient: Algodv2,
  fee?: number,
  flatFee?: boolean
) => {
  let params = await algodClient.getTransactionParams().do();

  if (fee && flatFee) {
    console.log(`Using custom fee: ${fee} w/flatFee ${flatFee}`);
    params = {
      ...params,
      fee,
      flatFee,
    };
  }

  return params;
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
  assetId: number
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
  assetId: number
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
  creatorAccount: Account;
  managerAccount: Account;
  note: Uint8Array;
  totalIssuance: number;
  decimals: number;
  defaultFrozen: boolean;
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
    creatorAccount,
    note,
    totalIssuance,
    decimals,
    defaultFrozen,
    managerAccount,
    unitName,
    assetName,
    assetURL,
    assetMetadataHash,
  } = options;

  const params = await getTransactionParams(algodClient, fee, flatFee);

  const creatorAddress = creatorAccount[AlgorandAccount.ADDRESS];
  const managerAddress = managerAccount[AlgorandAccount.ADDRESS];
  const reserveAddress = managerAddress;
  const freezeAddress = managerAddress;
  const clawbackAddress = managerAddress;

  console.log("Create asset params:", params);
  return algosdk.makeAssetCreateTxnWithSuggestedParams(
    creatorAddress,
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
  managerAccount: Account;
  newManagerAccount: Account;
  note: Uint8Array;
  assetId: number;
}

const configureAsset = async (
  algodClient: Algodv2,
  options: AlgorandConfigureAssetOptions
) => {
  const {
    customFee: { fee, flatFee },
    managerAccount,
    note,
    assetId,
    newManagerAccount,
  } = options;
  const params = await getTransactionParams(algodClient, fee, flatFee);

  const newManagerAddress = newManagerAccount[AlgorandAccount.ADDRESS];
  const managerAddress = managerAccount[AlgorandAccount.ADDRESS];
  const reserveAddress = managerAddress;
  const freezeAddress = managerAddress;
  const clawbackAddress = managerAddress;

  const configTransaction = algosdk.makeAssetConfigTxnWithSuggestedParams(
    managerAddress,
    note,
    assetId,
    newManagerAddress,
    reserveAddress,
    freezeAddress,
    clawbackAddress,
    params
  );

  return configTransaction;
};

const submitTransactionToBlockchain = async (
  algodClient: Algodv2,
  asset: Transaction,
  signingAccount: Account
) => {
  const rawSignedTransaction = signTransaction(signingAccount, asset);

  const transaction = await sendRawSignedTransaction(
    algodClient,
    rawSignedTransaction
  );

  await waitForConfirmation(algodClient, transaction.txId);

  return transaction;
};

export interface AlgorandOptInOptions {
  customFee: {
    fee?: number;
    flatFee?: boolean;
  };
  note: Uint8Array;
  assetId: number;
  recipientAccount: Account;
  revocationTarget?: string;
  closeRemainderTo?: string;
}

const optInForAssetTransfer = async (
  algodClient: Algodv2,
  options: AlgorandOptInOptions
) => {
  const {
    customFee: { fee, flatFee },
    recipientAccount,
    note,
    assetId,
    revocationTarget,
    closeRemainderTo,
  } = options;

  const params = await getTransactionParams(algodClient, fee, flatFee);

  const amount = 0;

  const recipientAddress = recipientAccount[AlgorandAccount.ADDRESS];

  const optInTransaction = algosdk.makeAssetTransferTxnWithSuggestedParams(
    recipientAddress,
    recipientAddress,
    closeRemainderTo,
    revocationTarget,
    amount,
    note,
    assetId,
    params
  );

  return optInTransaction;
};

export interface AlgorandTransferOptions {
  customFee: {
    fee?: number;
    flatFee?: boolean;
  };
  senderAccount: Account;
  recipientAccount: Account;
  note: Uint8Array;
  assetId: number;
  amount: number;
  revocationTarget?: string;
  closeRemainderTo?: string;
}

const transferAsset = async (
  algodClient: Algodv2,
  options: AlgorandTransferOptions
) => {
  const {
    customFee: { fee, flatFee },
    senderAccount,
    recipientAccount,
    note,
    assetId,
    amount,
    revocationTarget,
    closeRemainderTo,
  } = options;

  const params = await getTransactionParams(algodClient, fee, flatFee);

  console.log(`transferring assset with params`, params);

  const senderAddress = senderAccount[AlgorandAccount.ADDRESS];

  const recipientAddress = recipientAccount[AlgorandAccount.ADDRESS];

  const transferTransaction = algosdk.makeAssetTransferTxnWithSuggestedParams(
    senderAddress,
    recipientAddress,
    closeRemainderTo,
    revocationTarget,
    amount,
    note,
    assetId,
    params
  );

  console.log(`transfer txn`, transferTransaction);

  return transferTransaction;
};

export interface AlgorandFreezeOptions {
  customFee: {
    fee?: number;
    flatFee?: boolean;
  };
  assetId: number;
  requestorAccount: Account;
  freezeTargetAccount: Account;
  note: Uint8Array;
}
const freezeAsset = async (
  algodClient: Algodv2,
  options: AlgorandFreezeOptions,
  freezeState = true
) => {
  const {
    customFee: { fee, flatFee },
    requestorAccount,
    freezeTargetAccount,
    note,
    assetId,
  } = options;

  const params = await getTransactionParams(algodClient, fee, flatFee);

  const fromAddress = requestorAccount[AlgorandAccount.ADDRESS];
  const freezeTargetAddress = freezeTargetAccount[AlgorandAccount.ADDRESS];

  const freezeTransaction = algosdk.makeAssetFreezeTxnWithSuggestedParams(
    fromAddress,
    note,
    assetId,
    freezeTargetAddress,
    freezeState,
    params
  );

  console.log(`freeze transaction`, freezeTransaction);

  return freezeTransaction;
};

const AlgorandUtils = {
  generateAccount,
  retrievePrivateKeyMnemonic,
  retrieveAccountAddress,
  // waitForConfirmation,
  printCreatedAsset,
  printAssetHolding,
  createAsset,
  // signTransaction,
  // sendRawSignedTransaction,
  getPendingAssetInfo,
  configureAsset,
  submitTransactionToBlockchain,
  optInForAssetTransfer,
  transferAsset,
  freezeAsset,
};

export default AlgorandUtils;
