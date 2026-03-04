import { appToast } from "@/components/ui/app-toast";
import { getUserExchangeClient, infoClient } from "@/lib/clients/hyperliquid";
import { getLocalStorage, setLocalStorage } from "@/lib/sessions/LocalStorage";
import { errorHandler } from "@/lib/utils/error-handler";
import { useAccount, useProvider } from "@reown/appkit-react-native";
import { BrowserProvider, HDNodeWallet, JsonRpcSigner, Wallet } from "ethers";
import { useEffect, useState } from "react";

// Module-level promise to deduplicate parallel approval checks.
let approvalCheckInFlight: Promise<boolean> | null = null;

export const useApiWallet = ({
  userPublicKey: propUserPublicKey,
}: {
  userPublicKey?: `0x${string}`;
}) => {
  const { address: connectedAddress, isConnected } = useAccount();
  const { provider: walletProvider } = useProvider();

  const [agentWallet, setAgentWallet] = useState<Wallet | HDNodeWallet | null>(
    null,
  );
  const [isApproved, setIsApproved] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  // Use the provided public key or fall back to the connected wallet address
  const userPublicKey =
    propUserPublicKey || (connectedAddress as `0x${string}`);

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

  // ─── Approve the agent on HyperLiquid ───────────────────────────────
  const approveAgent = async ({
    agentPublicKeyParam = agentWallet?.address as `0x${string}`,
    userPublicKeyParam = userPublicKey,
  }: {
    agentPublicKeyParam?: `0x${string}`;
    userPublicKeyParam?: `0x${string}`;
  }) => {
    if (!userPublicKeyParam || !agentPublicKeyParam) {
      appToast.error({
        message: "Missing required parameters for agent approval",
      });
      return false;
    }

    if (
      agentPublicKeyParam.toLowerCase() === userPublicKeyParam.toLowerCase()
    ) {
      appToast.error({
        message:
          "Invalid agent wallet: agent address cannot be the same as your wallet address.",
      });
      return false;
    }

    const signer = await getReliableSigner();

    console.log("signer", signer);
    if (!signer) {
      appToast.error({
        message:
          "Signer not available. Please ensure your wallet is connected and unlocked, then try again.",
      });
      return false;
    }

    try {
      setIsApproving(true);
      const exchangeClient = getUserExchangeClient(signer); // assumes client accepts an ethers signer

      const result = await exchangeClient.approveAgent({
        agentAddress: agentPublicKeyParam,
        agentName: `agent${userPublicKeyParam.slice(0, 6)}_${userPublicKeyParam.slice(-4)}`,
      });

      if (result.status === "ok") {
        return true;
      } else {
        const error = (result as any).response?.data || "Approval failed";
        appToast.error({ message: errorHandler(error) });
        return false;
      }
    } catch (e) {
      console.log("error", JSON.stringify(e, null, 2));
      appToast.error({ message: errorHandler(e) });
      return false;
    } finally {
      setIsApproving(false);
    }
  };

  // ─── Check if an agent is still valid (not expired) ─────────────────
  function isAgentValid(agent: { validUntil?: number } | undefined): boolean {
    if (!agent?.validUntil) return false;
    return Date.now() < agent.validUntil;
  }

  // ─── Query HyperLiquid for the agent's approval status ──────────────
  const checkAgentApproval = async ({
    agentPublicKeyParam = agentWallet?.address as `0x${string}`,
    userPublicKeyParam = userPublicKey,
  }: {
    agentPublicKeyParam?: `0x${string}`;
    userPublicKeyParam?: `0x${string}`;
  }): Promise<boolean> => {
    const agents = await infoClient.extraAgents({ user: userPublicKeyParam });

    console.log("agents", agents);
    const found = agents.find(
      (a: { address: string; validUntil?: number }) =>
        a.address.toLowerCase() === agentPublicKeyParam?.toLowerCase(),
    );
    if (!found) return false;
    return isAgentValid(found);
  };

  // ─── Combined: check approval and approve if needed ─────────────────
  const checkApprovalStatus = async ({
    agentPublicKeyParam = agentWallet?.address as `0x${string}`,
    userPublicKeyParam = userPublicKey,
  }: {
    agentPublicKeyParam?: `0x${string}`;
    userPublicKeyParam?: `0x${string}`;
  } = {}): Promise<boolean> => {
    if (approvalCheckInFlight) {
      return approvalCheckInFlight;
    }

    const checkPromise = (async () => {
      try {
        if (!agentPublicKeyParam || !userPublicKeyParam) {
          appToast.error({
            message:
              "Agent wallet is not ready yet. Please wait a moment and try again.",
          });
          return false;
        }

        if (
          agentPublicKeyParam.toLowerCase() === userPublicKeyParam.toLowerCase()
        ) {
          await generateNewApiWallet({ userPublicKeyParam });
          appToast.error({
            message:
              "Invalid cached agent detected. A new agent wallet was generated, please try again.",
          });
          return false;
        }

        const isApprovedResult = await checkAgentApproval({
          agentPublicKeyParam,
          userPublicKeyParam,
        });

        setIsApproved(isApprovedResult);

        console.log("isApprovedResult", isApprovedResult);
        if (!isApprovedResult && isConnected) {
          const approvalResult = await approveAgent({
            agentPublicKeyParam,
            userPublicKeyParam,
          });

          if (approvalResult) {
            const updated = await checkAgentApproval({
              agentPublicKeyParam,
              userPublicKeyParam,
            });
            setIsApproved(updated);
            return updated;
          }
          return false;
        }

        return isApprovedResult;
      } catch (e) {
        appToast.error({ message: errorHandler(e) });
        return false;
      }
    })();

    approvalCheckInFlight = checkPromise;
    try {
      return await checkPromise;
    } finally {
      approvalCheckInFlight = null;
    }
  };

  // ─── Generate a new random agent wallet and store it ────────────────
  const generateNewApiWallet = async ({
    userPublicKeyParam = userPublicKey,
  }: {
    userPublicKeyParam?: `0x${string}`;
  }) => {
    try {
      const wallet = Wallet.createRandom();
      await setLocalStorage(`hyperliquid_agent_${userPublicKeyParam}`, {
        agentPrivateKey: wallet.privateKey,
        userPublicKey: userPublicKeyParam,
      });
      setAgentWallet(wallet);
      setIsApproved(false); // new wallet needs approval
    } catch (error) {
      console.error("Error generating API wallet:", error);
    }
  };

  // ─── Initialise: load existing agent or create a new one ────────────
  const initializeApiWallet = async ({
    userPublicKeyParam = userPublicKey,
  }: {
    userPublicKeyParam?: `0x${string}`;
  }) => {
    if (!userPublicKeyParam) return;

    // Skip if we already have a wallet and are in a non‑idle state
    if (agentWallet?.address && (isApproved || isApproving)) return;

    const storedData = await getLocalStorage(
      `hyperliquid_agent_${userPublicKeyParam}`,
    );
    if (storedData?.agentPrivateKey) {
      try {
        const wallet = new Wallet(storedData.agentPrivateKey);
        setAgentWallet(wallet);
        // Optionally auto‑check approval here – original code left it commented
      } catch (error) {
        appToast.error({ message: errorHandler(error) });
        await generateNewApiWallet({ userPublicKeyParam });
      }
    } else {
      await generateNewApiWallet({ userPublicKeyParam });
    }
  };

  // ─── Effect: run initialisation when the user public key changes ───
  useEffect(() => {
    if (!userPublicKey) return;
    initializeApiWallet({ userPublicKeyParam: userPublicKey });
  }, [userPublicKey]);

  return {
    agentWallet,
    agentPrivateKey: agentWallet?.privateKey,
    isApproved,
    isApproving,
    checkApprovalStatus,
    checkAgentApproval,
  };
};
