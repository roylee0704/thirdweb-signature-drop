import {
  ChainId,
  useAddress,
  useDisconnect,
  useMetamask,
  useNetwork,
  useNetworkMismatch,
  useNFTCollection,
  useSignatureDrop,
} from "@thirdweb-dev/react";
import { SignedPayload721WithQuantitySignature } from "@thirdweb-dev/sdk";
import type { NextPage } from "next";

const Home: NextPage = () => {
  const address = useAddress();
  // Hooks to enforce the user is on the correct network (Mumbai as declared in _app.js) before minting
  const isOnWrongNetwork = useNetworkMismatch();
  console.log(isOnWrongNetwork, "isOnWrongNetwork");

  const [, switchNetwork] = useNetwork();

  // Get the NFT Collection we deployed using thirdweb+
  const signatureDrop = useSignatureDrop(
    process.env.SIGNATURE_DROP_CONTRACT_ADDRESS as string
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

      alert("Successfully minted NFT!");
    } catch (error: any) {
      console.log(error?.message);
    }
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
        </>
      ) : (
        <button onClick={connectWithMetamask}>Connect with Metamask</button>
      )}
    </div>
  );
};

export default Home;
