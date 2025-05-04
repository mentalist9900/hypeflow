import React, { useState, useEffect } from 'react';
import NFTCard from './NFTCard';
import nftService from '../services/nftService';
import { useWatchlist } from '../context/WatchlistContext';
import { WalletContext } from './NFTCard';

const NFTGallery = ({ activeTab, walletConnected, walletAddress, connectPhantom, connectSolflare, disconnectWallet }) => {
  const [nfts, setNfts] = useState([]);
  const [newNftIds, setNewNftIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const { watchlistedNfts } = useWatchlist();
  
  useEffect(() => {
    // Get initial NFTs
    const initialNfts = nftService.getAllNFTs();
    setNfts(initialNfts);
    setLoading(initialNfts.length === 0);
    
    // Subscribe to new NFT events
    const listenerId = nftService.addListener((newNft) => {
      setNfts(prevNfts => [newNft, ...prevNfts]);
      setLoading(false);
      
      // Mark as new for animation/highlighting
      setNewNftIds(prev => {
        const updated = new Set(prev);
        updated.add(newNft.id);
        return updated;
      });
      
      // Remove "new" status after 30 seconds
      setTimeout(() => {
        setNewNftIds(prev => {
          const updated = new Set(prev);
          updated.delete(newNft.id);
          return updated;
        });
      }, 30000);
    });
    
    // Cleanup on unmount
    return () => {
      nftService.removeListener(listenerId);
    };
  }, []);
  
  // Filter NFTs based on active tab
  const filteredNfts = nfts.filter(nft => {
    // Apply tab filter
    switch (activeTab) {
      case 'trending':
        // For demo, we'll consider NFTs with price as trending
        return nft.price !== null;
      case 'new-creations':
        // Recently created - within the last hour
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        return new Date(nft.createdAt) > oneHourAgo;
      case 'gradually':
        // NFTs that are gradually minting (not fully minted out)
        // This is a mock implementation - in a real app you'd have mint progress data
        return newNftIds.has(nft.id);
      case 'minted-out':
        // For this demo, consider older NFTs (created more than a day ago) as minted out
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return new Date(nft.createdAt) < oneDayAgo;
      case 'watchlist':
        // Use watchlistedNfts set to determine if an NFT is in the watchlist
        return watchlistedNfts.has(nft.id);
      default:
        return true;
    }
  });
  
  if (loading) {
    return (
      <div className="loading-container text-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <h5 className="mt-3">Scanning the Solana blockchain...</h5>
        <p className="text-muted">Waiting for NFTs to be detected</p>
      </div>
    );
  }
  
  return (
    <WalletContext.Provider value={{ 
      walletConnected, 
      walletAddress, 
      connectPhantom, 
      connectSolflare, 
      disconnectWallet 
    }}>
      {/* Display NFTs or empty state - The empty state is now handled in App.js */}
      {filteredNfts.length > 0 && (
        <div className="nft-grid">
          {filteredNfts.map(nft => (
            <NFTCard 
              key={`${nft.contract}-${nft.tokenId}`} 
              nft={nft} 
              isNew={newNftIds.has(nft.id)}
            />
          ))}
        </div>
      )}
    </WalletContext.Provider>
  );
};

export default NFTGallery; 