import algosdk, { Algodv2, Account } from "algosdk";
import AlgorandUtils, {
  AlograndPendingTransaction,
  AlgorandAccount,
} from "../utils/alogorand";

const createAsset = async (
  algodClient: Algodv2,
  creatorAccount: Account,
  managerAccount: Account
) => {
  const createdAsset = await AlgorandUtils.createAsset(algodClient, {
    customFee: {
      fee: 1000,
      flatFee: true,
    },
    note: algosdk.encodeObj({ hello: "showing prefix" }),
    creatorAccount: creatorAccount,
    managerAccount: managerAccount,
    defaultFrozen: false,
    decimals: 0,
    totalIssuance: 1000,
    unitName: "LATINUM",
    assetName: "latinum",
    assetURL: "http://someurl",
    assetMetadataHash: "16efaa3924a6fd9d3a4824799a4ac65d",
  });

  const transaction = await AlgorandUtils.submitTransactionToBlockchain(
    algodClient,
    createdAsset,
    creatorAccount
  );

  const pendingTransaction = await AlgorandUtils.getPendingAssetInfo(
    algodClient,
    transaction
  );

  const assetId = pendingTransaction[
    AlograndPendingTransaction.ASSET_INDEX
  ] as number;

  await AlgorandUtils.printCreatedAsset(
    algodClient,
    creatorAccount[AlgorandAccount.ADDRESS],
    assetId
  );

  await AlgorandUtils.printAssetHolding(
    algodClient,
    creatorAccount[AlgorandAccount.ADDRESS],
    assetId
  );

  return assetId;
};

const configureAsset = async (
  algodClient: Algodv2,
  assetId: number,
  managerAccount: Account,
  newManagerAccount: Account
) => {
  const configuredAsset = await AlgorandUtils.configureAsset(algodClient, {
    assetId,
    customFee: {
      fee: 1000,
      flatFee: true,
    },
    note: algosdk.encodeObj({ hello: "showing prefix" }),
    managerAccount: managerAccount,
    newManagerAccount: newManagerAccount,
  });

  await AlgorandUtils.submitTransactionToBlockchain(
    algodClient,
    configuredAsset,
    managerAccount
  );

  await AlgorandUtils.printCreatedAsset(
    algodClient,
    newManagerAccount[AlgorandAccount.ADDRESS],
    assetId
  );
};

const optInForAssetTransfer = async (
  algodClient: Algodv2,
  assetId: number,
  recipientAccount: Account
) => {
  const optIn = await AlgorandUtils.optInForAssetTransfer(algodClient, {
    assetId,
    recipientAccount,
    customFee: {
      fee: 1000,
      flatFee: true,
    },
    note: algosdk.encodeObj({ hello: "showing prefix" }),
  });

  await AlgorandUtils.submitTransactionToBlockchain(
    algodClient,
    optIn,
    recipientAccount
  );

  await AlgorandUtils.printAssetHolding(
    algodClient,
    recipientAccount[AlgorandAccount.ADDRESS],
    assetId
  );
};

const transferAsset = async (
  algodClient: Algodv2,
  assetId: number,
  senderAccount: Account,
  recipientAccount: Account
) => {
  const transfer = await AlgorandUtils.transferAsset(algodClient, {
    assetId,
    amount: 10,
    customFee: {
      fee: 1000,
      flatFee: true,
    },
    senderAccount,
    recipientAccount,
    note: algosdk.encodeObj({ hello: "showing prefix" }),
  });

  await AlgorandUtils.submitTransactionToBlockchain(
    algodClient,
    transfer,
    senderAccount
  );
};

const freezeAsset = async (
  algodClient: Algodv2,
  assetId: number,
  requestorAccount: Account,
  freezeTargetAccount: Account
) => {
  const freeze = await AlgorandUtils.freezeAsset(algodClient, {
    assetId,
    customFee: {
      fee: 1000,
      flatFee: true,
    },
    requestorAccount,
    freezeTargetAccount,
    note: algosdk.encodeObj({ hello: "showing prefix" }),
  });

  await AlgorandUtils.submitTransactionToBlockchain(algodClient, freeze, requestorAccount)
};

const unfreezeAsset = async (
    algodClient: Algodv2,
    assetId: number,
    requestorAccount: Account,
    freezeTargetAccount: Account
  ) => {
    const unfreeze = await AlgorandUtils.freezeAsset(algodClient, {
      assetId,
      customFee: {
        fee: 1000,
        flatFee: true,
      },
      requestorAccount,
      freezeTargetAccount,
      note: algosdk.encodeObj({ hello: "showing prefix" }),
    }, false);
  
    await AlgorandUtils.submitTransactionToBlockchain(algodClient, unfreeze, requestorAccount)
  };

export const AlgorandService = {
  createAsset,
  configureAsset,
  optInForAssetTransfer,
  transferAsset,
  freezeAsset,
  unfreezeAsset
};
