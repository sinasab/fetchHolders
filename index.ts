import { wagmiContract } from "./contract";
import * as fs from "fs";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";

const client = createPublicClient({
  chain: mainnet,
  // Add an alchemy url here to speed things up.
  // eg. transport: http("https://eth-mainnet.alchemyapi.io/v2/your-api-key")
  transport: http(),
  batch: {
    multicall: true,
  },
});

const main = async () => {
  const multicallContractCalls = Array.from({ length: 9932 }).map(
    (_, index) => ({
      ...wagmiContract,
      functionName: "ownerOf",
      args: [BigInt(index)],
    })
  );
  const results: any = [];
  // Fetch X a at a time.
  for (let i = 0; i < multicallContractCalls.length; i += 200) {
    const upperBound = Math.min(i + 200, multicallContractCalls.length);
    console.log(`Fetching ${i} to ${upperBound}`);
    const result = await client.multicall({
      contracts: multicallContractCalls.slice(i, upperBound),
    });
    results.push(...result);
    // Sleep 1 second to avoid rate limiting.
    // await new Promise((resolve) => setTimeout(resolve, 500));
  }
  const cleaned = results.map((res) => res.result);
  const concatenated = cleaned.join(",");
  // Write to out.csv
  fs.writeFileSync("out.csv", concatenated);
  console.log("output written to out.csv");
};

main();
