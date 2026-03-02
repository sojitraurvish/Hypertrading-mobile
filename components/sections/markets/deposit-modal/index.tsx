import { AppButton } from "@/components/ui/app-button";
import { AppDropdown } from "@/components/ui/app-dropdown";
import AppModal from "@/components/ui/app-modal";
import { AppText } from "@/components/ui/app-text";
import { appToast } from "@/components/ui/app-toast";
import { activeChain, walletKit } from "@/lib/clients/wallet";
import { ENVIRONMENT, ENVIRONMENT_TYPES, VARIANT_TYPES } from "@/lib/constants";
import { useAccount } from "@reown/appkit-react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, TextInput, View } from "react-native";
import {
  decodeFunctionResult,
  encodeFunctionData,
  formatUnits,
  parseUnits,
} from "viem";

const USDC_DECIMALS = 6;

// Default testnet constants (from Hyperliquid docs)
// USDC deposits happen on Arbitrum Sepolia, which bridges to Hyperliquid testnet
const DEFAULT_CHAIN_ID = activeChain.id; // Active chain based on current network preference
const USDC_ADDRESS =
  ENVIRONMENT === ENVIRONMENT_TYPES.DEVELOPMENT
    ? ("0x1baAbB04529D43a73232B713C0FE471f7c7334d5" as const)
    : ("0xaf88d065e77c8cC2239327C5EDb3A432268e5831" as const);
const BRIDGE_ADDRESS =
  ENVIRONMENT === ENVIRONMENT_TYPES.DEVELOPMENT
    ? ("0x08cfc1B6b2dCF36A1480b99353A354AA8AC56f89" as const)
    : ("0x2df1c51e09aecf9cacb7bc98cb1742757f163df7" as const);

// ERC20 ABI for transfer and balanceOf
const ERC20_ABI = [
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

type DepositModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

type Eip1193Provider = {
  request: (args: {
    method: string;
    params?: unknown[] | object;
  }) => Promise<unknown>;
};

const normalizeChainId = (value: unknown): number => {
  if (typeof value === "string") {
    if (value.startsWith("0x")) return Number.parseInt(value, 16);
    return Number.parseInt(value, 10);
  }
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  return Number.NaN;
};

export const DepositModal: React.FC<DepositModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { address } = useAccount();

  const provider = (
    walletKit as unknown as { getProvider?: (ns: string) => unknown }
  ).getProvider?.("eip155") as Eip1193Provider | null;

  const [chainId, setChainId] = useState<number>(activeChain.id);
  const [isSwitchingChain, setIsSwitchingChain] = useState(false);
  const [amount, setAmount] = useState(""); // human readable, e.g. "10.5"
  const [status, setStatus] = useState("");
  const [selectedAsset, setSelectedAsset] = useState("USDC");
  const [selectedChain, setSelectedChain] = useState(
    ENVIRONMENT === ENVIRONMENT_TYPES.DEVELOPMENT
      ? "arbitrum-sepolia"
      : "arbitrum",
  );

  const [balance, setBalance] = useState<bigint | undefined>(undefined);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);
  const [isPending, setIsPending] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!provider || !isOpen) return;
    let mounted = true;
    (async () => {
      try {
        const chainRaw = await provider.request({ method: "eth_chainId" });
        const parsed = normalizeChainId(chainRaw);
        if (mounted && Number.isFinite(parsed)) setChainId(parsed);
      } catch {
        if (mounted) setChainId(activeChain.id);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [isOpen, provider]);

  // Fetch USDC balance
  useEffect(() => {
    if (!provider || !address || chainId !== DEFAULT_CHAIN_ID || !isOpen) {
      setBalance(undefined);
      return;
    }
    let mounted = true;

    (async () => {
      try {
        const data = encodeFunctionData({
          abi: ERC20_ABI,
          functionName: "balanceOf",
          args: [address as `0x${string}`],
        });
        const raw = await provider.request({
          method: "eth_call",
          params: [{ to: USDC_ADDRESS, data }, "latest"],
        });
        const decoded = decodeFunctionResult({
          abi: ERC20_ABI,
          functionName: "balanceOf",
          data: raw as `0x${string}`,
        });
        if (mounted) setBalance(decoded);
      } catch {
        if (mounted) setBalance(undefined);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [address, chainId, isOpen, provider]);

  // Format balance for display
  const formattedBalance =
    balance !== undefined ? formatUnits(balance, USDC_DECIMALS) : "0";
  // Floor to 2 decimal places to ensure displayed max matches what MAX button sets
  const balanceNum = Number.parseFloat(formattedBalance);
  const flooredBalance =
    Math.floor((Number.isFinite(balanceNum) ? balanceNum : 0) * 100) / 100;
  const maxBalance = flooredBalance.toFixed(2);

  // Convert human amount string to token integer (6 decimals)
  let amountArg: bigint | undefined;
  try {
    if (amount && amount.trim() !== "") {
      amountArg = parseUnits(amount, USDC_DECIMALS);
      console.log("amountArg", amountArg);
    } else {
      amountArg = undefined;
    }
  } catch {
    amountArg = undefined;
  }

  // Check if amount meets minimum requirement
  const minAmount = parseUnits("5", USDC_DECIMALS);
  console.log("minAmount", minAmount);

  // Check if amount exceeds balance
  const exceedsBalance =
    balance !== undefined && amountArg !== undefined && amountArg > balance;

  // Check if amount is below minimum
  const belowMinimum =
    amountArg !== undefined && amountArg > BigInt(0) && amountArg < minAmount;

  // Allow button to be enabled if amount is valid, meets minimum, and doesn't exceed balance
  const isValidAmount =
    amountArg !== undefined &&
    amountArg > BigInt(0) &&
    amountArg >= minAmount &&
    !exceedsBalance;
  console.log("isValidAmount", isValidAmount);

  // Track the last processed transaction hash to prevent duplicate toasts
  const processedTxHashRef = useRef<string | undefined>(undefined);

  const chainName = useMemo(
    () =>
      ENVIRONMENT === ENVIRONMENT_TYPES.DEVELOPMENT
        ? "Arbitrum Sepolia"
        : "Arbitrum",
    [],
  );

  async function switchChain(chainIdToSwitch: number) {
    if (!provider) throw new Error("Wallet provider unavailable");
    const chainHex = `0x${chainIdToSwitch.toString(16)}`;
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainHex }],
    });
    setChainId(chainIdToSwitch);
  }

  async function handleDeposit() {
    setStatus("");

    if (!address) {
      setStatus("Please connect your wallet.");
      appToast.error({ message: "Please connect your wallet." });
      return;
    }

    // Check if we need to switch chains
    if (chainId !== DEFAULT_CHAIN_ID) {
      try {
        setStatus(
          `Switching to ${chainName} (Chain ID: ${DEFAULT_CHAIN_ID})...`,
        );
        appToast.info({ message: `Switching to ${chainName}...` });
        setIsSwitchingChain(true);
        await switchChain(DEFAULT_CHAIN_ID);
        setStatus("Network switched. Please try the deposit again.");
        appToast.success({ message: "Network switched successfully." });
        return;
      } catch (err) {
        console.error(err);
        setStatus(
          "Failed to switch network. Please switch manually in your wallet.",
        );
        appToast.error({
          message: `Please switch to ${chainName} (Chain ID: ${DEFAULT_CHAIN_ID}) in your wallet.`,
        });
        return;
      } finally {
        setIsSwitchingChain(false);
      }
    }

    if (!provider) {
      setStatus("Connect wallet and enter a valid amount.");
      appToast.error({ message: "Connect wallet and enter a valid amount." });
      return;
    }

    // Minimum check (5 USDC)
    const min = parseUnits("5", USDC_DECIMALS);
    if (!amountArg || amountArg < min) {
      setStatus("Minimum deposit is 5 USDC.");
      appToast.error({ message: "Minimum deposit is 5 USDC." });
      return;
    }

    // Check if amount exceeds balance
    if (balance !== undefined && amountArg > balance) {
      setStatus(`Insufficient balance. You have ${maxBalance} USDC available.`);
      appToast.error({
        message: `Insufficient balance. You have ${maxBalance} USDC available.`,
      });
      return;
    }

    try {
      setStatus("Sending transaction... (please confirm in wallet)");
      appToast.info({
        message: "Sending transaction... (please confirm in wallet)",
      });
      setIsPending(true);
      setIsSuccess(false);
      setTxHash(undefined);

      const data = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: "transfer",
        args: [BRIDGE_ADDRESS, amountArg],
      });

      const hash = (await provider.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: address,
            to: USDC_ADDRESS,
            data,
          },
        ],
      })) as `0x${string}`;

      setTxHash(hash);
      setStatus(`Transaction sent: ${hash}. Waiting for confirmation...`);
      appToast.info({ message: `Transaction sent: ${hash.slice(0, 10)}...` });
    } catch (err) {
      console.error(err);
      setStatus("Transaction failed or rejected.");
      appToast.error({ message: "Transaction failed or rejected." });
    } finally {
      setIsPending(false);
    }
  }

  useEffect(() => {
    if (!provider || !txHash) return;
    let mounted = true;
    let interval: ReturnType<typeof setInterval> | undefined;

    const pollReceipt = async () => {
      try {
        setIsConfirming(true);
        const receipt = await provider.request({
          method: "eth_getTransactionReceipt",
          params: [txHash],
        });

        if (!mounted || !receipt) return;
        const typed = receipt as { status?: string } | null;

        if (typed?.status === "0x1") {
          setIsSuccess(true);
          setIsConfirming(false);
          if (interval) clearInterval(interval);
          return;
        }

        if (typed?.status === "0x0") {
          setIsSuccess(false);
          setIsConfirming(false);
          setStatus("Transaction failed or rejected. You can try again.");
          if (interval) clearInterval(interval);
        }
      } catch {
        // no-op while polling
      }
    };

    pollReceipt();
    interval = setInterval(pollReceipt, 2000);

    return () => {
      mounted = false;
      if (interval) clearInterval(interval);
      setIsConfirming(false);
    };
  }, [provider, txHash]);

  // Handle transaction confirmation
  useEffect(() => {
    if (isSuccess && txHash && processedTxHashRef.current !== txHash) {
      processedTxHashRef.current = txHash;
      setStatus(`Deposit successful! Tx: ${txHash}`);
      appToast.success({
        message: `Deposit successful! Transaction: ${txHash.slice(0, 10)}...`,
      });
      // Fetch updated balances after successful deposit
      onSuccess?.();
      // Reset form after successful deposit
      setTimeout(() => {
        setAmount("");
        setStatus("");
        setTxHash(undefined);
        setIsSuccess(false);
        onClose();
      }, 2000);
    }
  }, [isSuccess, txHash, onClose, onSuccess]);

  // Reset status if transaction is rejected or fails
  useEffect(() => {
    if (
      !isPending &&
      !isConfirming &&
      txHash === undefined &&
      status === "Transaction failed or rejected."
    ) {
      // Transaction was rejected or failed, allow user to try again
      setStatus("Transaction failed or rejected. You can try again.");
    }
  }, [isPending, isConfirming, txHash, status]);

  // Reset the processed tx hash ref when modal closes
  useEffect(() => {
    if (!isOpen) {
      processedTxHashRef.current = undefined;
      setTxHash(undefined);
      setIsPending(false);
      setIsConfirming(false);
      setIsSuccess(false);
      setStatus("");
      setAmount("");
    }
  }, [isOpen]);

  const handleMaxClick = () => {
    if (balance !== undefined) {
      // Floor the balance to 2 decimal places to ensure we don't exceed actual balance
      const raw = Number.parseFloat(formattedBalance);
      const floored = Math.floor((Number.isFinite(raw) ? raw : 0) * 100) / 100;
      const formatted = floored.toFixed(2);
      setAmount(formatted);
    }
  };

  const handleAmountChange = (value: string) => {
    // Allow empty input
    if (value === "") {
      setAmount("");
      return;
    }

    // Check if the value matches the pattern: optional digits, optional decimal point, and up to 2 decimal digits
    const regex = /^\d*\.?\d{0,2}$/;

    if (regex.test(value)) {
      setAmount(value);
    }
  };

  // Dropdown options
  const assetOptions = [{ label: "USDC", value: "USDC" }];

  const chainOptions =
    ENVIRONMENT === ENVIRONMENT_TYPES.DEVELOPMENT
      ? [{ label: "Arbitrum Sepolia", value: "arbitrum-sepolia" }]
      : [{ label: "Arbitrum", value: "arbitrum" }];

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title="Deposit USDC"
      variant={VARIANT_TYPES.PRIMARY}
      closeOnOutsideClick
      showCloseButton
      contentClassName="gap-5"
    >
      <View className="gap-4">
        <View className="flex-row gap-3">
          <View className="flex-1 gap-2">
            <AppText className="text-[11px] uppercase tracking-[0.6px] text-text-secondary-dark font-semibold">
              Asset
            </AppText>
            <AppDropdown
              options={assetOptions}
              value={selectedAsset}
              onChange={setSelectedAsset}
            />
          </View>
          <View className="flex-1 gap-2">
            <AppText className="text-[11px] uppercase tracking-[0.6px] text-text-secondary-dark font-semibold">
              Chain
            </AppText>
            <AppDropdown
              options={chainOptions}
              value={selectedChain}
              onChange={setSelectedChain}
            />
          </View>
        </View>

        <View className="gap-2">
          <View className="flex-row items-center justify-between">
            <AppText className="text-[11px] uppercase tracking-[0.6px] text-text-secondary-dark font-semibold">
              Amount (USDC)
            </AppText>
            <AppButton
              variant={VARIANT_TYPES.NOT_SELECTED}
              onPress={handleMaxClick}
              className="px-0 py-0"
              isDisabled={balance === undefined || isPending || isConfirming}
            >
              <AppText className="text-[12px] font-semibold text-text-quaternary-dark">
                Max: {maxBalance}
              </AppText>
            </AppButton>
          </View>

          <View className="h-12 px-3 rounded-xl border border-border-primary-dark/70 bg-bg-quaternary-dark/80 flex-row items-center">
            <TextInput
              value={amount}
              onChangeText={handleAmountChange}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor="#64748b"
              className="flex-1 text-text-primary-dark font-mono"
              editable={!isPending && !isConfirming}
            />
            <AppText className="text-[12px] text-text-octonary-dark font-semibold">
              USDC
            </AppText>
          </View>
        </View>

        {status ? (
          <View className="rounded-xl border border-blue-500/25 bg-blue-500/10 px-3 py-2.5">
            <AppText className="text-[12px] text-blue-300">{status}</AppText>
          </View>
        ) : null}

        {belowMinimum ? (
          <View className="rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2.5">
            <AppText className="text-[12px] text-red-300">
              Minimum deposit: 5 USDC
            </AppText>
          </View>
        ) : null}

        {exceedsBalance ? (
          <View className="rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2.5">
            <AppText className="text-[12px] text-red-300">
              Insufficient balance. You have {maxBalance} USDC available.
            </AppText>
          </View>
        ) : null}

        <AppButton
          variant={VARIANT_TYPES.NOT_SELECTED}
          isDisabled={
            !address ||
            !isValidAmount ||
            isPending ||
            isConfirming ||
            isSwitchingChain
          }
          onPress={handleDeposit}
          className={
            !address ||
            !isValidAmount ||
            isPending ||
            isConfirming ||
            isSwitchingChain
              ? "h-11 rounded-xl bg-bg-quaternary-dark border border-border-primary-dark/60 items-center justify-center"
              : "h-11 rounded-xl bg-bg-senary-dark border border-[#78f39a]/45 items-center justify-center"
          }
        >
          {isPending || isConfirming || isSwitchingChain ? (
            <ActivityIndicator size="small" color="#FFFFFF" className="mr-2" />
          ) : null}
          <AppText
            className={
              !address ||
              !isValidAmount ||
              isPending ||
              isConfirming ||
              isSwitchingChain
                ? "text-[14px] font-semibold text-text-octonary-dark"
                : "text-[14px] font-semibold text-black"
            }
          >
            {isSwitchingChain
              ? "Switching Network..."
              : isPending
                ? "Waiting for Wallet..."
                : isConfirming
                  ? "Confirming..."
                  : chainId !== DEFAULT_CHAIN_ID
                    ? `Switch to ${chainName}`
                    : "Deposit"}
          </AppText>
        </AppButton>
      </View>
    </AppModal>
  );
};

export default DepositModal;
