import { ThirdwebSDK } from "@thirdweb-dev/sdk";
import { NextApiRequest, NextApiResponse } from "next";

export default async function generateMintSignature(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { address } = JSON.parse(req.body);
  const goerliSDK = ThirdwebSDK.fromPrivateKey(
    process.env.GOERLI_PRIVATE_KEY as string,
    "goerli"
  );

  const signatureDrop = goerliSDK.getSignatureDrop(
    process.env.SIGNATURE_DROP_CONTRACT_ADDRESS as string
  );

  const mintSignature = await signatureDrop.signature.generate({
    to: address,
    price: "0", // free!
    mintStartTime: new Date(0), // now
  });

  res.status(200).json(mintSignature);
}
