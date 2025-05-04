import React, { useEffect, useState } from 'react';
import NFTGallery from './components/NFTGallery';
import Header from './components/Header';
import nftService from './services/nftService';
import { WatchlistProvider } from './context/WatchlistContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);
  const [darkMode] = useState(true); // Removed setDarkMode since it's not used
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [activeChain, setActiveChain] = useState('all');
  const [hasNFTs, setHasNFTs] = useState(false);
  const [activeTab, setActiveTab] = useState('trending');

  useEffect(() => {
    // Apply dark mode class to body when component mounts or darkMode changes
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }

    return () => {
      document.body.classList.remove('dark-mode');
    };
  }, [darkMode]);

  useEffect(() => {
    const initService = async () => {
      try {
        const success = await nftService.initialize();
        setIsInitialized(success);
        if (!success) {
          setError("Failed to initialize Solana NFT tracking service");
        } else {
          // Check if there are any NFTs after initialization
          const initialNfts = nftService.getAllNFTs();
          setHasNFTs(initialNfts.length > 0);
          
          // Listen for new NFTs
          nftService.addListener(() => {
            setHasNFTs(true);
          });
        }
      } catch (err) {
        console.error('Error initializing NFT service:', err);
        setError("Error initializing Solana NFT tracking service: " + err.message);
      }
    };

    initService();

    // Cleanup on component unmount
    return () => {
      nftService.cleanup();
    };
  }, []);

  const connectPhantom = async () => {
    try {
      // Check if Phantom is available
      if (window.phantom && window.phantom.solana) {
        try {
          // Check if already connected
          if (window.phantom.solana.isConnected) {
            // Already connected, just get the address
            const publicKey = window.phantom.solana.publicKey;
            if (publicKey) {
              setWalletAddress(publicKey.toString());
              setWalletConnected(true);
              console.log("Connected to Phantom wallet:", publicKey.toString());
              return;
            }
          }
          
          // Not connected, request connection
          console.log("Requesting Phantom connection...");
          const resp = await window.phantom.solana.connect();
          console.log("Phantom connection response:", resp);
          
          if (resp && resp.publicKey) {
            setWalletAddress(resp.publicKey.toString());
            setWalletConnected(true);
            console.log("Connected to Phantom wallet:", resp.publicKey.toString());
          }
        } catch (connectionError) {
          console.error("Error in Phantom connection process:", connectionError);
          // User rejected the connection request or other error
          if (connectionError.code === 4001) {
            alert("Connection to Phantom wallet was rejected by user.");
          } else {
            alert("Error connecting to Phantom wallet. Please try again.");
          }
        }
      } else {
        console.log("Phantom wallet not detected");
        alert("Phantom wallet not found. Please install the Phantom extension.");
      }
    } catch (error) {
      console.error("Unexpected error connecting to Phantom wallet:", error);
      alert("Error connecting to Phantom wallet. Please try again.");
    }
  };

  const connectSolflare = async () => {
    try {
      // Check if Solflare is available
      if (window.solflare && window.solflare.isConnected) {
        await window.solflare.disconnect();
      }
      
      if (window.solflare && !window.solflare.isConnected) {
        await window.solflare.connect();
        
        if (window.solflare.publicKey) {
          const address = window.solflare.publicKey.toString();
          setWalletAddress(address);
          setWalletConnected(true);
          console.log("Connected to Solflare wallet:", address);
        }
      } else {
        alert("Solflare wallet not found. Please install the Solflare extension.");
      }
    } catch (error) {
      console.error("Error connecting to wallet:", error);
      alert("Error connecting to wallet. Please try again.");
    }
  };

  const disconnectWallet = async () => {
    try {
      if (window.solflare && window.solflare.isConnected) {
        await window.solflare.disconnect();
      }
      if (window.phantom?.solana && window.phantom.solana.isConnected) {
        await window.phantom.solana.disconnect();
      }
      setWalletConnected(false);
      setWalletAddress('');
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
    }
  };

  const refreshNFTs = () => {
    // Show a loading state temporarily
    setHasNFTs(false);
    
    // Try to fetch new real NFTs from the server
    setTimeout(async () => {
      try {
        // Request the server to fetch fresh data
        const success = await nftService.refreshRealNFTs();
        
        // Check if we have any NFTs now
        const currentNfts = nftService.getAllNFTs();
        setHasNFTs(currentNfts.length > 0);
        
        if (!currentNfts.length && !success) {
          console.log("No real NFTs found from the server");
        }
      } catch (error) {
        console.error("Error refreshing NFTs:", error);
      }
    }, 1500);
  };

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Error!</h4>
          <p>{error}</p>
          <hr />
          <p className="mb-0">
            Please check your internet connection and make sure the backend server is running.
          </p>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Initializing Solana NFT tracker...</p>
      </div>
    );
  }

  return (
    <WatchlistProvider>
      <div className="App dark-mode">
        <Header 
          activeChain={activeChain}
          setActiveChain={setActiveChain}
          connectPhantom={connectPhantom}
          connectSolflare={connectSolflare}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          walletConnected={walletConnected}
          walletAddress={walletAddress}
          disconnectWallet={disconnectWallet}
        />
        
        <main className="nft-content-area">
          <div className="container mt-4">
            {hasNFTs ? (
              <NFTGallery 
                activeTab={activeTab} 
                walletConnected={walletConnected}
                walletAddress={walletAddress}
                connectPhantom={connectPhantom}
                connectSolflare={connectSolflare}
                disconnectWallet={disconnectWallet}
              />
            ) : (
              <div className="empty-state-container">
                <div className="empty-state">
                  <div className="empty-icon">
                    <i className="fas fa-search"></i>
                  </div>
                  <h2>No NFTs Found</h2>
                  <p>We couldn't find any real NFTs to display at this time. Try connecting your wallet or check back later.</p>
                  <button className="refresh-button" onClick={refreshNFTs}>
                    <i className="fas fa-sync-alt"></i> Check for NFTs
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
        <footer className="app-footer">
          © 2025 HypeFlow. All rights reserved.
        </footer>
      </div>
    </WatchlistProvider>
  );
}

export default App; 