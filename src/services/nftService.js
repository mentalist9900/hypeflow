// This service connects to our backend server for real Solana NFT tracking
import axios from 'axios';

class NFTService {
  constructor() {
    this.nfts = [];
    this.listeners = [];
    this.isInitialized = false;
    this.pollingInterval = null;
    this.api = axios.create({
      baseURL: '/api',
      timeout: 10000,
    });
  }

  async initialize() {
    try {
      console.log("Initializing NFT service...");
      
      // Fetch any existing NFTs from backend
      const response = await this.api.get('/nfts');
      
      if (response.data) {
        // Filter out any fake or demo NFTs from initial load
        this.nfts = response.data.filter(nft => {
          // Ensure we have basic required data
          const hasRequiredData = nft && nft.id && nft.metadata && nft.metadata.name && nft.metadata.image;
          
          // Skip demo or example NFTs
          const isDemoOrExample = nft.id.startsWith('demo') || 
                                 nft.id.startsWith('example') || 
                                 (nft.metadata.name && 
                                  (nft.metadata.name.toLowerCase().includes('demo') || 
                                   nft.metadata.name.toLowerCase().includes('example')));
                                   
          return hasRequiredData && !isDemoOrExample;
        });
        
        console.log(`Initialized with ${this.nfts.length} real NFTs`);
      }
      
      this.isInitialized = true;
      
      // Start polling for updates
      this.startPolling();
      
      console.log("NFT service initialized successfully");
      return true;
    } catch (error) {
      console.error("Failed to initialize NFT service:", error);
      return false;
    }
  }

  async subscribeToNFTCollection(collectionAddress) {
    if (!this.isInitialized) {
      console.error("NFT service not initialized");
      return false;
    }

    try {
      console.log(`Subscribing to collection: ${collectionAddress}`);
      
      // Send subscription request to backend
      const response = await this.api.post('/collections/subscribe', {
        address: collectionAddress
      });
      
      if (response.data.success) {
        console.log(`Successfully subscribed to ${collectionAddress}`);
        return true;
      } else {
        console.error(`Failed to subscribe to ${collectionAddress}: ${response.data.error}`);
        return false;
      }
    } catch (error) {
      console.error(`Failed to subscribe to NFT collection ${collectionAddress}:`, error);
      return false;
    }
  }
  
  startPolling() {
    // Poll every 10 seconds to check for new NFTs
    this.pollingInterval = setInterval(async () => {
      await this.fetchLatestNFTs();
    }, 10000);
    
    console.log("Started polling for new NFTs");
  }
  
  async fetchLatestNFTs() {
    try {
      // Fetch latest NFTs from backend
      const response = await this.api.get('/nfts');
      
      if (!response.data) return;
      
      // Filter NFTs to ensure they are real
      const realNFTs = response.data.filter(nft => {
        // Ensure we have basic required data
        const hasRequiredData = nft && nft.id && nft.metadata && nft.metadata.name && nft.metadata.image;
        
        // Skip demo or example NFTs
        const isDemoOrExample = nft.id.startsWith('demo') || 
                               nft.id.startsWith('example') || 
                               (nft.metadata.name && 
                                (nft.metadata.name.toLowerCase().includes('demo') || 
                                 nft.metadata.name.toLowerCase().includes('example')));
                                 
        return hasRequiredData && !isDemoOrExample;
      });
      
      // Get new NFTs that we don't already have
      const currentIds = new Set(this.nfts.map(nft => nft.id));
      const newNFTs = realNFTs.filter(nft => !currentIds.has(nft.id));
      
      if (newNFTs.length > 0) {
        console.log(`Found ${newNFTs.length} new real NFTs`);
        
        // Add new NFTs to the beginning of our list
        this.nfts = [...newNFTs, ...this.nfts];
        
        // Notify listeners of each new NFT
        newNFTs.forEach(nft => this.notifyListeners(nft));
      }
    } catch (error) {
      console.error("Error fetching latest NFTs:", error);
    }
  }

  addListener(callback) {
    this.listeners.push(callback);
    return this.listeners.length - 1; // Return listener ID
  }

  removeListener(id) {
    if (id >= 0 && id < this.listeners.length) {
      this.listeners.splice(id, 1);
      return true;
    }
    return false;
  }

  notifyListeners(newNFT) {
    this.listeners.forEach(callback => {
      try {
        callback(newNFT);
      } catch (error) {
        console.error("Error in NFT listener callback:", error);
      }
    });
  }

  getAllNFTs() {
    return [...this.nfts];
  }
  
  // Function to check with the server for new real NFTs
  async refreshRealNFTs() {
    try {
      console.log("Requesting fresh NFT data from the server...");
      const response = await this.api.get('/nfts?refresh=true');
      
      if (response.data && Array.isArray(response.data)) {
        // Filter NFTs to ensure they are real
        const realNFTs = response.data.filter(nft => {
          // Ensure we have basic required data
          const hasRequiredData = nft && nft.id && nft.metadata && nft.metadata.name && nft.metadata.image;
          
          // Skip demo or example NFTs
          const isDemoOrExample = nft.id.startsWith('demo') || 
                                 nft.id.startsWith('example') || 
                                 (nft.metadata.name && 
                                  (nft.metadata.name.toLowerCase().includes('demo') || 
                                   nft.metadata.name.toLowerCase().includes('example')));
                                   
          return hasRequiredData && !isDemoOrExample;
        });
        
        const newNFTs = realNFTs.filter(nft => 
          !this.nfts.some(existingNft => existingNft.id === nft.id)
        );
        
        if (newNFTs.length > 0) {
          console.log(`Found ${newNFTs.length} new real NFTs from server`);
          
          // Add to our list
          this.nfts = [...newNFTs, ...this.nfts];
          
          // Notify listeners
          newNFTs.forEach(nft => this.notifyListeners(nft));
          
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error("Error refreshing real NFTs:", error);
      return false;
    }
  }

  cleanup() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.listeners = [];
  }
}

// Create a singleton instance
const nftService = new NFTService();
export default nftService; 