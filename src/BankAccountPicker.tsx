// db/BankAccountPicker.tsx
import { useState, useEffect, useRef, useCallback } from "react";
import { WalletDB } from "./index";

interface Bank {
  name: string;
  code: string;
}
export interface ResolvedAccount {
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
}

export function BankAccountPicker({
  onResolved,
}: {
  onResolved: (r: ResolvedAccount | null) => void;
}) {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [bankQuery, setBankQuery] = useState("");
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [accountNumber, setAccountNumber] = useState("");
  const [resolvedName, setResolvedName] = useState("");
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState("");
  const [loadingBanks, setLoadingBanks] = useState(true);
  const [bankError, setBankError] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoadingBanks(true);
    setBankError("");
    WalletDB.listBanks()
      .then((data) => {
        console.log("Banks loaded:", data);
        setBanks(data);
        if (!data || data.length === 0) {
          setBankError(
            "No banks available. Check console for details or contact support.",
          );
        }
      })
      .catch((err) => {
        const msg = err.message || "Failed to load banks";
        setBankError(msg);
        console.error("❌ BankAccountPicker error:", msg, err);
      })
      .finally(() => setLoadingBanks(false));
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node))
        setShowDropdown(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const filtered = banks.filter((b) =>
    b.name.toLowerCase().includes(bankQuery.toLowerCase()),
  );

  const resolve = useCallback(
    async (num: string, bank: Bank) => {
      setResolving(true);
      setError("");
      setResolvedName("");
      onResolved(null);
      try {
        const name = await WalletDB.resolveAccount(num, bank.code);
        setResolvedName(name);
        onResolved({
          bankName: bank.name,
          bankCode: bank.code,
          accountNumber: num,
          accountName: name,
        });
      } catch (e: any) {
        setError(e.message || "Couldn't verify this account number");
      } finally {
        setResolving(false);
      }
    },
    [onResolved],
  );

  useEffect(() => {
    clearTimeout(timer.current);
    if (accountNumber.length === 10 && selectedBank) {
      timer.current = setTimeout(
        () => resolve(accountNumber, selectedBank),
        400,
      );
    } else {
      setResolvedName("");
      onResolved(null);
    }
    return () => clearTimeout(timer.current);
  }, [accountNumber, selectedBank, resolve, onResolved]);

  const inp =
    "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-[#C9A96E] focus:ring-2 focus:ring-[#C9A96E]/10 transition-all bg-white";
  const lbl =
    "block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5";

  return (
    <div className="space-y-4">
      <div className="relative" ref={boxRef}>
        <label className={lbl}>Bank</label>
        <input
          className={inp}
          value={selectedBank ? selectedBank.name : bankQuery}
          onChange={(e) => {
            setSelectedBank(null);
            setBankQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder="Search for your bank…"
        />
        {showDropdown && (
          <div className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-xl">
            {loadingBanks ? (
              <div className="px-4 py-3 text-center">
                <p className="text-xs text-gray-400 flex items-center justify-center gap-2">
                  <span className="w-3 h-3 border border-[#C9A96E]/40 border-t-[#C9A96E] rounded-full animate-spin" />
                  Loading banks…
                </p>
              </div>
            ) : bankError ? (
              <div className="px-4 py-3">
                <p className="text-xs text-red-500">{bankError}</p>
              </div>
            ) : filtered.length > 0 ? (
              filtered.map((b) => (
                <button
                  type="button"
                  key={b.code}
                  onClick={() => {
                    setSelectedBank(b);
                    setBankQuery(b.name);
                    setShowDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-amber-50"
                >
                  {b.name}
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-center">
                <p className="text-xs text-gray-400">
                  {bankQuery.trim() ? "No banks found" : "Type to search"}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        <label className={lbl}>Account Number</label>
        <input
          className={
            inp + (!selectedBank ? " bg-gray-50 cursor-not-allowed" : "")
          }
          value={accountNumber}
          onChange={(e) =>
            setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10))
          }
          disabled={!selectedBank}
          placeholder={
            selectedBank ? "10-digit account number" : "Select a bank first"
          }
        />
      </div>

      {resolving && (
        <p className="text-xs text-gray-400 flex items-center gap-2">
          <span className="w-3 h-3 border border-[#C9A96E]/40 border-t-[#C9A96E] rounded-full animate-spin" />
          Verifying account…
        </p>
      )}
      {resolvedName && !resolving && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
          <p className="text-[10px] text-emerald-600 uppercase tracking-wider font-bold mb-0.5">
            Account Name
          </p>
          <p className="text-sm font-bold text-emerald-700">{resolvedName}</p>
        </div>
      )}
      {error && !resolving && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
