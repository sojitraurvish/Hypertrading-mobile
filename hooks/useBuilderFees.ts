// src/hooks/useBuilderFee.ts
import { appToast } from "@/components/ui/app-toast";
import { getUserExchangeClient, infoClient } from "@/lib/clients/hyperliquid";
import { BUILDER_CONFIG } from "@/lib/config";
import { errorHandler } from "@/lib/utils/error-handler";
import { useAccount, useProvider } from "@reown/appkit-react-native";
import { BrowserProvider, JsonRpcSigner } from "ethers";
import { useEffect, useMemo, useState } from "react";

const pendingApprovalChecks = new Set<string>();

// Convert numeric chain id (e.g. 42161) to hex string (e.g. "0xa4b1")
function toHexChainId(chainId: number) {
  return `0x${chainId.toString(16)}`;
}

// Format "max fee" as a percent string expected by approveBuilderFee
// Input is bps, e.g. 5 bps → "0.05%"
function bpsToPercentString(bps: number): string {
  return `${(bps / 100).toString()}%`;
}

// Parse the API response from info.maxBuilderFee into bps
// The API returns the value in tenths of basis points (e.g. 100 = 10 bps = 0.1%)
// This converts tenths of bps to bps by dividing by 10
function toBpsFromApi(val: unknown): number {
  if (typeof val === "number" && isFinite(val)) {
    // API returns in tenths of bps, so divide by 10 to get bps
    // e.g. 100 tenths of bps → 10 bps
    return Math.round(val / 10);
  }
  if (typeof val === "string") {
    const v = val.endsWith("%") ? val.slice(0, -1) : val;
    const n = Number(v);
    if (isFinite(n)) {
      // If it's a string number, assume it's also in tenths of bps
      return Math.round(n / 10);
    }
  }
  return 0;
}

/**
 * useBuilderFee:
 * - Reads the current max builder fee approved by the user for a builder address.
 * - Approves or raises the max fee by prompting a single wallet signature via SDK.
 * - No raw HTTP calls — everything goes through @nktkas/hyperliquid.
 *
 * Inputs:
 *   userPublicKey: the trader’s EOA (their web wallet address)
 *   builderPublicKey: your platform’s builder address (receives builder fees)
 *   desiredBps: how many bps you want to collect (e.g. 5 for 0.05%)
 *
 * Outputs:
 *   approvedBps: current approved max in bps (0 if none)
 *   isApproved: whether approvedBps >= desiredBps
 *   approve(): triggers a single approveBuilderFee action if needed
 *   checkBuilderFeeApproval(): re-fetches current approval
 */
export function useBuilderFee({
  builderPublicKey = BUILDER_CONFIG.BUILDER_FEE_ADDRESS,
  desiredBps = BUILDER_CONFIG.BUILDER_FEE_RATE,
  userPublicKey,
}: {
  userPublicKey: `0x${string}`;
  builderPublicKey?: `0x${string}`;
  desiredBps?: number;
}) {
  const { isConnected } = useAccount();

  const [isChecking, setIsChecking] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  const [isApprovedBps, setIsApprovedBps] = useState<number>(0);
  const [isApproved, setIsApproved] = useState<boolean>(false);
  const { provider: walletProvider } = useProvider();

  const desiredPercent = useMemo(
    () => bpsToPercentString(desiredBps),
    [desiredBps],
  );

  // ─── Helper: get an ethers signer with retry logic ──────────────────
  const getReliableSigner = async (
    maxRetries = 3,
    delay = 200,
  ): Promise<JsonRpcSigner | null> => {
    if (!walletProvider) {
      console.log("Wallet provider not available");
      return null;
    }

    for (let i = 0; i < maxRetries; i++) {
      try {
        const provider = new BrowserProvider(walletProvider);
        const signer = await provider.getSigner();
        return signer;
      } catch (error) {
        console.log(
          `Attempt ${i + 1} to get signer failed, retrying...`,
          error,
        );
      }
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
      }
    }
    return null;
  };

  const approveBuilderFee = async ({
    userPublicKeyParam = userPublicKey,
    builderPublicKeyParam = builderPublicKey,
  }: {
    userPublicKeyParam: `0x${string}`;
    builderPublicKeyParam: `0x${string}`;
  }) => {
    if (!userPublicKeyParam || !builderPublicKeyParam) {
      appToast.error({
        message: "Missing required parameters for builder fee approval",
      });
      return false;
    }

    // Get reliable wallet client
    const clientToUse = await getReliableSigner();
    if (!clientToUse) {
      appToast.error({
        message:
          "Wallet client not available. Please ensure your wallet is connected and unlocked, then try again.",
      });
      return false;
    }

    setIsApproving(true);
    try {
      const exchangeClient = getUserExchangeClient(clientToUse);
      const res = await exchangeClient.approveBuilderFee({
        maxFeeRate: desiredPercent, // e.g. "0.05%" for 5 bps
        builder: builderPublicKeyParam, // your builder address
      });

      if (res.status === "ok") {
        return true;
      } else {
        appToast.error({ message: errorHandler(res.response) });
        return false;
      }
    } catch (e) {
      appToast.error({ message: errorHandler(e) });
      return false;
    } finally {
      setIsApproving(false);
    }
  };

  const checkBuilderFeeApproval = async ({
    userPublicKeyParam = userPublicKey,
    builderPublicKeyParam = builderPublicKey,
  }: {
    userPublicKeyParam: `0x${string}`;
    builderPublicKeyParam: `0x${string}`;
  }) => {
    // SDK call: info.maxBuilderFee
    // Note: maxBuilderFee requires both user and builder in the request
    const max = await infoClient.maxBuilderFee({
      user: userPublicKeyParam,
      builder: builderPublicKeyParam,
    });

    const approvedBps = toBpsFromApi(max);

    setIsApprovedBps(approvedBps);

    const isApproved = approvedBps >= desiredBps;

    setIsApproved(isApproved);

    return isApproved;
  };

  const checkBuilderFeeStatus = async ({
    userPublicKeyParam = userPublicKey,
    builderPublicKeyParam = builderPublicKey,
  }: {
    userPublicKeyParam?: `0x${string}`;
    builderPublicKeyParam?: `0x${string}`;
  }): Promise<boolean> => {
    if (!userPublicKeyParam || !builderPublicKeyParam) {
      appToast.error({ message: "No userPublicKey or builderPublicKey" });
      return false;
    }

    if (!isConnected) {
      appToast.error({ message: "Please connect your wallet first" });
      return false;
    }

    setIsChecking(true);
    try {
      const approvedBps = await checkBuilderFeeApproval({
        userPublicKeyParam: userPublicKeyParam,
        builderPublicKeyParam: builderPublicKeyParam,
      });

      if (!approvedBps) {
        // Use reliable wallet client getter - this will retry if needed
        const approvalResult = await approveBuilderFee({
          userPublicKeyParam: userPublicKeyParam,
          builderPublicKeyParam: builderPublicKeyParam,
        });

        if (approvalResult) {
          const updatedApprovedBps = await checkBuilderFeeApproval({
            userPublicKeyParam: userPublicKeyParam,
            builderPublicKeyParam: builderPublicKeyParam,
          });
          return updatedApprovedBps;
        } else {
          return false;
        }
      }

      return approvedBps;
    } catch (e) {
      appToast.error({ message: errorHandler(e) });
      return false;
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    if (!userPublicKey || !builderPublicKey) return;

    // const cachekey=`${userPublicKey}_${builderPublicKey}`;

    // if(!pendingApprovalChecks.has(cachekey)){
    //   pendingApprovalChecks.add(cachekey)
    //   checkBuilderFeeApproval({userPublicKeyParam: userPublicKey, builderPublicKeyParam: builderPublicKey})
    //   .finally(() => {
    //     pendingApprovalChecks.delete(cachekey)
    //   })
    // }
  }, [userPublicKey, builderPublicKey]);

  return {
    isApprovedBps,
    isApproved,
    isLoading: isChecking,
    isApproving,
    checkBuilderFeeStatus,
    approveBuilderFee,
  };
}
