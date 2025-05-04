import React, { createContext, useState, useContext } from 'react';

const WatchlistContext = createContext();

export const WatchlistProvider = ({ children }) => {
  const [watchlistedNfts, setWatchlistedNfts] = useState(new Set());

  const addToWatchlist = (nftId) => {
    setWatchlistedNfts(prev => {
      const updated = new Set(prev);
      updated.add(nftId);
      return updated;
    });
  };

  const removeFromWatchlist = (nftId) => {
    setWatchlistedNfts(prev => {
      const updated = new Set(prev);
      updated.delete(nftId);
      return updated;
    });
  };

  const isInWatchlist = (nftId) => {
    return watchlistedNfts.has(nftId);
  };

  const value = {
    watchlistedNfts,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist
  };

  return (
    <WatchlistContext.Provider value={value}>
      {children}
    </WatchlistContext.Provider>
  );
};

export const useWatchlist = () => {
  const context = useContext(WatchlistContext);
  if (context === undefined) {
    throw new Error('useWatchlist must be used within a WatchlistProvider');
  }
  return context;
}; 