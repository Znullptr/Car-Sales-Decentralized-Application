import React, { useEffect, useState } from 'react';
import Web3 from 'web3';
import { ethers } from "ethers";
import CarFactory from './contracts/CarFactory.json'; // L'ABI du contrat
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import CreateCarForm from './Form'; // Composant pour la page du formulaire
import './App.css';

const App = () => {
  const [account, setAccount] = useState('');
  const [carFactory, setCarFactory] = useState(null);
  const [web3, setWeb3] = useState(null);
  const [isConnected, setIsConnected] = useState(false); // Track connection state


  // Fonction pour obtenir les détails d'une voiture
  const getCarDetails = async (vin) => {
    if (carFactory) {
      try {
        const details = await carFactory.methods.getCarDetails(vin).call();
        return details;
      } catch (error) {
        console.error('Erreur lors de la récupération des détails de la voiture', error);
      }
    }
  };

  // Fonction pour créer une nouvelle voiture
  const createCar = async (vin, model, owner, imageURL, price) => {
    if (carFactory) {
      try {
        await carFactory.methods.createCar(vin, model, owner, imageURL, price).send({ from: account });
        alert('Car created successfully!');
      } catch (error) {
        console.error('Erreur lors de la création de la voiture', error);
      }
    }
  };

  const buyCar = async (vin, price) => {
    if (carFactory) {
        try {
            const parsedPrice = parseFloat(price)/3400+0.0001;
            const priceInWei = web3.utils.toWei(parsedPrice.toString(), "ether");
            await carFactory.methods.buyCar(vin).send({ from: account, value: priceInWei });
            alert('Car purchased successfully!');
        } catch (error) {
            console.error('Error buying the car:', error);
            alert('Failed to purchase the car.');
        }
    }
};


  const getAllCars = async () => {
    if (carFactory) {
      try {
        const cars = await carFactory.methods.getAllCars().call({ from: account });
        console.log("Fetched Cars: ", cars);
        return cars;
      } catch (error) {
        console.error('Erreur lors de la récuperation des voitures', error);
      }
    }
  };

  const showHistory = async (vin) => {
    if (carFactory) {
      try {
        const owners = await carFactory.methods.getOwnershipHistory(vin).call({ from: account });
        console.log("owners: ", owners);
        return owners;
      } catch (error) {
        console.error('Erreur lors de la récuperation des propriétaires', error);
      }
    }
  };

  const connect = async () => {
    if (window.ethereum) {
      try {
        // Request wallet connection (permission)
        await window.ethereum.request({
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }],
        });
  
        // Request accounts and check if user is connected
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });
  
        if (accounts.length > 0) {
          // If connected, initialize Web3
          const web3Instance = new Web3(window.ethereum);
          setAccount(accounts[0]);
          setIsConnected(true);
  
          // Load the contract
          const networkId = await web3Instance.eth.net.getId();
          const deployedNetwork = CarFactory.networks[networkId];
          if (deployedNetwork) {
            const carFactoryInstance = new web3Instance.eth.Contract(
              CarFactory.abi,
              deployedNetwork.address
            );
            setCarFactory(carFactoryInstance);
            setWeb3(web3Instance); // Now set web3Instance only after successful connection
          } else {
            console.error('Contract not deployed to detected network.');
          }
        } else {
          console.log('No accounts found.');
        }
      } catch (error) {
        console.error('Error connecting to MetaMask', error);
      }
    } else {
      console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
    }
  };

  const disconnect = () => {
    setAccount(''); // Reset the account state
    setIsConnected(false); // Set connection state to false
    setCarFactory(null); // Clear the contract instance
    setWeb3(null); // Clear Web3 instance
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home account={account} getCarDetails={getCarDetails} getAllCars={getAllCars} buyCar={buyCar} showHistory={showHistory} isConnected={isConnected} connect={connect} disconnect={disconnect} />} />
        <Route path="/create-car" element={<CreateCarForm account={account} createCar={createCar} />} />
      </Routes>
    </Router>
  );
};

const Home = ({ account, getCarDetails, buyCar, getAllCars, showHistory, isConnected, connect, disconnect }) => {
  const navigate = useNavigate();
  const [carDetailsList, setCarDetailsList] = useState([]);
  const [not_found, setNotFound] = useState(0);
  const [history, setHistory] = useState({});
  const [isHistoryVisible, setIsHistoryVisible] = useState({});

  // Fetch all cars when the component loads
  useEffect(() => {
    const fetchMyCars = async () => {
      try {
        if (!isConnected) {
          setNotFound(1);
        } else {
          setNotFound(0);
        }

        // Fetch all cars 
        const cars = await getAllCars();
        console.info('Fetched Cars:', cars);

        if (!cars || cars.length === 0) {
          setNotFound(1);
          return;
        }

        const carDetailsPromises = cars.map((carVin) =>
          getCarDetails(carVin).then((details) => ({
            vin: carVin,
            details,
          }))
        );

        const allCarDetails = await Promise.all(carDetailsPromises);
        setCarDetailsList(allCarDetails);
      } catch (error) {
        console.error('Error fetching cars or their details:', error);
      }
    };

    fetchMyCars();
  }, [account, getAllCars, getCarDetails, isConnected]);

  const formatAddress = (address) => address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';

  const handleShowHistory = async (vin) => {
    const owners = await showHistory(vin);
    if (owners && owners.length > 0) {
      setHistory((prevHistory) => ({ ...prevHistory, [vin]: owners }));
    } else {
      setHistory((prevHistory) => ({ ...prevHistory, [vin]: [] }));
    }
  };

  const handleBuyCar= async(vin,price) => {
    await buyCar(vin,price);
    const cars = await getAllCars();
    console.info('Fetched Cars:', cars);

    if (!cars || cars.length === 0) {
      setNotFound(1);
      return;
    }

    const carDetailsPromises = cars.map((carVin) =>
      getCarDetails(carVin).then((details) => ({
        vin: carVin,
        details,
      }))
    );

    const allCarDetails = await Promise.all(carDetailsPromises);
    setCarDetailsList(allCarDetails);
  }

  const toggleHistoryVisibility = (vin) => {
    setIsHistoryVisible((prevState) => ({ ...prevState, [vin]: !prevState[vin] }));
    if (!isHistoryVisible[vin]) {
      handleShowHistory(vin);
    } else {
      setHistory((prevHistory) => ({ ...prevHistory, [vin]: [] }));
    }
  };

  return (
    <div>
      <header>
        <h1 className="title">Car Sales DApp</h1>
      </header>
      <p className="account-button">My Account Address:</p>
      <p>{account}</p>

      <div className="button-container">
        <button className="create-button" onClick={() => navigate('/create-car')}>
          Create Car
        </button>
        {isConnected ? (
          <button className="disconnect-button" onClick={disconnect}>
            Disconnect
          </button>
        ) : (
          <button className="connect-button" onClick={connect}>
            Connect Wallet
          </button>
        )}
      </div>

      {not_found === 0 ? (
        <div className="car-sections">
          {/* Owned Cars Section */}
          <div className="my-cars-section">
            <h2>My Cars</h2>
            <div className="car-grid">
              {carDetailsList
                .filter((car) => account.toLowerCase() === (car.details[2]).toLowerCase())
                .map((car, index) => (
                  <div key={index} className="car-card">
                    <div className="image-container">
                      <a href={car.details[3]} target="_blank" rel="noopener noreferrer">
                        <img src={car.details[3]} alt={`Car ${car.details[1]}`} className="car-image" />
                      </a>
                    </div>
                    <p>VIN: {car.details[0]}</p>
                    <p>Model: {car.details[1]}</p>
                    <p>Price: {ethers.formatUnits(car.details[4].toString(), 6)} $</p>
                      <button className="history-button" onClick={() => toggleHistoryVisibility(car.details[0])}>
                        {isHistoryVisible[car.details[0]] ? "Hide History" : "Show History"}
                      </button>
                    {isHistoryVisible[car.details[0]] && history[car.details[0]] && (
                      <div className="history-container">
                        <h4>Ownership History:</h4>
                        <ul>
                          {history[car.details[0]].map((owner, ownerIndex) => (
                            <li key={ownerIndex}>{formatAddress(owner)}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>

          {/* Available Cars Section */}
          <div className="available-cars-section">
            <h2>Available Cars</h2>
            <div className="car-grid">
              {carDetailsList
                .filter((car) => account.toLowerCase() !== (car.details[2]).toLowerCase())
                .map((car, index) => (
                  <div key={index} className="car-card">
                    <div className="image-container">
                      <a href={car.details[3]} target="_blank" rel="noopener noreferrer">
                        <img src={car.details[3]} alt={`Car ${car.details[1]}`} className="car-image" />
                      </a>
                    </div>
                    <p>VIN: {car.details[0]}</p>
                    <p>Model: {car.details[1]}</p>
                    <p>Price: {ethers.formatUnits(car.details[4].toString(), 6)} $</p>
                    <div className="car-actions">
                      <button className="history-button" onClick={() => toggleHistoryVisibility(car.details[0])}>
                        {isHistoryVisible[car.details[0]] ? "Hide History" : "Show History"}
                      </button>
                      <button className="buy-button" onClick={() => handleBuyCar(car.details[0],ethers.formatUnits(car.details[4].toString(), 6))}>Buy</button>
                    </div>
                    {isHistoryVisible[car.details[0]] && history[car.details[0]] && (
                      <div className="history-container">
                        <h4>Ownership History:</h4>
                        <ul>
                          {history[car.details[0]].map((owner, ownerIndex) => (
                            <li key={ownerIndex}>{formatAddress(owner)}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      ) : (
        <p>No cars found.</p>
      )}
    </div>
  );
};


export default App;
