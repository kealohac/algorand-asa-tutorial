import algosdk, { Account, Algodv2, signTransaction } from "algosdk";
import config from "./config/index";
import { AlgorandService } from "./services/algorand";
import AlgorandUtils, {
  AlgorandAccount,
  AlograndPendingTransaction,
} from "./utils/alogorand";



const run = async () => {
  const account1 = AlgorandUtils.retrieveAccountAddress(
    config.mnemonic.account1
  );
  const account2 = AlgorandUtils.retrieveAccountAddress(
    config.mnemonic.account2
  );
  const account3 = AlgorandUtils.retrieveAccountAddress(
    config.mnemonic.account3
  );

  const algodClient = new algosdk.Algodv2(
    config.algorand.token,
    config.algorand.server,
    config.algorand.port
  );
  const account1Address = account1[AlgorandAccount.ADDRESS];
  const account2Address = account2[AlgorandAccount.ADDRESS];
  const account3Address = account3[AlgorandAccount.ADDRESS];

  const assetId = 27;

    //   const assetId = await AlgorandService.createAsset(algodClient, account1, account2)

    //   await AlgorandService.configureAsset(algodClient, assetId, account2, account1)

    //   await AlgorandService.optInForAssetTransfer(algodClient, assetId, account3)

    //   await AlgorandService.transferAsset(algodClient, assetId, account1, account3)

    // await AlgorandService.freezeAsset(algodClient, assetId, account2, account3)

    // await AlgorandService.unfreezeAsset(algodClient, assetId, account2, account3)
};

run();
