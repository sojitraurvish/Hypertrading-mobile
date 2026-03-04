import { appToast } from "@/components/ui/app-toast";
import { getUserExchangeClient, infoClient } from "@/lib/clients/hyperliquid";
import {
  getLocalStorage,
  LOCAL_STORAGE_KEYS,
  setLocalStorage,
} from "@/lib/sessions/LocalStorage";
import { errorHandler } from "@/lib/utils/error-handler";
import { useAccount, useProvider } from "@reown/appkit-react-native";
import { BrowserProvider, HDNodeWallet, JsonRpcSigner, Wallet } from "ethers";
import { useEffect, useState } from "react";

export const useApiWallet = ({
  userPublicKey,
}: {
  userPublicKey: `0x${string}`;
}) => {
  const { address: connectedAddress, isConnected } = useAccount();
  const { provider: walletProvider } = useProvider();

  const [agentWallet, setAgentWallet] = useState<Wallet | HDNodeWallet | null>(
    null,
  );
  const [isApproved, setIsApproved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  // Use the provided public key or fall back to the connected wallet address

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

      console.log(
        "approveAgent",
        agentPublicKeyParam,
        userPublicKeyParam,
        exchangeClient,
      );
      const result = await exchangeClient.approveAgent({
        agentAddress: agentPublicKeyParam,
        agentName: `agent${userPublicKeyParam.slice(0, 6)}_${userPublicKeyParam.slice(-4)}`,
      });

      console.log("result", result);

      if (result.status === "ok") {
        console.log("result is ok");
        return true;
      } else {
        const error = (result as any).response?.data || "Approval failed";
        appToast.error({ message: errorHandler(error) });
        console.log("error", error);
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
    userPublicKeyParam = userPublicKey as `0x${string}`,
    agentPublicKeyParam = agentWallet?.address as `0x${string}`,
  }: {
    userPublicKeyParam?: `0x${string}`;
    agentPublicKeyParam?: `0x${string}`;
  }): Promise<boolean> => {
    setIsLoading(true);
    try {
      let agentPublicKey: `0x${string}` = agentPublicKeyParam;
      if (!agentPublicKey) {
        agentPublicKey = (await initializeApiWallet({
          userPublicKeyParam: userPublicKeyParam,
        })) as `0x${string}`;
        console.log("new agentPublicKey", agentPublicKey);
      }

      const isApprovedResult = await checkAgentApproval({
        agentPublicKeyParam: agentPublicKey,
        userPublicKeyParam: userPublicKeyParam,
      });
      console.log("isApprovedResult", isApprovedResult);

      setIsApproved(isApprovedResult);

      // If not approved and wallet is connected, approve the agent (using reliable wallet client getter)
      if (!isApprovedResult && isConnected) {
        const approvalResult = await approveAgent({
          agentPublicKeyParam: agentPublicKey,
          userPublicKeyParam: userPublicKeyParam,
        });

        console.log("approvalResult", approvalResult);

        if (approvalResult) {
          const updatedApprovedResult = await checkAgentApproval({
            agentPublicKeyParam: agentPublicKey,
            userPublicKeyParam: userPublicKeyParam,
          });
          setIsApproved(updatedApprovedResult);
          return updatedApprovedResult;
        } else {
          return false;
        }
      }

      return isApprovedResult;
    } catch (e) {
      appToast.error({ message: errorHandler(e) });
      return false;
    } finally {
      setIsLoading(false);
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
      setLocalStorage(
        `${LOCAL_STORAGE_KEYS.HYPERLIQUID_AGENT}m10ine_${userPublicKeyParam}`,
        { agentPrivateKey: wallet.privateKey },
      );
      setAgentWallet(wallet);
      setIsApproved(false); // new wallet needs approval

      console.log(
        "mine agentPublicKey",
        wallet.publicKey,
        wallet.address,
        wallet.privateKey,
      );

      return wallet.address as `0x${string}`;
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
    console.log("lgoin yrvusg");

    const storedData = await getLocalStorage(
      `${LOCAL_STORAGE_KEYS.HYPERLIQUID_AGENT}m10ine_${userPublicKeyParam}`,
    );

    console.log("storedData", storedData);
    if (storedData?.agentPrivateKey) {
      try {
        const wallet = new Wallet(storedData.agentPrivateKey);
        setAgentWallet(wallet);
        // Optionally auto‑check approval here – original code left it commented
        return wallet.address as `0x${string}`;
      } catch (error) {
        appToast.error({ message: errorHandler(error) });
        return await generateNewApiWallet({ userPublicKeyParam });
      }
    } else {
      return await generateNewApiWallet({ userPublicKeyParam });
    }
  };

  useEffect(() => {
    if (!userPublicKey) return;
    // if(!walletClient?.account.address || isWalletClientPending) return;
    // console.log("agentWallet?.address", agentWallet?.address)

    initializeApiWallet({ userPublicKeyParam: userPublicKey });
  }, [userPublicKey]);

  return {
    agentWallet,
    agentPrivateKey: agentWallet?.privateKey,
    isApproved,
    isLoading,
    isApproving,
    checkApprovalStatus,
    checkAgentApproval,
  };
};
