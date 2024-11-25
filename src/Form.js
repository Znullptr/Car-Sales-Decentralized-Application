import React, { useState } from 'react';
import Web3 from 'web3';
import { ethers } from 'ethers';
import './Form.css';

const CreateCarForm = ({ createCar, account}) => {
  const [vin, setVin] = useState('');
  const [model, setModel] = useState('');
  const [image, setImage] = useState('');
  const [price, setPrice] = useState('');


  const handleSubmit = async (event) => {
    event.preventDefault();
    const parsedPrice = parseFloat(price);
    // Convert price to wei or any other desired unit using ethers (in this case, 10^6 micro-units)
    const formattedPrice = parsedPrice * (10 ** 6);
    createCar(vin, model, account, image, formattedPrice.toString());
};

  return (
  <div className="form-container">
  <h2>Create a New Car</h2>
  <form className="car-form" onSubmit={handleSubmit}>
    <div className="form-group">
      <label>VIN:</label>
      <input
        type="text"
        value={vin}
        onChange={(e) => setVin(e.target.value)}
        required
      />
    </div>
    <div className="form-group">
      <label>Model:</label>
      <input
        type="text"
        value={model}
        onChange={(e) => setModel(e.target.value)}
        required
      />
    </div>
    <div className="form-group">
      <label>Image URL:</label>
      <input
        type="text"
        value={image}
        onChange={(e) => setImage(e.target.value)}
        required
      />
    </div>
    <div className="form-group">
      <label>Price:</label>
      <input
        type="text"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        required
      />
    </div>
    <button type="submit" className="submit-btn">Create</button>
  </form>
</div>

  );
};

export default CreateCarForm;
