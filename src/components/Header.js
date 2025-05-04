import React from 'react';
import '../App.css';

const Header = ({ 
  activeChain, 
  setActiveChain, 
  connectPhantom, 
  connectSolflare, 
  activeTab, 
  setActiveTab,
  walletConnected,
  walletAddress,
  disconnectWallet
}) => {
  const handleChainChange = (chain) => {
    setActiveChain(chain);
  };
  
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };
  
  // Function to truncate wallet address
  const truncateAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };
  
  return (
    <div className="hypeflow-header">
      {/* Top navigation bar */}
      <div className="top-nav">
        {/* Logo and wallet buttons row */}
        <div className="logo-wallet-row">
          <div className="logo">
            <h2 className="hypeflow-title">HypeFlow</h2>
          </div>
          
          <div className="wallet-buttons">
            {walletConnected ? (
              <div className="wallet-connected">
                <span className="wallet-address">{truncateAddress(walletAddress)}</span>
                <button className="disconnect-btn" onClick={disconnectWallet}>
                  <span>Disconnect</span>
                </button>
              </div>
            ) : (
              <>
                <button className="wallet-btn phantom-btn" onClick={connectPhantom}>
                  <svg className="phantom-icon" width="16" height="16" viewBox="0 0 128 128" fill="none">
                    <rect width="128" height="128" rx="64" fill="white"/>
                    <path d="M110.584 64.9142H99.142C99.142 41.7651 80.173 23 56.7724 23C33.753 23 15 41.4108 15 64.9142C15 88.4176 33.753 106.828 56.7724 106.828H110.584V64.9142Z" fill="#534BB1"/>
                    <path d="M98.8503 71.7538C98.8503 67.7163 95.5208 64.5 91.3615 64.5C87.2021 64.5 83.8726 67.7163 83.8726 71.7538C83.8726 75.7913 87.2021 79.0076 91.3615 79.0076H98.8503V71.7538Z" fill="#FFFFFF"/>
                  </svg>
                  <span>Phantom</span>
                </button>
                <button className="wallet-btn solflare-btn" onClick={connectSolflare}>
                  <svg className="solflare-icon" width="16" height="16" viewBox="0 0 96 96" fill="none">
                    <circle cx="48" cy="48" r="48" fill="url(#paint0_linear_solflare)"/>
                    <path fillRule="evenodd" clipRule="evenodd" d="M47.8696 77.2H29L49.4783 16H68.3478L47.8696 77.2Z" fill="white"/>
                    <defs>
                    <linearGradient id="paint0_linear_solflare" x1="0" y1="0" x2="96" y2="96" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#FE9426"/>
                    <stop offset="1" stopColor="#FD4826"/>
                    </linearGradient>
                    </defs>
                  </svg>
                  <span>Solflare</span>
                </button>
              </>
            )}
          </div>
        </div>
        
        {/* Chain selector row */}
        <div className="chain-selector-row">
          <div className="chain-selector">
            <button 
              className={`chain-btn ${activeChain === 'all' ? 'active' : ''}`}
              onClick={() => handleChainChange('all')}
            >
              <span>All Chain</span>
              <svg className="filter-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M1 3h14v2H1V3zm2 4h10v2H3V7zm3 4h4v2H6v-2z"/>
              </svg>
            </button>
            <button 
              className={`chain-btn ${activeChain === 'eth' ? 'active' : ''}`}
              onClick={() => handleChainChange('eth')}
            >
              <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
                <path d="M16 32C24.8366 32 32 24.8366 32 16C32 7.16344 24.8366 0 16 0C7.16344 0 0 7.16344 0 16C0 24.8366 7.16344 32 16 32Z" fill="#627EEA"/>
                <path d="M16.498 4V12.87L23.995 16.219L16.498 4Z" fill="white" fillOpacity="0.6"/>
                <path d="M16.498 4L9 16.219L16.498 12.87V4Z" fill="white"/>
                <path d="M16.498 21.968V27.995L24 17.616L16.498 21.968Z" fill="white" fillOpacity="0.6"/>
                <path d="M16.498 27.995V21.967L9 17.616L16.498 27.995Z" fill="white"/>
                <path d="M16.498 20.573L23.995 16.219L16.498 12.872V20.573Z" fill="white" fillOpacity="0.2"/>
                <path d="M9 16.219L16.498 20.573V12.872L9 16.219Z" fill="white" fillOpacity="0.6"/>
              </svg>
            </button>
            <button 
              className={`chain-btn ${activeChain === 'sol' ? 'active' : ''}`}
              onClick={() => handleChainChange('sol')}
            >
              <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="16" fill="#000000"/>
                <path d="M9.042 20.773L6 23.5h15.4c0.39 0 0.76-0.206 0.962-0.566l2.132-3.207c0.235-0.36 0.235-0.824 0-1.184l-2.132-3.207c-0.202-0.36-0.572-0.566-0.961-0.566h-10.4l2.677 2.677h6.958l1.348 1.773-1.348 1.773H9.79l-0.748-0.22z" fill="url(#paint0_linear_sol)"/>
                <path d="M12.6 12.227l-2.132-2.132H6c-0.39 0-0.76 0.206-0.962 0.566L2.906 13.87c-0.235 0.36-0.235 0.824 0 1.184l2.132 3.207c0.202 0.36 0.572 0.566 0.962 0.566h10.4l-2.677-2.677H6.042L4.694 14.377l1.348-1.773H15.277l0.844 0.432 2.132-2.132H9.79" fill="url(#paint1_linear_sol)"/>
                <defs>
                  <linearGradient id="paint0_linear_sol" x1="6" y1="17.5" x2="24.5" y2="17.5" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#9945FF"/>
                    <stop offset="1" stopColor="#14F195"/>
                  </linearGradient>
                  <linearGradient id="paint1_linear_sol" x1="2.5" y1="14.5" x2="18.5" y2="14.5" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#9945FF"/>
                    <stop offset="1" stopColor="#14F195"/>
                  </linearGradient>
                </defs>
              </svg>
            </button>
          </div>
        </div>
        
        {/* Action buttons row */}
        <div className="action-buttons-row">
          <div className="action-buttons">
            <button className="action-btn categories-btn active">
              <svg className="categories-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M1 2h14v2H1V2zm0 5h14v2H1V7zm0 5h14v2H1v-2z"/>
              </svg>
              <span>Categories</span>
            </button>
            <button className="action-btn">
              <span>Boost</span>
            </button>
            <button className="action-btn">
              <span>Tools</span>
            </button>
            <button className="action-btn">
              <span>Apply</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Tab navigation */}
      <div className="tabs-nav">
        <button 
          className={`tab-btn ${activeTab === 'trending' ? 'active' : ''}`}
          onClick={() => handleTabChange('trending')}
        >
          Trending
        </button>
        <button 
          className={`tab-btn ${activeTab === 'new-creations' ? 'active' : ''}`}
          onClick={() => handleTabChange('new-creations')}
        >
          New Creations
        </button>
        <button 
          className={`tab-btn ${activeTab === 'gradually' ? 'active' : ''}`}
          onClick={() => handleTabChange('gradually')}
        >
          Gradually
        </button>
        <button 
          className={`tab-btn ${activeTab === 'minted-out' ? 'active' : ''}`}
          onClick={() => handleTabChange('minted-out')}
        >
          Minted Out
        </button>
        <button 
          className={`tab-btn ${activeTab === 'watchlist' ? 'active' : ''}`}
          onClick={() => handleTabChange('watchlist')}
        >
          Watchlist
        </button>
      </div>
    </div>
  );
};

export default Header; 