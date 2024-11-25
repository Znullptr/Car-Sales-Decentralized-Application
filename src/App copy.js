import React, { useEffect, useState } from 'react';
import Web3 from 'web3';
import './App.css';


const App = () => {
  const [account, setAccount] = useState('');

  useEffect(() => {
    async function loadWeb3() {
      if (window.ethereum) {
        const web3 = new Web3(window.ethereum);
        try {
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          const accounts = await web3.eth.getAccounts();
          setAccount(accounts[0]);
        } catch (error) {
          console.error("Error connecting to MetaMask", error);
        }
      } else {
        console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
      }
    }
    loadWeb3();
  }, []);

  return (
    <div>
      <header>
      <h1 className="title">Car Sales DApp</h1>
      </header>
      <p className="account-button">
        My Account Address:
      </p>
      <p>{account}</p> 
      <div className='button-container1'>
      <button className="create-button" >
        Create Car
      </button>
      <div className="disconnect-container">
        <button className="disconnect-button">Disconnect</button>
      </div>
      </div>


      <div className="cars-container">
              <h1>My Cars</h1>
              <p>Here you will see a list of cars owned by you.</p>
              <div className="car-container">
                <div className="car-details-container">
                  <p className="detail">VIN : </p>
                  <p className="detail">Model : </p>
                  <p className="detail"> Price : </p>
                </div>
                <div className="button-container1">
                  <button className="show-button">Show History</button>
                  <button className="sell-button">Sell</button>
                </div>
              </div>
      </div>

    </div>
  );
};

export default App;
