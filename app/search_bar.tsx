import React, { useEffect, useRef, useState } from "react";
import { getOrderOptions, getFamilyOptions, getSearchOptions } from "./actions";

type DatabaseOrders = Awaited<ReturnType<typeof getOrderOptions>>;
type DatabaseFamilies = Awaited<ReturnType<typeof getFamilyOptions>>;
type DatabaseSearchOptions = Awaited<ReturnType<typeof getSearchOptions>>;

type SearchBarProps = {
  changeSpecies: (id: number) => void;
  nameLang: string;
};

const SearchBar = (props: SearchBarProps) => {
  const [searchInput, setSearchInput] = useState<string>('');
  const [filterOptions, setFilterOptions] = useState<DatabaseSearchOptions>([]);
  const [orderOptionsLoaded, setOrderOptionsLoaded] = useState<boolean>(false);
  const [orderOptions, setOrderOptions] = useState<DatabaseOrders>([]);
  const [selectedOrder, setSelectedOrder] = useState<number>(-1);
  const [familyOptionsLoaded, setFamilyOptionsLoaded] = useState<boolean>(false);
  const [familyOptions, setFamilyOptions] = useState<DatabaseFamilies>([]);
  const [showFilterOptions, setShowFilterOptions] = useState<boolean>(true);
  const [selectedFamily, setSelectedFamily] = useState<number>(-1);
  const searchInputRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    getOrderOptions().then((orders) => {
      setOrderOptions(orders);
      setOrderOptionsLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (selectedOrder === -1) return;

    getFamilyOptions(selectedOrder).then((families) => {
      setFamilyOptions(families);
      setFamilyOptionsLoaded(true);
    });
  }, [selectedOrder]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (searchInputRef.current && target && !searchInputRef.current.contains(target)) {
        setShowFilterOptions(false);
      } else {
        setShowFilterOptions(true);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const searchValue = searchInput.trim();
    if (searchValue === '') {
      return;
    }

    const timeoutId = setTimeout(() => {
      getSearchOptions(
        searchValue,
        props.nameLang,
        selectedOrder === -1 ? undefined : selectedOrder,
        selectedFamily === -1 ? undefined : selectedFamily
      ).then((species) => {
        setFilterOptions(species);
      });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchInput, selectedOrder, selectedFamily, props.nameLang]);

  const listFilterOptions = () => {
    if (!showFilterOptions || searchInput === '' || filterOptions.length === 0)
      return null;

    return (
      <div className="search-filter">
        <ul>
          {filterOptions.map((opt) => (
            <li key={`bird-opt-${opt.id}`}>
              <div
                className="search-filter-item"
                title="Add to comparison"
                onMouseUp={() => props.changeSpecies(opt.id)}
              >
                {opt.names[0]
                  ? `${opt.names[0].name} (${opt.scientificName})`
                  : opt.scientificName
                }
                <div className="select-button">+</div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderSpinner = (label: string) => (
    <div className="spinner-container">
      <span className="search-spinner" role="status" aria-label={label} />
    </div>
  );

  const renderOrderDropdown = () => {
    if (!orderOptionsLoaded) {
      return renderSpinner('Loading orders');
    }

    return(
      <select
        value={selectedOrder}
        onChange={(e) => {
          const orderValue = e.target.value;
          const orderId = orderValue === '' ? -1 : Number(orderValue);
          setFamilyOptionsLoaded(false);
          setSelectedOrder(orderId);
          setFilterOptions([]);
        }}
      >
          <option value="-1">All orders</option>
          {orderOptions.map((o) => (
            <option key={`order-option-${o.id}`} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
    );
  }

  const renderFamilyDropdown = () => {
    if (selectedOrder !== -1 && !familyOptionsLoaded) {
      return renderSpinner('Loading families');
    }

    return(
      <select
        value={selectedFamily}
        disabled={selectedOrder === -1}
        onChange={(e) => {
          const familyValue = e.target.value;
          const familyId = familyValue === '' ? -1 : Number(familyValue);
          setSelectedFamily(familyId);
            setFilterOptions([]);
        }}
      >
          <option value="-1">All families</option>
          {familyOptions.map((f) => (
            <option key={`family-option-${f.id}`} value={f.id}>
              {f.name}
            </option>
        ))}
      </select>
    );
  };

  return (
    <div className="search-widget">
      <div className="dropdown-container">
        <div className="search-dropdown">
          {renderOrderDropdown()}
        </div>
        <div className="search-dropdown">
          {renderFamilyDropdown()}
        </div>
      </div>
      <div className="search-input" ref={searchInputRef}>
        <input
          type="text"
          placeholder="Search for a species..."
          value={searchInput}
          onChange={(e) => {
            const v = e.target.value;
            setSearchInput(v);
            setFilterOptions([]);
          }}
        />
        {listFilterOptions()}
      </div>
    </div>
  );
};

export default SearchBar;