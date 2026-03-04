import { AppButton } from "@/components/ui/app-button";
import { AppDropdown } from "@/components/ui/app-dropdown";
import AppModal from "@/components/ui/app-modal";
import { AppText } from "@/components/ui/app-text";
import { appToast } from "@/components/ui/app-toast";
import { infoClient } from "@/lib/clients/hyperliquid";
import { activeChain, walletKit } from "@/lib/clients/wallet";
import { HYPERLIQUID_API_URL } from "@/lib/config";
import { ENVIRONMENT, ENVIRONMENT_TYPES, VARIANT_TYPES } from "@/lib/constants";
import { useAccount } from "@reown/appkit-react-native";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, TextInput, View } from "react-native";
import { getAddress, recoverTypedDataAddress } from "viem";

type WithdrawModalProps = {
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

type ApiResponseState = { status: number; body: unknown } | null;

// Helper function to split hex signature into r, s, v components
function splitSignature(sigHex: `0x${string}` | string) {
  if (!sigHex || typeof sigHex !== "string")
    throw new Error("Invalid signature");

  const s = sigHex.startsWith("0x") ? sigHex.slice(2) : sigHex;

  if (s.length !== 130 && s.length !== 132) {
    // 65 bytes = 130 hex chars; sometimes v is 1 byte appended -> 132 (with 0x)
    // We'll still try to parse if length matches 130.
  }

  const r = `0x${s.slice(0, 64)}` as `0x${string}`;
  const sPart = `0x${s.slice(64, 128)}` as `0x${string}`;
  let vHex = s.slice(128, 130);

  if (!vHex) {
    // fallback: last byte might be appended differently; try last 2 chars
    vHex = s.slice(-2);
  }

  let v = Number.parseInt(vHex, 16);

  // Some signers return 0/1; convert to 27/28 if necessary
  if (v === 0 || v === 1) v += 27;

  // Ensure v is 27 or 28 else keep original
  return { r, s: sPart, v };
}

const normalizeChainIdHex = (value: unknown): string | null => {
  if (typeof value === "string") {
    if (value.startsWith("0x")) return value.toLowerCase();
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed))
      return `0x${parsed.toString(16)}`.toLowerCase();
    return null;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return `0x${value.toString(16)}`.toLowerCase();
  }
  if (typeof value === "bigint") {
    return `0x${value.toString(16)}`.toLowerCase();
  }
  return null;
};

// network config - uses environment-based API URL
// Note: Both mainnet and testnet use the same API URL based on environment
// The actual network is determined by the chain ID used for signing
const NETWORK_CONFIG = {
  42161: {
    api: HYPERLIQUID_API_URL,
    hyperliquidChainString: "Mainnet",
    permitChainId: 42161,
    signatureChainIdHex: "0xa4b1",
  },
  421614: {
    api: HYPERLIQUID_API_URL,
    hyperliquidChainString: "Testnet",
    permitChainId: 421614,
    signatureChainIdHex: "0x66eee",
  },
};

export const WithdrawModal: React.FC<WithdrawModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { address: rawAddress, isConnected } = useAccount();
  const [walletAccountAddress, setWalletAccountAddress] = useState<
    string | undefined
  >();
  const [chainId, setChainId] = useState<number>(activeChain.id);

  const provider = (
    walletKit as unknown as { getProvider?: (ns: string) => unknown }
  ).getProvider?.("eip155") as Eip1193Provider | null;

  // Normalize address to checksummed format for consistency
  const connectedAddress = rawAddress ? getAddress(rawAddress) : undefined;
  // Use the wallet provider account address if available (this is what actually signs)
  // Otherwise fall back to connected address
  const signingAddress = walletAccountAddress
    ? getAddress(walletAccountAddress)
    : connectedAddress;
  // Use signing address for balance checks and operations
  const address = signingAddress;

  const targetChainId =
    ENVIRONMENT === ENVIRONMENT_TYPES.DEVELOPMENT ? 421614 : 42161;
  const cfg = NETWORK_CONFIG[targetChainId as 42161 | 421614];
  const chainDisplayName =
    ENVIRONMENT === ENVIRONMENT_TYPES.DEVELOPMENT
      ? "Arbitrum Sepolia"
      : "Arbitrum";

  const [amount, setAmount] = useState("");
  const [withdrawableBalance, setWithdrawableBalance] = useState<number | null>(
    null,
  );
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState("");
  const [apiResponse, setApiResponse] = useState<ApiResponseState>(null);
  const [selectedAsset, setSelectedAsset] = useState("USDC");
  const [selectedChain, setSelectedChain] = useState(
    ENVIRONMENT === ENVIRONMENT_TYPES.DEVELOPMENT
      ? "arbitrum-sepolia"
      : "arbitrum",
  );

  // Minimum withdrawal amount (2 USDC)
  const MIN_WITHDRAWAL_AMOUNT = 2;

  useEffect(() => {
    if (!provider || !isOpen) return;
    let mounted = true;

    (async () => {
      try {
        const accountsRaw = await provider.request({ method: "eth_accounts" });
        const accounts = Array.isArray(accountsRaw) ? accountsRaw : [];
        const first = typeof accounts[0] === "string" ? accounts[0] : undefined;
        if (mounted)
          setWalletAccountAddress(first ? getAddress(first) : undefined);
      } catch {
        if (mounted) setWalletAccountAddress(undefined);
      }

      try {
        const chainRaw = await provider.request({ method: "eth_chainId" });
        const chainHex = normalizeChainIdHex(chainRaw);
        const parsed = chainHex ? Number.parseInt(chainHex, 16) : Number.NaN;
        if (mounted && Number.isFinite(parsed)) setChainId(parsed);
      } catch {
        if (mounted) setChainId(activeChain.id);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [isOpen, provider]);

  useEffect(() => {
    if (!address || !isOpen) return;
    let mounted = true;
    (async () => {
      setIsLoadingBalance(true);
      try {
        const resp = await infoClient.webData2({ user: address });
        const withdrawable = resp?.clearinghouseState?.withdrawable;
        const num =
          typeof withdrawable === "number"
            ? withdrawable
            : typeof withdrawable === "string"
              ? Number.parseFloat(withdrawable)
              : null;
        if (mounted) setWithdrawableBalance(num);
      } catch (e) {
        console.error("webData2 error:", e);
        if (mounted) setWithdrawableBalance(null);
      } finally {
        if (mounted) setIsLoadingBalance(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [address, isOpen]);

  // Show warning if addresses don't match
  useEffect(() => {
    if (
      connectedAddress &&
      signingAddress &&
      connectedAddress.toLowerCase() !== signingAddress.toLowerCase()
    ) {
      console.warn("Address mismatch detected:", {
        connected: connectedAddress,
        signing: signingAddress,
      });
    }
  }, [connectedAddress, signingAddress]);

  const amountNum =
    amount && amount.trim() !== "" ? Number.parseFloat(amount) : 0;

  // Validation checks
  const exceedsBalance =
    withdrawableBalance !== null && amountNum > withdrawableBalance;
  const belowMinimum = amountNum > 0 && amountNum < MIN_WITHDRAWAL_AMOUNT;
  const isValidAmount = amountNum >= MIN_WITHDRAWAL_AMOUNT && !exceedsBalance;
  const hasBalance = withdrawableBalance !== null && withdrawableBalance > 0;

  const canSubmit =
    isConnected && address && isValidAmount && !isSubmitting && hasBalance;

  // Format balance for display
  const formattedBalance =
    withdrawableBalance !== null ? withdrawableBalance.toFixed(2) : "0.00";

  const hasApiResponse = useMemo(() => Boolean(apiResponse), [apiResponse]);

  async function handleWithdraw() {
    setStatus("");
    setApiResponse(null);

    if (!isConnected || !address) {
      appToast.error({ message: "Please connect your wallet first." });
      return;
    }

    // Final check: verify we have an injected provider
    if (!provider) {
      appToast.error({
        message: "Wallet client not available. Please reconnect your wallet.",
      });
      return;
    }

    let currentWalletAddress = address;
    try {
      const accountsRaw = await provider.request({ method: "eth_accounts" });
      const accounts = Array.isArray(accountsRaw) ? accountsRaw : [];
      const first = typeof accounts[0] === "string" ? accounts[0] : undefined;
      if (!first) {
        appToast.error({
          message: "Wallet client not available. Please reconnect your wallet.",
        });
        return;
      }
      currentWalletAddress = getAddress(first);
    } catch {
      appToast.error({
        message: "Wallet client not available. Please reconnect your wallet.",
      });
      return;
    }

    // Warn if there's a mismatch
    if (currentWalletAddress.toLowerCase() !== address.toLowerCase()) {
      console.warn(
        "Using wallet client account instead of connected account:",
        {
          connected: address,
          signing: currentWalletAddress,
        },
      );
      // Update address to the actual signing address
      // Note: We'll use currentWalletAddress for the destination
    }
    if (!amount || Number(amount) <= 0) {
      appToast.error({ message: "Enter a valid amount." });
      return;
    }

    // Minimum withdrawal check
    if (Number(amount) < MIN_WITHDRAWAL_AMOUNT) {
      appToast.error({
        message: `Minimum withdrawal is ${MIN_WITHDRAWAL_AMOUNT} USDC.`,
      });
      return;
    }

    // Balance check
    if (withdrawableBalance !== null && Number(amount) > withdrawableBalance) {
      appToast.error({
        message: `Requested amount exceeds withdrawable balance. Available: ${formattedBalance} USDC`,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Use milliseconds everywhere. DO NOT use BigInt here — use Number.
      const timeMs = Date.now(); // example: 1700000000000
      const nonce = timeMs;

      // signatureChainId is the chain id for EIP-712 domain (hex string like "0xa4b1")
      const signatureChainIdHex = `0x${chainId.toString(16)}`;

      // EIP-712 domain + types according to Hyperliquid docs
      const domain = {
        name: "HyperliquidSignTransaction",
        version: "1",
        chainId: chainId, // numeric chain id
        verifyingContract:
          "0x0000000000000000000000000000000000000000" as `0x${string}`,
      };

      const types = {
        // Primary type used by Hyperliquid for withdraw actions
        "HyperliquidTransaction:Withdraw": [
          { name: "hyperliquidChain", type: "string" },
          { name: "destination", type: "string" },
          { name: "amount", type: "string" }, // amount as USD string
          { name: "time", type: "uint64" }, // timestamp ms
        ],
      } as const;

      // Use the wallet account address for destination (the account that's actually signing)
      const actualSigningAddress = currentWalletAddress;

      // Use lowercase address for Hyperliquid API
      const destinationAddress = actualSigningAddress.toLowerCase();

      const message = {
        hyperliquidChain: cfg.hyperliquidChainString, // "Mainnet" or "Testnet"
        destination: destinationAddress,
        amount: amount.toString(),
        time: timeMs,
      };

      const typedDataPayload = {
        domain,
        primaryType: "HyperliquidTransaction:Withdraw",
        types: {
          EIP712Domain: [
            { name: "name", type: "string" },
            { name: "version", type: "string" },
            { name: "chainId", type: "uint256" },
            { name: "verifyingContract", type: "address" },
          ],
          "HyperliquidTransaction:Withdraw":
            types["HyperliquidTransaction:Withdraw"],
        },
        message,
      };

      setStatus("Requesting wallet signature (EIP-712)...");
      appToast.info({ message: "Please sign the withdrawal request..." });

      let signature: `0x${string}`;
      try {
        const signed = (await provider.request({
          method: "eth_signTypedData_v4",
          params: [actualSigningAddress, JSON.stringify(typedDataPayload)],
        })) as string;
        signature = signed as `0x${string}`;
      } catch (err: unknown) {
        const typedErr = err as {
          name?: string;
          code?: number;
          message?: string;
          shortMessage?: string;
        };
        const name = typedErr?.name || "";
        const code = typedErr?.code;
        const msg = typedErr?.message || typedErr?.shortMessage || "";
        const isUserReject =
          name === "UserRejectedRequestError" ||
          code === 4001 ||
          String(msg).toLowerCase().includes("user rejected");
        if (isUserReject) {
          appToast.error({ message: "Signature request was rejected." });
          setStatus("");
          setIsSubmitting(false);
          return;
        }
        throw err;
      }

      setStatus("Signature received, preparing POST to Hyperliquid API...");

      // Verify the signature was created by the expected signing account
      try {
        const recoveredAddress = await recoverTypedDataAddress({
          domain,
          types,
          primaryType: "HyperliquidTransaction:Withdraw",
          message,
          signature,
        } as Parameters<typeof recoverTypedDataAddress>[0]);

        // Check if recovered address matches the actual signing address
        if (
          recoveredAddress.toLowerCase() !== actualSigningAddress.toLowerCase()
        ) {
          const errorMsg = `Signature mismatch! Expected: ${actualSigningAddress.slice(0, 6)}...${actualSigningAddress.slice(-4)}, but signature is from: ${recoveredAddress.slice(0, 6)}...${recoveredAddress.slice(-4)}. Please switch to the correct account in your wallet.`;
          appToast.error({ message: errorMsg });
          setStatus(
            `Signature address mismatch. Expected: ${actualSigningAddress}, Got: ${recoveredAddress}. Please switch accounts in your wallet.`,
          );
          setIsSubmitting(false);
          return;
        }

        // Also check if it matches the connected address (for user info)
        if (
          recoveredAddress.toLowerCase() !== address.toLowerCase() &&
          address
        ) {
          console.warn("Signing account differs from connected account:", {
            connected: address,
            signing: recoveredAddress,
          });
        }
      } catch (recoverErr) {
        console.error("Failed to recover address from signature:", recoverErr);
        // Continue anyway, but log the error
      }

      // split into r, s, v without ethers
      const { r, s, v } = splitSignature(signature);

      // Construct action and top-level body per Hyperliquid /exchange spec
      const action = {
        type: "withdraw3",
        signatureChainId: signatureChainIdHex, // hex string like "0xa4b1"
        hyperliquidChain: cfg.hyperliquidChainString, // "Mainnet" or "Testnet"
        destination: destinationAddress,
        amount: amount.toString(),
        time: timeMs,
      };

      const body = {
        action,
        nonce: nonce,
        signature: { r, s, v },
      };

      // Send to Hyperliquid API
      setStatus("Submitting withdrawal request to Hyperliquid...");
      appToast.info({ message: "Submitting withdrawal request..." });

      const res = await fetch(cfg.api, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => null);
      setApiResponse({ status: res.status, body: data });

      // Handle responses
      if (!res.ok) {
        setStatus(
          `API error: ${res.status} ${res.statusText} ${data ? JSON.stringify(data) : ""}`,
        );
        appToast.error({
          message: `API error: ${res.status} ${res.statusText}`,
        });
        setIsSubmitting(false);
        return;
      }

      // Hyperliquid replies with { status: "ok", response: ... } or { status: "err", response: "msg" }
      if (data && (data as { status?: string }).status === "ok") {
        const successMsg =
          "Withdraw request submitted — check Hyperliquid UI for status (arrives in a few minutes).";
        appToast.success({ message: successMsg });
        setStatus(successMsg);

        // Fetch updated balances after successful withdrawal
        onSuccess?.();

        // Clear amount and close modal after successful withdrawal
        setAmount("");
        setTimeout(() => {
          setStatus("");
          setApiResponse(null);
          onClose();
        }, 2000);
        setIsSubmitting(false);
        return;
      } else if (data && (data as { status?: string }).status === "err") {
        const errorData = data as {
          response?: string;
          error?: string;
          message?: string;
        };

        // If server says nonce too low, that indicates you used seconds or a nonce older than last used.
        if (
          errorData.response &&
          typeof errorData.response === "string" &&
          errorData.response.toLowerCase().includes("nonce")
        ) {
          appToast.error({
            message: `Withdrawal failed: ${errorData.response}`,
          });
          setStatus(`Withdrawal failed: ${errorData.response}`);
          // Helpful hint for debugging:
          console.warn(
            "Nonce error. Ensure you use milliseconds (Date.now()) and that your nonce is larger than any previous nonce for this signer.",
          );
          setIsSubmitting(false);
          return;
        }

        const errMsg =
          errorData.response ||
          errorData.error ||
          errorData.message ||
          "Unknown error";
        setStatus(`Hyperliquid returned error: ${errMsg}`);

        // Check if error mentions an address that differs from connected address
        const errorStr = String(errMsg);
        const addressMatch = errorStr.match(/0x[a-fA-F0-9]{40}/i);
        if (addressMatch && address) {
          const errorAddress = addressMatch[0];
          const normalizedErrorAddress = getAddress(errorAddress);
          if (normalizedErrorAddress.toLowerCase() !== address.toLowerCase()) {
            console.error("Address mismatch detected:", {
              connected: address,
              errorAddress: normalizedErrorAddress,
              errorMessage: errMsg,
            });
            appToast.error({
              message: `Address mismatch: Connected wallet (${address.slice(0, 6)}...${address.slice(-4)}) differs from error address. Please check your wallet connection.`,
            });
            setStatus(
              `Address mismatch detected. Connected: ${address}, Error mentions: ${normalizedErrorAddress}. ${errMsg}`,
            );
            setIsSubmitting(false);
            return;
          }
        }

        appToast.error({ message: `Withdrawal failed: ${errorStr}` });
        setIsSubmitting(false);
        return;
      } else {
        // Unexpected response format
        setStatus(`Submitted. Response: ${JSON.stringify(data)}`);
        appToast.info({
          message: "Withdrawal submitted. Check status in Hyperliquid UI.",
        });
        setIsSubmitting(false);
        return;
      }
    } catch (err: unknown) {
      console.error("Withdrawal error:", err);
      const typedErr = err as {
        name?: string;
        code?: number;
        message?: string;
        shortMessage?: string;
      };
      const name = typedErr?.name || "";
      const code = typedErr?.code;
      const msg =
        typedErr?.message || typedErr?.shortMessage || "Withdraw failed";
      const isUserReject =
        name === "UserRejectedRequestError" ||
        code === 4001 ||
        String(msg).toLowerCase().includes("user rejected");
      if (isUserReject) {
        appToast.error({ message: "Signature request was rejected." });
        setStatus("");
      } else {
        appToast.error({ message: String(msg) });
        setStatus(String(msg));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title="Withdraw USDC"
      variant={VARIANT_TYPES.PRIMARY}
      closeOnOutsideClick
      showCloseButton
      contentClassName="gap-5"
    >
      <View className="gap-5">
        <View className="rounded-xl border border-border-primary-dark/55 bg-bg-quaternary-dark/60 px-3 py-2.5">
          <AppText className="text-[11px] text-text-tertiary-dark leading-4">
            USDC sent via {chainDisplayName}. Arrives within ~5 minutes.
          </AppText>
          <AppText className="text-[11px] text-text-octonary-dark mt-0.5 leading-4">
            A 1 USDC fee is deducted from the withdrawal.
          </AppText>
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1 gap-2">
            <AppText className="text-[11px] uppercase tracking-[0.6px] text-text-secondary-dark font-semibold">
              Asset
            </AppText>
            <AppDropdown
              options={[{ label: "USDC", value: "USDC" }]}
              value={selectedAsset}
              onChange={setSelectedAsset}
            />
          </View>
          <View className="flex-1 gap-2">
            <AppText className="text-[11px] uppercase tracking-[0.6px] text-text-secondary-dark font-semibold">
              Chain
            </AppText>
            <AppDropdown
              options={[{ label: chainDisplayName, value: selectedChain }]}
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
            {!isLoadingBalance && withdrawableBalance !== null ? (
              <AppButton
                variant={VARIANT_TYPES.NOT_SELECTED}
                onPress={() => {
                  const maxAmount = Math.floor(withdrawableBalance * 100) / 100;
                  setAmount(maxAmount.toFixed(2));
                }}
                className="px-0 py-0"
                isDisabled={isSubmitting || withdrawableBalance === null}
              >
                <AppText className="text-[12px] font-semibold text-text-quaternary-dark">
                  Max: {formattedBalance}
                </AppText>
              </AppButton>
            ) : null}
          </View>
          <View className="h-12 px-3 rounded-xl border border-border-primary-dark/70 bg-bg-quaternary-dark/80 flex-row items-center">
            <TextInput
              value={amount}
              onChangeText={(value) => {
                if (value === "") {
                  setAmount("");
                  return;
                }
                const regex = /^\d*\.?\d{0,2}$/;
                if (regex.test(value)) setAmount(value);
              }}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor="#64748b"
              className="flex-1 text-text-primary-dark font-mono"
              editable={!isSubmitting}
            />
            <AppText className="text-[12px] text-text-octonary-dark font-semibold">
              USDC
            </AppText>
          </View>
          <View className="flex-row items-center justify-between">
            <AppText className="text-[11px] text-text-octonary-dark">
              Available:{" "}
              {isLoadingBalance ? (
                <ActivityIndicator size="small" color="#6b7280" />
              ) : withdrawableBalance !== null ? (
                `${formattedBalance} USDC`
              ) : (
                "—"
              )}
            </AppText>
            <AppText className="text-[11px] text-text-octonary-dark">
              Min: {MIN_WITHDRAWAL_AMOUNT} USDC
            </AppText>
          </View>
        </View>

        {status ? (
          <View className="rounded-xl border border-blue-500/25 bg-blue-500/10 px-3 py-2.5">
            <AppText className="text-[12px] text-blue-300">{status}</AppText>
          </View>
        ) : null}

        {belowMinimum && amountNum > 0 ? (
          <View className="rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2.5">
            <AppText className="text-[12px] text-red-300">
              Minimum withdrawal: {MIN_WITHDRAWAL_AMOUNT} USDC
            </AppText>
          </View>
        ) : null}

        {exceedsBalance ? (
          <View className="rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2.5">
            <AppText className="text-[12px] text-red-300">
              Insufficient balance. You have {formattedBalance} USDC available.
            </AppText>
          </View>
        ) : null}

        {hasApiResponse ? (
          <View className="rounded-xl border border-border-primary-dark/60 bg-bg-quaternary-dark/80 px-3 py-2.5">
            <AppText className="text-[11px] text-text-tertiary-dark">
              Last API response: {apiResponse?.status ?? ""}{" "}
              {typeof apiResponse?.body === "string"
                ? apiResponse.body
                : JSON.stringify(apiResponse?.body)}
            </AppText>
          </View>
        ) : null}

        <AppButton
          variant={VARIANT_TYPES.NOT_SELECTED}
          isDisabled={!canSubmit}
          onPress={handleWithdraw}
          className={
            !canSubmit
              ? "h-11 rounded-xl bg-bg-quaternary-dark border border-border-primary-dark/60 items-center justify-center"
              : "h-11 rounded-xl bg-bg-senary-dark border border-[#78f39a]/45 items-center justify-center"
          }
        >
          <AppText
            className={
              !canSubmit
                ? "text-[14px] font-semibold text-text-octonary-dark"
                : "text-[14px] font-semibold text-black"
            }
          >
            {isSubmitting ? "Processing..." : `Withdraw to ${chainDisplayName}`}
          </AppText>
        </AppButton>
      </View>
    </AppModal>
  );
};

export default WithdrawModal;
