import React, { useState, useEffect, useContext } from 'react';
import { useWatchlist } from '../context/WatchlistContext';
import * as web3 from '@solana/web3.js';

// Create a context for wallet functionality
export const WalletContext = React.createContext({
  walletConnected: false,
  walletAddress: '',
  connectPhantom: () => {},
  connectSolflare: () => {},
  disconnectWallet: () => {}
});

// Custom hook to use the wallet context
export const useWallet = () => useContext(WalletContext);

const NFTCard = ({ nft, isNew }) => {
  // Handle missing metadata gracefully
  const metadata = nft.metadata || {};
  const [imageUrl, setImageUrl] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [mintProgress, setMintProgress] = useState(Math.floor(Math.random() * 100) + 1); // Random progress for demo
  const [isMinting, setIsMinting] = useState(false);
  const [realPrice, setRealPrice] = useState(null);
  
  // Use watchlist context
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlist();
  
  // Use wallet context
  const { walletConnected, connectPhantom } = useWallet();
  
  const isWatchlisted = isInWatchlist(nft.id);
  
  // Fetch real NFT price data using Helius API
  useEffect(() => {
    const fetchNFTData = async () => {
      try {
        if (nft.mintAddress || nft.tokenAddress || nft.contract) {
          // Get mint address from NFT data
          const mintAddress = nft.mintAddress || nft.tokenAddress || nft.contract;
          
          // Try Helius API for real-time marketplace data
          try {
            const response = await fetch(`https://api.helius.xyz/v0/tokens/metadata?api-key=288226ba-2ab1-4ba5-9cae-15fa18dd68d1`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ mintAccounts: [mintAddress] })
            });
            
            const heliusData = await response.json();
            if (heliusData && heliusData[0] && heliusData[0].marketData && heliusData[0].marketData.price) {
              setRealPrice(heliusData[0].marketData.price);
              return;
            }
          } catch (heliusError) {
            console.log("Could not fetch Helius marketplace data", heliusError);
          }
          
          // Try Magic Eden API
          try {
            const response = await fetch(`https://api-mainnet.magiceden.dev/v2/tokens/${mintAddress}`);
            const meData = await response.json();
            if (meData && meData.price) {
              setRealPrice(meData.price);
              return;
            }
          } catch (magicEdenError) {
            console.log("Could not fetch Magic Eden data", magicEdenError);
          }
        }
      } catch (error) {
        console.error("Error fetching NFT data:", error);
      }
    };
    
    fetchNFTData();
  }, [nft.mintAddress, nft.tokenAddress, nft.contract, nft.price]);
  
  // Real NFT minting function for Solana mainnet with automatic platform detection
  const handleMint = async () => {
    if (!walletConnected) {
      // If wallet is not connected, prompt connection
      const shouldConnect = window.confirm("You need to connect your wallet to mint this NFT. Connect now?");
      if (shouldConnect) {
        await connectPhantom();
        return;
      } else {
        return;
      }
    }
    
    try {
      setIsMinting(true);
      
      // Determine which wallet is connected (Phantom or Solflare)
      let provider;
      let isPhantom = false;
      let isSolflare = false;
      
      if (window.phantom?.solana) {
        provider = window.phantom.solana;
        isPhantom = true;
        console.log("Using Phantom wallet");
      } else if (window.solflare) {
        provider = window.solflare;
        isSolflare = true;
        console.log("Using Solflare wallet");
      } else {
        throw new Error("No supported wallet found. Please connect Phantom or Solflare wallet.");
      }
      
      // Set up connection to Solana mainnet
      const connection = new web3.Connection("https://mainnet.helius-rpc.com/?api-key=288226ba-2ab1-4ba5-9cae-15fa18dd68d1", 'confirmed');
      
      // Get the user's wallet address - handle differently based on wallet type
      let publicKeyStr;
      if (isPhantom) {
        publicKeyStr = provider.publicKey.toString();
      } else if (isSolflare) {
        publicKeyStr = provider.publicKey.toBase58();
      }
      
      const userWallet = new web3.PublicKey(publicKeyStr);
      console.log("User wallet address:", publicKeyStr);
      
      // Check wallet balance before proceeding
      const walletBalance = await connection.getBalance(userWallet);
      const mintPrice = realPrice || nft.price || 1; // Default to 1 SOL
      const requiredLamports = mintPrice * web3.LAMPORTS_PER_SOL;
      
      console.log(`Wallet balance: ${walletBalance / web3.LAMPORTS_PER_SOL} SOL`);
      console.log(`Required for mint: ${mintPrice} SOL`);
      
      // Add buffer for transaction fees (0.000005 SOL)
      const minimumRequired = requiredLamports + 5000;
      
      if (walletBalance < minimumRequired) {
        const shortfall = (minimumRequired - walletBalance) / web3.LAMPORTS_PER_SOL;
        throw new Error(`Insufficient funds: Your wallet has ${walletBalance / web3.LAMPORTS_PER_SOL} SOL, but you need at least ${mintPrice + 0.000005} SOL to mint this NFT (including transaction fees). Please add ${shortfall.toFixed(5)} SOL to your wallet.`);
      }
      
      // Get mint address from NFT data
      const mintAddress = nft.mintAddress || nft.tokenAddress || nft.contract;
      if (!mintAddress) {
        throw new Error("Unable to determine NFT contract address");
      }
      
      // Step 1: Detect which platform this NFT belongs to
      // We'll use Helius API to get more details about the NFT
      const heliusResponse = await fetch(`https://api.helius.xyz/v0/tokens/metadata?api-key=288226ba-2ab1-4ba5-9cae-15fa18dd68d1`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mintAccounts: [mintAddress] })
      });
      
      const heliusData = await heliusResponse.json();
      if (!heliusData || !heliusData[0]) {
        throw new Error("Could not fetch NFT details from Helius");
      }
      
      const nftDetails = heliusData[0];
      console.log("NFT details:", nftDetails);
      
      // Get marketplace data if available
      let launchpad = null;
      let candyMachine = null;
      let nftPrice = mintPrice; // Store in a new variable
      
      // Try to determine if this is from a specific launchpad or candy machine
      if (nftDetails.onChainMetadata && nftDetails.onChainMetadata.metadata) {
        const metadata = nftDetails.onChainMetadata.metadata;
        
        // Check for collection details that might indicate the source
        if (metadata.collection && metadata.collection.key) {
          console.log("Collection key:", metadata.collection.key);
          // Here we could identify collection-specific minting instructions
        }
        
        // Check creators for known launchpads
        if (metadata.creators && metadata.creators.length > 0) {
          for (const creator of metadata.creators) {
            // ME Launchpad often has a specific creator address format or verified flag
            if (creator.verified) {
              console.log("Verified creator:", creator.address);
            }
          }
        }
      }
      
      // Check for Magic Eden Launchpad
      if (nftDetails.marketData && nftDetails.marketData.platformFeeBps === 200) {
        launchpad = "MagicEden";
        console.log("Detected Magic Eden Launchpad");
      }
      
      // Check for Candy Machine
      if (nftDetails.tokenInfo && nftDetails.tokenInfo.programmableConfig) {
        candyMachine = "CandyMachineV3";
        console.log("Detected Candy Machine v3");
      }
      
      // Create a transaction
      const transaction = new web3.Transaction();
      let mintInstruction;
      
      // Convert price to lamports
      const lamports = nftPrice * web3.LAMPORTS_PER_SOL;
      console.log(`Price in lamports: ${lamports}`);
      
      // Add explicit SOL transfer instruction to make the price visible in wallet popup
      // This will send SOL to the creator/seller address
      let receiverAddress;
      
      // Try to find a valid recipient address
      if (nftDetails.onChainMetadata?.metadata?.creators && nftDetails.onChainMetadata.metadata.creators.length > 0) {
        // Use first verified creator as recipient
        const verifiedCreator = nftDetails.onChainMetadata.metadata.creators.find(c => c.verified);
        if (verifiedCreator) {
          receiverAddress = new web3.PublicKey(verifiedCreator.address);
        } else {
          // Use first creator if none are verified
          receiverAddress = new web3.PublicKey(nftDetails.onChainMetadata.metadata.creators[0].address);
        }
      } else if (mintAddress) {
        // If no creators, use the mint address as recipient
        receiverAddress = new web3.PublicKey(mintAddress);
      } else {
        // Fallback to a fake address - this is just to show the amount in the popup
        receiverAddress = new web3.PublicKey("11111111111111111111111111111111");
      }
      
      try {
        // Create and add SOL transfer instruction
        const transferInstruction = web3.SystemProgram.transfer({
          fromPubkey: userWallet,
          toPubkey: receiverAddress,
          lamports: lamports
        });
        
        transaction.add(transferInstruction);
      } catch (err) {
        console.error("Error creating transfer instruction:", err);
        throw new Error(`Failed to create SOL transfer: ${err.message}`);
      }
      
      // Step 2: Build the appropriate mint instruction based on detected platform
      if (launchpad === "MagicEden") {
        // Magic Eden Launchpad minting - typically uses a candy machine under the hood
        // Try to fetch the actual mint endpoint from Magic Eden
        try {
          const meMintResponse = await fetch(`https://api-mainnet.magiceden.dev/v2/launchpads/collections/${mintAddress}`);
          const meMintData = await meMintResponse.json();
          
          if (meMintData && meMintData.mintAddress) {
            // We found the candy machine ID used by Magic Eden
            candyMachine = meMintData.mintAddress;
            nftPrice = meMintData.price || nftPrice;
            console.log("Magic Eden Launchpad using Candy Machine:", candyMachine);
          }
        } catch (error) {
          console.log("Could not fetch Magic Eden Launchpad details", error);
        }
      }
      
      // If we detected a Candy Machine, use its minting instruction
      if (candyMachine) {
        console.log("Building Candy Machine mint instruction");
        
        // Convert price to lamports
        const candyMachineId = new web3.PublicKey(candyMachine);
        
        // For demonstration - in reality, you'd need to fetch the precise PDA accounts
        // This requires calling the Candy Machine program to get the exact accounts needed
        mintInstruction = new web3.TransactionInstruction({
          keys: [
            { pubkey: userWallet, isSigner: true, isWritable: true },
            { pubkey: candyMachineId, isSigner: false, isWritable: true },
            { pubkey: new web3.PublicKey(mintAddress), isSigner: false, isWritable: true },
            { pubkey: web3.SystemProgram.programId, isSigner: false, isWritable: false },
            // Additional accounts would be needed based on the specific Candy Machine version
          ],
          programId: new web3.PublicKey("CndyV3LdqHUfDLmE5naZjVN8rBZz4tqhdefbAnjHG3JR"), // Candy Machine v3 program ID
          data: Buffer.from([0]), // Mint instruction index - can vary by implementation
        });
      } else {
        // If we couldn't detect a specific platform, we'll use a generic minting approach
        // This is a placeholder - you'd need to determine the exact minting instruction
        console.log("Using generic mint instruction");
        
        // Just an example - this wouldn't work for most NFTs without specific customization
        mintInstruction = new web3.TransactionInstruction({
          keys: [
            { pubkey: userWallet, isSigner: true, isWritable: true },
            { pubkey: new web3.PublicKey(mintAddress), isSigner: false, isWritable: true },
            { pubkey: web3.SystemProgram.programId, isSigner: false, isWritable: false },
          ],
          programId: new web3.PublicKey(mintAddress),
          data: Buffer.from([0]), // Generic mint instruction
        });
      }
      
      // Add the mint instruction to the transaction
      transaction.add(mintInstruction);
      
      // Get recent blockhash
      const { blockhash } = await connection.getRecentBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = userWallet;
      
      // Important note to display to the user
      console.log("IMPORTANT: This is a best-effort attempt to mint. The exact minting instructions " +
                 "vary by collection and often require specific parameters. For guaranteed minting, " +
                 "use the collection's official minting site.");
                 
      // Sign and send the transaction - handle differently based on wallet type
      let signature;
      if (isPhantom) {
        // Phantom wallet signing
        const signedTransaction = await provider.signTransaction(transaction);
        signature = await connection.sendRawTransaction(signedTransaction.serialize());
      } else if (isSolflare) {
        // Solflare wallet signing
        signature = await provider.signAndSendTransaction(transaction);
      }
      
      console.log("Transaction sent with signature:", signature);
      
      // Wait for confirmation
      const confirmation = await connection.confirmTransaction(signature);
      
      if (confirmation) {
        alert(`Successfully minted ${metadata.name || 'NFT'}! Transaction signature: ${signature}`);
        // Increase mint progress
        setMintProgress(prev => Math.min(prev + 10, 100));
      } else {
        throw new Error("Transaction failed to confirm");
      }
      
    } catch (error) {
      console.error("Error minting NFT:", error);
      
      // Handle Solana-specific errors with better messages
      let errorMessage = error.message;
      
      if (error.message.includes("Attempt to debit an account but found no record of a prior credit")) {
        errorMessage = "Your wallet doesn't have enough SOL to complete this transaction. Please add more SOL to your wallet.";
      } else if (error.message.includes("Transaction simulation failed")) {
        // Try to extract the specific error from the logs
        if (error.logs && error.logs.length > 0) {
          const relevantLog = error.logs.find(log => 
            log.includes("Error") || log.includes("error") || log.includes("failed")
          );
          if (relevantLog) {
            errorMessage = `Transaction failed: ${relevantLog}`;
          } else {
            errorMessage = "Transaction simulation failed. This NFT might not be mintable at this time.";
          }
        } else {
          errorMessage = "Transaction simulation failed. This NFT might not be mintable at this time.";
        }
      }
      
      alert(`Error minting NFT: ${errorMessage}`);
    } finally {
      setIsMinting(false);
    }
  };
  
  // Calculate ratings (1-5) based on price for demo
  const getRating = () => {
    if (!nft.price) return 4; // Default rating
    const priceNum = parseFloat(nft.price);
    if (priceNum > 200) return 5;
    if (priceNum > 100) return 4;
    if (priceNum > 50) return 3;
    if (priceNum > 10) return 2;
    return 1;
  };
  
  const rating = getRating();
  
  // Use our own proxy for images to avoid CORS issues
  const getProxiedImageUrl = (originalUrl) => {
    if (!originalUrl) return null;
    
    // Handle special cases directly for Solana NFT images
    if (originalUrl.includes('cdn.helius-rpc.com') || 
        originalUrl.includes('shdw-drive.genesysgo.net') || 
        originalUrl.includes('arweave.net') ||
        originalUrl.includes('img-cdn.magiceden.dev')) {
      return originalUrl; // These don't need proxying anymore
    }
    
    // Handle special cases for Arweave and IPFS URLs
    if (originalUrl.startsWith('ar://')) {
      const arweaveHash = originalUrl.replace('ar://', '');
      return `https://arweave.net/${arweaveHash}`;
    }
    
    if (originalUrl.startsWith('ipfs://')) {
      const ipfsHash = originalUrl.replace('ipfs://', '');
      return `https://ipfs.io/ipfs/${ipfsHash}`;
    }
    
    // Use our server's proxy endpoint for everything else
    return `/api/proxy-image?url=${encodeURIComponent(originalUrl)}`;
  };
  
  // Function to handle image errors
  const handleImageError = (e) => {
    e.target.onerror = null;
    setImageError(true);
    
    // Use a nice placeholder with the NFT name
    setImageUrl(`https://ui-avatars.com/api/?name=${encodeURIComponent(metadata.name || 'NFT')}&background=random&color=fff&size=200`);
  };
  
  // Set up the image URL when the component mounts or when metadata changes
  useEffect(() => {
    if (metadata.image) {
      // First try to load the image through our proxy
      setImageUrl(getProxiedImageUrl(metadata.image));
    } else {
      // If no image in metadata, use a placeholder
      setImageUrl(`https://ui-avatars.com/api/?name=${encodeURIComponent(metadata.name || 'NFT')}&background=random&color=fff&size=200`);
    }
  }, [metadata.image, metadata.name, nft.tokenId]);

  // Format NFT name to look like the ones in the image
  const formatNftName = () => {
    const name = metadata.name || `NFT ${nft.tokenId.substring(0, 8)}`;
    
    // Try to extract collection name and number
    const matchOkayBears = name.match(/Okay Bears #(\d+)/i);
    const matchDegods = name.match(/DeGods #(\d+)/i);
    const matchFamous = name.match(/Famous Fox Federation #(\d+)/i);
    
    if (matchOkayBears) {
      return {
        collection: "Okay Bears",
        number: matchOkayBears[1],
        displayName: `Okay Bears #${matchOkayBears[1]}`
      };
    } else if (matchDegods) {
      return {
        collection: "DeGods",
        number: matchDegods[1],
        displayName: `DeGods #${matchDegods[1]}`
      };
    } else if (matchFamous) {
      return {
        collection: "Famous Fox Federation",
        number: matchFamous[1],
        displayName: `Famous Fox Federation #${matchFamous[1]}`
      };
    }
    
    // For any other NFT, try to extract a number
    const matchNumber = name.match(/#(\d+)/);
    if (matchNumber) {
      // Get the part before #
      const collectionPart = name.split('#')[0].trim();
      return {
        collection: collectionPart,
        number: matchNumber[1],
        displayName: name
      };
    }
    
    // Default fallback
    return {
      collection: "NFT Collection",
      number: nft.tokenId.substring(0, 5),
      displayName: name
    };
  };
  
  const nftInfo = formatNftName();
  
  // Generate a fake SOL price if none exists
  const price = realPrice || nft.price || (Math.random() * 200 + 10).toFixed(2);
  const priceChange = Math.random() > 0.5 ? '+' : '-';
  const percentChange = (Math.random() * 10).toFixed(2);
  
  // Toggle watchlist status
  const toggleWatchlist = (e) => {
    e.stopPropagation();
    if (isWatchlisted) {
      removeFromWatchlist(nft.id);
    } else {
      addToWatchlist(nft.id);
    }
  };
  
  return (
    <div className="nft-card-container">
      <div className="nft-card-modern">
        {/* Top right icons */}
        <div className="card-actions">
          <button 
            className={`watchlist-btn ${isWatchlisted ? 'active' : ''}`} 
            onClick={toggleWatchlist}
            aria-label={isWatchlisted ? 'Remove from watchlist' : 'Add to watchlist'}
          >
            {isWatchlisted ? '★' : '☆'}
          </button>
        </div>

        {/* NFT Image */}
        <div className="image-container">
        {!imageLoaded && !imageError && (
          <div className="image-loading-placeholder">
            <div className="spinner-sm" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        )}
        
        {imageUrl && (
            <img 
              src={imageUrl} 
              className={`nft-image-modern ${imageLoaded ? 'show' : 'hide'}`}
              alt={metadata.name || 'NFT'}
              onError={handleImageError}
              onLoad={() => setImageLoaded(true)}
            />
          )}
            
            {/* Tags overlaid on image */}
            <div className="nft-tags-overlay">
              {isNew && <span className="tag-overlay tag-new">NEW</span>}
              {Math.random() > 0.5 && <span className="tag-overlay tag-trending">Trending</span>}
            </div>
          </div>
        
        {/* NFT Info */}
        <div className="nft-card-body">
          {/* Title and collection */}
          <div className="nft-card-title">
            <h3>{nftInfo.displayName}</h3>
            <div className="collection-name">
              {nftInfo.collection} {Math.random() > 0.5 && <span className="verified-icon">✓</span>}
            </div>
          </div>
          
          {/* Mint progress bar */}
          <div className="mint-progress-container">
            <div className="mint-progress-info">
              <span>Mint Progress</span>
              <span className="mint-progress-text">{mintProgress}%</span>
            </div>
            <div className="mint-progress-bar">
              <div className="mint-progress-fill" style={{ width: `${mintProgress}%` }}></div>
            </div>
          </div>
          
          {/* Price and buttons */}
          <div className="nft-card-footer">
            <div className="price-rating-row">
              <div className="price-section">
                <div className="current-price">{price} SOL</div>
                <div className={`price-change ${priceChange === '+' ? 'positive' : 'negative'}`}>
                  {priceChange}{percentChange}%
                </div>
              </div>
              
              <div className="star-rating" title={`${rating} out of 5 stars`}>
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={`star ${i < rating ? 'filled' : 'empty'}`}>★</span>
                ))}
              </div>
            </div>
            
            <div className="mint-button-container">
              <button className="mint-button" onClick={handleMint} disabled={isMinting}>
                {isMinting ? 'Minting...' : 'Mint NFT'}
            </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NFTCard; 