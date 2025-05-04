import React, { useState } from 'react';
import nftService from '../services/nftService';

const ContractSubscriber = () => {
  const [collectionAddress, setCollectionAddress] = useState('');
  const [subscriptions, setSubscriptions] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Popular Solana NFT collections
  const popularCollections = [
    { name: 'Solana Monkey Business', address: 'SMBtHCCC6RYRutFEPb4qZUX8JB2EPdMQaA8LorrLgmz' },
    { name: 'DeGods', address: '6XxjKYFbcndh2gDcsUrmZgVEsoDxXMnfsaGY6fpTJzNr' },
    { name: 'Okay Bears', address: '3saAedkM9o5g1u5DCqsuMZuC4GRqPB4TuMkvSsSVvGQ3' },
    { name: 'Aurory', address: '6bNVn7vwQeJ19wKbEkosR6V4QK8T7dSDHKqvz3S1j3vG' },
    { name: 'Claynosaurz', address: 'A7p8451ktDCHq5yYaHczeLMYsjRsAkzc3hCXcSrwYHU7' },
    { name: 'Famous Fox Federation', address: 'Ffar8dFQpNALSqZVBvY4bHkg9PpDJBGQkrLH9mUCTM2S' }
  ];
  
  const handleAddressChange = (e) => {
    setCollectionAddress(e.target.value);
    setError('');
    setSuccess('');
  };
  
  const subscribeToCollection = async (address) => {
    if (!address) {
      setError('Please enter a collection address');
      return;
    }
    
    // Basic validation for Solana address format
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) {
      setError('Invalid Solana address format');
      return;
    }
    
    // Check if already subscribed
    if (subscriptions.includes(address)) {
      setError(`Already subscribed to ${address}`);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await nftService.subscribeToNFTCollection(address);
      
      if (result) {
        setSubscriptions(prev => [...prev, address]);
        setCollectionAddress('');
        setSuccess(`Successfully subscribed to collection!`);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(`Failed to subscribe to collection`);
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    subscribeToCollection(collectionAddress);
  };
  
  return (
    <div className="card mb-4">
      <div className="card-header bg-gradient" style={{ background: 'linear-gradient(90deg, #9945FF, #14F195)', color: 'white' }}>
        <h5 className="mb-0">Track Solana NFT Collection</h5>
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="collectionAddress" className="form-label">Collection Address or Creator</label>
            <div className="input-group">
              <input 
                type="text" 
                className="form-control" 
                id="collectionAddress"
                value={collectionAddress}
                onChange={handleAddressChange}
                placeholder="Enter Solana address..."
                disabled={isLoading}
              />
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Loading...
                  </>
                ) : 'Subscribe'}
              </button>
            </div>
            {error && <div className="alert alert-danger mt-2 py-2 small">{error}</div>}
            {success && <div className="alert alert-success mt-2 py-2 small">{success}</div>}
          </div>
        </form>
        
        {subscriptions.length > 0 && (
          <div className="mt-3">
            <h6>Subscribed Collections:</h6>
            <ul className="list-group">
              {subscriptions.map((address, index) => (
                <li key={index} className="list-group-item small text-truncate d-flex align-items-center">
                  <span className="badge bg-success me-2">Active</span>
                  <a 
                    href={`https://explorer.solana.com/address/${address}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-truncate"
                  >
                    {address}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="mt-4">
          <h6>Popular Solana NFT Collections:</h6>
          <div className="row">
            {popularCollections.map((collection, index) => (
              <div key={index} className="col-md-6 mb-2">
                <button
                  className="btn btn-sm btn-outline-secondary w-100 text-start"
                  onClick={() => subscribeToCollection(collection.address)}
                  disabled={isLoading || subscriptions.includes(collection.address)}
                >
                  <span className="d-block">{collection.name}</span>
                  <small className="text-muted text-truncate d-block">{collection.address}</small>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractSubscriber; 