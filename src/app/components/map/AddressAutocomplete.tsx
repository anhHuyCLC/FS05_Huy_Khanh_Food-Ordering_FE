import { useState, useEffect, useRef } from "react";
import { Search, MapPin, Navigation, Loader2, X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../stores/store";
import { fetchAutocompleteSuggestions, detectCurrentLocation } from "../../features/mapThunk";
import {
  selectAutocompleteSuggestions,
  selectMapLoading,
  selectSelectedAddress,
} from "../../features/mapSelectors";
import { setSelectedAddress, clearSuggestions } from "../../features/mapSlice";
import { toast } from "sonner";

interface AddressAutocompleteProps {
  placeholder?: string;
  onSelectAddress?: (address: { address: string; lat: number; lng: number }) => void;
  className?: string;
}

export default function AddressAutocomplete({
  placeholder = "Nhập địa chỉ giao hàng...",
  onSelectAddress,
  className = "",
}: AddressAutocompleteProps) {
  const dispatch = useAppDispatch();
  const suggestions = useAppSelector(selectAutocompleteSuggestions);
  const loading = useAppSelector(selectMapLoading);
  const selectedAddress = useAppSelector(selectSelectedAddress);

  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initialize input query if selectedAddress exists
  useEffect(() => {
    if (selectedAddress) {
      setQuery(selectedAddress.address);
    }
  }, [selectedAddress]);

  // Debounced search trigger
  useEffect(() => {
    if (!query.trim() || (selectedAddress && query === selectedAddress.address)) {
      dispatch(clearSuggestions());
      return;
    }

    const timer = setTimeout(() => {
      dispatch(fetchAutocompleteSuggestions(query));
    }, 400);

    return () => clearTimeout(timer);
  }, [query, dispatch, selectedAddress]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleSelect = (item: { address: string; lat: number; lng: number }) => {
    setQuery(item.address);
    dispatch(setSelectedAddress(item));
    dispatch(clearSuggestions());
    setIsOpen(false);
    if (onSelectAddress) {
      onSelectAddress(item);
    }
  };

  const handleLocateMe = async () => {
    try {
      const res = await dispatch(detectCurrentLocation()).unwrap();
      toast.success("Đã tìm thấy vị trí của bạn!");
      if (onSelectAddress) {
        onSelectAddress(res.addressInfo);
      }
    } catch (err: any) {
      toast.error(err || "Lỗi định vị. Vui lòng thử lại.");
    }
  };

  const handleClear = () => {
    setQuery("");
    dispatch(setSelectedAddress(null));
    dispatch(clearSuggestions());
    setIsOpen(false);
  };

  return (
    <div className={`relative w-full z-50 ${className}`} ref={dropdownRef}>
      {/* Search Input Box */}
      <div className="flex items-center gap-2 bg-white rounded-2xl border border-gray-100 shadow-md p-2 transition-all focus-within:border-orange-200 focus-within:ring-4 focus-within:ring-orange-50">
        <Search className="w-5 h-5 text-gray-400 ml-2 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="flex-1 bg-transparent border-none outline-none text-sm text-gray-800 placeholder-gray-400 py-1"
        />

        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="w-px h-6 bg-gray-200 shrink-0" />

        <button
          type="button"
          onClick={handleLocateMe}
          disabled={loading.location}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 text-[#FF4500] hover:bg-orange-100 disabled:bg-gray-50 disabled:text-gray-400 text-xs font-bold transition-all shrink-0 cursor-pointer"
        >
          {loading.location ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Navigation className="w-3.5 h-3.5" />
          )}
          <span>Định vị</span>
        </button>
      </div>

      {/* Suggestion Dropdown */}
      {isOpen && (suggestions.length > 0 || loading.autocomplete) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-[1000] animate-in fade-in slide-in-from-top-2 duration-200">
          {loading.autocomplete ? (
            <div className="flex items-center justify-center py-6 gap-2 text-sm text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin text-[#FF4500]" />
              <span>Đang tìm địa chỉ...</span>
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto divide-y divide-gray-50">
              {suggestions.map((item, idx) => (
                <button
                  key={`${item.address}-${idx}`}
                  type="button"
                  onClick={() => handleSelect(item)}
                  className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-orange-50/50 transition-colors cursor-pointer group"
                >
                  <MapPin className="w-4 h-4 text-gray-400 group-hover:text-[#FF4500] mt-0.5 shrink-0 transition-colors" />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors truncate">
                    {item.address}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
