import {
  ChainId,
  ThirdwebNftMedia,
  useActiveClaimCondition,
  useAddress,
  useClaimNFT,
  useContract,
  useDisconnect,
  useMetamask,
  useNetwork,
  useNetworkMismatch,
  useNFTCollection,
  useNFTDrop,
  useNFTs,
  useOwnedNFTs,
  useSignatureDrop,
} from "@thirdweb-dev/react";
import { SignedPayload721WithQuantitySignature } from "@thirdweb-dev/sdk";
import { utils } from "ethers";
import moment from "moment";
import type { NextPage } from "next";

const Home: NextPage = () => {
  const address = useAddress();
  // Hooks to enforce the user is on the correct network (Mumbai as declared in _app.js) before minting
  const isOnWrongNetwork = useNetworkMismatch();
  console.log(isOnWrongNetwork, "isOnWrongNetwork");

  const [, switchNetwork] = useNetwork();

  // Get the NFT Collection we deployed using thirdweb+
  const signatureDrop = useSignatureDrop(
    process.env.NEXT_PUBLIC_SIGNATURE_DROP_CONTRACT_ADDRESS as string
  );

  const nftDrop = useNFTDrop("0x36362a6B6f1bd1f3519f4454573f045e56b2Dc92");
  nftDrop?.interceptor.overrideNextTransaction(() => ({
    gasLimit: 3000000,
  }));

  console.log(
    "process.env.NEXT_PUBLIC_SIGNATURE_DROP_CONTRACT_ADDRESS",
    process.env.NEXT_PUBLIC_SIGNATURE_DROP_CONTRACT_ADDRESS
  );

  async function claim() {
    if (!address) {
      connectWithMetamask();
      return;
    }

    if (isOnWrongNetwork) {
      switchNetwork?.(ChainId.Goerli);
      return;
    }

    try {
      const tx = await signatureDrop?.claimTo(address, 1);

      console.log(tx, "tx");

      alert("Successfully minted NFT!");
    } catch (error: any) {
      alert(error?.message);
    }
  }

  async function claimWithSignature() {
    if (!address) {
      connectWithMetamask();
      return;
    }

    if (isOnWrongNetwork) {
      switchNetwork?.(ChainId.Goerli);
      return;
    }

    const signedPayloadReq = await fetch("/api/generate-mint-signature", {
      method: "POST",
      body: JSON.stringify({
        address,
      }),
    });

    console.log(signedPayloadReq);

    if (signedPayloadReq.status == 400) {
      alert("something is wrong.");
      return;
    }

    try {
      const signedPayload =
        (await signedPayloadReq.json()) as SignedPayload721WithQuantitySignature;

      const nft = await signatureDrop?.signature.mint(signedPayload);
      console.log(nft, "nft?");
      alert("Successfully minted NFT!");
    } catch (error: any) {
      console.log(error?.message);
    }
  }

  async function updateNftDropClaimConditions() {
    if (!address) {
      connectWithMetamask();
      return;
    }

    if (isOnWrongNetwork) {
      switchNetwork?.(ChainId.Goerli);
      return;
    }

    try {
      const presaleStartTime = moment();

      // const freeMintCondition = {
      //   startTime: presaleStartTime.toDate(), // start the presale now
      //   maxQuantity: 1, // limit how many mints for this presale
      //   price: 0, // presale price
      //   snapshot: ["0x46c019289556f33c292bCa4c497A13e614ac4868"], // limit minting to only certain addresses
      // };

      const preSalesClaimCondition = {
        startTime: presaleStartTime.toDate(), // start the presale now
        maxQuantity: 2, // limit how many mints for this presale
        price: 0.001, // presale price
        snapshot: [], // limit minting to only certain addresses
      };

      const publicSalesClaimCondition = {
        startTime: presaleStartTime.add(5, "minutes").toDate(), // start the presale now
        maxQuantity: 3, // limit how many mints for this presale
        price: 0.002, // presale price
        snapshot: [], // limit minting to only certain addresses
      };

      const data = await nftDrop?.claimConditions.set([
        //freeMintCondition,
        preSalesClaimCondition,
        publicSalesClaimCondition,
      ]);

      console.log(data, "data?");
      alert("Successfully udpdated claimConditions!");
    } catch (error: any) {
      console.log(error?.message);
    }
  }
  const { mutate: claimANftDrop, isLoading: isClaimingNftDrop } =
    useClaimNFT(nftDrop);

  const { data, isLoading, error } = useActiveClaimCondition(nftDrop);
  const { data: ownedNFTs, isLoading: isLoadingNfts } = useOwnedNFTs(
    nftDrop,
    address
  );

  console.log(data?.price.toNumber());
  async function claimNftDrop() {
    if (!address) {
      connectWithMetamask();
      return;
    }

    if (isOnWrongNetwork) {
      switchNetwork?.(ChainId.Goerli);
      return;
    }

    claimANftDrop({ to: address, quantity: 1 });
  }

  const connectWithMetamask = useMetamask();
  const disconnectWallet = useDisconnect();

  return (
    <div>
      {address ? (
        <>
          <button onClick={disconnectWallet}>Disconnect Wallet</button>
          <p>Your address: {address}</p>

          <button onClick={claim}>Normal Claim</button>
          <button onClick={claimWithSignature}>Signature Claim</button>

          <button onClick={claimNftDrop}>
            NFT DROP Claim {utils.formatEther(data?.price.toString() ?? 0)}{" "}
            ethers
          </button>

          <button onClick={updateNftDropClaimConditions}>
            Update NFT DROP Claim Conditions
          </button>
          <div>
            {ownedNFTs?.map((nft) => (
              <div key={nft.metadata.id.toString()}>
                <ThirdwebNftMedia metadata={nft.metadata}></ThirdwebNftMedia>
                <h3>{nft.metadata.name}</h3>
                <p>Owner: {nft.owner.slice(0, 6)}</p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <button onClick={connectWithMetamask}>Connect with Metamask</button>
      )}
    </div>
  );
};

export default Home;
